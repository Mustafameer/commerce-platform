import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Store as StoreIcon, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronRight,
  ChevronDown,
  Search,
  Menu,
  Layout,
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Pause,
  Trash2,
  Edit2,
  BarChart3,
  Upload,
  Send,
  ExternalLink,
  TrendingUp,
  PieChart,
  User as UserIcon,
  Phone,
  Ticket,
  Gift,
  Calendar,
  Minus,
  Clock,
  Sun,
  Moon,
  Check,
  FileText,
  Edit,
  Home,
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore, useRegularCartStore, useSettingsStore, useSearchStore, useRefreshStore, useTopupCartStore } from './store';
import type { User, Store, Product, Order } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- API Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log(`🛠️ API_BASE_URL initialized: "${API_BASE_URL}" ${API_BASE_URL ? '✅' : '⚠️ EMPTY'}`);
console.log(`🛠️ Environment: ${typeof window !== 'undefined' ? 'Browser' : 'Node'}`);
console.log(`🛠️ Current URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`);

const apiCall = async (path: string, options?: RequestInit) => {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  console.log(`📡 API Call: ${url}`);
  return fetch(url, options);
};

// Monkey-patch fetch to use API_BASE_URL for relative /api/* paths
const originalFetch = window.fetch;
console.log(`🔧 Original fetch function: ${originalFetch ? '✅' : '❌'}`);

(window as any).fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input.toString();
  const shouldRedirect = url.startsWith('/api') && API_BASE_URL;
  const finalUrl = shouldRedirect ? `${API_BASE_URL}${url}` : url;
  
  if (shouldRedirect) {
    console.log(`🔄 Redirecting fetch: ${url} → ${finalUrl}`);
  } else if (url.startsWith('/api')) {
    console.warn(`⚠️ NOT redirecting ${url} - API_BASE_URL is empty!`);
  }
  
  return originalFetch.call(this, finalUrl, init);
};
console.log(`🔧 Fetch monkey-patch applied`);

const formatCurrency = (amount: number | string) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rounded = Math.floor(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rounded);
};

// --- Sound Notification ---
const playAddToCartSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First tone - higher frequency (bell-like)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.15);
    
    // Second tone - lower frequency for depth
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    oscillator2.frequency.setValueAtTime(700, audioContext.currentTime + 0.1);
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    oscillator2.start(audioContext.currentTime + 0.1);
    oscillator2.stop(audioContext.currentTime + 0.25);
  } catch (error) {
    console.log('صوت التنبيه غير متوفر');
  }
};

// --- Theme Context ---
const ThemeContext = React.createContext<{ isDarkMode: boolean; setIsDarkMode: (value: boolean) => void }>({ isDarkMode: false, setIsDarkMode: () => {} });

const useTheme = () => React.useContext(ThemeContext);

const ThemeProvider = ({ children, isDarkMode, setIsDarkMode }: { children: React.ReactNode; isDarkMode: boolean; setIsDarkMode: (value: boolean) => void }) => (
  <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
    {children}
  </ThemeContext.Provider>
);

// --- Components ---

const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className={cn(
      "px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
      className
    )} 
    {...props} 
  />
);

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn(
      "rounded-2xl border shadow-sm overflow-hidden transition-colors",
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5",
      className
    )} {...props}>
      {children}
    </div>
  );
};

// --- Layouts ---

const DashboardLayout = ({ children, title, role, counts }: { children: React.ReactNode; title: string; role: string; counts?: Record<string, number> }) => {
  const { user, logout } = useAuthStore();
  const { appName, logoUrl } = useSettingsStore();
  const { dashboardQuery, setDashboardQuery } = useSearchStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState({ app_name: appName, logo_url: logoUrl });
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    // Only fetch settings once when user role changes or on mount
    const storeId = user?.role === 'merchant' ? user.store_id : ''; 
    const roleParam = user?.role || '';
    console.log("🔄 DashboardLayout fetching settings:", { storeId, roleParam });
    
    fetch(`/api/settings${storeId ? `?storeId=${storeId}&role=${roleParam}` : `?role=${roleParam}`}`)
      .then(res => res.json())
      .then(data => {
        console.log("📥 DashboardLayout received settings:", data);
        if (data && typeof data === 'object' && !data.error && data.app_name) {
          // Update both local state AND Zustand store together
          const settingsData = {
            app_name: data.app_name,
            logo_url: data.logo_url || '',
            primary_color: data.primary_color || '#4F46E5'
          };
          
          setSettings(settingsData);
          // Update the global settings store so it's available everywhere
          useSettingsStore.getState().setSettings(settingsData);
          console.log("✅ Settings updated in both local and Zustand store:", settingsData);
        }
      })
      .catch((err) => {
        console.error("❌ Failed to fetch settings:", err);
      });
  }, [user?.role, user?.store_id]);

  const handleLogout = () => {
    logout();
    useSettingsStore.getState().resetSettings(); // Reset settings when logging out
    setDashboardQuery(''); // reset search on logout
    navigate('/login');
  };

  const navItems = role === 'admin' ? [
    { icon: LayoutDashboard, label: 'نظرة عامة', path: '/admin' },
    { icon: BarChart3, label: 'الإحصائيات', path: '/admin/stats' },
    { icon: StoreIcon, label: 'المتاجر', path: '/admin/stores', count: counts?.stores },
    { icon: CheckCircle, label: 'طلبات الانضمام', path: '/admin/approvals', count: counts?.approvals },
    { icon: Users, label: 'المستخدمون', path: '/admin/users', count: counts?.users },
    { icon: Settings, label: 'الإعدادات', path: '/admin/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/merchant' },
    { icon: Package, label: 'المنتجات', path: '/merchant/products', count: counts?.products },
    { icon: Layout, label: 'الأقسام', path: '/merchant/categories', count: counts?.categories },
    { icon: Zap, label: 'المزادات', path: '/merchant/auctions', count: counts?.auctions },
    { icon: ShoppingCart, label: 'الطلبات', path: '/merchant/orders', count: counts?.orders },
    { icon: Ticket, label: 'قسائم الخصم', path: '/merchant/coupons', count: counts?.coupons },
    { icon: Users, label: 'العملاء', path: '/merchant/customers', count: counts?.customers },
    { icon: Settings, label: 'إعدادات المتجر', path: '/merchant/settings' },
  ];

  const isNavItemActive = (path: string) => {
    const rootPath = role === 'admin' ? '/admin' : '/merchant';
    if (path === rootPath) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  if (isMobile) {
    // Mobile Layout
    return (
      <div className={cn("flex flex-col h-screen w-screen overflow-hidden", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")} 
        data-dashboard-layout="mobile"
        dir="rtl"
      >
        {/* Mobile Header */}
        <div className={cn("border-b px-4 py-3 sticky top-0 z-30 backdrop-blur-sm", isDarkMode ? "bg-gray-800/95 border-gray-700" : "bg-white/95 border-black/5")}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn("p-2 rounded-lg transition-colors flex-shrink-0", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")}
              aria-label="فتح القائمة"
            >
              {sidebarOpen ? <X size={22} className={isDarkMode ? "text-gray-100" : "text-gray-900"} /> : <Menu size={22} className={isDarkMode ? "text-gray-100" : "text-gray-900"} />}
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h2 className={cn("text-base font-normal truncate", isDarkMode ? "text-gray-100" : "text-gray-900")}>{title}</h2>
              <p className={cn("text-[10px] truncate", isDarkMode ? "text-gray-400" : "text-gray-500")}>{settings.app_name}</p>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2 rounded-lg border transition-all flex items-center justify-center flex-shrink-0",
                isDarkMode 
                  ? "bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800" 
                  : "bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100"
              )}
              title={isDarkMode ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="relative mt-3">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={16} />
            <input 
              type="text" 
              placeholder="بحث..." 
              value={dashboardQuery}
              onChange={(e) => setDashboardQuery(e.target.value)}
              className={cn("w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/30 placeholder-gray-500" : "bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400")}
            />
          </div>
        </div>

        {/* Mobile Menu Drawer Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Menu Drawer */}
        <div className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] transform border-l transition-transform",
          sidebarOpen ? "-translate-x-0" : "translate-x-full",
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5"
        )}>
          <div className={cn("p-5 border-b", isDarkMode ? "border-gray-700" : "border-black/5")}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className={cn("text-lg font-normal truncate", isDarkMode ? "text-gray-100" : "text-gray-900")}>{settings.app_name}</h3>
                <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>لوحة {role === 'admin' ? 'الإدارة' : 'التاجر'}</p>
              </div>
              {settings.logo_url ? (
                <div className={cn("w-14 h-14 rounded-full overflow-hidden ring-2 flex-shrink-0", isDarkMode ? "ring-gray-600 bg-gray-700" : "ring-indigo-100 bg-gray-50")}>
                  <img src={settings.logo_url} className="w-full h-full object-cover" alt="logo" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-normal flex-shrink-0">
                  {settings.app_name?.[0]}
                </div>
              )}
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => {
                  setDashboardQuery('');
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-colors group",
                  isNavItemActive(item.path)
                    ? (isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-indigo-50 text-indigo-600")
                    : (isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400" : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600")
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.icon && <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />}
                  <span className="font-medium text-sm truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn("text-[10px] font-normal px-2 py-0.5 rounded-full ring-2 shadow-sm flex-shrink-0", isDarkMode ? "bg-blue-900 text-blue-300 ring-gray-700" : "bg-indigo-100 text-indigo-600 ring-white")}>
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className={cn("p-3 border-t space-y-2", isDarkMode ? "border-gray-700" : "border-black/5")}>
            {role === 'merchant' && user?.store_slug && (
              <Link 
                to={`/store/${user.store_slug}`} 
                target="_blank"
                onClick={() => setSidebarOpen(false)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-normal", isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-indigo-600 text-white hover:bg-indigo-700")}
              >
                <ExternalLink size={18} className="flex-shrink-0" />
                <span className="truncate">عرض المتجر</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50")}
            >
              <LogOut size={18} />
              <span className="truncate">تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn("px-4 py-4 pb-28", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
            {children}
          </div>
        </div>

        {/* Mobile Footer Navigation */}
        <MobileFooterNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={cn("h-screen w-screen overflow-hidden flex-row", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")} 
      data-dashboard-layout="desktop"
      dir="rtl"
    >
      {/* Sidebar */}
      <aside className={cn(
        "relative w-64 h-screen border-r flex-col overflow-hidden flex",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5"
      )}>
        <div className={cn("p-6 text-center border-b flex-shrink-0", isDarkMode ? "border-gray-700" : "border-black/5")}>
        <div className="flex flex-col items-center gap-3">
          {settings.logo_url ? (
            <div className={cn("w-20 h-20 rounded-full overflow-hidden ring-4 shadow-lg flex items-center justify-center flex-shrink-0", isDarkMode ? "ring-gray-700 bg-gray-700" : "ring-indigo-50 bg-gray-50")}>
              <img src={settings.logo_url} className="w-full h-full object-cover" alt="logo" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-normal shadow-lg ring-4 ring-indigo-50 flex-shrink-0">
              {settings.app_name?.[0]}
            </div>
          )}
          <div>
            <h1 className={cn("text-lg font-normal tracking-tighter mb-0.5", isDarkMode ? "text-blue-400" : "text-indigo-600")}>{settings.app_name}</h1>
            <p className={cn("text-[9px] uppercase tracking-[0.2em] font-normal italic", isDarkMode ? "text-gray-500" : "text-gray-400")}>لوحة {role === 'admin' ? 'الإدارة' : 'التاجر'}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-20">
        {navItems.map((item, index) => (
          <Link
            key={item.label}
            to={item.path}
            onClick={() => {
              setDashboardQuery('');
              setSidebarOpen(false);
            }}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-colors group",
              isNavItemActive(item.path)
                ? (isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-indigo-50 text-indigo-600")
                : (isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400" : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600")
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.icon && <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />}
              <span className="font-medium text-sm truncate">{item.label}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
              <span className={cn("text-[10px] font-normal px-2 py-0.5 rounded-full ring-2 shadow-sm group-hover:transition-all flex-shrink-0", isDarkMode ? "bg-blue-900 text-blue-300 ring-gray-700 group-hover:bg-blue-600 group-hover:text-white" : "bg-indigo-100 text-indigo-600 ring-white group-hover:bg-indigo-600 group-hover:text-white")}>
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className={cn("p-3 border-t space-y-2 flex-shrink-0", isDarkMode ? "border-gray-700" : "border-black/5")}>
        {role === 'merchant' && user?.store_slug && (
          <Link 
            to={`/store/${user.store_slug}`} 
            target="_blank"
            className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all shadow-lg group text-sm font-normal", isDarkMode ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100")}
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
              <span className="truncate">عرض المتجر</span>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50")}
        >
          <LogOut size={18} />
          <span className="truncate">تسجيل الخروج</span>
        </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden flex-col flex">
        <header className={cn("px-8 py-6 border-b flex justify-between items-center flex-shrink-0", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
          <h2 className={cn("text-3xl font-normal tracking-tight", isDarkMode ? "text-gray-100" : "text-gray-900")}>{title}</h2>
          <div className="flex gap-4 items-center">
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "p-2.5 rounded-lg border transition-all flex items-center justify-center",
                isDarkMode 
                  ? "bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800" 
                  : "bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100"
              )}
              title={isDarkMode ? "الوضع الفاتح" : "الوضع الداكن"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative hidden sm:block">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={18} />
              <input 
                type="text" 
                placeholder="بحث..." 
                value={dashboardQuery}
                onChange={(e) => setDashboardQuery(e.target.value)}
                className={cn("pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 w-64 transition-colors", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/30 placeholder-gray-500" : "bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400")}
              />
            </div>
          </div>
        </header>
        <div className={cn("flex-1 overflow-y-auto px-8 py-8", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
          {children}
        </div>
      </main>
    </div>
  );
};

// --- Pages ---

type CartMode = 'regular' | 'topup';

const CartPageContent = ({ cartMode }: { cartMode: CartMode }) => {
  const regularCart = useRegularCartStore();
  const topupCart = useTopupCartStore();
  const { items, removeItem, updateQuantity, clearCart, appliedCoupon, setAppliedCoupon } = cartMode === 'topup' ? topupCart : regularCart;
  const { user } = useAuthStore();
  const { primaryColor } = useSettingsStore();
  const { isDarkMode } = useTheme();
  const isTopupCart = cartMode === 'topup';
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);
  const [customerType, setCustomerType] = useState<'cash' | 'reseller' | null>(null);
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [selectedForQuantity, setSelectedForQuantity] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [verificationModal, setVerificationModal] = useState<any>(null);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const navigate = useNavigate();

  // حفظ واسترجاع الأكواد من localStorage
  useEffect(() => {
    const savedOrderConfirmation = localStorage.getItem('orderConfirmation');
    if (savedOrderConfirmation) {
      try {
        const confirmation = JSON.parse(savedOrderConfirmation);
        setOrderConfirmation(confirmation);
        console.log('📦 Loaded order confirmation from localStorage:', confirmation);
      } catch (err) {
        console.error('Error loading order confirmation from localStorage:', err);
      }
    }
  }, []);

  // Debug: Log cart items to console
  useEffect(() => {
    console.log('🛒 Cart items:', items);
    items.forEach(item => {
      console.log(`  - ID: ${item.id}, Name: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}`);
    });
  }, [items]);

  // تحميل بيانات المنتجات المفقودة من API
  const [enrichedItems, setEnrichedItems] = useState<any[]>([]);
  useEffect(() => {
    const enrichItems = async () => {
      if (items.length === 0) {
        setEnrichedItems([]);
        return;
      }

      let regularProducts: any[] = []; // Define outside try block
      try {
        // جلب المنتجات العادية
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        regularProducts = Array.isArray(productsData) ? productsData : [];

        // جلب منتجات الشحن
        let topupProducts: any[] = [];
        const storeId = items[0]?.store_id;
        if (storeId) {
          try {
            const topupRes = await fetch(`/api/topup/products/${storeId}`);
            const topupData = await topupRes.json();
            topupProducts = Array.isArray(topupData) ? topupData.map((p: any) => ({
              ...p,
              store_name: p.company_name,
              name: `${p.amount}`,
              topup_codes: p.codes
            })) : [];
          } catch (err) {
            console.error('Error loading topup products:', err);
          }
        }

        // دمج البيانات
        const allProducts = [...regularProducts, ...topupProducts];
        const productMap = new Map(allProducts.map((p: any) => [p.id, p]));

        // إثراء بيانات السلة
        const enriched = items.map(cartItem => {
          const fullProduct = productMap.get(cartItem.id);
          if (fullProduct) {
            return {
              ...cartItem,
              name: fullProduct.name || cartItem.name,
              store_name: fullProduct.store_name || cartItem.store_name,
              company_name: fullProduct.company_name,
              category_name: fullProduct.category_name,
              image_url: fullProduct.image_url || cartItem.image_url,
            };
          }
          return cartItem;
        });

        setEnrichedItems(enriched);
        console.log('✅ Enriched items:', enriched);
      } catch (err) {
        console.error('Error enriching items:', err);
        setEnrichedItems(items);
      }
    };

    enrichItems();
  }, [items]);

  // تحقق فوري من localStorage عند تحميل الصفحة
  useEffect(() => {
    if (!isTopupCart) return;

    console.log('🔍 Initial localStorage check in CartPage');
    const topupData = localStorage.getItem('topupCustomer');
    if (topupData) {
      try {
        const data = JSON.parse(topupData);
        console.log('✅ Initial load - Found topupCustomer:', data);
        setName(data.name || '');
        setPhone(data.phone || '');
      } catch (err) {
        console.error('⚠️ Error in initial check:', err);
      }
    }
  }, [isTopupCart]);

  // مراقبة تغييرات topupCustomer في localStorage
  useEffect(() => {
    if (!isTopupCart) return;

    const handleStorageChange = () => {
      console.log('🔄 localStorage changed - reloading customer data');
      // تحقق من topupCustomer أولاً (أولوية أعلى)
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const data = JSON.parse(topupData);
          console.log('✅ Reloaded from topupCustomer (PRIORITY):', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          return;
        } catch (err) {
          console.error('⚠️ Error parsing topupCustomer:', err);
        }
      }
      
      // ثم جرب customerData
      const customerData = localStorage.getItem('customerData');
      if (customerData) {
        try {
          const data = JSON.parse(customerData);
          console.log('✅ Reloaded from customerData:', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
        } catch (err) {
          console.error('⚠️ Error parsing customerData:', err);
        }
      }
    };

    // Listen to storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check localStorage when component mounts or when topupCustomer might have changed
    const checkInterval = setInterval(() => {
      const current = localStorage.getItem('topupCustomer');
      if (current && current !== sessionStorage.getItem('lastTopupCustomer')) {
        sessionStorage.setItem('lastTopupCustomer', current);
        handleStorageChange();
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [isTopupCart]);

  // ملء الاسم والهاتف تلقائياً من بيانات المستخدم المسجل الدخول أو البيانات المحفوظة
  useEffect(() => {
    console.log('👤 Populating user data in CartPage');
    
    if (isTopupCart) {
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const data = JSON.parse(topupData);
          console.log('✅ Loading from topupCustomer (PRIORITY):', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          return;
        } catch (err) {
          console.error('⚠️ Error parsing topupCustomer:', err);
        }
      }
    }
    
    // ثانياً: إذا لم يكن topupCustomer، جرب customerData
    const customerData = localStorage.getItem('customerData');
    if (customerData) {
      try {
        const data = JSON.parse(customerData);
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        console.log('✅ Loaded from customerData:', data);
        return;
      } catch (err) {
        console.error('⚠️ Error parsing customerData:', err);
      }
    }
    
    // ثالثاً: جرب الحصول على بيانات المستخدم المسجل الدخول فقط إذا لم يكن هناك topup data
    if (user?.id && user?.name) {
      setName(user.name);
      if (user.phone) setPhone(user.phone);
      console.log('✅ Loaded from logged-in user:', { name: user.name });
      return;
    }
    
    // رابعاً: إذا لم يكن هناك user id، لا تفعل شيئاً
    console.log('ℹ️ No user data available');
  }, [isTopupCart, user?.id, user?.name, user?.phone]);

  // التحقق من العميل في قاعدة البيانات عند تغيير رقم الهاتف
  useEffect(() => {
    if (!phone || phone.length < 10) {
      setCustomerType(null);
      return;
    }

    let isMounted = true;

    const verifyCustomer = async () => {
      if (!items.length) return;
      
      try {
        setIsVerifyingCustomer(true);
        const storeId = items[0]?.store_id;
        if (!storeId) return;

        const res = await fetch(`/api/customers?storeId=${storeId}&phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data && data.id) {
          // وجد العميل - استخدم بيانته
          if (data.name) setName(data.name);
          setCustomerType(data.customer_type);
        } else {
          // لم يتم العثور على العميل - استخدم cash كافتراضي
          setCustomerType('cash');
        }
      } catch (err) {
        console.error('Failed to verify customer:', err);
        if (isMounted) {
          setCustomerType('cash');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingCustomer(false);
        }
      }
    };

    verifyCustomer();

    return () => {
      isMounted = false;
    };
  }, [phone, items.length]);

  // دالة مساعدة لحساب السعر الصحيح بناءً على نوع العميل ونوع المنتج
  const getItemPrice = (item: any, pricingCustomerType: string | null | undefined) => {
    // إذا كان المنتج topup (له retail_price أو wholesale_price)
    if (item.retail_price || item.wholesale_price) {
      if (pricingCustomerType === 'reseller') {
        return item.retail_price || item.wholesale_price || item.price || 0;
      } else {
        return item.wholesale_price || item.price || 0;
      }
    }
    
    // للمنتجات العادية
    if (pricingCustomerType === 'reseller' && item.bulk_price) {
      return item.bulk_price;
    }
    
    return Number(item.price) || 0;
  };

  const subtotal = items.reduce((sum, item) => {
    const pricingCustomerType = customerType || user?.customer_type;
    const itemPrice = getItemPrice(item, pricingCustomerType);
    return sum + itemPrice * item.quantity;
  }, 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = Math.floor((subtotal * Number(appliedCoupon.discount_value)) / 100);
    } else {
      discount = Math.floor(Number(appliedCoupon.discount_value));
    }
  }

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const res = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: items[0]?.store_id,
          code: couponCode,
          orderValue: subtotal
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  };

  const handleCheckout = async () => {
    // التحقق من جميع الحقول المطلوبة
    if (!phone.trim()) {
      alert('❌ يرجى إدخال رقم الهاتف');
      return;
    }

    if (!isTopupCart && !address.trim()) {
      alert('❌ يرجى إدخال عنوان التسليم');
      return;
    }

    // Step 1: Verify customer exists or can be created
    setIsCheckingOut(true);
    try {
      // Get the store ID from the first item
      const storeId = items[0]?.store_id;
      if (!storeId) {
        alert('لا توجد منتجات في السلة');
        setIsCheckingOut(false);
        return;
      }

      // Request 1: Verify customer in database
      const verifyRes = await fetch(`/api/customers?storeId=${storeId}&phone=${encodeURIComponent(phone)}`);
      const customerData = await verifyRes.json();

      let verifiedCustomer = customerData;
      
      if (!verifiedCustomer || !verifiedCustomer.id) {
        // Customer doesn't exist - create a new one or use guest data
        verifiedCustomer = {
          name: phone.trim(),
          phone: phone.trim(),
          address: address.trim(),
          customer_type: customerType || 'cash'
        };
      }

      // Show verification modal with customer details
      setVerificationModal({
        name: verifiedCustomer.name || phone.trim() || 'عميل',
        phone: phone.trim(),
        address: address.trim(),
        customer_type: verifiedCustomer.customer_type || customerType || 'cash',
        isExisting: !!customerData?.id
      });

      setIsCheckingOut(false);
    } catch (err) {
      console.error('خطأ في التحقق من بيانات العميل:', err);
      alert('حدث خطأ في التحقق من بيانات العميل');
      setIsCheckingOut(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!verificationModal) return;

    setIsConfirmingOrder(true);
    try {
      // First try to get customer_id from localStorage (topup customer data)
      let customerId = null;
      const savedCustomer = isTopupCart ? localStorage.getItem('topupCustomer') : null;
      if (savedCustomer) {
        try {
          const topupCustData = JSON.parse(savedCustomer);
          customerId = topupCustData.id;
        } catch (e) {
          console.error('Error parsing topupCustomer:', e);
        }
      }
      
      // Fallback to user.id or try to create guest customer
      if (!customerId && user?.id) {
        customerId = user.id;
      }
      
      if (!customerId) {
        try {
          const guestRes = await fetch('/api/admin/add-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim() || phone.trim(),
              phone: phone.trim(),
              role: 'customer',
              password: 'guest123'
            })
          });
          
          if (guestRes.ok) {
            const guestUser = await guestRes.json();
            customerId = guestUser.id;
          }
        } catch (err) {
          console.error('Failed to create guest customer:', err);
        }
      }
      
      const itemsByStore = enrichedItems.reduce((acc: any, item) => {
        const storeId = item.store_id;
        if (!acc[storeId]) {
          acc[storeId] = {
            items: [],
            store_type: item.store_type || 'regular'
          };
        }
        acc[storeId].items.push({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          product_name: (item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name,
          company_name: (item.store_name && item.store_name !== 'undefined') ? item.store_name : 'بدون شركة',
          image_url: item.image_url,
          topup_codes: item.topup_codes
        });
        return acc;
      }, {});

      const storeSubtotals = Object.keys(itemsByStore).reduce((acc: any, storeId) => {
        const storeItems = itemsByStore[storeId].items;
        const storeTotal = storeItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        acc[storeId] = storeTotal;
        return acc;
      }, {});

      const totalStoreAmount: number = (Object.values(storeSubtotals) as any[]).reduce((sum: number, amount: any) => sum + (Number(amount) || 0), 0);
      const subtotal = items.reduce((sum, item) => {
        const pricingCustomerType = customerType || user?.customer_type;
        const itemPrice = getItemPrice(item, pricingCustomerType);
        return sum + itemPrice * item.quantity;
      }, 0);
      
      let discount = 0;
      if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
          discount = Math.floor((subtotal * Number(appliedCoupon.discount_value)) / 100);
        } else {
          discount = Math.floor(Number(appliedCoupon.discount_value));
        }
      }

      const orderConfirmations: any[] = [];
      
      for (const storeId of Object.keys(itemsByStore)) {
        const storeInfo = itemsByStore[storeId];
        const storeItems = storeInfo.items;
        const storeType = storeInfo.store_type;
        const storeAmount = Number(storeSubtotals[storeId]) || 0;
        const storeDiscount = totalStoreAmount > 0 ? (storeAmount / totalStoreAmount) * discount : 0;
        
        // For topup stores, use /api/topup/purchase instead of /api/orders
        if (storeType === 'topup') {
          // Create separate orders for each topup item (API limitation)
          const confirmationItems: any[] = [];
          let allCodes: string[] = [];

          for (const item of storeItems) {
            const itemAmount = item.price * item.quantity;
            const itemDiscount = storeAmount > 0 ? (itemAmount / storeAmount) * storeDiscount : 0;
            
            const res = await fetch('/api/topup/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                store_id: parseInt(storeId),
                topup_product_id: item.product_id,
                quantity: item.quantity,
                customer_id: customerId || null,
                customer_type: customerType || user?.customer_type || 'cash',
                phone: phone.trim(),
                address: address.trim(),
                total_amount: itemAmount - itemDiscount
              })
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'فشل إنشاء طلب الشحن');
            }

            // Fetch topup codes for this order
            let itemCodes: string[] = [];
            try {
              const codesRes = await fetch(`/api/topup/order-codes/${data.order_id}`);
              const codesData = await codesRes.json();
              
              if (Array.isArray(codesData)) {
                itemCodes = codesData;
              } else if (codesData.codes && Array.isArray(codesData.codes)) {
                itemCodes = codesData.codes;
              } else if (codesData.data && Array.isArray(codesData.data)) {
                itemCodes = codesData.data;
              }
              
              console.log('📨 Fetched codes from API:', {
                orderId: data.order_id,
                codesCount: itemCodes.length
              });
            } catch (err) {
              console.error('Failed to fetch topup codes:', err);
            }

            allCodes = [...allCodes, ...itemCodes];
            confirmationItems.push({
              ...item,
              product_name: (item.product_name && item.product_name !== 'undefined') 
                ? item.product_name 
                : (item.name || 'منتج'),
              company_name: (item.company_name && item.company_name !== 'undefined') 
                ? item.company_name 
                : 'غير محدد'
            });
          }

          // Create single confirmation with all items
          orderConfirmations.push({
            orderId: `${storeId}-${Date.now()}`,
            items: confirmationItems,
            codes: allCodes
          });
          
          console.log('📦 Order confirmation created for store:', {
            itemsCount: storeItems.length,
            totalCodesCount: allCodes.length
          });
        } else {
          // Regular store order using /api/orders endpoint
          const orderPayload = {
            items: storeItems,
            total_amount: storeAmount - storeDiscount,
            coupon_id: appliedCoupon?.id,
            discount_amount: storeDiscount,
            customer_id: customerId,
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            store_id: parseInt(storeId),
            is_topup: false
          };

          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'فشل في إتمام الطلب');
          }
        }
      }

      setAppliedCoupon(null);
      setVerificationModal(null);
      
      if (orderConfirmations.length > 0) {
        const confirmation = {
          type: 'topup',
          confirmations: orderConfirmations,
          totalAmount: subtotal - discount
        };
        setOrderConfirmation(confirmation);
        // حفظ في localStorage حتى يتمكن العميل من الوصول للأكواد لاحقاً
        localStorage.setItem('orderConfirmation', JSON.stringify(confirmation));
        console.log('💾 Saved order confirmation to localStorage');
      } else {
        clearCart();
        alert(`تم تقديم الطلب بنجاح! تم إنشاء ${Object.keys(itemsByStore).length} طلب`);
        navigate('/');
      }
    } catch (err: any) {
      alert(`خطأ: ${err.message || 'فشل في إتمام الطلب'}`);
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  // عرض تأكيد الطلب مع الأكواد
  if (orderConfirmation) {
    return (
      <div className={cn("w-full min-h-screen p-4 sm:p-8", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal mb-2">✅ تم تأكيد الطلب بنجاح!</h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>الإجمالي: {formatCurrency(orderConfirmation.totalAmount)}</p>
          </div>

          <div className="space-y-4 md:hidden">
            {orderConfirmation.confirmations.map((conf: any, idx: number) => 
              conf.items.map((item: any, itemIdx: number) => {
                let codes = conf.codes;
                if (!Array.isArray(codes)) {
                  codes = [];
                }

                const displayQuantity = item.quantity || 0;
                const availableCodes = codes.slice(0, displayQuantity);

                let displayName = '';
                if (item.product_name && item.product_name !== 'undefined') {
                  displayName = item.product_name;
                } else if (item.company_name && item.company_name !== 'undefined' && item.name) {
                  displayName = `${item.company_name} - ${item.name}`;
                } else if (item.name) {
                  displayName = item.name;
                } else {
                  displayName = 'منتج بدون اسم';
                }

                return (
                  <div key={`${idx}-${itemIdx}`} className={cn("rounded-2xl border p-4", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}>
                    <div className="mb-3">
                      <h3 className={cn("font-normal text-sm leading-6 break-words", isDarkMode ? "text-gray-100" : "text-gray-900")}>{displayName}</h3>
                      <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الكمية: {displayQuantity}</p>
                    </div>
                    {availableCodes.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {availableCodes.map((code: string, cIdx: number) => (
                          <div key={cIdx} className={cn("px-3 py-2 rounded-xl font-mono text-sm text-center break-all", isDarkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900 border border-gray-200")}>
                            {code}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* جدول المنتجات والأكواد */}
          <div className={cn("hidden md:block rounded-lg border overflow-auto", isDarkMode ? "border-gray-700" : "border-gray-200")}>
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
                  <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المنتج</th>
                  <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الكمية</th>
                  <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الأكواد</th>
                </tr>
              </thead>
              <tbody>
                {orderConfirmation.confirmations.map((conf: any, idx: number) => 
                  conf.items.map((item: any, itemIdx: number) => {
                    // الحصول على الأكواد والتأكد من أنها array
                    let codes = conf.codes;
                    if (!Array.isArray(codes)) {
                      codes = [];
                    }
                    
                    // الكمية المطلوبة
                    const displayQuantity = item.quantity || 0;
                    
                    // الأكواد المتاحة حسب الكمية
                    const availableCodes = codes.slice(0, displayQuantity);
                    
                    // بناء اسم المنتج - تأكد من عدم معاملة undefined
                    let displayName = '';
                    if (item.product_name && item.product_name !== 'undefined') {
                      displayName = item.product_name;
                    } else if (item.company_name && item.company_name !== 'undefined' && item.name) {
                      displayName = `${item.company_name} - ${item.name}`;
                    } else if (item.name) {
                      displayName = item.name;
                    } else {
                      displayName = 'منتج بدون اسم';
                    }
                    
                    console.log('🔍 Rendering item:', {
                      product_name: item.product_name,
                      company_name: item.company_name,
                      name: item.name,
                      displayName: displayName,
                      quantity: displayQuantity,
                      totalCodesAvailable: codes.length,
                      availableCodesCount: availableCodes.length,
                      codes: codes
                    });
                    
                    return (
                      <tr key={`${idx}-${itemIdx}`} className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td className={cn("px-6 py-4 text-right align-top min-w-56", isDarkMode ? "text-gray-200 bg-gray-900/30" : "text-gray-800 bg-gray-50/30")}>
                          <div className="font-normal text-sm break-words">{displayName}</div>
                        </td>
                        <td className={cn("px-6 py-4 text-center align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          <div className="font-semibold text-lg">{displayQuantity}</div>
                        </td>
                        <td className={cn("px-6 py-4 text-right align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          {availableCodes.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {availableCodes.map((code: string, cIdx: number) => (
                                <div key={cIdx} className={cn("px-3 py-2 rounded font-mono text-sm text-center", isDarkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-900")}>
                                  {code}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">لا توجد أكواد متاحة</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* أزرار النسخ والعودة */}
          <div className={cn("mt-8 flex flex-col sm:flex-row gap-4 justify-center")}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  orderConfirmation.confirmations
                    .map((conf: any) => 
                      conf.items
                        .map((item: any, idx: number) => {
                          const codes = conf.codes?.slice(0, item.quantity) || [];
                          return `${item.product_name}:\n${codes.join('\n')}`;
                        })
                        .join('\n\n')
                    )
                    .join('\n\n---\n\n')
                );
                alert('✅ تم نسخ الأكواد!');
              }}
              className="px-8 py-3 rounded-lg text-white font-normal transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              📋 نسخ الأكواد
            </button>

            <button
              onClick={() => {
                clearCart();
                setOrderConfirmation(null);
                localStorage.removeItem('orderConfirmation');
                navigate('/');
              }}
              className={cn("px-8 py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-100" : "bg-gray-300 hover:bg-gray-400 text-gray-900")}
            >
              ← العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 text-center" dir="rtl">
        <div className={cn("p-12 rounded-2xl shadow-sm", isDarkMode ? "bg-gray-800" : "bg-white")}>
          <ShoppingCart size={64} className={cn("mx-auto mb-4", isDarkMode ? "text-gray-700" : "text-gray-300")} />
          <h2 className={cn("text-2xl font-normal mb-2", isDarkMode ? "text-gray-200" : "text-gray-900")}>عربة التسوق فارغة</h2>
          <p className={cn("mb-8", isDarkMode ? "text-gray-400" : "text-gray-500")}>لم تضف أي منتجات إلى سلتك بعد.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-xl text-white font-normal transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            تصفح المنتجات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-h-screen", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      {/* Header */}
      <div className={cn("px-4 py-4 sm:px-8 sm:py-6 border-b", isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200")}>
        <h1 className={cn("text-2xl sm:text-3xl font-normal flex items-center gap-3", isDarkMode ? "text-gray-100" : "text-gray-900")}>
          <ShoppingCart className="text-indigo-600" />
          عربة التسوق
        </h1>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* جدول المنتجات */}
          <div className="xl:col-span-2">
            <div className={cn("hidden md:block overflow-x-auto rounded-lg border", isDarkMode ? "border-gray-700" : "border-gray-200")}>
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المنتج</th>
                    <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>العدد</th>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>السعر</th>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الإجمالي</th>
                    <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedItems.map((item) => (
                    <tr key={item.id} className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                      <td className={cn("px-6 py-4 border-t", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        {console.log('Enriched item:', { id: item.id, name: item.name, store_name: item.store_name })}
                        {(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name || `[بدون اسم - رقم: ${item.id}]`}
                      </td>
                      <td className={cn("px-6 py-4 border-t text-center", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                            className={cn("px-2 py-1 rounded border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                            title="تقليل الكمية"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-lg font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={cn("px-2 py-1 rounded border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                            title="زيادة الكمية"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className={cn("px-6 py-4 border-t", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        {formatCurrency(
                          getItemPrice(item, customerType || user?.customer_type)
                        )}
                      </td>
                      <td className={cn("px-6 py-4 border-t font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                        {formatCurrency(
                          getItemPrice(item, customerType || user?.customer_type) * item.quantity
                        )}
                      </td>
                      <td className={cn("px-6 py-4 border-t text-center")}>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {enrichedItems.map((item) => (
                <div key={item.id} className={cn("rounded-2xl border p-4", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={cn("font-normal text-sm leading-6 break-words", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                        {(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name || `[بدون اسم - رقم: ${item.id}]`}
                      </h3>
                      <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                        سعر الوحدة: {formatCurrency(getItemPrice(item, customerType || user?.customer_type))}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                        className={cn("px-3 py-1.5 rounded-xl border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                        title="تقليل الكمية"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-base font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={cn("px-3 py-1.5 rounded-xl border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                        title="زيادة الكمية"
                      >
                        +
                      </button>
                    </div>
                    <div className={cn("text-sm font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                      {formatCurrency(getItemPrice(item, customerType || user?.customer_type) * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* الملخص والأزرار */}
          <div className={cn("p-4 sm:p-6 rounded-lg border xl:sticky xl:top-8 h-fit", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}>
            {/* قسيمة الخصم */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>قسيمة الخصم</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input 
                  type="text"
                  placeholder="أدخل الرمز"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className={cn("flex-1 px-3 py-2 border rounded text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 rounded text-white font-normal text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  تطبيق
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs">{couponError}</p>}
              {appliedCoupon && (
                <div className="p-2 bg-green-500/10 rounded border border-green-500/30 text-xs text-green-600 mt-2">
                  ✅ تطبيق: {appliedCoupon.code} ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : formatCurrency(appliedCoupon.discount_value)})
                </div>
              )}
            </div>

            {/* بيانات التسليم */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              {isTopupCart && (
                <>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>الاسم</label>
                  <input 
                    type="text"
                    value={name}
                    readOnly
                    placeholder="اسم العميل المسجل"
                    className={cn("w-full px-3 py-2 border rounded text-sm mb-3 cursor-not-allowed", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700")}
                  />
                </>
              )}
              <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}> الهاتف</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="أدخل رقم الهاتف"
                readOnly={isTopupCart}
                className={cn("w-full px-3 py-2 border rounded text-sm mb-3", isTopupCart ? (isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed" : "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed") : (isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"))}
              />
              {isTopupCart && (
                <p className={cn("text-xs mb-3", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                  تم تعبئة الاسم ورقم الهاتف من تسجيل دخول العميل في متجر الشحن.
                </p>
              )}
              {!isTopupCart && (
                <>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>📍 العنوان</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="أدخل عنوان التسليم"
                    className={cn("w-full px-3 py-2 border rounded text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </>
              )}
              
              {/* عرض نوع العميل والسعر المطبق */}
              {phone && (
                <div className={cn("mt-4 p-3 rounded text-sm", isDarkMode ? "bg-gray-700" : "bg-blue-50")}>
                  {isVerifyingCustomer ? (
                    <p className="text-gray-500">🔍 جاري التحقق من بيانات العميل...</p>
                  ) : customerType ? (
                    <p className={isDarkMode ? "text-blue-300" : "text-blue-700"}>
                      {customerType === 'reseller' ? '🏪 عميل جملة (نقطة البيع)' : '👤 عميل نقدي (مفرد)'}
                      {customerType === 'reseller' && ' - سيتم تطبيق أسعار الجملة'}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* الملخص */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-normal">
                    <span>الخصم</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-normal text-lg pt-2" style={{color: primaryColor}}>
                  <span>الإجمالي</span>
                  <span>{formatCurrency(subtotal - discount)}</span>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="space-y-2">
              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut || items.length === 0 || !phone.trim() || (!isTopupCart && !address.trim())}
                className="w-full py-3 rounded-lg text-white font-normal transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isCheckingOut ? '⏳ جاري...' : '✅ تأكيد الشراء'}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className={cn("w-full py-2 rounded-lg font-normal transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              >
                ✕ إلغاء
              </button>
            </div>
          </div>
        </div>

        {/* Quantity Selector Modal */}
        {selectedForQuantity && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 dir-rtl" dir="rtl">
            <div className={cn("rounded-lg shadow-xl max-w-sm w-full", isDarkMode ? "bg-gray-800" : "bg-white")}>
              {/* Header */}
              <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className={cn("text-lg font-bold mb-1", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                      تعديل الكمية
                    </h2>
                    <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {(selectedForQuantity.store_name && selectedForQuantity.store_name !== 'undefined') ? `${selectedForQuantity.store_name} - ${selectedForQuantity.name}` : selectedForQuantity.name || 'منتج'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedForQuantity(null)}
                    className={cn("text-xl font-bold transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600")}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Product Image */}
                {selectedForQuantity.image_url && (
                  <img 
                    src={selectedForQuantity.image_url} 
                    alt={selectedForQuantity.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}

                {/* Price Display */}
                <div className={cn("mb-6 p-4 rounded-lg text-center", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                  <p className={cn("text-xs mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>السعر للوحدة</p>
                  <p className={cn("text-2xl font-bold", isDarkMode ? "text-blue-300" : "text-blue-600")}>
                    {formatCurrency(
                      (customerType === 'reseller' && selectedForQuantity.bulk_price)
                        ? selectedForQuantity.bulk_price
                        : Number(selectedForQuantity.price)
                    )}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="space-y-4">
                  <div className="text-center">
                    <p className={cn("text-xs mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>الكمية</p>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                        className={cn("w-12 h-12 rounded-lg font-bold text-xl transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-900")}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className={cn("w-20 h-16 text-4xl font-bold text-center rounded-lg border-2 transition-colors", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900")}
                      />
                      <button
                        onClick={() => setQuantityInput(quantityInput + 1)}
                        className={cn("w-12 h-12 rounded-lg font-bold text-xl transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-900")}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className={cn("p-4 rounded-lg text-center", isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200")}>
                    <p className={cn("text-xs mb-1", isDarkMode ? "text-green-400" : "text-green-600")}>الإجمالي</p>
                    <p className={cn("text-2xl font-bold", isDarkMode ? "text-green-300" : "text-green-700")}>
                      {formatCurrency(
                        quantityInput * (
                          (customerType === 'reseller' && selectedForQuantity.bulk_price)
                            ? selectedForQuantity.bulk_price
                            : Number(selectedForQuantity.price)
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={cn("p-4 border-t flex gap-3", isDarkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                <button
                  onClick={() => {
                    updateQuantity(selectedForQuantity.id, quantityInput);
                    setSelectedForQuantity(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-white font-normal transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  ✅ تطبيق
                </button>
                <button
                  onClick={() => setSelectedForQuantity(null)}
                  className={cn("flex-1 py-2 rounded-lg font-normal transition-colors", isDarkMode ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-900 hover:bg-gray-300")}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Confirmation Modal */}
        {verificationModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 dir-rtl" dir="rtl">
            <div className={cn("rounded-lg shadow-xl max-w-sm w-full", isDarkMode ? "bg-gray-800" : "bg-white")}>
              {/* Header */}
              <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-blue-50")}>
                <h2 className={cn("text-lg font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                  🔍 تأكيد بيانات العميل
                </h2>
                <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  يرجى تأكيد بيانات العميل قبل إتمام الطلب
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Address */}
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <p className={cn("text-xs mb-2 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>📍 العنوان</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {verificationModal.address}
                  </p>
                </div>

                {/* Phone */}
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <p className={cn("text-xs mb-2 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>📱 الهاتف</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {verificationModal.phone}
                  </p>
                </div>

                {/* Customer Type Badge */}
                <div className={cn("p-4 rounded-lg", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "bg-purple-900/30 border border-purple-700" : "bg-purple-50 border border-purple-200") : (isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"))}>
                  <p className={cn("text-xs font-medium", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "text-purple-400" : "text-purple-600") : (isDarkMode ? "text-green-400" : "text-green-600"))}>
                    نوع العميل
                  </p>
                  <p className={cn("text-lg font-bold mt-1", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "text-purple-300" : "text-purple-700") : (isDarkMode ? "text-green-300" : "text-green-700"))}>
                    {verificationModal.customer_type === 'reseller' ? '🏪 عميل جملة' : '👤 عميل نقدي'}
                  </p>
                </div>

                {/* Status */}
                {verificationModal.isExisting && (
                  <div className={cn("p-3 rounded-lg text-sm", isDarkMode ? "bg-green-900/20 text-green-300" : "bg-green-100 text-green-700")}>
                    ✅ تم العثور على بيانات العميل في قاعدة البيانات
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={cn("p-4 border-t flex gap-3", isDarkMode ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                <button
                  onClick={handleConfirmOrder}
                  disabled={isConfirmingOrder}
                  className="flex-1 py-2 rounded-lg text-white font-normal transition-all disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isConfirmingOrder ? '⏳ جاري...' : '✅ تأكيد والدفع'}
                </button>
                <button
                  onClick={() => setVerificationModal(null)}
                  disabled={isConfirmingOrder}
                  className={cn("flex-1 py-2 rounded-lg font-normal transition-colors disabled:opacity-50", isDarkMode ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-900 hover:bg-gray-300")}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Menu Modal - shows dashboard sections
// Login Required Modal - shows when user tries to access dashboard without login
const LoginRequiredModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: () => void }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      {/* Modal */}
      <div 
        className={cn(
          "fixed bottom-20 left-0 right-0 z-50 mx-auto w-96 max-w-sm p-6 rounded-t-3xl border-t border-l border-r md:hidden",
          isDarkMode 
            ? "bg-gray-800 border-gray-700 shadow-xl" 
            : "bg-white border-gray-200 shadow-xl"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            تسجيل الدخول مطلوب
          </h3>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            )}
          >
            <X size={20} />
          </button>
        </div>
        
        <p className={cn("mb-6 text-sm leading-relaxed", isDarkMode ? "text-gray-300" : "text-gray-600")}>
          لغرض عرض الداشبورد يجب تسجيل الدخول، وبعد تسجيل الدخول يمكن للأيقونة عرض داشبورد المتجر المفتوح
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              "flex-1 px-4 py-2 rounded-xl font-medium transition-colors",
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "bg-gray-100 hover:bg-gray-200 text-gray-900"
            )}
          >
            إغلاق
          </button>
          <button
            onClick={onLogin}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </>
  );
};

// Dashboard Menu Modal
const DashboardMenuModal = ({ isOpen, onClose, onSelectSection }: { isOpen: boolean; onClose: () => void; onSelectSection: (section: string) => void }) => {
  const { isDarkMode } = useTheme();
  
  const dashboardSections = [
    { icon: BarChart3, label: 'الإحصائيات', section: 'stats' },
    { icon: Package, label: 'المنتجات', section: 'products' },
    { icon: ShoppingCart, label: 'الطلبات', section: 'orders' },
    { icon: Users, label: 'العملاء', section: 'customers' },
    { icon: Ticket, label: 'الكوبونات', section: 'coupons' },
    { icon: Gift, label: 'المزادات', section: 'auctions' },
    { icon: Settings, label: 'الإعدادات', section: 'settings' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      {/* Modal */}
      <div 
        className={cn(
          "fixed bottom-20 left-0 right-0 z-50 mx-auto w-96 max-w-sm p-4 rounded-t-3xl border-t border-l border-r md:hidden",
          isDarkMode 
            ? "bg-gray-800 border-gray-700 shadow-xl" 
            : "bg-white border-gray-200 shadow-xl"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn("text-lg font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
            لوحة التحكم
          </h3>
          <button
            onClick={onClose}
            className={cn(
              "p-1 rounded-lg transition-colors",
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            )}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {dashboardSections.map((section) => (
            <button
              key={section.section}
              onClick={() => {
                onSelectSection(section.section);
                onClose();
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                  : "bg-gray-50 hover:bg-gray-100 text-gray-900"
              )}
            >
              <section.icon size={24} />
              <span className="text-xs font-medium text-center">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// Mobile Footer Navigation Component
const MobileFooterNav = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  
  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: StoreIcon, label: 'المتاجر', path: '/stores' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleDashboardClick = () => {
    if (user) {
      setShowDashboardMenu(true);
    } else {
      setShowLoginMessage(true);
    }
  };

  const handleDashboardSelect = (section: string) => {
    if (user) {
      navigate(`/merchant/${section}`);
    } else {
      navigate('/login');
    }
  };

  const handleLoginFromModal = () => {
    setShowLoginMessage(false);
    navigate('/login');
  };

  return (
    <>
      <div className={cn("fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex", isDarkMode ? "bg-gray-800/95 border-gray-700 backdrop-blur-sm" : "bg-white/95 border-black/5 backdrop-blur-sm")}>
        <div className="w-full flex items-stretch gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={`mobile-nav-${item.path}`}
              to={item.path}
              className={cn(
                "relative min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors",
                isActive(item.path)
                  ? (isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-indigo-50 text-indigo-600")
                  : (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")
              )}
            >
              <div className="flex flex-col items-center gap-1">
                {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                <span className="text-[10px] leading-tight line-clamp-2">{item.label}</span>
              </div>
            </Link>
          ))}
          
          {/* Dashboard Button */}
          <button
            onClick={handleDashboardClick}
            className={cn(
              "relative min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors",
              (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <LayoutDashboard size={18} className="flex-shrink-0" />
              <span className="text-[10px] leading-tight line-clamp-2">
                {user ? 'داشبورد' : 'تسجيل'}
              </span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Dashboard Menu Modal */}
      {user && (
        <DashboardMenuModal
          isOpen={showDashboardMenu}
          onClose={() => setShowDashboardMenu(false)}
          onSelectSection={handleDashboardSelect}
        />
      )}

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginMessage}
        onClose={() => setShowLoginMessage(false)}
        onLogin={handleLoginFromModal}
      />
    </>
  );
};

// Mobile Footer Nav for Store Pages (with back button and cart)
const StorePageMobileFooter = ({ storeSlug, cartCount, isTopup = false }: { storeSlug?: string; cartCount?: number; isTopup?: boolean }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { items } = useRegularCartStore();
  const { items: topupItems } = useTopupCartStore();
  // Use topup items if available (for TopupStorefront), else use regular items
  const itemsCount = cartCount || (isTopup ? topupItems.length : items.length);
  const cartPath = isTopup ? '/topup-cart' : '/cart';

  return (
    <div className={cn("fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex", isDarkMode ? "bg-gray-800/95 border-gray-700 backdrop-blur-sm" : "bg-white/95 border-black/5 backdrop-blur-sm")}>
      <div className="w-full flex items-stretch gap-2">
        {/* Back Button */}
        <button
          onClick={() => navigate('/stores')}
          className={cn(
            "min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors",
            isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <ArrowRight size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">عودة</span>
          </div>
        </button>

        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className={cn(
            "min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors",
            isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <Home size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الرئيسية</span>
          </div>
        </button>

        {/* Cart Button */}
        <button
          onClick={() => navigate(cartPath)}
          className={cn(
            "min-w-[72px] flex-1 relative rounded-2xl px-2 py-2 text-center transition-colors",
            isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <ShoppingCart size={18} className="flex-shrink-0" />
              {itemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">السلة</span>
          </div>
        </button>

        {/* Stores Button */}
        <button
          onClick={() => navigate('/stores')}
          className={cn(
            "min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors",
            isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <StoreIcon size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">متاجر</span>
          </div>
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Load ADMIN settings only (not merchant settings)
  const [adminAppName, setAdminAppName] = useState('منصتي');
  const [adminLogoUrl, setAdminLogoUrl] = useState('');
  
  useEffect(() => {
    // Fetch admin settings specifically
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && data.app_name) {
          setAdminAppName(data.app_name);
          setAdminLogoUrl(data.logo_url || '');
          console.log("📋 Loaded ADMIN settings for login page:", data);
        }
      })
      .catch(err => console.error("Failed to load admin settings:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (res.ok) {
        const user = await res.json();
        setUser(user);
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'merchant') {
          // For merchants, always go to regular merchant dashboard
          // TopupStorefront is for customers, not merchants
          navigate('/merchant');
        }
        else navigate('/');
      } else {
        setError('رقم الهاتف أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ ما');
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
      <div className={cn("border-b py-4 px-6", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-indigo-600 font-normal text-sm hover:text-indigo-700 transition-colors">
            العودة للمنصة
          </Link>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2.5 rounded-lg border transition-all flex items-center justify-center",
              isDarkMode 
                ? "bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800" 
                : "bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100"
            )}
            title={isDarkMode ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center flex-1 p-4 pb-28 md:pb-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 font-normal mb-6 hover:gap-3 transition-all">
          <ChevronRight size={20} className="rotate-180" />
          <span>العودة للمنصة العامة</span>
        </Link>
        <Card className="p-8">
          <div className="text-center mb-8">
            {adminLogoUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-indigo-50 shadow-lg bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <img src={adminLogoUrl} className="w-full h-full object-cover" alt="admin-logo" />
              </div>
            ) : null}
            <h1 className="text-4xl font-normal tracking-tighter text-indigo-600">{adminAppName}</h1>
            <p className="text-gray-500 mt-2">أهلا بعودتك للمنصة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={cn("block text-sm font-normal mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>رقم الهاتف</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              className={cn("w-full px-4 py-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 text-gray-900")}  
                placeholder="077XXXXXXXX"
                required
              />
            </div>
            <div>
              <label className={cn("block text-sm font-normal mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              className={cn("w-full px-4 py-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 text-gray-900")}  
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className={cn("text-sm font-medium", isDarkMode ? "text-red-400" : "text-red-500")}>{error}</p>}
            <Button type="submit" className="w-full bg-indigo-600 text-white py-4 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              تسجيل الدخول
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/register-merchant" className="block text-sm font-normal text-indigo-600 hover:text-indigo-700">
              هل تريد فتح متجرك الخاص؟ سجل كتاجر الآن
            </Link>
            <Link to="/" className={cn("block text-sm font-normal", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")}>
              تصفح المنصة كزائر
            </Link>
          </div>


        </Card>
      </motion.div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

const RegisterMerchantPage = () => {
  const { appName } = useSettingsStore();
  const { logout } = useAuthStore();
  const { isDarkMode } = useTheme();
  const [showStoreTypeModal, setShowStoreTypeModal] = useState(true);
  const [storeType, setStoreType] = useState<'regular' | 'topup' | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    category: 'عام',
    storeType: 'regular'
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectStoreType = (type: 'regular' | 'topup') => {
    setStoreType(type);
    setFormData({...formData, storeType: type});
    setShowStoreTypeModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/register-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          store_name: formData.storeName,
          category: formData.category,
          storeType: formData.storeType
        })
      });
      
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'فشل تسجيل الطلب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Modal for store type selection
  if (showStoreTypeModal) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")} dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className={cn("p-10", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
            <div className="text-center mb-12">
              <h1 className={cn("text-3xl font-normal mb-4 tracking-tighter", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                اختر نوع متجرك
              </h1>
              <p className={cn("text-lg font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                ما نوع المنتجات التي تريد بيعها؟
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Regular Store Option */}
              <motion.button
                whileHover={{ y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
                onClick={() => handleSelectStoreType('regular')}
                className={cn(
                  "p-8 rounded-2xl border-2 transition-all text-center group",
                  isDarkMode 
                    ? "bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700 hover:border-blue-600" 
                    : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-400"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <StoreIcon size={32} />
                </div>
                <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? "text-blue-300" : "text-blue-700")}>
                  متجر عادي
                </h3>
                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  أزياء، إلكترونيات، منزليات، أو أي منتجات أخرى
                </p>
                <div className={cn("mt-4 pt-4 border-t text-xs font-normal", isDarkMode ? "border-blue-700 text-blue-400" : "border-blue-200 text-blue-600")}>
                  ← اضغط للمتابعة
                </div>
              </motion.button>

              {/* Top-Up Store Option */}
              <motion.button
                whileHover={{ y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
                onClick={() => handleSelectStoreType('topup')}
                className={cn(
                  "p-8 rounded-2xl border-2 transition-all text-center group",
                  isDarkMode 
                    ? "bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700 hover:border-green-600" 
                    : "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:border-green-400"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-green-600 text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard size={32} />
                </div>
                <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? "text-green-300" : "text-green-700")}>
                  متجر بطاقات شحن
                </h3>
                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  بطاقات شحن تعبئة الرصيد (Zain, Asiacell, Korek...)
                </p>
                <div className={cn("mt-4 pt-4 border-t text-xs font-normal", isDarkMode ? "border-green-700 text-green-400" : "border-green-200 text-green-600")}>
                  ← اضغط للمتابعة
                </div>
              </motion.button>
            </div>

            <p className={cn("mt-8 text-center text-xs font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>
              يمكنك تغيير نوع المتجر لاحقاً من إعدادات حسابك
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="p-10 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h1 className={cn("text-2xl font-normal mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>تم استلام طلبك بنجاح!</h1>
            <p className={cn("mb-8 font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              شكرًا لاهتمامك بالانضمام إلى {appName}. طلبك الآن قيد المراجعة من قبل الإدارة، وسنقوم بالتواصل معك عبر تليجرام فور تفعيل المتجر.
            </p>
            <Button 
              onClick={() => {
                logout();
                window.location.href = '/login';
              }} 
              className="w-full bg-indigo-600 text-white py-4 font-normal rounded-xl"
            >
              العودة لتسجيل الدخول
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen py-12 px-4 pb-28 md:pb-12 flex flex-col items-center justify-center", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <Card className="p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 text-xs font-normal mb-3">
              {storeType === 'topup' ? '💳 متجر بطاقات شحن' : '🛍️ متجر عادي'}
            </div>
            <h1 className="text-3xl font-normal text-indigo-600 tracking-tighter mb-2">انضم كتاجر</h1>
            <p className="text-gray-500 font-medium">ابدأ رحلتك التجارية معنا اليوم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>الاسم الكامل</label>
                <input 
                  type="text" 
                  required
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="محمد علي"
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المتجر</label>
                <input 
                  type="text" 
                  required
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value})}
                  placeholder={storeType === 'topup' ? 'متجر بطاقاتي' : 'متجر الأناقة'}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>معرّف تليجرام أو رقم الهاتف</label>
              <input 
                type="tel" 
                required
                className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="07XXXXXXXX"
                dir="rtl"
              />
            </div>

            <div>
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>البريد الإلكتروني <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>(اختياري)</span></label>
              <input 
                type="email"
                className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="example@email.com (اختياري)"
              />
            </div>

            <div>
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>كلمة المرور</label>
              <input 
                type="password" 
                required
                className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>

            {storeType === 'regular' && (
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>تصنيف المتجر</label>
                <select 
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="عام">عام</option>
                  <option value="أزياء">أزياء</option>
                  <option value="إلكترونيات">إلكترونيات</option>
                  <option value="المنزل">المنزل</option>
                </select>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-normal text-center bg-red-50 py-3 rounded-xl">{error}</p>}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 text-lg font-normal shadow-xl shadow-indigo-100 mt-4 disabled:opacity-50 rounded-xl"
            >
              {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowStoreTypeModal(true);
                setStoreType(null);
              }}
              className="w-full text-sm font-normal text-gray-400 hover:text-indigo-600 transition-colors py-2"
            >
              ← تغيير نوع المتجر
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-normal text-gray-400 hover:text-indigo-600">
                لديك حساب بالفعل؟ سجل دخولك
              </Link>
            </div>
          </form>
        </Card>
      </motion.div>
      <MobileFooterNav />
    </div>
  );
};

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const [stores, setStores] = useState<(Store & { owner_name?: string; status?: string; owner_phone?: string; slug?: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStores: 0, totalUsers: 0, totalCustomers: 0, totalRevenue: 0, totalOrders: 0, adminCommissionPercentage: 0, adminCommission: 0, merchantRevenue: 0 });
  const { section } = useParams();
  const navigate = useNavigate();
  const { appName, logoUrl, setSettings } = useSettingsStore();
  const { dashboardQuery } = useSearchStore();
  const adminLogoUploadRef = useRef<HTMLInputElement>(null);

  const [adminConfig, setAdminConfig] = useState({ app_name: appName, logo_url: logoUrl, admin_commission_percentage: 0 });
  
  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  const filteredStores = stores.filter(s => 
    ((s as any).store_name || s.name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_phone || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    ((s as any).slug || '').toLowerCase().includes(dashboardQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (u.phone || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(dashboardQuery.toLowerCase()))
  );

  const isStoreApproved = (store: any) => Boolean(store?.is_active || store?.status === 'approved' || store?.status === 'active');
  const isStorePending = (store: any) => Boolean(!isStoreApproved(store) && store?.status === 'pending');
  
  useEffect(() => {
    if (section === 'settings') {
      fetch('/api/settings?role=admin')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object' && !data.error && data.app_name) {
            console.log("📋 Loaded settings:", data);
            const commValue = parseFloat(data.admin_commission_percentage);
            setAdminConfig({
              app_name: data.app_name || appName || '',
              logo_url: data.logo_url || logoUrl || '',
              admin_commission_percentage: isNaN(commValue) ? 0 : commValue
            });
          }
        })
        .catch((err) => {
          console.error("Error loading settings:", err);
        });
    }
  }, [section]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [storesRes, statsRes, usersRes, ordersRes, customersRes, adminUsersRes] = await Promise.all([
          fetch('/api/stores').then(res => res.json()).catch(() => []),
          fetch('/api/admin/stats').then(res => res.json()).catch(() => ({})),
          fetch('/api/admin/users').then(res => res.json()).catch(() => []),
          fetch('/api/admin/orders-report').then(res => res.json()).catch(() => []),
          fetch('/api/admin/customers').then(res => res.json()).catch(() => []),
          fetch('/api/admin/admin-users').then(res => res.json()).catch(() => [])
        ]);
        
        // Check if today is the 27th of the month
        const today = new Date();
        const is27th = today.getDate() === 27;
        
        // If today is the 27th, set all subscription_paid to false
        let processedOrders = Array.isArray(ordersRes) ? ordersRes : [];
        if (is27th) {
          processedOrders = processedOrders.map(order => ({
            ...order,
            subscription_paid: false
          }));
        }
        
        setStores(Array.isArray(storesRes) ? storesRes : []);
        setStats(statsRes && typeof statsRes === 'object' && !statsRes.error ? statsRes : { totalStores: 0, totalUsers: 0, totalCustomers: 0, totalRevenue: 0, totalOrders: 0, adminCommissionPercentage: 0, adminCommission: 0, merchantRevenue: 0 });
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setCustomers(Array.isArray(customersRes) ? customersRes : []);
        setAdminUsers(Array.isArray(adminUsersRes) ? adminUsersRes : []);
        setAdminOrders(processedOrders);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [section]);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [storesRes, statsRes, usersRes, ordersRes, customersRes, adminUsersRes] = await Promise.all([
          fetch('/api/stores').then(res => res.json()).catch(() => []),
          fetch('/api/admin/stats').then(res => res.json()).catch(() => ({})),
          fetch('/api/admin/users').then(res => res.json()).catch(() => []),
          fetch('/api/admin/orders-report').then(res => res.json()).catch(() => []),
          fetch('/api/admin/customers').then(res => res.json()).catch(() => []),
          fetch('/api/admin/admin-users').then(res => res.json()).catch(() => [])
        ]);
        
        const today = new Date();
        const is27th = today.getDate() === 27;
        let processedOrders = Array.isArray(ordersRes) ? ordersRes : [];
        if (is27th) {
          processedOrders = processedOrders.map(order => ({
            ...order,
            subscription_paid: false
          }));
        }
        
        setStores(Array.isArray(storesRes) ? storesRes : []);
        setStats(statsRes && typeof statsRes === 'object' && !statsRes.error ? statsRes : { totalStores: 0, totalUsers: 0, totalCustomers: 0, totalRevenue: 0, totalOrders: 0, adminCommissionPercentage: 0, adminCommission: 0, merchantRevenue: 0 });
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setCustomers(Array.isArray(customersRes) ? customersRes : []);
        setAdminUsers(Array.isArray(adminUsersRes) ? adminUsersRes : []);
        setAdminOrders(processedOrders);
      } catch (err) {
        console.error("Failed to auto-refresh admin data:", err);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const [approveDialog, setApproveDialog] = useState<{
    store: any | null;
    customPhone: string;
  }>({ store: null, customPhone: '' });

  const handleApprove = async (store: any) => {
    setApproveDialog({ store, customPhone: store.owner_phone || '' });
  };

  // Filter orders based on criteria
  const getFilteredOrders = () => {
    return adminOrders.filter(order => {
      // Date filter
      if (dateFromFilter || dateToFilter) {
        const orderDate = new Date(order.created_at);
        if (dateFromFilter && new Date(dateFromFilter) > orderDate) return false;
        if (dateToFilter && new Date(dateToFilter) < orderDate) return false;
      }
      
      // Subscription status filter
      if (subscriptionFilter === 'paid' && !order.subscription_paid) return false;
      if (subscriptionFilter === 'unpaid' && order.subscription_paid) return false;
      
      return true;
    });
  };

  // Toggle subscription paid status
  const toggleSubscriptionStatus = async (storeId: number, currentStatus: boolean) => {
    try {
      console.log(`🔄 Toggling subscription: storeId=${storeId}, currentStatus=${currentStatus}`);
      const response = await fetch(`/api/admin/stores/${storeId}/toggle-subscription-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_paid: !currentStatus })
      });
      
      const data = await response.json();
      console.log(`📊 Response:`, data, `Status: ${response.status}`);
      
      if (response.ok) {
        // Update local state
        const updatedOrders = adminOrders.map(order => 
          order.store_id === storeId 
            ? { ...order, subscription_paid: !currentStatus }
            : order
        );
        setAdminOrders(updatedOrders);
        alert('تم تحديث حالة الاشتراك بنجاح');
      } else {
        const errorMsg = data.error || 'فشل تحديث حالة الاشتراك';
        alert(errorMsg);
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert('حدث خطأ في الاتصال: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  };

  const filteredOrders = getFilteredOrders();

  const confirmApproval = async () => {
    if (!approveDialog.store) return;
    
    if (!approveDialog.customPhone) {
      alert("يرجى إدخال معرّف تليجرام أو رقم الهاتف أولاً");
      return;
    }

    try {
      const res = await fetch(`/api/admin/approve-store/${approveDialog.store.id}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: approveDialog.customPhone })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("تم تحديث حالة المتجر وتفعيله بنجاح");
        // Keep dialog open so user can send Telegram message manually
        // Refresh
        fetch('/api/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh stores error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Refresh stats error:', err));
      } else {
        const errorMsg = data.error || "خطأ غير معروف عند تفعيل المتجر";
        alert("فشل في تفعيل المتجر: " + errorMsg);
        console.error('Approval error details:', data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
      alert("خطأ في الاتصال: " + errorMsg);
      console.error('Connection error during approval:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reject-store/${id}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert("تم رفض طلب المتجر بنجاح");
        fetch('/api/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("فشل رفض المتجر: " + (data.error || "خطأ غير معروف"));
        console.error('Reject error:', data);
      }
    } catch (error) {
      alert("خطأ في الاتصال: " + (error instanceof Error ? error.message : "خطأ غير معروف"));
      console.error('Connection error:', error);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/suspend-store/${id}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert("تم إيقاف المتجر بنجاح");
        fetch('/api/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("فشل إيقاف المتجر: " + (data.error || "خطأ غير معروف"));
        console.error('Suspend error:', data);
      }
    } catch (error) {
      alert("خطأ في الاتصال: " + (error instanceof Error ? error.message : "خطأ غير معروف"));
      console.error('Connection error:', error);
    }
  };

  const handleDeleteStore = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المتجر نهائياً؟")) return;
    
    try {
      const res = await fetch(`/api/admin/delete-store/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        alert("تم حذف المتجر بنجاح");
        fetch('/api/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("فشل حذف المتجر: " + (data.error || "خطأ غير معروف"));
        console.error('Delete error:', data);
      }
    } catch (error) {
      alert("خطأ في الاتصال: " + (error instanceof Error ? error.message : "خطأ غير معروف"));
      console.error('Connection error:', error);
    }
  };

  const handleEditStore = async (store: Store & { store_name?: string; owner_name?: string; percentage_enabled?: boolean }) => {
    const newName = prompt("تعديل اسم المتجر:", store.store_name || (store as any).name);
    if (!newName) return;
    const newOwner = prompt("تعديل اسم المالك:", store.owner_name || "غير معروف");
    if (!newOwner) return;
    
    const percentageEnabledStr = prompt(
      "هل يخضع المتجر للنسبة المئوية؟ (اكتب 'yes' أو 'no'):",
      (store as any).percentage_enabled !== false ? 'yes' : 'no'
    );
    const percentageEnabled = percentageEnabledStr?.toLowerCase() !== 'no';
    
    try {
      const res = await fetch(`/api/admin/update-store/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_name: newName, 
          owner_name: newOwner,
          percentage_enabled: percentageEnabled
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("تم تحديث بيانات المتجر بنجاح");
        fetch('/api/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("فشل التحديث: " + (data.error || "خطأ غير معروف"));
        console.error('Update error:', data);
      }
    } catch (error) {
      alert("خطأ في الاتصال: " + (error instanceof Error ? error.message : "خطأ غير معروف"));
      console.error('Connection error:', error);
    }
  };

  const handleAddStore = async () => {
    const name = prompt("أدخل اسم المتجر الجديد:");
    if (!name) return;
    const owner = prompt("اسم صاحب المتجر:");
    
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        store_name: name, 
        owner_name: owner || 'تاجر جديد',
        description: 'متجر جديد تم إنشاؤه من لوحة الإدارة',
        category: 'عام'
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("تم إضافة المتجر بنجاح");
      fetch('/api/stores').then(res => res.json()).then(setStores);
      fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    } else {
      alert("خطأ: " + (data.error || "فشل إضافة المتجر"));
      console.error("Store creation error:", data);
    }
  };

  const handleAddUser = async () => {
    const name = prompt("اسم المستخدم:");
    if (!name) return;
    const phone = prompt("رقم الهاتف:");
    if (!phone) return;
    const role = prompt("الدور (admin, merchant, customer):", "customer");
    
    const res = await fetch('/api/admin/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, role, password: 'password123' })
    });

    if (res.ok) {
      fetch('/api/admin/users').then(res => res.json()).then(setUsers);
      fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    }
  };

  const handleEditUser = async (userToEdit: User) => {
    const newName = prompt("تعديل الاسم:", userToEdit.name);
    if (!newName) return;
    const newPhone = prompt("تعديل رقم الهاتف:", userToEdit.phone || '');
    if (!newPhone) return;
    const newRole = prompt("تعديل الدور (admin, merchant, customer):", userToEdit.role);
    
    try {
      const res = await fetch(`/api/admin/update-user/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone, role: newRole })
      });

      if (res.ok) {
        alert("تم التحديث بنجاح");
        fetch('/api/admin/users').then(res => res.json()).then(setUsers);
      } else {
        const data = await res.json();
        alert(data.error || "فشل التحديث");
      }
    } catch (e) {
      alert("خطأ في الاتصال بالسيرفر");
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع متاجره أيضاً.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetch('/api/admin/users').then(res => res.json()).then(setUsers);
      fetch('/api/admin/stats').then(res => res.json()).then(setStats);
      alert("تم حذف المستخدم ومتاجره بنجاح");
    } else {
      const data = await res.json();
      alert("خطأ: " + (data.error || "فشل حذف المستخدم"));
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="جاري التحميل..." role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const renderStatsCards = () => {
    // Ensure all values have defaults to prevent undefined
    const safeStats = {
      totalRevenue: stats.totalRevenue || 0,
      adminCommission: stats.adminCommission || 0,
      adminCommissionPercentage: stats.adminCommissionPercentage || 0,
      totalUsers: stats.totalUsers || 0,
      totalCustomers: stats.totalCustomers || 0,
      totalOrders: stats.totalOrders || 0,
      totalStores: stats.totalStores || 0,
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'إجمالي المبيعات', value: formatCurrency(safeStats.totalRevenue), icon: CreditCard, color: 'bg-indigo-600', textColor: 'text-indigo-600' },
          { label: 'عمولة الآدمن', value: formatCurrency(safeStats.adminCommission), icon: TrendingUp, color: 'bg-emerald-600', textColor: 'text-emerald-600', subtext: `${safeStats.adminCommissionPercentage}%` },
          { label: 'إجمالي العملاء', value: safeStats.totalCustomers, icon: Users, color: 'bg-purple-600', textColor: 'text-purple-600' },
          { label: 'إجمالي الطلبات', value: safeStats.totalOrders, icon: ShoppingCart, color: 'bg-amber-600', textColor: 'text-amber-600' },
          { label: 'عدد المتاجر', value: safeStats.totalStores, icon: StoreIcon, color: 'bg-blue-600', textColor: 'text-blue-600' },
        ].map((stat) => (
          <Card key={stat.label} className={cn("p-6 flex flex-col items-start gap-3", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}> 
            <div className={cn("p-3 rounded-xl text-white shadow-lg", stat.color)}>
              {stat.icon && <stat.icon size={20} />}
            </div>
            <div className="w-full">
              <p className="text-xs font-normal text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-normal tracking-tight", stat.textColor)}>{stat.value}</p>
              {stat.subtext && <p className="text-xs text-gray-500 font-normal mt-1">{stat.subtext}</p>}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderStoresTable = (limit?: number) => {
    const displayedStores = limit ? (dashboardQuery ? filteredStores.slice(0, limit) : stores.slice(0, limit)) : filteredStores;
    return (
      <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}> 
        <div className={cn("p-6 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-white")}> 
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إدارة المتاجر الحديثة</h3>
          <Button 
            onClick={handleAddStore}
            className="bg-indigo-600 text-white text-sm font-normal px-6 py-2 rounded-xl hidden"
          >
            إضافة متجر
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={cn("text-xs uppercase tracking-widest font-normal", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50/50 text-gray-400")}>
              <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50/50")}> 
                <th className="px-6 py-5">اسم المتجر</th>
                <th className="px-6 py-5">المالك</th>
                <th className="px-6 py-5">الحالة</th>
                <th className="px-6 py-5">النسبة %</th>
                <th className="px-6 py-5">الرابط</th>
                <th className="px-6 py-5">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5"> 
              {displayedStores.map((store) => (
                <tr key={store.id} className={cn(
                  isDarkMode ? "bg-gray-900 hover:bg-gray-700/50" : "bg-white hover:bg-indigo-50/30",
                  "transition-all group"
                )}> 
                  <td className={cn("px-6 py-4 font-normal group-hover:text-indigo-600", isDarkMode ? "text-gray-100" : "text-gray-900")}>{(store as any).store_name || store.name}</td>
                  <td className={cn("px-6 py-4 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>{store.owner_name || 'غير معروف'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      isStorePending(store) ? "bg-amber-100 text-amber-700" : 
                      store.status === 'rejected' ? "bg-red-100 text-red-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {isStorePending(store) ? 'بانتظار الموافقة' : 
                       store.status === 'rejected' ? 'مرفوض' : 'نشط'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      (store as any).percentage_enabled !== false ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {(store as any).percentage_enabled !== false ? '✓ مفعل' : '✗ معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/store/${(store as any).slug || store.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-normal text-sm hover:underline"
                    >
                      <span className="truncate">@{(store as any).slug || store.id}</span>
                      <ExternalLink size={16} className="flex-shrink-0" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isStoreApproved(store) && store.status !== 'rejected' && (
                        <button 
                          onClick={() => handleSuspend(store.id)}
                          className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-normal text-xs bg-amber-50 px-3 py-1 rounded-lg transition-colors"
                          title="تحويل إلى معلق"
                        >
                          <Pause size={14} />
                          تعليق
                        </button>
                      )}
                      {isStorePending(store) && (
                        <button 
                          onClick={() => handleApprove(store)}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-normal text-xs bg-emerald-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          <CheckCircle size={14} />
                          تفعيل
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditStore(store)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="تعديل المتجر"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStore(store.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="حذف المتجر"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedStores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-normal">
                    {dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد متاجر مسجلة حالياً'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderOverview = () => (
    <>
      {renderStatsCards()}
      {renderStoresTable(5)}
    </>
  );

  const renderStats = () => (
    <div className="space-y-8">
      {renderStatsCards()}
      {adminOrders && adminOrders.length > 0 ? (
        <Card>
          <div className="p-6 border-b border-black/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className={cn("font-normal text-xl", isDarkMode ? "text-white" : "text-white")}>تقرير الأداء العام - الطلبات</h3>
              <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{filteredOrders.length} طلب</span>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>من التاريخ</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>إلى التاريخ</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>حالة الاشتراك</label>
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                >
                  <option value="all">الكل</option>
                  <option value="paid">مدفوع</option>
                  <option value="unpaid">لم يتم الدفع</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className={cn("border-b border-black/5", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>رقم الطلب</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>صاحب المتجر</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>المبلغ</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>مبلغ العمولة</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>حالة الاشتراك</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>الحالة</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className={cn("border-b border-black/5 transition-colors", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/50")}>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>#{order.id}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>{order.owner_name || 'غير معروف'}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-cyan-400" : "text-indigo-600")}>{formatCurrency(order.total_amount || 0)}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-emerald-400" : "text-green-600")}>{formatCurrency(order.commission_amount || 0)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSubscriptionStatus(order.store_id, order.subscription_paid)}
                        className={`px-3 py-1 rounded-full text-xs font-normal cursor-pointer transition-all hover:opacity-80 ${
                          order.subscription_paid ? (isDarkMode ? 'bg-emerald-900 text-emerald-300 hover:bg-red-900 hover:text-red-300' : 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800') : (isDarkMode ? 'bg-red-900 text-red-300 hover:bg-emerald-900 hover:text-emerald-300' : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800')
                        }`}
                        title="اضغط لتبديل الحالة"
                      >
                        {order.subscription_paid ? '✓ مدفوع' : '✕ لم يتم الدفع'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-normal ${
                        order.status === 'completed' ? (isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-green-100 text-green-800') :
                        order.status === 'pending' ? (isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-yellow-100 text-yellow-800') :
                        order.status === 'cancelled' ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800') :
                        (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {order.status === 'completed' ? '✓ مكتمل' :
                         order.status === 'pending' ? '⏳ قيد الانتظار' :
                         order.status === 'cancelled' ? '✕ ملغى' :
                         order.status}
                      </span>
                    </td>
                    <td className={cn("px-6 py-4 text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>{new Date(order.created_at).toLocaleDateString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className={cn("font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>لا توجد طلبات تطابق المعايير المختارة</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <BarChart3 size={64} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-normal text-gray-900 mb-2">لا توجد طلبات حتى الآن</h3>
          <p className="text-gray-500 font-medium">سيتم عرض تقرير الأداء هنا عند وجود طلبات</p>
        </Card>
      )}
    </div>
  );

  const handleSaveAdminSettings = async () => {
    if (!adminConfig.app_name) {
      alert("❌ يرجى إدخال اسم التطبيق");
      return;
    }
    
    try {
      const commissionValue = adminConfig.admin_commission_percentage;
      const finalCommission = isNaN(commissionValue) ? 0 : Math.max(0, Math.min(100, commissionValue));
      
      console.log("📤 Saving ADMIN settings ONLY (independent from merchant settings):", {
        app_name: adminConfig.app_name,
        logo_url: adminConfig.logo_url ? "✓ Logo present" : "✗ No logo",
        admin_commission_percentage: finalCommission
      });
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: adminConfig.app_name,
          logo_url: adminConfig.logo_url,
          admin_commission_percentage: finalCommission,
          _setting_type: 'admin'  // explicitly mark as admin settings
        })
      });
      
      console.log("📥 Response status:", res.status, res.statusText);
      
      // Parse response ONCE and store it
      let responseData;
      try {
        responseData = await res.json();
        console.log("✅ Response data:", responseData);
      } catch (parseError) {
        console.error("❌ Could not parse response:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      // Now check if HTTP was not OK
      if (!res.ok) {
        let errorMessage = responseData.error || responseData.message || `HTTP ${res.status}: ${res.statusText}`;
        console.error("❌ Server error:", responseData);
        alert("❌ فشل حفظ الإعدادات: " + errorMessage);
        return;
      }
      
      // Verify the response indicates success
      if (!responseData.success && !responseData.message) {
        throw new Error("Invalid response structure from server");
      }
      
      // Update ONLY local admin config state - DO NOT touch Zustand store
      // to keep it independent from merchant settings
      setAdminConfig(prev => ({
        ...prev,
        app_name: adminConfig.app_name,
        logo_url: adminConfig.logo_url,
        admin_commission_percentage: finalCommission
      }));
      
      // Update Zustand store for global settings
      useSettingsStore.getState().setSettings({
        app_name: adminConfig.app_name,
        logo_url: adminConfig.logo_url,
        primary_color: '#4F46E5'
      });
      
      console.log("✅ Admin settings saved successfully");
      alert("✅ تم حفظ إعدادات الآدمن بنجاح");
      
      // Refresh page to ensure all data is updated
      setTimeout(() => window.location.reload(), 500);
      return; // Ensure no code runs after reload
    } catch (error) {
      console.error("❌ Network/Parse Error:", error);
      console.error("Full error object:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      
      const errorMsg = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      console.error("Final error message:", errorMsg);
      
      alert("❌ خطأ في حفظ الإعدادات: " + errorMsg);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isAdmin: boolean = true) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminConfig(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSettings = () => {
    return (
    <Card className={cn("max-w-md border-none shadow-xl rounded-2xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-6 border-b border-black/5 flex items-center justify-between", isDarkMode ? "bg-gray-900" : "bg-white")}>
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إعدادات المنصة</h3>
        <button
          onClick={() => navigate('/admin')}
          className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700")}
          title="إغلاق"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-5">
        
        {/* اسم المنصة */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">اسم المنصة</label>
          <input 
            type="text" 
            value={adminConfig.app_name} 
            onChange={(e) => setAdminConfig({ ...adminConfig, app_name: e.target.value })}
            placeholder="أدخل اسم المنصة"
            className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
          />
        </div>
        
        {/* شعار المنصة */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">شعار المنصة</label>
          <button
            type="button"
            onClick={() => adminLogoUploadRef.current?.click()}
            className={cn("w-full h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:opacity-80", isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-50 border-gray-300 hover:bg-gray-100")}
          >
            {adminConfig.logo_url ? (
              <img src={adminConfig.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <div className="text-center">
                <Upload size={24} className={isDarkMode ? "text-gray-400 mx-auto" : "text-gray-500 mx-auto"} />
                <p className={cn("text-xs font-normal mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>اضغط لاختيار صورة</p>
              </div>
            )}
          </button>
          <input 
            ref={adminLogoUploadRef}
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => handleLogoUpload(e, true)}
          />
        </div>
        
        {/* النسبة المئوية */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">نسبة عمولة الآدمن (%)</label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="0"
              max="100"
              step="0.1"
              value={adminConfig.admin_commission_percentage || ''} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAdminConfig({ ...adminConfig, admin_commission_percentage: isNaN(val) ? 0 : val });
              }}
              placeholder="أدخل النسبة"
              className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
            />
            <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            هذه النسبة ستُطبق على مبيعات المتاجر التي تخضع للنسبة المئوية فقط.
          </p>
        </div>
        
        {/* زر الحفظ */}
        <button 
          onClick={handleSaveAdminSettings} 
          className="w-full py-3 rounded-lg text-white font-normal text-base shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
        >
          💾 حفظ الإعدادات
        </button>
      </div>
    </Card>
    );
  };

  const renderUsers = () => {
    const filteredAdminUsers = adminUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
      (u.phone || '').toLowerCase().includes(dashboardQuery.toLowerCase())
    );

    const handleToggleAdminAccess = async (userId: number, currentAccess: boolean) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}/admin-access`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canAccessAdmin: !currentAccess })
        });

        if (res.ok) {
          const data = await res.json();
          // Refresh admin users list
          setAdminUsers(adminUsers.map(u => 
            u.id === userId ? { ...u, can_access_admin: !currentAccess } : u
          ));
          alert(`تم ${!currentAccess ? 'إعطاء' : 'سحب'} الصلاحية بنجاح`);
        } else {
          alert('حدث خطأ في تحديث الصلاحية');
        }
      } catch (error) {
        alert('خطأ في الاتصال');
        console.error(error);
      }
    };

    return (
      <Card className={cn(isDarkMode ? "bg-gray-800" : "bg-white")}>
        <div className={cn("p-6 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
          <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إدارة صلاحيات الآدمن</h3>
          <div className={cn("px-4 py-1.5 rounded-full text-xs font-normal", isDarkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-700")}>
            {filteredAdminUsers.length} مستخدم
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={cn("text-xs font-normal uppercase tracking-widest", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50/50 text-gray-400")}>
              <tr>
                <th className="px-6 py-5">الاسم</th>
                <th className="px-6 py-5">رقم الهاتف</th>
                <th className="px-6 py-5">الدور</th>
                <th className="px-6 py-5">الصلاحية</th>
                <th className="px-6 py-5 w-32 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-black/5", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
              {filteredAdminUsers.map((u) => (
                <tr key={u.id} className={cn("transition-colors", isDarkMode ? "hover:bg-gray-700" : "hover:bg-indigo-50/30")}>
                  <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{u.name}</td>
                  <td className={cn("px-6 py-4 font-medium", isDarkMode ? "text-gray-300" : "text-gray-500")}>{u.phone || 'بدون رقم'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {u.role === 'admin' ? 'مدير النظام' : 'تاجر'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      u.can_access_admin ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {u.can_access_admin ? '✓ فعال' : '✗ معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleAdminAccess(u.id, u.can_access_admin)}
                          className={cn(
                            "px-3 py-2 text-xs font-normal rounded-lg transition-all",
                            u.can_access_admin
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          )}
                        >
                          {u.can_access_admin ? 'سحب الصلاحية' : 'إعطاء صلاحية'}
                        </button>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-xs text-gray-400 font-normal">مدير النظام الأساسي</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdminUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn("px-6 py-12 text-center font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>
                    {dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا يوجد مستخدمون بصلاحيات إدارة'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderApprovals = () => {
    const pendingStores = filteredStores.filter(isStorePending);
    return (
      <Card className={cn(isDarkMode ? "bg-gray-800" : "bg-white")}>
        <div className={cn("p-6 border-b border-black/5", isDarkMode ? "bg-gray-900" : "bg-white")}>
          <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>طلبات انضمام المتاجر</h3>
        </div>
        <div className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
          {pendingStores.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <StoreIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-normal">{dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد طلبات معلقة حالياً'}</p>
            </div>
          ) : (
            pendingStores.map(store => (
              <div key={store.id} className={cn("p-6 flex items-center justify-between transition-colors", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <StoreIcon size={24} />
                  </div>
                  <div>
                    <p className={cn("font-normal text-lg", isDarkMode ? "text-gray-100" : "text-gray-900")}>{(store as any).store_name || store.name}</p>
                    <div className={cn("flex gap-3 text-sm font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      <span>المالك: {store.owner_name}</span>
                      <span className={cn(isDarkMode ? "text-gray-600" : "text-gray-300")}>|</span>
                      <span>الهاتف: {store.owner_phone}</span>
                      <span className={cn(isDarkMode ? "text-gray-600" : "text-gray-300")}>|</span>
                      <span>المعرف: @{store.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleApprove(store)}
                    className="bg-indigo-600 text-white px-6 py-2.5 font-normal hover:shadow-lg hover:shadow-indigo-200 transition-all"
                  >
                    موافقة
                  </Button>
                  <Button 
                    onClick={() => handleReject(store.id)}
                    className="bg-white border-2 border-red-50 text-red-600 px-6 py-2.5 font-normal hover:bg-red-50 transition-all"
                  >
                    رفض التاجر
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    );
  };

  const sidebarCounts = {
    stores: stores.length,
    approvals: stores.filter(isStorePending).length,
    users: adminUsers.length
  };

  const renderApproveModal = () => {
    if (!approveDialog.store) return null;
    
    const store = approveDialog.store;
    const storeName = store.store_name || store.name;
    const ownerName = store.owner_name || 'صاحب المتجر';
    const storeLink = `${window.location.origin}/store/${store.slug || store.id}`;

    const messagePreview = `
  *تهانينا! تم تفعيل متجرك بنجاح*

  مرحباً *${ownerName}*,

  يسعدنا إعلامكم بأنه تمت الموافقة على تفعيل متجركم:
  *${storeName}*

  *رابط الشراء والمعاينة (للعملاء):*
  ${storeLink}

  *رابط لوحة تحكم المتجر (للتاجر):*
  ${window.location.origin}/login

  يمكنكم الآن إدارة المنتجات واستقبال الطلبات فوراً.

  ==================
  *إدارة المنصة*
    `.trim();

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl", isDarkMode ? "bg-gray-800" : "bg-white")}
        >
          <div className="bg-indigo-600 p-6 text-white text-center">
            <h3 className="text-xl font-normal">تفعيل المتجر وإرسال رسالة</h3>
            <p className="opacity-80 text-sm">سيتم إرسال الرابط والمعلومات للتاجر</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className={cn("block text-xs font-normal uppercase mb-2", isDarkMode ? "text-gray-400" : "text-gray-400")}>{`معرّف تليجرام (المستقبِل)`}</label>
              <input 
                type="text" 
                value={approveDialog.customPhone}
                onChange={(e) => setApproveDialog({...approveDialog, customPhone: e.target.value})}
                placeholder="077XXXXXXXX"
                className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-100 text-gray-900")}
              />
              {!store.owner_phone && (
                <p className="mt-2 text-xs text-amber-600 font-normal">تنبيه: المتجر مسجل بدون رقم هاتف، يرجى كتابته هنا.</p>
              )}
            </div>

            <div className={cn("rounded-2xl p-4 relative overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-emerald-50")}>
               <div className={cn("whitespace-pre-wrap text-[13px] leading-relaxed font-medium", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                {messagePreview}
              </div>
            </div>
          </div>
          
          <div className={cn("p-6 flex flex-col gap-3 border-t", isDarkMode ? "border-gray-700" : "border-gray-50")}>
            <div className="flex gap-3">
              <Button 
                onClick={() => setApproveDialog({ store: null, customPhone: '' })}
                className={cn("flex-1 py-3 font-normal rounded-xl", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500")}
              >
                إلغاء
              </Button>
              <Button 
                onClick={confirmApproval}
                className="flex-[2] bg-indigo-600 text-white py-3 px-8 font-normal rounded-xl"
              >
                تحديث الحالة وتفعيل
              </Button>
            </div>
            
            <Button 
              onClick={() => {
                const encodedMsg = encodeURIComponent(messagePreview);
                const cleanPhone = approveDialog.customPhone.replace(/[\s\-\(\)]/g, '');
                // Basic check for Iraqi numbers prefix
                let waPhone = cleanPhone;
                if (cleanPhone.startsWith('07') && cleanPhone.length === 11) {
                  waPhone = '964' + cleanPhone.substring(1);
                }
                // Open Telegram share with message
                const telegramUrl = `https://t.me/share/url?url=&text=${encodedMsg}`;
                window.open(telegramUrl, '_blank');
                // Close the dialog
                setApproveDialog({ store: null, customPhone: '' });
              }}
              className="w-full bg-emerald-500 text-white py-4 font-normal rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
            >
              <Send size={20} />
              <span>إرسال الرسالة عبر تليجرام يدوياً</span>
            </Button>
            <p className="text-[10px] text-center text-gray-400 font-medium">خطوة يدوية: اضغط تفعيل أولاً ثم إرسال لضمان تحديث حالة المتجر</p>
          </div>
        </motion.div>
      </div>
    );
  };
  return (
    <DashboardLayout 
      title={
        section === 'users' ? "المستخدمون" : 
        section === 'approvals' ? "طلبات الانضمام" : 
        section === 'stores' ? "المتاجر" : 
        section === 'stats' ? "الإحصائيات" : 
        "نظرة عامة"
      } 
      role="admin"
      counts={sidebarCounts}
    >
      <>
        {section === 'users' ? renderUsers() : 
         section === 'approvals' ? renderApprovals() : 
         section === 'stores' ? renderStoresTable() : 
         section === 'stats' ? renderStats() : 
         section === 'settings' ? renderSettings() : 
         renderOverview()}
         {renderApproveModal()}
      </>
    </DashboardLayout>
  );
};

const MerchantDashboard = () => {
  const { isDarkMode } = useTheme();
  const { user, setUser } = useAuthStore();
  const { dashboardQuery } = useSearchStore();
  const [products, setProducts] = useState<(Product & { category_name?: string })[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; image_url?: string }[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [bidders, setBidders] = useState<any[]>([]);
  const [selectedAuctionForBidders, setSelectedAuctionForBidders] = useState<any>(null);
  const [merchantStats, setMerchantStats] = useState<any>({
    totalRevenue: 0,
    orderStats: { total: 0, pending: 0, completed: 0 },
    topProducts: []
  });
  const { section } = useParams();
  const navigate = useNavigate();
  
  console.log('🔧 MerchantDashboard - section:', section, 'orders length:', orders.length);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (p.category_name && p.category_name.toLowerCase().includes(dashboardQuery.toLowerCase()))
  );

  const filteredCategories = categories.filter(c => 
    c.name && c.name.toLowerCase().includes(dashboardQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => true);

  const filteredCustomers = customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (c.phone || '').includes(dashboardQuery)
  );

  const filteredCoupons = coupons.filter(c => 
    (c.code && c.code.toLowerCase().includes(dashboardQuery.toLowerCase()))
  );

  const sidebarCounts = {
    products: products.length,
    categories: categories.length,
    orders: orders.filter(o => o.status === 'pending').length,
    customers: customers.length,
    coupons: coupons.filter(c => c.is_active).length,
    auctions: auctions.filter(a => a.status !== 'ended').length
  };

  const [merchantConfig, setMerchantConfig] = useState({ app_name: '', logo_url: '', primary_color: '#4F46E5' });

  // Order Details
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [invoiceModal, setInvoiceModal] = useState<any>(null);

  // Sales Modal
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesData, setSalesData] = useState<any>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<number | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<number | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState({ name: '', image_url: '' });
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'cash' as 'cash' | 'reseller',
    credit_limit: '',
    password: '',
    notes: '',
    starting_balance: ''
  });
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    retail_price: '',
    wholesale_price: '',
    stock: '',
    image_url: '',
    category_id: '',
    gallery: [] as string[],
    topup_codes_text: '',
    auction_date: '',
    auction_start_time: '09:00',
    auction_end_time: '18:00',
    auction_price: '',
    is_auction: false
  });
  const [topupCodesFile, setTopupCodesFile] = useState<File | null>(null);
  const [topupCodesPreview, setTopupCodesPreview] = useState<string[]>([]);
  const [topupCodesMessage, setTopupCodesMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '0',
    expiry_date: '',
    usage_limit: ''
  });

  useEffect(() => {
    // Fallback: If user has role merchant but missing store_id, try to fetch it
    const checkStoreId = async () => {
      if (user?.role === 'merchant' && !user.store_id) {
        try {
          const res = await fetch('/api/stores');
          const stores = await res.json();
          // Find store where owner_id matches current user.id
          const myStore = stores.find((s: any) => s.owner_id === user.id);
          if (myStore) {
            console.log("Found missing store_id:", myStore.id);
            const newUser = { ...user, store_id: myStore.id, store_active: myStore.is_active, store_status: myStore.status };
            setUser(newUser);
          }
        } catch (err) {
          console.error("Failed to fetch fallback store_id:", err);
        }
      }
    };
    checkStoreId();
  }, [user, setUser]);

  useEffect(() => {
    if (user?.store_id) {
      console.log('📥 MerchantDashboard - Fetching data for store:', user.store_id, 'Type:', user?.store_type);
      
      // Fetch all data in parallel for faster loading
      const ordersEndpoint = user?.store_type === 'topup'
        ? `/api/topup/orders?storeId=${user.store_id}`
        : `/api/orders?storeId=${user.store_id}`;

      Promise.all([
        fetch(`/api/products?storeId=${user.store_id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/categories?storeId=${user.store_id}`).then(r => r.json()).catch(() => []),
        fetch(ordersEndpoint).then(r => r.json()).catch(() => []),
        fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/coupons?storeId=${user.store_id}`).then(r => r.json()).catch(() => []),
        fetch(`/api/merchant/stats?storeId=${user.store_id}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/auctions/active`).then(r => r.json()).catch(() => [])
      ]).then(([products, categories, orders, customers, coupons, stats, auctions]) => {
        setProducts(Array.isArray(products) ? products : []);
        
        const validCategories = Array.isArray(categories) ? categories.filter(c => c && c.name) : [];
        setCategories(validCategories);
        
        setOrders(Array.isArray(orders) ? orders : []);
        setCustomers(Array.isArray(customers) ? customers : []);
        setCoupons(Array.isArray(coupons) ? coupons : []);
        
        setMerchantStats(stats && !stats.error ? stats : {
          totalRevenue: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          topProducts: []
        });
        
        const merchantAuctions = Array.isArray(auctions) ? auctions.filter((a: any) => a.store_id === user.store_id) : [];
        setAuctions(merchantAuctions);
      });
    }
  }, [user, user?.store_type]);

  // Auto-refresh merchant data every 30 seconds (reduced from 5 for better performance)
  useEffect(() => {
    if (!user?.store_id) return;

    const interval = setInterval(() => {
      const ordersEndpoint = user?.store_type === 'topup' 
        ? `/api/topup/orders?storeId=${user.store_id}`
        : `/api/orders?storeId=${user.store_id}`;

      // Fetch all refresh data in parallel
      Promise.all([
        fetch(`/api/products?storeId=${user.store_id}`).then(r => r.json()).catch(() => []),
        fetch(ordersEndpoint).then(r => r.json()).catch(() => []),
        fetch(`/api/merchant/stats?storeId=${user.store_id}`).then(r => r.json()).catch(() => ({}))
      ]).then(([products, orders, stats]) => {
        setProducts(Array.isArray(products) ? products : []);
        setOrders(Array.isArray(orders) ? orders : []);
        setMerchantStats(stats && !stats.error ? stats : {
          totalRevenue: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          topProducts: []
        });
      });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user?.store_id, user?.store_type]);

  useEffect(() => {
    if (section === 'settings' && user?.store_id) {
      fetch(`/api/settings?storeId=${user.store_id}&role=${user.role}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object' && !data.error && data.app_name) {
            // Ensure all required fields are present, use defaults if missing
            setMerchantConfig({
              app_name: data.app_name || '',
              logo_url: data.logo_url || '',
              primary_color: data.primary_color || '#4F46E5'
            });
            console.log('📋 Loaded merchant settings:', { app_name: data.app_name, logo_url: data.logo_url ? '✓' : '✗', primary_color: data.primary_color });
          }
        })
        .catch((err) => {
          console.error('Failed to load merchant settings:', err);
        });
    }
  }, [section, user]);

  const handleSaveMerchantSettings = async () => {
    if (!user?.store_id) {
      alert("خطأ: لم يتم العثور على معرّف المتجر");
      return;
    }
    
    // Validate that at least app_name is not empty
    if (!merchantConfig.app_name || merchantConfig.app_name.trim() === '') {
      alert("❌ خطأ: يجب إدخال اسم المتجر");
      return;
    }
    
    try {
      console.log("📤 Saving MERCHANT settings:", {
        store_id: user.store_id,
        app_name: merchantConfig.app_name,
        app_name_trimmed: merchantConfig.app_name.trim(),
        logo_url_length: merchantConfig.logo_url ? merchantConfig.logo_url.length : 0,
        primary_color: merchantConfig.primary_color
      });
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_id: user.store_id,
          app_name: merchantConfig.app_name.trim(), // Send trimmed value
          logo_url: merchantConfig.logo_url,
          primary_color: merchantConfig.primary_color
        })
      });
      
      console.log("📬 POST /api/settings response status:", res.status);
      
      const data = await res.json();
      console.log("📬 POST /api/settings full response:", JSON.stringify(data, null, 2));
      console.log("📬 Response success field type:", typeof data.success, "value:", data.success);
      console.log("📬 data.success === true:", data.success === true);
      console.log("📬 Boolean check - !!data.success:", !!data.success);
      
      if (!res.ok) {
        let errorMsg = data.error || data.message || "فشل الحفظ";
        console.error('❌ HTTP Error:', res.status, errorMsg);
        alert("❌ خطأ في الاتصال بقاعدة البيانات: " + errorMsg);
        return;
      }
      
      // Explicitly check if success is true (strict equality)
      if (data.success === true) {
        // Success case
        console.log('✅ Merchant settings saved successfully, navigating...');
        
        // Update ONLY local merchant config state
        setMerchantConfig(prev => ({
          ...prev,
          app_name: merchantConfig.app_name.trim(),
          logo_url: merchantConfig.logo_url,
          primary_color: merchantConfig.primary_color
        }));
        
        alert('✅ تم حفظ إعدادات المتجر بنجاح');
        
        // Refresh page to ensure all data is updated
        setTimeout(() => window.location.reload(), 500);
        return; // Ensure no code runs after reload
      } else {
        // Failure case even though HTTP 200
        let errorMsg = data.error || data.message || "البيانات لم تُحفظ";
        console.error('❌ Server returned success:', data.success, 'Type:', typeof data.success, 'Full response:', data);
        alert("❌ خطأ: " + errorMsg);
      }
    } catch (error) {
      console.error("❌ Network/Parse Error:", error);
      console.error("Full error object:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      
      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف";
      console.error("Final error message:", errorMessage);
      
      alert("❌ خطأ في حفظ الإعدادات: " + errorMessage);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isAdmin: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMerchantConfig(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenSalesModal = async () => {
    if (!user?.store_id) return;
    setShowSalesModal(true);
    try {
      const res = await fetch(`/api/merchant/sales-report?storeId=${user.store_id}`);
      const data = await res.json();
      if (res.ok) {
        setSalesData(data);
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    }
  };

  const handleCreateProduct = () => {
    if (!categories.length) return alert("يرجى إضافة قسم واحد على الأقل قبل إضافة المنتجات");
    setProductForm({
      name: '',
      description: '',
      price: '',
      retail_price: '',
      wholesale_price: '',
      stock: '',
      image_url: '',
      category_id: categories[0].id.toString(),
      gallery: [],
      topup_codes_text: ''
    });
    setTopupCodesFile(null);
    setTopupCodesMessage(null);
    setIsEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (p: any) => {
    const isTopupStore = user?.store_type === 'topup';
    
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: isTopupStore ? '' : (p.price?.toString() || ''),
      retail_price: isTopupStore ? (p.retail_price?.toString() || '') : '',
      wholesale_price: isTopupStore ? (p.wholesale_price?.toString() || '') : '',
      stock: (p.stock || 0).toString(),
      image_url: p.image_url || '',
      category_id: p.category_id?.toString() || (categories.length > 0 ? categories[0].id.toString() : ''),
      gallery: p.gallery || [],
      topup_codes_text: '',
      auction_date: p.auction_date || '',
      auction_start_time: p.auction_start_time || '09:00',
      auction_end_time: p.auction_end_time || '18:00',
      auction_price: p.auction_price || '',
      is_auction: p.is_auction || false
    });
    setTopupCodesFile(null);
    setTopupCodesMessage(null);
    setIsEditingProduct(p.id);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const saveProduct = async () => {
    if (!user?.store_id) {
      alert("❌ خطأ: لم يتم العثور على معرّف المتجر الخاص بك");
      return;
    }

    // Validate required fields
    if (!productForm.name?.trim()) {
      alert("❌ يرجى إدخال اسم المنتج");
      return;
    }

    if (!productForm.price) {
      alert("❌ يرجى إدخال سعر المنتج");
      return;
    }

    if (!productForm.stock) {
      alert("❌ يرجى إدخال الكمية المتاحة");
      return;
    }
    
    const isTopupStore = user?.store_type === 'topup';
    const method = isEditingProduct ? 'PUT' : 'POST';
    const url = isEditingProduct ? `/api/products/${isEditingProduct}` : '/api/products';
    
    // Build the request body based on store type
    const body: any = { 
       store_id: user.store_id, 
       stock: parseInt(productForm.stock),
       category_id: productForm.category_id ? parseInt(productForm.category_id) : null,
    };
    
    if (isTopupStore) {
      // For topup store: use retail and wholesale prices
      body.name = productForm.name;
      body.description = productForm.name; // Use name as description for topup
      body.price = Math.max(
        Math.floor(parseFloat(productForm.retail_price) || 0),
        Math.floor(parseFloat(productForm.wholesale_price) || 0)
      ); // Use higher price as main price
      body.retail_price = Math.floor(parseFloat(productForm.retail_price) || 0);
      body.wholesale_price = Math.floor(parseFloat(productForm.wholesale_price) || 0);
      body.image_url = ''; // No image for topup products
      body.gallery = []; // No gallery for topup products
    } else {
      // For regular store: use regular price
      body.name = productForm.name;
      body.description = productForm.description;
      body.price = Math.floor(parseFloat(productForm.price) || 0);
      body.image_url = productForm.image_url;
      body.gallery = productForm.gallery;
      
      // Add auction flag if applicable
      if (productForm.is_auction) {
        body.is_auction = true;
      }
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const savedProduct = await res.json();
        
        // Save topup codes if provided (only for topup stores)
        if (isTopupStore && (productForm.topup_codes_text.trim() || topupCodesFile) && savedProduct.id) {
          let codes: string[] = [];
          
          if (topupCodesFile) {
            const fileText = await topupCodesFile.text();
            codes = fileText.split('\n').map(c => c.trim()).filter(c => c.length > 0);
          } else if (productForm.topup_codes_text.trim()) {
            codes = productForm.topup_codes_text.split('\n').map(c => c.trim()).filter(c => c.length > 0);
          }
          
          if (codes.length > 0) {
            const codesRes = await fetch('/api/products/update-codes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: savedProduct.id,
                codes: codes
              })
            });
            
            if (codesRes.ok) {
              setTopupCodesMessage({ type: 'success', text: `✅ تم حفظ ${codes.length} كود بنجاح` });
              console.log(`✅ تم حفظ ${codes.length} أكواد بنجاح`);
              // Clear notification after 3 seconds
              setTimeout(() => setTopupCodesMessage(null), 3000);
            } else {
              setTopupCodesMessage({ type: 'error', text: 'فشل حفظ الأكواد' });
              setTimeout(() => setTopupCodesMessage(null), 3000);
            }
          }
        }
        
        // Create auction if enabled (only for regular stores)
        if (!isTopupStore && productForm.is_auction && savedProduct.id) {
          // Validate auction data
          if (!productForm.auction_date || !productForm.auction_price) {
            alert('⚠️ يرجى إدخال تاريخ المزاد والسعر الأساسي');
            return;
          }
          
          try {
            const auctionRes = await fetch('/api/auctions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: savedProduct.id,
                store_id: user.store_id,
                auction_date: productForm.auction_date,
                auction_start_time: productForm.auction_start_time,
                auction_end_time: productForm.auction_end_time,
                starting_price: parseFloat(productForm.auction_price)
              })
            });
            
            if (auctionRes.ok) {
              const auctionData = await auctionRes.json();
              console.log('✅ تم إنشاء المزاد بنجاح:', auctionData);
            } else {
              const errData = await auctionRes.json();
              console.warn('⚠️ خطأ في إنشاء المزاد:', errData.error);
            }
          } catch (auctionErr) {
            console.error('❌ خطأ أثناء إنشاء المزاد:', auctionErr);
          }
        }
        
        setShowProductModal(false);
        setTopupCodesFile(null);
        setTopupCodesPreview([]);
        setProductForm({
          name: '',
          description: '',
          price: '',
          retail_price: '',
          wholesale_price: '',
          stock: '',
          image_url: '',
          category_id: '',
          gallery: [],
          topup_codes_text: '',
          auction_date: '',
          auction_start_time: '09:00',
          auction_end_time: '18:00',
          auction_price: '',
          is_auction: false
        });
        const updated = await fetch(`/api/products?storeId=${user.store_id}`).then(r => r.json());
        setProducts(Array.isArray(updated) ? updated : []);
      } else {
        const errText = await res.text();
        let errMsg = "فشل الحفظ";
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.error || errMsg;
        } catch (e) {

          errMsg = errText || errMsg;
        }
        alert("خطأ من السيرفر: " + errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالسيرفر. تأكد أن حجم الصورة ليس كبيراً جداً.");
    }
  };

  const handleAddCategory = () => {
    if (!user?.store_id) {
      alert("عذراً، لم يتم العثور على معرّف المتجر الخاص بك.");
      return;
    }
    setCategoryForm({ name: '', image_url: '' });
    setIsEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (c: any) => {
    setCategoryForm({ name: c.name, image_url: c.image_url || '' });
    setIsEditingCategory(c.id);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("هل أنت متأكد؟ سيتم حذف هذا القسم.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
        const updated = await fetch(`/api/products?storeId=${user?.store_id}`).then(r => r.json());
        setProducts(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveCategory = async () => {
    if (!user?.store_id) return;
    const method = isEditingCategory ? 'PUT' : 'POST';
    const url = isEditingCategory ? `/api/categories/${isEditingCategory}` : '/api/categories';
    const body = { ...categoryForm, store_id: user.store_id };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        const updated = await fetch(`/api/categories?storeId=${user.store_id}`).then(r => r.json());
        const validCategories = Array.isArray(updated) ? updated.filter(c => c && c.name) : [];
        setCategories(validCategories);
      } else {
        const errText = await res.text();
        let errMsg = "فشل الحفظ";
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.error || errMsg;
        } catch (e) {
          errMsg = errText || errMsg;
        }
        alert("خطأ من السيرفر: " + errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بالسيرفر. تأكد من ثبات الاتصال وحجم الملف.");
    }
  };

  // Fetch customers from new API
  useEffect(() => {
    if (user?.store_id && section === 'customers') {
      console.log("🔄 Fetching customers for store:", user.store_id);
      fetch(`/api/merchant/customers?storeId=${user.store_id}`)
        .then(res => res.json())
        .then(data => {
          console.log("✅ Customers loaded:", data);
          setCustomers(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error("Error fetching customers:", err);
          setCustomers([]);
        });
    }
  }, [user?.store_id, section]);

  // Handle Create Customer
  const handleCreateCustomer = async () => {
    if (!user?.store_id) {
      alert("خطأ: لم يتم العثور على معرّف المتجر");
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert("⚠️ يرجى إدخال الاسم ورقم الهاتف");
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: user.store_id,
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          customer_type: customerForm.customer_type,
          credit_limit: parseFloat(customerForm.credit_limit) || 0,
          password: customerForm.password,
          notes: customerForm.notes,
          starting_balance: parseFloat(customerForm.starting_balance) || 0
        })
      });

      if (res.ok) {
        alert("✅ تمت إضافة العميل بنجاح");
        setShowCustomerModal(false);
        setCustomerForm({ name: '', phone: '', email: '', customer_type: 'cash', credit_limit: '', password: '', notes: '', starting_balance: '' });
        
        // Refresh customers list
        const updated = await fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json());
        setCustomers(Array.isArray(updated) ? updated : []);
      } else {
        const error = await res.json();
        alert("❌ خطأ: " + (error.error || "فشل إضافة العميل"));
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالسيرفر");
    }
  };

  // Handle Edit Customer
  const handleEditCustomer = async () => {
    if (!user?.store_id || !isEditingCustomer) {
      alert("خطأ: معلومات ناقصة");
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert("⚠️ يرجى إدخال الاسم ورقم الهاتف");
      return;
    }

    try {
      const res = await fetch(`/api/customers/${isEditingCustomer}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email,
          customer_type: customerForm.customer_type,
          credit_limit: parseFloat(customerForm.credit_limit) || 0,
          password: customerForm.password,
          notes: customerForm.notes,
          starting_balance: parseFloat(customerForm.starting_balance) || 0
        })
      });

      if (res.ok) {
        alert("✅ تم تحديث بيانات العميل بنجاح");
        setShowCustomerModal(false);
        setIsEditingCustomer(null);
        setCustomerForm({ name: '', phone: '', email: '', customer_type: 'cash', credit_limit: '', password: '', notes: '', starting_balance: '' });
        
        // Refresh customers list
        const updated = await fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json());
        setCustomers(Array.isArray(updated) ? updated : []);
      } else {
        const error = await res.json();
        alert("❌ خطأ: " + (error.error || "فشل التحديث"));
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالسيرفر");
    }
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async (customerId: number) => {
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا العميل؟")) return;

    try {
      console.log(`🗑️ Attempting to delete customer: ${customerId}`);
      
      // For topup stores, use the dedicated endpoint
      const endpoint = user?.store_type === 'topup' 
        ? `/api/topup/customers/${customerId}`
        : `/api/customers/${customerId}`;
      
      console.log(`📍 Using endpoint: ${endpoint}`);
      
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      console.log(`📬 Delete response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Server response:`, data);
        alert("✅ تم حذف العميل بنجاح");
        
        // Remove from local state immediately
        setCustomers(customers.filter(c => c.id !== customerId));
        console.log(`✅ Customer removed from local state`);
        
        // Then refresh from API to ensure is_active filter is applied
        setTimeout(async () => {
          if (user?.store_id) {
            console.log("🔄 Refreshing customers list after delete...");
            try {
              const refreshRes = await fetch(`/api/merchant/customers?storeId=${user.store_id}`);
              const refreshedData = await refreshRes.json();
              console.log("✅ Customers refreshed:", refreshedData);
              setCustomers(Array.isArray(refreshedData) ? refreshedData : []);
            } catch (err) {
              console.error("Error refreshing customers:", err);
            }
          }
        }, 500);
      } else {
        const error = await res.json();
        console.error(`❌ Delete error:`, error);
        alert("❌ خطأ: " + (error.error || "فشل الحذف"));
      }
    } catch (err) {
      console.error(`❌ Delete exception:`, err);
      alert("حدث خطأ في الاتصال بالسيرفر: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handle Load Customer Statement
  const handleLoadStatement = async (customerId: number) => {
    try {
      const res = await fetch(`/api/customers/${customerId}/statement`);
      if (res.ok) {
        const data = await res.json();
        console.log("📊 Customer Statement:", data);
        setCustomerTransactions(data.transactions || []);
        // TODO: Show statement modal with this data
        alert(`📊 كشف الحساب للعميل: ${data.name}\nالرصيد الحالي: ${data.current_debt}`);
      } else {
        alert("❌ فشل الحصول على كشف الحساب");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالسيرفر");
    }
  };

  if (user?.role === 'merchant' && (!user.store_active || (user.store_status && user.store_status !== 'approved' && user.store_status !== 'active'))) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="p-10 text-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Pause size={40} />
            </div>
            <h1 className="text-2xl font-normal text-gray-900 mb-4">متجرك قيد المراجعة</h1>
            <p className="text-gray-600 mb-8 font-medium italic">
              عذراً، متجرك مسجل حالياً وحالته <b>{(user as any).store_status === 'pending' ? 'قيد الانتظار' : (user as any).store_status}</b>.
              <br/><br/>
              يرجى انتظار موافقة الإدارة قبل البدء في إدارة المنتجات. سنقوم بإبلاغك عبر تليجرام فور التفعيل.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full bg-indigo-600 text-white py-4 font-normal rounded-xl"
              >
                العودة للصفحة الرئيسية
              </Button>
              <button 
                onClick={() => {
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className={cn("w-full text-sm font-normal", isDarkMode ? "text-gray-300 hover:text-gray-100" : "text-gray-400 hover:text-gray-600")}
              >
                تسجيل الخروج
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const renderProductModal = () => {
    if (!showProductModal) return null;
    
    // Check if this is a topup store
    const isTopupStore = user?.store_type === 'topup';
    
    // Render Topup Product Modal (simplified)
    if (isTopupStore) {
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn("rounded-[2.5rem] w-full max-w-lg shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
              <div>
                <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingProduct ? 'تعديل بطاقة شحن' : 'إضافة بطاقة شحن'}</h3>
                <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>🔑 أدخل تفاصيل بطاقة الشحن والأسعار</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Product Name & Category Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Product Name */}
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم البطاقة</label>
                  <input 
                    type="text" 
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    placeholder="مثال: بطاقة شحن 5000"
                    className={cn("w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>الشركة</label>
                  <select 
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                    className={cn("w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none appearance-none cursor-pointer", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  >
                    <option value="">اختر الشركة</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>سعر المفرد</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={productForm.retail_price}
                      onChange={(e) => setProductForm({...productForm, retail_price: e.target.value})}
                      placeholder="0"
                      className={cn("w-full px-3 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-8 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                    />
                    <span className={cn("absolute left-2 top-1/2 -translate-y-1/2 font-normal text-xs", isDarkMode ? "text-gray-500" : "text-gray-400")}>د.أ</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>سعر الجملة</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={productForm.wholesale_price}
                      onChange={(e) => setProductForm({...productForm, wholesale_price: e.target.value})}
                      placeholder="0"
                      className={cn("w-full px-3 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-8 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                    />
                    <span className={cn("absolute left-2 top-1/2 -translate-y-1/2 font-normal text-xs", isDarkMode ? "text-gray-500" : "text-gray-400")}>د.أ</span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>عدد البطاقات المتوفرة</label>
                <input 
                  type="number" 
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  placeholder="0"
                  className={cn("w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                />
              </div>

              {/* Topup Codes Section */}
              <div className="border-t border-black/5 pt-4 mt-4 space-y-3">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>🔑 أكواد الشحن</label>
                
                {/* Success/Error Message */}
                {topupCodesMessage && (
                  <div className={cn("p-3 rounded-xl text-sm font-normal flex items-center gap-2 animate-in", topupCodesMessage.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {topupCodesMessage.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {topupCodesMessage.text}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className={cn("text-xs font-normal block", isDarkMode ? "text-gray-400" : "text-gray-600")}>تحميل ملف</label>
                    <label className={cn("cursor-pointer block w-full p-3 border-2 border-dashed rounded-xl text-center transition-all h-[100px] flex flex-col items-center justify-center", isDarkMode ? "border-green-600 hover:bg-green-900/20" : "border-green-300 hover:bg-green-50")}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Upload size={16} className="text-green-500" />
                        <span className={cn("text-xs font-normal line-clamp-2", isDarkMode ? "text-green-400" : "text-green-600")}>
                          {topupCodesFile ? topupCodesFile.name : 'اختر ملف'}
                        </span>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTopupCodesFile(file);
                            setProductForm({ ...productForm, topup_codes_text: '' });
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Text Input */}
                  <div className="space-y-2">
                    <label className={cn("text-xs font-normal block", isDarkMode ? "text-gray-400" : "text-gray-600")}>أدخل الأكواد</label>
                    <textarea 
                      value={productForm.topup_codes_text}
                      onChange={(e) => {
                        setProductForm({ ...productForm, topup_codes_text: e.target.value });
                        setTopupCodesFile(null);
                      }}
                      placeholder="كود في السطر"
                      rows={4}
                      className={cn("w-full px-3 py-2 border rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-mono text-xs outline-none resize-none h-[100px]", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                    />
                  </div>
                </div>

                {/* Codes Count */}
                <div className="flex gap-3 justify-center">
                  {topupCodesFile && (
                    <div className="text-xs font-normal bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      📄 {topupCodesFile.name}
                    </div>
                  )}
                  {productForm.topup_codes_text.trim() && (
                    <div className={cn("text-xs font-normal px-3 py-1.5 rounded-lg flex items-center gap-1", isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700")}>
                      ✓ {productForm.topup_codes_text.split('\n').filter(c => c.trim()).length} أكواد
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={cn("p-6 border-t flex gap-3", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
              <Button 
                onClick={saveProduct}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow-lg shadow-green-200 text-sm font-normal transition-all hover:scale-[1.02] active:scale-95 font-sans"
              >
                {isEditingProduct ? 'تحديث' : 'إضافة البطاقة'}
              </Button>
              <Button 
                onClick={() => setShowProductModal(false)}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-normal rounded-xl transition-all font-sans text-sm"
              >
                إلغاء
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }
    
    // Regular Store Product Modal (original)
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-2xl shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>أدخل تفاصيل المنتج بدقة لجذب العملاء</p>
            </div>
            <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المنتج</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="مثال: قميص قطني فاخر"
                  className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>القسم</label>
                <select 
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({...productForm, category_id: e.target.value})}
                  className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none appearance-none cursor-pointer", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>وصف المنتج</label>
              <textarea 
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="تحدث عن جودة المنتج ومواصفاته..."
                rows={2}
                className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none resize-none font-sans h-16", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>السعر</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={Math.floor(parseFloat(String(productForm.price) || '0'))}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="0"
                    className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12 h-16", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                  />
                  <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 font-normal font-sans", isDarkMode ? "text-gray-500" : "text-gray-400")}>د.أ</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>الكمية المتوفرة</label>
                <input 
                  type="number" 
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  placeholder="0"
                  className={cn("w-full px-5 py-3 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none h-16", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-normal text-gray-700 block mr-1">صورة المنتج</label>
                <label className="cursor-pointer group relative">
                  <div className={cn("w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden", isDarkMode ? "border-gray-600 bg-gray-700 group-hover:bg-gray-600 group-hover:border-gray-500" : "border-indigo-100 bg-gray-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300")}>
                    {productForm.image_url ? (
                      <div className="relative w-full h-full">
                        <img src={productForm.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload size={32} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                          <Plus size={32} />
                        </div>
                        <p className="text-sm font-normal text-gray-400">اضغط لاختيار صورة المنتج</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setProductForm({...productForm, image_url: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="space-y-4">
              <label className="text-sm font-normal text-gray-700 block mr-1">صور إضافية (معرض الصور)</label>
              <div className="grid grid-cols-4 gap-3">
                {productForm.gallery?.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-black/5 shadow-sm">
                    <img src={url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                    <button 
                      onClick={() => setProductForm({ ...productForm, gallery: productForm.gallery.filter((_, i) => i !== idx) })}
                      className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/30 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                  <Plus size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-normal text-indigo-300 mt-1">إضافة</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProductForm({ ...productForm, gallery: [...(productForm.gallery || []), reader.result as string] });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              </div>
            </div>

            {/* Auction Section - Only for Regular Stores */}
            {user?.store_type !== 'topup' && (
            <div className="border-t border-black/5 pt-6 mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={productForm.is_auction}
                  onChange={(e) => setProductForm({...productForm, is_auction: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                  id="auction-toggle"
                />
                <label htmlFor="auction-toggle" className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  🔥 تفعيل المزاد لهذا المنتج
                </label>
              </div>
              
              {productForm.is_auction && (
                <div className="space-y-4 mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>تاريخ المزاد</label>
                      <input 
                        type="date" 
                        value={productForm.auction_date}
                        onChange={(e) => setProductForm({...productForm, auction_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-amber-300")}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>السعر الأساسي للمزاد</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={productForm.auction_price}
                          onChange={(e) => setProductForm({...productForm, auction_price: e.target.value})}
                          placeholder="0"
                          className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal outline-none pl-10", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-white border-amber-300 placeholder-gray-400")}
                        />
                        <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>د.أ</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>وقت البداية</label>
                      <input 
                        type="time" 
                        value={productForm.auction_start_time}
                        onChange={(e) => setProductForm({...productForm, auction_start_time: e.target.value})}
                        className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-amber-300")}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>وقت النهاية</label>
                      <input 
                        type="time" 
                        value={productForm.auction_end_time}
                        onChange={(e) => setProductForm({...productForm, auction_end_time: e.target.value})}
                        className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-amber-300")}
                      />
                    </div>
                  </div>
                  
                  {productForm.auction_date && productForm.auction_price && (
                    <div className={cn("p-3 rounded-lg text-sm font-normal flex items-center gap-2", isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700")}>
                      <Check size={16} />
                      سيتم فتح المزاد في {productForm.auction_date} من {productForm.auction_start_time} إلى {productForm.auction_end_time}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Topup Codes Section - Only for Topup Stores */}
            {user?.store_type === 'topup' && (
            <div className="border-t border-black/5 pt-6 mt-6 space-y-4">
              <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>🔑 أكواد الشحن (اختياري)</label>
              
              {/* Success/Error Message */}
              {topupCodesMessage && (
                <div className={cn("p-3 rounded-xl text-sm font-normal flex items-center gap-2 animate-in", topupCodesMessage.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {topupCodesMessage.type === 'success' ? <Check size={16} /> : <X size={16} />}
                  {topupCodesMessage.text}
                </div>
              )}
              
              <div className="space-y-3">
                <label className={cn("text-xs font-normal block", isDarkMode ? "text-gray-400" : "text-gray-600")}>الطريقة الأولى: تحميل ملف نصي</label>
                <label className={cn("cursor-pointer block w-full p-4 border-2 border-dashed rounded-2xl text-center transition-all", isDarkMode ? "border-green-600 hover:bg-green-900/20" : "border-green-300 hover:bg-green-50")}>
                  <div className="flex items-center justify-center gap-2">
                    <Upload size={20} className="text-green-500" />
                    <span className={cn("text-sm font-normal", isDarkMode ? "text-green-400" : "text-green-600")}>
                      {topupCodesFile ? topupCodesFile.name : 'اضغط لاختيار ملف نصي'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTopupCodesFile(file);
                        setProductForm({ ...productForm, topup_codes_text: '' });
                      }
                    }}
                  />
                </label>
              </div>

              <div className="text-center">
                <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>أو</p>
              </div>

              <div className="space-y-3">
                <label className={cn("text-xs font-normal block", isDarkMode ? "text-gray-400" : "text-gray-600")}>الطريقة الثانية: إدراج الأكواد مباشرة</label>
                <textarea 
                  value={productForm.topup_codes_text}
                  onChange={(e) => {
                    setProductForm({ ...productForm, topup_codes_text: e.target.value });
                    setTopupCodesFile(null);
                  }}
                  placeholder="أدخل كود واحد في كل سطر..."
                  rows={4}
                  className={cn("w-full px-4 py-3 border rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-mono text-sm outline-none resize-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                />
                {productForm.topup_codes_text.trim() && (
                  <p className={cn("text-xs font-normal", isDarkMode ? "text-green-400" : "text-green-600")}>
                    ✓ سيتم حفظ {productForm.topup_codes_text.split('\n').filter(c => c.trim()).length} أكواد
                  </p>
                )}
              </div>
            </div>
            )}
            </div>
          </div>
          <div className={cn("p-8 border-t flex gap-4", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={saveProduct}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg font-normal transition-all hover:scale-[1.02] active:scale-95 font-sans"
            >
              {isEditingProduct ? 'تحديث البيانات' : 'إضافة المنتج للمتجر'}
            </Button>
            <Button 
              onClick={() => setShowProductModal(false)}
              className="px-8 bg-white border-2 border-black/5 hover:bg-gray-100/50 text-gray-600 font-normal rounded-2xl transition-all font-sans"
            >
              إلغاء
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!showCategoryModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-lg shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الأقسام تساعد في تنظيم متجرك للعملاء</p>
            </div>
            <button onClick={() => setShowCategoryModal(false)} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`اسم القسم`}</label>
              <input 
                type="text" 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="مثال: ملابس صيفية، إلكترونيات"
                className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-700")}
              />
            </div>
            <div className="space-y-4">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`صورة القسم (اختياري)`}</label>
              <div className="flex flex-col gap-4">
                <label className="cursor-pointer group relative">
                  <div className={cn("w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden", isDarkMode ? "border-gray-600 bg-gray-700 group-hover:bg-gray-600 group-hover:border-gray-500" : "border-indigo-100 bg-gray-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300")}>
                    {categoryForm.image_url ? (
                      <div className="relative w-full h-full">
                        <img src={categoryForm.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload size={24} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <Plus size={24} className="text-indigo-500 mb-1" />
                        <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>اختر صورة للقسم</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setCategoryForm({...categoryForm, image_url: reader.result as string});
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <input 
                  type="text" 
                  value={categoryForm.image_url.startsWith('data:') ? '' : categoryForm.image_url}
                  onChange={(e) => setCategoryForm({...categoryForm, image_url: e.target.value})}
                  placeholder="أو ضع رابطاً مباشراً..."
                  className={cn("w-full px-5 py-3 border rounded-xl font-normal outline-none text-xs", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                />
              </div>
            </div>
          </div>
          <div className={cn("p-8 border-t flex gap-4", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={saveCategory}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg font-normal transition-all hover:scale-[1.02] active:scale-95 font-sans"
            >
              {isEditingCategory ? 'تعديل' : 'إضافة القسم'}
            </Button>
            <Button 
              onClick={() => setShowCategoryModal(false)}
              className={cn("px-8 border-2 font-normal rounded-2xl transition-all font-sans", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 hover:bg-gray-500" : "bg-white border-black/5 text-gray-600 hover:bg-gray-100/50")}
            >
              إلغاء
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCustomers = () => {
    const creditStatusColor = (debt: number, limit: number) => {
      if (limit === 0) return "text-gray-400";
      const usage = (debt / limit) * 100;
      if (usage >= 100) return "text-red-600";
      if (usage >= 80) return "text-amber-600";
      return "text-green-600";
    };

    const creditStatusBg = (debt: number, limit: number) => {
      if (limit === 0) return "bg-gray-100";
      const usage = (debt / limit) * 100;
      if (usage >= 100) return "bg-red-50";
      if (usage >= 80) return "bg-amber-50";
      return "bg-green-50";
    };

    const isTopupStore = user?.store_type === 'topup';

    return (
    <Card className={cn("rounded-[2rem] overflow-hidden border-none p-0 shadow-sm", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")}> 
      <div className={cn("p-6 border-b border-gray-100 flex justify-between items-center", isDarkMode ? "bg-gray-900 border-gray-800" : "bg-gray-50/50 border-black/5")}>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg", isDarkMode ? "bg-indigo-700 shadow-indigo-900/20" : "bg-indigo-600 shadow-indigo-100")}>
            <Users size={20} />
          </div>
          <div>
            <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>إدارة العملاء</h2>
            <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {isTopupStore ? 'عملاء مدخلة يدويا' : 'من الطلبات (تلقائي)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("px-4 py-1.5 rounded-full text-xs font-normal", isDarkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
            {customers.length} عميل
          </div>
          {isTopupStore && (
            <Button 
              onClick={() => {
                setIsEditingCustomer(null);
                setCustomerForm({ name: '', phone: '', email: '', customer_type: 'cash', credit_limit: '', password: '', notes: '' });
                setShowCustomerModal(true);
              }}
              className={cn("px-4 py-2 rounded-xl text-sm font-normal transition-all shadow-sm", isDarkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-600 hover:bg-green-700 text-white")}
            >
              ➕ عميل جديد
            </Button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className={cn("w-full text-right border-collapse", isDarkMode ? "bg-gray-900" : "")}>
          <thead>
            <tr className={cn(isDarkMode ? "bg-gray-800" : "bg-white")}> 
              {isTopupStore ? (
                <>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>الاسم</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>النوع</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>الرقم</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>حد الائتمان</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الرصيد الابتدائي</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الديون الحالية</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الإجراءات</th>
                </>
              ) : (
                <>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>الاسم</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>رقم الهاتف</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>العنوان</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>المنتجات المشتراة</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>إجمالي الطلبات</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الإجراءات</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={cn(isDarkMode ? "divide-gray-800" : "divide-gray-50")}> 
            {customers.length === 0 ? (
              <tr>
                <td colSpan={isTopupStore ? 6 : 6} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-sm font-normal">لا توجد عملاء بعد. أضف عميلاً جديداً</div>
                </td>
              </tr>
            ) : customers.map((cust) => {
              if (isTopupStore) {
                // Topup Store View
                const availableCredit = (cust.credit_limit || 0) - (cust.current_debt || 0);
                const debtPercentage = cust.credit_limit ? ((cust.current_debt || 0) / cust.credit_limit) * 100 : 0;
                
                return (
                  <tr key={cust.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-normal", isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
                          {cust.name?.charAt(0)}
                        </div>
                        <div className={cn("text-sm font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{cust.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2.5 py-1 rounded-lg", cust.customer_type === 'reseller' ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700") : (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"))}>
                        {cust.customer_type === 'reseller' ? 'نقطة بيع' : 'عميل نقدي'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg border", isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-50 text-gray-600 border-gray-100")}>{cust.phone}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono", isDarkMode ? "text-gray-300" : "text-gray-700")}>{formatCurrency(cust.credit_limit || 0)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono px-2 py-1 rounded-lg", isDarkMode ? "bg-purple-900/20 text-purple-300" : "bg-purple-50 text-purple-700")}>{formatCurrency(cust.starting_balance || 0)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn("px-3 py-1 rounded-lg text-sm font-normal font-mono", creditStatusBg(cust.current_debt || 0, cust.credit_limit || 0), creditStatusColor(cust.current_debt || 0, cust.credit_limit || 0))}>
                        {formatCurrency(cust.current_debt || 0)}
                        {cust.credit_limit > 0 && <span className="text-xs"> ({Math.round(debtPercentage)}%)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleLoadStatement(cust.id)}
                          title="كشف الحساب"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-600 hover:text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white")}
                        >
                          <FileText size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingCustomer(cust.id);
                            setCustomerForm({
                              name: cust.name,
                              phone: cust.phone,
                              email: cust.email || '',
                              customer_type: cust.customer_type || 'cash',
                              credit_limit: String(cust.credit_limit || 0),
                              password: cust.password || '',
                              notes: cust.notes || '',
                              starting_balance: String(cust.starting_balance || 0)
                            });
                            setShowCustomerModal(true);
                          }}
                          title="تعديل"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-600 hover:text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white")}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(cust.id)}
                          title="حذف"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              } else {
                // Regular Store View
                return (
                  <tr key={cust.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-normal", isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
                          {cust.name?.charAt(0)}
                        </div>
                        <div className={cn("text-sm font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{cust.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg border", isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-50 text-gray-600 border-gray-100")}>{cust.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>{cust.address || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg", isDarkMode ? "bg-purple-900/20 text-purple-300" : "bg-purple-50 text-purple-700")}>{cust.total_items || 0} منتج</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono px-3 py-1 rounded-lg", isDarkMode ? "bg-indigo-900/20 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>{cust.total_orders || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleDeleteCustomer(cust.id)}
                          title="حذف"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </Card>
    );
  };

  const renderCustomerModal = () => {
    if (!showCustomerModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-2xl shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>أدخل بيانات العميل بدقة</p>
            </div>
            <button onClick={() => setShowCustomerModal(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>📝 الاسم</label>
              <input 
                type="text"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                placeholder="أدخل اسم العميل"
                className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>📱 رقم الهاتف</label>
                <input 
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  placeholder="07800000000"
                  className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>📧 البريد (اختياري)</label>
                <input 
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  placeholder="email@example.com"
                  className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>🏪 نوع العميل</label>
                <select 
                  value={customerForm.customer_type}
                  onChange={(e) => setCustomerForm({...customerForm, customer_type: e.target.value as 'cash' | 'reseller'})}
                  className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 text-gray-900")}
                >
                  <option value="cash">عميل نقدي</option>
                  <option value="reseller">نقطة بيع</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>💰 حد الائتمان</label>
                <input 
                  type="number"
                  value={customerForm.credit_limit}
                  onChange={(e) => setCustomerForm({...customerForm, credit_limit: e.target.value})}
                  placeholder="0"
                  min="0"
                  className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>💵 الرصيد الابتدائي (اختياري)</label>
              <input 
                type="number"
                value={customerForm.starting_balance}
                onChange={(e) => setCustomerForm({...customerForm, starting_balance: e.target.value})}
                placeholder="0"
                min="0"
                className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>� كلمة المرور (للمتاجر النقدية)</label>
              <input 
                type="password"
                value={customerForm.password}
                onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})}
                placeholder="أدخل كلمة المرور"
                className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>�📝 ملاحظات (اختياري)</label>
              <textarea 
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({...customerForm, notes: e.target.value})}
                placeholder="أضف ملاحظاتك هنا"
                rows={3}
                className={cn("w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-normal resize-none outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 text-gray-900 placeholder-gray-400")}
              />
            </div>
          </div>

          <div className={cn("p-6 border-t flex gap-3", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={isEditingCustomer ? handleEditCustomer : handleCreateCustomer}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow-lg shadow-green-200 text-sm font-normal transition-all hover:scale-[1.02] active:scale-95 font-sans"
            >
              {isEditingCustomer ? '💾 تحديث البيانات' : '➕ إضافة العميل'}
            </Button>
            <Button 
              onClick={() => setShowCustomerModal(false)}
              className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-normal rounded-xl transition-all font-sans text-sm"
            >
              إلغاء
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCoupons = () => {
    return (
    <Card className={cn("rounded-[2rem] overflow-hidden border-none p-0 shadow-sm", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-6 border-b border-gray-100 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-gray-50/50")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Ticket size={20} />
          </div>
          <h2 className="text-xl font-normal text-gray-800">قسائم الخصم</h2>
        </div>
        <Button 
          onClick={() => {
            setCouponForm({
              code: '',
              discount_type: 'percentage',
              discount_value: '',
              min_order_value: '0',
              expiry_date: '',
              usage_limit: ''
            });
            setShowCouponModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg py-3 px-6 rounded-2xl text-sm font-normal flex items-center gap-2 transform transition-all hover:scale-105"
        >
          <Plus size={20} /> إنشاء قسيمة جديدة
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className={cn(isDarkMode ? "bg-gray-800" : "bg-gray-50/30")}>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>الرمز</th>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>نوع الخصم</th>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الخصم</th>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الاستخدام</th>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>تنتهي في</th>
              <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الإجراءات</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-gray-50")}>
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isDarkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                       <Gift size={16} />
                    </div>
                    <span className={cn("text-sm font-normal group-hover:text-indigo-600 transition-colors", isDarkMode ? "text-gray-100 group-hover:text-indigo-400" : "text-gray-900 group-hover:text-indigo-600")}>{coupon.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[10px] font-normal uppercase tracking-tighter",
                     coupon.discount_type === 'percentage' ? (isDarkMode ? "bg-amber-900 text-amber-300 border border-amber-700" : "bg-amber-100 text-amber-700 border border-amber-200") : (isDarkMode ? "bg-emerald-900 text-emerald-300 border border-emerald-700" : "bg-emerald-100 text-emerald-700 border border-emerald-200")
                   )}>
                     {coupon.discount_type === 'percentage' ? 'نسبة مئوية %' : 'خصم ثابت'}
                   </span>
                </td>
                <td className={cn("px-6 py-4 text-center font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)}
                </td>
                <td className="px-6 py-4 text-center">
                   <div className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {coupon.usage_count} {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                   </div>
                   {coupon.usage_limit && (
                     <div className={cn("w-16 h-1 rounded-full mx-auto mt-1 overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                       <div 
                         className={cn("h-full rounded-full", isDarkMode ? "bg-indigo-600" : "bg-indigo-500")} 
                         style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                       ></div>
                     </div>
                   )}
                </td>
                <td className={cn("px-6 py-4 text-center text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                  {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString('en-US') : 'بدون تاريخ'}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={async () => {
                       if (confirm("هل أنت متأكد من حذف هذه القسيمة؟")) {
                         const res = await fetch(`/api/coupons/${coupon.id}`, { method: 'DELETE' });
                         if (res.ok) setCoupons(coupons.filter(c => c.id !== coupon.id));
                       }
                    }}
                    className={cn("p-2.5 rounded-xl transition-all shadow-sm", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white")}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredCoupons.length === 0 && (
              <tr>
                <td colSpan={6} className={cn("p-20 text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>
                  <Ticket size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-normal">لا توجد قسائم خصم حالياً</p>
                  <p className="text-xs font-normal mt-1">ابدأ بإنشاء أول رمز ترويجي لمضاعفة مبيعاتك!</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
  };

  const saveCoupon = async () => {
    if (!user?.store_id) return;
    if (!couponForm.code || !couponForm.discount_value) {
      alert("يرجى ملء كافة الحقول الأساسية");
      return;
    }

    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...couponForm,
        store_id: user.store_id,
        discount_value: Math.floor(parseFloat(String(couponForm.discount_value) || '0')),
        min_order_value: Math.floor(parseFloat(couponForm.min_order_value || '0')),
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null
      })
    });

    if (res.ok) {
      const data = await res.json();
      setCoupons([data, ...coupons]);
      setShowCouponModal(false);
    } else {
      const err = await res.json();
      alert(err.error || "فشل إنشاء القسيمة");
    }
  };

  const renderCouponModal = () => {
    if (!showCouponModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-lg shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>إنشاء قسيمة جديدة</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الخصومات تجذب العملاء وتزيد من مبيعاتك</p>
            </div>
            <button onClick={() => setShowCouponModal(false)} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400 hover:text-gray-300" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`رمز الخصم (Code)`}</label>
              <input 
                type="text" 
                value={couponForm.code}
                onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                placeholder="مثلاً: SAVE20, RAMADAN"
                className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal text-lg outline-none uppercase", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`نوع الخصم`}</label>
                  <select 
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({...couponForm, discount_type: e.target.value})}
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none appearance-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت (IQD)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`قيمة الخصم`}</label>
                  <input 
                    type="number" 
                    value={Math.floor(parseFloat(String(couponForm.discount_value) || '0'))}
                    onChange={(e) => setCouponForm({...couponForm, discount_value: e.target.value})}
                    placeholder="0"
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`الحد الأدنى للطلب`}</label>
                  <input 
                    type="number" 
                    value={Math.floor(parseFloat(String(couponForm.min_order_value) || '0'))}
                    onChange={(e) => setCouponForm({...couponForm, min_order_value: e.target.value})}
                    placeholder="0"
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
               </div>
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`تاريخ الانتهاء`}</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date" 
                      value={couponForm.expiry_date}
                      onChange={(e) => setCouponForm({...couponForm, expiry_date: e.target.value})}
                      className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-normal text-gray-700 block mr-1">حد الاستخدام (اختياري)</label>
               <input 
                type="number" 
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})}
                placeholder="مثلاً: 100 مرة"
                className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none"
              />
            </div>
          </div>

          <div className={cn("p-8 border-t", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={saveCoupon}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg font-normal transition-all hover:scale-[1.02] active:scale-95"
            >
              تفعيل القسيمة الآن
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderProducts = () => {
    // Group filtered products by category
    const productsByCategory = filteredProducts.reduce((acc, product) => {
      const category = product.category_name || 'بدون قسم';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, typeof filteredProducts>);

    const categories = Object.keys(productsByCategory).sort();

    return (
    <Card className={cn("rounded-[2.5rem] border-none shadow-xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-gray-50/50")}>
        <div>
          <h3 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إدارة المنتجات</h3>
          <p className={cn("font-medium text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>أضف، عدل أو احذف المنتجات من متجرك</p>
        </div>
        <Button 
          onClick={handleCreateProduct}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg py-4 px-8 rounded-2xl text-sm font-normal flex items-center gap-2 transform transition-transform hover:scale-105"
        >
          <Plus size={20} /> إضافة منتج جديد
        </Button>
      </div>
      <div className={cn("p-8", isDarkMode ? "bg-gray-800" : "bg-white")}>
        {filteredProducts.length === 0 ? (
          <div className={cn("p-20 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
            <Package size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-normal text-lg">{dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد منتجات حالياً.'}</p>
            {!dashboardQuery && <p className="text-sm">ابدأ بإضافة منتجك الأول الآن!</p>}
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category}>
                {/* Category Name */}
                <div className="mb-6 pb-4 border-b border-black/5">
                  <h4 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>{category}</h4>
                  <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    {productsByCategory[category].length} منتج
                  </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {productsByCategory[category].map((p) => (
                    <div key={p.id} className="relative group">
                      <Card className={cn(
                        "h-full flex flex-col border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden",
                        isDarkMode ? "bg-gray-700 border-green-700 hover:border-green-600" : "bg-gray-50 border-green-500 hover:border-green-600"
                      )}>
                        <div className={cn("relative h-24 overflow-hidden rounded-lg flex items-center justify-center", isDarkMode ? "bg-gradient-to-br from-green-600/20 to-green-800/20" : "bg-gradient-to-br from-green-50 to-emerald-50")}>
                          {p.image_url && p.image_url.trim() ? (
                            <img 
                              src={p.image_url} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          
                          {/* Default Card Icon */}
                          <div className={cn("flex items-center justify-center text-5xl font-bold", !p.image_url || !p.image_url.trim() ? "block" : "hidden")}>
                            💳
                          </div>
                          
                          {p.stock <= 2 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-normal px-2 py-0.5 rounded-full shadow-lg">
                              منخفض
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Edit & Delete Buttons - Overlay */}
                        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={() => handleEditProduct(p)}
                            className={cn("p-1.5 rounded-lg shadow-md transition-all", isDarkMode ? "bg-gray-600 hover:bg-indigo-600 text-gray-300" : "bg-white hover:bg-indigo-600 text-gray-600 hover:text-white")}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className={cn("p-1.5 rounded-lg shadow-md transition-all", isDarkMode ? "bg-gray-600 hover:bg-red-600 text-gray-300" : "bg-white hover:bg-red-600 text-gray-600 hover:text-white")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className={cn("font-normal text-sm line-clamp-1 mb-1", isDarkMode ? "text-gray-100" : "text-gray-900")}>{p.name}</h4>
                            <p className={cn("text-[11px] line-clamp-1 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>{p.description || 'لا يوجد وصف'}</p>
                          </div>
                          <div className="space-y-1.5 pt-2 border-t border-black/5">
                            <div className="flex justify-between items-center gap-1">
                              <div className="flex flex-col">
                                <span className={cn("text-[10px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>المخزون</span>
                                <span className={cn("font-normal text-sm", p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-600" : "text-green-600")}>
                                  {p.stock}
                                </span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className={cn("text-[10px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>السعر</span>
                                <span className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>{formatCurrency(p.price)}</span>
                              </div>
                            </div>
                            {/* Show codes count for topup products */}
                            {p.topup_codes && Array.isArray(p.topup_codes) && p.topup_codes.length > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-black/5">
                                <span className={cn("text-sm font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>🔑</span>
                                <span className={cn("font-normal text-[11px]", isDarkMode ? "text-blue-300" : "text-blue-700")}>{p.topup_codes.length} أكواد</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
    );
  };

  const renderOverview = () => {
    return (
      <>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'إجمالي المبيعات', value: formatCurrency(merchantStats.totalRevenue), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', clickable: true },
            { label: 'الطلبات المكتملة', value: merchantStats.orderStats.completed, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', clickable: false },
            { label: 'المنتجات النشطة', value: products.length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', clickable: false },
            { label: 'إجمالي العملاء', value: customers.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', clickable: false },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => stat.clickable && handleOpenSalesModal()}
              className={cn(
                "p-6 text-left rounded-2xl border-2 shadow-sm hover:shadow-lg hover:border-black/10 transition-all group",
                isDarkMode ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-black/5",
                stat.clickable && "cursor-pointer hover:-translate-y-1"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <p className={cn("text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-500")}>{stat.label}</p>
              <p className={cn("text-3xl font-normal mt-2", isDarkMode ? "text-gray-100" : "text-gray-900")}>{stat.value}</p>
              {stat.clickable && (
                <p className="text-[10px] text-blue-600 font-normal mt-2 flex items-center gap-1">
                  اضغط للمزيد <ExternalLink size={12} />
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Order Status Chart */}
          <Card className="lg:col-span-1 rounded-2xl border-2 shadow-sm overflow-hidden">
            <div className={cn("p-6 border-b", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
              <h3 className={cn("font-normal text-lg flex items-center gap-2", isDarkMode ? "text-gray-200" : "text-gray-800")}>
                <PieChart size={20} className="text-indigo-500" />
                حالة الطلبات
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal text-amber-600">بانتظار التجهيز</span>
                  <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{merchantStats.orderStats.pending}</span>
                </div>
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(merchantStats.orderStats.pending / (merchantStats.orderStats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal text-emerald-600">مكتملة</span>
                  <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{merchantStats.orderStats.completed}</span>
                </div>
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(merchantStats.orderStats.completed / (merchantStats.orderStats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={cn("mt-6 pt-6 border-t text-center", isDarkMode ? "border-gray-600" : "border-black/5")}>
                 <p className={cn("text-[10px] font-normal uppercase", isDarkMode ? "text-gray-500" : "text-gray-400")}>إجمالي</p>
                 <p className={cn("text-2xl font-normal mt-1", isDarkMode ? "text-gray-300" : "text-gray-900")}>{merchantStats.orderStats.total}</p>
              </div>
            </div>
          </Card>

          {/* Top Products */}
          <Card className="lg:col-span-2 rounded-2xl border-2 shadow-sm overflow-hidden">
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
              <h3 className={cn("font-normal text-lg flex items-center gap-2", isDarkMode ? "text-gray-200" : "text-gray-800")}>
                <TrendingUp size={20} className="text-indigo-500" />
                أكثر المنتجات مبيعاً
              </h3>
            </div>
            <div className={cn("divide-y max-h-96 overflow-y-auto", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
              {merchantStats.topProducts.length === 0 ? (
                <div className={cn("p-12 text-center font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                  لا توجد بيانات مبيعات كافية
                </div>
              ) : (
                merchantStats.topProducts.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className={cn("p-4 transition-colors", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50")}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex-1">
                        <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>{p.name}</p>
                        <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>المبيعات: {p.sales_count}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-normal text-lg", isDarkMode ? "text-gray-300" : "text-gray-900")}>{formatCurrency(p.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className={cn("w-full border-2 shadow-sm rounded-2xl overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
          <div className={cn("p-6 border-b", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <h3 className={cn("font-normal text-lg flex items-center gap-2", isDarkMode ? "text-gray-200" : "text-gray-800")}>
              <ShoppingCart size={20} className="text-indigo-500" />
              آخر الطلبات
            </h3>
          </div>
          <div className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
            {orders.length === 0 ? (
              <div className={cn("p-12 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-normal">لا توجد طلبات حالياً</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className={cn("p-4 transition-colors flex items-center justify-between", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50")}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>طلب #{order.id}</p>
                      <p className={cn("text-[10px]", isDarkMode ? "text-gray-500" : "text-gray-400")}>{new Date(order.created_at).toLocaleDateString('en-US')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 text-[9px] font-normal uppercase rounded-full",
                      order.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {order.status === 'pending' ? 'بانتظار' : 'مكتمل'}
                    </span>
                    <p className={cn("font-normal text-sm min-w-[80px] text-left", isDarkMode ? "text-gray-300" : "text-gray-900")}>{formatCurrency(order.total_amount || order.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </>
    );
  };

  const renderSalesModal = () => {
    return (
    <AnimatePresence>
      {showSalesModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSalesModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn("rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            {/* Header */}
            <div className={cn("p-8 border-b flex justify-between items-center sticky top-0", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-black/5")}>
              <div>
                <h2 className={cn("text-2xl font-normal flex items-center gap-2", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                  <CreditCard size={28} className="text-blue-600" />
                  تقرير المبيعات
                </h2>
                <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>عرض تفصيلي للمبيعات خلال فترات مختلفة</p>
              </div>
              <button 
                onClick={() => setShowSalesModal(false)}
                className={cn("p-2 rounded-xl transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Period Selection */}
              <div className="flex gap-3">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      "px-6 py-2 rounded-xl font-normal text-sm transition-all",
                      selectedPeriod === period
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {period === 'daily' ? 'يومي' : period === 'weekly' ? 'أسبوعي' : 'شهري'}
                  </button>
                ))}
              </div>

              {/* Sales Chart */}
              <div className={cn("rounded-2xl p-6 border-2", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-black/5")}>
                <h3 className={cn("font-normal text-lg mb-6", isDarkMode ? "text-gray-100" : "text-gray-800")}>بيانات المبيعات</h3>
                <div className="space-y-3">
                  {(salesData[selectedPeriod] || []).length === 0 ? (
                    <div className={cn("text-center py-12", isDarkMode ? "text-gray-400" : "text-gray-400")}>
                      <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="font-normal">لا توجد بيانات مبيعات لهذه الفترة</p>
                    </div>
                  ) : (
                    (salesData[selectedPeriod] || []).map((item: any, idx: number) => {
                      const maxAmount = Math.max(...(salesData[selectedPeriod] || []).map((i: any) => parseFloat(i.total) || 0), 1);
                      const percentage = (parseFloat(item.total) / maxAmount) * 100;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={cn("font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>{item.period}</span>
                            <span className="font-normal text-lg text-blue-600">{formatCurrency(item.total)}</span>
                          </div>
                          <div className={cn("w-full h-3 rounded-full overflow-hidden", isDarkMode ? "bg-gray-600" : "bg-gray-200")}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            ></motion.div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 font-normal">
                            <span>{item.order_count} طلب</span>
                            <span>{(percentage).toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'إجمالي المبيعات', value: formatCurrency(merchantStats.totalRevenue), icon: CreditCard, color: 'bg-blue-50' },
                  { label: 'عدد الطلبات', value: merchantStats.orderStats.total, icon: ShoppingCart, color: 'bg-emerald-50' },
                  { label: 'متوسط الطلب', value: formatCurrency(merchantStats.orderStats.total > 0 ? merchantStats.totalRevenue / merchantStats.orderStats.total : 0), icon: Package, color: 'bg-indigo-50' },
                ].map((stat) => (
                  <div key={stat.label} className={cn("p-4 rounded-xl border-2 border-black/5", stat.color)}>
                    <p className="text-[10px] font-normal text-gray-600 uppercase mb-2">{stat.label}</p>
                    <p className="text-lg font-normal text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    );
  };

  const renderCategories = () => {
    return (
    <Card className={cn("w-full border-none shadow-xl rounded-[2rem] overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
        <div>
          <h3 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>أقسام المنتجات</h3>
          <p className={cn("text-sm font-medium", isDarkMode ? "text-gray-300" : "text-gray-500")}>نظم منتجاتك في مجموعات ليسهل تصفحها</p>
        </div>
        <Button 
          onClick={handleAddCategory}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg py-4 px-6 rounded-2xl text-sm font-normal flex items-center gap-2"
        >
          <Plus size={18} /> إضافة قسم
        </Button>
      </div>
      <div className="divide-y divide-black/5">
        {filteredCategories.length === 0 ? (
          <div className={cn("p-16 text-center italic", isDarkMode ? "text-gray-300" : "text-gray-400")}>
            <Layout size={40} className="mx-auto mb-4 opacity-20" />
            {dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد أقسام حالياً.'}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className={cn("p-6 flex items-center justify-between group transition-all", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-black/5", isDarkMode ? "bg-indigo-900/40" : "bg-indigo-50")}>
                  {cat.image_url ? (
                    <img src={cat.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <Layout size={24} className={isDarkMode ? "text-indigo-400" : "text-indigo-300"} />
                  )}
                </div>
                <div>
                  <p className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{cat.name}</p>
                  <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>عدد المنتجات: {products.filter(p => (p as any).category_id === cat.id).length}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEditCategory(cat)}
                  className={cn("p-3 rounded-2xl transition-all", isDarkMode ? "text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50")}
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className={cn("p-3 rounded-2xl transition-all", isDarkMode ? "text-gray-400 hover:text-red-400 hover:bg-red-900/30" : "text-gray-400 hover:text-red-600 hover:bg-red-50")}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
    );
  };

  const renderAuctions = () => {
    return (
      <div className="space-y-6">
        {/* Bidders Modal */}
        {selectedAuctionForBidders && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}
            >
              <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50/50 border-black/5")}>
                <div>
                  <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    المشاركون في: {selectedAuctionForBidders.product_name}
                  </h3>
                  <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    جميع العطاءات المقدمة مع معلومات المشاركين
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAuctionForBidders(null);
                    setBidders([]);
                  }}
                  className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-black/5 text-gray-400")}
                >
                  <X size={24} />
                </button>
              </div>

              <div className={cn("p-8 overflow-x-auto", isDarkMode ? "bg-gray-800" : "bg-white")}>
                {bidders.length === 0 ? (
                  <div className={cn("p-20 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="font-normal text-lg">لا توجد عطاءات حالياً</p>
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700/50" : "bg-gray-50/50")}>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>المركز</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>اسم المشارك</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>رقم الهاتف</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>قيمة العطاء</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الوقت</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-gray-50")}>
                      {bidders.map((bidder) => (
                        <tr key={bidder.id} className={cn("transition-colors", isDarkMode ? "hover:bg-gray-700/30" : "hover:bg-indigo-50/30")}>
                          <td className="px-6 py-4">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-normal text-sm", 
                              bidder.position === 1 ? (isDarkMode ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-700") :
                              bidder.position === 2 ? (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700") :
                              (isDarkMode ? "bg-orange-900/50 text-orange-400" : "bg-orange-100 text-orange-700")
                            )}>
                              {bidder.position}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className={cn("font-normal", isDarkMode ? "text-gray-200" : "text-gray-900")}>
                              {bidder.customer_name || 'غير معروف'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <a 
                              href={`tel:${bidder.customer_phone}`}
                              className={cn("font-normal text-sm hover:underline", isDarkMode ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700")}
                            >
                              {bidder.customer_phone || '-'}
                            </a>
                          </td>
                          <td className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                            {formatCurrency(bidder.bid_price)}
                          </td>
                          <td className={cn("px-6 py-4 text-center text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            {new Date(bidder.bid_time).toLocaleString('ar-IQ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Auctions List */}
        <Card className={cn("rounded-[2rem] overflow-hidden border-none shadow-sm", isDarkMode ? "bg-gray-800" : "bg-white")}>
          <div className={cn("p-6 border-b border-gray-100 flex justify-between items-center", isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50/50")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-100">
                <Zap size={20} />
              </div>
              <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>المزادات النشطة</h2>
            </div>
          </div>

          {auctions.length === 0 ? (
            <div className={cn("p-20 text-center", isDarkMode ? "bg-gray-800 text-gray-500" : "bg-white text-gray-400")}>
              <Zap size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-normal text-lg">لا توجد مزادات نشطة حالياً</p>
              <p className="text-sm font-normal mt-1">ابدأ بإنشاء مزاد جديد لمنتجاتك!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className={cn(isDarkMode ? "bg-gray-800" : "bg-gray-50/30")}>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>المنتج</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>السعر الابتدائي</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>أعلى عطاء</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>عدد المشاركين</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>حالة المزاد</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-gray-50")}>
                  {auctions.map((auction) => (
                    <tr key={auction.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center", isDarkMode ? "bg-amber-900/30" : "bg-amber-50")}>
                            {auction.image_url ? (
                              <img src={auction.image_url} alt={auction.product_name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package size={20} className={isDarkMode ? "text-amber-400" : "text-amber-600"} />
                            )}
                          </div>
                          <span className={cn("text-sm font-normal truncate", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                            {auction.product_name}
                          </span>
                        </div>
                      </td>
                      <td className={cn("px-6 py-4 text-center text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        {formatCurrency(auction.starting_price)}
                      </td>
                      <td className={cn("px-6 py-4 text-center text-sm font-normal", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                        {auction.highest_bid ? formatCurrency(auction.highest_bid) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("px-3 py-1 rounded-full text-sm font-normal", isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                          {auction.total_bids || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-normal uppercase tracking-tighter",
                          auction.status === 'active' ? (isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700") :
                          auction.status === 'pending' ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700") :
                          (isDarkMode ? "bg-gray-700/30 text-gray-400" : "bg-gray-100 text-gray-600")
                        )}>
                          {auction.status === 'active' ? 'نشط' : auction.status === 'pending' ? 'قريباً' : 'منتهي'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 flex justify-center items-center">
                        <button 
                          onClick={async () => {
                            setSelectedAuctionForBidders(auction);
                            try {
                              const res = await fetch(`/api/auctions/${auction.id}/bidders`);
                              const data = await res.json();
                              setBidders(Array.isArray(data) ? data : []);
                            } catch (err) {
                              console.error('Failed to fetch bidders:', err);
                              setBidders([]);
                            }
                          }}
                          className={cn("px-4 py-2 rounded-lg font-normal text-xs transition-all", isDarkMode ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100")}
                        >
                          عرض المشاركين ({auction.total_bids || 0})
                        </button>
                        <button
                          onClick={async () => {
                            const isCompleted = auction.status === 'completed';
                            const message = isCompleted 
                              ? 'هل أنت متأكد من حذف هذا المزاد المكتمل؟' 
                              : 'هل أنت متأكد من حذف هذا المزاد؟';
                            
                            if (confirm(message)) {
                              try {
                                const res = await fetch(`/api/auctions/${auction.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' }
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  alert(data.error || 'خطأ في حذف المزاد');
                                } else {
                                  alert('تم حذف المزاد بنجاح');
                                  // Refresh auctions
                                  const response = await fetch('/api/auctions/active');
                                  const allAuctions = await response.json();
                                  setAuctions(Array.isArray(allAuctions) ? allAuctions : []);
                                }
                              } catch (err) {
                                console.error('Failed to delete auction:', err);
                                alert('خطأ في حذف المزاد');
                              }
                            }
                          }}
                          className={cn("px-3 py-2 rounded-lg font-normal text-xs transition-all flex items-center gap-1", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100")}
                          title="حذف المزاد"
                        >
                          <Trash2 size={16} /> حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderSettings = () => {
    return (
    <Card className={cn("max-w-md border-none shadow-xl rounded-2xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-6 border-b border-black/5 flex items-center justify-between", isDarkMode ? "bg-gray-900" : "bg-white")}>
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إعدادات المتجر</h3>
        <button
          onClick={() => navigate('/merchant')}
          className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700")}
          title="إغلاق"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-5">
        
        {/* اسم المتجر */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">اسم المتجر</label>
          <input 
            type="text" 
            value={merchantConfig.app_name} 
            onChange={(e) => setMerchantConfig({ ...merchantConfig, app_name: e.target.value })}
            placeholder="أدخل اسم المتجر"
            className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
          />
        </div>
        
        {/* شعار المتجر */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">شعار المتجر</label>
          <button
            type="button"
            onClick={() => logoUploadRef.current?.click()}
            className={cn("w-full h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:opacity-80", isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600" : "bg-gray-50 border-gray-300 hover:bg-gray-100")}
          >
            {merchantConfig.logo_url ? (
              <img src={merchantConfig.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
            ) : (
              <div className="text-center">
                <Upload size={24} className={isDarkMode ? "text-gray-400 mx-auto" : "text-gray-500 mx-auto"} />
                <p className={cn("text-xs font-normal mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>اضغط لاختيار صورة</p>
              </div>
            )}
          </button>
          <input 
            ref={logoUploadRef}
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleLogoUpload} 
          />
        </div>
        
        
        {/* زر الحفظ */}
        <button 
          onClick={handleSaveMerchantSettings} 
          className="w-full py-3 rounded-lg text-white font-normal text-base shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
        >
          💾 حفظ الإعدادات
        </button>
      </div>
    </Card>
    );
  };

  const renderOrders = () => {
    console.log('🔍 renderOrders - Orders:', orders);
    console.log('🔍 renderOrders - Filtered Orders:', filteredOrders);
    console.log('🔍 renderOrders - Dashboard Query:', dashboardQuery);
    console.log('🔍 renderOrders - User Store Type:', user?.store_type);
    console.log('🔍 renderOrders - Total Orders:', orders.length, 'Filtered:', filteredOrders.length);
    return (
    <Card className={cn("w-full border-none shadow-xl rounded-[2rem] overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5", isDarkMode ? "bg-gray-900" : "bg-white")}>
        <h3 className={cn("font-normal text-4xl", isDarkMode ? "text-white" : "text-gray-900")}>طلبات العملاء</h3>
        <p className={cn("text-base font-medium mt-2", isDarkMode ? "text-gray-300" : "text-gray-500")}>إدارة جميع الطلبات الواردة لمتجرك</p>
        {orders.length > 0 && <p className="text-xs text-gray-400 mt-2">📊 إجمالي الطلبات المحملة: {orders.length}</p>}
      </div>
      <div className="divide-y divide-black/5">
        {filteredOrders.length === 0 ? (
          <div className={cn("p-16 text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
            <p className={cn("font-normal text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>{dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد طلبات واردة حالياً'}</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="flex flex-col group transition-all border-b border-black/5 last:border-none">
              <div 
                className={cn("p-6 flex items-center justify-between cursor-pointer", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}
                onClick={async () => {
                  if (expandedOrder === order.id) {
                    setExpandedOrder(null);
                  } else {
                    setExpandedOrder(order.id);
                    const res = await fetch(`/api/orders/${order.id}/items`);
                    const data = await res.json();
                    setOrderItems(data);
                  }
                }}
              >
                <div className="flex gap-4 items-center">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <ShoppingCart size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={cn("font-normal text-2xl", isDarkMode ? "text-white" : "text-gray-900")}>طلب #{order.id}</p>
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-normal uppercase rounded-full tracking-wider shadow-sm",
                        order.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                        order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {order.status === 'pending' ? 'بانتظار التجهيز' : 
                         order.status === 'completed' ? 'تم التجهيز' : 'ملغي'}
                      </span>
                    </div>
                    <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-500")}>
                       {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left min-w-[100px]">
                    <p className={cn("text-xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{formatCurrency(order.total_amount || order.total)}</p>
                    <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>إجمالي المبلغ</p>
                  </div>
                  <div className={cn("transition-transform duration-300", isDarkMode ? "text-gray-400" : "text-gray-300", expandedOrder === order.id ? "rotate-180" : "")}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={cn("overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-50/50")}
                  >
                    <div className={cn("p-6 border-t border-black/5 space-y-4", isDarkMode ? "bg-gray-800" : "bg-white")}>
                      {orderItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover bg-white shadow-sm ring-1 ring-black/5" />
                            <div>
                               <p className={cn("font-normal text-base", isDarkMode ? "text-white" : "text-gray-800")}>{item.product_name}</p>
                               <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>{item.quantity} × {formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <p className={cn("text-base font-normal", isDarkMode ? "text-white" : "text-gray-700")}>{formatCurrency(item.quantity * item.price)}</p>
                        </div>
                      ))}
                      
                      <div className="pt-4 border-t border-black/5 flex gap-2">
                        {order.status === 'pending' && (
                          <Button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const res = await fetch(`/api/orders/${order.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'completed' })
                              });
                              if (res.ok) {
                                // Update orders list using correct endpoint for store type
                                const ordersEndpoint = user?.store_type === 'topup' 
                                  ? `/api/topup/orders?storeId=${user?.store_id}`
                                  : `/api/orders?storeId=${user?.store_id}`;
                                const updated = await fetch(ordersEndpoint).then(r => r.json());
                                setOrders(Array.isArray(updated) ? updated : []);
                                
                                // Update merchant stats
                                const statsRes = await fetch(`/api/merchant/stats?storeId=${user?.store_id}`);
                                const statsData = await statsRes.json();
                                if (statsData && !statsData.error) {
                                  setMerchantStats(statsData);
                                }
                                
                                alert("تم تجهيز الطلب بنجاح!");
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal py-2 rounded-xl flex-1 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                          >
                            تأكيد التجهيز
                          </Button>
                        )}
                        <Button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/orders/${order.id}/invoice`);
                              const invoiceHtml = await res.text();
                              setInvoiceModal({
                                id: order.id,
                                html: invoiceHtml
                              });
                            } catch (err) {
                              console.error('خطأ في تحميل الفاتورة:', err);
                              alert('حدث خطأ في تحميل الفاتورة. يرجى المحاولة لاحقاً.');
                            }
                          }}
                          className={cn("border-2 text-xs font-normal py-2 rounded-xl flex-1 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : "bg-white border-black/5 hover:bg-gray-100 text-gray-600")}
                        >
                          تحميل الفاتورة
                        </Button>
                        <Button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن استرجاع البيانات بعد ذلك')) {
                              const res = await fetch(`/api/orders/${order.id}/return`, {
                                method: 'PATCH'
                              });
                              if (res.ok) {
                                // Update orders list using correct endpoint for store type
                                const ordersEndpoint = user?.store_type === 'topup' 
                                  ? `/api/topup/orders?storeId=${user?.store_id}`
                                  : `/api/orders?storeId=${user?.store_id}`;
                                const updated = await fetch(ordersEndpoint).then(r => r.json());
                                setOrders(Array.isArray(updated) ? updated : []);
                                
                                // Update merchant stats
                                const statsRes = await fetch(`/api/merchant/stats?storeId=${user?.store_id}`);
                                const statsData = await statsRes.json();
                                if (statsData && !statsData.error) {
                                  setMerchantStats(statsData);
                                }
                                
                                setExpandedOrder(null);
                                alert("تم حذف الطلب بنجاح!");
                              }
                            }
                          }}
                          className="bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 text-orange-600 text-xs font-normal py-2 rounded-xl flex-1 transition-all"
                        >
                          مرتجع
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </Card>
    );
  };

  return (
    <DashboardLayout 
      title={
        section === 'settings' ? "إعدادات المتجر" : 
        section === 'products' ? "المنتجات" : 
        section === 'categories' ? "أقسام المتجر" :
        section === 'auctions' ? "المزادات" :
        section === 'orders' ? "الطلبات" : 
        section === 'customers' ? "العملاء" :
        "لوحة التحكم"
      } 
      role="merchant"
      counts={sidebarCounts}
    >
      <div dir="rtl" className="font-sans">
        {console.log('🎯 Rendering - section:', section, 'Conditions:', { isSettings: section === 'settings', isCategories: section === 'categories', isOrders: section === 'orders', isProducts: section === 'products', isCustomers: section === 'customers', isCoupons: section === 'coupons', isAuctions: section === 'auctions' })}
        {section === 'settings' ? renderSettings() : 
         section === 'categories' ? renderCategories() :
         section === 'auctions' ? renderAuctions() :
         section === 'orders' ? renderOrders() :
         section === 'products' ? renderProducts() :
         section === 'customers' ? renderCustomers() :
         section === 'coupons' ? renderCoupons() :
         renderOverview()}
        
        {renderSalesModal()}
        {renderProductModal()}
        {renderCategoryModal()}
        {renderCouponModal()}
        {renderCustomerModal()}

        {/* Invoice Modal */}
        {invoiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
            >
              <div className={cn("p-6 border-b sticky top-0 flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>الفاتورة #{invoiceModal.id}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const printWindow = window.open('', '', 'height=600,width=800');
                      if (printWindow) {
                        printWindow.document.write(invoiceModal.html);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-normal text-sm hover:bg-indigo-700 transition-all"
                  >
                    🖨️ طباعة
                  </button>
                  <button 
                    onClick={() => setInvoiceModal(null)}
                    className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-300" : "hover:bg-gray-200 text-gray-600")}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div 
                  dangerouslySetInnerHTML={{ __html: invoiceModal.html }}
                  className={cn("prose prose-sm max-w-none", isDarkMode ? "prose-invert" : "")}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const CustomerStorefront = () => {
  const { slug } = useParams();
  const storeId = slug; // Use slug as storeId
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [storeType, setStoreType] = useState<'regular' | 'topup'>('regular');
  const [isCustomerVerified, setIsCustomerVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  
  const { isDarkMode } = useTheme();
  const { items, addItem } = useRegularCartStore();
  const { user } = useAuthStore();
  const { appName, logoUrl, primaryColor, setSettings } = useSettingsStore();
  
  // Use admin settings by default, merchant settings only when viewing a specific store
  const [displayAppName, setDisplayAppName] = useState(appName);
  const [displayLogoUrl, setDisplayLogoUrl] = useState(logoUrl);

  const navigate = useNavigate();
  const { productsRefreshTime } = useRefreshStore();

  // Get unique categories from products
  const availableCategories = ['الكل', ...Array.from(new Set(products.map((p: any) => (p as any).category_name).filter(Boolean)))];

  const filteredProducts = products.filter((p: any) => {
    // Remove search filter requirement for initial display
    const matchesSearch = !searchQuery || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'الكل' || (p.category_name === selectedCategory);
    const matchesNew = !showNewOnly || (p.created_at && new Date(p.created_at) > new Date(Date.now() - 7*24*60*60*1000));
    return matchesSearch && matchesCategory && matchesNew;
  });

  useEffect(() => {
    // Always load admin settings first for the main page
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.app_name) {
          setDisplayAppName(data.app_name);
          setDisplayLogoUrl(data.logo_url || '');
          console.log("📋 Loaded ADMIN settings for main page display");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const loadStoreAndProducts = async () => {
      try {
        const storeRes = await fetch(`/api/stores/slug/${storeId}`).then(r => r.json());
        
        if (storeRes && storeRes.error) {
          console.error('Store not found:', storeRes.error);
          setProducts([]);
          return;
        }
        
        // If this is a regular (non-topup) store, clear topup customer data
        if (storeRes.store_type !== 'topup') {
          console.log('🧹 Clearing topupCustomer as entering regular store');
          localStorage.removeItem('topupCustomer');
        }
        
        let productsRes = [];
        const actualStoreId = storeRes.id;
        
        // Use the correct endpoint based on store type
        if (storeRes && storeRes.store_type === 'topup') {
          // Topup store: Use /api/topup/products endpoint (includes retail_price & wholesale_price)
          const topupProducts = await fetch(`/api/topup/products/${actualStoreId}`).then(r => r.json());
          // Map topup products to include store_name from company_name
          productsRes = Array.isArray(topupProducts) ? topupProducts.map((p: any) => ({
            ...p,
            store_name: p.company_name,
            store_type: 'topup'
          })) : [];
        } else {
          // Regular store: Use /api/products endpoint
          productsRes = await fetch(`/api/products?storeId=${actualStoreId}`).then(r => r.json());
          // Ensure regular products have store_type
          productsRes = Array.isArray(productsRes) ? productsRes.map((p: any) => ({
            ...p,
            store_type: 'regular'
          })) : [];
        }

        if (storeRes && !storeRes.error) {
          setStoreName(storeRes.store_name || '');
          setDisplayAppName(storeRes.store_name || '');
          setDisplayLogoUrl(storeRes.store_logo || storeRes.logo_url || '');
          const isTopup = storeRes.store_type === 'topup';
          setStoreType(isTopup ? 'topup' : 'regular');
          
          // اذا كان المتجر topup، اعد التوجيه إلى TopupStorefront
          if (isTopup) {
            console.log('🔄 Store is topup, redirecting to /topup/:slug');
            navigate(`/topup/${slug}`, { replace: true });
            return;
          }
        }

        const rows = Array.isArray(productsRes) ? productsRes : [];
        setProducts(rows);
        
        // Reset selectedProduct when products are loaded to avoid stale state
        setSelectedProduct(null);
      } catch (err) {
        console.error('Error loading store/products:', err);
        setProducts([]);
      }
    };

    loadStoreAndProducts();
  }, [storeId, productsRefreshTime]);

  // التحقق من أن العميل مسجل في متجر الشحن
  useEffect(() => {
    if (!storeId) return;
    
    setVerificationLoading(true);
    setVerificationError('');
    setIsCustomerVerified(false);

    // إذا لم نحمل نوع المتجر بعد، لا نتحقق
    if (!storeType) {
      setVerificationLoading(true);
      return;
    }

    // إذا كان متجراً عادياً، لا نحتاج للتحقق
    if (storeType === 'regular') {
      setIsCustomerVerified(true);
      setVerificationLoading(false);
      return;
    }

    // متجر شحن - يجب التحقق من تسجيل العميل
    if (storeType === 'topup') {
      if (!user) {
        setVerificationError('يجب تسجيل الدخول لعرض متجر الشحن');
        setVerificationLoading(false);
        return;
      }

      // التحقق من أن المستخدم مسجل كعميل في المتجر
      fetch(`/api/customers?storeId=${storeId}&customerId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            console.log('✅ Customer verified from API:', {
              id: data.id,
              name: data.name,
              phone: data.phone,
              customer_type: data.customer_type
            });
            
            // حفظ بيانات العميل في state
            setCustomer({
              customer_id: data.id,
              name: data.name,
              phone: data.phone,
              customer_type: data.customer_type,
              credit_limit: data.credit_limit,
              current_debt: data.current_debt
            });
            
            setIsCustomerVerified(true);
            setVerificationError('');
          } else {
            setIsCustomerVerified(false);
            setVerificationError('أنت غير مسجل كعميل في هذا المتجر. يرجى التواصل مع مدير المتجر.');
          }
        })
        .catch(err => {
          console.error('خطأ في التحقق من العميل:', err);
          setVerificationError('حدث خطأ في التحقق. يرجى المحاولة لاحقاً.');
        })
        .finally(() => setVerificationLoading(false));
    }
  }, [storeId, storeType, user]);

  useEffect(() => {
    if (selectedProduct) {
      setMainImage(selectedProduct.image_url);
    }
  }, [selectedProduct]);

  const handleAddToCart = (product: Product) => {
    console.log('🛒 Adding to cart:', { id: product.id, name: product.name, store_name: (product as any).store_name });
    const qty = quantities[product.id] || 1;
    addItem(product);
    // Update quantity to match the selected amount
    for (let i = 1; i < qty; i++) {
      addItem(product);
    }
    playAddToCartSound();
    // Reset quantity for this product
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc: Record<string, Product[]>, product: Product) => {
    const category = (product as any).category_name || 'منتجات أخرى';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {});

  // Sort categories alphabetically
  const sortedCategories = Object.keys(productsByCategory).sort();

  const renderProductDetails = () => {
    if (!selectedProduct) return null;
    
    if (storeType === 'topup') {
      // Topup product modal - show codes
      const codes = Array.isArray(selectedProduct.topup_codes) ? selectedProduct.topup_codes : [];
      
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col relative", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <button onClick={() => setSelectedProduct(null)} className={cn("absolute top-4 right-4 z-20 p-3 backdrop-blur-xl border rounded-full transition-all", isDarkMode ? "bg-gray-700/40 border-gray-600/50 text-gray-300 hover:bg-gray-700" : "bg-white/20 border-white/30 text-gray-400 hover:bg-gray-100")}>
              <X size={24} />
            </button>

            <div className="p-4 sm:p-8 flex flex-col overflow-y-auto flex-1">
              <div className="mb-6">
                <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-normal uppercase tracking-widest border inline-block", isDarkMode ? "bg-indigo-900/30 text-indigo-400 border-indigo-700" : "bg-indigo-50 text-indigo-600 border-indigo-100")}>💳 بطاقة شحن</span>
                <h2 className={cn("text-2xl sm:text-4xl font-bold mt-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>{selectedProduct.name}</h2>
                <p className={cn("text-sm sm:text-lg mt-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>{selectedProduct.description}</p>
              </div>

              <div className={cn("p-6 rounded-2xl mb-6 border-2", isDarkMode ? "bg-green-900/30 border-green-700" : "bg-green-50 border-green-200")}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={cn("text-sm font-normal block mb-2", isDarkMode ? "text-green-400" : "text-green-600")}>عدد الأكواد المتاحة</span>
                    <span className="text-3xl sm:text-4xl font-bold text-green-500">{codes.length}</span>
                  </div>
                  <div className="text-4xl sm:text-5xl">🔑</div>
                </div>
              </div>



              <div className="flex justify-between items-end pb-6 border-b border-black/10 mb-6">
                <div>
                  <p className={cn("text-xs font-normal mb-2 uppercase", isDarkMode ? "text-gray-500" : "text-gray-500")}>السعر لكل كود</p>
                  <p className={cn("text-3xl sm:text-5xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{formatCurrency(selectedProduct.price)}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  addItem(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="w-full py-4 rounded-2xl text-white font-bold text-base sm:text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingCart size={24} />
                شراء أكواد
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
    
    // Regular product modal - existing code
    const gallery = [selectedProduct.image_url, ...(selectedProduct.gallery || [])].filter(Boolean);
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative", isDarkMode ? "bg-gray-800" : "bg-white")}
        >
          <button onClick={() => setSelectedProduct(null)} className={cn("absolute top-4 right-4 z-20 p-3 backdrop-blur-xl border rounded-full transition-all", isDarkMode ? "bg-gray-700/40 border-gray-600/50 text-gray-300 hover:bg-gray-700" : "bg-white/20 border-white/30 text-gray-400 hover:bg-gray-100")}>
            <X size={24} />
          </button>

          <div className={cn("md:w-1/2 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto min-h-0", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
            <motion.div 
              key={mainImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img src={mainImage} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
            </motion.div>
            
            <div className={cn("grid grid-cols-4 gap-3 p-3 rounded-2xl border shadow-sm", isDarkMode ? "bg-gray-600 border-gray-500" : "bg-white border-black/5")}>
              {gallery.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${mainImage === img ? 'ring-4 ring-indigo-500 ring-offset-2' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto">
            <div className="mb-8">
              <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-normal uppercase tracking-widest border", isDarkMode ? "bg-indigo-900/30 text-indigo-400 border-indigo-700" : "bg-indigo-50 text-indigo-600 border-indigo-100")}>{appName}</span>
              <h2 className={cn("text-4xl font-normal mt-4 tracking-tight leading-tight", isDarkMode ? "text-gray-100" : "text-gray-900")}>{selectedProduct.name}</h2>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <h4 className={cn("text-xs font-normal uppercase tracking-widest border-b pb-2", isDarkMode ? "text-gray-500 border-gray-600" : "text-gray-400 border-black/5")}>وصف المنتج</h4>
                <p className={cn("text-lg leading-relaxed font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-2xl border", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                  <span className={cn("text-sm font-normal block mb-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>المخزون</span>
                  <span className={cn("font-bold text-xl", selectedProduct.stock === 0 ? "text-red-600" : selectedProduct.stock <= 2 ? "text-amber-600" : "text-green-600")}>{selectedProduct.stock} قطعة متوفرة</span>
                </div>
                <div className={cn("p-4 rounded-2xl border", isDarkMode ? "bg-green-900/50 border-green-700" : "bg-green-50/50 border-green-100")}>
                  <span className={cn("text-[10px] font-normal block mb-1", isDarkMode ? "text-green-400" : "text-green-400")}>الضمان</span>
                  <span className={cn("font-normal", isDarkMode ? "text-green-300" : "text-green-700")}>منتج أصلي 100%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 space-y-4">
              <div className="flex justify-between items-end pb-8 border-b border-black/5">
                <div>
                  <p className="text-[10px] text-gray-400 font-normal uppercase mb-1">السعر النهائي</p>
                  <p className={cn("text-5xl font-normal tabular-nums", isDarkMode ? "text-white" : "text-gray-900")}>
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>

              </div>

              <button 
                onClick={() => {
                  addItem(selectedProduct);
                  playAddToCartSound();
                  setSelectedProduct(null);
                }}
                className="w-full py-6 rounded-3xl text-white font-normal text-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                  <ShoppingCart size={28} />
                </div>
                إضافة لسلّة المشتريات
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={cn("min-h-screen pb-28 md:pb-0 flex flex-col", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
      {/* التحقق من العميل لمتاجر الشحن */}
      {storeType === 'topup' && (
        <>
          {verificationLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center">
              <div className={cn("rounded-2xl p-8 text-center", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <p className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>جاري التحقق من بيانات العميل...</p>
              </div>
            </div>
          )}
          
          {!verificationLoading && !isCustomerVerified && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className={cn("rounded-2xl p-8 max-w-md", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className="text-center">
                  <div className="text-6xl mb-4">🔐</div>
                  <h2 className={cn("text-2xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>الوصول مقيد</h2>
                  <p className={cn("text-lg mb-6", isDarkMode ? "text-gray-300" : "text-gray-700")}>{verificationError}</p>
                  <button
                    onClick={() => navigate('/stores')}
                    className="w-full py-3 rounded-lg text-white font-normal bg-indigo-600 hover:bg-indigo-700 transition-all"
                  >
                    العودة للمتاجر
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* إظهار المحتوى فقط إذا تم التحقق */}
      {(storeType !== 'topup' || isCustomerVerified) && (
        <>
          {renderProductDetails()}

          {/* Shopping Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={cn('rounded-2xl shadow-lg p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">سلة المشتريات</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setShowCartModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">السلة فارغة</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className={cn("p-4 rounded-lg border flex justify-between items-center", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}>
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}
                <Link to="/cart" className="block mt-6 w-full">
                  <button className="w-full py-3 rounded-lg text-white font-bold transition-all" style={{ backgroundColor: primaryColor }}>
                    عرض السلة المفصلة
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header - Blue Navigation Bar */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Right: Admin Logo or Back Button */}
          {storeId ? (
            <button 
              onClick={() => navigate('/stores')} 
              className="relative flex items-center justify-center p-2 hover:bg-indigo-700 rounded-lg transition-all"
              title="العودة للشاشة الرئيسية"
            >
              <ArrowRight size={24} />
            </button>
          ) : (
            <button 
              onClick={() => setShowCartModal(true)} 
              className="relative flex items-center justify-center p-2 hover:bg-indigo-700 rounded-lg transition-all"
              title="عرض السلة"
            >
              {displayLogoUrl ? (
                <img src={displayLogoUrl} alt={displayAppName} className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
              ) : (
                <Home size={24} />
              )}
            </button>
          )}

          {/* Center: Platform Name or Store Name */}
          <div className="flex-1 text-center min-w-0">
            <h1 className="text-base sm:text-2xl font-normal truncate">{storeId ? displayAppName : 'منصة مير للتجارة الالكترونية'}</h1>
            <p className="text-[10px] sm:text-xs text-indigo-200 truncate">{storeId ? 'متجر متخصص' : 'جميع متاجر السوق في مكان واحد'}</p>
          </div>

          {/* Left: Cart and Auth */}
          <div className="flex gap-2 items-center">
            <Link to="/cart" className="relative flex items-center justify-center p-2 hover:bg-indigo-700 rounded-lg transition-all" title="عرض السلة">
              <ShoppingCart size={20} />
              <AnimatePresence>
                {items && items.length > 0 && (
                  <motion.span 
                    key="cart-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white"
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        <div className="space-y-12 sm:space-y-20 pb-10">
          {sortedCategories.map((category) => (
            <section key={category} className="w-full">
              {/* Category Header - Completely Separate */}
              <div className="mb-8 sm:mb-12 pb-6 sm:pb-8">
                <h2 className={cn("text-2xl sm:text-3xl font-bold mb-3", isDarkMode ? "text-white" : "text-indigo-600")}>{category}</h2>
                <p className={cn("text-sm sm:text-base font-semibold mb-6", isDarkMode ? "text-white" : "text-gray-700")}>
                  عدد المنتجات: <span className={cn("text-xl sm:text-2xl", isDarkMode ? "text-white" : "text-gray-900")}>{productsByCategory[category].length}</span>
                </p>
                <div className="h-2 w-32 rounded-full" style={{ backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5' }} />
                <div className="h-1 w-full mt-6 rounded-full" style={{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }} />
              </div>

              {/* Products Grid - 8 columns */}
              <div className="w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {productsByCategory[category].map((product) => (
                  <motion.div 
                    key={product.id}
                    whileHover={{ y: -4 }}
                  >
                    <Card 
                      onClick={() => setSelectedProduct(product)}
                      className={cn(
                      "h-full flex flex-col border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer",
                      isDarkMode ? "bg-gray-800 border-green-700 hover:border-green-600" : "bg-white border-green-500 hover:border-green-600"
                    )}>
                      {/* Product Image */}
                      <div className={cn("aspect-square w-full overflow-hidden cursor-pointer", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                        {product.image_url ? (
                          <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={product.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={28} className={cn(isDarkMode ? "text-gray-500" : "text-gray-300")} />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2 flex-1 flex flex-col justify-between gap-1.5">
                        <div>
                          <p className={cn("text-[8px] font-normal mb-0.5", isDarkMode ? "text-gray-400" : "text-gray-500")}>{displayAppName || ""}</p>
                          <h3 className={cn("font-normal text-xs line-clamp-2", isDarkMode ? "text-white" : "text-gray-900")}>
                            {(product.store_name && product.store_name !== 'undefined') ? `${product.store_name} - ${product.name}` : product.name}
                          </h3>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                          <span className={cn("text-[8px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>السعر</span>
                          {/* Display smart price based on customer type */}
                          <div className="text-right">
                            <span className={cn("text-xs font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                              {formatCurrency(
                                (user?.customer_type === 'reseller' && product.bulk_price)
                                  ? product.bulk_price
                                  : product.price
                              )}
                            </span>
                            {/* Show original price if reseller sees bulk price */}
                            {user?.customer_type === 'reseller' && product.bulk_price && product.bulk_price !== product.price && (
                              <p className={cn("text-[7px] line-through", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                                {formatCurrency(product.price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                </div>
              </div>
            </section>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Search size={64} className={cn("mx-auto mb-4", isDarkMode ? "text-gray-600" : "text-gray-200")} />
            <h3 className={cn("text-xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>لا توجد منتجات تطابق بحثك</h3>
            <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-500")}>حاول استخدام كلمات بحث أخرى أو استكشاف الأقسام</p>
          </div>
        )}
      </main>
      <StorePageMobileFooter storeSlug={storeId} />
        </>
      )}
    </div>
  );
};

const CartPage = () => <CartPageContent cartMode="regular" />;

const TopupCartPage = () => <CartPageContent cartMode="topup" />;

const MarketplacePage = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { appName, primaryColor } = useSettingsStore();
  const { items, addItem, updateQuantity } = useRegularCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [auctionBidForm, setAuctionBidForm] = useState({ bid_price: '', customer_name: '', customer_phone: '' });
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidMessage, setBidMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      let regularProducts: any[] = []; // Define outside try block
      try {
        setLoading(true);
        
        // Fetch only regular products (not topup products)
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        regularProducts = Array.isArray(productsData) ? productsData : [];
        
        setProducts(regularProducts);
        
        // Fetch active auctions
        try {
          const auctionsRes = await fetch('/api/auctions/active');
          const auctionsData = await auctionsRes.json();
          setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
        } catch (auctionErr) {
          console.warn('Failed to fetch auctions:', auctionErr);
          setAuctions([]);
        }
        
        // Initialize quantities to 1 for all products
        if (Array.isArray(regularProducts)) {
          const initialQtys: Record<number, number> = {};
          regularProducts.forEach((p: any) => {
            initialQtys[p.id] = 1;
          });
          setQuantities(initialQtys);
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddToCart = (product: any) => {
    const qty = quantities[product.id] || 1;
    addItem(product);
    // Update quantity to match the selected amount
    for (let i = 1; i < qty; i++) {
      addItem(product);
    }
    playAddToCartSound();
    // Reset quantity for this product
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  // Calculate time remaining in auction
  const getTimeRemaining = (auctionEndTime: string, auctionDate: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [hours, minutes] = auctionEndTime.split(':');
      
      let endDateTime = new Date(auctionDate);
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const now = new Date();
      const diff = endDateTime.getTime() - now.getTime();
      
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isEnded: false
      };
    } catch (e) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
    }
  };

  // Check if auction should be hidden from marketplace (ended more than 1 hour ago)
  const shouldHideAuction = (auctionEndTime: string, auctionDate: string): boolean => {
    try {
      const [hours, minutes] = auctionEndTime.split(':');
      
      let endDateTime = new Date(auctionDate);
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const now = new Date();
      const timeDiff = now.getTime() - endDateTime.getTime();
      
      // Hide if ended and more than 1 hour (3600000 milliseconds) has passed
      const oneHourMs = 60 * 60 * 1000;
      return timeDiff > oneHourMs;
    } catch (e) {
      return false;
    }
  };

  // Submit auction bid
  const submitAuctionBid = async () => {
    // Check if auction has ended
    const auctionStatus = getTimeRemaining(selectedAuction.auction_end_time, selectedAuction.auction_date);
    if (auctionStatus.isEnded) {
      setBidMessage({ type: 'error', text: '❌ انتهى وقت المزاد، لا يمكن إضافة عروض' });
      return;
    }

    if (!selectedAuction || !auctionBidForm.bid_price || !auctionBidForm.customer_name || !auctionBidForm.customer_phone) {
      setBidMessage({ type: 'error', text: 'يرجى ملء جميع الحقول (الاسم، الهاتف، والعرض)' });
      return;
    }

    // Validate phone number (basic validation)
    if (!/^\d{7,}$/.test(auctionBidForm.customer_phone.replace(/\D/g, ''))) {
      setBidMessage({ type: 'error', text: 'يرجى إدخال رقم هاتف صحيح' });
      return;
    }

    const bidPrice = parseFloat(auctionBidForm.bid_price);
    const minBidPrice = Math.max(
      selectedAuction.current_highest_price || selectedAuction.starting_price,
      selectedAuction.starting_price
    );

    if (bidPrice <= minBidPrice) {
      setBidMessage({ 
        type: 'error', 
        text: `العرض يجب أن يكون أكثر من ${formatCurrency(minBidPrice)}` 
      });
      return;
    }

    try {
      setBidSubmitting(true);
      const res = await fetch(`/api/auctions/${selectedAuction.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: null, // No user login required
          bid_price: bidPrice,
          customer_name: auctionBidForm.customer_name.trim(),
          customer_phone: auctionBidForm.customer_phone.trim()
        })
      });

      if (res.ok) {
        const bidData = await res.json();
        setBidMessage({ type: 'success', text: '✅ تم قبول عرضك! أنت الآن الفائز الأول.' });
        
        // Update auction data
        setSelectedAuction({
          ...selectedAuction,
          current_highest_price: bidPrice,
          total_bids: (selectedAuction.total_bids || 0) + 1
        });
        
        // Clear form
        setAuctionBidForm({ bid_price: '', customer_name: '', customer_phone: '' });
        
        // Hide message after 3 seconds
        setTimeout(() => setBidMessage(null), 3000);
      } else {
        const errData = await res.json();
        setBidMessage({ type: 'error', text: errData.error || 'فشل تقديم العرض' });
      }
    } catch (err) {
      console.error('Error submitting bid:', err);
      setBidMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setBidSubmitting(false);
    }
  };

  // Filtered products based on search query
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = !searchQuery || 
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.store_name && p.store_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // State for login modal
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className={cn('min-h-screen', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900')} dir="rtl">
      {/* Header */}
      <header className={cn('border-b sticky top-0 z-40', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* شعار الآدمن (صورة) أقصى اليمين */}
            <div className="flex-shrink-0 flex items-center justify-start w-auto md:w-36 h-auto md:h-28">
              <button
                className="relative focus:outline-none"
                onClick={() => setShowCartModal(true)}
                title="عرض المشتريات"
              >
                {/* شعار الآدمن */}
                {useSettingsStore.getState().logoUrl ? (
                  <img
                    src={useSettingsStore.getState().logoUrl}
                    alt="شعار الآدمن"
                    className="h-14 w-14 md:h-24 md:w-24 object-contain rounded-full border-2 border-indigo-200 bg-white shadow"
                    style={{ maxHeight: 112, maxWidth: 112 }}
                  />
                ) : (
                  <UserIcon size={40} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700'} />
                )}
                {/* رقم السلة */}
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-600 text-white text-xs md:text-lg font-bold min-w-6 h-6 md:w-9 md:h-9 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                    {items.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center flex-1 text-center min-w-0 px-1">
              <h1 className={cn('text-lg sm:text-2xl md:text-4xl font-normal leading-tight truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {appName || 'منصة مير للتجارة الالكترونية'}
              </h1>
            </div>

            <div className="hidden md:flex gap-2 items-center mt-2 justify-end w-fit">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300')}
                title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link to="/stores">
                <button className={cn("px-4 py-2 rounded-lg font-normal text-lg transition-all flex items-center gap-2", isDarkMode ? "bg-gray-700 text-white hover:bg-gray-800 border border-gray-600" : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-100")}>
                  <StoreIcon size={20} />
                  المتاجر
                </button>
              </Link>
              <Link to="/register-merchant">
                <button className="px-4 py-2 rounded-lg font-normal text-white bg-indigo-600 hover:bg-indigo-700 transition-all">انضم كتاجر</button>
              </Link>
              <button className="px-4 py-2 rounded-lg font-normal text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 transition-all" onClick={() => setShowLoginModal(true)}>
                تسجيل الدخول
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300')}
                title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setShowMobileMenu(prev => !prev)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                title="القائمة"
              >
                {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className={cn('md:hidden mt-3 grid grid-cols-2 gap-2', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>
              <Link to="/stores" onClick={() => setShowMobileMenu(false)}>
                <button className={cn("w-full px-3 py-2.5 rounded-xl font-normal text-sm transition-all flex items-center justify-center gap-2", isDarkMode ? "bg-gray-700 text-white hover:bg-gray-600 border border-gray-600" : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-100")}>
                  <StoreIcon size={16} />
                  المتاجر
                </button>
              </Link>
              <Link to="/register-merchant" onClick={() => setShowMobileMenu(false)}>
                <button className="w-full px-3 py-2.5 rounded-xl font-normal text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all">انضم كتاجر</button>
              </Link>
              <button
                className="col-span-2 w-full px-3 py-2.5 rounded-xl font-normal text-sm text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 transition-all"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLoginModal(true);
                }}
              >
                تسجيل الدخول
              </button>
            </div>
          )}

          {/* Cart Modal (عند الضغط على شعار الآدمن) */}
          {showCartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={cn('bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')}>
                <button
                  className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  onClick={() => setShowCartModal(false)}
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-normal mb-6 text-center">سلة المشتريات</h2>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <p className="text-center text-gray-500">لا توجد منتجات في السلة.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {items.map((item, idx) => (
                          <li key={item.id + '-' + idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              {item.image_url && (
                                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover border" />
                              )}
                              <div>
                                <div className="font-medium text-base">{(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name}</div>
                                <div className="text-xs text-gray-500">الكمية: {item.quantity || 1}</div>
                              </div>
                            </div>
                            <div className="font-bold text-indigo-600">{formatCurrency(item.price)}</div>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="w-full mt-6 py-3 rounded-xl text-white font-normal text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          // التحقق إذا كانت جميع المنتجات من الشحن فقط
                          const allTopup = items.every((item: any) => item.store_type === 'topup');
                          
                          if (allTopup && items.length > 0) {
                            // جميع المنتجات من الشحن - الذهاب مباشرة إلى تأكيد الشراء
                            setShowCartModal(false);
                            handleCheckout();
                          } else {
                            // منتجات عادية أو مختلطة - الذهاب إلى صفحة السلة
                            setShowCartModal(false);
                            navigate('/cart');
                          }
                        }}
                      >
                        <Send size={20} />
                        إرسال الطلب إلى المتجر
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={cn('bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm relative', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')}>
            <button
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              onClick={() => setShowLoginModal(false)}
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-normal mb-6 text-center">تسجيل الدخول</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const phone = (e.target as any).phone.value;
              const password = (e.target as any).password.value;
              
              try {
                const res = await fetch('/api/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phone, password }),
                });
                if (res.ok) {
                  const user = await res.json();
                  useAuthStore.getState().setUser(user);
                  setShowLoginModal(false);
                  if (user.role === 'admin') navigate('/admin');
                  else if (user.role === 'merchant') {
                    if (user.store_type === 'topup') {
                      navigate('/topup-merchant');
                    } else {
                      navigate('/merchant');
                    }
                  } else {
                    navigate('/');
                  }
                } else {
                  alert('رقم الهاتف أو كلمة المرور غير صحيحة');
                }
              } catch (err) {
                alert('حدث خطأ ما');
              }
            }} className="space-y-4">
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>رقم الهاتف</label>
                <input 
                  type="text" 
                  name="phone"
                  className={cn("w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/10 text-gray-900")}  
                  placeholder="077XXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>كلمة المرور</label>
                <input 
                  type="password" 
                  name="password"
                  className={cn("w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/10 text-gray-900")}  
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-normal hover:bg-indigo-700 transition-all">
                تسجيل الدخول
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                لا تملك حساب؟{' '}
                <Link to="/register-merchant" className="text-indigo-600 hover:text-indigo-700 font-normal">
                  سجل كتاجر
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <div className={cn('border-b z-30 md:sticky md:top-0', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="w-full md:max-w-sm">
            <div className={cn('flex items-center gap-2 px-4 py-3 rounded-lg border', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300')}>
              <Search size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn('flex-1 bg-transparent outline-none text-sm', isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500')}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {/* Auctions Section */}
        {auctions.length > 0 && auctions.filter(a => !shouldHideAuction(a.auction_end_time, a.auction_date)).length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} className="text-amber-500" />
              <h2 className={cn('text-xl sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                🔥 المنتجات قيد المزاد
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {auctions.filter(a => !shouldHideAuction(a.auction_end_time, a.auction_date)).map((auction) => {
                const timer = getTimeRemaining(auction.auction_end_time, auction.auction_date);
                const isEnded = timer.isEnded;
                
                return (
                  <motion.div key={auction.id} whileHover={{ y: -4 }} onClick={() => setSelectedAuction(auction)} className="cursor-pointer">
                    <Card className={cn('h-full overflow-hidden border-2 border-amber-300 shadow-md transition-all duration-300 hover:shadow-lg', isDarkMode ? 'bg-gray-800 border-amber-600' : 'bg-white border-amber-300')}>
                      {/* Image */}
                      <div className={cn('aspect-square w-full overflow-hidden relative', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                        {auction.image_url ? (
                          <img src={auction.image_url} className="w-full h-full object-cover" alt={auction.product_name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={40} className={cn(isDarkMode ? 'text-gray-500' : 'text-gray-300')} />
                          </div>
                        )}
                        
                        {/* Auction Badge */}
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Zap size={12} />
                          مزاد
                        </div>
                        
                        {/* Timer Badge */}
                        <div className={cn('absolute bottom-2 left-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1', isEnded ? 'bg-red-500 text-white' : 'bg-green-500 text-white')}>
                          <Clock size={12} />
                          {isEnded ? 'انتهى' : `${timer.hours}:${timer.minutes.toString().padStart(2, '0')}`}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2 flex flex-col gap-2">
                        <div>
                          <p className={cn('text-[10px] font-normal mb-0.5 line-clamp-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                            {auction.store_name}
                          </p>
                          <h3 className={cn('font-bold text-xs line-clamp-1', isDarkMode ? 'text-white' : 'text-gray-900')}>
                            {auction.product_name}
                          </h3>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-0.5 border-t border-black/10 pt-2">
                          <div className="flex justify-between items-center gap-1">
                            <span className={cn('text-[9px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                              السعر:
                            </span>
                            <span className={cn('text-xs font-bold', isDarkMode ? 'text-amber-400' : 'text-amber-600')}>
                              {formatCurrency(auction.starting_price)}
                            </span>
                          </div>
                          
                          {auction.current_highest_price && (
                            <div className="flex justify-between items-center gap-1">
                              <span className={cn('text-[9px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                أعلى:
                              </span>
                              <span className={cn('text-xs font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                {formatCurrency(auction.current_highest_price)}
                              </span>
                            </div>
                          )}
                          
                          {auction.total_bids && (
                            <div className="flex justify-between items-center gap-1">
                              <span className={cn('text-[9px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                عروض:
                              </span>
                              <span className={cn('text-xs font-bold', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                                {auction.total_bids}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Button */}
                        <button className={cn('w-full py-1.5 rounded-lg font-bold text-xs transition-all mt-1', isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white')}>
                          عرض
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        {auctions.filter(a => !shouldHideAuction(a.auction_end_time, a.auction_date)).length > 0 && filteredProducts.length > 0 && (
          <div className="my-8 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}></div>
        )}

        {/* Regular Products Section */}
        <div>
          <h2 className={cn('text-xl sm:text-2xl font-bold mb-6', isDarkMode ? 'text-white' : 'text-gray-900')}>
            المنتجات
          </h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
            <p className={cn('font-normal', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>جاري تحميل المنتجات...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className={cn('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
            <h3 className={cn('text-xl font-normal', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {searchQuery ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات متاحة حالياً'}
            </h3>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={cn('mt-4 px-4 py-2 rounded-lg font-normal text-white', isDarkMode ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700')}>
                مسح البحث
              </button>
            )}
            {!searchQuery && (
              <Link to="/stores" className="mt-6 inline-block">
                <button className={cn("px-6 py-3 rounded-lg font-normal text-white transition-all", isDarkMode ? "bg-indigo-700 hover:bg-indigo-800" : "bg-indigo-600 hover:bg-indigo-700")}>
                  استكشف المتاجر
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {filteredProducts.map((p) => (
              <motion.div key={p.id} whileHover={{ y: -4 }}>
                <Card className={cn('h-full flex flex-col border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group', isDarkMode ? 'bg-gray-800 border-green-700 hover:border-green-600' : 'bg-white border-green-500 hover:border-green-600')}>
                  {/* Image */}
                  <div
                    className={cn('aspect-square w-full overflow-hidden cursor-pointer', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}
                    onClick={() => setSelectedProduct(p)}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={p.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={28} className={cn(isDarkMode ? 'text-gray-500' : 'text-gray-300')} />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2 flex-1 flex flex-col justify-between gap-1.5">
                    <div>
                      <p className={cn('text-[8px] font-normal mb-0.5', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{p.store_name || ''}</p>
                      <h3 className={cn('font-normal text-xs line-clamp-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                        {p.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                      <span className={cn('text-[8px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>السعر</span>
                      <span className={cn('text-xs font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Product modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className={cn('absolute top-4 right-4 z-20 p-2 rounded-full transition-all', isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              <X size={24} />
            </button>

            {/* Gallery Section */}
            <div className={cn('w-full md:w-1/2 p-4 flex flex-col gap-4', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
              {/* Main Image */}
              <motion.div
                key={selectedProduct.image_url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn('w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white', isDarkMode ? 'bg-gray-600' : 'bg-gray-100')}
              >
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt={selectedProduct.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={48} className={cn(isDarkMode ? 'text-gray-500' : 'text-gray-300')} />
                  </div>
                )}
              </motion.div>

              {/* Image Gallery Thumbnails */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 0 && (
                <div className={cn('grid grid-cols-4 gap-2 p-3 rounded-xl border', isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200')}>
                  {/* Main image thumbnail */}
                  <div 
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer ring-2 ring-indigo-500 ring-offset-1"
                  >
                    <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="main" />
                  </div>

                  {/* Other images */}
                  {selectedProduct.gallery.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        // Note: This would require additional state to track main image if needed
                        console.log('Switching to gallery image:', img);
                      }}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 transition-all opacity-70 hover:opacity-100"
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`gallery-${idx}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details and Purchase Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <h2 className={cn('text-3xl font-normal', isDarkMode ? 'text-white' : 'text-gray-900')}>{selectedProduct.name}</h2>
                <p className={cn('text-base leading-relaxed', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>{selectedProduct.description}</p>

                {/* Product Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  <div className={cn('p-3 rounded-lg border', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                    <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>المخزون المتاح</p>
                    <p className={cn('font-bold text-lg', selectedProduct.stock === 0 ? 'text-red-600' : 'text-green-600')}>
                      {selectedProduct.stock === 0 ? 'غير متوفر' : `${selectedProduct.stock} متاح`}
                    </p>
                  </div>
                  <div className={cn('p-3 rounded-lg border', isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200')}>
                    <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-green-400' : 'text-green-600')}>الحالة</p>
                    <p className={cn('font-bold', isDarkMode ? 'text-green-300' : 'text-green-700')}>منتج أصلي ✓</p>
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="space-y-4 pt-6 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                <div>
                  <label className={cn('block mb-2 text-xs font-normal uppercase', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>اختر الكمية</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantities(prev => ({
                        ...prev,
                        [selectedProduct.id]: Math.max(1, (prev[selectedProduct.id] || 1) - 1)
                      }))}
                      className={cn('p-3 rounded-lg transition-all active:scale-95', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock || 999}
                      value={quantities[selectedProduct.id] || 1}
                      onChange={(e) => setQuantities(prev => ({
                        ...prev,
                        [selectedProduct.id]: Math.max(1, Math.min(selectedProduct.stock || 999, parseInt(e.target.value) || 1))
                      }))}
                      className={cn('flex-1 px-4 py-3 text-center text-lg font-normal rounded-lg border outline-none transition-all', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900')}
                    />
                    <button
                      onClick={() => setQuantities(prev => ({
                        ...prev,
                        [selectedProduct.id]: Math.min(selectedProduct.stock || 999, (prev[selectedProduct.id] || 1) + 1)
                      }))}
                      className={cn('p-3 rounded-lg transition-all active:scale-95', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Price and Buy Button */}
                <div className="space-y-3">
                  <div className={cn('p-4 rounded-lg border-2', isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200')}>
                    <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>السعر النهائي</p>
                    <p className={cn('text-2xl sm:text-3xl font-bold', isDarkMode ? 'text-indigo-300' : 'text-indigo-900')}>
                      {formatCurrency(selectedProduct.price * (quantities[selectedProduct.id] || 1))}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock === 0}
                    className={cn('w-full py-4 rounded-xl text-white font-normal text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100')}
                    style={{ backgroundColor: selectedProduct.stock === 0 ? '#999' : primaryColor }}
                  >
                    <ShoppingCart size={20} />
                    إضافة للسلة ({quantities[selectedProduct.id] || 1})
                  </button>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className={cn('w-full py-3 rounded-xl font-normal text-base transition-all border-2', isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auction Details Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-2 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('rounded-xl w-full max-w-sm shadow-2xl overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <button
              onClick={() => setSelectedAuction(null)}
              className={cn('absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all', isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className={cn('p-3 border-b', isDarkMode ? 'bg-gradient-to-r from-amber-900 to-red-900 border-gray-700' : 'bg-gradient-to-r from-amber-50 to-red-50 border-gray-200')}>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={18} className="text-amber-500" />
                <h2 className={cn('text-base font-bold truncate', isDarkMode ? 'text-white' : 'text-amber-900')}>
                  {selectedAuction.product_name}
                </h2>
              </div>
              <p className={cn('text-[11px] truncate', isDarkMode ? 'text-amber-100' : 'text-amber-700')}>
                من متجر {selectedAuction.store_name}
              </p>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2.5">
              {/* Image */}
              <div className={cn('w-full max-h-48 rounded-lg overflow-hidden', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                {selectedAuction.image_url && (
                  <img src={selectedAuction.image_url} className="w-full h-full object-cover" alt={selectedAuction.product_name} />
                )}
              </div>

              {/* Auction Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-green-900/30' : 'bg-green-50')}>
                  <p className={cn('text-[10px] font-normal mb-1', isDarkMode ? 'text-green-300' : 'text-green-600')}>
                    السعر الأساسي
                  </p>
                  <p className={cn('text-sm font-bold', isDarkMode ? 'text-green-400' : 'text-green-700')}>
                    {formatCurrency(selectedAuction.starting_price)}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-blue-300' : 'text-blue-600')}>
                    أعلى عرض
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-blue-400' : 'text-blue-700')}>
                    {selectedAuction.current_highest_price ? formatCurrency(selectedAuction.current_highest_price) : 'لا توجد عروض'}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-purple-300' : 'text-purple-600')}>
                    عدد العروض
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-purple-400' : 'text-purple-700')}>
                    {selectedAuction.total_bids || 0}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-red-900/30' : 'bg-red-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-red-300' : 'text-red-600')}>
                    الوقت المتبقي
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-red-400' : 'text-red-700')}>
                    {(() => {
                      const timer = getTimeRemaining(selectedAuction.auction_end_time, selectedAuction.auction_date);
                      return timer.isEnded ? 'انتهى' : `${timer.hours}:${timer.minutes.toString().padStart(2, '0')}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Auction Times */}
              <div className={cn('p-2.5 rounded-lg border text-xs', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                <h3 className={cn('font-bold mb-1.5 text-xs', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  📅 تفاصيل المزاد
                </h3>
                <div className="space-y-0.5 text-[11px]">
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">التاريخ:</span> {selectedAuction.auction_date}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">من:</span> {selectedAuction.auction_start_time}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">إلى:</span> {selectedAuction.auction_end_time}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 flex-col">
                {/* Bid Form Messages */}
                {bidMessage && (
                  <div className={cn("w-full p-1.5 rounded-lg text-[10px] font-normal flex items-center gap-1", bidMessage.type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {bidMessage.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
                    {bidMessage.text}
                  </div>
                )}
                
                {/* Auction Ended Alert */}
                {(() => {
                  const auctionStatus = getTimeRemaining(selectedAuction.auction_end_time, selectedAuction.auction_date);
                  return auctionStatus.isEnded ? (
                    <div className="w-full p-2 rounded-lg bg-red-100 text-red-700 text-xs font-normal flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>❌ انتهى وقت المزاد ولا يمكن إضافة عروض جديدة</span>
                    </div>
                  ) : null;
                })()}
                
                {/* Bid Input Form - Always Show (No Login Required) */}
                {(() => {
                  const auctionStatus = getTimeRemaining(selectedAuction.auction_end_time, selectedAuction.auction_date);
                  const isAuctionEnded = auctionStatus.isEnded;
                  
                  return (
                    <div className="w-full space-y-1.5">
                      {/* Customer Name */}
                      <input 
                        type="text" 
                        value={auctionBidForm.customer_name}
                        onChange={(e) => setAuctionBidForm({ ...auctionBidForm, customer_name: e.target.value })}
                        placeholder="أدخل اسمك"
                        disabled={bidSubmitting || isAuctionEnded}
                        className={cn('w-full px-2 py-1.5 rounded-lg border outline-none font-normal text-xs', isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500', (bidSubmitting || isAuctionEnded) && 'opacity-50 cursor-not-allowed')}
                      />
                      
                      {/* Customer Phone */}
                      <input 
                        type="tel" 
                        value={auctionBidForm.customer_phone}
                        onChange={(e) => setAuctionBidForm({ ...auctionBidForm, customer_phone: e.target.value })}
                        placeholder="رقم هاتفك"
                        disabled={bidSubmitting || isAuctionEnded}
                        className={cn('w-full px-2 py-1.5 rounded-lg border outline-none font-normal text-xs', isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500', (bidSubmitting || isAuctionEnded) && 'opacity-50 cursor-not-allowed')}
                      />
                      
                      {/* Bid Price */}
                      <div className="flex gap-1.5">
                        <div className="flex-1 relative">
                          <input 
                            type="number" 
                            value={auctionBidForm.bid_price}
                            onChange={(e) => setAuctionBidForm({ ...auctionBidForm, bid_price: e.target.value })}
                                placeholder={`أكثر من ${formatCurrency(Math.max(selectedAuction.current_highest_price || selectedAuction.starting_price, selectedAuction.starting_price))}`}
                                disabled={bidSubmitting || isAuctionEnded}
                                className={cn('w-full px-2 py-1.5 rounded-lg border outline-none font-normal text-xs pl-6', isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500', (bidSubmitting || isAuctionEnded) && 'opacity-50 cursor-not-allowed')}
                              />
                              <span className={cn("absolute left-1.5 top-1/2 -translate-y-1/2 font-semibold text-[10px]", isDarkMode ? "text-gray-400" : "text-gray-500")}>د.ع</span>
                            </div>
                            <button 
                              onClick={submitAuctionBid}
                              disabled={bidSubmitting || isAuctionEnded}
                              className={cn('flex-1 py-1.5 rounded-lg font-bold text-xs text-white transition-all', (bidSubmitting || isAuctionEnded) ? 'opacity-50 bg-green-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')}
                            >
                              {bidSubmitting ? '⏳ جاري...' : isAuctionEnded ? '❌ انتهى' : '💰 عرض'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Close Button */}
                    <button 
                      onClick={() => setSelectedAuction(null)}
                      className={cn('w-full py-1.5 rounded-lg font-bold text-xs transition-all', isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200')}
                    >
                      إغلاق
                    </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className={cn("border-t py-12 mt-12 flex-1", isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-black/5 text-gray-500")}> 
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className={cn("text-xl font-normal tracking-tighter mb-4", isDarkMode ? "text-white" : "text-indigo-600")}>{appName}</h4>
            <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-500")}>منصة التجارة الإلكترونية متعددة المستأجرين النهائية للشركات الحديثة.</p>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>المنصة</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>من نحن</Link></li>
            </ul>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>الدعم</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>مركز المساعدة</Link></li>
            </ul>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>القانونية</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/security" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>سياسة الأمان</Link></li>
              <li><Link to="/privacy" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>سياسة الخصوصية</Link></li>
            </ul>
          </div>
        </div>
      </footer>
      <MobileFooterNav />
    </div>
  );
};

// About Page - من نحن
const AboutPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>من نحن</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🌍 منصتنا</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              نحن منصة تجارة إلكترونية حديثة توفر حلولاً شاملة للتجار والمتاجر الإلكترونية. تأسست المنصة بهدف تمكين الشركات الصغيرة والمتوسطة من الانطلاق رقمياً بسهولة وفعالية.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🎯 رسالتنا</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              توفير أدوات وخدمات متقدمة تمكّن التجار من إدارة متاجرهم الإلكترونية بكفاءة وتوسيع أعمالهم في السوق الرقمي.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>✨ قيمنا</h2>
            <ul className={cn("space-y-2", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              <li>✓ الشفافية والأمانة في جميع معاملاتنا</li>
              <li>✓ الابتكار المستمر لتحسين الخدمات</li>
              <li>✓ دعم العملاء على مدار الساعة</li>
              <li>✓ أمن البيانات والخصوصية</li>
            </ul>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Help Center Page - مركز المساعدة
const HelpCenterPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>مركز المساعدة</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>❓ الأسئلة الشائعة</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>ستجد الإجابات على الأسئلة الأكثر شيوعاً حول استخدام المنصة وإدارة متجرك.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>📚 الدلائل والأدلة</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>خطوات مفصلة وأدلة شاملة تساعدك في البدء والقيام بمختلف العمليات.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>💬 دعم العملاء</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>فريق الدعم الخاص بنا متاح لمساعدتك على مدار الساعة يومياً.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🛠️ الصيانة والتحديثات</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>تابع آخر التحديثات والصيانة الدورية للمنصة.</p>
            </div>
          </div>
          <div className={cn("p-6 rounded-xl mt-8", isDarkMode ? 'bg-gray-700' : 'bg-indigo-50')}>
            <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <strong>📧 تواصل معنا:</strong> إذا لم تجد الإجابة، يمكنك التواصل مع فريقنا عبر البريد الإلكتروني أو خلال ساعات العمل.
            </p>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Security Policy Page - سياسة الأمان
const SecurityPolicyPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>سياسة الأمان</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔒 أمان البيانات</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              نستخدم تقنيات التشفير الحديثة لحماية معلومات عملائنا والحفاظ على سرية بيانات المتاجر والعملاء.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🛡️ حماية المعاملات</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              جميع المعاملات المالية محمية بمعايير أمان دولية. لا نقبل بطاقات ائتمان مباشرة - يتم التعامل من خلال بوابات دفع آمنة معتمدة.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔐 كلمات المرور</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              استخدم كلمات مرور قوية ولا تشارك حسابك مع أحد. يمكنك تحديث كلمة المرور في أي وقت من إعدادات الحساب.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>الإبلاغ عن المشاكل الأمنية</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              إذا اكتشفت أي مشكلة أمنية، يرجى الإبلاغ عنها فوراً إلى فريق الأمان بخصوصية تامة.
            </p>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Privacy Policy Page - سياسة الخصوصية
const PrivacyPolicyPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>سياسة الخصوصية</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>📋 جمع البيانات</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              نجمع المعلومات الضرورية لتقديم الخدمة فقط، مثل البيانات الشخصية والمعاملات التجارية.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🔒 استخدام البيانات</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              نستخدم بيانات العملاء فقط لتحسين الخدمة والتواصل حول الحسابات والعروض الخاصة. لا بيع البيانات لأطراف ثالثة.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🚀 ملفات تعريف الارتباط</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              نستخدم الملفات التعريفية لتحسين تجربة الاستخدام. يمكنك إدارة الملفات التعريفية من إعدادات المتصفح.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>🗑️ حقوقك</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              لديك الحق في طلب معلوماتك الشخصية، تصحيحها، أو حذفها في أي وقت.
            </p>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

const StoresPage = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [storesWithLogos, setStoresWithLogos] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTopupAuthModal, setShowTopupAuthModal] = useState(false);
  const [selectedTopupStore, setSelectedTopupStore] = useState<any>(null);
  const [topupAuthName, setTopupAuthName] = useState('');
  const [topupAuthPhone, setTopupAuthPhone] = useState('');
  const [topupAuthError, setTopupAuthError] = useState('');
  const [topupAuthLoading, setTopupAuthLoading] = useState(false);
  const navigate = useNavigate();
  const { appName, primaryColor } = useSettingsStore();
  const { isDarkMode } = useTheme();

  const buildStoreLogosMap = (storeList: any[]) => {
    const logoMap = new Map<number, string>();

    for (const store of storeList) {
      let resolvedLogo = store.logo_url || '';
      const savedSettings = localStorage.getItem(`storeSettings_${store.id}`);

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.logo_url && parsedSettings.logo_url.length > 100) {
            resolvedLogo = parsedSettings.logo_url;
          }
        } catch (err) {
          console.error('Error parsing store logo settings for stores page:', err);
        }
      }

      if (resolvedLogo) {
        logoMap.set(store.id, resolvedLogo);
      }
    }

    return logoMap;
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        const activeStores = Array.isArray(data) ? data.filter(s => s.is_active) : [];
        setStores(activeStores);

        setStoresWithLogos(buildStoreLogosMap(activeStores));
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setStores([]);
        setLoading(false);
      }
    };
    
    fetchStores();
  }, []);

      useEffect(() => {
        setStoresWithLogos(buildStoreLogosMap(stores));
      }, [stores]);

      useEffect(() => {
        const handleSettingsUpdate = (event: any) => {
          const updatedStoreId = event?.detail?.storeId;
          console.log('🔔 StoresPage received storeSettingsUpdated event for store:', updatedStoreId);

          setStoresWithLogos(buildStoreLogosMap(stores));
        };

        window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

        return () => {
          window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
        };
      }, [stores]);

  const handleStoreClick = (store: any) => {
    // If topup store, show auth modal instead of navigating directly
    if (store.store_type === 'topup') {
      setSelectedTopupStore(store);
      setTopupAuthName('');
      setTopupAuthPhone('');
      setTopupAuthError('');
      setShowTopupAuthModal(true);
    } else {
      navigate(`/store/${store.slug}`);
    }
  };

  // Helper function to normalize phone numbers for comparison
  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // Remove all spaces and dashes
    let normalized = phone.replace(/[\s\-()]/g, '');
    // Remove leading + if exists
    normalized = normalized.replace(/^\+/, '');
    // If starts with country code 964, keep it or convert to 07xxx format
    if (normalized.startsWith('964')) {
      normalized = '0' + normalized.substring(3);
    }
    return normalized.trim();
  };

  const handleTopupStoreVerification = async () => {
    if (!topupAuthName.trim() || !topupAuthPhone.trim()) {
      setTopupAuthError('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setTopupAuthLoading(true);
    try {
      const res = await fetch(`/api/merchant/customers?storeId=${selectedTopupStore.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const customersData = await res.json();
      
      // Normalize input phone number
      const normalizedInputPhone = normalizePhone(topupAuthPhone);
      
      // Filter customers for the topup store
      const registeredCustomers = Array.isArray(customersData) ? customersData.filter((c: any) => {
        const normalizedDbPhone = normalizePhone(c.phone);
        return (
          c.name.toLowerCase().trim() === topupAuthName.toLowerCase().trim() &&
          normalizedDbPhone === normalizedInputPhone
        );
      }) : [];

      if (registeredCustomers.length > 0) {
        // Customer verified - save data to localStorage
        const customer = registeredCustomers[0];
        const customerData = {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          customer_type: customer.customer_type,
          credit_limit: customer.credit_limit,
          current_debt: customer.current_debt
        };
        console.log('✅ Customer verified, saving:', customerData);
        // Save to localStorage
        localStorage.setItem('topupCustomer', JSON.stringify(customerData));
        
        // Close modal and navigate
        setShowTopupAuthModal(false);
        setSelectedTopupStore(null);
        setTopupAuthName('');
        setTopupAuthPhone('');
        setTopupAuthError('');
        
        // Navigate to topup store (without sidebar, full-width mobile layout) - use ID as fallback
        const storeSlug = selectedTopupStore.slug || selectedTopupStore.id;
        navigate(`/topup/${storeSlug}`);
      } else {
        setTopupAuthError('❌ لم يتم العثور على بيانات مطابقة. تأكد من اسم العميل ورقم الهاتف الصحيح');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setTopupAuthError('حدث خطأ في التحقق. يرجى المحاولة لاحقاً');
    } finally {
      setTopupAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-normal">جاري تحميل المتاجر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-28 md:pb-0 flex flex-col", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gradient-to-b from-indigo-50 to-white text-gray-900")} dir="rtl">
      {/* Header */}
      <div className={cn("border-b sticky top-0 z-40", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className={cn("flex items-center gap-2 font-normal transition-colors", isDarkMode ? "text-gray-400 hover:text-indigo-400" : "text-gray-600 hover:text-indigo-600")}
          >
            <ChevronRight size={20} />
            <span className="hidden sm:inline">العودة</span>
          </Link>
          <h1 className={cn("text-lg sm:text-2xl font-normal text-center flex-1 truncate", isDarkMode ? "text-white" : "text-gray-900")}>استكشف جميع المتاجر</h1>
          <div className="w-8 sm:w-16"></div>
        </div>
      </div>

      {/* Stores Grid */}
      {/* Topup Store Auth Modal */}
      {showTopupAuthModal && selectedTopupStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
          <Card className={cn("w-full max-w-md", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn("text-xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>دخول متجر البطاقات</h2>
                <button
                  onClick={() => {
                    setShowTopupAuthModal(false);
                    setSelectedTopupStore(null);
                    setTopupAuthName('');
                    setTopupAuthPhone('');
                    setTopupAuthError('');
                  }}
                  className={cn("p-1 rounded hover:bg-gray-100", isDarkMode ? "hover:bg-gray-700" : "")}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                </button>
              </div>

              <p className={cn("text-sm mb-4", isDarkMode ? "text-gray-400" : "text-gray-600")}>أدخل بيانات الحساب للتحقق</p>

              {topupAuthError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-normal">{topupAuthError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>الاسم</label>
                  <input
                    type="text"
                    value={topupAuthName}
                    onChange={(e) => {
                      setTopupAuthName(e.target.value);
                      setTopupAuthError('');
                    }}
                    placeholder="أدخل الاسم"
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>رقم الهاتف</label>
                  <input
                    type="tel"
                    value={topupAuthPhone}
                    onChange={(e) => {
                      setTopupAuthPhone(e.target.value);
                      setTopupAuthError('');
                    }}
                    placeholder="أدخل رقم الهاتف"
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900")}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTopupAuthModal(false);
                    setSelectedTopupStore(null);
                    setTopupAuthName('');
                    setTopupAuthPhone('');
                    setTopupAuthError('');
                  }}
                  className={cn("flex-1 px-4 py-2 rounded-lg font-normal text-sm transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-800")}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleTopupStoreVerification}
                  disabled={topupAuthLoading}
                  className="flex-1 px-4 py-2 rounded-lg font-normal text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {topupAuthLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري التحقق...
                    </>
                  ) : (
                    <>التحقق ودخول المتجر</>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-12">
        {stores.length === 0 ? (
          <div className="text-center py-20">
            <StoreIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-normal text-white">لا توجد متاجر متاحة حالياً</h3>
            <p className="text-gray-300">تحقق لاحقاً للتسوق من متاجر جديدة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                whileHover={{ y: -4 }}
                onClick={() => handleStoreClick(store)}
                className="cursor-pointer"
              >
                <Card className="h-full flex flex-col border-none shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group w-full">
                  {/* Store Logo Badge - Always Visible */}
                  <div className="p-0 flex items-center justify-center h-24 overflow-hidden rounded-t-lg bg-white">
                    {storesWithLogos.has(store.id) && storesWithLogos.get(store.id) ? (
                      <img 
                        src={storesWithLogos.get(store.id)} 
                        className="w-auto h-auto max-w-[95%] max-h-[95%] object-contain" 
                        alt={store.store_name}
                        onError={(e) => console.error("Logo load error for", store.store_name)}
                      />
                    ) : store.store_type === 'topup' ? (
                      // Default logo for topup stores
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-red-600 mb-1">💳</div>
                          <p className="text-xs font-normal text-red-600">بطاقات شحن</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white text-gray-300">
                        <StoreIcon size={40} />
                      </div>
                    )}
                  </div>

                  {/* Store Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h3 className={cn("font-normal text-xs line-clamp-1 group-hover:text-indigo-300 transition-colors mb-1", isDarkMode ? "text-white" : "text-gray-900")}>
                        {store.store_name}
                      </h3>
                      <p className={cn("text-[10px] font-normal line-clamp-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                        {store.description || 'متجر متخصص'}
                      </p>
                    </div>

                    {/* Store Owner */}
                    {store.owner_name && (
                      <div className="text-[9px]">
                        <p className={cn("font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>صاحب المتجر</p>
                        <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{store.owner_name}</p>
                      </div>
                    )}

                    {/* Visit Button */}
                    <button 
                      className="mt-1 w-full py-1.5 px-1 rounded-md font-normal text-white text-[9px] transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      زيارة المتجر
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MobileFooterNav />
    </div>
  );
};

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-700 min-h-screen">
          <h1 className="text-2xl font-normal mb-4">حدث خطأ في التطبيق</h1>
          <pre className="bg-white p-4 rounded border border-red-200 overflow-auto max-w-full">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---

function App() {
  const { user } = useAuthStore();
  const { setSettings } = useSettingsStore();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true; // الوضع الليلي افتراضيًا
  });
  console.log("App Render - User:", user);

  // Save dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Load admin settings on app mount
  useEffect(() => {
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.app_name) {
          useSettingsStore.getState().setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Fetch global platform settings
    fetch(`/api/settings?storeId=${user?.store_id}&role=${user?.role}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.app_name) {
          setSettings(data);
          // Update the global settings store so it's available everywhere
          useSettingsStore.getState().setSettings(data);
        }
      })
      .catch(() => {});
  }, [setSettings]);

  return (
    <ThemeProvider isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
      <BrowserRouter>
        <Routes>
          {/* Main page - All products (excluding topup store products) */}
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/store/:slug" element={<CustomerStorefront />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/topup-cart" element={<TopupCartPage />} />
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'merchant' ? '/merchant' : '/'} replace /> : <LoginPage />} />
          <Route path="/register-merchant" element={<RegisterMerchantPage />} />
          
          {/* Info Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/security" element={<SecurityPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={user?.role === 'admin' ? (
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path=":section" element={<AdminDashboard />} />
            </Routes>
          ) : <Navigate to="/login" replace />} />

          {/* Merchant Routes */}
          <Route path="/merchant/*" element={user?.role === 'merchant' ? (
            <Routes>
              <Route index element={<MerchantDashboard />} />
              <Route path=":section" element={<MerchantDashboard />} />
            </Routes>
          ) : <Navigate to="/login" replace />} />

          {/* Top-Up Store Routes */}
          <Route path="/topup/:slug" element={<TopupStorefront />} />
          <Route path="/topup/:slug/order/:orderId" element={<TopupOrderDetails />} />

          {/* Top-Up Merchant Dashboard */}
          <Route path="/topup-merchant/*" element={
            <Routes>
              <Route index element={<MerchantTopupDashboard />} />
              <Route path=":section" element={<MerchantTopupDashboard />} />
            </Routes>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

// ========== MERCHANT TOP-UP DASHBOARD COMPONENT ==========

const MerchantTopupDashboard = () => {
  const { isDarkMode } = useTheme();
  const { user, setUser } = useAuthStore();
  const { section } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  
  // Auth state
  const [showLogin, setShowLogin] = useState(!user || user.role !== 'merchant');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalCodes: 0, activeCodes: 0 });

  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCodeUploadModal, setShowCodeUploadModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerStatement, setShowCustomerStatement] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedCustomerForPayments, setSelectedCustomerForPayments] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: '', notes: '' });
  const [isEditingPayment, setIsEditingPayment] = useState<number | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState<number | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<number | null>(null);
  const [selectedProductForCodes, setSelectedProductForCodes] = useState<number | null>(null);
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState<any>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState({ name: '', logo_url: '' });
  const [productForm, setProductForm] = useState({ company_id: '', amount: '', price: '', bulk_price: '', quantity_type: 'unit', category_id: '' });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', password: '', customer_type: 'cash', credit_limit: '0', starting_balance: '' });
  const [storeSettings, setStoreSettings] = useState({ store_name: '', logo_url: '' });
  const [storeLogoBg, setStoreLogoFile] = useState<File | null>(null);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [dashboardLogo, setDashboardLogo] = useState<string>('');
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);

  // Store ID - using 13 for top-up store (علي الهادي)
  const topupStoreId = 13;

  // Function to refresh dashboard data
  const refreshDashboardData = async () => {
    try {
      const [comp, prod, cust, ordersData] = await Promise.all([
        fetch(`/api/topup/companies/${topupStoreId}`).then(r => r.json()),
        fetch(`/api/topup/products/${topupStoreId}`).then(r => r.json()),
        fetch(`/api/topup/customers/${topupStoreId}`).then(r => r.json()),
        fetch(`/api/topup/orders?storeId=${topupStoreId}`).then(r => r.json()).catch(() => []),
      ]);
      
      setCompanies(Array.isArray(comp) ? comp : []);
      setProducts(Array.isArray(prod) ? prod : []);
      setCustomers(Array.isArray(cust) ? cust : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      
      // Calculate stats with both products and orders
      const calculatedStats = calculateStats(
        Array.isArray(prod) ? prod : [],
        Array.isArray(ordersData) ? ordersData : []
      );
      setStats({
        totalOrders: Array.isArray(ordersData) ? ordersData.length : 0,
        totalRevenue: calculatedStats.totalRevenue,
        totalCodes: calculatedStats.totalCodes,
        activeCodes: calculatedStats.totalCodes - calculatedStats.usedCodes
      });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      alert('يرجى ملء بيانات الدخول');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          role: 'merchant'
        })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setShowLogin(false);
        alert('تم الدخول بنجاح! ✓');
      } else {
        alert(data.error || 'فشل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('حدث خطأ');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    useSettingsStore.getState().resetSettings(); // Reset settings when logging out
    setShowLogin(true);
    setLoginUsername('');
    setLoginPassword('');
  };

  const calculateStats = (prod: any[], ordersData: any[] = []) => {
    let totalCodes = 0;
    let usedCodes = 0;
    let totalRevenue = 0;

    // Calculate codes statistics from products
    prod.forEach(p => {
      let codeCount = 0;
      
      // First priority: use available_codes if it's a valid number > 0
      if (typeof p.available_codes === 'number' && p.available_codes > 0) {
        codeCount = p.available_codes;
      } 
      // Fallback: count actual codes array
      else if (p.codes && Array.isArray(p.codes) && p.codes.length > 0) {
        codeCount = p.codes.length;
      }
      
      totalCodes += codeCount;
    });

    // Calculate used codes from orders (each order = one code used)
    if (Array.isArray(ordersData) && ordersData.length > 0) {
      usedCodes = ordersData.length; // Each order uses at least one code
    }

    // Calculate revenue from orders (convert to number properly)
    ordersData.forEach(order => {
      if (order.total_amount) {
        const amount = typeof order.total_amount === 'string' 
          ? parseFloat(order.total_amount) 
          : Number(order.total_amount);
        if (!isNaN(amount)) {
          totalRevenue += amount;
        }
      }
    });

    return { totalCodes, usedCodes, totalRevenue };
  };

  useEffect(() => {
    if (showLogin || !topupStoreId) return;

    // Load data immediately
    refreshDashboardData();

    // Set up auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(refreshDashboardData, 5000);

    return () => clearInterval(interval);
  }, [section, showLogin]);

  // Fetch store settings on mount
  useEffect(() => {
    const fetchStoreSettings = async () => {
      // First try to load from localStorage
      const savedSettings = localStorage.getItem(`storeSettings_${topupStoreId}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setStoreSettings(parsed);
          if (parsed.logo_url && parsed.logo_url.length > 100) {
            setLogoPreview(parsed.logo_url);
          }
          console.log('Loaded settings from localStorage:', parsed);
        } catch (e) {
          console.error('Error parsing localStorage settings:', e);
        }
      }

      // Then try to fetch from API
      try {
        const res = await fetch(`/api/stores/${topupStoreId}`);
        if (!res.ok) {
          if (res.status === 404) {
            console.log('Store settings not found in API, using defaults or localStorage');
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data) {
          setStoreSettings({
            store_name: data.store_name || '',
            logo_url: data.logo_url || ''
          });
        }
      } catch (error) {
        console.error('Error fetching store settings from API:', error);
      }
    };

    fetchStoreSettings();
  }, [topupStoreId]);

  // Load and sync dashboard logo with events
  useEffect(() => {
    console.log('📍 Dashboard useEffect triggered, loading logo from localStorage for storeId:', topupStoreId);
    const storeSettings = localStorage.getItem(`storeSettings_${topupStoreId}`);
    if (storeSettings) {
      try {
        const parsed = JSON.parse(storeSettings);
        if (parsed.logo_url && parsed.logo_url.length > 100) {
          console.log('📍 Found valid logo, setting it. Length:', parsed.logo_url.length);
          console.log('📍 Logo data ends with:', parsed.logo_url.substring(parsed.logo_url.length - 30));
          setDashboardLogo(prev => {
            if (prev !== parsed.logo_url) {
              console.log('📍 Logo is different from previous, updating');
              return parsed.logo_url;
            }
            console.log('📍 Logo is same as previous, skipping');
            return prev;
          });
        } else {
          console.log('📍 No valid logo found in settings');
        }
      } catch (err) {
        console.error('❌ Error parsing store settings:', err);
      }
    } else {
      console.log('📍 No store settings in localStorage for key:', `storeSettings_${topupStoreId}`);
    }
  }, [topupStoreId]);

  // Trigger refresh when dashboardLogo changes
  useEffect(() => {
    console.log('📍 dashboardLogo changed, length:', dashboardLogo.length);
    setLogoRefreshKey(prev => prev + 1);
  }, [dashboardLogo]);

  // Listen for custom event from settings panel
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      console.log('🔔 Event received on Dashboard, topupStoreId:', topupStoreId);
      const storeSettings = localStorage.getItem(`storeSettings_${topupStoreId}`);
      console.log('🔔 Reading from key:', `storeSettings_${topupStoreId}`);
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          console.log('🔔 Parsed from localStorage:', {
            has_logo: !!parsed.logo_url,
            logoLength: parsed.logo_url?.length,
            logoEnds: parsed.logo_url?.substring(parsed.logo_url.length - 30)
          });
          if (parsed.logo_url && parsed.logo_url.length > 100) {
            console.log('🔔 Setting logo from event. Length:', parsed.logo_url.length);
            // Clear first
            setDashboardLogo('');
            setTimeout(() => {
              console.log('🔔 Now setting new logo');
              setDashboardLogo(parsed.logo_url);
              setLogoRefreshKey(prev => {
                const newKey = prev + 1;
                console.log('🔔 Incrementing refresh key from', prev, 'to', newKey);
                return newKey;
              });
            }, 50);
          }
        } catch (err) {
          console.error('❌ Error in event handler:', err);
        }
      }
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
    };
  }, [topupStoreId]);

  const handleStoreLogoUpload = async (file: File) => {
    if (!file) return;

    console.log('🔄 handleStoreLogoUpload called with file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    setLogoUploadLoading(true);
    try {
      // Convert image to Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          console.log('📸 Base64 Data Preview:', {
            length: base64Data.length,
            firstChars: base64Data.substring(0, 50),
            lastChars: base64Data.substring(base64Data.length - 30),
            mimeType: file.type
          });
          
          // Compare with current logo
          console.log('📸 Comparing with current dashboard logo:', {
            currentLength: dashboardLogo.length,
            currentEnds: dashboardLogo.substring(dashboardLogo.length - 30),
            newLength: base64Data.length,
            newEnds: base64Data.substring(base64Data.length - 30),
            isSame: dashboardLogo === base64Data
          });
          
          // Update store settings with base64 image
          const updatedSettings = {
            ...storeSettings,
            logo_url: base64Data
          };
          
          console.log('📝 Updated Settings:', {
            store_name: updatedSettings.store_name,
            logo_url_length: updatedSettings.logo_url?.length,
            logoEnds: updatedSettings.logo_url?.substring(updatedSettings.logo_url.length - 30)
          });
          
          setStoreSettings(updatedSettings);
          setDashboardLogo(base64Data); // Update sidebar logo immediately
          setLogoPreview(base64Data); // Update preview immediately
          
          // Save to localStorage
          localStorage.setItem(`storeSettings_${topupStoreId}`, JSON.stringify(updatedSettings));
          console.log('✓ Saved to localStorage - verifying:', {
            topupStoreId: topupStoreId,
            keyName: `storeSettings_${topupStoreId}`,
            storedLength: localStorage.getItem(`storeSettings_${topupStoreId}`)?.length,
            dataLength: JSON.stringify(updatedSettings).length,
            logoLength: updatedSettings.logo_url?.length,
            logoEnds: updatedSettings.logo_url?.substring(updatedSettings.logo_url.length - 30)
          });
          
          // Dispatch event for menu component
          window.dispatchEvent(new CustomEvent('storeSettingsUpdated', {
            detail: { storeId: topupStoreId, settings: updatedSettings }
          }));
          console.log('📢 Dispatched storeSettingsUpdated event with storeId:', topupStoreId);
          
          console.log('✓ Logo uploaded and saved:', {
            size: file.size,
            type: file.type,
            name: file.name,
            base64Length: base64Data.length
          });
          
          setStoreLogoFile(null);
          alert('✓ تم تحميل الشعار بنجاح');
          setLogoUploadLoading(false);
        } catch (error) {
          console.error('Error processing logo:', error);
          alert('❌ حدث خطأ في معالجة الشعار');
          setLogoUploadLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('❌ خطأ في قراءة الملف');
        setLogoUploadLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('❌ حدث خطأ في التحميل');
      setLogoUploadLoading(false);
    }
  };

  const saveStoreSettings = async () => {
    if (!storeSettings.store_name.trim()) {
      alert('يرجى إدخال اسم المتجر');
      return;
    }

    try {
      // Save to localStorage first (always works)
      localStorage.setItem(`storeSettings_${topupStoreId}`, JSON.stringify(storeSettings));
      console.log('✓ Saved to localStorage:', storeSettings);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('storeSettingsUpdated', {
        detail: { storeId: topupStoreId, settings: storeSettings }
      }));
      console.log('📢 Dispatched storeSettingsUpdated event');

      // Try to save to API endpoint
      try {
        const response = await fetch(`/api/stores/${topupStoreId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_name: storeSettings.store_name,
            logo_url: storeSettings.logo_url || ''
          })
        });

        if (response.ok) {
          alert('✓ تم حفظ الإعدادات بنجاح (في الخادم والتطبيق)');
        } else if (response.status === 404) {
          alert('✓ تم حفظ الإعدادات بنجاح (في التطبيق)');
          console.log('Note: API endpoint not available, saved locally');
        } else {
          alert('✓ تم حفظ الإعدادات بنجاح (في التطبيق)\n⚠️ لم يتم حفظها في الخادم');
        }
      } catch (apiError) {
        console.log('API not available, but saved locally:', apiError);
        alert('✓ تم حفظ الإعدادات بنجاح (في التطبيق)');
      }
    } catch (error) {
      console.error('Error saving store settings:', error);
      alert('❌ حدث خطأ: ' + (error as any).message);
    }
  };

  const saveCompany = async () => {
    if (!companyForm.name) {
      alert('يرجى إدخال اسم الشركة');
      return;
    }

    try {
      const method = isEditingCompany ? 'PUT' : 'POST';
      const url = isEditingCompany ? `/api/topup/companies/${isEditingCompany}` : '/api/topup/companies';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: topupStoreId,
          name: companyForm.name,
          logo_url: companyForm.logo_url || ''
        })
      });

      if (response.ok) {
        alert(isEditingCompany ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح');
        setShowCompanyModal(false);
        // Reload companies
        const res = await fetch(`/api/topup/companies/${topupStoreId}`);
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('حدث خطأ في الاتصال');
    }
  };

  const saveCustomer = async () => {
    if (!customerForm.name || !customerForm.phone || !customerForm.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const method = isEditingCustomer ? 'PUT' : 'POST';
      const url = isEditingCustomer ? `/api/topup/customers/${isEditingCustomer}` : '/api/topup/customers';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: topupStoreId,
          name: customerForm.name,
          phone: customerForm.phone,
          email: customerForm.email || '',
          password: customerForm.password,
          customer_type: customerForm.customer_type,
          credit_limit: parseInt(customerForm.credit_limit) || 0,
          starting_balance: parseInt(customerForm.starting_balance) || 0
        })
      });

      if (response.ok) {
        alert(isEditingCustomer ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح');
        setShowCustomerModal(false);
        setCustomerForm({ name: '', phone: '', email: '', password: '', customer_type: 'cash', credit_limit: '0', starting_balance: '' });
        // Reload customers
        const res = await fetch(`/api/topup/customers/${topupStoreId}`);
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('حدث خطأ في الاتصال');
    }
  };

  const saveProduct = async () => {
    if (!productForm.company_id || !productForm.amount || !productForm.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const method = isEditingProduct ? 'PUT' : 'POST';
      const url = isEditingProduct ? `/api/topup/products/${isEditingProduct}` : '/api/topup/products';
      
      const amountInt = parseInt(productForm.amount);
      const priceInt = parseInt(productForm.price);
      const bulkPriceInt = productForm.bulk_price ? parseInt(productForm.bulk_price) : priceInt;
      
      if (isNaN(amountInt) || isNaN(priceInt)) {
        alert('يرجى إدخال أرقام صحيحة للمبلغ والسعر');
        return;
      }
      
      const payload = {
        store_id: topupStoreId,
        company_id: parseInt(productForm.company_id),
        amount: amountInt,
        price: priceInt,
        bulk_price: bulkPriceInt,
        quantity_type: productForm.quantity_type
      };

      console.log('📤 Sending product payload:', payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('📥 Product response:', responseData);

      if (response.ok) {
        alert(isEditingProduct ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح');
        setShowProductModal(false);
        setProductForm({ company_id: '', amount: '', price: '', bulk_price: '', quantity_type: 'unit', category_id: '' });
        const res = await fetch(`/api/topup/products/${topupStoreId}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        const errorMsg = responseData.error || responseData.message || 'فشل حفظ المنتج';
        alert('خطأ: ' + errorMsg);
        console.error('❌ Server error:', responseData);
      }
    } catch (error) {
      console.error('❌ Error saving product:', error);
      alert('حدث خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    }
  };

  const handleUploadCodes = async () => {
    if (!uploadedFile) {
      alert('يرجى اختيار ملف');
      return;
    }

    if (!selectedProductForCodes) {
      alert('يرجى اختيار منتج أولاً');
      return;
    }

    try {
      const text = await uploadedFile.text();
      const codes = text.split('\n').filter(code => code.trim());

      if (codes.length === 0) {
        alert('الملف لا يحتوي على أي أكواد');
        return;
      }

      const response = await fetch('/api/topup/upload-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: topupStoreId,
          topup_product_id: selectedProductForCodes,
          codes: codes
        })
      });

      const responseData = await response.json();

      if (response.ok) {
        alert(responseData.message || `تم تحميل ${codes.length} أكواد بنجاح!`);
        setShowCodeUploadModal(false);
        setUploadedFile(null);
        setSelectedProductForCodes(null);
        // Refresh products list
        const updatedRes = await fetch(`/api/topup/products/${topupStoreId}`);
        const data = await updatedRes.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        alert(`خطأ: ${responseData.error || 'فشل تحميل الأكواد'}`);
      }
    } catch (error) {
      console.error('Error uploading codes:', error);
      alert('خطأ: فشلت معالجة الملف');
    }
  };

  // Render Login Screen
  if (showLogin) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", isDarkMode ? "bg-gray-900" : "bg-gray-50")} dir="rtl">
        <Card className={cn("w-full max-w-md p-8", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
          <div className="text-center mb-8">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", isDarkMode ? "bg-indigo-900" : "bg-indigo-100")}>
              <CreditCard size={32} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-normal">لوحة متجر البطاقات</h1>
            <p className={cn("text-sm mt-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>دخول التاجر</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-normal mb-2">اسم المستخدم</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}
              />
            </div>
            <div>
              <label className="block text-sm font-normal mb-2">كلمة المرور</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 transition-all"
            >
              {isLoggingIn ? 'جاري الدخول...' : 'دخول'}
            </button>
          </div>

          <p className={cn("text-center text-xs mt-6", isDarkMode ? "text-gray-400" : "text-gray-600")}>
            👤 المستخدم الافتراضي: <strong>admin</strong> | كلمة المرور: <strong>password</strong>
          </p>
        </Card>
      </div>
    );
  }

  const currentSection = section || 'overview';

  return (
    <div className={cn("min-h-screen flex", isDarkMode ? "bg-gray-950" : "bg-gray-50")} dir="rtl">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={cn(
          "w-64 hidden md:block md:relative h-screen overflow-y-auto border-l",
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
          "z-40"
        )}
      >
        <div className="p-6" key={`sidebar-logo-${logoRefreshKey}-${dashboardLogo.substring(dashboardLogo.length - 30) || 'empty'}`}>
          <div className="flex items-center gap-3 mb-8">
            {dashboardLogo && dashboardLogo.length > 100 ? (
              <img 
                key={`img-${logoRefreshKey}`}
                src={dashboardLogo}
                alt="Store Logo"
                className="w-12 h-12 rounded-xl object-contain bg-white"
                onError={(e) => {
                  console.error('Error loading sidebar logo');
                  setDashboardLogo('');
                }}
                onLoad={() => {
                  console.log('✅ Sidebar image loaded successfully! Key:', logoRefreshKey, 'Src ends with:', dashboardLogo.substring(dashboardLogo.length - 30));
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <CreditCard size={24} />
              </div>
            )}
            <div>
              <h2 className={cn("font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>الإدارة</h2>
              <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>متجر البطاقات</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'ملخص المبيعات', icon: BarChart3, badge: null },
              { id: 'companies', label: 'الشركات', icon: StoreIcon, badge: companies.length },
              { id: 'products', label: 'المنتجات', icon: CreditCard, badge: products.length },
              { id: 'codes', label: 'الأكواد', icon: Ticket, badge: products.reduce((sum: number, p: any) => sum + (p.codes?.length || 0), 0) },
              { id: 'customers', label: 'العملاء', icon: Users, badge: customers.length },
              { id: 'orders', label: 'الطلبات', icon: ShoppingCart, badge: orders.filter((o: any) => o.status !== 'returned').length },
              { id: 'settings', label: 'الإعدادات', icon: Settings, badge: null },
            ].map(item => (
              <Link
                key={item.id}
                to={`/topup-merchant/${item.id}`}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg transition-all font-normal",
                  currentSection === item.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {item.badge !== null && item.badge > 0 && (
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", currentSection === item.id ? "bg-white/20" : isDarkMode ? "bg-gray-700 text-indigo-400" : "bg-indigo-100 text-indigo-700")}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className={cn("mt-8 pt-8 border-t", isDarkMode ? "border-gray-800" : "border-gray-200")}>
            <div className={cn("p-4 rounded-lg mb-4", isDarkMode ? "bg-gray-800" : "bg-gray-100")}>
              <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>أنت مسجل بصفة</p>
              <p className={cn("font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{user?.name || 'تاجر'}</p>
            </div>
            <button
              onClick={handleLogout}
              className={cn("w-full px-4 py-3 rounded-lg font-normal flex items-center justify-center gap-2 transition-all", isDarkMode ? "bg-red-900/20 text-red-400 hover:bg-red-900/40" : "bg-red-50 text-red-600 hover:bg-red-100")}
            >
              <LogOut size={16} /> تسجيل خروج
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className={cn("text-3xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                {currentSection === 'overview' ? 'ملخص المبيعات' :
                 currentSection === 'companies' ? 'إدارة الشركات' :
                 currentSection === 'products' ? 'إدارة المنتجات' :
                 currentSection === 'codes' ? 'إدارة الأكواد' :
                 currentSection === 'orders' ? 'الطلبات' :
                 currentSection === 'customers' ? 'العملاء' :
                 currentSection === 'settings' ? 'الإعدادات' : 'اللوحة'}
              </h1>
            </div>
            <button
              onClick={() => setShowMobileDrawer(true)}
              className={cn("md:hidden p-2 rounded-lg", isDarkMode ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900")}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Overview Section */}
          {currentSection === 'overview' && (
            <div className="space-y-8">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: '📊 إجمالي الطلبات', value: stats.totalOrders.toString(), color: 'indigo' },
                  { label: '💰 الإيرادات', value: `${Math.round(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : parseFloat(String(stats.totalRevenue) || '0')).toLocaleString('en-US')} د.ع`, color: 'green' },
                  { label: '📦 الأكواد المتاحة', value: stats.activeCodes.toString(), color: 'blue' },
                  { label: '✅ الأكواد المستخدمة', value: (stats.totalCodes - stats.activeCodes).toString(), color: 'purple' },
                ].map((stat, i) => (
                  <Card key={i} className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                    <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>{stat.label}</p>
                    <p className={cn("text-2xl font-normal", stat.color === 'indigo' ? 'text-indigo-600' : stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : 'text-purple-600')}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>📈 متوسط قيمة الطلب</p>
                  <p className={cn("text-2xl font-normal text-blue-600")}>{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString('en-US') : '0'} د.ع</p>
                </Card>
                <Card className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>📊 نسبة الاستخدام</p>
                  <p className={cn("text-2xl font-normal text-orange-600")}>{stats.totalCodes > 0 ? Math.round(((stats.totalCodes - stats.activeCodes) / stats.totalCodes) * 100) : 0}%</p>
                </Card>
                <Card className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>🏢 إجمالي الشركات</p>
                  <p className={cn("text-2xl font-normal text-green-600")}>{companies.length}</p>
                </Card>
              </div>

              {/* Top Products & Companies Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                    <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>🔥 أعلى المنتجات</h3>
                  </div>
                  <div className="p-6">
                    {products.slice(0, 5).length > 0 ? (
                      <div className="space-y-3">
                        {products.slice(0, 5).map((p, i) => (
                          <div key={p.id} className="flex justify-between items-center pb-3 border-b last:border-b-0" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                            <div>
                              <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{i + 1}. {p.company_name}</p>
                              <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>المبلغ: {p.amount?.toLocaleString('en-US')}</p>
                            </div>
                            <span className={cn("text-sm font-normal font-mono", isDarkMode ? "text-green-400" : "text-green-600")}>{p.codes ? p.codes.length : 0} أكواد</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={cn("text-center py-8", isDarkMode ? "text-gray-500" : "text-gray-400")}>لا توجد منتجات</p>
                    )}
                  </div>
                </Card>

                {/* Top Companies */}
                <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                    <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>🏆 أعلى الشركات</h3>
                  </div>
                  <div className="p-6">
                    {companies.length > 0 ? (
                      <div className="space-y-3">
                        {companies.slice(0, 5).map((c, i) => (
                          <div key={c.id} className="flex justify-between items-center pb-3 border-b last:border-b-0" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                            <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{i + 1}. {c.name}</p>
                            <span className={cn("text-xs px-2 py-1 rounded", isDarkMode ? "bg-indigo-900 text-indigo-300" : "bg-indigo-100 text-indigo-700")}>نشطة</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={cn("text-center py-8", isDarkMode ? "text-gray-500" : "text-gray-400")}>لا توجد شركات</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Companies Section */}
          {currentSection === 'companies' && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setCompanyForm({ name: '', logo_url: '' });
                  setIsEditingCompany(null);
                  setShowCompanyModal(true);
                }}
                className="px-6 py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus size={18} /> إضافة شركة جديدة
              </button>

              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <table className="w-full">
                  <thead>
                    <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الاسم</th>
                      <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => (
                      <tr key={company.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                        <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{company.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setCompanyForm({ name: company.name, logo_url: company.logo_url || '' });
                                setIsEditingCompany(company.id);
                                setShowCompanyModal(true);
                              }}
                              className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/60" : "text-blue-600 hover:bg-blue-50")}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm('هل تريد حذف هذه الشركة؟')) return;
                                try {
                                  const res = await fetch(`/api/topup/companies/${company.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    alert('تم الحذف بنجاح');
                                    const updatedRes = await fetch(`/api/topup/companies/${topupStoreId}`);
                                    const data = await updatedRes.json();
                                    setCompanies(Array.isArray(data) ? data : []);
                                  }
                                } catch (error) {
                                  console.error('Error deleting company:', error);
                                  alert('حدث خطأ');
                                }
                              }}
                              className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/60" : "text-red-600 hover:bg-red-50")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Products Section */}
          {currentSection === 'products' && (
            <div className="space-y-6">
              <button
                onClick={() => {
                  setProductForm({ company_id: '', amount: '', price: '', bulk_price: '', quantity_type: 'unit', category_id: '' });
                  setIsEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="px-6 py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus size={18} /> إضافة منتج جديد
              </button>

              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الشركة</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>المبلغ</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>السعر</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>سعر الجملة</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الإجراءات</th>
                      </tr>
                    </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                        <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.company_name}</td>
                        <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.amount?.toLocaleString('en-US')}</td>
                        <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.price?.toLocaleString('en-US')}</td>
                        <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.bulk_price ? product.bulk_price.toLocaleString('en-US') : '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setProductForm({ company_id: product.company_id.toString(), amount: product.amount.toString(), price: product.price.toString(), bulk_price: product.bulk_price?.toString() || '', category_id: '', quantity_type: product.quantity_type || 'unit' });
                                setIsEditingProduct(product.id);
                                setShowProductModal(true);
                              }}
                              className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/60" : "text-blue-600 hover:bg-blue-50")}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedProductForCodes(product.id);
                                setShowCodeUploadModal(true);
                              }}
                              className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-green-900/30 text-green-400 hover:bg-green-900/60" : "text-green-600 hover:bg-green-50")}
                            >
                              <Upload size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm('هل تريد حذف هذا المنتج؟')) return;
                                try {
                                  const res = await fetch(`/api/topup/products/${product.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    alert('تم الحذف بنجاح');
                                    const updatedRes = await fetch(`/api/topup/products/${topupStoreId}`);
                                    const data = await updatedRes.json();
                                    setProducts(Array.isArray(data) ? data : []);
                                  }
                                } catch (error) {
                                  console.error('Error deleting product:', error);
                                  alert('حدث خطأ');
                                }
                              }}
                              className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/60" : "text-red-600 hover:bg-red-50")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          )}

          {/* Codes Section */}
          {currentSection === 'codes' && (
            <div className="space-y-6">
              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الشركة</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>المبلغ</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>عدد الأكواد</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الأكواد</th>
                      </tr>
                    </thead>
                  <tbody>
                    {products.filter(p => p.codes && p.codes.length > 0).length > 0 ? (
                      products.map(product => (
                        product.codes && product.codes.length > 0 && (
                          <tr key={product.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.company_name}</td>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.amount?.toLocaleString('en-US')}</td>
                            <td className={cn("px-6 py-4 font-semibold", isDarkMode ? "text-green-400" : "text-green-600")}>{product.codes.length}</td>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                              <div className="flex flex-wrap gap-2">
                                {product.codes.slice(0, 5).map((code, idx) => (
                                  <span key={idx} className={cn("px-2 py-1 text-xs rounded", isDarkMode ? "bg-gray-700 text-blue-300" : "bg-blue-50 text-blue-700")}>
                                    {code}
                                  </span>
                                ))}
                                {product.codes.length > 5 && (
                                  <span className={cn("px-2 py-1 text-xs rounded", isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")}>
                                    +{product.codes.length - 5} أكثر
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    ) : (
                      <tr className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td colSpan={4} className={cn("px-6 py-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          🔑 الأكواد المرفوعة ستظهر هنا
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          )}
          {currentSection === 'customers' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCustomerForm({ name: '', phone: '', email: '', password: '', customer_type: 'cash', credit_limit: '0', starting_balance: '' });
                    setIsEditingCustomer(null);
                    setShowCustomerModal(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus size={18} /> إضافة عميل جديد
                </button>
              </div>

              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الاسم</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الهاتف</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>النوع</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>حد الائتمان</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الرصيد الابتدائي</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الديون الحالية</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الإجراءات</th>
                      </tr>
                    </thead>
                  <tbody>
                    {customers.length > 0 ? (
                      customers.map(customer => (
                        <tr key={customer.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                          <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{customer.name}</td>
                          <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{customer.phone}</td>
                          <td className={cn("px-6 py-4")}>
                            <span className={cn("text-xs px-2 py-1 rounded", customer.customer_type === 'reseller' ? (isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700") : (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"))}>
                              {customer.customer_type === 'reseller' ? '🏪 جملة' : '👤 مفرد'}
                            </span>
                          </td>
                          <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{Math.round(customer.credit_limit)?.toLocaleString('en-US')} د.ع</td>
                          <td className={cn("px-6 py-4 font-semibold", isDarkMode ? "text-purple-300" : "text-purple-700")}>{Math.round(customer.starting_balance || 0)?.toLocaleString('en-US')} د.ع</td>
                          <td className={cn("px-6 py-4 font-semibold", customer.current_debt > customer.credit_limit ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-yellow-400" : "text-yellow-600"))}>{Math.round(customer.current_debt)?.toLocaleString('en-US')} د.ع</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedCustomerForPayments(customer);
                                  setShowPaymentsModal(true);
                                  // Fetch payments for this customer
                                  fetch(`/api/customer-payments/${user?.store_id}/${customer.id}`)
                                    .then(r => r.json())
                                    .then(data => setPayments(Array.isArray(data) ? data : []));
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-purple-900/30 text-purple-400 hover:bg-purple-900/60" : "text-purple-600 hover:bg-purple-50")}
                                title="التسديدات"
                              >
                                <CreditCard size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedCustomerStatement(customer);
                                  setShowCustomerStatement(true);
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-green-900/30 text-green-400 hover:bg-green-900/60" : "text-green-600 hover:bg-green-50")}
                                title="كشف الحساب"
                              >
                                <FileText size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  setCustomerForm({ name: customer.name, phone: customer.phone, email: customer.email || '', password: customer.password || '', customer_type: customer.customer_type, credit_limit: customer.credit_limit.toString(), starting_balance: (customer.starting_balance || 0).toString() });
                                  setIsEditingCustomer(customer.id);
                                  setShowCustomerModal(true);
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/60" : "text-blue-600 hover:bg-blue-50")}
                                title="تعديل"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!confirm('هل تريد حذف هذا العميل؟')) return;
                                  try {
                                    const res = await fetch(`/api/topup/customers/${customer.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      alert('تم الحذف بنجاح');
                                      const updatedRes = await fetch(`/api/topup/customers/${topupStoreId}`);
                                      const data = await updatedRes.json();
                                      setCustomers(Array.isArray(data) ? data : []);
                                    }
                                  } catch (error) {
                                    console.error('Error deleting customer:', error);
                                    alert('حدث خطأ');
                                  }
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/60" : "text-red-600 hover:bg-red-50")}
                                title="حذف"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td colSpan={6} className={cn("px-6 py-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          لا توجد عملاء مسجلين حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          )}

          {/* Orders Section */}
          {currentSection === 'orders' && (
            <div className="space-y-6">
              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className={cn("p-6 border-b font-normal", isDarkMode ? "border-gray-700 text-white" : "border-gray-200 text-gray-900")}>
                  طلبات البيع
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>رقم الطلب</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>العميل</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>المنتج</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>المبلغ</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الحالة</th>
                        <th className={cn("px-6 py-3 text-center text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>الإجراءات</th>
                      </tr>
                    </thead>
                  <tbody>
                    {orders && orders.length > 0 ? (
                      orders.map((order: any) => (
                        <tr key={order.id} className={cn("border-t hover:bg-opacity-50", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50")}>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>#{order.id}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.phone || 'غير محدد'}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.company_name && order.product_amount ? `${order.company_name} - ${order.product_amount}` : order.company_name || 'منتج'}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.total_amount} د.ع</td>
                          <td className={cn("px-6 py-4 text-right text-sm font-medium", isDarkMode ? order.status === 'completed' ? "text-green-400" : order.status === 'pending' ? "text-yellow-400" : "text-red-400" : order.status === 'completed' ? "text-green-600" : order.status === 'pending' ? "text-yellow-600" : "text-red-600")}>
                            {order.status === 'completed' ? '✓ مكتمل' : order.status === 'pending' ? '⏳ معلق' : order.status === 'returned' ? '↩️ مسترجع' : 'ملغي'}
                          </td>
                          <td className={cn("px-6 py-4 text-center")}>
                            <div className="flex items-center justify-center gap-2">
                              {(order.status === 'completed' || order.status === 'returned') && (
                                <button
                                  onClick={async () => {
                                    const orderType = order.status === 'returned' ? 'المسترجع' : 'المكتمل';
                                    if (!confirm(`هل تريد حذف الطلب ${orderType} #${order.id}؟`)) return;
                                    try {
                                      const res = await fetch(`/api/topup/orders/${order.id}`, { 
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      if (res.ok) {
                                        alert('✓ تم حذف الطلب بنجاح');
                                        refreshDashboardData();
                                      } else {
                                        const data = await res.json();
                                        alert(`❌ ${data.error || 'فشل الحذف'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error deleting order:', error);
                                      alert('❌ حدث خطأ في الحذف');
                                    }
                                  }}
                                  className={cn("inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200", isDarkMode ? "bg-red-900/40 text-red-300 hover:bg-red-900/70 hover:text-red-200" : "bg-red-100 text-red-600 hover:bg-red-200")}
                                  title="حذف الطلب"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td colSpan={6} className={cn("px-6 py-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          لا توجد طلبات حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </Card>
            </div>
          )}
          {currentSection === 'settings' && (
            <div className="space-y-6">
              {/* Store Information Card */}
              <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>⚙️ إعدادات المتجر</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>🏪 اسم المتجر</label>
                    <input
                      type="text"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      placeholder="أدخل اسم المتجر"
                      className={cn("w-full px-4 py-3 rounded-lg border font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")}
                    />
                  </div>

                  {/* Store Logo */}
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>🖼️ شعار المتجر</label>
                    <label className="w-full px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all font-normal block"
                      style={{
                        borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                        opacity: logoUploadLoading ? 0.6 : 1
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                          console.log('📁 File dropped for upload:', {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            lastModified: file.lastModified
                          });
                          handleStoreLogoUpload(file);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('📁 File selected for upload:', {
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              lastModified: file.lastModified
                            });
                            handleStoreLogoUpload(file);
                          }
                        }}
                        disabled={logoUploadLoading}
                        className="hidden"
                      />
                      <div className={cn("text-center text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                        {logoUploadLoading ? '⏳ جاري تحميل الشعار...' : '📤 اختر الصورة أو اسحبها هنا'}
                      </div>
                    </label>
                    {(logoPreview || storeSettings.logo_url) && (
                      <div className={cn("mt-3 p-4 rounded-lg flex items-center justify-center", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                        <img 
                          key={`preview-${(logoPreview || storeSettings.logo_url).substring(logoPreview ? logoPreview.length - 30 : 0, (logoPreview || storeSettings.logo_url).length - 30)}`}
                          src={logoPreview || storeSettings.logo_url} 
                          alt="Store Logo" 
                          className="max-h-32 max-w-32 object-contain rounded"
                          onError={(e) => {
                            console.error('Error loading preview image');
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('✓ Preview image loaded successfully');
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveStoreSettings}
                    className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    💾 حفظ الإعدادات
                  </button>
                </div>
              </Card>

              {/* Statistics Card */}
              <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>📊 الإحصائيات</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>📊 إجمالي الطلبات</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-indigo-400" : "text-indigo-600")}>{stats.totalOrders}</p>
                    </div>
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>💰 إجمالي الإيرادات</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-green-400" : "text-green-600")}>{Math.round(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : parseFloat(String(stats.totalRevenue) || '0')).toLocaleString('en-US')} د.ع</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>📦 الأكواد المتاحة</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>{stats.activeCodes}</p>
                    </div>
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>✅ المستخدمة</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-purple-400" : "text-purple-600")}>{stats.totalCodes - stats.activeCodes}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Store Info Card */}
              <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ℹ️ معلومات المتجر</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>معرّف المتجر:</span>
                    <span className={cn("font-mono font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{topupStoreId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>عدد الشركات:</span>
                    <span className={cn("font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{companies.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>عدد المنتجات:</span>
                    <span className={cn("font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{products.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-md shadow-2xl", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingCompany ? 'تعديل الشركة' : 'إضافة شركة جديدة'}</h3>
              <button onClick={() => setShowCompanyModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="اسم الشركة (مثال: Zain, Asiacell)"
                className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
              />
              <button onClick={saveCompany} className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700">
                {isEditingCompany ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={() => setShowProductModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>الشركة</label>
                <select
                  value={productForm.company_id}
                  onChange={(e) => setProductForm({ ...productForm, company_id: e.target.value })}
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200")}
                >
                  <option value="" className={isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}>اختر شركة</option>
                  {companies.map(c => <option key={c.id} value={c.id} className={isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>المبلغ</label>
                <input
                  type="number"
                  value={productForm.amount}
                  onChange={(e) => setProductForm({ ...productForm, amount: e.target.value })}
                  placeholder="المبلغ (5000, 10000...)"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>السعر</label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="السعر (بالدينار)"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>سعر الجملة</label>
                <input
                  type="number"
                  value={productForm.bulk_price}
                  onChange={(e) => setProductForm({ ...productForm, bulk_price: e.target.value })}
                  placeholder="سعر الجملة (اختياري)"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <button onClick={saveProduct} className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700">
                {isEditingProduct ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Code Upload Modal */}
      {showCodeUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-md shadow-2xl", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>رفع الأكواد</h3>
              <button onClick={() => setShowCodeUploadModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-600")}>
                رفع ملف نصي يحتوي على الأكواد (code per line)
              </p>
              <label className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all", uploadedFile ? "border-green-500 bg-green-50/10" : isDarkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300")}>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".txt,.csv"
                />
                {uploadedFile ? (
                  <div className={cn("font-normal", isDarkMode ? "text-green-400" : "text-green-600")}>{uploadedFile.name}</div>
                ) : (
                  <div>
                    <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>اختر ملف أو اسحبه هنا</p>
                    <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>TXT أو CSV</p>
                  </div>
                )}
              </label>
              <button onClick={handleUploadCodes} className="w-full py-3 bg-green-600 text-white font-normal rounded-lg hover:bg-green-700">
                رفع الأكواد
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}</h3>
              <button onClick={() => setShowCustomerModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>الاسم</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="اسم العميل"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>رقم الهاتف</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="07xxxxxxxxx"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>كلمة المرور</label>
                <input
                  type="password"
                  value={customerForm.password}
                  onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                  placeholder="••••••••"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>نوع العميل</label>
                <select
                  value={customerForm.customer_type}
                  onChange={(e) => setCustomerForm({ ...customerForm, customer_type: e.target.value })}
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200")}
                >
                  <option value="cash">👤 عميل مفرد (نقدي)</option>
                  <option value="reseller">🏪 نقطة بيع (جملة)</option>
                </select>
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>حد الائتمان</label>
                <input
                  type="number"
                  value={customerForm.credit_limit}
                  onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                  placeholder="0"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>💵 الرصيد الابتدائي (اختياري)</label>
                <input
                  type="number"
                  value={customerForm.starting_balance}
                  onChange={(e) => setCustomerForm({ ...customerForm, starting_balance: e.target.value })}
                  placeholder="0"
                  className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                />
              </div>
              <button onClick={saveCustomer} className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700">
                {isEditingCustomer ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payments Management Modal */}
      {showPaymentsModal && selectedCustomerForPayments && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center sticky top-0", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <div>
                <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>إدارة التسديدات</h3>
                <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>{selectedCustomerForPayments.name}</p>
              </div>
              <button onClick={() => setShowPaymentsModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info Summary */}
              <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الاسم</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerForPayments.name}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الهاتف</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerForPayments.phone}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>البريد الإلكتروني</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerForPayments.email || '-'}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>النوع</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>
                    {selectedCustomerForPayments.customer_type === 'reseller' ? '🏪 جملة' : '👤 مفرد'}
                  </p>
                </div>
              </div>

              {/* Payments Table */}
              <div className={cn("border rounded-lg overflow-hidden", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                <table className="w-full">
                  <thead>
                    <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                      <th className={cn("px-4 py-3 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>المبلغ</th>
                      <th className={cn("px-4 py-3 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>طريقة الدفع</th>
                      <th className={cn("px-4 py-3 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الملاحظات</th>
                      <th className={cn("px-4 py-3 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>التاريخ</th>
                      <th className={cn("px-4 py-3 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={cn("px-4 py-8 text-center", isDarkMode ? "text-gray-400 bg-gray-800" : "text-gray-500 bg-gray-50")}>
                          لا توجد تسديدات مسجلة
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment: any, index: number) => (
                        <tr key={payment.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                          <td className={cn("px-4 py-3 font-normal", isDarkMode ? "text-white" : "text-gray-900")}>
                            {Math.round(payment.amount)?.toLocaleString('en-US')} د.ع
                          </td>
                          <td className={cn("px-4 py-3 font-normal", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                            {payment.payment_method || '-'}
                          </td>
                          <td className={cn("px-4 py-3 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                            {payment.notes || '-'}
                          </td>
                          <td className={cn("px-4 py-3 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                            {new Date(payment.created_at).toLocaleDateString('ar-IQ')}
                          </td>
                          <td className="px-4 py-3 flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setPaymentForm({
                                  amount: payment.amount.toString(),
                                  payment_method: payment.payment_method || '',
                                  notes: payment.notes || ''
                                });
                                setIsEditingPayment(payment.id);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('هل تأكد من حذف هذا التسديد؟')) {
                                  fetch(`/api/customer-payments/${payment.id}`, { method: 'DELETE' })
                                    .then(r => r.json())
                                    .then(async () => {
                                      // Remove from payments list
                                      setPayments(payments.filter((p: any) => p.id !== payment.id));
                                      // Refetch customers to update debt
                                      const customersResponse = await fetch(`/api/topup/customers/${user?.store_id}`);
                                      const customersData = await customersResponse.json();
                                      setCustomers(Array.isArray(customersData) ? customersData : []);
                                    })
                                    .catch(err => alert('خطأ في الحذف: ' + err.message));
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Form */}
              <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                <h4 className={cn("font-normal text-sm mb-4", isDarkMode ? "text-white" : "text-gray-900")}>
                  {isEditingPayment ? '✏️ تعديل التسديد' : '➕ إضافة تسديد جديد'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>المبلغ (د.ع)</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0"
                      className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900")}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>طريقة الدفع</label>
                    <input
                      type="text"
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                      placeholder="تحويل / نقد / شيك..."
                      className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900")}
                    />
                  </div>
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>الملاحظات</label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="ملاحظات اختيارية..."
                      className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900")}
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={async () => {
                      if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
                        alert('يرجى إدخال مبلغ صحيح');
                        return;
                      }

                      try {
                        if (isEditingPayment) {
                          // Update payment
                          const response = await fetch(`/api/customer-payments/${isEditingPayment}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              amount: parseFloat(paymentForm.amount),
                              payment_method: paymentForm.payment_method,
                              notes: paymentForm.notes
                            })
                          });
                          if (response.ok) {
                            alert('تم تحديث التسديد بنجاح');
                            // Refetch both payments and customers to update debt
                            const [paymentsResponse, customersResponse] = await Promise.all([
                              fetch(`/api/customer-payments/${user?.store_id}/${selectedCustomerForPayments.id}`),
                              fetch(`/api/topup/customers/${user?.store_id}`)
                            ]);
                            const paymentsData = await paymentsResponse.json();
                            const customersData = await customersResponse.json();
                            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
                            setCustomers(Array.isArray(customersData) ? customersData : []);
                            setPaymentForm({ amount: '', payment_method: '', notes: '' });
                            setIsEditingPayment(null);
                          }
                        } else {
                          // Add new payment
                          const response = await fetch('/api/customer-payments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              customer_id: selectedCustomerForPayments.id,
                              store_id: user?.store_id,
                              amount: parseFloat(paymentForm.amount),
                              payment_method: paymentForm.payment_method,
                              notes: paymentForm.notes
                            })
                          });
                          if (response.ok) {
                            alert('تم إضافة التسديد بنجاح');
                            // Refetch both payments and customers to update debt
                            const [paymentsResponse, customersResponse] = await Promise.all([
                              fetch(`/api/customer-payments/${user?.store_id}/${selectedCustomerForPayments.id}`),
                              fetch(`/api/topup/customers/${user?.store_id}`)
                            ]);
                            const paymentsData = await paymentsResponse.json();
                            const customersData = await customersResponse.json();
                            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
                            setCustomers(Array.isArray(customersData) ? customersData : []);
                            setPaymentForm({ amount: '', payment_method: '', notes: '' });
                          }
                        }
                      } catch (error) {
                        alert('خطأ: ' + (error as any).message);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-normal transition-all"
                  >
                    {isEditingPayment ? '💾 حفظ التعديلات' : '➕ إضافة التسديد'}
                  </button>
                  {isEditingPayment && (
                    <button
                      onClick={() => {
                        setPaymentForm({ amount: '', payment_method: '', notes: '' });
                        setIsEditingPayment(null);
                      }}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-normal transition-all"
                    >
                      ❌ إلغاء
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowPaymentsModal(false)}
                className={cn("w-full py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300")}
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {showCustomerStatement && selectedCustomerStatement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center sticky top-0", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <div>
                <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>كشف حساب العميل</h3>
                <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>{selectedCustomerStatement.name}</p>
              </div>
              <button onClick={() => setShowCustomerStatement(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className={cn("grid grid-cols-2 gap-4 p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الاسم</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerStatement.name}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>الهاتف</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerStatement.phone}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>البريد الإلكتروني</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>{selectedCustomerStatement.email || '-'}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>النوع</p>
                  <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>
                    {selectedCustomerStatement.customer_type === 'reseller' ? '🏪 جملة' : '👤 مفرد'}
                  </p>
                </div>
              </div>

              {/* Credit Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className={cn("p-4 border-none", isDarkMode ? "bg-blue-900/20" : "bg-blue-50")}>
                  <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-blue-300" : "text-blue-600")}>حد الائتمان</p>
                  <p className={cn("text-lg font-bold text-blue-600")}>{Math.round(selectedCustomerStatement.credit_limit)?.toLocaleString('en-US')} د.ع</p>
                </Card>
                <Card className={cn("p-4 border-none", isDarkMode ? "bg-yellow-900/20" : "bg-yellow-50")}>
                  <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-yellow-300" : "text-yellow-600")}>الديون الحالية</p>
                  <p className={cn("text-lg font-bold text-yellow-600")}>{Math.round(selectedCustomerStatement.current_debt)?.toLocaleString('en-US')} د.ع</p>
                </Card>
                <Card className={cn("p-4 border-none", (selectedCustomerStatement.credit_limit - selectedCustomerStatement.current_debt) > 0 ? (isDarkMode ? "bg-green-900/20" : "bg-green-50") : (isDarkMode ? "bg-red-900/20" : "bg-red-50"))}>
                  <p className={cn("text-xs font-normal mb-2", (selectedCustomerStatement.credit_limit - selectedCustomerStatement.current_debt) > 0 ? (isDarkMode ? "text-green-300" : "text-green-600") : (isDarkMode ? "text-red-300" : "text-red-600"))}>الرصيد المتاح</p>
                  <p className={cn("text-lg font-bold", (selectedCustomerStatement.credit_limit - selectedCustomerStatement.current_debt) > 0 ? "text-green-600" : "text-red-600")}>{Math.round(Math.max(0, selectedCustomerStatement.credit_limit - selectedCustomerStatement.current_debt)).toLocaleString('en-US')} د.ع</p>
                </Card>
              </div>

              {/* Transactions Info */}
              <div className={cn("p-4 rounded-lg border-2 border-dashed", isDarkMode ? "border-gray-600" : "border-gray-300")}>
                <p className={cn("text-sm font-normal text-center", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  📋 سيتم عرض سجل العمليات هنا<br/>
                  <span className="text-xs">(الطلبات والدفعات والتسديدات)</span>
                </p>
              </div>

              <button
                onClick={() => setShowCustomerStatement(false)}
                className={cn("w-full py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300")}
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileDrawer(false)}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "relative w-64 h-screen overflow-y-auto border-l",
              isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
              "z-50"
            )}
            dir="rtl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className={cn("font-normal text-sm", isDarkMode ? "text-gray-100" : "text-gray-900")}>الإدارة</h2>
                    <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>متجر البطاقات</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className={cn("p-1 rounded-lg", isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100")}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'ملخص المبيعات', icon: BarChart3, badge: null },
                  { id: 'companies', label: 'الشركات', icon: StoreIcon, badge: companies.length },
                  { id: 'products', label: 'المنتجات', icon: CreditCard, badge: products.length },
                  { id: 'codes', label: 'الأكواد', icon: Ticket, badge: products.reduce((sum: number, p: any) => sum + (p.codes?.length || 0), 0) },
                  { id: 'customers', label: 'العملاء', icon: Users, badge: customers.length },
                  { id: 'orders', label: 'الطلبات', icon: ShoppingCart, badge: orders.filter((o: any) => o.status !== 'returned').length },
                  { id: 'settings', label: 'الإعدادات', icon: Settings, badge: null },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(`/topup-merchant/${item.id}`);
                      setShowMobileDrawer(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-normal text-right",
                      currentSection === item.id
                        ? "bg-indigo-600 text-white shadow-lg"
                        : isDarkMode ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      {item.label}
                    </div>
                    {item.badge !== null && item.badge > 0 && (
                      <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", currentSection === item.id ? "bg-white/20" : isDarkMode ? "bg-gray-700 text-indigo-400" : "bg-indigo-100 text-indigo-700")}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className={cn("mt-8 pt-8 border-t", isDarkMode ? "border-gray-800" : "border-gray-200")}>
                <div className={cn("p-4 rounded-lg mb-4", isDarkMode ? "bg-gray-800" : "bg-gray-100")}>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>أنت مسجل بصفة</p>
                  <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-100" : "text-gray-900")}>{user?.name || 'تاجر'}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileDrawer(false);
                  }}
                  className={cn("w-full px-4 py-3 rounded-lg font-normal flex items-center justify-center gap-2 transition-all", isDarkMode ? "bg-red-900/20 text-red-400 hover:bg-red-900/40" : "bg-red-50 text-red-600 hover:bg-red-100")}
                >
                  <LogOut size={16} /> تسجيل خروج
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ========== TOP-UP SYSTEM COMPONENTS ==========

const TopupStorefront = () => {
  const { slug: storeId } = useParams();
  const { isDarkMode } = useTheme();
  const { primaryColor } = useSettingsStore();
  const { addItem, items: cartItems } = useTopupCartStore();
  const navigate = useNavigate();
  
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [storeLogo, setStoreLogo] = useState<string>('');
  const [actualStoreId, setActualStoreId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auth state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [showAccountStatement, setShowAccountStatement] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Purchase form state
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ name: '', phone: '', customer_type: 'cash' });
  
  // Credit system states
  const [creditStatus, setCreditStatus] = useState<any>(null);
  const [creditError, setCreditError] = useState<string>('');
  const [canProceedWithPurchase, setCanProceedWithPurchase] = useState(true);
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  // Load and sync store logo from localStorage
  useEffect(() => {
    if (!actualStoreId) return;

    const loadStoreLogo = () => {
      console.log('🔍 TopupStorefront - Loading logo for actualStoreId:', actualStoreId);
      const storeSettings = localStorage.getItem(`storeSettings_${actualStoreId}`);
      console.log('🔍 localStorage key:', `storeSettings_${actualStoreId}`);
      console.log('🔍 Found in localStorage:', !!storeSettings);
      
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          console.log('🔍 Parsed settings:', {
            has_logo: !!parsed.logo_url,
            logo_length: parsed.logo_url?.length,
            ends_with: parsed.logo_url?.substring(parsed.logo_url.length - 30)
          });
          if (parsed.logo_url && parsed.logo_url.length > 100) {
            console.log('✅ Setting store logo. Length:', parsed.logo_url.length);
            setStoreLogo(parsed.logo_url);
          }
        } catch (err) {
          console.error('❌ Error parsing store settings:', err);
        }
      } else {
        console.log('⚠️ No store settings found in localStorage');
      }
    };

    // Load on mount
    loadStoreLogo();

    // Listen for custom event from settings panel
    const handleSettingsUpdate = (e: any) => {
      console.log('🔔 TopupStorefront received storeSettingsUpdated event, loading logo');
      loadStoreLogo();
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
    };
  }, [actualStoreId]);

  useEffect(() => {
    if (!storeId) return;
    
    console.log(`🚀 TopupStorefront mount with storeId: ${storeId}`);
    console.log(`📡 API_BASE_URL: "${API_BASE_URL}"`);
    
    const fetchData = async () => {
      try {
        // إضافة timestamp لفرض جلب البيانات الجديدة من قاعدة البيانات
        const timestamp = Date.now();
        console.log('🔍 Fetching products with timestamp:', timestamp);
        
        // Create AbortController with 30-second timeout (Railway can be slow)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('⏱️ Fetch timeout after 30 seconds');
          controller.abort();
        }, 30000);
        
        // First, get store by slug to get actual store ID
        let storeRes;
        const storeUrl = `/api/stores/slug/${storeId}?_t=${timestamp}`;
        console.log(`📍 Fetching store from: ${storeUrl}`);
        console.log(`   Full URL will be: ${API_BASE_URL ? API_BASE_URL + storeUrl : storeUrl}`);
        
        try {
          const resp = await fetch(storeUrl, { 
            cache: 'no-store',
            signal: controller.signal 
          });
          
          if (!resp.ok) {
            console.error('❌ Store fetch failed:', resp.status, resp.statusText);
            clearTimeout(timeoutId);
            alert(`خطأ: لم تتمكن من جلب بيانات المتجر (${resp.status})`);
            setLoading(false);
            return;
          }
          
          storeRes = await resp.json();
          console.log('✅ Store response received:', storeRes);
        } catch (e) {
          clearTimeout(timeoutId);
          if (e instanceof TypeError && e.message.includes('aborted')) {
            console.error('❌ Store fetch timeout');
            alert('انتهت مهلة الاتصال بالمتجر. يرجى المحاولة لاحقاً');
          } else {
            console.error('❌ Store fetch error:', e);
            alert(`خطأ في جلب المتجر: ${(e as Error).message}`);
          }
          setLoading(false);
          return;
        }
        
        if (!storeRes || storeRes.error) {
          clearTimeout(timeoutId);
          console.error('Store not found:', storeRes?.error);
          alert(`متجر غير موجود: ${storeRes?.error}`);
          setLoading(false);
          return;
        }
        
        const actualStoreId = storeRes.id;
        console.log('✅ Store found:', { storeId, actualStoreId, store_name: storeRes.store_name });
        setActualStoreId(actualStoreId);
        setStoreInfo(storeRes);
        
        // Fetch companies, categories, products with timeout
        const companiesRes = await fetch(`/api/topup/companies/${actualStoreId}?_t=${timestamp}`, { 
          cache: 'no-store',
          signal: controller.signal 
        }).then(async r => {
          if (!r.ok) {
            console.warn('⚠️ Companies fetch returned status:', r.status);
            return [];
          }
          const data = await r.json();
          console.log('✅ Companies fetched:', Array.isArray(data) ? data.length : 0);
          return Array.isArray(data) ? data : [];
        }).catch(e => {
          console.warn('⚠️ Companies fetch error (non-blocking):', e.message);
          return [];
        });
        
        const categoriesRes = await fetch(`/api/topup/categories/${actualStoreId}?_t=${timestamp}`, { 
          cache: 'no-store',
          signal: controller.signal 
        }).then(async r => {
          if (!r.ok) {
            console.warn('⚠️ Categories fetch returned status:', r.status);
            return [];
          }
          const data = await r.json();
          console.log('✅ Categories fetched:', Array.isArray(data) ? data.length : 0);
          return Array.isArray(data) ? data : [];
        }).catch(e => {
          console.warn('⚠️ Categories fetch error (non-blocking):', e.message);
          return [];
        });
        
        const productsRes = await fetch(`/api/topup/products/${actualStoreId}?_t=${timestamp}`, { 
          cache: 'no-store',
          signal: controller.signal 
        }).then(async r => {
          if (!r.ok) {
            console.warn('⚠️ Products fetch returned status:', r.status);
            return [];
          }
          const data = await r.json();
          console.log('✅ Products fetched:', Array.isArray(data) ? data.length : 0);
          return Array.isArray(data) ? data : [];
        }).catch(e => {
          console.warn('⚠️ Products fetch error (non-blocking):', e.message);
          return [];
        });
        
        clearTimeout(timeoutId);
        
        console.log('📊 Data Summary:', {
          companies: companiesRes.length,
          categories: categoriesRes.length,
          products: productsRes.length
        });
        
        setCompanies(companiesRes);
        setCategories(categoriesRes);
        setProducts(productsRes);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        alert(`خطأ في تحميل البيانات: ${(error as Error).message}`);
        setLoading(false);
      }
    };
    
    // Fetch immediately on mount
    fetchData();
    
    // تحديث البيانات كل 30 ثانية للتحقق من تحديثات جديدة (بدلاً من كل 3 ثواني)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing products data...');
      fetchData();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [storeId]);

  // Load saved customer from localStorage - PRIMARY source is topupCustomer
  useEffect(() => {
    const savedCustomer = localStorage.getItem('topupCustomer');
    if (savedCustomer) {
      try {
        const customerData = JSON.parse(savedCustomer);
        setCustomer(customerData);
        // Also auto-fill purchase form from localStorage customer data
        setPurchaseForm({
          name: customerData.name || '',
          phone: customerData.phone || '',
          customer_type: customerData.customer_type || 'cash'
        });
        console.log('✅ Loaded customer from topupCustomer:', customerData);
      } catch (err) {
        console.error('⚠️ Error parsing topupCustomer:', err);
      }
    } else {
      // Fallback to customerData if topupCustomer not available
      const fallbackData = localStorage.getItem('customerData');
      if (fallbackData) {
        try {
          const data = JSON.parse(fallbackData);
          setPurchaseForm({
            name: data.name || '',
            phone: data.phone || '',
            customer_type: data.customer_type || 'cash'
          });
          console.log('✅ Loaded purchase form from customerData:', data);
        } catch (err) {
          console.error('⚠️ Error parsing customerData:', err);
        }
      }
    }
  }, [storeId]);

  // Load store logo from localStorage
  useEffect(() => {
    if (!actualStoreId) return;
    
    const loadStoreLogo = () => {
      const storeSettings = localStorage.getItem(`storeSettings_${actualStoreId}`);
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          if (parsed.logo_url) {
            setStoreLogo(parsed.logo_url);
            console.log('✅ Loaded store logo from localStorage:', {
              hasLogo: !!parsed.logo_url,
              logoLength: parsed.logo_url?.length
            });
          } else {
            setStoreLogo('');
          }
        } catch (err) {
          console.error('⚠️ Error parsing store settings:', err);
        }
      }
    };

    // Load on mount
    loadStoreLogo();

    // Listen for custom event from settings panel
    const handleSettingsUpdate = (e: any) => {
      if (e.detail?.storeId === actualStoreId) {
        console.log('🔔 Received storeSettingsUpdated event, reloading logo');
        loadStoreLogo();
      }
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `storeSettings_${actualStoreId}`) {
        console.log('🔄 Store settings changed in browser storage, reloading logo');
        loadStoreLogo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [actualStoreId]);

  // مراقب البيانات المحفوظة - تحديث تلقائي عند تغيير localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 TopupStorefront: localStorage changed - reloading customer');
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const customerData = JSON.parse(topupData);
          console.log('✅ TopupStorefront: Updated customer from topupCustomer:', customerData);
          setCustomer(customerData);
          setPurchaseForm({
            name: customerData.name || '',
            phone: customerData.phone || '',
            customer_type: customerData.customer_type || 'cash'
          });
        } catch (err) {
          console.error('⚠️ TopupStorefront: Error parsing topupCustomer:', err);
        }
      }
    };

    // استمع إلى تغييرات التخزين من نوافذ/علامات تبويب أخرى
    window.addEventListener('storage', handleStorageChange);
    
    // تحقق من تغييرات topupCustomer بشكل دوري
    const checkInterval = setInterval(() => {
      const current = localStorage.getItem('topupCustomer');
      const last = sessionStorage.getItem('lastTopupCustomerInTopupStorefront');
      if (current && current !== last) {
        sessionStorage.setItem('lastTopupCustomerInTopupStorefront', current);
        handleStorageChange();
      }
    }, 300);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  // راقب عند إغلاق نموذج الدخول للتأكد من تحميل البيانات مباشرة
  useEffect(() => {
    if (!showAuthForm) {
      console.log('💡 Auth form closed - checking localStorage');
      // تحقق من localStorage عندما يُغلق نموذج الدخول (بغض النظر عن customer state)
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const customerData = JSON.parse(topupData);
          console.log('✅ Found customer data in localStorage:', customerData);
          // تحديث customer بغض النظر عن الحالة السابقة
          setCustomer(customerData);
        } catch (err) {
          console.error('⚠️ Error loading from localStorage:', err);
        }
      } else {
        console.log('❌ No customer data in localStorage');
      }
    }
  }, [showAuthForm]);

  // Filter companies and categories - show ALL companies/categories for adding products
  const companiesWithProducts = companies; // عرض جميع الشركات
  
  const categoriesWithProducts = selectedCompany
    ? categories.filter(c => 
        products.some(p => p.category_id === c.id && p.company_id === parseInt(selectedCompany))
      ).length > 0
      ? categories.filter(c => 
          products.some(p => p.category_id === c.id && p.company_id === parseInt(selectedCompany))
        )
      : categories // إذا لم توجد فئات بمنتجات، عرض جميع الفئات
    : categories; // عرض جميع الفئات

  // تحديث selectedProduct عند تحديث البيانات للحصول على أحدث البيانات بما فيها available_codes
  useEffect(() => {
    if (selectedProduct?.id && products.length > 0) {
      const updatedProduct = products.find(p => p.id === selectedProduct.id);
      if (updatedProduct && updatedProduct.available_codes !== selectedProduct.available_codes) {
        console.log('🔄 Product codes changed! Updating:', {
          id: updatedProduct.id,
          oldCodes: selectedProduct.available_codes,
          newCodes: updatedProduct.available_codes
        });
        setSelectedProduct(prev => ({
          ...prev,
          ...updatedProduct
        }));
      }
    }
  }, [products, selectedProduct?.id]);

  const filteredProducts = products.filter(p => 
    (!selectedCompany || p.company_id === parseInt(selectedCompany))
  );

  const handleAuth = async () => {
    if (!authPhone || !authPassword) {
      alert('يرجى ملء رقم الهاتف وكلمة المرور');
      return;
    }

    setIsAuthenticating(true);
    try {
      const response = await fetch('/api/topup/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: authPhone,
          password: authPassword,
          store_id: actualStoreId
        })
      });

      const data = await response.json();
      if (response.ok) {
        const customerData = {
          customer_id: data.customer_id,
          phone: data.phone,
          name: data.name,
          email: data.email,
          customer_type: data.customer_type,
          credit_limit: data.credit_limit,
          current_debt: data.current_debt
        };
        console.log('🔐 handleAuth - customerData prepared:', customerData);
        // حذف البيانات القديمة أولاً
        localStorage.removeItem('customerData');
        localStorage.removeItem('topupCustomer');
        // حفظ البيانات الجديدة
        localStorage.setItem('topupCustomer', JSON.stringify(customerData));
        console.log('💾 handleAuth - saved to localStorage');
        console.log('✅ handleAuth - calling setCustomer:', customerData);
        setCustomer(customerData);
        setPhone(data.phone); // Auto-fill phone in purchase form
        setAuthPassword(''); // Clear password from memory
        // تأخير صغير للتأكد من تحديث state قبل إغلاق النموذج
        setTimeout(() => {
          console.log('⏱️ handleAuth - closing auth form');
          setShowAuthForm(false);
        }, 100);
        alert('تم تسجيل دخولك بنجاح! ✓');
      } else {
        alert(data.error || 'فشل تسجيل الدخول');
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      alert('حدث خطأ في تسجيل الدخول');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > Number(customer?.current_debt || 0)) {
      alert(`المبلغ المدخل أكبر من الديون الحالية (${Math.round(Number(customer?.current_debt || 0))?.toLocaleString('en-US')} د.ع)`);
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const response = await fetch('/api/topup/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          store_id: actualStoreId,
          amount: amount
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ تم تسديد المبلغ بنجاح!');
        // تحديث بيانات العميل بعد الدفع
        setCustomer({
          ...customer,
          current_debt: Math.max(0, (Number(customer.current_debt) || 0) - amount)
        });
        setPaymentAmount('');
        setShowPaymentForm(false);
      } else {
        alert(data.error || 'فشل تسديد المبلغ');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('حدث خطأ في عملية الدفع');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem('topupCustomer');
    localStorage.removeItem('customerData');
    useSettingsStore.getState().resetSettings(); // Reset settings when logging out
    setAuthPhone('');
    setAuthPassword('');
    setPhone('');
    setShowAuthForm(false);
    alert('تم تسجيل خروجك');
  };

  // Check credit before making purchase
  const checkCreditBeforePurchase = async () => {
    if (!customer?.customer_id) {
      setCreditError('');
      setCanProceedWithPurchase(true);
      setShowCreditWarning(false);
      return;
    }

    try {
      const purchaseAmount = selectedProduct.price * quantity;
      const creditRes = await fetch(`/api/customers/${customer.customer_id}/check-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: purchaseAmount })
      });

      if (creditRes.ok) {
        const creditData = await creditRes.json();
        setCreditStatus(creditData);
        
        if (!creditData.canProceed) {
          setCreditError(`❌ حد الائتمان: لا يمكنك الشراء. الرصيد الحالي: ${formatCurrency(creditData.availableCredit)}`);
          setCanProceedWithPurchase(false);
        } else if (creditData.isNearLimit) {
          setCreditError(`⚠️ تحذير: أنت قريب من حد الائتمان. ${creditData.warning}`);
          setShowCreditWarning(true);
          setCanProceedWithPurchase(true);
        } else {
          setCreditError('');
          setShowCreditWarning(false);
          setCanProceedWithPurchase(true);
        }
      }
    } catch (err) {
      console.error('Credit check error:', err);
    }
  };

  // Recalculate credit when quantity or product changes
  useEffect(() => {
    if (customer?.customer_id && selectedProduct) {
      checkCreditBeforePurchase();
    }
  }, [selectedProduct, quantity, customer]);

  // Get display price based on customer type (from purchase form or logged-in customer)
  const getDisplayPrice = () => {
    if (!selectedProduct) {
      console.warn('⚠️ getDisplayPrice: selectedProduct is null');
      return 0;
    }
    
    const customerType = customer?.customer_type || purchaseForm.customer_type;
    
    console.log('💰 getDisplayPrice DEBUG:', {
      selectedProductId: selectedProduct.id,
      selectedProductAmount: selectedProduct.amount,
      selectedProductPrice: selectedProduct.price,
      selectedProductRetailPrice: selectedProduct.retail_price,
      selectedProductWholesalePrice: selectedProduct.wholesale_price,
      customerType: customerType,
      customer: customer
    });
    
    // For reseller customers, use retail_price (which should be different from wholesale for topup)
    // For cash customers, use wholesale_price
    if (customerType === 'reseller') {
      // Try retail_price first, then wholesale_price, then base price
      if (selectedProduct.retail_price && selectedProduct.retail_price > 0) {
        console.log(`✅ Reseller: Using retail_price = ${selectedProduct.retail_price}`);
        return selectedProduct.retail_price;
      } else if (selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0) {
        console.log(`⚠️ Reseller: retail_price not available, using wholesale_price = ${selectedProduct.wholesale_price}`);
        return selectedProduct.wholesale_price;
      } else if (selectedProduct.price && selectedProduct.price > 0) {
        console.log(`⚠️ Reseller: Using base price = ${selectedProduct.price}`);
        return selectedProduct.price;
      }
    }
    
    // For cash customers, use wholesale_price
    if (selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0) {
      console.log(`✅ Cash: Using wholesale_price = ${selectedProduct.wholesale_price}`);
      return selectedProduct.wholesale_price;
    } else if (selectedProduct.price && selectedProduct.price > 0) {
      console.log(`✅ Cash: Using base price = ${selectedProduct.price}`);
      return selectedProduct.price;
    }
    
    console.error('❌ Could not determine price!');
    return 0;
  };

  const handlePurchase = async () => {
    // If not logged in, require purchase form
    if (!customer && !showPurchaseForm) {
      // Try to load saved customer data from localStorage before showing form
      const savedCustomerData = localStorage.getItem('customerData') || localStorage.getItem('topupCustomer');
      if (savedCustomerData) {
        try {
          const data = JSON.parse(savedCustomerData);
          setPurchaseForm({
            name: data.name || '',
            phone: data.phone || '',
            customer_type: data.customer_type || 'cash'
          });
        } catch (err) {
          console.error('Error loading saved customer data:', err);
        }
      }
      setShowPurchaseForm(true);
      return;
    }

    // Validate purchase form if showing
    if (showPurchaseForm) {
      if (!purchaseForm.name || !purchaseForm.phone) {
        alert('يرجى ملء اسمك ورقم تلفونك');
        return;
      }
    } else if (!customer) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }

    if (!selectedProduct) {
      alert('يرجى اختيار منتج');
      return;
    }

    // التحقق من الكمية المتوفرة
    if (!selectedProduct.available_codes || selectedProduct.available_codes <= 0) {
      alert('❌ عذراً، هذا المنتج غير متوفر حالياً');
      return;
    }

    if (quantity > selectedProduct.available_codes) {
      alert(`❌ الكمية المطلوبة (${quantity}) تزيد عن المتوفر (${selectedProduct.available_codes})`);
      return;
    }

    if (!canProceedWithPurchase) {
      alert(creditError);
      return;
    }

    if (showCreditWarning) {
      const confirmed = window.confirm(`${creditError}\n\nهل تريد المتابعة رغم التحذير؟`);
      if (!confirmed) return;
    }

    setIsProcessing(true);
    try {
      const displayPrice = getDisplayPrice();
      const finalCustomerType = customer?.customer_type || purchaseForm.customer_type;
      const finalName = customer?.name || purchaseForm.name;
      const finalPhone = customer?.phone || purchaseForm.phone;

      console.log('🛒 PURCHASE REQUEST DATA:', {
        selectedProduct: {
          id: selectedProduct.id,
          amount: selectedProduct.amount,
          retail_price: selectedProduct.retail_price,
          wholesale_price: selectedProduct.wholesale_price,
          price: selectedProduct.price
        },
        displayPrice,
        quantity,
        finalCustomerType,
        totalAmount: displayPrice * quantity
      });

      const response = await fetch('/api/topup/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: actualStoreId,
          topup_product_id: selectedProduct.id,
          quantity,
          customer_id: customer?.customer_id || null,
          customer_type: finalCustomerType,
          phone: finalPhone,
          address: `${finalName} | ${finalPhone}`,
          total_amount: displayPrice * quantity
        })
      });

      const data = await response.json();
      if (response.ok) {
        // حفظ بيانات العميل في localStorage
        localStorage.setItem('topupCustomer', JSON.stringify({
          name: finalName,
          phone: finalPhone,
          customer_type: finalCustomerType
        }));
        // احذف customerData لتجنب التضارب
        localStorage.removeItem('customerData');
        playAddToCartSound();
        setShowPurchaseForm(false);
        setPurchaseForm({ name: '', phone: '', customer_type: 'cash' });
        navigate(`/topup/${storeId}/order/${data.order_id}`);
      } else {
        alert(data.error || 'فشل إتمام العملية');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      alert('حدث خطأ في العملية');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className={cn("p-8 text-center min-h-screen flex flex-col items-center justify-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>جاري التحميل...</p>
      <p className={cn("text-sm mt-2", isDarkMode ? "text-gray-500" : "text-gray-500")}>يرجى الانتظار قليلاً</p>
    </div>
  );

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      {/* Header with Auth */}
      <div className={cn("border-b flex-shrink-0", isDarkMode ? "border-gray-700" : "border-gray-200")}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/stores')}
                className={cn("flex items-center gap-2 font-normal transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900")}
              >
                <ChevronRight size={20} />
                العودة
              </button>
              {/* Shopping Cart Button */}
              <button
                onClick={() => {
                  // حفظ البيانات من customer أو purchaseForm إلى localStorage قبل الانتقال للعربة
                  console.log('🛒 Cart button clicked - current customer:', customer);
                  // حذف البيانات القديمة أولاً
                  localStorage.removeItem('customerData');
                  localStorage.removeItem('topupCustomer');
                  
                  if (customer) {
                    // إذا كان هناك customer مسجل، اخزن بياناته
                    console.log('✅ Saving customer to topupCustomer:', customer);
                    localStorage.setItem('topupCustomer', JSON.stringify(customer));
                  } else if (purchaseForm.name || purchaseForm.phone) {
                    // وإلا، احفظ purchaseForm
                    console.log('✅ Saving purchaseForm to topupCustomer:', purchaseForm);
                    localStorage.setItem('topupCustomer', JSON.stringify(purchaseForm));
                  }
                  navigate('/topup-cart');
                }}
                className="relative rounded-lg font-normal text-white transition-all hover:scale-105 flex items-center gap-2 shadow group"
                style={{ backgroundColor: primaryColor }}
                title="عرض سلة المشتريات"
              >
                <div className="p-3 relative">
                  <ShoppingCart size={36} className="group-hover:scale-110 transition-transform" />
                  {cartItems.length > 0 && (
                    <div className={cn("absolute top-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg", isDarkMode ? "bg-red-600" : "bg-red-500")}>
                      {cartItems.length}
                    </div>
                  )}
                </div>
              </button>
            </div>
            <div className="flex items-center gap-4">
              {storeLogo && storeLogo.length > 100 && (
                <img 
                  key={`topup-logo-${storeLogo.substring(storeLogo.length - 30)}`}
                  src={storeLogo} 
                  alt="Store Logo" 
                  className="h-16 w-16 object-contain rounded-lg"
                  onLoad={() => {
                    console.log('✅ TopupStorefront logo loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('Error loading logo:', e);
                    setStoreLogo('');
                  }}
                />
              )}
              <div>
                <h1 className="text-3xl font-normal">{storeInfo?.store_name || 'متجر بطاقات الشحن'}</h1>
                <p className={cn("mt-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>{storeInfo?.description || 'اختر شركتك المفضلة وقيمة الشحن'}</p>
              </div>
            </div>
            {customer ? (
              <>
                {console.log('🟢 Rendering customer info window for:', customer.name, customer.customer_id)}
                <div className={cn("p-4 rounded-lg space-y-3", isDarkMode ? "bg-gray-800" : "bg-blue-50")}>
                  <div>
                    <p className="text-sm font-normal mb-1">👤 {customer.name}</p>
                    <p className={cn("text-xs mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>{customer.phone}</p>
                    {customer.customer_type && (
                      <p className={cn("text-xs px-2 py-1 rounded inline-block", customer.customer_type === 'reseller' ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700") : (isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"))}>
                        {customer.customer_type === 'reseller' ? '🏪 نقطة بيع (جملة)' : '👤 عميل نقدي (مفرد)'}
                      </p>
                    )}
                  </div>
                  {customer.customer_id && (
                    <div className={cn("p-3 rounded-lg border", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-white border-blue-100")}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <p className={cn("text-[10px] font-normal mb-0.5", isDarkMode ? "text-gray-400" : "text-gray-500")}>حد الائتمان</p>
                          <p className={cn("text-sm font-bold", isDarkMode ? "text-blue-300" : "text-blue-600")}>{Math.round(Number(customer.credit_limit) || 0)?.toLocaleString('en-US')} د.ع</p>
                        </div>
                        <div>
                          <p className={cn("text-[10px] font-normal mb-0.5", isDarkMode ? "text-gray-400" : "text-gray-500")}>الديون</p>
                          <p className={cn("text-sm font-bold", Number(customer.current_debt || 0) > Number(customer.credit_limit || 0) ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-yellow-400" : "text-yellow-600"))}>{Math.round(Number(customer.current_debt) || 0)?.toLocaleString('en-US')} د.ع</p>
                        </div>
                        <div>
                          <p className={cn("text-[10px] font-normal mb-0.5", isDarkMode ? "text-gray-400" : "text-gray-500")}>الرصيد المتاح</p>
                          <p className={cn("text-sm font-bold", (Number(customer.credit_limit || 0) - Number(customer.current_debt || 0)) <= 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-green-400" : "text-green-600"))}>{Math.round(Math.max(0, Number(customer.credit_limit || 0) - Number(customer.current_debt || 0))).toLocaleString('en-US')} د.ع</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className={cn("py-2 px-3 rounded text-xs font-normal text-white transition-colors", isDarkMode ? "bg-green-900 hover:bg-green-800" : "bg-green-600 hover:bg-green-700")}
                      disabled={Number(customer?.current_debt || 0) <= 0}
                      title="تسديد المديونية"
                    >
                      💳 دفع
                    </button>
                    <button
                      onClick={() => setShowAccountStatement(true)}
                      className={cn("py-2 px-3 rounded text-xs font-normal text-white transition-colors", isDarkMode ? "bg-blue-900 hover:bg-blue-800" : "bg-blue-600 hover:bg-blue-700")}
                      title="عرض تفاصيل الحساب"
                    >
                      📋 كشف
                    </button>
                    <button
                      onClick={handleLogout}
                      className={cn("py-2 px-3 rounded text-xs font-normal", isDarkMode ? "bg-red-900 text-red-100 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200")}
                      title="تسجيل الخروج"
                    >
                      🚪 خروج
                    </button>
                  </div>

                  {/* Payment Form */}
                  {showPaymentForm && (
                    <div className={cn("mt-4 p-4 rounded-lg border-2", isDarkMode ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300")}>
                      <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-green-400" : "text-green-700")}>أدخل المبلغ (د.ع)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0"
                          max={Number(customer?.current_debt || 0)}
                          className={cn("flex-1 px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                        />
                        <button
                          onClick={handlePayment}
                          disabled={isPaymentProcessing}
                          className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm transition-colors", isPaymentProcessing ? "opacity-50" : "", isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700")}
                        >
                          {isPaymentProcessing ? 'جاري...' : 'تأكيد'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentAmount('');
                          }}
                          className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm transition-colors", isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-400 hover:bg-gray-500")}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowAuthForm(true)}
                  className={cn("w-full py-2 px-3 rounded text-sm font-normal text-white", isDarkMode ? "bg-red-900 hover:bg-red-800" : "bg-red-600 hover:bg-red-700")}
                >
                  🔓 دخول
                </button>
                <div className={cn("p-3 rounded-lg border", isDarkMode ? "bg-amber-900/20 border-amber-600/30" : "bg-amber-50 border-amber-200")}>
                  <p className={cn("text-xs font-bold mb-2", isDarkMode ? "text-amber-300" : "text-amber-700")}>📋 ملخص كشف الحساب</p>
                  <p className={cn("text-[11px] mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    <span className={cn("px-2 py-0.5 rounded inline-block text-[10px] font-bold", isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700")}>
                      🔒 غير مسجل
                    </span>
                  </p>
                  <ul className={cn("text-[11px] space-y-1", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                    <li>💡 بعد الدخول ستظهر:</li>
                    <li>✓ حد ائتمانك</li>
                    <li>✓ ديونك الحالية</li>
                    <li>✓ رصيدك المتاح</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Auth Form */}
          {showAuthForm && !customer && (
            <Card className={cn("mt-4", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50")}>
              <div className="p-4 space-y-3">
                {/* Info Message */}
                <div className={cn("p-3 rounded-lg border text-xs font-normal", isDarkMode ? "bg-blue-900/30 border-blue-700 text-blue-300" : "bg-blue-100 border-blue-300 text-blue-700")}>
                  ℹ️ هذا النموذج مخصص للعملاء المسجلين فقط. إذا لم تكن مسجلاً، يرجى التواصل مع المتجر.
                </div>
                
                <div>
                  <label className="block text-sm font-normal mb-1">📱 رقم الهاتف</label>
                  <input
                    type="tel"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="07xxxxxxxxx"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-normal mb-1">🔐 كلمة المرور</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>
                <button
                  onClick={handleAuth}
                  disabled={isAuthenticating}
                  className="w-full py-2 rounded-lg text-white font-normal text-sm transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isAuthenticating ? 'جاري...' : 'دخول'}
                </button>
              </div>
            </Card>
          )}

          {/* Account Statement Modal */}
          {showAccountStatement && customer && (
            <div className={cn("fixed inset-0 flex items-center justify-center z-50 p-4", isDarkMode ? "bg-black/50" : "bg-black/30")}>
              <Card className={cn("w-full max-w-md", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <div className="flex justify-between items-center">
                    <h3 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                      📋 كشف الحساب
                    </h3>
                    <button
                      onClick={() => setShowAccountStatement(false)}
                      className={cn("text-xl font-bold", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Customer Info */}
                  <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700/30" : "bg-gray-50")}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={cn("text-xs mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>العميل</p>
                        <p className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{customer.name}</p>
                        <p className={cn("text-xs mt-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>{customer.phone}</p>
                      </div>
                      {Number(customer?.current_debt || 0) > 0 && (
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className={cn("ml-2 p-2 hover:scale-110 transition-transform", isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700")}
                          title="تسديد مبلغ"
                        >
                          <span className="text-2xl">💳</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Stats */}
                  <div className="space-y-3">
                    <div className={cn("p-4 rounded-lg border-2", isDarkMode ? "bg-blue-900/20 border-blue-600" : "bg-blue-50 border-blue-300")}>
                      <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-blue-400" : "text-blue-600")}>حد الائتمان</p>
                      <p className={cn("text-2xl font-bold", isDarkMode ? "text-blue-300" : "text-blue-600")}>
                        {Math.round(Number(customer.credit_limit) || 0)?.toLocaleString('en-US')}
                      </p>
                      <p className={cn("text-xs mt-1", isDarkMode ? "text-blue-400" : "text-blue-600")}>د.ع</p>
                    </div>

                    <div className={cn("p-4 rounded-lg border-2", isDarkMode ? "bg-purple-900/20 border-purple-600" : "bg-purple-50 border-purple-300")}>
                      <div className="flex justify-between items-center mb-2">
                        <p className={cn("text-xs font-normal", isDarkMode ? "text-purple-400" : "text-purple-600")}>الرصيد الأولي</p>
                        <button
                          onClick={() => setShowPaymentForm(true)}
                          className={cn("text-xl transition-colors", isDarkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700")}
                          title="إضافة/تعديل الرصيد الأولي"
                        >
                          ✎️
                        </button>
                      </div>
                      <p className={cn("text-2xl font-bold", isDarkMode ? "text-purple-300" : "text-purple-600")}>
                        {Math.round(Number(customer.current_debt) || 0)?.toLocaleString('en-US')}
                      </p>
                      <p className={cn("text-xs mt-1", isDarkMode ? "text-purple-400" : "text-purple-600")}>د.ع</p>
                    </div>

                    <div className={cn("p-4 rounded-lg border-2", Number(customer.current_debt || 0) > Number(customer.credit_limit || 0) ? (isDarkMode ? "bg-red-900/20 border-red-600" : "bg-red-50 border-red-300") : (isDarkMode ? "bg-yellow-900/20 border-yellow-600" : "bg-yellow-50 border-yellow-300"))}>
                      <p className={cn("text-xs font-normal mb-1", Number(customer.current_debt || 0) > Number(customer.credit_limit || 0) ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-yellow-400" : "text-yellow-600"))}>الديون الحالية</p>
                      <p className={cn("text-2xl font-bold", Number(customer.current_debt || 0) > Number(customer.credit_limit || 0) ? (isDarkMode ? "text-red-300" : "text-red-600") : (isDarkMode ? "text-yellow-300" : "text-yellow-600"))}>
                        {Math.round(Number(customer.current_debt) || 0)?.toLocaleString('en-US')}
                      </p>
                      <p className={cn("text-xs mt-1", Number(customer.current_debt || 0) > Number(customer.credit_limit || 0) ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-yellow-400" : "text-yellow-600"))}>د.ع</p>
                    </div>

                    <div className={cn("p-4 rounded-lg border-2", (Number(customer.credit_limit || 0) - Number(customer.current_debt || 0)) <= 0 ? (isDarkMode ? "bg-red-900/20 border-red-600" : "bg-red-50 border-red-300") : (isDarkMode ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300"))}>
                      <p className={cn("text-xs font-normal mb-1", (Number(customer.credit_limit || 0) - Number(customer.current_debt || 0)) <= 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-green-400" : "text-green-600"))}>الرصيد المتاح</p>
                      <p className={cn("text-2xl font-bold", (Number(customer.credit_limit || 0) - Number(customer.current_debt || 0)) <= 0 ? (isDarkMode ? "text-red-300" : "text-red-600") : (isDarkMode ? "text-green-300" : "text-green-600"))}>
                        {Math.round(Math.max(0, Number(customer.credit_limit || 0) - Number(customer.current_debt || 0))).toLocaleString('en-US')}
                      </p>
                      <p className={cn("text-xs mt-1", (Number(customer.credit_limit || 0) - Number(customer.current_debt || 0)) <= 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-green-400" : "text-green-600"))}>د.ع</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className={cn("py-2 px-3 rounded text-sm font-normal text-white transition-colors", isDarkMode ? "bg-green-900 hover:bg-green-800" : "bg-green-600 hover:bg-green-700")}
                      disabled={Number(customer?.current_debt || 0) <= 0}
                    >
                      💳 تسديد
                    </button>
                    <button
                      onClick={handleLogout}
                      className={cn("py-2 px-3 rounded text-sm font-normal", isDarkMode ? "bg-red-900 text-red-100 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200")}
                    >
                      خروج
                    </button>
                    <button
                      onClick={() => setShowAccountStatement(false)}
                      className={cn("py-2 px-3 rounded text-sm font-normal text-white transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-400 hover:bg-gray-500")}
                    >
                      إغلاق
                    </button>
                  </div>

                  {/* Payment Form */}
                  {showPaymentForm && (
                    <div className={cn("mt-6 p-4 rounded-lg border-2", isDarkMode ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300")}>
                      <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-green-400" : "text-green-700")}>أدخل المبلغ (د.ع)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0"
                          max={Number(customer?.current_debt || 0)}
                          className={cn("flex-1 px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                        />
                        <button
                          onClick={handlePayment}
                          disabled={isPaymentProcessing}
                          className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm transition-colors", isPaymentProcessing ? "opacity-50" : "", isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700")}
                        >
                          {isPaymentProcessing ? 'جاري...' : 'تأكيد'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentAmount('');
                          }}
                          className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm transition-colors", isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-400 hover:bg-gray-500")}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
          {/* Filters and Purchase Details - Completely Hidden */}
          <div className="hidden space-y-6">
            <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50")}> 
              <div className={cn("p-4 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}> 
                <h3 className="font-normal">الفلاتر</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-normal mb-2">الشركة</label>
                  <select 
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedCategory('');
                      setSelectedProduct(null);
                    }}
                    className={cn("w-full px-3 py-2 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  >
                    <option value="">جميع الشركات</option>
                    {companiesWithProducts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {selectedCompany && (
                  <div className={cn("p-3 rounded-lg text-sm", isDarkMode ? "bg-indigo-900 text-indigo-100" : "bg-indigo-50 text-indigo-700")}> 
                    ✅ تم اختيار الشركة - عرض جميع المنتجات
                  </div>
                )}

                {selectedProduct && (
                  <div className={cn("p-4 rounded-lg border-2 text-center", isDarkMode ? "bg-emerald-900/30 border-emerald-700" : "bg-emerald-50 border-emerald-300")}> 
                    <p className={cn("text-2xs font-normal mb-1", isDarkMode ? "text-emerald-400" : "text-emerald-600")}> 
                      📦 الكمية المتاحة
                    </p>
                    <p className={cn("text-3xl font-bold", isDarkMode ? "text-emerald-300" : "text-emerald-700")}>
                      {(() => {
                        // احصل على أحدث البيانات من products array بدلاً من selectedProduct
                        const latestProduct = products.find(p => p.id === selectedProduct.id);
                        // استخدم codes.length مباشرة - هذا هو العدد الحقيقي من الأكواد
                        let codesCount = 0;
                        if (latestProduct?.codes && Array.isArray(latestProduct.codes)) {
                          codesCount = latestProduct.codes.length;
                        } else if (latestProduct?.available_codes !== undefined && latestProduct?.available_codes !== null) {
                          codesCount = latestProduct.available_codes;
                        }
                        console.log('🎯 ACTUAL Displaying codes (using codes.length):', {
                          productId: selectedProduct.id,
                          codes: latestProduct?.codes,
                          codes_actual_count: latestProduct?.codes?.length,
                          available_codes_field: latestProduct?.available_codes,
                          final_display: codesCount
                        });
                        return codesCount;
                      })()}
                    </p>
                    <p className={cn("text-xs mt-1", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                      بطاقة
                    </p>
                  </div>
                )}
              </div>
            </Card>

          {/* Purchase Form Modal */}
          {showPurchaseForm && selectedProduct && !customer && (
            <Card className={cn("mt-6 border-2", isDarkMode ? "bg-gray-800 border-indigo-700" : "bg-indigo-50 border-indigo-200")}> 
              <div className="p-6 space-y-4">
                <div>
                  <h3 className={cn("text-lg font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>📝 بيانات الشراء</h3>
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>👤 الاسم</label>
                  <input 
                    type="text"
                    value={purchaseForm.name}
                    onChange={(e) => setPurchaseForm({...purchaseForm, name: e.target.value})}
                    placeholder="أدخل اسمك"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>📱 رقم الهاتف</label>
                  <input 
                    type="tel"
                    value={purchaseForm.phone}
                    onChange={(e) => setPurchaseForm({...purchaseForm, phone: e.target.value})}
                    placeholder="07xxxxxxxxx"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>🏪 نوع العميل</label>
                  <select 
                    value={purchaseForm.customer_type}
                    onChange={(e) => setPurchaseForm({...purchaseForm, customer_type: e.target.value as 'cash' | 'reseller'})}
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  >
                    <option value="cash">👤 عميل نقدي (مفرد)</option>
                    <option value="reseller">🏪 نقطة بيع (جملة)</option>
                  </select>
                  <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    السعر: {formatCurrency(getDisplayPrice())} د.ع / بطاقة
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className={cn("py-2 rounded-lg text-white font-normal text-sm transition-all hover:scale-[1.02] active:scale-95", isProcessing ? "opacity-50" : "")}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isProcessing ? 'جاري...' : '✓ شراء'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPurchaseForm(false);
                      setPurchaseForm({ name: '', phone: '', customer_type: 'cash' });
                    }}
                    className={cn("py-2 rounded-lg text-white font-normal text-sm transition-all hover:scale-[1.02] active:scale-95", isDarkMode ? "bg-gray-700" : "bg-gray-400")}
                  >
                    ✕ إلغاء
                  </button>
                </div>
              </div>
            </Card>
          )}
          </div>

          {/* Products Grid - Full Width */}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" key={`products-${products.length}-${Date.now()}`}>
              {filteredProducts.map((product, idx) => {
                // العملاء المفردون (cash): wholesale_price
                // العملاء الجملة (reseller): retail_price
                const displayPrice = customer?.customer_type === 'reseller' && product.retail_price 
                  ? product.retail_price 
                  : (product.wholesale_price || product.price || 0);
                const hasBulkPrice = product.retail_price && product.wholesale_price && product.retail_price !== product.wholesale_price;
                const showBulkBadge = customer?.customer_type === 'reseller' && hasBulkPrice;
                const productQuantity = quantity && selectedProduct?.id === product.id ? quantity : 1;

                return (
                  <motion.div
                    key={`product-${product.id}-${product.available_codes}`}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all relative",
                      selectedProduct?.id === product.id
                        ? `border-[${primaryColor}] bg-opacity-10`
                        : isDarkMode ? "border-green-700 hover:border-green-600" : "border-green-500 hover:border-green-600"
                    )}
                  >
                    {showBulkBadge && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-normal">
                        🎉 جملة
                      </div>
                    )}
                    <div 
                      onClick={() => {
                        console.log('📦 Selecting product:', {
                          id: product.id,
                          name: product.company_name,
                          amount: product.amount,
                          price: product.price,
                          retail_price: product.retail_price,
                          wholesale_price: product.wholesale_price,
                          bulk_price: product.bulk_price,
                          available_codes: product.available_codes,
                          codes_count: product.codes ? product.codes.length : 0,
                          all_keys: Object.keys(product).sort()
                        });
                        setSelectedProduct(product);
                      }}
                      className="mb-4"
                    >
                      <div className="text-xs font-normal text-gray-500 mb-1">{product.company_name}</div>
                      <div className="text-lg sm:text-2xl font-normal mb-2">{product.amount.toLocaleString('en-US')} دينار</div>
                      <div className={cn("text-xs font-normal mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}> 
                        {product.category_name}
                      </div>
                      <div className="space-y-1">
                        <div className={cn("text-base sm:text-lg font-normal", selectedProduct?.id === product.id ? "text-green-500" : isDarkMode ? "text-blue-400" : "text-indigo-600")}> 
                          {displayPrice.toLocaleString('en-US')} د.ع
                        </div>
                        {showBulkBadge && (
                          <div className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                            <del>{(product.wholesale_price || product.price).toLocaleString('en-US')} د.ع</del>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Cart Controls */}
                    <div className="mt-4 pt-4 border-t" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 bg-opacity-10 rounded px-2 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedProduct?.id === product.id && quantity > 1) {
                                setQuantity(quantity - 1);
                              } else if (selectedProduct?.id === product.id) {
                                setQuantity(1);
                              } else {
                                setSelectedProduct(product);
                                setQuantity(1);
                              }
                            }}
                            className={cn("px-2 py-1 rounded text-sm font-normal transition-all", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-300")}
                            title="إنقاص"
                          >
                            −
                          </button>
                          <span className={cn("px-2 py-1 text-sm font-normal min-w-[2rem] text-center", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                            {selectedProduct?.id === product.id ? quantity : 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedProduct?.id === product.id) {
                                setQuantity(quantity + 1);
                              } else {
                                setSelectedProduct(product);
                                setQuantity(2);
                              }
                            }}
                            className={cn("px-2 py-1 rounded text-sm font-normal transition-all", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-300")}
                            title="زيادة"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // Calculate correct price based on customer type
                            let correctPrice = product.price; // default
                            if (customer?.customer_type === 'reseller') {
                              correctPrice = product.retail_price || product.wholesale_price || product.price;
                            } else {
                              correctPrice = product.wholesale_price || product.price;
                            }
                            
                            console.log('💳 Adding to cart with correct price:', {
                              productId: product.id,
                              customerType: customer?.customer_type,
                              basePrice: product.price,
                              retail_price: product.retail_price,
                              wholesale_price: product.wholesale_price,
                              correctPrice: correctPrice
                            });
                            
                            addItem({ 
                              ...product,
                              price: correctPrice,  // Override with correct price
                              store_type: 'topup',
                              store_id: actualStoreId || parseInt(storeId || '0'),
                              quantity: selectedProduct?.id === product.id ? quantity : 1 
                            });
                            playAddToCartSound();
                          }}
                          className={cn("flex-1 py-2 px-2 rounded text-sm font-normal transition-all flex items-center justify-center gap-1", isDarkMode ? "bg-green-900 hover:bg-green-800 text-green-200" : "bg-green-100 hover:bg-green-200 text-green-700")}
                          title="إضافة للسلة"
                        >
                          <ShoppingCart size={14} />
                          <span className="text-xs">سلة</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <StorePageMobileFooter storeSlug={storeId} isTopup={true} />
      </div>
    </div>
  );
};

const TopupOrderDetails = () => {
  const { storeId, orderId } = useParams();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/topup/order-codes/${orderId}`)
      .then(r => r.json())
      .then(data => {
        setCodes(data.codes);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading codes:', error);
        setLoading(false);
      });
  }, [orderId]);

  const copyAllCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-4 sm:p-8 text-center">جاري تحميل أكوادك...</div>;

  return (
    <div className={cn("min-h-screen p-4 sm:p-8", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal mb-2">شكراً لك! 🎉</h1>
          <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-600")}>تم استلام طلبك بنجاح</p>
        </div>

        <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50")}>
          <div className={cn("p-6 border-b border-green-500", isDarkMode ? "border-green-900" : "")}>
            <h2 className="font-normal text-lg text-green-600">أكوادك الخاصة</h2>
            <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>احفظ هذه الأكواد في مكان آمن</p>
          </div>

          <div className="p-6 space-y-3">
            {codes.map((code, idx) => (
              <div key={idx} className={cn("p-4 rounded-lg border-2 font-mono text-lg font-normal", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}>
                {code}
              </div>
            ))}
          </div>

          <div className={cn("p-4 border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
            <button
              onClick={copyAllCodes}
              className="w-full py-3 rounded-lg font-normal transition-all"
              style={{ backgroundColor: copied ? '#22c55e' : '#3b82f6', color: 'white' }}
            >
              {copied ? '✓ تم النسخ!' : 'نسخ جميع الأكواد'}
            </button>
          </div>
        </Card>

        <div className={cn("mt-8 p-4 rounded-lg", isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700")}>
          <p className="text-sm font-normal">💡 نصيحة: سيتم إرسال الأكواد عبر تليجرام أيضاً على المعرّف أو الرقم المسجل</p>
        </div>

        <button
          onClick={() => navigate(`/topup/${storeId}`)}
          className={cn("w-full mt-8 py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300")}
        >
          ← العودة للمتجر
        </button>
      </div>
    </div>
  );
};

export default App;


