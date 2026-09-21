import React from 'react';
import {
  Wheat,
  Sprout,
  Store,
  Truck,
  Scissors,
  Wrench,
  Sun,
  Fish,
  Egg,
  Milk,
  Boxes,
  Layers,
  Leaf,
  ShoppingBag,
  Factory,
} from 'lucide-react';

export type BusinessCategory =
  | 'paddy'
  | 'rice'
  | 'wheat'
  | 'cotton'
  | 'sugarcane'
  | 'mustard'
  | 'pulses'
  | 'horticulture'
  | 'dairy'
  | 'poultry'
  | 'fisheries'
  | 'kirana'
  | 'retail'
  | 'handloom'
  | 'handicraft'
  | 'agro_processing'
  | 'transport'
  | 'solar'
  | 'services'
  | 'default';

export interface CategoryIconProps {
  category: BusinessCategory | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'filled' | 'pill';
  className?: string;
}

export function CategoryIcon({
  category,
  size = 'md',
  variant = 'outline',
  className = '',
}: CategoryIconProps) {
  const normCat = (category || 'default').toLowerCase().trim().replace(/[\s-]+/g, '_');

  // Explicit line icon mapping — clean, minimalist, professional rural fintech iconography
  const getIcon = (cat: string) => {
    switch (cat) {
      case 'paddy':
      case 'rice':
      case 'wheat':
        return Wheat;
      case 'cotton':
      case 'pulses':
      case 'mustard':
      case 'horticulture':
      case 'agriculture':
      case 'farming':
        return Leaf;
      case 'sugarcane':
        return Sprout;
      case 'dairy':
      case 'cattle':
        return Milk;
      case 'poultry':
        return Egg;
      case 'fisheries':
      case 'aquaculture':
        return Fish;
      case 'kirana':
      case 'retail':
      case 'store':
        return Store;
      case 'handloom':
      case 'handicraft':
        return Scissors;
      case 'agro_processing':
      case 'flour_mill':
      case 'food_processing':
        return Factory;
      case 'transport':
      case 'logistics':
        return Truck;
      case 'solar':
      case 'renewable':
        return Sun;
      case 'services':
      case 'repair':
        return Wrench;
      case 'trading':
        return ShoppingBag;
      case 'manufacturing':
        return Boxes;
      default:
        return Layers;
    }
  };

  const IconComponent = getIcon(normCat);

  const sizeMap = {
    sm: { container: 'w-7 h-7 p-1.5', icon: 'w-4 h-4' },
    md: { container: 'w-9 h-9 p-2', icon: 'w-5 h-5' },
    lg: { container: 'w-11 h-11 p-2.5', icon: 'w-6 h-6' },
    xl: { container: 'w-14 h-14 p-3.5', icon: 'w-7 h-7' },
  };

  const variantStyles = {
    outline: 'border border-primary/20 bg-primary/5 text-primary',
    filled: 'bg-primary text-white',
    pill: 'rounded-full border border-secondary/30 bg-secondary/10 text-primary-700',
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 ${sizeMap[size].container} ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    >
      <IconComponent className={`${sizeMap[size].icon} stroke-[1.75]`} />
    </div>
  );
}

export default CategoryIcon;
