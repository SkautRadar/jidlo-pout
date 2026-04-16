
import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Guláš',
    description: 'Poctivý hovĕzí guláš',
    category: 'Hlavní jídla',
    image: 'https://picsum.photos/seed/gulas/400/300',
    vylepseni: ['S chlebem', 'S rohlíkem', 'Cibule navíc']
  },
  {
    id: 'm2',
    name: 'Řízek',
    description: 'Smažený vepřový řízek',
    category: 'Hlavní jídla',
    image: 'https://picsum.photos/seed/rizek/400/300',
    vylepseni: ['S chlebem', 'S kyselou okurkou']
  },
  {
    id: 'm3',
    name: 'Česnečka',
    description: 'Silná polévka, která postaví na nohy',
    category: 'Polévky',
    image: 'https://picsum.photos/seed/soup/400/300',
    vylepseni: ['S krutony', 'Se sýrem']
  },
  {
    id: 'm4',
    name: 'Párek v rohlíku',
    description: 'Klasika do ruky',
    category: 'Rychlovky do ruky',
    image: 'https://picsum.photos/seed/hotdog/400/300',
    vylepseni: ['Kečup', 'Hořčice']
  },
  {
    id: 'm5',
    name: 'Klobása',
    description: 'Grilovaná klobása',
    category: 'Rychlovky do ruky',
    image: 'https://picsum.photos/seed/sausage/400/300',
    vylepseni: ['Hořčice', 'Kečup', 'Křen', 'S chlebem']
  },
  {
    id: 'm6',
    name: 'Tortilla / Bageta',
    description: 'Čerstvě připravené',
    category: 'Rychlovky do ruky',
    image: 'https://picsum.photos/seed/tortilla/400/300',
    vylepseni: ['Bez cibule', 'Bez rajčat', 'Pikantní dresink', 'Bylinkový dresink']
  },
  {
    id: 'm7',
    name: 'Hranolky',
    description: 'Smažené bramborové hranolky',
    category: 'Přílohy',
    image: 'https://picsum.photos/seed/fries/400/300',
    vylepseni: ['Kečup', 'Tatarka']
  },
  {
    id: 'm8',
    name: 'Krokety',
    description: 'Smažené bramborové krokety',
    category: 'Přílohy',
    image: 'https://picsum.photos/seed/krokety/400/300',
    vylepseni: ['Kečup', 'Tatarka']
  },
  {
    id: 'm9',
    name: 'Palačinka',
    description: 'Sladká tečka na závěr',
    category: 'Sladké',
    image: 'https://picsum.photos/seed/pancake/400/300',
    vylepseni: ['Marmeláda', 'Nutella', 'Šlehačka', 'Ovoce']
  }
];
