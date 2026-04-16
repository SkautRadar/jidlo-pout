
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Button } from './Button';

interface AdminViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ orders, onUpdateStatus }) => {
  const [cancelOrderModal, setCancelOrderModal] = useState<Order | null>(null);

  const kitchenOrders = orders.filter(o =>
    o.status === OrderStatus.PENDING || 
    o.status === OrderStatus.ACCEPTED
  );

  const confirmCancelOrder = () => {
    if (cancelOrderModal) {
      onUpdateStatus(cancelOrderModal.id, OrderStatus.CANCELLED);
      setCancelOrderModal(null);
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Kuchyně 👨‍🍳</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Přehled k přípravě</p>
        </div>
        <div className="text-[10px] font-black text-slate-300 uppercase">Aktivní: {kitchenOrders.length}</div>
      </header>

      {kitchenOrders.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-10 text-center border-4 border-dashed border-slate-100">
          <p className="text-slate-300 text-2xl mb-2">🍳</p>
          <p className="text-slate-400 text-sm font-black italic">V kuchyni je klid.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {kitchenOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(order => (
            <div key={order.id} className={`group bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-md relative overflow-hidden ${order.status === OrderStatus.PENDING ? 'ring-2 ring-orange-500/20' : ''}`}>
              {/* Status Ribbon */}
              <div className={`absolute top-0 right-0 left-0 h-1 ${order.status === OrderStatus.PENDING ? 'bg-orange-500' : 'bg-blue-500'}`} />
              
              <div className={`p-3 flex justify-between items-start border-b ${order.status === OrderStatus.PENDING ? 'bg-orange-50/30' : 'bg-blue-50/30'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-inner ${order.status === OrderStatus.PENDING ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {String(order.orderNumber).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 leading-none truncate max-w-[80px]">
                       {order.userInfo.nickname || order.userInfo.firstName}
                    </h3>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                       {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase ${order.status === OrderStatus.PENDING ? 'text-orange-600 bg-orange-100' : 'text-blue-600 bg-blue-100'}`}>
                  {order.status === OrderStatus.PENDING ? 'Čeká' : 'Příprava'}
                </span>
              </div>

              <div className="p-3 flex-1 space-y-3">
                {order.note && (
                  <div className="bg-amber-50 border-l-2 border-amber-400 p-2 rounded-r-lg">
                    <p className="text-[7px] font-black text-amber-600 uppercase">Poznámka:</p>
                    <p className="text-[10px] font-bold text-amber-900 leading-tight italic line-clamp-2">"{order.note}"</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center">
                         <span className="text-slate-900 font-bold text-[11px] leading-tight flex items-baseline gap-1 flex-wrap">
                           <span className="text-orange-500 font-black text-xs">{item.quantity}x</span> 
                           <span>{item.name}</span>
                         </span>
                      </div>
                      {item.upravy && item.upravy.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1 text-[8px] text-slate-400 font-bold italic leading-none">
                           {item.upravy.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50/50 flex flex-col gap-1 border-t">
                  <div className="flex gap-1">
                    <button onClick={() => setCancelOrderModal(order)} className="px-2 py-2 bg-slate-200 text-slate-500 rounded-lg font-black text-[8px] uppercase hover:bg-red-50 hover:text-red-500 transition-colors">STORNO</button>
                    {order.status === OrderStatus.PENDING ? (
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.ACCEPTED)} className="flex-1 py-2 bg-orange-500 text-white font-black text-[9px] uppercase rounded-lg shadow-sm hover:bg-orange-600 active:scale-95 transition-all">
                        PŘIJMOUT 👨‍🍳
                    </button>
                    ) : (
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)} className="flex-1 py-2 bg-emerald-500 text-white font-black text-[9px] uppercase rounded-lg shadow-sm hover:bg-emerald-600 active:scale-95 transition-all">
                        HOTOVO ⭐
                    </button>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelOrderModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border-4 border-slate-100">
            <h3 className="text-2xl font-black mb-4 uppercase text-slate-900 leading-tight">Zrušit objednávku?</h3>
            <p className="text-slate-500 font-bold mb-8 italic">Objednávka #{cancelOrderModal.orderNumber} bude smazána z fronty.</p>
            <div className="flex flex-col gap-3">
              <Button variant="danger" onClick={confirmCancelOrder} className="py-5 text-lg font-black rounded-2xl">ANO, ZRUŠIT 🗑️</Button>
              <Button variant="secondary" onClick={() => setCancelOrderModal(null)} className="font-bold border-0">Zpět</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
