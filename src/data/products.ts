import burgerClassic from '@/assets/burger-classic.jpg';
import burgerBacon from '@/assets/burger-bacon.jpg';
import burgerSpicy from '@/assets/burger-spicy.jpg';
import burgerMushroom from '@/assets/burger-mushroom.jpg';
import burgerBbq from '@/assets/burger-bbq.jpg';
import fries from '@/assets/fries.jpg';
import milkshake from '@/assets/milkshake.jpg';
import onionRings from '@/assets/onion-rings.jpg';

export interface Extra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'burgers' | 'sides' | 'drinks';
  featured?: boolean;
  tag?: string;
  extras?: Extra[];
  details?: string;
}

const burgerExtras: Extra[] = [
  { id: 'e1', name: 'Extra Patty', price: 4.00 },
  { id: 'e2', name: 'Bacon', price: 2.50 },
  { id: 'e3', name: 'Avocado', price: 2.00 },
  { id: 'e4', name: 'Fried Egg', price: 1.50 },
  { id: 'e5', name: 'Extra Cheese', price: 1.50 },
  { id: 'e6', name: 'Jalapeños', price: 1.00 },
  { id: 'e7', name: 'Caramelized Onions', price: 1.00 },
  { id: 'e8', name: 'Truffle Mayo', price: 1.50 },
];

const sideExtras: Extra[] = [
  { id: 's1', name: 'Large Size', price: 2.00 },
  { id: 's2', name: 'Cheese Sauce', price: 1.50 },
  { id: 's3', name: 'Truffle Oil', price: 2.00 },
];

const drinkExtras: Extra[] = [
  { id: 'd1', name: 'Large Size', price: 1.50 },
  { id: 'd2', name: 'Extra Whipped Cream', price: 0.75 },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'The Classic',
    description: 'Angus beef, aged cheddar, lettuce, tomato & our secret sauce',
    details: '100% premium Angus beef patty, hand-pressed daily. Topped with aged cheddar, crisp lettuce, vine-ripened tomato, and our signature house-made secret sauce on a toasted brioche bun.',
    price: 14.99,
    image: burgerClassic,
    category: 'burgers',
    featured: true,
    tag: 'Best Seller',
    extras: burgerExtras,
  },
  {
    id: '2',
    name: 'Double Bacon Stack',
    description: 'Two smashed patties, crispy bacon, pickles & American cheese',
    details: 'Two thin-pressed smashed patties with crispy edges, stacked with smoky bacon strips, tangy dill pickles, and melted American cheese. Pure indulgence.',
    price: 18.99,
    image: burgerBacon,
    category: 'burgers',
    featured: true,
    tag: 'Popular',
    extras: burgerExtras,
  },
  {
    id: '3',
    name: 'Spicy Jalapeño',
    description: 'Pepper jack cheese, grilled jalapeños & chipotle mayo',
    details: 'For the heat lovers. Juicy beef patty with melted pepper jack, charred jalapeño slices, and a smoky chipotle mayo that brings the perfect kick.',
    price: 16.49,
    image: burgerSpicy,
    category: 'burgers',
    featured: true,
    extras: burgerExtras,
  },
  {
    id: '4',
    name: 'Mushroom Swiss',
    description: 'Sautéed mushrooms, melted Swiss & truffle aioli',
    details: 'Earthy sautéed mushrooms, nutty melted Swiss cheese, and a drizzle of truffle aioli on our signature patty. Refined and rich.',
    price: 17.49,
    image: burgerMushroom,
    category: 'burgers',
    extras: burgerExtras,
  },
  {
    id: '5',
    name: 'BBQ Pulled Pork',
    description: 'Slow-cooked pulled pork, coleslaw & tangy BBQ glaze',
    details: '12-hour slow-cooked pulled pork piled high with creamy coleslaw and our tangy house BBQ glaze. A Southern classic elevated.',
    price: 17.99,
    image: burgerBbq,
    category: 'burgers',
    extras: burgerExtras,
  },
  {
    id: '6',
    name: 'Hand-Cut Fries',
    description: 'Crispy golden fries with sea salt & rosemary',
    details: 'Hand-cut daily from premium potatoes, double-fried for extra crunch, and finished with flaky sea salt and fresh rosemary.',
    price: 5.99,
    image: fries,
    category: 'sides',
    extras: sideExtras,
  },
  {
    id: '7',
    name: 'Onion Rings',
    description: 'Beer-battered & served with spicy ketchup',
    details: 'Thick-cut sweet onion rings in our craft beer batter, fried golden and served with house-made spicy ketchup.',
    price: 6.99,
    image: onionRings,
    category: 'sides',
    extras: sideExtras,
  },
  {
    id: '8',
    name: 'Chocolate Shake',
    description: 'Hand-spun Belgian chocolate with whipped cream',
    details: 'Rich Belgian chocolate blended with premium vanilla ice cream, topped with a cloud of whipped cream and chocolate shavings.',
    price: 7.99,
    image: milkshake,
    category: 'drinks',
    extras: drinkExtras,
  },
];
