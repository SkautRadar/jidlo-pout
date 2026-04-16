
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
  const [selectedQuantity, setSelectedQuantity] = useState(1);
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

  // Statistics
  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(o => o.userInfo.email || `${o.userInfo.firstName}-${o.userInfo.lastName}`)).size;
  
  const topItems = useMemo(() => {
    const itemCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [orders]);

  const getPosCustomizationSignature = (upravy: string[] = []) => JSON.stringify(upravy);

  const addItemToPosCart = (item: MenuItem, quantity = 1, upravy: string[] = []) => {
    setPosCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id && getPosCustomizationSignature(cartItem.upravy || []) === getPosCustomizationSignature(upravy));

      if (existing) {
        return prev.map(cartItem => (
          cartItem === existing ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem
        ));
      }

      return [...prev, {
        ...item,
        quantity,
        upravy
      }];
    });
  };

  const updatePosCartItemQuantity = (index: number, change: number) => {
    setPosCart(prev => prev
      .map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextQuantity = item.quantity + change;
        if (nextQuantity <= 0) return null;
        return { ...item, quantity: nextQuantity };
      })
      .filter(Boolean) as OrderItem[]
    );
  };

  const hasCustomizationOptions = (item: MenuItem) => Boolean(
    (item.varianty && item.varianty.length > 0) ||
    (item.vylepseni && item.vylepseni.length > 0) ||
    (item.options && item.options.length > 0)
  );

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
    if (!hasCustomizationOptions(item)) {
      addItemToPosCart(item, 1, []);
      return;
    }

    setSelectedItem(item);
    setSelectedVariant(item.varianty?.[0] || null);
    setSelectedEnhancements([]);
    setSelectedQuantity(1);
    setIsPosModalOpen(true);
  };

  const confirmPosAdd = () => {
    if (!selectedItem) return;
    
    const combinedUpravy = [
       ...(selectedVariant ? [selectedVariant] : []),
       ...selectedEnhancements
    ];

    addItemToPosCart(selectedItem, selectedQuantity, combinedUpravy);

    setIsPosModalOpen(false);
    setSelectedQuantity(1);
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
    <div className="p-3 md:p-6 w-full h-full flex flex-col bg-white">
      <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Kasa</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Výdej objednávek</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreatingPOS(true)}
          className="rounded-xl font-black shadow-lg py-4 px-6 active:scale-95 transition-all text-sm uppercase"
        >
          Nová Objednávka
        </Button>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-4 lg:gap-6">
        <div className="min-h-0 overflow-y-auto pr-2 no-scrollbar">
          {activeOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <div className="text-center">
                <p className="text-5xl mb-3">🍽️</p>
                <p className="text-slate-400 text-lg font-bold">Žádné objednávky</p>
                <p className="text-slate-300 text-sm mt-2">Vše je vyřešeno</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ready for Delivery - Hotové */}
              {activeOrders.filter(o => o.status === OrderStatus.COMPLETED).length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    K Vydání ({activeOrders.filter(o => o.status === OrderStatus.COMPLETED).length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {activeOrders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
                      <div key={order.id} className="bg-emerald-50 rounded-lg border-2 border-emerald-200 p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-black text-slate-900">#{String(order.orderNumber).padStart(2, '0')}</h3>
                            <p className="text-sm font-bold text-slate-700">{order.userInfo.nickname || order.userInfo.firstName}</p>
                          </div>
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full font-black text-xs whitespace-nowrap shrink-0">Hotovo</span>
                        </div>

                        <div className="bg-white p-3 rounded-lg space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm font-bold text-slate-800">
                              <span className="text-emerald-600 font-black">{item.quantity}x</span> {item.name}
                            </div>
                          ))}
                        </div>

                        {order.note && (
                          <div className="bg-white border-l-4 border-amber-400 p-3 rounded-r-lg">
                            <p className="text-xs font-black text-amber-700 uppercase mb-1">Poznámka</p>
                            <p className="text-sm font-semibold text-amber-900">"{order.note}"</p>
                          </div>
                        )}

                        <button
                          onClick={() => onUpdateStatus?.(order.id, OrderStatus.PAID)}
                          className="w-full py-3 bg-emerald-500 text-white font-black text-sm uppercase rounded-lg hover:bg-emerald-600 active:scale-95 transition-all"
                        >
                          Vydáno
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress - V přípravě */}
              {activeOrders.filter(o => o.status !== OrderStatus.COMPLETED).length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    V Přípravě ({activeOrders.filter(o => o.status !== OrderStatus.COMPLETED).length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {activeOrders.filter(o => o.status !== OrderStatus.COMPLETED).map(order => (
                      <div key={order.id} className={`rounded-lg border-2 p-4 flex flex-col gap-3 ${order.status === OrderStatus.PENDING ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-black text-slate-900">#{String(order.orderNumber).padStart(2, '0')}</h3>
                            <p className="text-sm font-bold text-slate-700">{order.userInfo.nickname || order.userInfo.firstName}</p>
                            <p className={`text-xs font-black uppercase mt-1 ${order.status === OrderStatus.PENDING ? 'text-orange-600' : 'text-blue-600'}`}>
                              {order.status === OrderStatus.PENDING ? 'Čeká' : 'V kuchyni'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm font-bold text-slate-800">
                              <span className={`font-black ${order.status === OrderStatus.PENDING ? 'text-orange-600' : 'text-blue-600'}`}>{item.quantity}x</span> {item.name}
                            </div>
                          ))}
                        </div>

                        {order.note && (
                          <div className="bg-white border-l-4 border-amber-400 p-3 rounded-r-lg">
                            <p className="text-xs font-black text-amber-700 uppercase mb-1">Poznámka</p>
                            <p className="text-sm font-semibold text-amber-900">"{order.note}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 h-fit lg:sticky lg:top-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Statistiky</h3>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-[11px] font-black text-blue-600 uppercase tracking-wider">Objednávek</p>
              <p className="text-2xl font-black text-blue-900 mt-1">{totalOrders}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Zákazníků</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{uniqueCustomers}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
              <p className="text-[11px] font-black text-orange-600 uppercase tracking-wider mb-2">Top 3 položky</p>
              <div className="space-y-1.5">
                {topItems.length === 0 ? (
                  <p className="text-sm text-orange-700 font-bold">Bez dat</p>
                ) : (
                  topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-bold text-orange-900 truncate">{idx + 1}. {item.name}</span>
                      <span className="font-black text-orange-600 shrink-0">{item.count}x</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
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
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-black text-sm text-slate-900 uppercase tracking-tight">Tác / Košík</h2>
                    <span className="self-start bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase sm:self-auto">Fáze 1</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-1 mb-3 no-scrollbar pr-1">
                    {posCart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-10">
                        <span className="text-4xl mb-2">🛒</span>
                        <p className="font-black uppercase text-[8px] tracking-widest">Prázdno</p>
                      </div>
                    ) : (
                      posCart.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex shrink-0 items-center rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">{item.quantity}x</span>
                                  <div className="min-w-0 font-black text-[11px] text-slate-900 leading-tight truncate">{item.name}</div>
                                </div>
                                {item.upravy && item.upravy.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {item.upravy.map((uprava, upravaIdx) => (
                                      <span
                                        key={`${idx}-${upravaIdx}-${uprava}`}
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-tight ${upravaIdx === 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}
                                      >
                                        {upravaIdx === 0 ? 'VAR' : 'ADD'} · {uprava}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeFromPosCart(idx)} className="text-red-300 hover:text-red-500 text-xs px-1 shrink-0">✕</button>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => updatePosCartItemQuantity(idx, -1)} className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-base font-black text-slate-700 shadow-sm active:scale-95">−</button>
                              <span className="w-8 text-center text-xs font-black text-slate-900">{item.quantity}x</span>
                              <button onClick={() => updatePosCartItemQuantity(idx, 1)} className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-base font-black text-slate-700 shadow-sm active:scale-95">+</button>
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">v tácu</span>
                          </div>
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
      <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="relative flex h-[92svh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] rounded-t-[2rem]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                 {selectedItem.image ? (
                 <img src={selectedItem.image} className="h-full w-full object-cover" />
                 ) : (
                 <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
                 )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Položka v POS</p>
                <h2 className="truncate text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl">{selectedItem.name}</h2>
                {selectedItem.description && (
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{selectedItem.description}</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsPosModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-lg font-black text-slate-400 transition-colors hover:text-slate-900">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar space-y-5">
            {selectedItem.varianty && selectedItem.varianty.length > 0 && (
              <section>
                <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Vyberte variantu</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedItem.varianty.map(v => (
                    <button 
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-xl border-2 px-4 py-3 text-xs font-black transition-all ${selectedVariant === v ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Co se vloží na tác</label>
              <div className="flex flex-wrap gap-2">
                {selectedVariant ? (
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-tight text-blue-700">
                    VARIANTA · {selectedVariant}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400">
                    Bez varianty
                  </span>
                )}

                {selectedEnhancements.length > 0 ? (
                  selectedEnhancements.map((enh, idx) => (
                    <span
                      key={`${enh}-${idx}`}
                      className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-black uppercase tracking-tight text-orange-700"
                    >
                      + {enh}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400">
                    Bez doplňků
                  </span>
                )}
              </div>
            </section>

            {selectedItem.vylepseni && selectedItem.vylepseni.length > 0 && (
              <section>
                <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Doplňky a vylepšení</label>
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
                        className={`rounded-lg border-2 px-3 py-2 text-[10px] font-black transition-all ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-100 bg-white text-slate-500 hover:border-orange-200'}`}
                      >
                        {isSelected ? '✓ ' : '+ '}{v}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-slate-400">Množství</label>
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button type="button" onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-black text-slate-700 active:scale-95">−</button>
                  <span className="w-12 text-center text-base font-black text-slate-900">{selectedQuantity}</span>
                  <button type="button" onClick={() => setSelectedQuantity(q => Math.min(20, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-black text-slate-700 active:scale-95">+</button>
                </div>
                <p className="text-xs font-semibold text-slate-500">Rychlé přidání do tácu</p>
              </div>
            </section>
          </div>

          <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
            <Button variant="primary" fullWidth onClick={confirmPosAdd} className="min-h-[56px] rounded-2xl py-4 text-base font-black shadow-xl shadow-orange-100">
              Přidat na tác
            </Button>
          </div>
            </div>
        </div>
    )}
    </div>
  );
};
