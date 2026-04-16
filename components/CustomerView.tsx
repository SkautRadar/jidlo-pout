
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, OrderItem, UserInfo, OrderStatus, Order, User } from '../types';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { FlyingItem } from './FlyingItem';
import { RegistrationForm } from './RegistrationForm';
import { GuestCheckoutForm } from './GuestCheckoutForm';

interface CustomerViewProps {
  menuItems: MenuItem[];
  onOrderSubmit: (order: Order) => void;
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
        if (existing) return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...selectedItem, quantity: 1, upravy: allUpravy }];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const finalInfo: UserInfo = currentUser ? {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      nickname: currentUser.nickname,
      age: currentUser.age,
      email: currentUser.email
    } : userInfo;

    onOrderSubmit({
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      orderNumber: 0,
      items: [...cart],
      userInfo: finalInfo,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      note: orderNote
    });
    setCart([]);
    setOrderNote('');
    setIsOrdering(false);
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

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3 border-b-2 border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">SKAUTSKÁ POUŤ 2026 ⚜️</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Dobré jídlo pro dobrou věc</p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-3 border-2 border-orange-100 shadow-sm">
                <span className="text-xl">👋</span>
                <div className="text-left">
                    <p className="text-[10px] font-black text-orange-600 uppercase leading-none">Vítej, {currentUser.nickname || currentUser.firstName}!</p>
                    <button onClick={onLogout} className="text-[10px] text-red-500 hover:underline font-bold uppercase mt-1">Odhlásit se</button>
                </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsLoggingIn(true)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-300 transition-all text-sm">
                Přihlásit
              </button>
              <button onClick={() => setIsRegistering(true)} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-black hover:bg-orange-600 transition-all text-sm shadow-md">
                Registrace
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)} 
            className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition-all border-2 ${activeCategory === cat ? 'bg-orange-500 border-orange-500 text-white shadow-lg scale-105' : 'bg-white text-slate-600 border-slate-100 hover:border-orange-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {filteredItems.map(item => {
          const cartItems = cart.filter(c => c.id === item.id);
          const totalInCart = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

          return (
          <div 
            key={item.id} 
            onClick={() => !item.isSoldOut && openItemModal(item)} 
            className={`group bg-white rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-50 overflow-hidden cursor-pointer active:scale-[0.98] transition-all hover:shadow-lg hover:border-orange-100 ${item.isSoldOut ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="relative h-24 sm:h-40 bg-slate-100">
               {item.image ? (
                 <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-slate-400">
                    <span className="text-2xl sm:text-5xl">🍽️</span>
                    <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-widest mt-1 opacity-50">{item.category}</span>
                 </div>
               )}
              
              {/* Oznámení o celkovém počtu v košíku (pouze info) */}
              {totalInCart > 0 ? (
                <div className="absolute top-1 left-1 sm:top-4 sm:left-4 flex flex-col items-start gap-1 z-10 pointer-events-none">
                  <div className="bg-emerald-500 text-white backdrop-blur-md px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-black text-[8px] sm:text-[10px] shadow-lg uppercase tracking-wider flex items-center gap-1">
                    <span className="hidden sm:inline">🛒</span> <span>{totalInCart}x Na tácu</span>
                  </div>
                </div>
              ) : (
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-20">
                   <button 
                      onClick={(e) => { 
                         e.stopPropagation(); 
                         const firstVar = item.varianty && item.varianty.length > 0 ? [item.varianty[0]] : [];
                         setCart(prev => [...prev, { ...item, quantity: 1, upravy: firstVar }]);
                         showToast(`Přidáno: ${item.name}`, 'success');
                      }}
                      className="bg-orange-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xl font-black text-sm sm:text-lg border-2 border-white active:scale-95 transition-all pb-1.5 sm:pb-1"
                   >
                      +
                   </button>
                </div>
              )}
            </div>
            <div className="p-2 sm:p-6">
              <h3 className="text-[10px] sm:text-xl font-black text-slate-900 mb-1 sm:mb-2 line-clamp-2 leading-tight h-6 sm:h-auto uppercase tracking-tighter sm:tracking-normal">{item.name}</h3>
              
              {/* Detailní výpis toho, co je v košíku pro tuto položku s ovládáním */}
              {totalInCart > 0 && (
                <div className="mb-3 space-y-1 relative z-20">
                   {cart.map((cItem, globalIdx) => {
                     if (cItem.id !== item.id) return null;
                     return (
                       <div key={globalIdx} className="flex items-center justify-between gap-1 text-[7px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-1 sm:gap-2 truncate flex-1">
                             <div className="flex items-center gap-2 bg-white/90 rounded-xl px-2 py-1.5 border-2 border-emerald-200 shrink-0 shadow-sm">
                                <button 
                                   onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(globalIdx, -1); }}
                                   className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-red-50 text-red-500 rounded-lg text-lg sm:text-sm transition-all border-2 border-slate-100 shadow-sm active:scale-90 active:bg-red-100"
                                >
                                   −
                                </button>
                                <span className="w-8 sm:w-8 text-center font-black text-xs sm:text-xs text-slate-900">{cItem.quantity}x</span> 
                                <button 
                                   onClick={(e) => { e.stopPropagation(); updateCartItemQuantity(globalIdx, 1); }}
                                   className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-emerald-50 text-emerald-600 rounded-lg text-lg sm:text-base transition-all border-2 border-slate-100 shadow-sm active:scale-90 active:bg-emerald-100 pb-1.5 sm:pb-1"
                                >
                                   +
                                </button>
                             </div>
                             <span className="truncate italic opacity-80 flex-1">{cItem.upravy && cItem.upravy.length > 0 ? cItem.upravy.join(', ') : 'Základní'}</span>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}

              <p className="hidden sm:block text-slate-500 text-sm font-medium line-clamp-2 h-10 mb-2">{item.description}</p>
              
              {/* Možné varianty */}
              {item.varianty && item.varianty.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                   {item.varianty.map(v => (
                     <span key={v} className="bg-blue-50 text-blue-600 text-[6px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter sm:tracking-normal">
                        {v}
                     </span>
                   ))}
                </div>
              )}

              {/* Možné vylepšení */}
              {item.vylepseni && item.vylepseni.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 sm:mt-1">
                   {item.vylepseni.slice(0, 3).map(v => (
                     <span key={v} className="bg-orange-50 text-orange-600 text-[6px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter sm:tracking-normal">
                        +{v}
                     </span>
                   ))}
                   {item.vylepseni.length > 3 && (
                     <span className="text-slate-400 text-[6px] sm:text-[10px] font-black self-center">
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-40">
          <button onClick={() => setIsOrdering(true)} className="w-full bg-slate-900 text-white p-5 rounded-3xl shadow-2xl flex items-center justify-between hover:scale-105 active:scale-95 transition-all border-4 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg">{cart.reduce((a, b) => a + b.quantity, 0)}</div>
              <span className="font-black text-lg uppercase tracking-wider">Můj Tác</span>
            </div>
          </button>
        </div>
      )}

      {/* Item Customization Modal */}
      {isItemModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-bounce-in">
             <button onClick={() => setIsItemModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 text-xl font-black">✕</button>
             <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedItem.name}</h2>
             <p className="text-slate-500 font-bold mb-6 italic text-sm">"{selectedItem.description}"</p>
             
              {selectedItem.varianty && selectedItem.varianty.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Vyberte variantu (právě jedna):</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedItem.varianty.map(v => (
                            <button 
                                key={v}
                                onClick={() => setSelectedVariant(v)}
                                className={`px-4 py-3 rounded-2xl font-black text-xs transition-all border-2 ${selectedVariant === v ? 'bg-blue-600 border-blue-700 text-white shadow-md scale-105' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-200'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
              )}

              {selectedItem.vylepseni && selectedItem.vylepseni.length > 0 && (
                <div className="mb-6 pt-4 border-t-2 border-slate-50">
                    <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Přidat vylepšení (libovolně):</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedItem.vylepseni.map(enh => (
                            <button 
                                key={enh}
                                onClick={() => setSelectedEnhancements(prev => prev.includes(enh) ? prev.filter(e => e !== enh) : [...prev, enh])}
                                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border-2 ${selectedEnhancements.includes(enh) ? 'bg-orange-100 border-orange-500 text-orange-900 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'}`}
                            >
                                {selectedEnhancements.includes(enh) ? '✅ ' : '+ '}{enh}
                            </button>
                        ))}
                    </div>
                </div>
              )}

             {sauces.length > 0 && selectedItem.category !== 'Nápoje' && (
                <div className="mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vyberte si omáčku / dip:</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {sauces.map(sauce => (
                            <button 
                                key={sauce.id}
                                onClick={() => setSelectedEnhancements(prev => {
                                    // Remove other sauces if one is already selected (usually one sauce per item)
                                    const otherSaucesNames = sauces.map(s => s.name);
                                    const filtered = prev.filter(e => !otherSaucesNames.includes(e));
                                    if (prev.includes(sauce.name)) return filtered;
                                    return [...filtered, sauce.name];
                                })}
                                className={`px-3 py-2 rounded-xl font-bold text-xs text-left transition-all border-2 ${selectedEnhancements.includes(sauce.name) ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'} flex items-center justify-between`}
                            >
                                <span>{sauce.name}</span>
                                {selectedEnhancements.includes(sauce.name) && <span>✅</span>}
                            </button>
                        ))}
                    </div>
                </div>
             )}

             <button onClick={addToCart} className="w-full bg-orange-500 text-white font-black text-xl py-5 rounded-2xl shadow-xl hover:bg-orange-600 active:scale-95 transition-all">
                PŘIDAT NA TÁC 🍕
             </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isOrdering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative no-scrollbar border-4 border-orange-50">
            <button onClick={() => setIsOrdering(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 text-xl font-black">✕</button>
            
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Rekapitulace 📝</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="font-black text-orange-600 uppercase tracking-widest text-sm border-b-4 border-orange-100 pb-2 inline-block">Vaše údaje</h3>
                <form id="checkout-form" onSubmit={handleSubmit}>
                  {!currentUser ? (
                    <GuestCheckoutForm
                      userInfo={userInfo}
                      onUserInfoChange={setUserInfo}
                    />
                  ) : (
                    <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 shadow-sm">
                      <p className="font-black text-emerald-900 text-xl mb-1">{currentUser.firstName} {currentUser.lastName}</p>
                      {currentUser.nickname && <p className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full inline-block">Přezdívka: {currentUser.nickname}</p>}
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest block mt-4">✓ Přihlášený strávník</p>
                    </div>
                  )}

                  <div className="mt-8 space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase ml-4">Vzkaz pro kuchaře</label>
                    <textarea 
                        className="w-full p-6 bg-slate-50 rounded-3xl text-slate-900 border-2 border-slate-100 focus:border-orange-500 outline-none font-bold min-h-[120px] transition-all" 
                        placeholder="Nějaké info pro nás? (Např. bez cibule atd.)" 
                        value={orderNote} 
                        onChange={e => setOrderNote(e.target.value)} 
                    />
                  </div>
                </form>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 flex flex-col h-full border-2 border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 transform rotate-12 scale-150">⚜️</div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-4 pb-2 border-b-2 border-slate-200">Obsah tácu</h3>
                <div className="flex-1 overflow-y-auto max-h-[300px] mb-8 space-y-4 pr-2 no-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-slide-in">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{item.name} <span className="text-orange-500">({item.quantity}x)</span></h4>
                        {item.upravy && item.upravy.length > 0 && (
                          <p className="text-[10px] text-slate-400 font-bold italic mt-1">{item.upravy.join(', ')}</p>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 transition-colors p-2 text-xl font-bold">✕</button>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex justify-between items-center text-slate-900 border-t-2 border-slate-200 pt-6">
                    <span className="font-black text-2xl uppercase">CELKEM</span>
                    <span className="font-black text-2xl text-orange-600">ZDARMA 🎁</span>
                  </div>
                  <Button variant="primary" fullWidth type="submit" form="checkout-form" className="py-5 text-xl font-black rounded-2xl shadow-xl shadow-orange-200 animate-pulse-slow">
                    ODESLAT DO KUCHYNĚ! 🚀
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
