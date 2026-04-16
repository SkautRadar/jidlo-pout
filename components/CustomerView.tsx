
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, OrderItem, UserInfo, OrderStatus, Order, User } from '../types';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { FlyingItem } from './FlyingItem';
import { RegistrationForm } from './RegistrationForm';
import { GuestCheckoutForm } from './GuestCheckoutForm';

interface CustomerViewProps {
  menuItems: MenuItem[];
  onOrderSubmit: (order: Order) => Promise<Order | null>;
  currentUser: User | null;
  onRegister: (user: User) => void;
  onLogin: (email: string, password?: string) => Promise<boolean>;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onNavigate?: (view: 'TRACKING') => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({ menuItems, onOrderSubmit, currentUser, onRegister, onLogin, onLogout, onNavigate }) => {
  const { showToast } = useToast();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    nickname: '',
    age: '',
    email: ''
  });
  const [orderNote, setOrderNote] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Vše');
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; src: string; rect: { x: number; y: number; width: number; height: number } }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Modals for Skaut specification
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [showOrderSentModal, setShowOrderSentModal] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const categories = ['Vše', ...Array.from(new Set(menuItems.filter(i => !i.isHidden).map(i => i.category)))];

  const sauces = useMemo(() => menuItems.filter(item => item.category === 'Omáčky & Dipy' && !item.isSoldOut && !item.isHidden), [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (item.isHidden) return false;
      if (item.category === 'Omáčky & Dipy') return false; // Hide sauces from main menu grid
      if (activeCategory !== 'Vše' && item.category !== activeCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const openItemModal = (item: MenuItem, e?: React.MouseEvent) => {
    setSelectedItem(item);
    setSelectedVariant(item.varianty && item.varianty.length > 0 ? item.varianty[0] : null);
    setSelectedEnhancements([]);
    setModalQuantity(1);
    setIsItemModalOpen(true);
  };

  const addToCart = () => {
    if (!selectedItem) return;
    
    const allUpravy = [
        ...(selectedVariant ? [selectedVariant] : []),
        ...selectedEnhancements
    ];

    setCart(prev => {
        const existing = prev.find(i => i.id === selectedItem.id && JSON.stringify(i.upravy) === JSON.stringify(allUpravy));
      if (existing) return prev.map(i => i === existing ? { ...i, quantity: i.quantity + modalQuantity } : i);
      return [...prev, { ...selectedItem, quantity: modalQuantity, upravy: allUpravy }];
    });

    setIsItemModalOpen(false);
    showToast(`Přidáno: ${selectedItem.name}`, 'success');
  };

  const updateCartItemQuantity = (index: number, change: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQ = item.quantity + change;
        if (newQ <= 0) return null;
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const finalInfo: UserInfo = currentUser ? {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      nickname: currentUser.nickname,
      age: currentUser.age,
      email: currentUser.email
    } : userInfo;

    const createdOrder = await onOrderSubmit({
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      orderNumber: 0,
      items: [...cart],
      userInfo: finalInfo,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      note: orderNote
    });

    if (!createdOrder) return;

    setCart([]);
    setOrderNote('');
    setIsOrdering(false);
    setCheckoutStep(1);
    setLastOrderNumber(createdOrder.orderNumber);
    setShowOrderSentModal(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(loginEmail, loginPassword);
    if (success) {
      setIsLoggingIn(false);
      setLoginEmail('');
      setLoginPassword('');
    } else {
      showToast("Chybné přihlášení.", 'error');
    }
  };

  useEffect(() => {
    const modalOpen = isOrdering || isItemModalOpen || isLoggingIn || isRegistering || showOrderSentModal;
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
    };
  }, [isOrdering, isItemModalOpen, isLoggingIn, isRegistering, showOrderSentModal]);

  const handleCloseCheckout = () => {
    setIsOrdering(false);
    setCheckoutStep(1);
  };

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden px-3 pb-28 pt-3 sm:px-4 sm:pb-20">
      <div className="pointer-events-none absolute -left-12 top-4 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl sm:h-72 sm:w-72" />
      <div className="pointer-events-none absolute -right-16 top-24 h-44 w-44 rounded-full bg-emerald-200/25 blur-3xl sm:h-72 sm:w-72" />

      <header className="relative mb-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:mb-6 sm:p-5">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-100/70 blur-2xl" />
        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-emerald-100/70 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
              <span>Skautská pouť 2026</span>
              <span>⚜️</span>
            </div>
            <div>
              <h1 className="font-playful text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Objednej si na pár dotyků</h1>
              <p className="mt-1 max-w-xl text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
                Vyber si jídlo, dolad&apos; omáčku a pošli objednávku bez zbytečného scrollování.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-[240px]">
            {currentUser ? (
              <div className="rounded-[1.5rem] border-2 border-orange-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👋</span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-[11px] font-black uppercase leading-none tracking-[0.18em] text-orange-600">Vítej, {currentUser.nickname || currentUser.firstName}!</p>
                    <button onClick={onLogout} className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-500 hover:underline">
                      Odhlásit se
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIsLoggingIn(true)} className="min-h-[48px] rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all active:scale-95">
                  Přihlásit
                </button>
                <button onClick={() => setIsRegistering(true)} className="min-h-[48px] rounded-[1.2rem] bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all active:scale-95">
                  Registrace
                </button>
              </div>
            )}
            <button
              onClick={() => onNavigate?.('TRACKING')}
              className="min-h-[48px] rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-slate-700 shadow-sm transition-all active:scale-95"
            >
              {currentUser ? 'Moje objednávky a historie' : 'Sledovat objednávku'}
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-2 z-20 space-y-3">
        <div className="rounded-[1.6rem] border border-white/70 bg-white/90 p-2 shadow-[0_12px_32px_rgba(15,23,42,0.08)] backdrop-blur">
          <label className="sr-only" htmlFor="menu-search">Hledat v menu</label>
          <div className="flex items-center gap-3 rounded-[1.2rem] border-2 border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-lg">🔎</span>
            <input
              id="menu-search"
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Hledej jídlo nebo ingredienci"
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 shadow-sm"
              >
                Smazat
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full border-2 px-4 py-2.5 text-[12px] font-black transition-all ${activeCategory === cat ? 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200' : 'border-white/80 bg-white/90 text-slate-600 shadow-sm hover:border-orange-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {filteredItems.map(item => {
          const cartItems = cart.filter(c => c.id === item.id);
          const totalInCart = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

          return (
          <div 
            key={item.id} 
            onClick={() => !item.isSoldOut && openItemModal(item)} 
            className={`group overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${item.isSoldOut ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="relative h-32 bg-slate-100 sm:h-40">
               {item.image ? (
                 <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
               ) : (
                 <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-slate-400">
                    <span className="text-3xl sm:text-5xl">🍽️</span>
                    <span className="mt-1 text-[8px] font-black uppercase tracking-widest opacity-50 sm:text-[10px]">{item.category}</span>
                 </div>
               )}
              
              {/* Oznámení o celkovém počtu v košíku (pouze info) */}
              {totalInCart > 0 ? (
                <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1 sm:left-4 sm:top-4">
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md sm:px-3 sm:py-1 sm:text-[10px]">
                    <span className="hidden sm:inline">🛒</span> <span>{totalInCart}x Na tácu</span>
                  </div>
                </div>
              ) : (
                <div className="absolute left-2 top-2 z-20 sm:left-2 sm:top-2">
                   <button 
                      onClick={(e) => { 
                         e.stopPropagation(); 
                         const firstVar = item.varianty && item.varianty.length > 0 ? [item.varianty[0]] : [];
                         setCart(prev => [...prev, { ...item, quantity: 1, upravy: firstVar }]);
                         showToast(`Přidáno: ${item.name}`, 'success');
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-orange-500 pb-1 text-base font-black text-white shadow-xl transition-all active:scale-95 sm:h-10 sm:w-10 sm:text-lg"
                   >
                      +
                   </button>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-6">
              <h3 className="mb-1 line-clamp-2 text-[12px] font-black uppercase leading-tight tracking-tight text-slate-900 sm:mb-2 sm:text-xl sm:tracking-normal">{item.name}</h3>
              
              {/* Detailní výpis toho, co je v košíku pro tuto položku s ovládáním */}
              {totalInCart > 0 && (
                <div className="relative z-20 mb-3 space-y-1">
                   {cart.map((cItem, globalIdx) => {
                     if (cItem.id !== item.id) return null;
                     return (
                       <div key={globalIdx} className="flex items-center justify-between gap-1 rounded-[1rem] border border-emerald-100 bg-emerald-50 px-2 py-2 text-[9px] font-bold text-emerald-700 shadow-sm sm:text-[10px]">
                          <div className="flex flex-1 items-center gap-1 truncate sm:gap-2">
                             <div className="flex shrink-0 items-center gap-2 rounded-[1rem] border-2 border-emerald-200 bg-white/90 px-2 py-1.5 shadow-sm">
                                <button 
                                   onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(globalIdx, -1); }}
                                   className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-100 bg-white text-lg text-red-500 shadow-sm transition-all active:scale-90 active:bg-red-100 sm:h-8 sm:w-8 sm:text-sm"
                                >
                                   −
                                </button>
                                <span className="w-8 text-center text-xs font-black text-slate-900 sm:w-8 sm:text-xs">{cItem.quantity}x</span> 
                                <button 
                                   onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(globalIdx, 1); }}
                                   className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-slate-100 bg-white pb-1.5 text-lg text-emerald-600 shadow-sm transition-all active:scale-90 active:bg-emerald-100 sm:h-8 sm:w-8 sm:pb-1 sm:text-base"
                                >
                                   +
                                </button>
                             </div>
                             <span className="flex-1 truncate italic opacity-80">{cItem.upravy && cItem.upravy.length > 0 ? cItem.upravy.join(', ') : 'Základní'}</span>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}

              <p className="hidden sm:block text-slate-500 text-sm font-medium line-clamp-2 h-10 mb-2">{item.description}</p>
              
              {/* Možné varianty */}
              {item.varianty && item.varianty.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 sm:mt-2">
                   {item.varianty.map(v => (
                     <span key={v} className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-tighter text-blue-600 sm:text-[10px] sm:tracking-normal">
                        {v}
                     </span>
                   ))}
                </div>
              )}

              {/* Možné vylepšení */}
              {item.vylepseni && item.vylepseni.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 sm:mt-1">
                   {item.vylepseni.slice(0, 3).map(v => (
                     <span key={v} className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-tighter text-orange-600 sm:text-[10px] sm:tracking-normal">
                        +{v}
                     </span>
                   ))}
                   {item.vylepseni.length > 3 && (
                     <span className="self-center text-[7px] font-black text-slate-400 sm:text-[10px]">
                        +{item.vylepseni.length - 3}
                     </span>
                   )}
                </div>
              )}
            </div>
          </div>
        )})}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
          <button onClick={() => setIsOrdering(true)} className="flex w-full items-center justify-between rounded-[2rem] border border-orange-500/20 bg-slate-950/95 p-4 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 font-black text-lg text-white">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-orange-200">Košík je připraven</span>
                <span className="block text-lg font-black uppercase tracking-wide">Můj tác</span>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-2 text-sm font-black uppercase tracking-[0.18em] text-white">Rekapitulace</span>
          </button>
        </div>
      )}

      {/* Item Customization Modal */}
      {isItemModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/65 p-0 backdrop-blur-md sm:items-center sm:p-4">
          <div className="relative flex h-[94svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]">
            <button
              onClick={() => setIsItemModalOpen(false)}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-lg font-black text-slate-500 shadow-sm transition-colors hover:text-slate-900"
            >
              ✕
            </button>

            <div className="relative h-48 w-full overflow-hidden bg-slate-100 sm:h-60">
              {selectedItem.image ? (
                <img src={selectedItem.image} alt={selectedItem.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <span className="text-6xl">🍽️</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-100">{selectedItem.category}</p>
                  <h2 className="truncate text-2xl font-black sm:text-3xl">{selectedItem.name}</h2>
                </div>
                <div className="shrink-0 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-slate-900">
                  {selectedItem.price > 0 ? `${selectedItem.price} Kč` : 'ZDARMA'}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              {selectedItem.description && (
                <p className="mb-5 text-sm font-semibold leading-relaxed text-slate-600 sm:text-base">{selectedItem.description}</p>
              )}

              {selectedItem.varianty && selectedItem.varianty.length > 0 && (
                <section className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">Vyber variantu</h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {selectedItem.varianty.map(v => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-xl border-2 px-3 py-3 text-sm font-black transition-all ${selectedVariant === v ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {selectedItem.vylepseni && selectedItem.vylepseni.length > 0 && (
                <section className="mb-5 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-orange-700">Doplňky</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.vylepseni.map(enh => (
                      <button
                        key={enh}
                        onClick={() => setSelectedEnhancements(prev => prev.includes(enh) ? prev.filter(e => e !== enh) : [...prev, enh])}
                        className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition-all sm:text-sm ${selectedEnhancements.includes(enh) ? 'border-orange-500 bg-orange-500 text-white' : 'border-orange-100 bg-white text-slate-700 hover:border-orange-300'}`}
                      >
                        {enh}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {sauces.length > 0 && selectedItem.category !== 'Nápoje' && (
                <section className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">Omáčka / dip</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sauces.map(sauce => (
                      <button
                        key={sauce.id}
                        onClick={() => setSelectedEnhancements(prev => {
                          const otherSaucesNames = sauces.map(s => s.name);
                          const filtered = prev.filter(e => !otherSaucesNames.includes(e));
                          if (prev.includes(sauce.name)) return filtered;
                          return [...filtered, sauce.name];
                        })}
                        className={`flex items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-xs font-black transition-all sm:text-sm ${selectedEnhancements.includes(sauce.name) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-300'}`}
                      >
                        <span className="truncate">{sauce.name}</span>
                        {selectedEnhancements.includes(sauce.name) && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-2xl border-2 border-slate-100 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                    className="h-10 w-10 rounded-xl bg-white text-lg font-black text-slate-600 shadow-sm transition-all active:scale-95"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-base font-black text-slate-900">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(q => Math.min(20, q + 1))}
                    className="h-10 w-10 rounded-xl bg-white text-lg font-black text-slate-600 shadow-sm transition-all active:scale-95"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  className="flex-1 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.99] sm:text-base"
                >
                  Přidat {modalQuantity}x na tác
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal - Step 1: Cart Review */}
      {isOrdering && checkoutStep === 1 && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
          <div className="relative flex h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2.25rem] border border-orange-50 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">Krok 1 / 2</p>
                <h2 className="font-playful text-2xl font-black text-slate-900 sm:text-3xl">Zkontroluj obsah tácu</h2>
              </div>
              <button onClick={() => { setIsOrdering(false); setCheckoutStep(1); }} className="rounded-full bg-slate-100 p-3 text-lg font-black text-slate-500 transition-colors hover:text-slate-900">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-8 no-scrollbar overscroll-contain">
                <div className="relative rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4 sm:p-6">
                  <div className="absolute right-0 top-0 scale-150 p-6 opacity-5 rotate-12">⚜️</div>
                  <div className="mb-6 flex items-center justify-between border-b-2 border-slate-200 pb-3">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Obsah tvého tácu</h3>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-orange-700">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} položek
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[50svh] overflow-y-auto pr-2 no-scrollbar">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-500 font-semibold">Tvůj tác je prázdný</p>
                      </div>
                    ) : (
                      cart.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-[1.2rem] border border-slate-100 bg-white p-4 shadow-sm animate-slide-in">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                            {item.image ? (
                              <img src={item.image} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black leading-tight text-slate-900">{item.name}</h4>
                            {item.upravy && item.upravy.length > 0 && (
                              <p className="mt-1 text-[10px] font-bold italic text-slate-400 line-clamp-2">{item.upravy.join(', ')}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2 shrink-0">
                            <span className="font-black text-lg text-orange-600">{item.quantity}x</span>
                            <button onClick={() => removeFromCart(idx)} className="rounded-full p-1.5 text-sm font-bold text-red-400 transition-colors hover:text-red-600 hover:bg-red-50">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 sm:px-8 sm:py-6 space-y-3">
                <div className="flex items-center justify-between text-slate-900">
                  <span className="text-lg font-black uppercase">Cena</span>
                  <span className="text-lg font-black text-orange-600">ZDARMA</span>
                </div>
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => setCheckoutStep(2)} 
                  disabled={cart.length === 0}
                  className="min-h-[56px] rounded-[1.4rem] py-4 text-base font-black shadow-xl shadow-orange-200 transition-transform active:scale-[0.99] sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  POKRAČOVAT → ÚDAJE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal - Step 2: User Info & Note */}
      {isOrdering && checkoutStep === 2 && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
          <div className="relative flex h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2.25rem] border border-orange-50 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-500">Krok 2 / 2</p>
                <h2 className="font-playful text-2xl font-black text-slate-900 sm:text-3xl">Vyplň své údaje</h2>
              </div>
              <button onClick={() => { setIsOrdering(false); setCheckoutStep(1); }} className="rounded-full bg-slate-100 p-3 text-lg font-black text-slate-500 transition-colors hover:text-slate-900">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-8 no-scrollbar overscroll-contain">
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600 mb-4">Vaše údaje</h3>
                    {!currentUser ? (
                      <GuestCheckoutForm
                        userInfo={userInfo}
                        onUserInfoChange={setUserInfo}
                      />
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                        <p className="mb-1 text-xl font-black text-emerald-900">{currentUser.firstName} {currentUser.lastName}</p>
                        {currentUser.nickname && <p className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block">Přezdívka: {currentUser.nickname}</p>}
                        <p className="mt-4 block text-xs font-bold uppercase tracking-widest text-emerald-600">✓ Přihlášený strávník</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="ml-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Vzkaz pro kuchaře (volitelně)</label>
                    <textarea 
                        className="min-h-[120px] w-full rounded-[1.5rem] border-2 border-slate-100 bg-slate-50 p-5 font-semibold text-slate-900 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100" 
                        placeholder="Nějaké info pro nás? (Např. bez cibule atd.)" 
                        value={orderNote} 
                        onChange={e => setOrderNote(e.target.value)} 
                    />
                  </div>
                </form>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 sm:px-8 sm:py-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setCheckoutStep(1)}
                    className="min-h-[56px] rounded-[1.4rem] py-4 text-base font-black transition-transform active:scale-[0.99]"
                  >
                    ← ZPĚT
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    form="checkout-form" 
                    className="min-h-[56px] rounded-[1.4rem] py-4 text-base font-black shadow-xl shadow-orange-200 transition-transform active:scale-[0.99] sm:text-lg"
                  >
                    ODESLAT!
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isLoggingIn && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative">
             <button onClick={() => setIsLoggingIn(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-xl font-black">✕</button>
             <h2 className="text-3xl font-black text-slate-900 mb-8 border-b-4 border-orange-500 pb-2 inline-block">Přihlášení</h2>
             <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-2">Email</label>
                    <input required type="email" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500" placeholder="vas@email.cz" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-2">Heslo</label>
                    <input required type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-orange-500 pr-12" placeholder="******" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-400 hover:text-orange-500 transition-colors">
                        {showPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                </div>
                <div className="flex gap-2 mt-8 pt-4">
                   <Button variant="secondary" onClick={() => setIsLoggingIn(false)} type="button" className="flex-1 rounded-2xl">Zrušit</Button>
                   <Button variant="primary" type="submit" className="flex-1 rounded-2xl">Vstoupit</Button>
                </div>
                <p className="text-center text-xs mt-6 text-slate-500 font-bold">
                    Nemáte ještě účet? <button type="button" onClick={() => { setIsLoggingIn(false); setIsRegistering(true) }} className="text-orange-600 underline">Založit profil</button>
                </p>
             </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegistering && (
        <RegistrationForm 
          onSubmit={(user) => {
            onRegister(user);
            setIsRegistering(false);
            showToast("Registrace úspěšná! Vítejte ve hře o nejlepší jídlo. ⚜️", "success");
          }} 
          onCancel={() => setIsRegistering(false)} 
          onSwitchToLogin={() => {
            setIsRegistering(false);
            setIsLoggingIn(true);
          }}
        />
      )}

      {/* Order Sent Modal */}
      {showOrderSentModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Objednávka odeslána</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">Hotovo, kuchyně ji už vidí</h3>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Číslo objednávky:
              <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-base font-black text-emerald-700">
                #{String(lastOrderNumber || 0).padStart(3, '0')}
              </span>
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowOrderSentModal(false);
                  onNavigate?.('TRACKING');
                }}
                className="min-h-[52px] rounded-[1.2rem] bg-orange-500 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-orange-200 transition-all active:scale-95"
              >
                Sledovat objednávku
              </button>
              <button
                type="button"
                onClick={() => setShowOrderSentModal(false)}
                className="min-h-[52px] rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-slate-700 transition-all active:scale-95"
              >
                Zpět do menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation elements */}
      {flyingItems.map(item => (
        <FlyingItem
          key={item.id}
          src={item.src}
          startRect={item.rect}
          onComplete={() => setFlyingItems(prev => prev.filter(i => i.id !== item.id))}
        />
      ))}
    </div>
  );
};
