import {
  Utensils,
  ShoppingBasket,
  Car,
  Home,
  Zap,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Film,
  Sparkles,
  Repeat,
  Wallet,
  Laptop,
  MoreHorizontal,
  Tag,
  Plane,
  Coffee,
  Gift,
  Dumbbell,
  Baby,
  PawPrint,
  Shirt,
  Fuel,
  Bus,
} from 'lucide-react';

export const ICONS = {
  utensils: Utensils,
  'shopping-basket': ShoppingBasket,
  car: Car,
  home: Home,
  bolt: Zap,
  'bag-shopping': ShoppingBag,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  film: Film,
  spa: Sparkles,
  repeat: Repeat,
  'money-bill-wave': Wallet,
  'laptop-code': Laptop,
  ellipsis: MoreHorizontal,
  tag: Tag,
  plane: Plane,
  coffee: Coffee,
  gift: Gift,
  dumbbell: Dumbbell,
  baby: Baby,
  'paw-print': PawPrint,
  shirt: Shirt,
  fuel: Fuel,
  bus: Bus,
};

export const ICON_KEYS = Object.keys(ICONS);

export function CategoryIcon({ iconKey, size = 18, ...props }) {
  const Icon = ICONS[iconKey] || Tag;
  return <Icon size={size} {...props} />;
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export const CATEGORY_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#84cc16',
  '#e11d48',
];

export default { ICONS, CategoryIcon, PAYMENT_METHODS };
