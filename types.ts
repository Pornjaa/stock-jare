
export enum CategoryType {
  ICE = 'น้ำแข็ง',
  SOFT_DRINK = 'น้ำอัดลม',
  ENERGY_DRINK = 'เครื่องดื่มบำรุงกำลัง',
  WATER = 'น้ำเปล่า',
  LIQUOR = 'เหล้า',
  BEER = 'เบียร์',
  CIGARETTE = 'บุหรี่',
  OTHERS = 'อื่นๆ'
}

export interface ProductEntry {
  id: string;
  timestamp: string;
  category: CategoryType;
  productName: string;
  quantity: number;
  totalPrice: number;
  isSynced?: boolean;
}

export interface IceDebtEntry {
  id: string;
  timestamp: string;
  previousDebt: number;
  deliveredBags: number;
  collectedBags: number;
  currentDebt: number;
  note: string;
  isSynced?: boolean;
}

export interface CustomerDebtEntry {
  id: string;
  timestamp: string;
  customerName: string;
  itemName: string;
  quantity: number;
  amount: number;
  isSynced?: boolean;
}

export interface CategoryInfo {
  type: CategoryType;
  description: string;
  imageUrl: string;
}

export interface DashboardStats {
  totalQuantity: number;
  totalAmount: number;
  categoryBreakdown: { name: string; value: number }[];
  dailyTrend: { date: string; amount: number }[];
}
