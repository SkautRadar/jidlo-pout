
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
    <div className="p-3 md:p-6 w-full h-full flex flex-col bg-white">
      <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Kuchyně</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Přehled objednávek k přípravě</p>
        </div>
        <div className="bg-orange-100 text-orange-800 px-6 py-3 rounded-2xl font-black text-lg">
          Aktivní: <span className="text-2xl text-orange-600">{kitchenOrders.length}</span>
        </div>
      </header>

      {kitchenOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="text-center">
            <p className="text-5xl mb-3">🍳</p>
            <p className="text-slate-400 text-lg font-bold">V kuchyni je klid</p>
            <p className="text-slate-300 text-sm mt-2">Žádné aktivní objednávky</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(order => (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border-2 flex flex-col overflow-hidden transition-all ${order.status === OrderStatus.PENDING ? 'border-orange-300 bg-orange-50' : 'border-blue-300 bg-blue-50'}`}>
                {/* Header */}
                <div className={`p-4 flex justify-between items-start ${order.status === OrderStatus.PENDING ? 'bg-orange-100' : 'bg-blue-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black text-white shrink-0 ${order.status === OrderStatus.PENDING ? 'bg-orange-500' : 'bg-blue-500'}`}>
                      {String(order.orderNumber).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                        {order.userInfo.nickname || order.userInfo.firstName}
                      </h3>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full whitespace-nowrap ml-2 shrink-0 ${order.status === OrderStatus.PENDING ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {order.status === OrderStatus.PENDING ? 'Čeká' : 'Příprava'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto">
                  {/* Note */}
                  {order.note && (
                    <div className="bg-white border-l-4 border-amber-400 p-3 rounded-r-lg">
                      <p className="text-xs font-black text-amber-700 uppercase mb-1">Speciální pokyn</p>
                      <p className="text-sm font-semibold text-amber-900 line-clamp-3">"{order.note}"</p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-white rounded-lg p-3 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-black text-slate-900">
                              <span className="text-orange-600 mr-2">{item.quantity}x</span>
                              {item.name}
                            </span>
                          </div>
                        </div>
                        {item.upravy && item.upravy.length > 0 && (
                          <div className="mt-1 text-xs font-bold text-slate-600 italic">
                            → {item.upravy.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                  <button 
                    onClick={() => setCancelOrderModal(order)} 
                    className="flex-1 px-3 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg font-black text-sm uppercase hover:bg-red-50 active:scale-95 transition-all"
                  >
                    Zrušit
                  </button>
                  {order.status === OrderStatus.PENDING ? (
                    <button 
                      onClick={() => onUpdateStatus(order.id, OrderStatus.ACCEPTED)} 
                      className="flex-1 py-3 bg-orange-500 text-white font-black text-sm uppercase rounded-lg shadow-lg hover:bg-orange-600 active:scale-95 transition-all"
                    >
                      Přijmout
                    </button>
                  ) : (
                    <button 
                      onClick={() => onUpdateStatus(order.id, OrderStatus.COMPLETED)} 
                      className="flex-1 py-3 bg-emerald-500 text-white font-black text-sm uppercase rounded-lg shadow-lg hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                      Hotovo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelOrderModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border-2 border-slate-100">
            <h3 className="text-3xl font-black mb-4 uppercase text-slate-900">Zrušit objednávku?</h3>
            <p className="text-slate-600 font-bold mb-8">Objednávka #{String(cancelOrderModal.orderNumber).padStart(2, '0')} bude smazána.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmCancelOrder}
                className="w-full py-4 bg-red-500 text-white text-lg font-black uppercase rounded-lg shadow-lg hover:bg-red-600 active:scale-95 transition-all"
              >
                Ano, zrušit
              </button>
              <button
                onClick={() => setCancelOrderModal(null)}
                className="w-full py-3 bg-slate-100 text-slate-700 font-bold uppercase rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
              >
                Zpět
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
