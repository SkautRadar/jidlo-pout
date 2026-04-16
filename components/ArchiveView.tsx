
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';

interface ArchiveViewProps {
  orders: Order[];
}

type Tab = 'STATS' | 'HISTORY';

export const ArchiveView: React.FC<ArchiveViewProps> = ({ orders }) => {
  const [activeTab, setActiveTab] = useState<Tab>('STATS');

  const paidOrders = useMemo(() => 
    orders.filter(o => o.status === OrderStatus.PAID || (o.isPaid && o.status === OrderStatus.COMPLETED)),
    [orders]
  );
  
  const totalRevenue = useMemo(() => 
    paidOrders.reduce((acc, o) => acc + o.totalPrice, 0),
    [paidOrders]
  );

  // Statistiky prodejnosti
  const itemStats = useMemo(() => {
    const stats: Record<string, { name: string, quantity: number, revenue: number }> = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!stats[item.id]) {
          stats[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        stats[item.id].quantity += item.quantity;
        stats[item.id].revenue += item.quantity * item.price;
      });
    });
    return Object.values(stats).sort((a, b) => b.quantity - a.quantity);
  }, [paidOrders]);

  const maxQuantity = itemStats.length > 0 ? itemStats[0].quantity : 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Archiv Tržeb 📊</h1>
        <p className="text-slate-700 font-bold">Přehled uzavřených objednávek a analýza prodejů</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center border-b-8 border-orange-600">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">CELKOVÁ TRŽBA</span>
          <span className="text-5xl font-black tracking-tighter">{totalRevenue} Kč</span>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200 flex flex-col justify-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Uzavřené účty</span>
          <span className="text-4xl font-black text-slate-900">{paidOrders.length}</span>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200 flex flex-col justify-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Průměrná útrata</span>
          <span className="text-4xl font-black text-slate-900">{paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0} Kč</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-slate-200 p-2 rounded-2xl w-fit border border-slate-300">
        <button 
          onClick={() => setActiveTab('STATS')}
          className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
            activeTab === 'STATS' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📈 Statistiky
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
            activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📜 Historie Účtenek
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden text-slate-900">
        {activeTab === 'STATS' ? (
          <div className="p-8">
            <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">🔥</span>
              Nejprodávanější položky
            </h3>
            <div className="space-y-8">
              {itemStats.length === 0 ? (
                <p className="text-center py-10 text-slate-400 font-bold italic">Zatím žádné prodeje.</p>
              ) : (
                itemStats.map((stat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end px-1">
                      <div>
                        <span className="font-black text-lg">{stat.name}</span>
                        <span className="ml-3 text-xs font-black text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                          {stat.quantity}x prodáno
                        </span>
                      </div>
                      <span className="font-black text-slate-500 text-sm">{stat.revenue} Kč</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(stat.quantity / maxQuantity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-widest">Host / Čas</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-widest">Objednávka</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-800 uppercase tracking-widest text-right">Částka</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100">
                {paidOrders.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-16 text-center text-slate-500 font-black italic">Archiv je zatím prázdný.</td></tr>
                ) : (
                  paidOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-black text-lg">#{String(order.orderNumber).padStart(3, '0')} {order.userInfo.name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">{order.createdAt.toLocaleString('cs-CZ')}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="bg-white border-2 border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
                              <span className="text-orange-600 font-black">{item.quantity}x</span> {item.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="text-2xl font-black text-slate-900">{order.totalPrice} Kč</div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Hrazeno hotově</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
