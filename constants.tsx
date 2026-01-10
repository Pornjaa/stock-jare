
import { CategoryType } from './types';

export const CATEGORIES_CONFIG = [
  { 
    type: CategoryType.ICE, 
    label: 'น้ำแข็ง', 
    image: 'https://images.unsplash.com/photo-1516139008210-96e45dccd83b?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.SOFT_DRINK, 
    label: 'น้ำอัดลม', 
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.ENERGY_DRINK, 
    label: 'เครื่องดื่มบำรุงกำลัง', 
    image: 'https://images.unsplash.com/photo-1622543953495-a92ee3951297?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.WATER, 
    label: 'น้ำเปล่า', 
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf3d?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.LIQUOR, 
    label: 'เหล้า', 
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.BEER, 
    label: 'เบียร์', 
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.CIGARETTE, 
    label: 'บุหรี่', 
    image: 'https://images.unsplash.com/photo-1527113353670-4e21bd503bb1?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    type: CategoryType.OTHERS, 
    label: 'อื่นๆ', 
    image: 'https://images.unsplash.com/photo-1583333222044-2e873b24652e?auto=format&fit=crop&q=80&w=400' 
  },
];

export const PRODUCTS_BY_CATEGORY: Record<string, string[]> = {
  [CategoryType.ICE]: ['น้ำแข็งหลอดเล็ก', 'น้ำแข็งหลอดใหญ่', 'น้ำแข็งบด'],
  [CategoryType.SOFT_DRINK]: ['โค้ก', 'เป๊ปซี่', 'แฟนต้า ส้ม', 'สไปรท์', 'เซเว่นอัพ'],
  [CategoryType.ENERGY_DRINK]: ['เอ็ม-150', 'คาราบาวแดง', 'กระทิงแดง', 'ลิโพ'],
  [CategoryType.WATER]: ['น้ำเปล่า 600ml', 'น้ำเปล่า 1.5L', 'น้ำแร่'],
  [CategoryType.LIQUOR]: ['รีเจนซี่', 'แสงโสม', 'หงส์ทอง', 'เบลนด์ 285'],
  [CategoryType.BEER]: ['ลีโอ', 'ช้าง', 'สิงห์', 'ไฮเนเก้น'],
  [CategoryType.CIGARETTE]: ['สายฝน', 'กรองทิพย์', 'แอลเอ็ม', 'มาร์ลโบโร่'],
  [CategoryType.OTHERS]: ['ขนมขบเคี้ยว', 'มาม่า', 'ของใช้ทั่วไป'],
};