import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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
  activeTab: 'production' | 'cutting' | 'packaging' | 'materials';
  production: TabData;
  cutting: TabData;
  packaging: TabData;
  materials: Material[];
}

type QuoteAction =
  | { type: 'SET_FIELD'; field: keyof QuoteState; value: any }
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

    case 'SET_TAB_FIELD':
      const updatedTab = { ...state[action.tab], [action.field]: action.value };
      const calculatedTab = calculateTabTotal(updatedTab);
      return { ...state, [action.tab]: calculatedTab };

    case 'ADD_MATERIAL':
      const calculatedMaterial = calculateMaterialTotal(action.material);
      return { ...state, materials: [...state.materials, calculatedMaterial] };

    case 'UPDATE_MATERIAL':
      const updatedMaterials = state.materials.map((material) =>
        material.id === action.materialId
          ? calculateMaterialTotal({ ...material, ...action.updates }, action.updates.pricePerUnit ? 'pricePerUnit' : undefined)
          : material
      );
      return { ...state, materials: updatedMaterials };

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
    quantity: number;
    totalMaterialPurchase: number;
    totalMaterialMargin: number;
    totalMaterialValue: number;
    productionCost: number;
    productionMargin: number;
    totalProductionValue: number;
  };
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  const getSummary = () => {
    const totalMaterialPurchase = state.materials.reduce((sum, m) => sum + m.purchasePrice * m.quantity, 0);
    const totalMaterialMargin = state.materials.reduce((sum, m) => sum + m.marginPln * m.quantity, 0);
    const totalMaterialValue = totalMaterialPurchase + totalMaterialMargin;
    
    const productionCost = state.production.price + state.cutting.price + state.packaging.price;
    const productionMargin = state.production.marginPln + state.cutting.marginPln + state.packaging.marginPln;
    const totalProductionValue = productionCost + productionMargin;

    return {
      quantity: state.minQuantity,
      totalMaterialPurchase,
      totalMaterialMargin,
      totalMaterialValue,
      productionCost,
      productionMargin,
      totalProductionValue,
    };
  };

  return (
    <QuoteContext.Provider value={{ state, dispatch, getSummary }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  return context;
}