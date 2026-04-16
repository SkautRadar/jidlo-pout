
import React, { useState, useEffect, useRef } from 'react';
import { CustomerView } from './components/CustomerView';
import { AdminView } from './components/AdminView';
import { CashierView } from './components/CashierView';
import { ArchiveView } from './components/ArchiveView';
import { MenuManagementView } from './components/MenuManagementView';
import { UserManagementView } from './components/UserManagementView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { AdminLogin } from './components/AdminLogin';
import { Order, OrderStatus, AppView, MenuItem, User, OrderItem } from './types';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from './constants';
import { supabase } from './supabase';
import { errorLogger, ErrorSeverity, getUserFriendlyMessage } from './utils/errorHandling';
import { useToast } from './components/ToastProvider';

const APP_VERSION = 'v9.0-skaut';

const App: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Hlavní chody', 'Pizza', 'Polévky', 'Dezerty', 'Nápoje', 'Omáčky & Dipy', 'Ostatní']);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>('CUSTOMER');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | undefined>(undefined);
  const [orderCounter, setOrderCounter] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [guestOrderIds, setGuestOrderIds] = useState<string[]>([]);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // --- DATA TRANSFORMATION HELPERS ---
  const mapMenuFromDB = (data: any[]): MenuItem[] => data.map(i => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    image: i.image,
    price: i.price || 0,
    isSoldOut: i.is_sold_out,
    isHidden: i.is_hidden,
    vylepseni: i.vylepseni || [],
    varianty: i.varianty || []
  }));

  const mapUserFromDB = (data: any[]): User[] => data.map(u => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    nickname: u.nickname || u.section_number,
    age: u.age || u.birth_date,
    email: u.email
  }));

  const mapOrderFromDB = (data: any[]): Order[] => data.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    items: o.items || [],
    userInfo: o.user_info,
    status: o.status as OrderStatus,
    note: o.note,
    createdAt: new Date(o.created_at)
  }));

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminAuthenticated(!!session);
      if (session?.user?.email) setAdminEmail(session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminAuthenticated(!!session);
      if (session?.user?.email) setAdminEmail(session.user.email);
      else setAdminEmail(undefined);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- URL ROUTING ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) setActiveView('ADMIN');
      else if (hash.includes('cashier')) setActiveView('CASHIER');
      else if (hash.includes('tracking')) setActiveView('TRACKING');
      else if (hash.includes('menu_mgmt')) setActiveView('MENU_MGMT');
      else if (hash.includes('user_mgmt')) setActiveView('USER_MGMT');
      else if (hash.includes('archive')) setActiveView('ARCHIVE');
      else setActiveView('CUSTOMER');

      if (['admin', 'cashier', 'menu_mgmt', 'user_mgmt', 'archive'].some(v => hash.includes(v)) && !isAdminAuthenticated) {
        setShowLoginDialog(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const savedGuestIds = localStorage.getItem('gastromaster_guest_orders');
    if (savedGuestIds) {
      try { setGuestOrderIds(JSON.parse(savedGuestIds)); } catch (e) { console.error('Error loading guest orders', e); }
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdminAuthenticated]);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    const fetchData = async () => {
      setIsLoading(true);

      const { data: menuData } = await supabase.from('menu_items').select('*');
      if (menuData) {
        if (menuData.length === 0) {
          const itemsToInsert = INITIAL_MENU_ITEMS.map(i => ({
            id: i.id, name: i.name, description: i.description, 
            category: i.category, image: i.image, is_sold_out: i.isSoldOut,
            vylepseni: i.vylepseni || []
          }));
          await supabase.from('menu_items').insert(itemsToInsert);
          setMenuItems(INITIAL_MENU_ITEMS);
        } else {
          setMenuItems(mapMenuFromDB(menuData));
        }
      }

      const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
      if (orderData) {
        const parsedOrders = mapOrderFromDB(orderData);
        setOrders(parsedOrders);
        const maxOrderNum = parsedOrders.reduce((max, o) => Math.max(max, o.orderNumber), 0);
        setOrderCounter(maxOrderNum >= 999 ? 1 : maxOrderNum + 1);
      }

      const { data: userData } = await supabase.from('users').select('*').order('last_name', { ascending: true });
      if (userData) {
        setUsers(mapUserFromDB(userData));
      }

      setIsLoading(false);
    };

    fetchData();

    // --- REALTIME ---
    const menuSub = supabase.channel('menu_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
      supabase.from('menu_items').select('*').then(({ data }) => { if (data) setMenuItems(mapMenuFromDB(data)); });
    }).subscribe();

    const ordersSub = supabase.channel('orders_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      if (payload.eventType === 'INSERT') {
        notificationSound.current?.play().catch(() => { });
        supabase.from('orders').select('*').order('created_at', { ascending: true }).then(({ data }) => {
          if (data) {
            const parsed = mapOrderFromDB(data);
            setOrders(parsed);
            const maxOrderNum = parsed.reduce((max, o) => Math.max(max, o.orderNumber), 0);
            setOrderCounter(maxOrderNum >= 999 ? 1 : maxOrderNum + 1);
          }
        });
      }
      if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
        supabase.from('orders').select('*').order('created_at', { ascending: true }).then(({ data }) => {
          if (data) setOrders(mapOrderFromDB(data));
        });
      }
    }).subscribe();

    const usersSub = supabase.channel('users_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
      supabase.from('users').select('*').then(({ data }) => { if (data) setUsers(mapUserFromDB(data)); });
    }).subscribe();

    return () => {
      supabase.removeChannel(menuSub);
      supabase.removeChannel(ordersSub);
      supabase.removeChannel(usersSub);
    };
  }, [isAdminAuthenticated]);

  // --- HANDLERS ---
  const handleNewOrder = async (order: Order) => {
    const enrichedOrder = { ...order, orderNumber: orderCounter };

    if (!currentUser) {
      const newGuestIds = [...guestOrderIds, order.id];
      setGuestOrderIds(newGuestIds);
      localStorage.setItem('gastromaster_guest_orders', JSON.stringify(newGuestIds));
    }

    setOrders(prev => [...prev, enrichedOrder]);
    setOrderCounter(prev => prev >= 999 ? 1 : prev + 1);

    const { error } = await supabase.from('orders').insert({
      id: enrichedOrder.id,
      order_number: enrichedOrder.orderNumber,
      items: enrichedOrder.items,
      user_info: enrichedOrder.userInfo,
      status: enrichedOrder.status,
      created_at: enrichedOrder.createdAt.toISOString(),
      note: enrichedOrder.note,
      total_price: 0,
      is_paid: true
    });

    if (error) {
      setOrders(prev => prev.filter(o => o.id !== enrichedOrder.id));
      errorLogger.log(error, ErrorSeverity.HIGH, { orderId: enrichedOrder.id, action: 'create_order' });
      showToast(`❌ ${getUserFriendlyMessage(error)}`, 'error');
      return;
    }

    if (activeView === 'CUSTOMER') setActiveView('TRACKING');
    showToast('Objednávka odeslána!', 'success');
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert(`Chyba: ${error.message}`);
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminAuthenticated(false);
    setActiveView('CUSTOMER');
    setIsMobileMenuOpen(false);
  };

  const handleRegisterUser = async (newUser: User) => {
    const { data, error } = await supabase.rpc('register_customer', {
      p_first_name: newUser.firstName,
      p_last_name: newUser.lastName,
      p_email: newUser.email,
      p_password: newUser.password,
      p_address: '',
      p_phone: '',
      p_id_card_number: '',
      p_birth_date: newUser.age, // Using birth_date column for age for now
      p_section_number: newUser.nickname || '' // Using section_number column for nickname for now
    });

    if (error) {
      alert('Chyba: ' + error.message);
    } else {
      setCurrentUser({ ...newUser, id: data.id });
      alert('Registrace úspěšná!');
    }
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    let updatedCategories = categories.map(c => c === oldName ? newName : c);
    if (!categories.includes(oldName) && !updatedCategories.includes(newName)) {
      updatedCategories = [...updatedCategories, newName];
    }
    setCategories(updatedCategories);
    await supabase.from('settings').upsert({ key: 'menu_categories', value: updatedCategories });

    const updatedItems = menuItems.map(item => 
      item.category === oldName ? { ...item, category: newName } : item
    );
    setMenuItems(updatedItems);
    
    // Batch update category for all items in DB
    await supabase.from('menu_items').update({ category: newName }).eq('category', oldName);
    showToast(`Kategorie '${oldName}' přejmenována na '${newName}'`, 'success');
  };

  const handleUpdateCategories = async (newCategories: string[]) => {
    setCategories(newCategories);
    await supabase.from('settings').upsert({ key: 'menu_categories', value: newCategories });
  };

  const handleUpdateMenuItems = async (items: MenuItem[]) => {
    setMenuItems(items);
    
    // Batch upsert into Supabase (handles both creating new and updating existing)
    const itemsDB = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        is_sold_out: item.isSoldOut,
        is_hidden: item.isHidden,
        category: item.category,
        image: item.image,
        price: item.price || 0,
        vylepseni: item.vylepseni || [],
        varianty: item.varianty || []
    }));
    
    const { error } = await supabase.from('menu_items').upsert(itemsDB);
    if (error) {
       console.error("Sync error:", error);
       showToast("❌ Chyba při ukládání do DB: " + error.message, "error");
    } else {
       showToast("💾 Menu úspěšně uloženo do cloudu", "success");
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    setMenuItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('menu_items').delete().eq('id', id);
  };

  const handleDeleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    // Usually handled by another RPC or table delete
    await supabase.from('users').delete().eq('id', id);
  };

  const handleCustomerLogin = async (email: string, password?: string) => {
    if (!password) return false;
    const { data, error } = await supabase.rpc('login_customer', { user_email: email, user_password: password });
    if (error || !data) return false;

    setCurrentUser({
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      nickname: data.nickname || data.section_number,
      age: data.age || data.birth_date
    });
    return true;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center animate-pulse">
          <p className="font-black text-xl uppercase tracking-widest">Připojování... ⚜️</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {isAdminAuthenticated && (
        <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shrink-0 transition-transform duration-300 shadow-xl z-40 h-full ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-orange-400">GASTRO MASTER ⚜️</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Skautská Pouť Edition</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
            {[
              { id: 'CUSTOMER', icon: '🍽️', label: 'Objednávky' },
              { id: 'TRACKING', icon: '📺', label: 'Stav Objednávek' },
              { id: 'ADMIN', icon: '👨‍🍳', label: 'Kuchyně' },
              { id: 'CASHIER', icon: '💰', label: 'Kasa & Výdej' },
              { id: 'MENU_MGMT', icon: '📝', label: 'Správa Menu' },
              { id: 'USER_MGMT', icon: '👥', label: 'Uživatelé' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id as AppView); setIsMobileMenuOpen(false); }}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeView === item.id ? 'bg-orange-600 shadow-lg' : 'hover:bg-slate-800'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleAdminLogout} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase w-full text-left">🚪 Odhlásit Admina</button>
            <p className="text-[10px] text-slate-600 text-center font-mono mt-4">{APP_VERSION}</p>
          </div>
        </aside>
      )}

      {isAdminAuthenticated && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto relative bg-slate-50 h-full w-full">
        {isAdminAuthenticated && (
          <div className="md:hidden fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl border-2 border-slate-700 active:scale-90 transition-transform"
            >
              🍔
            </button>
          </div>
        )}
        {activeView === 'CUSTOMER' && <CustomerView menuItems={menuItems} onOrderSubmit={handleNewOrder} currentUser={currentUser} onRegister={handleRegisterUser} onLogin={handleCustomerLogin} onLogout={() => setCurrentUser(null)} onUpdateUser={setCurrentUser} onNavigate={setActiveView} />}
        {activeView === 'TRACKING' && <OrderTrackingView orders={orders} currentUser={currentUser} isAdmin={isAdminAuthenticated} guestOrderIds={guestOrderIds} onBack={() => setActiveView('CUSTOMER')} />}
        {activeView === 'ADMIN' && isAdminAuthenticated && <AdminView orders={orders} onUpdateStatus={updateOrderStatus} />}
        {activeView === 'CASHIER' && isAdminAuthenticated && <CashierView orders={orders} users={users} menuItems={menuItems} onNewOrder={handleNewOrder} onUpdateStatus={updateOrderStatus} />}
        {activeView === 'MENU_MGMT' && isAdminAuthenticated && <MenuManagementView items={menuItems} onUpdateItems={handleUpdateMenuItems} onDeleteItem={handleDeleteMenuItem} categories={categories} onUpdateCategories={handleUpdateCategories} onRenameCategory={handleRenameCategory} />}
        {activeView === 'USER_MGMT' && isAdminAuthenticated && <UserManagementView users={users} onDeleteUser={handleDeleteUser} orders={orders} />}
      </main>

      {showLoginDialog && !isAdminAuthenticated && (
        <AdminLogin onSuccess={() => setShowLoginDialog(false)} onCancel={() => { setShowLoginDialog(false); setActiveView('CUSTOMER'); }} />
      )}
    </div>
  );
};

export default App;
