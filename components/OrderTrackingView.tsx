
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Order, OrderStatus, User } from '../types';

interface OrderTrackingViewProps {
  orders: Order[];
  currentUser?: User | null;
  isAdmin?: boolean;
  guestOrderIds?: string[];
  onBack?: () => void;
}

interface NotificationToast {
  id: string;
  orderNumber: number;
  message: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orders, currentUser, isAdmin = false, guestOrderIds = [], onBack }) => {
  const prevOrderStatusesRef = useRef<Map<string, OrderStatus>>(new Map());
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const activeOrders = orders.filter(o => {
    if (o.status === OrderStatus.PAID || o.status === OrderStatus.CANCELLED) return false;
    if (isAdmin) return true;
    if (currentUser && o.userInfo?.email === currentUser.email) return true;
    if (guestOrderIds?.includes(o.id)) return true;
    return false;
  }).slice().reverse();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {onBack && (
        <button onClick={onBack} className="mb-6 text-slate-400 hover:text-orange-600 font-black uppercase text-xs transition-colors py-2">
          ← Zpět na nabídku
        </button>
      )}

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

      <div className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 italic font-bold text-slate-400">
             Zatím tu nic není. Objednejte si něco dobrého! 🍕
          </div>
        ) : (
          activeOrders.map(order => (
            <div key={order.id} className={`bg-white rounded-[3rem] shadow-sm border-2 overflow-hidden transition-all ${order.status === OrderStatus.COMPLETED ? 'border-orange-500 scale-105 shadow-xl shadow-orange-100' : 'border-slate-50'}`}>
              <div className={`px-8 py-6 flex justify-between items-center ${order.status === OrderStatus.COMPLETED ? 'bg-orange-50/50' : 'bg-slate-50/30'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner ${order.status === OrderStatus.COMPLETED ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>
                    {order.status === OrderStatus.PENDING ? '⏳' : order.status === OrderStatus.ACCEPTED ? '👨‍🍳' : '📢'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-none">#{String(order.orderNumber).padStart(3, '0')}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Stav: {
                      order.status === OrderStatus.PENDING ? 'Čeká v frontě' :
                      order.status === OrderStatus.ACCEPTED ? 'V kuchyni' : 'K vyzvednutí'
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

                 {order.status === OrderStatus.COMPLETED && (
                    <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 flex items-center gap-4 text-emerald-900 font-bold">
                        <span className="text-3xl">👋</span>
                        <span>Vaše jídlo je připraveno! Prosím zastavte se u výdejního okénka.</span>
                    </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
