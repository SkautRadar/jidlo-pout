
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Order, OrderStatus, User } from '../types';

interface OrderTrackingViewProps {
  orders: Order[];
  currentUser?: User | null;
  isAdmin?: boolean;
  guestOrderIds?: string[];
  guestSavedOrderNumbers?: number[];
  onBack?: () => void;
}

interface NotificationToast {
  id: string;
  orderNumber: number;
  message: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orders, currentUser, isAdmin = false, guestOrderIds = [], guestSavedOrderNumbers = [], onBack }) => {
  const prevOrderStatusesRef = useRef<Map<string, OrderStatus>>(new Map());
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode); gainNode.connect(ctx.destination);
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(freq, now + index * 0.1);
        gainNode.gain.setValueAtTime(0, now + index * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + index * 0.1 + 0.3);
        oscillator.start(now + index * 0.1); oscillator.stop(now + index * 0.1 + 0.4);
      });
    } catch (e) {}
  }, []);

  useEffect(() => {
    const prevStatuses = prevOrderStatusesRef.current;
    orders.forEach(order => {
      const prevStatus = prevStatuses.get(order.id);
      if (prevStatus !== undefined && prevStatus !== OrderStatus.COMPLETED && order.status === OrderStatus.COMPLETED) {
        playNotificationSound();
        const id = `${Date.now()}-${order.orderNumber}`;
        setNotifications(prev => [...prev, { id, orderNumber: order.orderNumber, message: `Objednávka #${order.orderNumber} je připravena!` }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
      }
      prevStatuses.set(order.id, order.status);
    });
    prevOrderStatusesRef.current = prevStatuses;
  }, [orders, playNotificationSound]);

  const visibleOrders = orders.filter(o => {
    if (isAdmin) return true;
    if (currentUser && o.userInfo?.email === currentUser.email) return true;
    if (guestOrderIds?.includes(o.id)) return true;
    return false;
  }).slice().reverse();

  const activeOrders = visibleOrders.filter(o => o.status !== OrderStatus.PAID && o.status !== OrderStatus.CANCELLED);
  const historyOrders = currentUser ? visibleOrders.filter(o => o.status === OrderStatus.PAID || o.status === OrderStatus.CANCELLED) : [];

  const handleSearchByOrderNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = parseInt(orderNumberInput, 10);
    if (Number.isNaN(orderNumber)) {
      setSearchedOrder(null);
      return;
    }
    const found = orders.find(o => o.orderNumber === orderNumber) || null;
    setSearchedOrder(found);
  };

  const renderOrderCard = (order: Order, highlightDone = true) => (
    <div key={order.id} className={`bg-white rounded-[3rem] shadow-sm border-2 overflow-hidden transition-all ${highlightDone && order.status === OrderStatus.COMPLETED ? 'border-orange-500 scale-105 shadow-xl shadow-orange-100' : 'border-slate-50'}`}>
      <div className={`px-8 py-6 flex justify-between items-center ${order.status === OrderStatus.COMPLETED ? 'bg-orange-50/50' : 'bg-slate-50/30'}`}>
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner ${order.status === OrderStatus.COMPLETED ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>
            {order.status === OrderStatus.PENDING ? '⏳' : order.status === OrderStatus.ACCEPTED ? '👨‍🍳' : order.status === OrderStatus.PAID ? '✅' : order.status === OrderStatus.CANCELLED ? '⛔' : '📢'}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">#{String(order.orderNumber).padStart(3, '0')}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stav: {
              order.status === OrderStatus.PENDING ? 'Čeká v frontě' :
              order.status === OrderStatus.ACCEPTED ? 'V kuchyni' :
              order.status === OrderStatus.COMPLETED ? 'K vyzvednutí' :
              order.status === OrderStatus.PAID ? 'Vydáno' : 'Zrušeno'
            }</p>
          </div>
        </div>
        {order.status === OrderStatus.COMPLETED && (
          <span className="bg-orange-500 text-white px-6 py-2 rounded-full font-black text-sm uppercase animate-pulse">Připraveno</span>
        )}
      </div>

      <div className="p-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {order.items.map((item, idx) => (
            <span key={idx} className="bg-slate-50 px-4 py-2 rounded-2xl font-bold text-slate-700 text-sm border-2 border-slate-100">
              <span className="text-orange-600 font-black">{item.quantity}x</span> {item.name}
            </span>
          ))}
        </div>

        {order.note && (
          <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200">
            <p className="text-xs font-black text-orange-600 uppercase tracking-wide mb-2">Poznámka pro kuchaře</p>
            <p className="text-sm font-semibold text-orange-900">{order.note}</p>
          </div>
        )}

        {order.status !== OrderStatus.PAID && order.status !== OrderStatus.CANCELLED && (
          <div className="relative pt-4">
            <div className="h-4 bg-slate-50 rounded-full border-2 border-slate-100 overflow-hidden">
              <div className={`h-full transition-all duration-1000 ${order.status === OrderStatus.COMPLETED ? 'bg-orange-500 w-full' : order.status === OrderStatus.ACCEPTED ? 'bg-orange-400 w-2/3' : 'bg-orange-300 w-1/3'}`} />
            </div>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mt-2 px-1">
              <span>Přijato</span>
              <span>Příprava</span>
              <span>Hotovo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      <div className="mb-6 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm transition-all hover:border-orange-200 hover:text-orange-600 active:scale-95"
          >
            <span className="text-base leading-none">←</span>
            Zpět na nabídku
          </button>
        ) : (
          <div />
        )}
      </div>

      {notifications.map(n => (
        <div key={n.id} className="fixed top-6 right-6 z-50 bg-orange-500 text-white p-6 rounded-3xl shadow-2xl border-4 border-orange-200 animate-bounce-in">
           <h4 className="font-black text-xl">OBJEDNÁVKA PŘIPRAVENA! 🔔</h4>
           <p className="font-bold opacity-90">Číslo #{String(n.orderNumber).padStart(3, '0')} je k vyzvednutí.</p>
        </div>
      ))}

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Sledování Objednávek 📺</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Dohlédněte si na své dobroty</p>
      </header>

      <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Najít podle čísla objednávky</p>
        <form onSubmit={handleSearchByOrderNumber} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={orderNumberInput}
            onChange={e => setOrderNumberInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Např. 042"
            className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-base font-bold text-slate-900 outline-none focus:border-orange-400 focus:bg-white"
          />
          <button
            type="submit"
            className="min-h-[48px] rounded-xl bg-orange-500 px-5 text-sm font-black uppercase tracking-[0.1em] text-white shadow-md hover:bg-orange-600"
          >
            Vyhledat
          </button>
        </form>

        {orderNumberInput.length > 0 && (
          <div className="mt-3 text-sm font-semibold">
            {searchedOrder ? (
              <p className="text-emerald-700">Objednávka #{String(searchedOrder.orderNumber).padStart(3, '0')} nalezena.</p>
            ) : (
              <p className="text-red-600">Objednávka nebyla nalezena.</p>
            )}
          </div>
        )}

        {!currentUser && guestSavedOrderNumbers.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Uložené objednávky tohoto zařízení</p>
            <div className="flex flex-wrap gap-2">
              {guestSavedOrderNumbers.map((num, idx) => (
                <button
                  key={`${num}-${idx}`}
                  type="button"
                  onClick={() => {
                    setOrderNumberInput(String(num));
                    const found = orders.find(o => o.orderNumber === num) || null;
                    setSearchedOrder(found);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                >
                  #{String(num).padStart(3, '0')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {searchedOrder && (
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Výsledek hledání</h2>
          {renderOrderCard(searchedOrder, false)}
        </div>
      )}

      {currentUser && (
        <div className="mb-10 rounded-[2rem] border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Můj účet a historie</h2>
          <p className="mt-1 text-sm font-semibold text-blue-900">Přihlášen jako {currentUser.firstName} {currentUser.lastName}. Zde vidíte aktivní objednávky i historii.</p>
        </div>
      )}

      <div className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 italic font-bold text-slate-400">
             Zatím tu nic není. Objednejte si něco dobrého! 🍕
          </div>
        ) : (
          activeOrders.map(order => renderOrderCard(order))
        )}
      </div>

      {historyOrders.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Historie objednávek</h2>
          <div className="space-y-6">
            {historyOrders.map(order => renderOrderCard(order, false))}
          </div>
        </div>
      )}
    </div>
  );
};
