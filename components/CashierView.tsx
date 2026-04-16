
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, User, MenuItem, OrderItem, UserInfo } from '../types';
import { Button } from './Button';

interface CashierViewProps {
  orders: Order[];
  users: User[];
  menuItems: MenuItem[];
  onNewOrder: (order: Order) => void;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  onUpdateOrderFull?: (orderId: string, updatedOrder: Partial<Order>) => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  orders,
  users,
  menuItems,
  onNewOrder,
  onUpdateStatus,
}) => {
  const [isCreatingPOS, setIsCreatingPOS] = useState(false);
  const [posCart, setPosCart] = useState<OrderItem[]>([]);
  const [posUser, setPosUser] = useState<UserInfo>({
    firstName: '', lastName: '', nickname: '', age: '', email: ''
  });
  const [posActiveCategory, setPosActiveCategory] = useState<string>('Vše');
  const [posSearchTerm, setPosSearchTerm] = useState<string>('');
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [posStep, setPosStep] = useState<'items' | 'user'>('items');
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  
  const categories = useMemo(() => ['Vše', ...Array.from(new Set(menuItems.map(i => i.category)))], [menuItems]);

  const filteredMenuItems = useMemo(() => {
    const categoryOrder = ['Jídlo', 'Hlavní jídla', 'Pití', 'Nápoje', 'Sladké', 'Dezerty', 'Doplňky', 'Omáčky & Dipy'];
    
    return menuItems
      .filter(item => {
        const matchesCategory = posActiveCategory === 'Vše' || item.category === posActiveCategory;
        const matchesSearch = item.name.toLowerCase().includes(posSearchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by category first
        const idxA = categoryOrder.findIndex(c => a.category.includes(c));
        const idxB = categoryOrder.findIndex(c => b.category.includes(c));
        const sortA = idxA === -1 ? 999 : idxA;
        const sortB = idxB === -1 ? 999 : idxB;
        
        if (sortA !== sortB) return sortA - sortB;
        // Then by name
        return a.name.localeCompare(b.name);
      });
  }, [menuItems, posActiveCategory, posSearchTerm]);

  const activeOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.PAID);

  // Category Color Map
  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('jídlo') || c.includes('hlavní')) return 'bg-blue-100 border-blue-200 hover:bg-blue-200 shadow-blue-100/20';
    if (c.includes('pití') || c.includes('nápoj')) return 'bg-emerald-100 border-emerald-200 hover:bg-emerald-200 shadow-emerald-100/20';
    if (c.includes('doplňk') || c.includes('omáč')) return 'bg-orange-100 border-orange-200 hover:bg-orange-200 shadow-orange-100/20';
    if (c.includes('sladké') || c.includes('dezert')) return 'bg-purple-100 border-purple-200 hover:bg-purple-200 shadow-purple-100/20';
    return 'bg-slate-100 border-slate-200 hover:bg-slate-200';
  };

  // Unified list of all known persons (registered + guests from history)
  const allUsersForSearch = useMemo(() => {
    // 1. Start with registered users
    const results: Array<UserInfo & { id?: string, isGuest?: boolean }> = users.map(u => ({
      ...u,
      isGuest: false
    }));

    // 2. Add guests from orders who are not already in results
    orders.forEach(order => {
      const { userInfo } = order;
      const alreadyExists = results.some(r => 
        (r.email && r.email === userInfo.email) || 
        (r.firstName === userInfo.firstName && r.lastName === userInfo.lastName)
      );

      if (!alreadyExists) {
        results.push({
          ...userInfo,
          isGuest: true
        });
      }
    });

    return results;
  }, [users, orders]);

  // Derived list of recently used users from history
  const recentUsers = useMemo(() => {
    const unique: Array<UserInfo & { isGuest?: boolean }> = [];
    const sortedOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    for (const order of sortedOrders) {
      if (unique.length >= 8) break;
      const already = unique.some(u => 
        (u.email && u.email === order.userInfo.email) || 
        (u.firstName === order.userInfo.firstName && u.lastName === order.userInfo.lastName)
      );
      if (!already) {
        unique.push({ ...order.userInfo, isGuest: !users.some(u => u.email === order.userInfo.email) });
      }
    }
    return unique;
  }, [orders, users]);

  const handlePosAddToCart = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedVariant(item.varianty?.[0] || null);
    setSelectedEnhancements([]);
    setIsPosModalOpen(true);
  };

  const confirmPosAdd = () => {
    if (!selectedItem) return;
    
    const combinedUpravy = [
       ...(selectedVariant ? [selectedVariant] : []),
       ...selectedEnhancements
    ];

    setPosCart(prev => [...prev, { 
      ...selectedItem, 
      quantity: 1,
      upravy: combinedUpravy
    }]);

    setIsPosModalOpen(false);
  };

  const removeFromPosCart = (index: number) => {
    setPosCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitPOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0 || !posUser.firstName || !posUser.lastName) {
      alert('Zadejte jméno a jídlo!');
      return;
    }

    onNewOrder({
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      orderNumber: 0, 
      items: [...posCart], 
      userInfo: { ...posUser },
      status: OrderStatus.PENDING, 
      createdAt: new Date()
    });
    
    setIsCreatingPOS(false);
    setPosStep('items');
    setPosCart([]);
    setPosUser({ firstName: '', lastName: '', nickname: '', age: '', email: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <header className="mb-6 flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl shadow-sm border-2 border-slate-50">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Kasa & Výdej ⚜️</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Odbavení hostů na stánku</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreatingPOS(true)}
          className="rounded-2xl font-black shadow-lg py-4 px-8 active:scale-95 transition-all text-sm uppercase flex items-center gap-2"
        >
          Nová Objednávka <span className="text-lg pb-0.5">+</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Left Column: Ready for Pickup */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2">
                <span className="bg-orange-500 text-white w-2 h-8 rounded-full"></span>
                K Vydání
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.filter(o => o.status === OrderStatus.COMPLETED).length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white rounded-3xl border-4 border-dashed border-slate-100 text-slate-400 font-bold italic">
                        Zatím nic není připraveno
                    </div>
                ) : (
                    activeOrders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-orange-100 flex flex-col gap-3 animate-bounce-in">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 leading-tight">#{String(order.orderNumber).padStart(2, '0')} {order.userInfo.nickname || order.userInfo.firstName}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{order.userInfo.firstName} {order.userInfo.lastName}</p>
                                </div>
                                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black text-[9px] uppercase">Hotovo</span>
                            </div>
                            <div className="text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl">
                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                            <Button variant="success" fullWidth onClick={() => onUpdateStatus?.(order.id, OrderStatus.PAID)} className="font-black py-4 rounded-xl">
                                VYDÁNO ✅
                            </Button>
                        </div>
                    ))
                )}
            </div>
            
            <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2 pt-6">
                <span className="bg-slate-300 text-white w-2 h-8 rounded-full"></span>
                V Přípravě / Čeká
            </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.filter(o => o.status !== OrderStatus.COMPLETED).map(order => (
                    <div key={order.id} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex justify-between items-center opacity-75">
                         <div>
                            <h3 className="font-black text-slate-900">#{String(order.orderNumber).padStart(3, '0')} {order.userInfo.nickname || order.userInfo.firstName}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{order.status === OrderStatus.PENDING ? 'Čeká v pořadí' : 'V kuchyni'}</p>
                        </div>
                        <span className="text-slate-400">⏳</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Column: Mini-Dashboard */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl h-fit sticky top-6">
            <h3 className="font-black text-orange-400 uppercase tracking-widest text-[9px] mb-6">Statistiky Stánku</h3>
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Vydaných porcí celkem</label>
                    <p className="text-5xl font-black text-white">{orders.filter(o => o.status === OrderStatus.PAID).reduce((acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0), 0)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Aktivní fronta</label>
                        <p className="text-2xl font-black text-orange-400">{activeOrders.length}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Tržba Celkem</label>
                        <p className="text-2xl font-black text-emerald-400">
                          {orders
                            .filter(o => o.status === OrderStatus.PAID)
                            .reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + (i.price * i.quantity), 0), 0)
                          },- Kč
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {isCreatingPOS && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[200] flex p-1 md:p-3 overflow-hidden">
          <div className="bg-white w-full h-full rounded-xl flex flex-col lg:flex-row overflow-hidden shadow-2xl relative border border-slate-200">
            <button onClick={() => setIsCreatingPOS(false)} className="absolute top-2 right-4 text-slate-400 hover:text-slate-900 text-xl font-black z-[210]">✕</button>
            
            {/* POS Left: Menu */}
            {posStep === 'items' && (
              <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 min-h-0">
                <div className="p-2 bg-slate-50 flex flex-nowrap overflow-x-auto gap-1 no-scrollbar shrink-0 border-b border-slate-100 italic">
                  {categories.map(cat => (
                     <button key={cat} onClick={() => setPosActiveCategory(cat)} className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all whitespace-nowrap ${posActiveCategory === cat ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>{cat}</button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-1.5 no-scrollbar bg-white">
                  {filteredMenuItems.map(item => (
                     <button 
                        key={item.id} 
                        onClick={() => !item.isSoldOut && handlePosAddToCart(item)} 
                        className={`p-2 rounded-lg border shadow-sm transition-all text-left flex items-start gap-2 active:scale-[0.98] group relative 
                          ${getCategoryColor(item.category)} 
                          ${item.isSoldOut ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-md'}`}
                     >
                        {item.isSoldOut && (
                          <div className="absolute top-1 right-1 bg-red-500 text-white text-[6px] font-black px-1 rounded-sm z-10 animate-pulse">VYPRODÁNO</div>
                        )}
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                           {item.image ? (
                             <img src={item.image} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-xl">🍽️</span>
                           )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                           <div className="font-black text-[13px] text-slate-900 leading-tight mb-1 truncate">{item.name}</div>
                           <div className="flex flex-wrap gap-1">
                              {item.varianty?.slice(0, 2).map(v => (
                                <span key={v} className="text-[9px] font-black bg-white/80 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-200 uppercase tracking-tight">{v}</span>
                              ))}
                              {item.vylepseni?.slice(0, 2).map(v => (
                                <span key={v} className="text-[9px] font-black bg-white/80 text-orange-600 px-1.5 py-0.5 rounded-md border border-orange-200 uppercase tracking-tight">+{v}</span>
                              ))}
                           </div>
                        </div>
                     </button>
                  ))}
                </div>
              </div>
            )}

            {/* POS Right: Side Panel */}
            <div className={`w-full ${posStep === 'items' ? 'lg:w-72 border-l border-slate-100' : 'flex-1'} bg-white flex flex-col shrink-0 p-3 overflow-hidden`}>
              {posStep === 'items' ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-black text-sm text-slate-900 uppercase tracking-tight">Tác / Košík</h2>
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Fáze 1</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 mb-3 no-scrollbar pr-1">
                    {posCart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-10">
                        <span className="text-4xl mb-2">🛒</span>
                        <p className="font-black uppercase text-[8px] tracking-widest">Prázdno</p>
                      </div>
                    ) : (
                      posCart.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex justify-between items-center">
                              <div className="font-black text-[10px] text-slate-800 leading-none">{item.quantity}x {item.name}</div>
                              <button onClick={() => removeFromPosCart(idx)} className="text-red-300 hover:text-red-500 text-xs px-1">✕</button>
                          </div>
                          {item.upravy && item.upravy.length > 0 && (
                              <div className="text-[8px] font-bold text-slate-400 italic leading-none mt-1">
                                  {item.upravy.join(', ')}
                              </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Button 
                      variant="primary" 
                      fullWidth 
                      disabled={posCart.length === 0}
                      onClick={() => setPosStep('user')} 
                      className="py-3 text-xs font-black rounded-lg shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 transition-all uppercase"
                    >
                        DALŠÍ: Strávník 👤
                    </Button>
                  </div>
                </>
              ) : (
                <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col h-full animate-slide-in p-2">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="font-black text-xl text-slate-900 uppercase tracking-tight">Kdo to bude?</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Krok 2/2</p>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1 ml-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Najít nebo vybrat strávníka</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                      </div>
                      <div className="relative">
                        <input 
                          className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-xl font-black text-base focus:border-orange-500 outline-none pr-10 shadow-inner" 
                          placeholder="Přezdívka, jméno..." 
                          value={userSearchTerm} 
                          onChange={e => setUserSearchTerm(e.target.value)} 
                        />
                        <span className="absolute right-4 top-[14px] text-xl opacity-20">🔍</span>
                        
                        {userSearchTerm.trim().length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 mt-1 rounded-xl shadow-2xl z-[220] max-h-48 overflow-y-auto no-scrollbar ring-4 ring-slate-900/5">
                            {allUsersForSearch.filter(u => 
                                `${u.firstName} ${u.lastName} ${u.nickname}`.toLowerCase().includes(userSearchTerm.toLowerCase())
                            ).length === 0 ? (
                                <div className="p-4 text-center text-slate-400 font-bold italic text-[10px]">Bez výsledku...</div>
                            ) : (
                                allUsersForSearch.filter(u => 
                                  `${u.firstName} ${u.lastName} ${u.nickname}`.toLowerCase().includes(userSearchTerm.toLowerCase())
                                ).map((u, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => {
                                      setPosUser({
                                        firstName: u.firstName,
                                        lastName: u.lastName || '',
                                        nickname: u.nickname || '',
                                        age: u.age || '',
                                        email: u.email || ''
                                      });
                                      setUserSearchTerm('');
                                    }}
                                    className="w-full p-3 hover:bg-orange-50 border-b border-slate-50 flex justify-between items-center transition-colors group"
                                  >
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                          <div className="font-black text-sm text-slate-900 group-hover:text-orange-600 truncate">{u.firstName} {u.lastName}</div>
                                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm ${u.isGuest ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                            {u.isGuest ? 'GUEST' : 'SKAUT'}
                                          </span>
                                        </div>
                                    </div>
                                    <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[8px] font-black uppercase">Vybrat</div>
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Recent Users Bar */}
                      {recentUsers.length > 0 && (
                        <div className="mt-3">
                           <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5 ml-1">Nedávní strávníci</div>
                           <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                              {recentUsers.map((u, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => setPosUser({
                                    firstName: u.firstName,
                                    lastName: u.lastName || '',
                                    nickname: u.nickname || '',
                                    age: u.age || '',
                                    email: u.email || ''
                                  })}
                                  className="flex items-center gap-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3 py-1.5 rounded-lg transition-all shrink-0 group shadow-sm"
                                >
                                  <div className={`w-2 h-2 rounded-full ${u.isGuest ? 'bg-slate-300' : 'bg-blue-400'} group-hover:scale-125 transition-transform`}></div>
                                  <span className="text-[10px] font-black text-slate-600 group-hover:text-orange-600 whitespace-nowrap">{u.firstName} {u.lastName || u.nickname}</span>
                                </button>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Jméno</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs" value={posUser.firstName} onChange={e => setPosUser({...posUser, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Příjmení</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs" value={posUser.lastName} onChange={e => setPosUser({...posUser, lastName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Přezdívka</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs" value={posUser.nickname} onChange={e => setPosUser({...posUser, nickname: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Věk</label>
                        <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs text-center" type="number" value={posUser.age} onChange={e => setPosUser({...posUser, age: e.target.value})} />
                      </div>
                    </div>

                    <div className="pt-4 mt-2">
                       <button 
                        onClick={() => {
                          if (!posUser.firstName) {
                            return;
                          }
                          const newUser: User = {
                            id: Math.random().toString(36).substr(2, 9),
                            ...posUser,
                            age: Number(posUser.age) || 0,
                            email: posUser.email || `${posUser.firstName.toLowerCase()}.${posUser.lastName.toLowerCase()}@skaut.cz`,
                            password: 'skauti2026' // Výchozí heslo
                          };
                          // @ts-ignore
                          onRegister(newUser);
                        }}
                        className="w-full p-4 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-all group"
                       >
                          <span className="text-xl group-hover:scale-125 transition-transform">⚜️</span>
                          <div className="text-left">
                             <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Založit oficiální profil</div>
                             <div className="text-[8px] font-bold text-blue-400">Přidat strávníka trvale do systému</div>
                          </div>
                       </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-2 mt-auto">
                    <button onClick={() => setPosStep('items')} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">ZPĚT</button>
                    <Button variant="success" className="flex-[3] py-4 text-sm font-black rounded-lg uppercase shadow-lg active:scale-95 transition-all" onClick={handleSubmitPOS}>
                        POTVRDIT OBJEDNÁVKU 🚀
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    {/* POS Selection Modal */}
    {isPosModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative animate-scale-in">
                <button onClick={() => setIsPosModalOpen(false)} className="absolute top-6 right-8 text-slate-300 hover:text-slate-900 text-xl font-black">✕</button>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                       {selectedItem.image ? (
                         <img src={selectedItem.image} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-3xl">🍽️</span>
                       )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{selectedItem.name}</h2>
                        <p className="text-sm font-bold text-slate-400 italic line-clamp-2">"{selectedItem.description}"</p>
                    </div>
                </div>

                {/* Varianty */}
                {selectedItem.varianty && selectedItem.varianty.length > 0 && (
                    <div className="mb-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Vyberte variantu</label>
                        <div className="flex flex-wrap gap-2">
                            {selectedItem.varianty.map(v => (
                                <button 
                                    key={v}
                                    onClick={() => setSelectedVariant(v)}
                                    className={`px-6 py-3 rounded-xl font-black text-xs transition-all border-2 ${selectedVariant === v ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vylepšení */}
                {selectedItem.vylepseni && selectedItem.vylepseni.length > 0 && (
                    <div className="mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Doplňky a vylepšení</label>
                        <div className="flex flex-wrap gap-2">
                            {selectedItem.vylepseni.map(v => {
                                const isSelected = selectedEnhancements.includes(v);
                                return (
                                    <button 
                                        key={v}
                                        onClick={() => {
                                            if (isSelected) setSelectedEnhancements(prev => prev.filter(e => e !== v));
                                            else setSelectedEnhancements(prev => [...prev, v]);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all border-2 ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-50 border-slate-50 text-slate-400'} flex items-center justify-center gap-1`}
                                    >
                                        {isSelected ? '✓ ' : <span className="text-xs pb-0.5">+</span>}{v}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <Button variant="primary" fullWidth onClick={confirmPosAdd} className="py-5 text-lg font-black rounded-2xl shadow-xl shadow-orange-100">
                    PŘIDAT DO ŠTÍTKU 🛒
                </Button>
            </div>
        </div>
    )}
    </div>
  );
};
