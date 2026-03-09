import burgerClassic from '@/assets/burger-classic.jpg';
import burgerBacon from '@/assets/burger-bacon.jpg';
import burgerSpicy from '@/assets/burger-spicy.jpg';
import burgerMushroom from '@/assets/burger-mushroom.jpg';
import burgerBbq from '@/assets/burger-bbq.jpg';
import fries from '@/assets/fries.jpg';
import milkshake from '@/assets/milkshake.jpg';
import onionRings from '@/assets/onion-rings.jpg';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'burgers' | 'sides' | 'drinks';
  featured?: boolean;
  tag?: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'The Classic',
    description: 'Angus beef, aged cheddar, lettuce, tomato & our secret sauce',
    price: 14.99,
    image: burgerClassic,
    category: 'burgers',
    featured: true,
    tag: 'Best Seller',
  },
  {
    id: '2',
    name: 'Double Bacon Stack',
    description: 'Two smashed patties, crispy bacon, pickles & American cheese',
    price: 18.99,
    image: burgerBacon,
    category: 'burgers',
    featured: true,
    tag: 'Popular',
  },
  {
    id: '3',
    name: 'Spicy Jalapeño',
    description: 'Pepper jack cheese, grilled jalapeños & chipotle mayo',
    price: 16.49,
    image: burgerSpicy,
    category: 'burgers',
    featured: true,
  },
  {
    id: '4',
    name: 'Mushroom Swiss',
    description: 'Sautéed mushrooms, melted Swiss & truffle aioli',
    price: 17.49,
    image: burgerMushroom,
    category: 'burgers',
  },
  {
    id: '5',
    name: 'BBQ Pulled Pork',
    description: 'Slow-cooked pulled pork, coleslaw & tangy BBQ glaze',
    price: 17.99,
    image: burgerBbq,
    category: 'burgers',
  },
  {
    id: '6',
    name: 'Hand-Cut Fries',
    description: 'Crispy golden fries with sea salt & rosemary',
    price: 5.99,
    image: fries,
    category: 'sides',
  },
  {
    id: '7',
    name: 'Onion Rings',
    description: 'Beer-battered & served with spicy ketchup',
    price: 6.99,
    image: onionRings,
    category: 'sides',
  },
  {
    id: '8',
    name: 'Chocolate Shake',
    description: 'Hand-spun Belgian chocolate with whipped cream',
    price: 7.99,
    image: milkshake,
    category: 'drinks',
  },
];
