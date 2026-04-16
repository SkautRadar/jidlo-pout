
import React, { useState, useMemo } from 'react';
import { User, Order } from '../types';

interface GuestUser {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  age: string;
  orderCount: number;
}

interface UserManagementViewProps {
  users: User[];
  orders: Order[];
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ users, orders, onDeleteUser }) => {
  const [viewMode, setViewMode] = useState<'registered' | 'guests'>('registered');

  const guestUsers = useMemo(() => {
    const guestMap = new Map<string, GuestUser>();

    orders.forEach(order => {
      const email = order.userInfo.email?.toLowerCase().trim();
      const nameKey = `${order.userInfo.firstName}-${order.userInfo.lastName}`.toLowerCase().trim();
      const identifier = email || nameKey;
      
      if (!identifier) return;

      const isRegistered = users.some(u => (u.email && email && u.email.toLowerCase().trim() === email));
      if (isRegistered) return;

      const existing = guestMap.get(identifier);
      if (existing) {
        existing.orderCount += 1;
      } else {
        guestMap.set(identifier, {
          id: identifier,
          firstName: order.userInfo.firstName,
          lastName: order.userInfo.lastName,
          nickname: order.userInfo.nickname || '',
          age: order.userInfo.age,
          orderCount: 1
        });
      }
    });

    return Array.from(guestMap.values());
  }, [orders, users]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Strávníci 👥</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Správa uživatelů a hostů stánku</p>
      </header>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode('registered')}
          className={`px-8 py-4 rounded-3xl font-black uppercase text-sm transition-all border-4 ${viewMode === 'registered' ? 'bg-orange-500 border-orange-200 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-50'}`}
        >
          Registrovaní ({users.length})
        </button>
        <button
          onClick={() => setViewMode('guests')}
          className={`px-8 py-4 rounded-3xl font-black uppercase text-sm transition-all border-4 ${viewMode === 'guests' ? 'bg-orange-500 border-orange-200 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-50'}`}
        >
          Neregistrovaní ({guestUsers.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-50 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b-2 border-slate-100">
            <tr>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Jméno a Příjmení</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Přezdívka</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Věk</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Objednávek</th>
              <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-50">
            {viewMode === 'registered' ? (
              users.map(user => (
                <tr key={user.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 font-bold text-orange-600">{user.nickname || '—'}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{user.age}</td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{orders.filter(o => o.userInfo.email === user.email).length}x</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDeleteUser(user.id)} className="text-red-400 hover:text-red-600 font-black text-xs">SMAZAT</button>
                  </td>
                </tr>
              ))
            ) : (
              guestUsers.map(guest => (
                <tr key={guest.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{guest.firstName} {guest.lastName}</td>
                  <td className="px-6 py-4 font-bold text-orange-600">{guest.nickname || '—'}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{guest.age}</td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{guest.orderCount}x</td>
                  <td className="px-8 py-6 text-right text-slate-300 font-bold uppercase text-[10px]">Historický záznam</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
