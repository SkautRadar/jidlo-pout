
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  age: string;
  email: string;
  password?: string;
  phone?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  birthDate?: string;
  idCardNumber?: string;
  sectionNumber?: string;
  discount?: number;
  discountType?: string;
  address?: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  nickname?: string;
  age: string;
  email?: string;
  phone?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  birthDate?: string;
  idCardNumber?: string;
  sectionNumber?: string;
  address?: string;
  name?: string;
}

export interface MenuOptionChoice {
  name: string;
}

export interface MenuOption {
  name: string;
  choices: MenuOptionChoice[];
  maxChoices: number;
}

// Typy alergenů
export type Allergen =
  | 'gluten' | 'dairy' | 'eggs' | 'nuts' | 'peanuts'
  | 'soy' | 'fish' | 'shellfish' | 'celery' | 'mustard'
  | 'sesame' | 'sulphites' | 'lupin' | 'molluscs';

// Dietetické značky
export type DietTag = 'vegetarian' | 'vegan' | 'gluten-free' | 'lactose-free' | 'spicy';

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Lepek',
  dairy: 'Mléko',
  eggs: 'Vejce',
  nuts: 'Ořechy',
  peanuts: 'Arašídy',
  soy: 'Sója',
  fish: 'Ryby',
  shellfish: 'Korýši',
  celery: 'Celer',
  mustard: 'Hořčice',
  sesame: 'Sezam',
  sulphites: 'Siřičitany',
  lupin: 'Vlčí bob',
  molluscs: 'Měkkýši'
};

export const DIET_TAG_LABELS: Record<DietTag, { label: string; emoji: string; color: string }> = {
  'vegetarian': { label: 'Vegetariánské', emoji: '🥬', color: 'bg-green-100 text-green-700 border-green-200' },
  'vegan': { label: 'Veganské', emoji: '🌱', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'gluten-free': { label: 'Bezlepkové', emoji: '🌾', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'lactose-free': { label: 'Bez laktózy', emoji: '🥛', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'spicy': { label: 'Pálivé', emoji: '🌶️', color: 'bg-red-100 text-red-700 border-red-200' }
};

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price: number;
  isSoldOut?: boolean;
  isHidden?: boolean;
  options?: MenuOption[];
  vylepseni?: string[]; // Multiple choice (e.g. sauces)
  varianty?: string[]; // Single choice (e.g. size)
  allergens?: Allergen[];
  dietTags?: DietTag[];
}

export interface OrderItem extends MenuItem {
  quantity: number;
  selectedOptions?: Record<string, string[]>;
  upravy?: string[]; // Added for future compatibility
  price?: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  userInfo: UserInfo;
  status: OrderStatus;
  createdAt: Date;
  note?: string;
  totalPrice?: number;
  isPaid?: boolean;
}

export type AppView = 'CUSTOMER' | 'ADMIN' | 'CASHIER' | 'ARCHIVE' | 'MENU_MGMT' | 'USER_MGMT' | 'TRACKING' | 'PROFILE' | 'ANALYTICS';
