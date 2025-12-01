import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

export interface Material {
  id: string;
  name: string;
  purchasePrice: number;
  marginPercent: number;
  marginPln: number;
  pricePerUnit: number;
  totalPrice: number;
  quantity: number;
}

export interface TabData {
  workTimeHours: number;
  workTimeMinutes: number;
  price: number;
  marginPercent: number;
  marginPln: number;
  costPerHour: number;
  total: number;
}

export interface QuoteState {
  documentNumber: string;
  contractorCode: string;
  contractorName: string;
  productCode: string;
  productName: string;
  minQuantity: number;
  totalQuantity: number;
  activeTab: 'production' | 'cutting' | 'packaging' | 'materials';
  production: TabData;
  cutting: TabData;
  packaging: TabData;
  materials: Material[];
}

type QuoteAction =
  | { type: 'SET_FIELD'; field: keyof QuoteState; value: string | number }
  | { type: 'SET_TAB_FIELD'; tab: 'production' | 'cutting' | 'packaging'; field: keyof TabData; value: number }
  | { type: 'ADD_MATERIAL'; material: Material }
  | { type: 'UPDATE_MATERIAL'; materialId: string; updates: Partial<Material> }
  | { type: 'REMOVE_MATERIAL'; materialId: string }
  | { type: 'SET_ACTIVE_TAB'; tab: QuoteState['activeTab'] };

const initialTabData: TabData = {
  workTimeHours: 0,
  workTimeMinutes: 0,
  price: 0,
  marginPercent: 0,
  marginPln: 0,
  costPerHour: 0,
  total: 0,
};

const initialState: QuoteState = {
  documentNumber: '',
  contractorCode: '',
  contractorName: '',
  productCode: '',
  productName: '',
  minQuantity: 1,
  totalQuantity: 1,
  activeTab: 'production',
  production: { ...initialTabData },
  cutting: { ...initialTabData },
  packaging: { ...initialTabData },
  materials: [],
};

const calculateTabTotal = (data: TabData): TabData => {
  const totalHours = data.workTimeHours + data.workTimeMinutes / 60;
  const costPerHour = totalHours > 0 ? data.price / totalHours : 0;
  const marginPln = (data.price * data.marginPercent) / 100;
  const total = data.price + marginPln;

  return {
    ...data,
    costPerHour,
    marginPln,
    total,
  };
};

const calculateMaterialTotal = (material: Material, updateType?: 'pricePerUnit'): Material => {
  let marginPln, pricePerUnit, marginPercent;
  
  if (updateType === 'pricePerUnit') {
    marginPln = material.pricePerUnit - material.purchasePrice;
    marginPercent = material.purchasePrice > 0 ? (marginPln / material.purchasePrice) * 100 : 0;
    pricePerUnit = material.pricePerUnit;
  } else {
    marginPln = (material.purchasePrice * material.marginPercent) / 100;
    pricePerUnit = material.purchasePrice + marginPln;
    marginPercent = material.marginPercent;
  }
  
  const totalPrice = pricePerUnit * material.quantity;

  return {
    ...material,
    marginPercent,
    marginPln,
    pricePerUnit,
    totalPrice,
  };
};

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_TAB_FIELD': {
      const updatedTab = { ...state[action.tab], [action.field]: action.value };
      const calculatedTab = calculateTabTotal(updatedTab);
      return { ...state, [action.tab]: calculatedTab };
    }

    case 'ADD_MATERIAL': {
      const calculatedMaterial = calculateMaterialTotal(action.material);
      return { ...state, materials: [...state.materials, calculatedMaterial] };
    }

    case 'UPDATE_MATERIAL': {
      const updatedMaterials = state.materials.map((material) =>
        material.id === action.materialId
          ? calculateMaterialTotal({ ...material, ...action.updates }, action.updates.pricePerUnit ? 'pricePerUnit' : undefined)
          : material
      );
      return { ...state, materials: updatedMaterials };
    }

    case 'REMOVE_MATERIAL':
      return {
        ...state,
        materials: state.materials.filter((m) => m.id !== action.materialId),
      };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };

    default:
      return state;
  }
}

interface QuoteContextType {
  state: QuoteState;
  dispatch: React.Dispatch<QuoteAction>;
  getSummary: () => {
    minQuantity: number;
    totalQuantity: number;
    totalMaterialPurchase: number;
    totalMaterialMargin: number;
    totalMaterialValue: number;
    totalMaterialValueForMinQty: number;
    productionCost: number;
    productionMargin: number;
    totalProductionValue: number;
    totalProductionValueForMinQty: number;
    packagingCost: number;
    packagingMargin: number;
    totalPackagingValue: number;
    totalPackagingValueForMinQty: number;
    cuttingCost: number;
    cuttingMargin: number;
    totalCuttingValue: number;
    pricePerUnit: number;
    priceForMinQty: number;
    priceForTotalQty: number;
  };
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  const getSummary = () => {
    const totalMaterialPurchase = state.materials.reduce((sum, m) => sum + m.purchasePrice * m.quantity, 0);
    const totalMaterialMargin = state.materials.reduce((sum, m) => sum + m.marginPln * m.quantity, 0);
    const totalMaterialValue = totalMaterialPurchase + totalMaterialMargin;
    const totalMaterialValueForMinQty = totalMaterialValue * state.minQuantity;
    
    const productionCost = state.production.price;
    const productionMargin = state.production.marginPln;
    const totalProductionValue = productionCost + productionMargin;
    const totalProductionValueForMinQty = totalProductionValue * state.minQuantity;
    
    const packagingCost = state.packaging.price;
    const packagingMargin = state.packaging.marginPln;
    const totalPackagingValue = packagingCost + packagingMargin;
    const totalPackagingValueForMinQty = totalPackagingValue * state.minQuantity;
    
    const cuttingCost = state.cutting.price;
    const cuttingMargin = state.cutting.marginPln;
    const totalCuttingValue = cuttingCost + cuttingMargin;

    const pricePerUnit = totalMaterialValue + totalProductionValue + totalPackagingValue + totalCuttingValue;
    const priceForMinQty = totalMaterialValueForMinQty + totalProductionValueForMinQty + totalPackagingValueForMinQty + totalCuttingValue;
    const priceForTotalQty = pricePerUnit * state.totalQuantity;

    return {
      minQuantity: state.minQuantity,
      totalQuantity: state.totalQuantity,
      totalMaterialPurchase,
      totalMaterialMargin,
      totalMaterialValue,
      totalMaterialValueForMinQty,
      productionCost,
      productionMargin,
      totalProductionValue,
      totalProductionValueForMinQty,
      packagingCost,
      packagingMargin,
      totalPackagingValue,
      totalPackagingValueForMinQty,
      cuttingCost,
      cuttingMargin,
      totalCuttingValue,
      pricePerUnit,
      priceForMinQty,
      priceForTotalQty,
    };
  };

  return (
    <QuoteContext.Provider value={{ state, dispatch, getSummary }}>
      {children}
    </QuoteContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuote(): QuoteContextType {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}