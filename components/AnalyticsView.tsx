import React, { useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { exportOrdersToCSV } from '../utils/csvExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface AnalyticsViewProps {
  orders: Order[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#F2726F', '#83A6ED', '#8DD1E1', '#A4DE6C', '#D0ED57'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders }) => {
  // 1. Basic Stats
  const paidOrders = useMemo(() => orders.filter(o => o.status === OrderStatus.PAID), [orders]);
  
  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, i) => itemSum + ((i.price || 0) * i.quantity), 0);
    }, 0);
  }, [paidOrders]);

  const totalItemsSold = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + o.items.reduce((acc, i) => acc + i.quantity, 0), 0);
  }, [paidOrders]);

  const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const averageItemsPerOrder = paidOrders.length > 0 ? (totalItemsSold / paidOrders.length).toFixed(1) : 0;

  // 2. Top Selling Items
  const itemSalesData = useMemo(() => {
    const counts: Record<string, number> = {};
    paidOrders.forEach(o => {
      o.items.forEach(i => {
        counts[i.name] = (counts[i.name] || 0) + i.quantity;
      });
    });
    
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10
  }, [paidOrders]);

  // 3. User Demographics (Age)
  const ageDemographicsData = useMemo(() => {
    let kids = 0; // 0-14
    let teens = 0; // 15-18
    let adults = 0; // 19+
    let unknown = 0;

    paidOrders.forEach(o => {
      const ageStr = o.userInfo.age;
      const age = parseInt(ageStr, 10);
      
      if (!ageStr || isNaN(age)) {
        unknown++;
      } else if (age <= 14) {
        kids++;
      } else if (age <= 18) {
        teens++;
      } else {
        adults++;
      }
    });

    return [
      { name: 'Děti (0-14)', count: kids },
      { name: 'Mládež (15-18)', count: teens },
      { name: 'Dospělí (19+)', count: adults },
      { name: 'Neznámý', count: unknown },
    ].filter(d => d.count > 0);
  }, [paidOrders]);

  // 4. User Leaderboard (Who ate the most)
  const userLeaderboard = useMemo(() => {
    const userStats: Record<string, { name: string, itemsEaten: number, totalSpent: number }> = {};
    
    paidOrders.forEach(o => {
      // Use email or full name as identifier
      const id = o.userInfo.email || `${o.userInfo.firstName}-${o.userInfo.lastName}`;
      if (!userStats[id]) {
        userStats[id] = {
           name: o.userInfo.nickname || `${o.userInfo.firstName} ${o.userInfo.lastName}`,
           itemsEaten: 0,
           totalSpent: 0
        };
      }
      
      const orderItemsCount = o.items.reduce((acc, i) => acc + i.quantity, 0);
      const orderTotal = o.items.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);
      
      userStats[id].itemsEaten += orderItemsCount;
      userStats[id].totalSpent += orderTotal;
    });

    return Object.values(userStats)
      .sort((a, b) => b.itemsEaten - a.itemsEaten)
      .slice(0, 10); // Top 10
  }, [paidOrders]);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col space-y-6 overflow-y-auto">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Analytika & Statistiky 📈</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Přehled prodejů a strávníků</p>
        </div>
        <button 
          onClick={() => exportOrdersToCSV(orders)}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2 active:scale-95"
        >
          <span>📊</span>
          Export dat (CSV)
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tržby Celkem</h3>
           <p className="text-3xl font-black text-emerald-600">{totalRevenue},- Kč</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dokončené Objednávky</h3>
           <p className="text-3xl font-black text-blue-600">{paidOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange-500">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Průměr na objednávku</h3>
           <div className="flex items-baseline gap-2">
             <p className="text-3xl font-black text-orange-600">{averageOrderValue},-</p>
             <p className="text-sm font-bold text-slate-400">({averageItemsPerOrder} pol.)</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Vydaných položek</h3>
           <p className="text-3xl font-black text-purple-600">{totalItemsSold}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Nejprodávanější položky (Top 10)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={itemSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="quantity" name="Počet prodaných" fill="#f97316" radius={[0, 4, 4, 0]}>
                  {itemSalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Demographics Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col">
          <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Demografie strávníků (Věk)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageDemographicsData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {ageDemographicsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="font-black text-slate-800 uppercase text-sm">Žebříček Jedlíků (Top 10) 🏆</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-black text-slate-500">
              <tr>
                <th className="p-4 w-12 text-center">#</th>
                <th className="p-4">Strávník</th>
                <th className="p-4 text-center">Snědeno (ks)</th>
                <th className="p-4 text-right">Celková útrata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-800">
              {userLeaderboard.length === 0 ? (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-400 italic font-medium">Zatím žádná data k zobrazení.</td>
                </tr>
              ) : (
                userLeaderboard.map((user, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                    <td className="p-4 text-center text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="p-4">{user.name}</td>
                    <td className="p-4 text-center">
                        <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">
                            {user.itemsEaten} ks
                        </span>
                    </td>
                    <td className="p-4 text-right text-emerald-600">{user.totalSpent},- Kč</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
