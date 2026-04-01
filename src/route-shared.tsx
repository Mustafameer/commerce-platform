import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  ExternalLink,
  Home,
  Layout,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Store as StoreIcon,
  Sun,
  Ticket,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  useAuthStore,
  useRegularCartStore,
  useSearchStore,
  useSettingsStore,
  useTopupCartStore,
} from './store';
import { useTheme } from './theme';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number | string) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rounded = Math.floor(val);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
};

export const formatNumber = (num: number | string) => {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) {
    return '0';
  }

  return Math.floor(parsed).toLocaleString('en-US');
};

export const playAddToCartSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.15);

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
  } catch {
    // Ignore browsers that block autoplay.
  }
};

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle" font-family="system-ui"%3Eاضافة صورة%3C/text%3E%3Cpath d="M80 120 L100 100 L120 120" stroke="%239ca3af" stroke-width="2" fill="none"/%3E%3C/svg%3E';

export const getSafeImageUrl = (url: string | null | undefined): string => {
  if (!url) {
    return PLACEHOLDER_IMAGE;
  }

  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('http')) {
    return url;
  }

  if (url.includes('via.placeholder')) {
    return PLACEHOLDER_IMAGE;
  }

  return url;
};

export const Button = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
      className,
    )}
    {...props}
  />
);

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn(
        'rounded-2xl border shadow-sm overflow-hidden transition-colors',
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const getPublicStorePath = (user: any) => {
  if (!user?.store_slug) {
    return null;
  }

  return user.store_type === 'topup' ? `/topup/${user.store_slug}` : `/store/${user.store_slug}`;
};

const getDashboardLayoutNavItems = (role: string, counts?: Record<string, number>) => {
  if (role === 'admin') {
    return [
      { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
      { icon: Users, label: 'المستخدمون', path: '/admin/users' },
      { icon: StoreIcon, label: 'المتاجر', path: '/admin/stores', count: counts?.stores },
      { icon: BarChart3, label: 'الإحصائيات', path: '/admin/stats' },
    ];
  }

  return [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/merchant' },
    { icon: Package, label: 'المنتجات', path: '/merchant/products', count: counts?.products },
    { icon: Layout, label: 'الأقسام', path: '/merchant/categories', count: counts?.categories },
    { icon: Zap, label: 'المزادات', path: '/merchant/auctions', count: counts?.auctions },
    { icon: ShoppingCart, label: 'الطلبات', path: '/merchant/orders', count: counts?.orders },
    { icon: Ticket, label: 'قسائم الخصم', path: '/merchant/coupons', count: counts?.coupons },
    { icon: Users, label: 'العملاء', path: '/merchant/customers', count: counts?.customers },
    { icon: Settings, label: 'إعدادات المتجر', path: '/merchant/settings' },
  ];
};

const getMobileDashboardMenuItems = (user: any) => {
  if (!user) {
    return [];
  }

  if (user.role === 'admin') {
    return [
      { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/admin' },
      { icon: Users, label: 'المستخدمون', path: '/admin/users' },
      { icon: StoreIcon, label: 'المتاجر', path: '/admin/stores' },
      { icon: BarChart3, label: 'الإحصائيات', path: '/admin/stats' },
    ];
  }

  if (user.store_type === 'topup') {
    return [
      { icon: BarChart3, label: 'ملخص المبيعات', path: '/topup-merchant/overview' },
      { icon: StoreIcon, label: 'الشركات', path: '/topup-merchant/companies' },
      { icon: CreditCard, label: 'المنتجات', path: '/topup-merchant/products' },
      { icon: Ticket, label: 'الأكواد', path: '/topup-merchant/codes' },
      { icon: Users, label: 'العملاء', path: '/topup-merchant/customers' },
      { icon: ShoppingCart, label: 'الطلبات', path: '/topup-merchant/orders' },
      { icon: Settings, label: 'الإعدادات', path: '/topup-merchant/settings' },
    ];
  }

  return [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/merchant' },
    { icon: Package, label: 'المنتجات', path: '/merchant/products' },
    { icon: Layout, label: 'الأقسام', path: '/merchant/categories' },
    { icon: Zap, label: 'المزادات', path: '/merchant/auctions' },
    { icon: ShoppingCart, label: 'الطلبات', path: '/merchant/orders' },
    { icon: Ticket, label: 'قسائم الخصم', path: '/merchant/coupons' },
    { icon: Users, label: 'العملاء', path: '/merchant/customers' },
    { icon: Settings, label: 'إعدادات المتجر', path: '/merchant/settings' },
  ];
};

const isDashboardRouteActive = (pathname: string, user: any) => {
  if (!user) {
    return false;
  }

  if (user.role === 'admin') {
    return pathname === '/admin' || pathname.startsWith('/admin/');
  }

  if (user.store_type === 'topup') {
    return pathname === '/topup-merchant' || pathname.startsWith('/topup-merchant/');
  }

  return pathname === '/merchant' || pathname.startsWith('/merchant/');
};

const LoginRequiredModal = ({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={onClose} />
      <div
        className={cn(
          'fixed bottom-20 left-0 right-0 z-50 mx-auto w-96 max-w-sm p-6 rounded-t-3xl border-t border-l border-r md:hidden',
          isDarkMode ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-200 shadow-xl',
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>تسجيل الدخول مطلوب</h3>
          <button
            onClick={onClose}
            className={cn(
              'p-1 rounded-lg transition-colors',
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
            )}
          >
            <X size={20} />
          </button>
        </div>
        <p className={cn('mb-6 text-sm leading-relaxed', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
          لغرض عرض الداشبورد يجب تسجيل الدخول، وبعد تسجيل الدخول يمكن للأيقونة عرض داشبورد المتجر المفتوح
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={cn(
              'flex-1 px-4 py-2 rounded-xl font-medium transition-colors',
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-900',
            )}
          >
            إغلاق
          </button>
          <button onClick={onLogin} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
            تسجيل الدخول
          </button>
        </div>
      </div>
    </>
  );
};

const DashboardMenuModal = ({
  isOpen,
  onClose,
  items,
  onSelectPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ icon: any; label: string; path: string }>;
  onSelectPath: (path: string) => void;
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={onClose} />
      <div
        className={cn(
          'fixed bottom-20 left-0 right-0 z-50 mx-auto w-96 max-w-sm p-4 rounded-t-3xl border-t border-l border-r md:hidden',
          isDarkMode ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-200 shadow-xl',
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>لوحة التحكم</h3>
          <button
            onClick={onClose}
            className={cn(
              'p-1 rounded-lg transition-colors',
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
            )}
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onSelectPath(item.path);
                onClose();
              }}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-50 hover:bg-gray-100 text-gray-900',
              )}
            >
              <item.icon size={24} />
              <span className="text-xs font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const MobileFooterNav = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const dashboardItems = getMobileDashboardMenuItems(user);

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: StoreIcon, label: 'المتاجر', path: '/stores' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDashboardActive = isDashboardRouteActive(location.pathname, user);
  const hideDashboardShortcut = location.pathname === '/';

  return (
    <>
      <div className={cn('fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex', isDarkMode ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' : 'bg-white/95 border-black/5 backdrop-blur-sm')}>
        <div className="w-full flex items-stretch gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={`mobile-nav-${item.path}`}
              to={item.path}
              className={cn(
                'relative min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors',
                isActive(item.path)
                  ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-indigo-50 text-indigo-600')
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'),
              )}
            >
              <div className="flex flex-col items-center gap-1">
                {item.icon && <item.icon size={18} className="flex-shrink-0" />}
                <span className="text-[10px] leading-tight line-clamp-2">{item.label}</span>
              </div>
            </Link>
          ))}
          {!hideDashboardShortcut && (
            <button
              onClick={() => {
                if (user) {
                  setShowDashboardMenu(true);
                  return;
                }
                setShowLoginMessage(true);
              }}
              className={cn(
                'relative min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors',
                isDashboardActive
                  ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-indigo-50 text-indigo-600')
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'),
              )}
              aria-label={user ? 'فتح الداشبورد' : 'تسجيل الدخول'}
            >
              <div className="flex flex-col items-center gap-1">
                <LayoutDashboard size={18} className="flex-shrink-0" />
                <span className="text-[10px] leading-tight line-clamp-2">{user ? 'الداشبورد' : 'الدخول'}</span>
              </div>
            </button>
          )}
        </div>
      </div>
      {user && (
        <DashboardMenuModal
          isOpen={showDashboardMenu}
          onClose={() => setShowDashboardMenu(false)}
          items={dashboardItems}
          onSelectPath={(path) => {
            if (user) {
              navigate(path);
              return;
            }
            navigate('/login');
          }}
        />
      )}
      <LoginRequiredModal
        isOpen={showLoginMessage}
        onClose={() => setShowLoginMessage(false)}
        onLogin={() => {
          setShowLoginMessage(false);
          navigate('/login');
        }}
      />
    </>
  );
};

export const DashboardLayout = ({
  children,
  title,
  role,
  counts,
}: {
  children: React.ReactNode;
  title: string;
  role: string;
  counts?: Record<string, number>;
}) => {
  const { user, logout } = useAuthStore();
  const { appName, logoUrl } = useSettingsStore();
  const { dashboardQuery, setDashboardQuery } = useSearchStore();
  const location = useLocation();
  const [settings, setSettings] = useState({ app_name: appName, logo_url: logoUrl });
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 700 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    const storeId = user?.role === 'merchant' ? user.store_id : '';
    const roleParam = user?.role || '';

    fetch(`/api/settings${storeId ? `?storeId=${storeId}&role=${roleParam}` : `?role=${roleParam}`}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          const settingsData = {
            app_name: data.app_name || appName,
            logo_url: data.logo_url || '',
          };

          setSettings(settingsData);
          useSettingsStore.getState().setSettings(settingsData);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch dashboard settings:', error);
      });
  }, [appName, user?.role, user?.store_id]);

  const navItems = getDashboardLayoutNavItems(role, counts);
  const publicStorePath = getPublicStorePath(user);

  const isNavItemActive = (path: string) => {
    const rootPath = role === 'admin' ? '/admin' : '/merchant';
    if (path === rootPath) {
      return location.pathname === path;
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = () => {
    logout();
    useSettingsStore.getState().resetSettings();
    setDashboardQuery('');
  };

  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-screen w-screen overflow-hidden', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')} data-dashboard-layout="mobile" dir="rtl">
        <div className={cn('border-b px-4 py-3 sticky top-0 z-30 backdrop-blur-sm', isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-black/5')}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={cn('p-2 rounded-lg transition-colors flex-shrink-0', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} aria-label="فتح القائمة">
              {sidebarOpen ? <X size={22} className={isDarkMode ? 'text-gray-100' : 'text-gray-900'} /> : <Menu size={22} className={isDarkMode ? 'text-gray-100' : 'text-gray-900'} />}
            </button>
            <div className="min-w-0 flex-1 text-center">
              <h2 className={cn('text-base font-normal truncate', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>{title}</h2>
              <p className={cn('text-[10px] truncate', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{settings.app_name}</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                'p-2 rounded-lg border transition-all flex items-center justify-center flex-shrink-0',
                isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800' : 'bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100',
              )}
              title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="relative mt-3">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-500' : 'text-gray-400')} size={16} />
            <input
              type="text"
              placeholder="بحث..."
              value={dashboardQuery}
              onChange={(event) => setDashboardQuery(event.target.value)}
              className={cn('w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/30 placeholder-gray-500' : 'bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400')}
            />
          </div>
        </div>
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}
        <div className={cn('fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] transform border-l transition-transform', sidebarOpen ? '-translate-x-0' : 'translate-x-full', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
          <div className={cn('p-5 border-b', isDarkMode ? 'border-gray-700' : 'border-black/5')}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className={cn('text-lg font-normal truncate', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>{settings.app_name}</h3>
                <p className={cn('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>لوحة {role === 'admin' ? 'الإدارة' : 'التاجر'}</p>
              </div>
              {settings.logo_url ? (
                <div className={cn('w-14 h-14 rounded-full overflow-hidden ring-2 flex-shrink-0', isDarkMode ? 'ring-gray-600 bg-gray-700' : 'ring-indigo-100 bg-gray-50')}>
                  <img src={settings.logo_url} className="w-full h-full object-cover" alt="logo" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-normal flex-shrink-0">{settings.app_name?.[0]}</div>
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
                  'flex items-center justify-between px-4 py-3 rounded-xl transition-colors group',
                  isNavItemActive(item.path)
                    ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-indigo-50 text-indigo-600')
                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'),
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.icon && <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />}
                  <span className="font-medium text-sm truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn('text-[10px] font-normal px-2 py-0.5 rounded-full ring-2 shadow-sm flex-shrink-0', isDarkMode ? 'bg-blue-900 text-blue-300 ring-gray-700' : 'bg-indigo-100 text-indigo-600 ring-white')}>
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className={cn('p-3 border-t space-y-2', isDarkMode ? 'border-gray-700' : 'border-black/5')}>
            {role === 'merchant' && publicStorePath && (
              <Link to={publicStorePath} target="_blank" onClick={() => setSidebarOpen(false)} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-normal', isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-indigo-600 text-white hover:bg-indigo-700')}>
                <ExternalLink size={18} className="flex-shrink-0" />
                <span className="truncate">عرض المتجر</span>
              </Link>
            )}
            <button onClick={handleLogout} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm', isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50')}>
              <LogOut size={18} />
              <span className="truncate">تسجيل الخروج</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className={cn('px-4 py-4 pb-28', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')}>{children}</div>
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className={cn('h-screen w-screen overflow-hidden flex-row', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')} data-dashboard-layout="desktop" dir="rtl">
      <aside className={cn('relative w-64 h-screen border-r flex-col overflow-hidden flex', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
        <div className={cn('p-6 text-center border-b flex-shrink-0', isDarkMode ? 'border-gray-700' : 'border-black/5')}>
          <div className="flex flex-col items-center gap-3">
            {settings.logo_url ? (
              <div className={cn('w-20 h-20 rounded-full overflow-hidden ring-4 shadow-lg flex items-center justify-center flex-shrink-0', isDarkMode ? 'ring-gray-700 bg-gray-700' : 'ring-indigo-50 bg-gray-50')}>
                <img src={settings.logo_url} className="w-full h-full object-cover" alt="logo" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-normal shadow-lg ring-4 ring-indigo-50 flex-shrink-0">{settings.app_name?.[0]}</div>
            )}
            <div>
              <h1 className={cn('text-lg font-normal tracking-tighter mb-0.5', isDarkMode ? 'text-blue-400' : 'text-indigo-600')}>{settings.app_name}</h1>
              <p className={cn('text-[9px] uppercase tracking-[0.2em] font-normal italic', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>لوحة {role === 'admin' ? 'الإدارة' : 'التاجر'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-20">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => {
                setDashboardQuery('');
                setSidebarOpen(false);
              }}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl transition-colors group',
                isNavItemActive(item.path)
                  ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-indigo-50 text-indigo-600')
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'),
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon && <item.icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />}
                <span className="font-medium text-sm truncate">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={cn('text-[10px] font-normal px-2 py-0.5 rounded-full ring-2 shadow-sm group-hover:transition-all flex-shrink-0', isDarkMode ? 'bg-blue-900 text-blue-300 ring-gray-700 group-hover:bg-blue-600 group-hover:text-white' : 'bg-indigo-100 text-indigo-600 ring-white group-hover:bg-indigo-600 group-hover:text-white')}>
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className={cn('p-3 border-t space-y-2 flex-shrink-0', isDarkMode ? 'border-gray-700' : 'border-black/5')}>
          {role === 'merchant' && publicStorePath && (
            <Link to={publicStorePath} target="_blank" className={cn('w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all shadow-lg group text-sm font-normal', isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100')}>
              <div className="flex items-center gap-3">
                <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform flex-shrink-0" />
                <span className="truncate">عرض المتجر</span>
              </div>
            </Link>
          )}
          <button onClick={handleLogout} className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm', isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50')}>
            <LogOut size={18} />
            <span className="truncate">تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 h-full overflow-hidden flex-col flex">
        <header className={cn('px-8 py-6 border-b flex justify-between items-center flex-shrink-0', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-black/5')}>
          <h2 className={cn('text-3xl font-normal tracking-tight', isDarkMode ? 'text-gray-100' : 'text-gray-900')}>{title}</h2>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                'p-2.5 rounded-lg border transition-all flex items-center justify-center',
                isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800' : 'bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100',
              )}
              title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative hidden sm:block">
              <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-500' : 'text-gray-400')} size={18} />
              <input
                type="text"
                placeholder="بحث..."
                value={dashboardQuery}
                onChange={(event) => setDashboardQuery(event.target.value)}
                className={cn('pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 w-64 transition-colors', isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/30 placeholder-gray-500' : 'bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400')}
              />
            </div>
          </div>
        </header>
        <div className={cn('flex-1 overflow-y-auto px-8 py-8', isDarkMode ? 'bg-gray-900' : 'bg-[#F5F5F5]')}>{children}</div>
      </main>
    </div>
  );
};

export const StorePageMobileFooter = ({
  cartCount,
  isTopup = false,
}: {
  storeSlug?: string;
  cartCount?: number;
  isTopup?: boolean;
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { items } = useRegularCartStore();
  const { items: topupItems } = useTopupCartStore();
  const itemsCount = cartCount || (isTopup ? topupItems.length : items.length);
  const cartPath = isTopup ? '/topup-cart' : '/cart';

  return (
    <div className={cn('fixed bottom-0 inset-x-0 z-50 border-t px-2 py-2 md:hidden flex', isDarkMode ? 'bg-gray-800/95 border-gray-700 backdrop-blur-sm' : 'bg-white/95 border-black/5 backdrop-blur-sm')}>
      <div className="w-full flex items-stretch gap-2">
        <button onClick={() => navigate('/stores')} className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <ArrowRight size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">عودة</span>
          </div>
        </button>
        <button onClick={() => navigate('/')} className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <Home size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">الرئيسية</span>
          </div>
        </button>
        <button onClick={() => navigate(cartPath)} className={cn('min-w-[72px] flex-1 relative rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <ShoppingCart size={18} className="flex-shrink-0" />
              {itemsCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{itemsCount}</span>}
            </div>
            <span className="text-[10px] leading-tight">السلة</span>
          </div>
        </button>
        <button onClick={() => navigate('/stores')} className={cn('min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}>
          <div className="flex flex-col items-center gap-1">
            <StoreIcon size={18} className="flex-shrink-0" />
            <span className="text-[10px] leading-tight">متاجر</span>
          </div>
        </button>
      </div>
    </div>
  );
};
