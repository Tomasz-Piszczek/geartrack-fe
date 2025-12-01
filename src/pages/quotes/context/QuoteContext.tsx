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
  ignoreMinQuantity: boolean;
}

export interface ProductionActivity {
  id: string;
  name: string;
  workTimeHours: number;
  workTimeMinutes: number;
  price: number;
  marginPercent: number;
  marginPln: number;
  costPerHour: number;
  total: number;
  ignoreMinQuantity: boolean;
}

export interface QuoteState {
  documentNumber: string;
  contractorCode: string;
  contractorName: string;
  productCode: string;
  productName: string;
  minQuantity: number;
  totalQuantity: number;
  activeTab: 'production' | 'materials';
  productionActivities: ProductionActivity[];
  materials: Material[];
}

type QuoteAction =
  | { type: 'SET_FIELD'; field: keyof QuoteState; value: string | number }
  | { type: 'ADD_PRODUCTION_ACTIVITY'; activity: Omit<ProductionActivity, 'id' | 'costPerHour' | 'marginPln' | 'total'> }
  | { type: 'UPDATE_PRODUCTION_ACTIVITY'; activityId: string; updates: Partial<ProductionActivity> }
  | { type: 'UPDATE_PRODUCTION_ACTIVITY_COST_PER_HOUR'; activityId: string; costPerHour: number }
  | { type: 'REMOVE_PRODUCTION_ACTIVITY'; activityId: string }
  | { type: 'ADD_MATERIAL'; material: Material }
  | { type: 'UPDATE_MATERIAL'; materialId: string; updates: Partial<Material> }
  | { type: 'REMOVE_MATERIAL'; materialId: string }
  | { type: 'SET_ACTIVE_TAB'; tab: QuoteState['activeTab'] };

const initialState: QuoteState = {
  documentNumber: '',
  contractorCode: '',
  contractorName: '',
  productCode: '',
  productName: '',
  minQuantity: 1,
  totalQuantity: 1,
  activeTab: 'production',
  productionActivities: [{
    id: 'default',
    name: 'Produkcja',
    workTimeHours: 0,
    workTimeMinutes: 0,
    price: 0,
    marginPercent: 0,
    marginPln: 0,
    costPerHour: 0,
    total: 0,
    ignoreMinQuantity: false,
  }],
  materials: [],
};

const calculateActivityTotal = (activity: ProductionActivity, updateType?: 'costPerHour'): ProductionActivity => {
  const totalHours = activity.workTimeHours + activity.workTimeMinutes / 60;
  
  let costPerHour, price;
  
  if (updateType === 'costPerHour') {
    costPerHour = activity.costPerHour;
    price = totalHours > 0 ? costPerHour * totalHours : activity.price;
  } else {
    costPerHour = totalHours > 0 ? activity.price / totalHours : 0;
    price = activity.price;
  }
  
  const marginPln = (price * activity.marginPercent) / 100;
  const total = price + marginPln;

  return {
    ...activity,
    price,
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

    case 'ADD_PRODUCTION_ACTIVITY': {
      const newActivity: ProductionActivity = {
        ...action.activity,
        id: Date.now().toString(),
        costPerHour: 0,
        marginPln: 0,
        total: 0,
      };
      const calculatedActivity = calculateActivityTotal(newActivity);
      return { 
        ...state, 
        productionActivities: [...state.productionActivities, calculatedActivity] 
      };
    }

    case 'UPDATE_PRODUCTION_ACTIVITY': {
      const updatedActivities = state.productionActivities.map((activity) =>
        activity.id === action.activityId
          ? calculateActivityTotal({ ...activity, ...action.updates })
          : activity
      );
      return { ...state, productionActivities: updatedActivities };
    }

    case 'UPDATE_PRODUCTION_ACTIVITY_COST_PER_HOUR': {
      const updatedActivities = state.productionActivities.map((activity) =>
        activity.id === action.activityId
          ? calculateActivityTotal({ ...activity, costPerHour: action.costPerHour }, 'costPerHour')
          : activity
      );
      return { ...state, productionActivities: updatedActivities };
    }

    case 'REMOVE_PRODUCTION_ACTIVITY': {
      if (state.productionActivities.length <= 1) {
        return state;
      }
      return {
        ...state,
        productionActivities: state.productionActivities.filter((a) => a.id !== action.activityId),
      };
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
    materials: Array<{
      id: string;
      name: string;
      purchasePrice: number;
      margin: number;
      pricePerUnit: number;
      quantity: number;
      totalForMinQty: number;
      totalForTotalQty: number;
      ignoreMinQuantity: boolean;
    }>;
    totalMaterialPurchase: number;
    totalMaterialMargin: number;
    totalMaterialValue: number;
    totalMaterialValueForMinQty: number;
    totalMaterialValueForTotalQty: number;
    productionActivities: Array<{
      id: string;
      name: string;
      cost: number;
      margin: number;
      total: number;
      totalForMinQty: number;
      totalForTotalQty: number;
      ignoreMinQuantity: boolean;
    }>;
    totalProductionCost: number;
    totalProductionMargin: number;
    totalProductionValue: number;
    totalProductionValueForMinQty: number;
    totalProductionValueForTotalQty: number;
    pricePerUnit: number;
    priceForMinQty: number;
    priceForTotalQty: number;
  };
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  const getSummary = () => {
    const batchesForTotalQty = Math.ceil(state.totalQuantity / state.minQuantity);
    
    const materials = state.materials.map(material => {
      const purchasePrice = material.purchasePrice * material.quantity;
      const margin = material.marginPln * material.quantity;
      const pricePerUnit = material.pricePerUnit * material.quantity;
      
      const totalForMinQty = material.ignoreMinQuantity 
        ? pricePerUnit 
        : pricePerUnit * state.minQuantity;
      
      const totalForTotalQty = material.ignoreMinQuantity 
        ? pricePerUnit * batchesForTotalQty 
        : pricePerUnit * state.totalQuantity;
      
      return {
        id: material.id,
        name: material.name,
        purchasePrice: material.purchasePrice,
        margin: material.marginPln,
        pricePerUnit: material.pricePerUnit,
        quantity: material.quantity,
        totalForMinQty,
        totalForTotalQty,
        ignoreMinQuantity: material.ignoreMinQuantity,
      };
    });
    
    const totalMaterialPurchase = state.materials.reduce((sum, m) => sum + m.purchasePrice * m.quantity, 0);
    const totalMaterialMargin = state.materials.reduce((sum, m) => sum + m.marginPln * m.quantity, 0);
    const totalMaterialValue = totalMaterialPurchase + totalMaterialMargin;
    
    const totalMaterialValueForMinQty = materials.reduce((sum, m) => sum + m.totalForMinQty, 0);
    const totalMaterialValueForTotalQty = materials.reduce((sum, m) => sum + m.totalForTotalQty, 0);
    
    const productionActivities = state.productionActivities.map(activity => {
      const cost = activity.price;
      const margin = activity.marginPln;
      const total = activity.total;
      
      const totalForMinQty = activity.ignoreMinQuantity ? total : total * state.minQuantity;
      const totalForTotalQty = activity.ignoreMinQuantity 
        ? total * batchesForTotalQty 
        : total * state.totalQuantity;
      
      return {
        id: activity.id,
        name: activity.name,
        cost,
        margin,
        total,
        totalForMinQty,
        totalForTotalQty,
        ignoreMinQuantity: activity.ignoreMinQuantity,
      };
    });

    const totalProductionCost = state.productionActivities.reduce((sum, a) => sum + a.price, 0);
    const totalProductionMargin = state.productionActivities.reduce((sum, a) => sum + a.marginPln, 0);
    const totalProductionValue = totalProductionCost + totalProductionMargin;
    
    const totalProductionValueForMinQty = productionActivities.reduce((sum, a) => sum + a.totalForMinQty, 0);
    const totalProductionValueForTotalQty = productionActivities.reduce((sum, a) => sum + a.totalForTotalQty, 0);

    const pricePerUnit = totalMaterialValue + totalProductionValue;
    const priceForMinQty = totalMaterialValueForMinQty + totalProductionValueForMinQty;
    const priceForTotalQty = totalMaterialValueForTotalQty + totalProductionValueForTotalQty;

    return {
      minQuantity: state.minQuantity,
      totalQuantity: state.totalQuantity,
      materials,
      totalMaterialPurchase,
      totalMaterialMargin,
      totalMaterialValue,
      totalMaterialValueForMinQty,
      totalMaterialValueForTotalQty,
      productionActivities,
      totalProductionCost,
      totalProductionMargin,
      totalProductionValue,
      totalProductionValueForMinQty,
      totalProductionValueForTotalQty,
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

export function useQuote(): QuoteContextType {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}