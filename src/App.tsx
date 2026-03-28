// @ts-nocheck
import * as React from 'react';
// ًں–¼ï¸ڈ Image Upload System v2.0 - Refresh Build
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Zap,
  Power,
  PowerOff,
  Save
} from 'lucide-react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore, useRegularCartStore, useSettingsStore, useSearchStore, useRefreshStore, useTopupCartStore } from './store';
import type { User, Store, Product, Order } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ThemeContextValue = {
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const ThemeProvider = ({
  children,
  isDarkMode,
  setIsDarkMode,
}: {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};

// --- Constants ---
// Local SVG placeholder instead of external resources
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle" font-family="system-ui"%3Eط§ط¶ط§ظپط© طµظˆط±ط©%3C/text%3E%3Cpath d="M80 120 L100 100 L120 120" stroke="%239ca3af" stroke-width="2" fill="none"/%3E%3C/svg%3E';

const getSafeImageUrl = (url: string | null | undefined): string => {
  if (!url) return PLACEHOLDER_IMAGE;

  const normalizedUrl = String(url).trim().replace(/\\/g, '/');

  if (
    normalizedUrl.startsWith('data:') ||
    normalizedUrl.startsWith('/') ||
    normalizedUrl.startsWith('http') ||
    normalizedUrl.startsWith('blob:')
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.includes('via.placeholder')) {
    return PLACEHOLDER_IMAGE;
  }

  return normalizedUrl;
};

const FRONTEND_BUILD_ID = '20260328-2345';

if (typeof window !== 'undefined') {
  (window as any).__APP_BUILD_ID__ = FRONTEND_BUILD_ID;
}

// --- API Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log(`ًں› ï¸ڈ API_BASE_URL initialized: "${API_BASE_URL}" ${API_BASE_URL ? 'âœ…' : 'âڑ ï¸ڈ EMPTY'}`);
console.log(`ًں› ï¸ڈ Environment: ${typeof window !== 'undefined' ? 'Browser' : 'Node'}`);
console.log(`ًں› ï¸ڈ Current URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`);

const apiCall = async (path: string, options?: RequestInit) => {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  console.log(`ًں“، API Call: ${url}`);
  return fetch(url, options);
};

// Monkey-patch fetch to use API_BASE_URL for relative /api/* paths
const originalFetch = window.fetch;
console.log(`ًں”§ Original fetch function: ${originalFetch ? 'âœ…' : 'â‌Œ'}`);

(window as any).fetch = function(input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === 'string' ? input : input.toString();
  const shouldRedirect = url.startsWith('/api') && API_BASE_URL;
  const finalUrl = shouldRedirect ? `${API_BASE_URL}${url}` : url;
  
  if (shouldRedirect) {
    console.log(`ًں”„ Redirecting fetch: ${url} â†’ ${finalUrl}`);
  } else if (url.startsWith('/api')) {
    console.warn(`âڑ ï¸ڈ NOT redirecting ${url} - API_BASE_URL is empty!`);
  }
  
  return originalFetch.call(this, finalUrl, init);
};
console.log(`ًں”§ Fetch monkey-patch applied`);

const formatCurrency = (amount: number | string) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rounded = Math.floor(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(rounded);
};

// Play sound when item is added to cart
const playAddToCartSound = () => {
  try {
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800; // 800 Hz tone
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.log('Audio playback not available:', error);
  }
};

// Format number without decimals and with thousands separator
const formatNumber = (num: number | string) => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return Math.floor(n).toLocaleString('en-US');
};

// Format date as DD/MM/YYYY
const formatDateOnly = (dateStr: string | Date) => {
  try {
    // If it's already a string in YYYY-MM-DD format, parse it directly
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB');
  } catch {
    return '';
  }
};

const getImageCandidateValue = (value: any): string | null => {
  if (!value) return null;

  if (typeof value === 'object') {
    if ('image_url' in value) {
      return getImageCandidateValue(value.image_url);
    }

    if ('url' in value) {
      return getImageCandidateValue(value.url);
    }

    return null;
  }

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const parseImageCollection = (value: any): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(getImageCandidateValue).filter(Boolean) as string[];
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return parseImageCollection(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  const singleValue = getImageCandidateValue(value);
  return singleValue ? [singleValue] : [];
};

const getProductImageCandidates = (product: any): string[] => {
  if (!product) return [];

  const candidates = [
    ...parseImageCollection(product.image_url),
    ...parseImageCollection(product.gallery),
    ...parseImageCollection(product.images)
  ].map(getSafeImageUrl);

  return Array.from(new Set(candidates.filter((candidate) => candidate && candidate !== PLACEHOLDER_IMAGE)));
};

const getOrderItemImageCandidates = (item: any): string[] => {
  if (!item) return [];

  const candidates = [
    ...parseImageCollection(item.product_images),
    ...getProductImageCandidates(item)
  ].map(getSafeImageUrl);

  return Array.from(new Set(candidates.filter((candidate) => candidate && candidate !== PLACEHOLDER_IMAGE)));
};

const handleImageFallback = (event: React.SyntheticEvent<HTMLImageElement>, candidates: string[]) => {
  const currentIndex = Number(event.currentTarget.dataset.imageIndex || '0');
  const nextIndex = currentIndex + 1;

  if (nextIndex < candidates.length) {
    event.currentTarget.dataset.imageIndex = String(nextIndex);
    event.currentTarget.src = candidates[nextIndex];
    return;
  }

  event.currentTarget.onerror = null;
  event.currentTarget.src = PLACEHOLDER_IMAGE;
};

const getPrimaryProductImage = (product: any): string => {
  const candidates = getProductImageCandidates(product);
  return candidates[0] || PLACEHOLDER_IMAGE;
};

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

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { isDarkMode } = useTheme();
  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm overflow-hidden transition-colors",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const RegularProductModal = ({
  product,
  isDarkMode,
  primaryColor,
  appLabel,
  quantities,
  setQuantities,
  onAddToCart,
  onClose,
}: {
  product: any;
  isDarkMode: boolean;
  primaryColor: string;
  appLabel: string;
  quantities: Record<number, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  onAddToCart: (product: any) => void;
  onClose: () => void;
}) => {
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    if (product) {
      setMainImage(getPrimaryProductImage(product));
    }
  }, [product]);

  if (!product) return null;

  const gallery = getProductImageCandidates(product);
  const quantity = quantities[product.id] || 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative", isDarkMode ? "bg-gray-800" : "bg-white")}
      >
        <button onClick={onClose} className={cn("absolute top-4 right-4 z-20 p-3 backdrop-blur-xl border rounded-full transition-all", isDarkMode ? "bg-gray-700/40 border-gray-600/50 text-gray-300 hover:bg-gray-700" : "bg-white/20 border-white/30 text-gray-400 hover:bg-gray-100")}>
          <X size={24} />
        </button>

        <div className={cn("md:w-1/2 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto min-h-0", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
          <motion.div
            key={mainImage}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <img src={getSafeImageUrl(mainImage)} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
          </motion.div>

          <div className={cn("grid grid-cols-4 gap-3 p-3 rounded-2xl border shadow-sm", isDarkMode ? "bg-gray-600 border-gray-500" : "bg-white border-black/5")}>
            {gallery.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setMainImage(img)}
                className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${mainImage === img ? 'ring-4 ring-indigo-500 ring-offset-2' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
              >
                <img src={getSafeImageUrl(img)} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="mb-2">
              <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-normal uppercase tracking-widest border inline-block", isDarkMode ? "bg-indigo-900/30 text-indigo-400 border-indigo-700" : "bg-indigo-50 text-indigo-600 border-indigo-100")}>{appLabel}</span>
              <h2 className={cn('text-3xl sm:text-4xl font-normal mt-4 tracking-tight leading-tight', isDarkMode ? 'text-white' : 'text-gray-900')}>{product.name}</h2>
            </div>

            <div className="space-y-4">
              <h4 className={cn("text-xs font-normal uppercase tracking-widest border-b pb-2", isDarkMode ? "text-gray-500 border-gray-600" : "text-gray-400 border-black/5")}>ظˆطµظپ ط§ظ„ظ…ظ†طھط¬</h4>
              <p className={cn('text-lg leading-relaxed font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>{product.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className={cn('p-4 rounded-xl border', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>ط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ظ…طھط§ط­</p>
                <p className={cn('font-bold text-2xl', product.stock === 0 ? 'text-red-600' : 'text-green-600')}>
                  {product.stock === 0 ? 'ط؛ظٹط± ظ…طھظˆظپط±' : `${product.stock} ظ…طھط§ط­`}
                </p>
              </div>
              <div className={cn('p-4 rounded-xl border', isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200')}>
                <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-green-400' : 'text-green-600')}>ط§ظ„ط­ط§ظ„ط©</p>
                <p className={cn('font-bold text-xl', isDarkMode ? 'text-green-300' : 'text-green-700')}>ظ…ظ†طھط¬ ط£طµظ„ظٹ âœ“</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
            <div>
              <label className={cn('block mb-2 text-xs font-normal uppercase', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>ط§ط®طھط± ط§ظ„ظƒظ…ظٹط©</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantities(prev => ({
                    ...prev,
                    [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                  }))}
                  className={cn('p-3 rounded-lg transition-all active:scale-95', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}
                >
                  <Minus size={20} />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 999}
                  value={quantity}
                  onChange={(e) => setQuantities(prev => ({
                    ...prev,
                    [product.id]: Math.max(1, Math.min(product.stock || 999, parseInt(e.target.value) || 1))
                  }))}
                  className={cn('flex-1 px-4 py-3 text-center text-lg font-normal rounded-lg border outline-none transition-all', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900')}
                />
                <button
                  onClick={() => setQuantities(prev => ({
                    ...prev,
                    [product.id]: Math.min(product.stock || 999, (prev[product.id] || 1) + 1)
                  }))}
                  className={cn('p-3 rounded-lg transition-all active:scale-95', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className={cn('p-4 rounded-lg border-2', isDarkMode ? 'bg-indigo-900/30 border-indigo-700' : 'bg-indigo-50 border-indigo-200')}>
                <p className={cn('text-xs font-normal mb-1', isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ط§ظ„ط³ط¹ط± ط§ظ„ظ†ظ‡ط§ط¦ظٹ</p>
                <p className={cn('text-2xl sm:text-3xl font-bold', isDarkMode ? 'text-indigo-300' : 'text-indigo-900')}>
                  {formatCurrency(product.price * quantity)}
                </p>
              </div>

              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                disabled={product.stock === 0}
                className={cn('w-full py-4 rounded-xl text-white font-normal text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100')}
                style={{ backgroundColor: product.stock === 0 ? '#999' : primaryColor }}
              >
                <ShoppingCart size={20} />
                ط¥ط¶ط§ظپط© ظ„ظ„ط³ظ„ط© ({quantity})
              </button>

              <button
                onClick={onClose}
                className={cn('w-full py-3 rounded-xl font-normal text-base transition-all border-2', isDarkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}
              >
                ط¥ط؛ظ„ط§ظ‚
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Layouts ---

const DashboardLayout = ({ children, title, role, counts }: { children: React.ReactNode; title: string; role: string; counts?: Record<string, number> }) => {
  const { user, logout } = useAuthStore();
  const { appName, logoUrl } = useSettingsStore();
  const { dashboardQuery, setDashboardQuery } = useSearchStore();
  const location = useLocation();
  const [settings, setSettings] = useState({ app_name: appName, logo_url: logoUrl });
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

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
    console.log("ًں”„ DashboardLayout fetching settings:", { storeId, roleParam });

    fetch(`/api/settings${storeId ? `?storeId=${storeId}&role=${roleParam}` : `?role=${roleParam}`}`)
      .then(res => res.json())
      .then(data => {
        console.log("ًں“¥ DashboardLayout received settings:", data);
        if (data && !data.error) {
          const settingsData = {
            app_name: data.app_name || appName,
            logo_url: data.logo_url || '',
          };

          setSettings(settingsData);
          useSettingsStore.getState().setSettings(settingsData);
          console.log("âœ… Settings updated in both local and Zustand store:", settingsData);
        }
      })
      .catch((err) => {
        console.error("â‌Œ Failed to fetch settings:", err);
      });
  }, [appName, user?.role, user?.store_id]);

  const handleLogout = () => {
    logout();
    useSettingsStore.getState().resetSettings();
    setDashboardQuery('');
  };

  const navItems = role === 'admin'
    ? [
        { icon: LayoutDashboard, label: 'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…', path: '/admin' },
        { icon: Users, label: 'ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†', path: '/admin/users', count: counts?.users },
        { icon: StoreIcon, label: 'ط§ظ„ظ…طھط§ط¬ط±', path: '/admin/stores', count: counts?.stores },
        { icon: CheckCircle, label: 'ط·ظ„ط¨ط§طھ ط§ظ„ط§ظ†ط¶ظ…ط§ظ…', path: '/admin/approvals', count: counts?.approvals },
        { icon: BarChart3, label: 'ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ', path: '/admin/stats' },
        { icon: Settings, label: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', path: '/admin/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…', path: '/merchant' },
        { icon: Package, label: 'ط§ظ„ظ…ظ†طھط¬ط§طھ', path: '/merchant/products', count: counts?.products },
        { icon: Layout, label: 'ط§ظ„ط£ظ‚ط³ط§ظ…', path: '/merchant/categories', count: counts?.categories },
        { icon: Zap, label: 'ط§ظ„ظ…ط²ط§ط¯ط§طھ', path: '/merchant/auctions', count: counts?.auctions },
        { icon: ShoppingCart, label: 'ط§ظ„ط·ظ„ط¨ط§طھ', path: '/merchant/orders', count: counts?.orders },
        { icon: Ticket, label: 'ظ‚ط³ط§ط¦ظ… ط§ظ„ط®طµظ…', path: '/merchant/coupons', count: counts?.coupons },
        { icon: Users, label: 'ط§ظ„ط¹ظ…ظ„ط§ط،', path: '/merchant/customers', count: counts?.customers },
        { icon: Settings, label: 'ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±', path: '/merchant/settings' },
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
              aria-label="ظپطھط­ ط§ظ„ظ‚ط§ط¦ظ…ط©"
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
              title={isDarkMode ? "ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­" : "ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="relative mt-3">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={16} />
            <input 
              type="text" 
              placeholder="ط¨ط­ط«..." 
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
                <p className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-500")}>ظ„ظˆط­ط© {role === 'admin' ? 'ط§ظ„ط¥ط¯ط§ط±ط©' : 'ط§ظ„طھط§ط¬ط±'}</p>
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
                <span className="truncate">ط¹ط±ط¶ ط§ظ„ظ…طھط¬ط±</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50")}
            >
              <LogOut size={18} />
              <span className="truncate">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</span>
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
            <p className={cn("text-[9px] uppercase tracking-[0.2em] font-normal italic", isDarkMode ? "text-gray-500" : "text-gray-400")}>ظ„ظˆط­ط© {role === 'admin' ? 'ط§ظ„ط¥ط¯ط§ط±ط©' : 'ط§ظ„طھط§ط¬ط±'}</p>
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
              <span className="truncate">ط¹ط±ط¶ ط§ظ„ظ…طھط¬ط±</span>
            </div>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-normal text-sm", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50")}
        >
          <LogOut size={18} />
          <span className="truncate">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</span>
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
              title={isDarkMode ? "ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­" : "ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative hidden sm:block">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={18} />
              <input 
                type="text" 
                placeholder="ط¨ط­ط«..." 
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [customerType, setCustomerType] = useState<'cash' | 'reseller' | null>(null);
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [selectedForQuantity, setSelectedForQuantity] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [verificationModal, setVerificationModal] = useState<any>(null);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const navigate = useNavigate();
  const isTopupProduct = (item: any) => item?.store_type === 'topup' || !!item?.retail_price || !!item?.wholesale_price || !!item?.topup_codes;

  // ط­ظپط¸ ظˆط§ط³طھط±ط¬ط§ط¹ ط§ظ„ط£ظƒظˆط§ط¯ ظ…ظ† localStorage
  useEffect(() => {
    const savedOrderConfirmation = localStorage.getItem('orderConfirmation');
    if (savedOrderConfirmation) {
      try {
        const confirmation = JSON.parse(savedOrderConfirmation);
        setOrderConfirmation(confirmation);
        console.log('ًں“¦ Loaded order confirmation from localStorage:', confirmation);
      } catch (err) {
        console.error('Error loading order confirmation from localStorage:', err);
      }
    }
  }, []);

  // Debug: Log cart items to console
  useEffect(() => {
    console.log('ًں›’ Cart items:', items);
    items.forEach(item => {
      console.log(`  - ID: ${item.id}, Name: ${item.name}, Price: ${item.price}, Qty: ${item.quantity}`);
    });
  }, [items]);

  // طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظ…ظ† API
  const [enrichedItems, setEnrichedItems] = useState<any[]>([]);
  useEffect(() => {
    const enrichItems = async () => {
      if (items.length === 0) {
        setEnrichedItems([]);
        return;
      }

      try {
        let productMap = new Map<number, any>();

        if (isTopupCart) {
          const storeId = items[0]?.store_id;
          if (storeId) {
            try {
              const topupRes = await fetch(`/api/topup/products/${storeId}`);
              const topupData = await topupRes.json();
              const topupProducts = Array.isArray(topupData) ? topupData.map((p: any) => ({
                ...p,
                store_name: p.company_name,
                name: `${p.amount}`,
                topup_codes: p.codes,
                store_type: 'topup'
              })) : [];
              productMap = new Map(topupProducts.map((p: any) => [p.id, p]));
            } catch (err) {
              console.error('Error loading topup products:', err);
            }
          }
        } else {
          const productsRes = await fetch('/api/products');
          const productsData = await productsRes.json();
          const regularProducts = Array.isArray(productsData) ? productsData.map((p: any) => ({
            ...p,
            store_type: 'regular'
          })) : [];
          productMap = new Map(regularProducts.map((p: any) => [p.id, p]));
        }

        // ط¥ط«ط±ط§ط، ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ظ„ط©
        const enriched = items
          .filter(cartItem => isTopupCart ? isTopupProduct(cartItem) : !isTopupProduct(cartItem))
          .map(cartItem => {
          const fullProduct = productMap.get(cartItem.id);
          if (fullProduct) {
            return {
              ...cartItem,
              name: fullProduct.name || cartItem.name,
              store_name: fullProduct.store_name || cartItem.store_name,
              company_name: fullProduct.company_name,
              category_name: fullProduct.category_name,
              images: fullProduct.images || cartItem.images,
              gallery: fullProduct.gallery || cartItem.gallery,
              image_url: fullProduct.image_url || cartItem.image_url,
              store_type: isTopupCart ? 'topup' : 'regular'
            };
          }
          return {
            ...cartItem,
            store_type: isTopupCart ? 'topup' : 'regular'
          };
        });

        setEnrichedItems(enriched);
        console.log('âœ… Enriched items:', enriched);
      } catch (err) {
        console.error('Error enriching items:', err);
        setEnrichedItems(items.filter(cartItem => isTopupCart ? isTopupProduct(cartItem) : !isTopupProduct(cartItem)));
      }
    };

    enrichItems();
  }, [items, isTopupCart]);

  // طھط­ظ‚ظ‚ ظپظˆط±ظٹ ظ…ظ† localStorage ط¹ظ†ط¯ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©
  useEffect(() => {
    if (!isTopupCart) return;

    console.log('ًں”چ Initial localStorage check in CartPage');
    const topupData = localStorage.getItem('topupCustomer');
    if (topupData) {
      try {
        const data = JSON.parse(topupData);
        console.log('âœ… Initial load - Found topupCustomer:', data);
        setName(data.name || '');
        setPhone(data.phone || '');
      } catch (err) {
        console.error('âڑ ï¸ڈ Error in initial check:', err);
      }
    }
  }, [isTopupCart]);

  // ظ…ط±ط§ظ‚ط¨ط© طھط؛ظٹظٹط±ط§طھ topupCustomer ظپظٹ localStorage
  useEffect(() => {
    if (!isTopupCart) return;

    const handleStorageChange = () => {
      console.log('ًں”„ localStorage changed - reloading customer data');
      // طھط­ظ‚ظ‚ ظ…ظ† topupCustomer ط£ظˆظ„ط§ظ‹ (ط£ظˆظ„ظˆظٹط© ط£ط¹ظ„ظ‰)
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const data = JSON.parse(topupData);
          console.log('âœ… Reloaded from topupCustomer (PRIORITY):', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          return;
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing topupCustomer:', err);
        }
      }
      
      // ط«ظ… ط¬ط±ط¨ customerData
      const customerData = localStorage.getItem('customerData');
      if (customerData) {
        try {
          const data = JSON.parse(customerData);
          console.log('âœ… Reloaded from customerData:', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing customerData:', err);
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

  // ظ…ظ„ط، ط§ظ„ط§ط³ظ… ظˆط§ظ„ظ‡ط§طھظپ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ…ظ† ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ط£ظˆ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©
  useEffect(() => {
    console.log('ًں‘¤ Populating user data in CartPage');
    
    if (isTopupCart) {
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const data = JSON.parse(topupData);
          console.log('âœ… Loading from topupCustomer (PRIORITY):', data);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          return;
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing topupCustomer:', err);
        }
      }
    }
    
    // For regular stores: Only fill name, leave phone empty for customer to enter
    if (!isTopupCart) {
      const customerData = localStorage.getItem('customerData');
      if (customerData) {
        try {
          const data = JSON.parse(customerData);
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          console.log('âœ… Loaded from customerData:', data);
          return;
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing customerData:', err);
        }
      }
      
      // For regular store: Leave phone empty (customer enters their own number)
      // Don't autofill from user.phone to avoid confusion with store owner phone
      console.log('â„¹ï¸ڈ Regular store: Phone field left empty for customer to enter');
      return;
    }
    
    // ط«ط§ظ†ظٹط§ظ‹: ط¥ط°ط§ ظ„ظ… ظٹظƒظ† topupCustomerطŒ ط¬ط±ط¨ customerData
    const customerData = localStorage.getItem('customerData');
    if (customerData) {
      try {
        const data = JSON.parse(customerData);
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        console.log('âœ… Loaded from customerData:', data);
        return;
      } catch (err) {
        console.error('âڑ ï¸ڈ Error parsing customerData:', err);
      }
    }
    
    // ط«ط§ظ„ط«ط§ظ‹: ط¬ط±ط¨ ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ظپظ‚ط· ط¥ط°ط§ ظ„ظ… ظٹظƒظ† ظ‡ظ†ط§ظƒ topup data
    if (user?.id && user?.name) {
      setName(user.name);
      if (user.phone) setPhone(user.phone);
      console.log('âœ… Loaded from logged-in user:', { name: user.name });
      return;
    }
    
    // ط±ط§ط¨ط¹ط§ظ‹: ط¥ط°ط§ ظ„ظ… ظٹظƒظ† ظ‡ظ†ط§ظƒ user idطŒ ظ„ط§ طھظپط¹ظ„ ط´ظٹط¦ط§ظ‹
    console.log('â„¹ï¸ڈ No user data available');
  }, [isTopupCart, user?.id, user?.name, user?.phone]);

  const fetchCustomerByPhone = async (storeId: number | string, customerPhone: string) => {
    const response = await fetch(`/api/customers?storeId=${storeId}&phone=${encodeURIComponent(customerPhone)}`);
    return readJsonResponse(response, `Customer lookup failed with status ${response.status}`);
  };

  const readJsonResponse = async (response: Response, fallbackMessage: string) => {
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        try {
          const errorData = responseText ? JSON.parse(responseText) : null;
          throw new Error(errorData?.error || fallbackMessage);
        } catch {
          throw new Error(responseText || fallbackMessage);
        }
      }

      throw new Error(responseText || fallbackMessage);
    }

    if (!responseText) {
      return null;
    }

    if (!contentType.includes('application/json')) {
      throw new Error(responseText || fallbackMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(responseText || fallbackMessage);
    }
  };

  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¹ظ†ط¯ طھط؛ظٹظٹط± ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ
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

        const data = await fetchCustomerByPhone(storeId, phone);

        if (!isMounted) return;

        if (data && data.id) {
          // ظˆط¬ط¯ ط§ظ„ط¹ظ…ظٹظ„ - ط§ط³طھط®ط¯ظ… ط¨ظٹط§ظ†طھظ‡
          if (data.name) setName(data.name);
          setCustomerType(data.customer_type);
        } else {
          // ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظٹظ„ - ط§ط³طھط®ط¯ظ… cash ظƒط§ظپطھط±ط§ط¶ظٹ
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

  // ط¯ط§ظ„ط© ظ…ط³ط§ط¹ط¯ط© ظ„ط­ط³ط§ط¨ ط§ظ„ط³ط¹ط± ط§ظ„طµط­ظٹط­ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„ ظˆظ†ظˆط¹ ط§ظ„ظ…ظ†طھط¬
  const getItemPrice = (item: any, pricingCustomerType: string | null | undefined) => {
    // ط¥ط°ط§ ظƒط§ظ† ط§ظ„ظ…ظ†طھط¬ topup (ظ„ظ‡ retail_price ط£ظˆ wholesale_price)
    if (item.retail_price || item.wholesale_price) {
      if (pricingCustomerType === 'reseller') {
        return item.retail_price || item.wholesale_price || item.price || 0;
      } else {
        return item.wholesale_price || item.price || 0;
      }
    }
    
    // ظ„ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ط¹ط§ط¯ظٹط©
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
      if (!items[0]) {
        setCouponError('ظ„ط§ طھظˆط¬ط¯ ط¹ظ†ط§طµط± ظپظٹ ط§ظ„ط³ظ„ط©');
        return;
      }
      
      const res = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          store_id: items[0].store_id,
          order_amount: subtotal
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppliedCoupon(data);
      setCouponCode('');
      
      // Increment coupon usage
      if (data.id) {
        await fetch(`/api/coupons/${data.id}/use`, { method: 'POST' });
      }
    } catch (err: any) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    }
  };

  const handleCheckout = async () => {
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©
    if (!phone.trim()) {
      alert('â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ');
      return;
    }

    if (!isTopupCart && !address.trim()) {
      alert('â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط¹ظ†ظˆط§ظ† ط§ظ„طھط³ظ„ظٹظ…');
      return;
    }

    // Step 1: Verify customer exists or can be created
    setIsCheckingOut(true);
    try {
      // Get the store ID from the first item
      const storeId = items[0]?.store_id;
      if (!storeId) {
        alert('ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظپظٹ ط§ظ„ط³ظ„ط©');
        setIsCheckingOut(false);
        return;
      }

      // Request 1: Verify customer in database
      let customerData = null;

      try {
        customerData = await fetchCustomerByPhone(storeId, phone);
      } catch (verifyError) {
        console.error('Customer verification request failed, continuing with guest checkout:', verifyError);
      }

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
        name: verifiedCustomer.name || phone.trim() || 'ط¹ظ…ظٹظ„',
        phone: phone.trim(),
        address: address.trim(),
        customer_type: verifiedCustomer.customer_type || customerType || 'cash',
        isExisting: !!customerData?.id
      });

      setIsCheckingOut(false);
    } catch (err) {
      console.error('ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„:', err);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„');
      setIsCheckingOut(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!verificationModal) return;

    setIsConfirmingOrder(true);
    try {
      // Regular store checkout must not send customer_id.
      // Production currently rejects regular orders when customer_id is present.
      let customerId = null;

      if (isTopupCart) {
        const savedCustomer = localStorage.getItem('topupCustomer');
        if (savedCustomer) {
          try {
            const topupCustData = JSON.parse(savedCustomer);
            customerId = topupCustData.id;
          } catch (e) {
            console.error('Error parsing topupCustomer:', e);
          }
        }

        if (!customerId && user?.id) {
          customerId = user.id;
        }
      }
      
      const itemsByStore = enrichedItems.reduce((acc: any, item) => {
        const storeId = item.store_id;
        const storeType = isTopupCart ? 'topup' : 'regular';
        if (!acc[storeId]) {
          acc[storeId] = {
            items: [],
            store_type: storeType
          };
        }

        if (storeType === 'topup') {
          acc[storeId].items.push({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            product_name: (item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name,
            company_name: (item.store_name && item.store_name !== 'undefined') ? item.store_name : 'ط¨ط¯ظˆظ† ط´ط±ظƒط©',
            images: Array.isArray(item.images) ? item.images : [],
            gallery: Array.isArray(item.gallery) ? item.gallery : [],
            topup_codes: item.topup_codes
          });
        } else {
          acc[storeId].items.push({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          });
        }

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
                total_amount: itemAmount - itemDiscount,
                selected_images: (item.gallery && Array.isArray(item.gallery) ? item.gallery.map((img: any) => typeof img === 'string' ? img : img.url) : item.images) || []
              })
            });

            const data = await readJsonResponse(res, 'ظپط´ظ„ ط¥ظ†ط´ط§ط، ط·ظ„ط¨ ط§ظ„ط´ط­ظ†');
            if (!res.ok) {
              throw new Error(data.error || 'ظپط´ظ„ ط¥ظ†ط´ط§ط، ط·ظ„ط¨ ط§ظ„ط´ط­ظ†');
            }

            // Get images directly from response or fetch if needed
            let itemImages: any[] = data.images || [];
            let productImages: any[] = [];
            
            // Always fetch fresh images from order-images endpoint (images API has product info)
            try {
              console.log('ًں“¦ Fetching fresh images from order-images endpoint...');
              const imagesRes = await fetch(`/api/topup/order-images/${data.order_id}`);
              const imagesData = await readJsonResponse(imagesRes, 'ظپط´ظ„ ط¬ظ„ط¨ طµظˆط± ط·ظ„ط¨ ط§ظ„ط´ط­ظ†');
              
              console.log('ًں–¼ï¸ڈ Fetched images response:', {
                orderId: data.order_id,
                imagesCount: imagesData.images?.length || 0,
                hasGrouped: !!imagesData.grouped_by_product
              });
              
              // Use grouped images for this product
              if (imagesData.grouped_by_product && imagesData.grouped_by_product[item.product_id]) {
                productImages = imagesData.grouped_by_product[item.product_id];
                console.log(`  âœ“ Found ${productImages.length} images for product ${item.product_id}`);
              } else if (imagesData.images && Array.isArray(imagesData.images)) {
                // Fallback: filter by product_id from flat list
                productImages = imagesData.images.filter((img: any) => img.product_id === item.product_id);
                console.log(`  âœ“ Filtered to ${productImages.length} images for product ${item.product_id}`);
              }
            } catch (err) {
              console.error('â‌Œ Error fetching images from order-images:', err);
              // Last resort fallback: use purchase response images
              if (itemImages.length > 0 && typeof itemImages[0] === 'string') {
                console.log('  âڑ ï¸ڈ Using fallback images from purchase response');
                productImages = itemImages.slice(0, item.quantity).map((url: string) => ({ image_url: url }));
              }
            }

            if (productImages.length === 0) {
              const fallbackItemImages = getProductImageCandidates(item)
                .slice(0, item.quantity)
                .map((url: string) => ({ image_url: url, product_id: item.product_id }));

              if (fallbackItemImages.length > 0) {
                console.log(`  âڑ ï¸ڈ Using fallback product images from cart item for product ${item.product_id}`);
                productImages = fallbackItemImages;
              }
            }

            console.log(`ًں“± Product ${item.product_id} images count: ${productImages.length}`);
            allCodes = [...allCodes, ...productImages];
            confirmationItems.push({
              ...item,
              product_name: (item.product_name && item.product_name !== 'undefined') 
                ? item.product_name 
                : (item.name || 'ظ…ظ†طھط¬'),
              company_name: (item.company_name && item.company_name !== 'undefined') 
                ? item.company_name 
                : 'ط؛ظٹط± ظ…ط­ط¯ط¯',
              product_images: productImages
            });
            
            console.log('âœ… Confirmation item created with', productImages.length, 'images');
          }

          // Create single confirmation with all items
          orderConfirmations.push({
            orderId: `${storeId}-${Date.now()}`,
            items: confirmationItems,
            codes: allCodes,
            images: allCodes
          });
          
          console.log('ًں“¦ Order confirmation created for store:', {
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

          const data = await readJsonResponse(res, 'ظپط´ظ„ ظپظٹ ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨');
          if (!res.ok) {
            throw new Error(data.error || 'ظپط´ظ„ ظپظٹ ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨');
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
        // ط­ظپط¸ ظپظٹ localStorage ط­طھظ‰ ظٹطھظ…ظƒظ† ط§ظ„ط¹ظ…ظٹظ„ ظ…ظ† ط§ظ„ظˆطµظˆظ„ ظ„ظ„ط£ظƒظˆط§ط¯ ظ„ط§ط­ظ‚ط§ظ‹
        localStorage.setItem('orderConfirmation', JSON.stringify(confirmation));
        console.log('ًں’¾ Saved order confirmation to localStorage');
      } else {
        clearCart();
        alert(`طھظ… طھظ‚ط¯ظٹظ… ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­! طھظ… ط¥ظ†ط´ط§ط، ${Object.keys(itemsByStore).length} ط·ظ„ط¨`);
        navigate('/');
      }
    } catch (err: any) {
      alert(`ط®ط·ط£: ${err.message || 'ظپط´ظ„ ظپظٹ ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨'}`);
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  // ط¹ط±ط¶ طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨ ظ…ط¹ ط§ظ„ط£ظƒظˆط§ط¯
  if (orderConfirmation) {
    return (
      <div className={cn("w-full min-h-screen p-4 sm:p-8", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal mb-2">âœ… طھظ… طھط£ظƒظٹط¯ ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­!</h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ: {formatCurrency(orderConfirmation.totalAmount)}</p>
          </div>

          <div className="space-y-4 md:hidden">
            {orderConfirmation.confirmations.map((conf: any, idx: number) => 
              conf.items.map((item: any, itemIdx: number) => {
                // Use product-specific images if available, otherwise fall back to codes
                let availableCodes = parseImageCollection(item.product_images).map((imageUrl: string) => ({ image_url: imageUrl }));
                
                if (!Array.isArray(availableCodes) || availableCodes.length === 0) {
                  const fallbackItemImages = getOrderItemImageCandidates(item).slice(0, item.quantity || 0);
                  if (fallbackItemImages.length > 0) {
                    availableCodes = fallbackItemImages.map((imageUrl: string) => ({ image_url: imageUrl }));
                  }
                }

                if (!Array.isArray(availableCodes) || availableCodes.length === 0) {
                  // Fallback to old logic
                  let codes = conf.codes;
                  if (!Array.isArray(codes)) {
                    codes = [];
                  }
                  const displayQuantity = item.quantity || 0;
                  availableCodes = codes.slice(0, displayQuantity);
                }

                let displayName = '';
                if (item.product_name && item.product_name !== 'undefined') {
                  displayName = item.product_name;
                } else if (item.company_name && item.company_name !== 'undefined' && item.name) {
                  displayName = `${item.company_name} - ${item.name}`;
                } else if (item.name) {
                  displayName = item.name;
                } else {
                  displayName = 'ظ…ظ†طھط¬ ط¨ط¯ظˆظ† ط§ط³ظ…';
                }

                return (
                  <div key={`${idx}-${itemIdx}`} className={cn("rounded-2xl border p-4", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}>
                    <div className="mb-3">
                      <h3 className={cn("font-normal text-sm leading-6 break-words", isDarkMode ? "text-gray-100" : "text-gray-900")}>{displayName}</h3>
                      <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ظ„ظƒظ…ظٹط©: {item.quantity || 0}</p>
                    </div>
                    {availableCodes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableCodes.map((imageObj: any, cIdx: number) => {
                          const imageCandidates = parseImageCollection(imageObj.image_url || imageObj);
                          const imageUrl = imageCandidates[0] || PLACEHOLDER_IMAGE;
                          return (
                            <div key={cIdx} className="cursor-pointer" onClick={() => { setSelectedImage(imageUrl); setShowImageModal(true); }}>
                              <img src={imageUrl} data-image-index="0" alt={`طµظˆط±ط© ${cIdx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-300 hover:border-blue-500 hover:scale-105 transition-all" onError={(event) => handleImageFallback(event, imageCandidates)} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ…طھط§ط­ط©</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ط¬ط¯ظˆظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ ظˆط§ظ„ط£ظƒظˆط§ط¯ */}
          <div className={cn("hidden md:block rounded-lg border overflow-auto", isDarkMode ? "border-gray-700" : "border-gray-200")}>
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
                  <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬</th>
                  <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ظƒظ…ظٹط©</th>
                  <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط£ظƒظˆط§ط¯</th>
                </tr>
              </thead>
              <tbody>
                {orderConfirmation.confirmations.map((conf: any, idx: number) => 
                  conf.items.map((item: any, itemIdx: number) => {
                    // Use product-specific images if available
                    let availableCodes = parseImageCollection(item.product_images).map((imageUrl: string) => ({ image_url: imageUrl }));
                    
                    if (!Array.isArray(availableCodes) || availableCodes.length === 0) {
                      const fallbackItemImages = getOrderItemImageCandidates(item).slice(0, item.quantity || 0);
                      if (fallbackItemImages.length > 0) {
                        availableCodes = fallbackItemImages.map((imageUrl: string) => ({ image_url: imageUrl }));
                      }
                    }

                    if (!Array.isArray(availableCodes) || availableCodes.length === 0) {
                      // Fallback to old logic
                      let codes = conf.codes;
                      if (!Array.isArray(codes)) {
                        codes = [];
                      }
                      const displayQuantity = item.quantity || 0;
                      availableCodes = codes.slice(0, displayQuantity);
                    }
                    
                    // ط¨ظ†ط§ط، ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬ - طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… ظ…ط¹ط§ظ…ظ„ط© undefined
                    let displayName = '';
                    if (item.product_name && item.product_name !== 'undefined') {
                      displayName = item.product_name;
                    } else if (item.company_name && item.company_name !== 'undefined' && item.name) {
                      displayName = `${item.company_name} - ${item.name}`;
                    } else if (item.name) {
                      displayName = item.name;
                    } else {
                      displayName = 'ظ…ظ†طھط¬ ط¨ط¯ظˆظ† ط§ط³ظ…';
                    }
                    
                    console.log('ًں”چ Rendering item:', {
                      product_name: item.product_name,
                      company_name: item.company_name,
                      name: item.name,
                      displayName: displayName,
                      quantity: item.quantity || 0,
                      product_images_count: availableCodes.length
                    });
                    
                    return (
                      <tr key={`${idx}-${itemIdx}`} className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td className={cn("px-6 py-4 text-right align-top min-w-56", isDarkMode ? "text-gray-200 bg-gray-900/30" : "text-gray-800 bg-gray-50/30")}>
                          <div className="font-normal text-sm break-words">{displayName}</div>
                        </td>
                        <td className={cn("px-6 py-4 text-center align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          <div className="font-semibold text-lg">{item.quantity || 0}</div>
                        </td>
                        <td className={cn("px-6 py-4 text-right align-top", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                          {availableCodes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {availableCodes.map((imageObj: any, cIdx: number) => {
                                const imageCandidates = parseImageCollection(imageObj.image_url || imageObj);
                                const imageUrl = imageCandidates[0] || PLACEHOLDER_IMAGE;
                                return (
                                  <div key={cIdx} className="cursor-pointer" onClick={() => { setSelectedImage(imageUrl); setShowImageModal(true); }}>
                                    <img src={imageUrl} data-image-index="0" alt={`طµظˆط±ط© ${cIdx + 1}`} className="w-12 h-12 object-cover rounded border border-gray-300 hover:border-blue-500 hover:scale-105 transition-all" onError={(event) => handleImageFallback(event, imageCandidates)} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ…طھط§ط­ط©</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ط£ط²ط±ط§ط± ط§ظ„طھط­ظƒظ… ظˆط§ظ„ط¹ظˆط¯ط© */}
          <div className={cn("mt-8 flex flex-col sm:flex-row gap-4 justify-center")}>
            <button
              onClick={async () => {
                // ط­ظپط¸ ط§ظ„طµظˆط± ظپظٹ ظ…ظ„ظپ ZIP
                try {
                  const zip = new JSZip();
                  
                  // collection طµظˆط± ط­ط³ط¨ ط§ظ„ظ…ظ†طھط¬
                  let imageIndex = 0;
                  let hasImages = false;
                  
                  for (const conf of orderConfirmation.confirmations) {
                    for (const item of conf.items) {
                      const productImages = item.product_images || [];
                      
                      if (productImages.length > 0) {
                        hasImages = true;
                        
                        // ط¥ظ†ط´ط§ط، ظپظˆظ„ط¯ط± ظ„ظ„ظ…ظ†طھط¬
                        const productName = item.product_name || item.name || `ظ…ظ†طھط¬_${item.product_id}`;
                        const productFolder = zip.folder(productName.replace(/[\/\\:*?"<>|]/g, '_'));
                        
                        // ط¥ط¶ط§ظپط© ط§ظ„طµظˆط± ظ„ظ„ظپظˆظ„ط¯ط±
                        for (let i = 0; i < productImages.length; i++) {
                          const imageUrl = productImages[i].image_url || productImages[i];
                          if (imageUrl) {
                            try {
                              const response = await fetch(imageUrl, { mode: 'cors' });
                              const blob = await response.blob();
                              
                              // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ
                              const contentType = blob.type;
                              const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
                              
                              productFolder?.file(`طµظˆط±ط©_${i + 1}.${ext}`, blob);
                              imageIndex++;
                            } catch (err) {
                              console.warn(`طھط­ط°ظٹط±: ظ„ظ… ظٹطھظ… طھط­ظ…ظٹظ„ طµظˆط±ط© ظ…ظ† ${productName}`, err);
                            }
                          }
                        }
                      }
                    }
                  }
                  
                  if (!hasImages) {
                    alert('â‌Œ ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ„ظ„ط­ظپط¸');
                    return;
                  }
                  
                  // ط¥ظ†ط´ط§ط، ظ…ظ„ظپ ZIP ظˆطھط­ظ…ظٹظ„ظ‡
                  const zipBlob = await zip.generateAsync({ type: 'blob' });
                  const zipUrl = URL.createObjectURL(zipBlob);
                  const link = document.createElement('a');
                  link.href = zipUrl;
                  link.download = `طµظˆط±_ط§ظ„ط·ظ„ط¨_${new Date().toISOString().slice(0, 10)}.zip`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(zipUrl);
                  
                  alert(`âœ… طھظ… ط­ظپط¸ ${imageIndex} طµظˆط±ط© ظپظٹ ظ…ظ„ظپ ZIP!`);
                } catch (err) {
                  console.error('ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„طµظˆط±:', err);
                  alert(`â‌Œ ط®ط·ط£: ${(err as any).message || 'ظپط´ظ„ ط­ظپط¸ ط§ظ„طµظˆط±'}`);
                }
              }}
              className="px-8 py-3 rounded-lg text-white font-normal transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              ًں’¾ ط­ظپط¸ ط§ظ„طµظˆط± ظپظٹ ظپظˆظ„ط¯ط±
            </button>

            <button
              onClick={() => {
                clearCart();
                setOrderConfirmation(null);
                localStorage.removeItem('orderConfirmation');
                // For topup orders, navigate back to the store; otherwise go to home
                const topupStoreSlug = localStorage.getItem('topupStoreSlug');
                if (isTopupCart && topupStoreSlug) {
                  navigate(`/topup/${topupStoreSlug}`);
                } else {
                  navigate('/');
                }
              }}
              className={cn("px-8 py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-100" : "bg-gray-300 hover:bg-gray-400 text-gray-900")}
            >
              â†گ ط§ظ„ط¹ظˆط¯ط© {isTopupCart ? 'ظ„ظ„ظ…طھط¬ط±' : 'ظ„ظ„ط±ط¦ظٹط³ظٹط©'}
            </button>
          </div>

          {/* Image Lightbox Modal */}
          {showImageModal && selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImageModal(false)}>
              <div className="relative max-w-2xl max-h-screen" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-300"
                >
                  âœ•
                </button>
                <img src={selectedImage} alt="طµظˆط±ط© ظƒط§ظ…ظ„ط©" className="w-full h-full object-contain rounded-lg" onError={(e: any) => e.target.style.display = 'none'} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8 text-center" dir="rtl">
        <div className={cn("p-12 rounded-2xl shadow-sm", isDarkMode ? "bg-gray-800" : "bg-white")}>
          <ShoppingCart size={64} className={cn("mx-auto mb-4", isDarkMode ? "text-gray-700" : "text-gray-300")} />
          <h2 className={cn("text-2xl font-normal mb-2", isDarkMode ? "text-gray-200" : "text-gray-900")}>ط¹ط±ط¨ط© ط§ظ„طھط³ظˆظ‚ ظپط§ط±ط؛ط©</h2>
          <p className={cn("mb-8", isDarkMode ? "text-gray-400" : "text-gray-500")}>ظ„ظ… طھط¶ظپ ط£ظٹ ظ…ظ†طھط¬ط§طھ ط¥ظ„ظ‰ ط³ظ„طھظƒ ط¨ط¹ط¯.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-xl text-white font-normal transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            طھطµظپط­ ط§ظ„ظ…ظ†طھط¬ط§طھ
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
          ط¹ط±ط¨ط© ط§ظ„طھط³ظˆظ‚
        </h1>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* ط¬ط¯ظˆظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ */}
          <div className="xl:col-span-2">
            <div className={cn("hidden md:block overflow-x-auto rounded-lg border", isDarkMode ? "border-gray-700" : "border-gray-200")}>
              <table className="w-full">
                <thead>
                  <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-100"}>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬</th>
                    <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط¹ط¯ط¯</th>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط³ط¹ط±</th>
                    <th className={cn("px-6 py-4 text-right font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</th>
                    <th className={cn("px-6 py-4 text-center font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط¥ط¬ط±ط§ط،</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedItems.map((item) => {
                    const imageCandidates = getProductImageCandidates(item);
                    const itemImage = imageCandidates[0];

                    return (
                    <tr key={item.id} className={isDarkMode ? "border-gray-700" : "border-gray-200"}>
                      <td className={cn("px-6 py-4 border-t", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        <div className="flex items-center gap-3">
                          {itemImage ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(itemImage);
                                setShowImageModal(true);
                              }}
                              className={cn("h-14 w-14 overflow-hidden rounded-xl border flex-shrink-0", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}
                              title="ط¹ط±ط¶ ط§ظ„طµظˆط±ط©"
                            >
                              <img
                                src={itemImage}
                                alt={item.name || 'طµظˆط±ط© ط§ظ„ظ…ظ†طھط¬'}
                                className="h-full w-full object-cover"
                                data-image-index="0"
                                onError={(event) => handleImageFallback(event, imageCandidates)}
                              />
                            </button>
                          ) : null}
                          <div className="min-w-0">
                            {(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name || `[ط¨ط¯ظˆظ† ط§ط³ظ… - ط±ظ‚ظ…: ${item.id}]`}
                          </div>
                        </div>
                      </td>
                      <td className={cn("px-6 py-4 border-t text-center", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                            className={cn("px-2 py-1 rounded border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                            title="طھظ‚ظ„ظٹظ„ ط§ظ„ظƒظ…ظٹط©"
                          >
                            âˆ’
                          </button>
                          <span className="w-8 text-center text-lg font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={cn("px-2 py-1 rounded border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                            title="ط²ظٹط§ط¯ط© ط§ظ„ظƒظ…ظٹط©"
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
                  )})}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {enrichedItems.map((item) => {
                const imageCandidates = getProductImageCandidates(item);
                const itemImage = imageCandidates[0];

                return (
                <div key={item.id} className={cn("rounded-2xl border p-4", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      {itemImage ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(itemImage);
                            setShowImageModal(true);
                          }}
                          className={cn("h-16 w-16 overflow-hidden rounded-2xl border flex-shrink-0", isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white")}
                          title="ط¹ط±ط¶ ط§ظ„طµظˆط±ط©"
                        >
                          <img
                            src={itemImage}
                            alt={item.name || 'طµظˆط±ط© ط§ظ„ظ…ظ†طھط¬'}
                            className="h-full w-full object-cover"
                            data-image-index="0"
                            onError={(event) => handleImageFallback(event, imageCandidates)}
                          />
                        </button>
                      ) : null}
                      <div className="min-w-0">
                        <h3 className={cn("font-normal text-sm leading-6 break-words", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                          {(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name || `[ط¨ط¯ظˆظ† ط§ط³ظ… - ط±ظ‚ظ…: ${item.id}]`}
                        </h3>
                        <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          ط³ط¹ط± ط§ظ„ظˆط­ط¯ط©: {formatCurrency(getItemPrice(item, customerType || user?.customer_type))}
                        </p>
                      </div>
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
                        title="طھظ‚ظ„ظٹظ„ ط§ظ„ظƒظ…ظٹط©"
                      >
                        âˆ’
                      </button>
                      <span className="min-w-8 text-center text-base font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={cn("px-3 py-1.5 rounded-xl border transition-all", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100")}
                        title="ط²ظٹط§ط¯ط© ط§ظ„ظƒظ…ظٹط©"
                      >
                        +
                      </button>
                    </div>
                    <div className={cn("text-sm font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                      {formatCurrency(getItemPrice(item, customerType || user?.customer_type) * item.quantity)}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* ط§ظ„ظ…ظ„ط®طµ ظˆط§ظ„ط£ط²ط±ط§ط± */}
          <div className={cn("p-4 sm:p-6 rounded-lg border xl:sticky xl:top-8 h-fit", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")}>
            {/* ظ‚ط³ظٹظ…ط© ط§ظ„ط®طµظ… */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ظ‚ط³ظٹظ…ط© ط§ظ„ط®طµظ…</label>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <input 
                  type="text"
                  placeholder="ط£ط¯ط®ظ„ ط§ظ„ط±ظ…ط²"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className={cn("flex-1 px-3 py-2 border rounded text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 rounded text-white font-normal text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  طھط·ط¨ظٹظ‚
                </button>
              </div>
              {couponError && <p className="text-red-500 text-xs">{couponError}</p>}
              {appliedCoupon && (
                <div className="p-2 bg-green-500/10 rounded border border-green-500/30 text-xs text-green-600 mt-2">
                  âœ… طھط·ط¨ظٹظ‚: {appliedCoupon.code} ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : formatCurrency(appliedCoupon.discount_value)})
                </div>
              )}
            </div>

            {/* ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط³ظ„ظٹظ… */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              {isTopupCart && (
                <>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط§ط³ظ…</label>
                  <input 
                    type="text"
                    value={name}
                    readOnly
                    placeholder="ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ط§ظ„ظ…ط³ط¬ظ„"
                    className={cn("w-full px-3 py-2 border rounded text-sm mb-3 cursor-not-allowed", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-700")}
                  />
                </>
              )}
              <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}> ط§ظ„ظ‡ط§طھظپ</label>
              <input 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ"
                readOnly={isTopupCart}
                className={cn("w-full px-3 py-2 border rounded text-sm mb-3", isTopupCart ? (isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed" : "bg-gray-100 border-gray-200 text-gray-700 cursor-not-allowed") : (isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"))}
              />
              {isTopupCart && (
                <p className={cn("text-xs mb-3", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                  طھظ… طھط¹ط¨ط¦ط© ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ظ…ظ† طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ ظ…طھط¬ط± ط§ظ„ط´ط­ظ†.
                </p>
              )}
              {!isTopupCart && (
                <>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًں“چ ط§ظ„ط¹ظ†ظˆط§ظ†</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ط£ط¯ط®ظ„ ط¹ظ†ظˆط§ظ† ط§ظ„طھط³ظ„ظٹظ…"
                    className={cn("w-full px-3 py-2 border rounded text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </>
              )}
              
              {/* ط¹ط±ط¶ ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„ ظˆط§ظ„ط³ط¹ط± ط§ظ„ظ…ط·ط¨ظ‚ */}
              {phone && (
                <div className={cn("mt-4 p-3 rounded text-sm", isDarkMode ? "bg-gray-700" : "bg-blue-50")}>
                  {isVerifyingCustomer ? (
                    <p className="text-gray-500">ًں”چ ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„...</p>
                  ) : customerType ? (
                    <p className={isDarkMode ? "text-blue-300" : "text-blue-700"}>
                      {customerType === 'reseller' ? 'ًںڈھ ط¹ظ…ظٹظ„ ط¬ظ…ظ„ط© (ظ†ظ‚ط·ط© ط§ظ„ط¨ظٹط¹)' : 'ًں‘¤ ط¹ظ…ظٹظ„ ظ†ظ‚ط¯ظٹ (ظ…ظپط±ط¯)'}
                      {customerType === 'reseller' && ' - ط³ظٹطھظ… طھط·ط¨ظٹظ‚ ط£ط³ط¹ط§ط± ط§ظ„ط¬ظ…ظ„ط©'}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* ط§ظ„ظ…ظ„ط®طµ */}
            <div className="mb-6 pb-6 border-b" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>ط§ظ„ظ…ط¬ظ…ظˆط¹ ط§ظ„ظپط±ط¹ظٹ</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-normal">
                    <span>ط§ظ„ط®طµظ…</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-normal text-lg pt-2" style={{color: primaryColor}}>
                  <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</span>
                  <span>{formatCurrency(subtotal - discount)}</span>
                </div>
              </div>
            </div>

            {/* ط§ظ„ط£ط²ط±ط§ط± */}
            <div className="space-y-2">
              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut || items.length === 0 || !phone.trim() || (!isTopupCart && !address.trim())}
                className="w-full py-3 rounded-lg text-white font-normal transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isCheckingOut ? 'âڈ³ ط¬ط§ط±ظٹ...' : 'âœ… طھط£ظƒظٹط¯ ط§ظ„ط´ط±ط§ط،'}
              </button>
              <button 
                onClick={() => navigate(-1)}
                className={cn("w-full py-2 rounded-lg font-normal transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              >
                âœ• ط¥ظ„ط؛ط§ط،
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
                      طھط¹ط¯ظٹظ„ ط§ظ„ظƒظ…ظٹط©
                    </h2>
                    <p className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                      {(selectedForQuantity.store_name && selectedForQuantity.store_name !== 'undefined') ? `${selectedForQuantity.store_name} - ${selectedForQuantity.name}` : selectedForQuantity.name || 'ظ…ظ†طھط¬'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedForQuantity(null)}
                    className={cn("text-xl font-bold transition-colors", isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600")}
                  >
                    أ—
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
                  <p className={cn("text-xs mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ط³ط¹ط± ظ„ظ„ظˆط­ط¯ط©</p>
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
                    <p className={cn("text-xs mb-3", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ظƒظ…ظٹط©</p>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))}
                        className={cn("w-12 h-12 rounded-lg font-bold text-xl transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-900")}
                      >
                        âˆ’
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
                    <p className={cn("text-xs mb-1", isDarkMode ? "text-green-400" : "text-green-600")}>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</p>
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
                  âœ… طھط·ط¨ظٹظ‚
                </button>
                <button
                  onClick={() => setSelectedForQuantity(null)}
                  className={cn("flex-1 py-2 rounded-lg font-normal transition-colors", isDarkMode ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-900 hover:bg-gray-300")}
                >
                  ط¥ظ„ط؛ط§ط،
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
                  ًں”چ طھط£ظƒظٹط¯ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„
                </h2>
                <p className={cn("text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  ظٹط±ط¬ظ‰ طھط£ظƒظٹط¯ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظ‚ط¨ظ„ ط¥طھظ…ط§ظ… ط§ظ„ط·ظ„ط¨
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Address */}
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <p className={cn("text-xs mb-2 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“چ ط§ظ„ط¹ظ†ظˆط§ظ†</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {verificationModal.address}
                  </p>
                </div>

                {/* Phone */}
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <p className={cn("text-xs mb-2 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“± ط§ظ„ظ‡ط§طھظپ</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {verificationModal.phone}
                  </p>
                </div>

                {/* Customer Type Badge */}
                <div className={cn("p-4 rounded-lg", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "bg-purple-900/30 border border-purple-700" : "bg-purple-50 border border-purple-200") : (isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"))}>
                  <p className={cn("text-xs font-medium", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "text-purple-400" : "text-purple-600") : (isDarkMode ? "text-green-400" : "text-green-600"))}>
                    ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„
                  </p>
                  <p className={cn("text-lg font-bold mt-1", verificationModal.customer_type === 'reseller' ? (isDarkMode ? "text-purple-300" : "text-purple-700") : (isDarkMode ? "text-green-300" : "text-green-700"))}>
                    {verificationModal.customer_type === 'reseller' ? 'ًںڈھ ط¹ظ…ظٹظ„ ط¬ظ…ظ„ط©' : 'ًں‘¤ ط¹ظ…ظٹظ„ ظ†ظ‚ط¯ظٹ'}
                  </p>
                </div>

                {/* Status */}
                {verificationModal.isExisting && (
                  <div className={cn("p-3 rounded-lg text-sm", isDarkMode ? "bg-green-900/20 text-green-300" : "bg-green-100 text-green-700")}>
                    âœ… طھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
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
                  {isConfirmingOrder ? 'âڈ³ ط¬ط§ط±ظٹ...' : 'âœ… طھط£ظƒظٹط¯ ظˆط§ظ„ط¯ظپط¹'}
                </button>
                <button
                  onClick={() => setVerificationModal(null)}
                  disabled={isConfirmingOrder}
                  className={cn("flex-1 py-2 rounded-lg font-normal transition-colors disabled:opacity-50", isDarkMode ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-gray-200 text-gray-900 hover:bg-gray-300")}
                >
                  ط¥ظ„ط؛ط§ط،
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
            طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ط·ظ„ظˆط¨
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
          ظ„ط؛ط±ط¶ ط¹ط±ط¶ ط§ظ„ط¯ط§ط´ط¨ظˆط±ط¯ ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„طŒ ظˆط¨ط¹ط¯ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظٹظ…ظƒظ† ظ„ظ„ط£ظٹظ‚ظˆظ†ط© ط¹ط±ط¶ ط¯ط§ط´ط¨ظˆط±ط¯ ط§ظ„ظ…طھط¬ط± ط§ظ„ظ…ظپطھظˆط­
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
            ط¥ط؛ظ„ط§ظ‚
          </button>
          <button
            onClick={onLogin}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
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
    { icon: BarChart3, label: 'ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ', section: 'stats' },
    { icon: Package, label: 'ط§ظ„ظ…ظ†طھط¬ط§طھ', section: 'products' },
    { icon: ShoppingCart, label: 'ط§ظ„ط·ظ„ط¨ط§طھ', section: 'orders' },
    { icon: Users, label: 'ط§ظ„ط¹ظ…ظ„ط§ط،', section: 'customers' },
    { icon: Ticket, label: 'ط§ظ„ظƒظˆط¨ظˆظ†ط§طھ', section: 'coupons' },
    { icon: Gift, label: 'ط§ظ„ظ…ط²ط§ط¯ط§طھ', section: 'auctions' },
    { icon: Settings, label: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', section: 'settings' },
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
            ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
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
    { icon: Home, label: 'ط§ظ„ط±ط¦ظٹط³ظٹط©', path: '/' },
    { icon: StoreIcon, label: 'ط§ظ„ظ…طھط§ط¬ط±', path: '/stores' },
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
      const basePath = user.store_type === 'topup' ? '/topup-merchant' : '/merchant';
      navigate(`${basePath}/${section}`);
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
          
          {/* Dashboard Button - Hidden */}
          <button
            onClick={handleDashboardClick}
            className={cn(
              "relative min-w-[72px] flex-1 rounded-2xl px-2 py-2 text-center transition-colors hidden",
              (isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100")
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <LayoutDashboard size={18} className="flex-shrink-0" />
              <span className="text-[10px] leading-tight line-clamp-2">
                {user ? 'ط¯ط§ط´ط¨ظˆط±ط¯' : 'طھط³ط¬ظٹظ„'}
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
            <span className="text-[10px] leading-tight">ط¹ظˆط¯ط©</span>
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
            <span className="text-[10px] leading-tight">ط§ظ„ط±ط¦ظٹط³ظٹط©</span>
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
            <span className="text-[10px] leading-tight">ط§ظ„ط³ظ„ط©</span>
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
            <span className="text-[10px] leading-tight">ظ…طھط§ط¬ط±</span>
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
  const [adminAppName, setAdminAppName] = useState('ظ…ظ†طµطھظٹ');
  const [adminLogoUrl, setAdminLogoUrl] = useState('');
  
  useEffect(() => {
    // Fetch admin settings specifically
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && data.app_name) {
          setAdminAppName(data.app_name);
          setAdminLogoUrl(data.logo_url || '');
          console.log("ًں“‹ Loaded ADMIN settings for login page:", data);
        }
      })
      .catch(err => console.error("Failed to load admin settings:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear error first
    console.log('ًں”گ ظ…ط­ط§ظˆظ„ط© طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„:', { phone, password });
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      
      console.log('ًں“¥ ط§ظ„ط§ط³طھط¬ط§ط¨ط©:', res.status, res.ok);
      
      if (res.ok) {
        const user = await res.json();
        console.log('âœ… ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…:', user);
        setUser(user);
        console.log('ًں”„ طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھطŒ ط§ظ„ط¢ظ† ط§ظ„طھظˆط¬ظٹظ‡...');
        if (user.role === 'admin') {
          console.log('ًںژ¯ طھظˆط¬ظٹظ‡ ط¥ظ„ظ‰ /admin');
          navigate('/admin');
        }
        else if (user.role === 'merchant') {
          // Check store type for correct routing
          if (user.store_type === 'topup') {
            navigate('/topup-merchant');
          } else {
            navigate('/merchant');
          }
        }
        else navigate('/');
      } else {
        console.log('â‌Œ ط®ط·ط£ ظ…ظ† ط§ظ„ظ€ API');
        setError('ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©');
      }
    } catch (err) {
      console.error('â‌Œ ط®ط·ط£:', err);
      setError('ط­ط¯ط« ط®ط·ط£ ظ…ط§');
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col", isDarkMode ? "bg-gray-900" : "bg-[#F5F5F5]")}>
      <div className={cn("border-b py-4 px-6", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-indigo-600 font-normal text-sm hover:text-indigo-700 transition-colors">
            ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ظ†طµط©
          </Link>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2.5 rounded-lg border transition-all flex items-center justify-center",
              isDarkMode 
                ? "bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800" 
                : "bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100"
            )}
            title={isDarkMode ? "ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­" : "ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†"}
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
          <span>ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…ظ†طµط© ط§ظ„ط¹ط§ظ…ط©</span>
        </Link>
        <Card className="p-8">
          <div className="text-center mb-8">
            {adminLogoUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-indigo-50 shadow-lg bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <img src={adminLogoUrl} className="w-full h-full object-cover" alt="admin-logo" />
              </div>
            ) : null}
            <h1 className="text-4xl font-normal tracking-tighter text-indigo-600">{adminAppName}</h1>
            <p className="text-gray-500 mt-2">ط£ظ‡ظ„ط§ ط¨ط¹ظˆط¯طھظƒ ظ„ظ„ظ…ظ†طµط©</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={cn("block text-sm font-normal mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
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
              <label className={cn("block text-sm font-normal mb-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              className={cn("w-full px-4 py-3 rounded-xl border border-black/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 text-gray-900")}  
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
              />
            </div>
            {error && <p className={cn("text-sm font-medium", isDarkMode ? "text-red-400" : "text-red-500")}>{error}</p>}
            <Button type="submit" className="w-full bg-indigo-600 text-white py-4 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/register-merchant" className="block text-sm font-normal text-indigo-600 hover:text-indigo-700">
              ظ‡ظ„ طھط±ظٹط¯ ظپطھط­ ظ…طھط¬ط±ظƒ ط§ظ„ط®ط§طµطں ط³ط¬ظ„ ظƒطھط§ط¬ط± ط§ظ„ط¢ظ†
            </Link>
            <Link to="/" className={cn("block text-sm font-normal", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")}>
              طھطµظپط­ ط§ظ„ظ…ظ†طµط© ظƒط²ط§ط¦ط±
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
    category: 'ط¹ط§ظ…',
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
        setError(data.error || 'ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط·ظ„ط¨');
      }
    } catch (err) {
      setError('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط®ط§ط¯ظ…');
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
                ط§ط®طھط± ظ†ظˆط¹ ظ…طھط¬ط±ظƒ
              </h1>
              <p className={cn("text-lg font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                ظ…ط§ ظ†ظˆط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„طھظٹ طھط±ظٹط¯ ط¨ظٹط¹ظ‡ط§طں
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
                  ظ…طھط¬ط± ط¹ط§ط¯ظٹ
                </h3>
                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  ط£ط²ظٹط§ط،طŒ ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھطŒ ظ…ظ†ط²ظ„ظٹط§طھطŒ ط£ظˆ ط£ظٹ ظ…ظ†طھط¬ط§طھ ط£ط®ط±ظ‰
                </p>
                <div className={cn("mt-4 pt-4 border-t text-xs font-normal", isDarkMode ? "border-blue-700 text-blue-400" : "border-blue-200 text-blue-600")}>
                  â†گ ط§ط¶ط؛ط· ظ„ظ„ظ…طھط§ط¨ط¹ط©
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
                  ظ…طھط¬ط± ط¨ط·ط§ظ‚ط§طھ ط´ط­ظ†
                </h3>
                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  ط¨ط·ط§ظ‚ط§طھ ط´ط­ظ† طھط¹ط¨ط¦ط© ط§ظ„ط±طµظٹط¯ (Zain, Asiacell, Korek...)
                </p>
                <div className={cn("mt-4 pt-4 border-t text-xs font-normal", isDarkMode ? "border-green-700 text-green-400" : "border-green-200 text-green-600")}>
                  â†گ ط§ط¶ط؛ط· ظ„ظ„ظ…طھط§ط¨ط¹ط©
                </div>
              </motion.button>
            </div>

            <p className={cn("mt-8 text-center text-xs font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>
              ظٹظ…ظƒظ†ظƒ طھط؛ظٹظٹط± ظ†ظˆط¹ ط§ظ„ظ…طھط¬ط± ظ„ط§ط­ظ‚ط§ظ‹ ظ…ظ† ط¥ط¹ط¯ط§ط¯ط§طھ ط­ط³ط§ط¨ظƒ
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
            <h1 className={cn("text-2xl font-normal mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>طھظ… ط§ط³طھظ„ط§ظ… ط·ظ„ط¨ظƒ ط¨ظ†ط¬ط§ط­!</h1>
            <p className={cn("mb-8 font-medium", isDarkMode ? "text-gray-300" : "text-gray-600")}>
              ط´ظƒط±ظ‹ط§ ظ„ط§ظ‡طھظ…ط§ظ…ظƒ ط¨ط§ظ„ط§ظ†ط¶ظ…ط§ظ… ط¥ظ„ظ‰ {appName}. ط·ظ„ط¨ظƒ ط§ظ„ط¢ظ† ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ظ…ظ† ظ‚ط¨ظ„ ط§ظ„ط¥ط¯ط§ط±ط©طŒ ظˆط³ظ†ظ‚ظˆظ… ط¨ط§ظ„طھظˆط§طµظ„ ظ…ط¹ظƒ ط¹ط¨ط± طھظ„ظٹط¬ط±ط§ظ… ظپظˆط± طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±.
            </p>
            <Button 
              onClick={() => {
                logout();
                window.location.href = '/login';
              }} 
              className="w-full bg-indigo-600 text-white py-4 font-normal rounded-xl"
            >
              ط§ظ„ط¹ظˆط¯ط© ظ„طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
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
              {storeType === 'topup' ? 'ًں’³ ظ…طھط¬ط± ط¨ط·ط§ظ‚ط§طھ ط´ط­ظ†' : 'ًں›چï¸ڈ ظ…طھط¬ط± ط¹ط§ط¯ظٹ'}
            </div>
            <h1 className="text-3xl font-normal text-indigo-600 tracking-tighter mb-2">ط§ظ†ط¶ظ… ظƒطھط§ط¬ط±</h1>
            <p className="text-gray-500 font-medium">ط§ط¨ط¯ط£ ط±ط­ظ„طھظƒ ط§ظ„طھط¬ط§ط±ظٹط© ظ…ط¹ظ†ط§ ط§ظ„ظٹظˆظ…</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„</label>
                <input 
                  type="text" 
                  required
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="ظ…ط­ظ…ط¯ ط¹ظ„ظٹ"
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ط³ظ… ط§ظ„ظ…طھط¬ط±</label>
                <input 
                  type="text" 
                  required
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value})}
                  placeholder={storeType === 'topup' ? 'ظ…طھط¬ط± ط¨ط·ط§ظ‚ط§طھظٹ' : 'ظ…طھط¬ط± ط§ظ„ط£ظ†ط§ظ‚ط©'}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
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
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>(ط§ط®طھظٹط§ط±ظٹ)</span></label>
              <input 
                type="email"
                className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="example@email.com (ط§ط®طھظٹط§ط±ظٹ)"
              />
            </div>

            <div>
              <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</label>
              <input 
                type="password" 
                required
                className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            {storeType === 'regular' && (
              <div>
                <label className={cn("block text-sm font-normal mb-1.5", isDarkMode ? "text-gray-300" : "text-gray-700")}>طھطµظ†ظٹظپ ط§ظ„ظ…طھط¬ط±</label>
                <select 
                  className={cn("w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5 text-gray-900")}
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="ط¹ط§ظ…">ط¹ط§ظ…</option>
                  <option value="ط£ط²ظٹط§ط،">ط£ط²ظٹط§ط،</option>
                  <option value="ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھ">ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھ</option>
                  <option value="ط§ظ„ظ…ظ†ط²ظ„">ط§ظ„ظ…ظ†ط²ظ„</option>
                </select>
              </div>
            )}

            {error && <p className="text-red-500 text-sm font-normal text-center bg-red-50 py-3 rounded-xl">{error}</p>}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 text-lg font-normal shadow-xl shadow-indigo-100 mt-4 disabled:opacity-50 rounded-xl"
            >
              {loading ? 'ط¬ط§ط±ظٹ ط¥ط±ط³ط§ظ„ ط§ظ„ط·ظ„ط¨...' : 'ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„ط§ظ†ط¶ظ…ط§ظ…'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowStoreTypeModal(true);
                setStoreType(null);
              }}
              className="w-full text-sm font-normal text-gray-400 hover:text-indigo-600 transition-colors py-2"
            >
              â†گ طھط؛ظٹظٹط± ظ†ظˆط¹ ط§ظ„ظ…طھط¬ط±
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-normal text-gray-400 hover:text-indigo-600">
                ظ„ط¯ظٹظƒ ط­ط³ط§ط¨ ط¨ط§ظ„ظپط¹ظ„طں ط³ط¬ظ„ ط¯ط®ظˆظ„ظƒ
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
  const [pendingStores, setPendingStores] = useState<(Store & { owner_name?: string; status?: string; owner_phone?: string; slug?: string })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStores: 0, totalUsers: 0, totalCustomers: 0, totalRevenue: 0, totalOrders: 0, adminCommissionPercentage: 0, adminCommission: 0, merchantRevenue: 0 });
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fallback for section if useParams doesn't work
  const effectiveSection = section || (() => {
    const path = location.pathname;
    // Try multiple methods to extract section
    if (path.includes('/admin/')) {
      const parts = path.split('/admin/')[1];
      if (parts) {
        return parts.split('/')[0];
      }
    } else if (path === '/admin' || path === '/admin/') {
      return 'overview'; // default section when at /admin
    }
    return undefined;
  })();
  

  
  const { appName, logoUrl, setSettings } = useSettingsStore();
  const { dashboardQuery } = useSearchStore();
  const adminLogoUploadRef = useRef<HTMLInputElement>(null);

  const [adminConfig, setAdminConfig] = useState({ app_name: '', logo_url: '', admin_commission_percentage: 0 });
  
  // Filter states
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  const filteredStores = stores.filter(s => {
    // If no search query, return all stores
    if (!dashboardQuery || dashboardQuery.trim() === '') {
      return true;
    }
    // Apply filters only if there's a query
    return ((s as any).store_name || s.name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_phone || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    ((s as any).slug || '').toLowerCase().includes(dashboardQuery.toLowerCase());
  });

  const filteredPendingStores = pendingStores.filter(s => 
    ((s as any).store_name || s.name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_name || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (s.owner_phone || '').toLowerCase().includes(dashboardQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (u.phone || '').toLowerCase().includes(dashboardQuery.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(dashboardQuery.toLowerCase()))
  );

  const isStoreApproved = (store: any) => Boolean(store?.is_active || store?.status === 'approved' || store?.status === 'active');
  const isStorePending = (store: any) => Boolean(!isStoreApproved(store) && store?.status === 'pending');
  
  // Load pending stores when approvals section is opened
  useEffect(() => {
    const loadPendingStores = async () => {
      try {
        const res = await fetch('/api/admin/pending-stores');
        if (res.ok) {
          const data = await res.json();
          setPendingStores(data);
        }
      } catch (err) {
        console.error('Error loading pending stores:', err);
      }
    };
    
    if (section === 'approvals') {
      loadPendingStores();
    }
  }, [section]);
  
  useEffect(() => {
    if (section === 'settings') {
      fetch('/api/settings?role=admin')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object' && !data.error && data.app_name) {
            console.log("ًں“‹ Loaded settings:", data);
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

  // Load initial data on component mount
  useEffect(() => {
    console.log('ًںڑ€ AdminDashboard mounted - loading initial data');
    const loadInitialData = async () => {
      try {
        const storesRes = await fetch('/api/admin/stores').then(res => {
          console.log('Response status:', res.status);
          return res.json();
        }).catch(err => {
          console.error('Fetch error:', err);
          return [];
        });
        console.log('âœ… Initial stores response:', storesRes);
        console.log('   Type:', typeof storesRes);
        console.log('   Is Array:', Array.isArray(storesRes));
        console.log('   Length:', storesRes?.length || 0);
        const finalStores = Array.isArray(storesRes) ? storesRes : [];
        console.log('   Setting stores to:', finalStores.length, 'items');
        setStores(finalStores);
      } catch (err) {
        console.error("Failed to load initial stores:", err);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [storesRes, statsRes, usersRes, ordersRes, customersRes, adminUsersRes] = await Promise.all([
          fetch('/api/admin/stores').then(res => {
            console.log('Admin stores response status:', res.status);
            return res.json();
          }).catch(err => {
            console.error('Admin stores fetch error:', err);
            return [];
          }),
          fetch('/api/admin/stats').then(res => res.json()).catch(() => ({})),
          fetch('/api/admin/users').then(res => res.json()).catch(() => []),
          fetch('/api/admin/orders-report').then(res => res.json()).catch(() => []),
          fetch('/api/admin/customers').then(res => res.json()).catch(() => []),
          fetch('/api/admin/admin-users').then(res => res.json()).catch(() => [])
        ]);
        
        console.log('ًں”„ طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ - Stores data received:', storesRes?.length || 0, 'store(s)');
        
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
        
        const finalStores = Array.isArray(storesRes) ? storesRes : [];
        console.log('âœ… Setting stores to:', finalStores.length, 'stores');
        setStores(finalStores);
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
    
    // Load data whenever section changes or component mounts
    console.log('ًں“چ AdminDashboard effect triggered - section:', section, 'effectiveSection:', effectiveSection);
    loadData();
  }, [section]);

  // Auto-refresh data every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [storesRes, statsRes, usersRes, ordersRes, customersRes, adminUsersRes] = await Promise.all([
          fetch('/api/admin/stores').then(res => res.json()).catch(() => []),
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
      console.log(`ًں”„ Toggling subscription: storeId=${storeId}, currentStatus=${currentStatus}`);
      const response = await fetch(`/api/admin/stores/${storeId}/toggle-subscription-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_paid: !currentStatus })
      });
      
      const data = await response.json();
      console.log(`ًں“ٹ Response:`, data, `Status: ${response.status}`);
      
      if (response.ok) {
        // Update local state
        const updatedOrders = adminOrders.map(order => 
          order.store_id === storeId 
            ? { ...order, subscription_paid: !currentStatus }
            : order
        );
        setAdminOrders(updatedOrders);
        alert('طھظ… طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ ط¨ظ†ط¬ط§ط­');
      } else {
        const errorMsg = data.error || 'ظپط´ظ„ طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ';
        alert(errorMsg);
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: ' + (error instanceof Error ? error.message : 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ'));
    }
  };

  const filteredOrders = getFilteredOrders();

  const confirmApproval = async () => {
    if (!approveDialog.store) return;
    
    if (!approveDialog.customPhone) {
      alert("ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظ…ط¹ط±ظ‘ظپ طھظ„ظٹط¬ط±ط§ظ… ط£ظˆ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆظ„ط§ظ‹");
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
        console.log('âœ… Store approved successfully:', approveDialog.store.store_name);
        
        // Refresh all lists
        await Promise.all([
          fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh stores error:', err)),
          fetch('/api/admin/pending-stores').then(res => res.json()).then(setPendingStores).catch(err => console.error('Refresh pending stores error:', err)),
          fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Refresh stats error:', err))
        ]);
        
        // Close the approval dialog
        setApproveDialog({ store: null, customPhone: '' });
        
        // Show success alert
        alert("طھظ… طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ظ…طھط¬ط± ظˆطھظپط¹ظٹظ„ظ‡ ط¨ظ†ط¬ط§ط­! ط§ظ†طھظ‚ظ„ ط¥ظ„ظ‰ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…طھط§ط¬ط± ظ„ط±ط¤ظٹطھظ‡");
        
        // Navigate to stores section after a short delay to ensure data is refreshed
        setTimeout(() => {
          navigate('/admin/stores');
        }, 500);
      } else {
        const errorMsg = data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ ط¹ظ†ط¯ طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±";
        alert("ظپط´ظ„ ظپظٹ طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±: " + errorMsg);
        console.error('Approval error details:', data);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + errorMsg);
      console.error('Connection error during approval:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/reject-store/${id}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        // Refresh all lists with Promise.all to wait for completion
        await Promise.all([
          fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err)),
          fetch('/api/admin/pending-stores').then(res => res.json()).then(setPendingStores).catch(err => console.error('Refresh pending stores error:', err)),
          fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err))
        ]);
        
        alert("طھظ… ط±ظپط¶ ط·ظ„ط¨ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­");
      } else {
        alert("ظپط´ظ„ ط±ظپط¶ ط§ظ„ظ…طھط¬ط±: " + (data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
        console.error('Reject error:', data);
      }
    } catch (error) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + (error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
      console.error('Connection error:', error);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/suspend-store/${id}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert("طھظ… ط¥ظٹظ‚ط§ظپ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­");
        fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("ظپط´ظ„ ط¥ظٹظ‚ط§ظپ ط§ظ„ظ…طھط¬ط±: " + (data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
        console.error('Suspend error:', data);
      }
    } catch (error) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + (error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
      console.error('Connection error:', error);
    }
  };

  const handleToggleStore = async (store: any) => {
    try {
      const res = await fetch(`/api/admin/toggle-store/${store.id}`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        const action = data.is_active ? 'طھظپط¹ظٹظ„' : 'ط¥ظٹظ‚ط§ظپ';
        alert(`طھظ… ${action} ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­`);
        fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("ظپط´ظ„ طھط؛ظٹظٹط± ط­ط§ظ„ط© ط§ظ„ظ…طھط¬ط±: " + (data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
        console.error('Toggle error:', data);
      }
    } catch (error) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + (error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
      console.error('Connection error:', error);
    }
  };

  const handleDeleteStore = async (id: number) => {
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط± ظ†ظ‡ط§ط¦ظٹط§ظ‹طں")) return;
    
    try {
      const res = await fetch(`/api/admin/delete-store/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        alert("طھظ… ط­ط°ظپ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­");
        fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("ظپط´ظ„ ط­ط°ظپ ط§ظ„ظ…طھط¬ط±: " + (data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
        console.error('Delete error:', data);
      }
    } catch (error) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + (error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
      console.error('Connection error:', error);
    }
  };

  const handleEditStore = async (store: Store & { store_name?: string; owner_name?: string; percentage_enabled?: boolean }) => {
    const newName = prompt("طھط¹ط¯ظٹظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±:", store.store_name || (store as any).name);
    if (!newName) return;
    const newOwner = prompt("طھط¹ط¯ظٹظ„ ط§ط³ظ… ط§ظ„ظ…ط§ظ„ظƒ:", store.owner_name || "ط؛ظٹط± ظ…ط¹ط±ظˆظپ");
    if (!newOwner) return;
    
    const percentageEnabledStr = prompt(
      "ظ‡ظ„ ظٹط®ط¶ط¹ ط§ظ„ظ…طھط¬ط± ظ„ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط¦ظˆظٹط©طں (ط§ظƒطھط¨ 'yes' ط£ظˆ 'no'):",
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
        alert("طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­");
        fetch('/api/admin/stores').then(res => res.json()).then(setStores).catch(err => console.error('Refresh error:', err));
        fetch('/api/admin/stats').then(res => res.json()).then(setStats).catch(err => console.error('Stats refresh error:', err));
      } else {
        alert("ظپط´ظ„ ط§ظ„طھط­ط¯ظٹط«: " + (data.error || "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
        console.error('Update error:', data);
      }
    } catch (error) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: " + (error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ"));
      console.error('Connection error:', error);
    }
  };

  const handleAddStore = async () => {
    const name = prompt("ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط± ط§ظ„ط¬ط¯ظٹط¯:");
    if (!name) return;
    const owner = prompt("ط§ط³ظ… طµط§ط­ط¨ ط§ظ„ظ…طھط¬ط±:");
    if (!owner) return;
    const phone = prompt("ط±ظ‚ظ… ظ‡ط§طھظپ طµط§ط­ط¨ ط§ظ„ظ…طھط¬ط±:");
    if (!phone) return;
    
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        store_name: name, 
        owner_name: owner,
        owner_phone: phone
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­");
      fetch('/api/admin/stores').then(res => res.json()).then(setStores);
      fetch('/api/admin/stats').then(res => res.json()).then(setStats);
    } else {
      alert("ط®ط·ط£: " + (data.error || "ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„ظ…طھط¬ط±"));
      console.error("Store creation error:", data);
    }
  };

  const handleAddUser = async () => {
    const name = prompt("ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…:");
    if (!name) return;
    const phone = prompt("ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ:");
    if (!phone) return;
    const role = prompt("ط§ظ„ط¯ظˆط± (admin, merchant, customer):", "customer");
    
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
    const newName = prompt("طھط¹ط¯ظٹظ„ ط§ظ„ط§ط³ظ…:", userToEdit.name);
    if (!newName) return;
    const newPhone = prompt("طھط¹ط¯ظٹظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ:", userToEdit.phone || '');
    if (!newPhone) return;
    const newRole = prompt("طھط¹ط¯ظٹظ„ ط§ظ„ط¯ظˆط± (admin, merchant, customer):", userToEdit.role);
    
    try {
      const res = await fetch(`/api/admin/update-user/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: newPhone, role: newRole })
      });

      if (res.ok) {
        alert("طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­");
        fetch('/api/admin/users').then(res => res.json()).then(setUsers);
      } else {
        const data = await res.json();
        alert(data.error || "ظپط´ظ„ ط§ظ„طھط­ط¯ظٹط«");
      }
    } catch (e) {
      alert("ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±");
    }
  };

  const handleDeleteUser = async (id: string | number) => {
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ…طں ط³ظٹطھظ… ط­ط°ظپ ط¬ظ…ظٹط¹ ظ…طھط§ط¬ط±ظ‡ ط£ظٹط¶ط§ظ‹.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetch('/api/admin/users').then(res => res.json()).then(setUsers);
      fetch('/api/admin/stats').then(res => res.json()).then(setStats);
      alert("طھظ… ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ… ظˆظ…طھط§ط¬ط±ظ‡ ط¨ظ†ط¬ط§ط­");
    } else {
      const data = await res.json();
      alert("ط®ط·ط£: " + (data.error || "ظپط´ظ„ ط­ط°ظپ ط§ظ„ظ…ط³طھط®ط¯ظ…"));
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." role="admin">
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
          { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', value: formatCurrency(safeStats.totalRevenue), icon: CreditCard, color: 'bg-indigo-600', textColor: 'text-indigo-600' },
          { label: 'ط¹ظ…ظˆظ„ط© ط§ظ„ط¢ط¯ظ…ظ†', value: formatCurrency(safeStats.adminCommission), icon: TrendingUp, color: 'bg-emerald-600', textColor: 'text-emerald-600', subtext: `${safeStats.adminCommissionPercentage}%` },
          { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ط§ط،', value: safeStats.totalCustomers, icon: Users, color: 'bg-purple-600', textColor: 'text-purple-600' },
          { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ', value: safeStats.totalOrders, icon: ShoppingCart, color: 'bg-amber-600', textColor: 'text-amber-600' },
          { label: 'ط¹ط¯ط¯ ط§ظ„ظ…طھط§ط¬ط±', value: safeStats.totalStores, icon: StoreIcon, color: 'bg-blue-600', textColor: 'text-blue-600' },
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
    console.log('renderStoresTable called - limit:', limit);
    console.log('stores.length:', stores.length, 'dashboardQuery:', dashboardQuery, 'filteredStores:', filteredStores.length);
    // Always show all stores if no search query, otherwise show filtered
    const displayedStores = limit ? 
      (dashboardQuery && dashboardQuery.trim() !== '' ? filteredStores.slice(0, limit) : stores.slice(0, limit)) 
      : (dashboardQuery && dashboardQuery.trim() !== '' ? filteredStores : stores);
    console.log('displayedStores.length:', displayedStores.length, 'showing:', displayedStores.map((s: any) => s.store_name || s.name).join(', '));
    return (
      <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}> 
        <div className={cn("p-6 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-white")}> 
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ط¯ط§ط±ط© ط§ظ„ظ…طھط§ط¬ط± ط§ظ„ط­ط¯ظٹط«ط©</h3>
          <Button 
            onClick={handleAddStore}
            className="bg-indigo-600 text-white text-sm font-normal px-6 py-2 rounded-xl hidden"
          >
            ط¥ط¶ط§ظپط© ظ…طھط¬ط±
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={cn("text-xs uppercase tracking-widest font-normal", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50/50 text-gray-400")}>
              <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50/50")}> 
                <th className="px-6 py-5">ط§ط³ظ… ط§ظ„ظ…طھط¬ط±</th>
                <th className="px-6 py-5">ط§ظ„ظ…ط§ظ„ظƒ</th>
                <th className="px-6 py-5">ط§ظ„ط­ط§ظ„ط©</th>
                <th className="px-6 py-5">ط§ظ„ظ†ط³ط¨ط© %</th>
                <th className="px-6 py-5">ط§ظ„ط±ط§ط¨ط·</th>
                <th className="px-6 py-5">ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5"> 
              {displayedStores.map((store) => (
                <tr key={store.id} className={cn(
                  isDarkMode ? "bg-gray-900 hover:bg-gray-700/50" : "bg-white hover:bg-indigo-50/30",
                  "transition-all group"
                )}> 
                  <td className={cn("px-6 py-4 font-normal group-hover:text-indigo-600", isDarkMode ? "text-gray-100" : "text-gray-900")}>{(store as any).store_name || store.name}</td>
                  <td className={cn("px-6 py-4 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>{store.owner_name || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      isStorePending(store) ? "bg-amber-100 text-amber-700" : 
                      store.status === 'rejected' ? "bg-red-100 text-red-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {isStorePending(store) ? 'ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ظ…ظˆط§ظپظ‚ط©' : 
                       store.status === 'rejected' ? 'ظ…ط±ظپظˆط¶' : 'ظ†ط´ط·'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      (store as any).percentage_enabled !== false ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {(store as any).percentage_enabled !== false ? 'âœ“ ظ…ظپط¹ظ„' : 'âœ— ظ…ط¹ط·ظ„'}
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
                          title="طھط­ظˆظٹظ„ ط¥ظ„ظ‰ ظ…ط¹ظ„ظ‚"
                        >
                          <Pause size={14} />
                          طھط¹ظ„ظٹظ‚
                        </button>
                      )}
                      {isStorePending(store) && (
                        <button 
                          onClick={() => handleApprove(store)}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-normal text-xs bg-emerald-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          <CheckCircle size={14} />
                          طھظپط¹ظٹظ„
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleStore(store)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          store.is_active 
                            ? "text-green-400 hover:text-green-600 hover:bg-green-50" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        )}
                        title={store.is_active ? "ط¥ظٹظ‚ط§ظپ ط§ظ„ظ…طھط¬ط±" : "طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±"}
                      >
                        {store.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button 
                        onClick={() => handleEditStore(store)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="طھط¹ط¯ظٹظ„ ط§ظ„ظ…طھط¬ط±"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteStore(store.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="ط­ط°ظپ ط§ظ„ظ…طھط¬ط±"
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
                    {dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ طھظˆط¬ط¯ ظ…طھط§ط¬ط± ظ…ط³ط¬ظ„ط© ط­ط§ظ„ظٹط§ظ‹'}
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
              <h3 className={cn("font-normal text-xl", isDarkMode ? "text-white" : "text-white")}>طھظ‚ط±ظٹط± ط§ظ„ط£ط¯ط§ط، ط§ظ„ط¹ط§ظ… - ط§ظ„ط·ظ„ط¨ط§طھ</h3>
              <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{filteredOrders.length} ط·ظ„ط¨</span>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>ظ…ظ† ط§ظ„طھط§ط±ظٹط®</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>ط¥ظ„ظ‰ ط§ظ„طھط§ط±ظٹط®</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                />
              </div>
              <div>
                <label className={cn("text-sm font-normal mb-2 block", isDarkMode ? "text-gray-200" : "text-gray-700")}>ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ</label>
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className={cn("w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 bg-white text-gray-900")}
                >
                  <option value="all">ط§ظ„ظƒظ„</option>
                  <option value="paid">ظ…ط¯ظپظˆط¹</option>
                  <option value="unpaid">ظ„ظ… ظٹطھظ… ط§ظ„ط¯ظپط¹</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className={cn("border-b border-black/5", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>طµط§ط­ط¨ ط§ظ„ظ…طھط¬ط±</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ط§ظ„ظ…ط¨ظ„ط؛</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ظ…ط¨ظ„ط؛ ط§ظ„ط¹ظ…ظˆظ„ط©</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ط§ظ„ط­ط§ظ„ط©</th>
                  <th className={cn("px-6 py-4 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>ط§ظ„طھط§ط±ظٹط®</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className={cn("border-b border-black/5 transition-colors", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/50")}>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>#{order.id}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>{order.owner_name || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-cyan-400" : "text-indigo-600")}>{formatCurrency(order.total_amount || 0)}</td>
                    <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-emerald-400" : "text-green-600")}>{formatCurrency(order.commission_amount || 0)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSubscriptionStatus(order.store_id, order.subscription_paid)}
                        className={`px-3 py-1 rounded-full text-xs font-normal cursor-pointer transition-all hover:opacity-80 ${
                          order.subscription_paid ? (isDarkMode ? 'bg-emerald-900 text-emerald-300 hover:bg-red-900 hover:text-red-300' : 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800') : (isDarkMode ? 'bg-red-900 text-red-300 hover:bg-emerald-900 hover:text-emerald-300' : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800')
                        }`}
                        title="ط§ط¶ط؛ط· ظ„طھط¨ط¯ظٹظ„ ط§ظ„ط­ط§ظ„ط©"
                      >
                        {order.subscription_paid ? 'âœ“ ظ…ط¯ظپظˆط¹' : 'âœ• ظ„ظ… ظٹطھظ… ط§ظ„ط¯ظپط¹'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-normal ${
                        order.status === 'completed' ? (isDarkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-green-100 text-green-800') :
                        order.status === 'pending' ? (isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-yellow-100 text-yellow-800') :
                        order.status === 'cancelled' ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800') :
                        (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {order.status === 'completed' ? 'âœ“ ظ…ظƒطھظ…ظ„' :
                         order.status === 'pending' ? 'âڈ³ ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±' :
                         order.status === 'cancelled' ? 'âœ• ظ…ظ„ط؛ظ‰' :
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
                <p className={cn("font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ طھط·ط§ط¨ظ‚ ط§ظ„ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ…ط®طھط§ط±ط©</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-6">
            <BarChart3 size={64} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-normal text-gray-900 mb-2">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط­طھظ‰ ط§ظ„ط¢ظ†</h3>
          <p className="text-gray-500 font-medium">ط³ظٹطھظ… ط¹ط±ط¶ طھظ‚ط±ظٹط± ط§ظ„ط£ط¯ط§ط، ظ‡ظ†ط§ ط¹ظ†ط¯ ظˆط¬ظˆط¯ ط·ظ„ط¨ط§طھ</p>
        </Card>
      )}
    </div>
  );

  const handleSaveAdminSettings = async () => {
    if (!adminConfig.app_name) {
      alert("â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„طھط·ط¨ظٹظ‚");
      return;
    }
    
    try {
      const commissionValue = adminConfig.admin_commission_percentage;
      const finalCommission = isNaN(commissionValue) ? 0 : Math.max(0, Math.min(100, commissionValue));
      
      console.log("ًں“¤ Saving ADMIN settings ONLY (independent from merchant settings):", {
        app_name: adminConfig.app_name,
        logo_url: adminConfig.logo_url ? "âœ“ Logo present" : "âœ— No logo",
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
      
      console.log("ًں“¥ Response status:", res.status, res.statusText);
      
      // Parse response ONCE and store it
      let responseData;
      try {
        responseData = await res.json();
        console.log("âœ… Response data:", responseData);
      } catch (parseError) {
        console.error("â‌Œ Could not parse response:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      // Now check if HTTP was not OK
      if (!res.ok) {
        let errorMessage = responseData.error || responseData.message || `HTTP ${res.status}: ${res.statusText}`;
        console.error("â‌Œ Server error:", responseData);
        alert("â‌Œ ظپط´ظ„ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ: " + errorMessage);
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
      
      console.log("âœ… Admin settings saved successfully");
      alert("âœ… طھظ… ط­ظپط¸ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¢ط¯ظ…ظ† ط¨ظ†ط¬ط§ط­");
      
      // Refresh page to ensure all data is updated
      setTimeout(() => window.location.reload(), 500);
      return; // Ensure no code runs after reload
    } catch (error) {
      console.error("â‌Œ Network/Parse Error:", error);
      console.error("Full error object:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      
      const errorMsg = error instanceof Error ? error.message : "ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹";
      console.error("Final error message:", errorMsg);
      
      alert("â‌Œ ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ: " + errorMsg);
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
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظ†طµط©</h3>
        <button
          onClick={() => navigate('/admin')}
          className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700")}
          title="ط¥ط؛ظ„ط§ظ‚"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-5">
        
        {/* ط§ط³ظ… ط§ظ„ظ…ظ†طµط© */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">ط§ط³ظ… ط§ظ„ظ…ظ†طµط©</label>
          <input 
            type="text" 
            value={adminConfig.app_name} 
            onChange={(e) => setAdminConfig({ ...adminConfig, app_name: e.target.value })}
            placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ظ†طµط©"
            className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
          />
        </div>
        
        {/* ط´ط¹ط§ط± ط§ظ„ظ…ظ†طµط© */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">ط´ط¹ط§ط± ط§ظ„ظ…ظ†طµط©</label>
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
                <p className={cn("text-xs font-normal mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ط¶ط؛ط· ظ„ط§ط®طھظٹط§ط± طµظˆط±ط©</p>
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
        
        {/* ط§ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط¦ظˆظٹط© */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">ظ†ط³ط¨ط© ط¹ظ…ظˆظ„ط© ط§ظ„ط¢ط¯ظ…ظ† (%)</label>
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
              placeholder="ط£ط¯ط®ظ„ ط§ظ„ظ†ط³ط¨ط©"
              className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
            />
            <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            ظ‡ط°ظ‡ ط§ظ„ظ†ط³ط¨ط© ط³طھظڈط·ط¨ظ‚ ط¹ظ„ظ‰ ظ…ط¨ظٹط¹ط§طھ ط§ظ„ظ…طھط§ط¬ط± ط§ظ„طھظٹ طھط®ط¶ط¹ ظ„ظ„ظ†ط³ط¨ط© ط§ظ„ظ…ط¦ظˆظٹط© ظپظ‚ط·.
          </p>
        </div>
        
        {/* ط²ط± ط§ظ„ط­ظپط¸ */}
        <button 
          onClick={handleSaveAdminSettings} 
          className="w-full py-3 rounded-lg text-white font-normal text-base shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
        >
          ًں’¾ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ
        </button>

        {/* ط²ط± ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ */}
        <button 
          onClick={() => {
            if (window.confirm('âڑ ï¸ڈ ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط±ط؛ط¨طھظƒ ظپظٹ ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھطں\nظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط، ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ط§ط¬ط¹ ط¹ظ†ظ‡!')) {
              clearAllData();
            }
          }}
          className="w-full py-3 rounded-lg text-white font-normal text-base shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
        >
          ًں—‘ï¸ڈ ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ
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
          alert(`طھظ… ${!currentAccess ? 'ط¥ط¹ط·ط§ط،' : 'ط³ط­ط¨'} ط§ظ„طµظ„ط§ط­ظٹط© ط¨ظ†ط¬ط§ط­`);
        } else {
          alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ طھط­ط¯ظٹط« ط§ظ„طµظ„ط§ط­ظٹط©');
        }
      } catch (error) {
        alert('ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„');
        console.error(error);
      }
    };

    return (
      <Card className={cn(isDarkMode ? "bg-gray-800" : "bg-white")}>
        <div className={cn("p-6 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
          <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ط¯ط§ط±ط© طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¢ط¯ظ…ظ†</h3>
          <div className={cn("px-4 py-1.5 rounded-full text-xs font-normal", isDarkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-700")}>
            {filteredAdminUsers.length} ظ…ط³طھط®ط¯ظ…
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className={cn("text-xs font-normal uppercase tracking-widest", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50/50 text-gray-400")}>
              <tr>
                <th className="px-6 py-5">ط§ظ„ط§ط³ظ…</th>
                <th className="px-6 py-5">ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</th>
                <th className="px-6 py-5">ط§ظ„ط¯ظˆط±</th>
                <th className="px-6 py-5">ط§ظ„طµظ„ط§ط­ظٹط©</th>
                <th className="px-6 py-5 w-32 text-left">ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-black/5", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
              {filteredAdminUsers.map((u) => (
                <tr key={u.id} className={cn("transition-colors", isDarkMode ? "hover:bg-gray-700" : "hover:bg-indigo-50/30")}>
                  <td className={cn("px-6 py-4 font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{u.name}</td>
                  <td className={cn("px-6 py-4 font-medium", isDarkMode ? "text-gray-300" : "text-gray-500")}>{u.phone || 'ط¨ط¯ظˆظ† ط±ظ‚ظ…'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      u.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"
                    )}>
                      {u.role === 'admin' ? 'ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…' : 'طھط§ط¬ط±'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-normal uppercase rounded-full tracking-wider",
                      u.can_access_admin ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {u.can_access_admin ? 'âœ“ ظپط¹ط§ظ„' : 'âœ— ظ…ط¹ط·ظ„'}
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
                          {u.can_access_admin ? 'ط³ط­ط¨ ط§ظ„طµظ„ط§ط­ظٹط©' : 'ط¥ط¹ط·ط§ط، طµظ„ط§ط­ظٹط©'}
                        </button>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-xs text-gray-400 font-normal">ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط£ط³ط§ط³ظٹ</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdminUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn("px-6 py-12 text-center font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>
                    {dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ ظٹظˆط¬ط¯ ظ…ط³طھط®ط¯ظ…ظˆظ† ط¨طµظ„ط§ط­ظٹط§طھ ط¥ط¯ط§ط±ط©'}
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
          <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط·ظ„ط¨ط§طھ ط§ظ†ط¶ظ…ط§ظ… ط§ظ„ظ…طھط§ط¬ط±</h3>
        </div>
        <div className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
          {filteredPendingStores.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <StoreIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-normal">{dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ظ…ط¹ظ„ظ‚ط© ط­ط§ظ„ظٹط§ظ‹'}</p>
            </div>
          ) : (
            filteredPendingStores.map(store => (
              <div key={store.id} className={cn("p-6 flex items-center justify-between transition-colors", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <StoreIcon size={24} />
                  </div>
                  <div>
                    <p className={cn("font-normal text-lg", isDarkMode ? "text-gray-100" : "text-gray-900")}>{(store as any).store_name || store.name}</p>
                    <div className={cn("flex gap-3 text-sm font-medium", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      <span>ط§ظ„ظ…ط§ظ„ظƒ: {store.owner_name}</span>
                      <span className={cn(isDarkMode ? "text-gray-600" : "text-gray-300")}>|</span>
                      <span>ط§ظ„ظ‡ط§طھظپ: {store.owner_phone}</span>
                      <span className={cn(isDarkMode ? "text-gray-600" : "text-gray-300")}>|</span>
                      <span>ط§ظ„ظ…ط¹ط±ظپ: @{store.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleApprove(store)}
                    className="bg-indigo-600 text-white px-6 py-2.5 font-normal hover:shadow-lg hover:shadow-indigo-200 transition-all"
                  >
                    ظ…ظˆط§ظپظ‚ط©
                  </Button>
                  <Button 
                    onClick={() => handleReject(store.id)}
                    className="bg-white border-2 border-red-50 text-red-600 px-6 py-2.5 font-normal hover:bg-red-50 transition-all"
                  >
                    ط±ظپط¶ ط§ظ„طھط§ط¬ط±
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
    stores: stats.totalStores || 0,
    approvals: pendingStores.length,
    users: adminUsers.length
  };

  const renderApproveModal = () => {
    if (!approveDialog.store) return null;
    
    const store = approveDialog.store;
    const storeName = store.store_name || store.name;
    const ownerName = store.owner_name || 'طµط§ط­ط¨ ط§ظ„ظ…طھط¬ط±';
    const storeLink = `${window.location.origin}/store/${store.slug || store.id}`;

    const messagePreview = `
  *طھظ‡ط§ظ†ظٹظ†ط§! طھظ… طھظپط¹ظٹظ„ ظ…طھط¬ط±ظƒ ط¨ظ†ط¬ط§ط­*

  ظ…ط±ط­ط¨ط§ظ‹ *${ownerName}*,

  ظٹط³ط¹ط¯ظ†ط§ ط¥ط¹ظ„ط§ظ…ظƒظ… ط¨ط£ظ†ظ‡ طھظ…طھ ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ طھظپط¹ظٹظ„ ظ…طھط¬ط±ظƒظ…:
  *${storeName}*

  *ط±ط§ط¨ط· ط§ظ„ط´ط±ط§ط، ظˆط§ظ„ظ…ط¹ط§ظٹظ†ط© (ظ„ظ„ط¹ظ…ظ„ط§ط،):*
  ${storeLink}

  *ط±ط§ط¨ط· ظ„ظˆط­ط© طھط­ظƒظ… ط§ظ„ظ…طھط¬ط± (ظ„ظ„طھط§ط¬ط±):*
  ${window.location.origin}/login

  ظٹظ…ظƒظ†ظƒظ… ط§ظ„ط¢ظ† ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طھط¬ط§طھ ظˆط§ط³طھظ‚ط¨ط§ظ„ ط§ظ„ط·ظ„ط¨ط§طھ ظپظˆط±ط§ظ‹.

  ==================
  *ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©*
    `.trim();

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn("rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl", isDarkMode ? "bg-gray-800" : "bg-white")}
        >
          <div className="bg-indigo-600 p-6 text-white text-center">
            <h3 className="text-xl font-normal">طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط± ظˆط¥ط±ط³ط§ظ„ ط±ط³ط§ظ„ط©</h3>
            <p className="opacity-80 text-sm">ط³ظٹطھظ… ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط§ط¨ط· ظˆط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ظ„ظ„طھط§ط¬ط±</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className={cn("block text-xs font-normal uppercase mb-2", isDarkMode ? "text-gray-400" : "text-gray-400")}>{`ظ…ط¹ط±ظ‘ظپ طھظ„ظٹط¬ط±ط§ظ… (ط§ظ„ظ…ط³طھظ‚ط¨ظگظ„)`}</label>
              <input 
                type="text" 
                value={approveDialog.customPhone}
                onChange={(e) => setApproveDialog({...approveDialog, customPhone: e.target.value})}
                placeholder="077XXXXXXXX"
                className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-gray-100 text-gray-900")}
              />
              {!store.owner_phone && (
                <p className="mt-2 text-xs text-amber-600 font-normal">طھظ†ط¨ظٹظ‡: ط§ظ„ظ…طھط¬ط± ظ…ط³ط¬ظ„ ط¨ط¯ظˆظ† ط±ظ‚ظ… ظ‡ط§طھظپطŒ ظٹط±ط¬ظ‰ ظƒطھط§ط¨طھظ‡ ظ‡ظ†ط§.</p>
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
                ط¥ظ„ط؛ط§ط،
              </Button>
              <Button 
                onClick={confirmApproval}
                className="flex-[2] bg-indigo-600 text-white py-3 px-8 font-normal rounded-xl"
              >
                طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط© ظˆطھظپط¹ظٹظ„
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
                // Open WhatsApp share with message
                const whatsappUrl = `https://wa.me/${waPhone}?text=${encodedMsg}`;
                window.open(whatsappUrl, '_blank');
                // Close the dialog
                setApproveDialog({ store: null, customPhone: '' });
              }}
              className="w-full bg-emerald-500 text-white py-4 font-normal rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
            >
              <Send size={20} />
              <span>ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط³ط§ظ„ط© ط¹ط¨ط± ظˆط§طھط³ط§ط¨ ظٹط¯ظˆظٹط§ظ‹</span>
            </Button>
            <p className="text-[10px] text-center text-gray-400 font-medium">ط®ط·ظˆط© ظٹط¯ظˆظٹط©: ط§ط¶ط؛ط· طھظپط¹ظٹظ„ ط£ظˆظ„ط§ظ‹ ط«ظ… ط¥ط±ط³ط§ظ„ ظ„ط¶ظ…ط§ظ† طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ظ…طھط¬ط±</p>
          </div>
        </motion.div>
      </div>
    );
  };
  return (
    <DashboardLayout 
      title={
        section === 'users' ? "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†" : 
        section === 'approvals' ? "ط·ظ„ط¨ط§طھ ط§ظ„ط§ظ†ط¶ظ…ط§ظ…" : 
        section === 'stores' ? "ط§ظ„ظ…طھط§ط¬ط±" : 
        section === 'stats' ? "ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ" : 
        "ظ†ط¸ط±ط© ط¹ط§ظ…ط©"
      } 
      role="admin"
      counts={sidebarCounts}
    >
      <>
        {console.log('AdminDashboard - section:', section, 'effectiveSection:', effectiveSection, 'stores count:', stores.length)}
        {effectiveSection === 'users' ? renderUsers() : 
         effectiveSection === 'approvals' ? renderApprovals() : 
         (effectiveSection === 'stores' || effectiveSection === 'store') ? renderStoresTable() : 
         effectiveSection === 'stats' ? renderStats() : 
         effectiveSection === 'settings' ? renderSettings() : 
         renderOverview()}
         {renderApproveModal()}
      </>
    </DashboardLayout>
  );
};

const MerchantDashboard = () => {
  const { isDarkMode } = useTheme();
  const { user, setUser } = useAuthStore();
  const { dashboardQuery, setDashboardQuery } = useSearchStore();
  const { primaryColor } = useSettingsStore();
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
    fulfillmentStats: { total: 0, pending: 0, completed: 0 },
    topProducts: []
  });
  const { section } = useParams();
  const navigate = useNavigate();
  
  console.log('ًں”§ MerchantDashboard - section:', section, 'orders length:', orders.length);
  const logoUploadRef = useRef<HTMLInputElement>(null);

  const filteredProducts = Array.isArray(products) ? products.filter(p => 
    (p.name && p.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (p.description && p.description.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (p.category_name && p.category_name.toLowerCase().includes(dashboardQuery.toLowerCase()))
  ) : [];

  const filteredCategories = Array.isArray(categories) ? categories.filter(c => 
    c.name && c.name.toLowerCase().includes(dashboardQuery.toLowerCase())
  ) : [];

  const filteredOrders = Array.isArray(orders) ? orders.filter(o => true) : [];

  const filteredCustomers = Array.isArray(customers) ? customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(dashboardQuery.toLowerCase())) ||
    (c.phone || '').includes(dashboardQuery)
  ) : [];

  const filteredCoupons = Array.isArray(coupons) ? coupons.filter(c => 
    (c.code && c.code.toLowerCase().includes(dashboardQuery.toLowerCase()))
  ) : [];

  const sidebarCounts = {
    products: Array.isArray(products) ? products.length : 0,
    categories: Array.isArray(categories) ? categories.length : 0,
    orders: Array.isArray(orders) ? orders.filter(o => o.status === 'pending').length : 0,
    customers: Array.isArray(customers) ? customers.length : 0,
    coupons: Array.isArray(coupons) ? coupons.filter(c => c.is_active).length : 0,
    auctions: Array.isArray(auctions) ? auctions.filter(a => !a.sold_at).length : 0
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
    monthly: [],
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrder: 0,
      from: null,
      to: null
    }
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState<'all' | 'order' | 'auction'>('all');
  const [isLoadingSalesData, setIsLoadingSalesData] = useState(false);
  const [salesReportError, setSalesReportError] = useState('');

  // Auction Save Modal
  const [showAuctionSaveModal, setShowAuctionSaveModal] = useState(false);
  const [selectedAuctionForSave, setSelectedAuctionForSave] = useState<any>(null);
  const [finalSalePrice, setFinalSalePrice] = useState('');

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
    password: '',
    starting_balance: '',
    credit_limit: '',
    notes: '',
    customer_type: 'cash'
  });
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
    auction_start_time: '',
    auction_end_time: '',
    auction_price: '',
    is_auction: false
  });
  const updateProductForm = (patch: Partial<typeof productForm>) => {
    setProductForm(prev => ({ ...prev, ...patch }));
  };
  const syncAuctionPriceFields = (nextValue: string) => {
    updateProductForm({
      price: nextValue,
      auction_price: nextValue
    });
  };
  const filterAuctionsForStore = (allAuctions: any[], storeId?: number | string | null) => {
    if (!Array.isArray(allAuctions) || !storeId) return [];
    return allAuctions.filter((auction: any) => Number(auction.store_id) === Number(storeId));
  };
  const fetchMerchantAuctions = async (storeId?: number | string | null) => {
    if (!storeId) {
      setAuctions([]);
      return [];
    }

    const auctionsRes = await fetch('/api/auctions/active?includeSold=true');
    const auctionsData = await auctionsRes.json();
    const merchantAuctions = filterAuctionsForStore(Array.isArray(auctionsData) ? auctionsData : [], storeId);
    setAuctions(merchantAuctions);
    return merchantAuctions;
  };
  const fetchMerchantStatsData = async (storeId?: number | string | null) => {
    if (!storeId) return null;

    const statsRes = await fetch(`/api/merchant/stats?storeId=${storeId}`);
    const statsData = await statsRes.json();
    if (statsData && !statsData.error) {
      setMerchantStats(statsData);
      return statsData;
    }

    return null;
  };
  const fetchAuctionBidders = async (auctionId?: number | string | null) => {
    if (!auctionId) {
      setBidders([]);
      return [];
    }

    const res = await fetch(`/api/auctions/${auctionId}/bidders`);
    const data = await res.json();
    const nextBidders = Array.isArray(data) ? data : [];
    setBidders(nextBidders);
    return nextBidders;
  };
  const refreshMerchantAuctionState = async (auctionId?: number | string | null) => {
    const updatedAuctions = await fetchMerchantAuctions(user?.store_id);
    await fetchMerchantStatsData(user?.store_id);

    if (!auctionId) return updatedAuctions;

    const refreshedAuction = Array.isArray(updatedAuctions)
      ? updatedAuctions.find((auction: any) => Number(auction.id) === Number(auctionId))
      : null;

    if (refreshedAuction) {
      setSelectedAuctionForBidders(refreshedAuction);
      await fetchAuctionBidders(refreshedAuction.id);
    } else {
      setSelectedAuctionForBidders(null);
      setBidders([]);
    }

    return updatedAuctions;
  };
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

  // Customer Statement Modal States
  const [showCustomerStatement, setShowCustomerStatement] = useState(false);
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState<any>(null);
  const [selectedCustomerForPayments, setSelectedCustomerForPayments] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: '', notes: '' });
  const [isEditingPayment, setIsEditingPayment] = useState<number | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [isLoadingCustomerTransactions, setIsLoadingCustomerTransactions] = useState(false);
  const [merchantPaymentAmount, setMerchantPaymentAmount] = useState('');
  const [isProcessingMerchantPayment, setIsProcessingMerchantPayment] = useState(false);
  
  // Edit transaction state
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [editingTransactionAmount, setEditingTransactionAmount] = useState('');
  const [isEditingTransaction, setIsEditingTransaction] = useState(false);
  const [isDeletingTransactionId, setIsDeletingTransactionId] = useState<number | null>(null);

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
      console.log('ًں“¥ MerchantDashboard - Fetching data for store:', user.store_id, 'Type:', user?.store_type, 'â‌— Type check:', user?.store_type === 'topup' ? 'TOPUP' : 'REGULAR');
      
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
        fetch(`/api/auctions/active?includeSold=true`).then(r => r.json()).catch(() => [])
      ]).then(([products, categories, orders, customers, coupons, stats, auctions]) => {
        console.log('âœ… Data fetched:', { products: products?.length, categories: categories?.length });
        console.log('ًں“¦ RAW PRODUCTS FROM API:', {
          count: Array.isArray(products) ? products.length : 'NOT_ARRAY',
          products: Array.isArray(products) ? products.map((p: any) => ({ id: p.id, name: p.name, category_name: p.category_name })) : products
        });
        setProducts(Array.isArray(products) ? products : []);
        
        const validCategories = Array.isArray(categories) ? categories.filter(c => c && c.name) : [];
        console.log('âœ… Valid categories:', validCategories);
        setCategories(validCategories);
        
        setOrders(Array.isArray(orders) ? orders : []);
        setCustomers(Array.isArray(customers) ? customers : []);
        setCoupons(Array.isArray(coupons) ? coupons : []);
        
        setMerchantStats(stats && !stats.error ? stats : {
          totalRevenue: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          fulfillmentStats: { total: 0, pending: 0, completed: 0 },
          topProducts: []
        });
        
        const merchantAuctions = filterAuctionsForStore(Array.isArray(auctions) ? auctions : [], user.store_id);
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
        fetch(`/api/merchant/stats?storeId=${user.store_id}`).then(r => r.json()).catch(() => ({})),
        fetch('/api/auctions/active?includeSold=true').then(r => r.json()).catch(() => [])
      ]).then(([products, orders, stats, auctions]) => {
        console.log('ًں”„ AUTO-REFRESH products from API:', {
          count: Array.isArray(products) ? products.length : 'NOT_ARRAY',
          products: Array.isArray(products) ? products.map((p: any) => ({ id: p.id, name: p.name })) : products
        });
        setProducts(Array.isArray(products) ? products : []);
        setOrders(Array.isArray(orders) ? orders : []);
        setAuctions(filterAuctionsForStore(Array.isArray(auctions) ? auctions : [], user.store_id));
        setMerchantStats(stats && !stats.error ? stats : {
          totalRevenue: 0,
          orderStats: { total: 0, pending: 0, completed: 0 },
          fulfillmentStats: { total: 0, pending: 0, completed: 0 },
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
            console.log('ًں“‹ Loaded merchant settings:', { app_name: data.app_name, logo_url: data.logo_url ? 'âœ“' : 'âœ—', primary_color: data.primary_color });
          }
        })
        .catch((err) => {
          console.error('Failed to load merchant settings:', err);
        });
    }
  }, [section, user]);

  const handleSaveMerchantSettings = async () => {
    if (!user?.store_id) {
      alert("ط®ط·ط£: ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط±");
      return;
    }
    
    // Validate that at least app_name is not empty
    if (!merchantConfig.app_name || merchantConfig.app_name.trim() === '') {
      alert("â‌Œ ط®ط·ط£: ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±");
      return;
    }
    
    try {
      console.log("ًں“¤ Saving MERCHANT settings:", {
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
      
      console.log("ًں“¬ POST /api/settings response status:", res.status);
      
      const data = await res.json();
      console.log("ًں“¬ POST /api/settings full response:", JSON.stringify(data, null, 2));
      console.log("ًں“¬ Response success field type:", typeof data.success, "value:", data.success);
      console.log("ًں“¬ data.success === true:", data.success === true);
      console.log("ًں“¬ Boolean check - !!data.success:", !!data.success);
      
      if (!res.ok) {
        let errorMsg = data.error || data.message || "ظپط´ظ„ ط§ظ„ط­ظپط¸";
        console.error('â‌Œ HTTP Error:', res.status, errorMsg);
        alert("â‌Œ ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ: " + errorMsg);
        return;
      }
      
      // Explicitly check if success is true (strict equality)
      if (data.success === true) {
        // Success case
        console.log('âœ… Merchant settings saved successfully, navigating...');
        
        // Update ONLY local merchant config state
        setMerchantConfig(prev => ({
          ...prev,
          app_name: merchantConfig.app_name.trim(),
          logo_url: merchantConfig.logo_url,
          primary_color: merchantConfig.primary_color
        }));
        
        alert('âœ… طھظ… ط­ظپط¸ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­');
        
        // Refresh page to ensure all data is updated
        setTimeout(() => window.location.reload(), 500);
        return; // Ensure no code runs after reload
      } else {
        // Failure case even though HTTP 200
        let errorMsg = data.error || data.message || "ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ„ظ… طھظڈط­ظپط¸";
        console.error('â‌Œ Server returned success:', data.success, 'Type:', typeof data.success, 'Full response:', data);
        alert("â‌Œ ط®ط·ط£: " + errorMsg);
      }
    } catch (error) {
      console.error("â‌Œ Network/Parse Error:", error);
      console.error("Full error object:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      
      const errorMessage = error instanceof Error ? error.message : "ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ";
      console.error("Final error message:", errorMessage);
      
      alert("â‌Œ ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ: " + errorMessage);
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

  const fetchSalesReport = async (filters?: { from?: string; to?: string; saleType?: 'all' | 'order' | 'auction' }) => {
    if (!user?.store_id) return;

    const params = new URLSearchParams({ storeId: String(user.store_id) });
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    params.set('saleType', filters?.saleType || salesTypeFilter);

    setIsLoadingSalesData(true);
    setSalesReportError('');

    try {
      const res = await fetch(`/api/merchant/sales-report?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSalesData(data);
      } else {
        setSalesReportError(data.error || 'طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظ‚ط±ظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ');
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      setSalesReportError('طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظ‚ط±ظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ');
    } finally {
      setIsLoadingSalesData(false);
    }
  };

  const handleOpenSalesModal = async () => {
    if (!user?.store_id) return;
    setShowSalesModal(true);
    await fetchSalesReport({ from: salesDateFrom, to: salesDateTo, saleType: salesTypeFilter });
  };

  const handleApplySalesFilters = async () => {
    await fetchSalesReport({ from: salesDateFrom, to: salesDateTo, saleType: salesTypeFilter });
  };

  const handleResetSalesFilters = async () => {
    setSalesDateFrom('');
    setSalesDateTo('');
    setSalesTypeFilter('all');
    await fetchSalesReport({ saleType: 'all' });
  };

  const handleCreateProduct = () => {
    if (!user?.store_id) {
      alert("ط¹ط°ط±ط§ظ‹طŒ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط±!");
      return;
    }
    console.log('ًںژ¯ handleCreateProduct triggered');
    setProductForm({
      name: '',
      description: '',
      price: '',
      retail_price: '',
      wholesale_price: '',
      stock: '',
      image_url: '',
      category_id: categories.length > 0 ? categories[0].id.toString() : '',
      gallery: [],
      topup_codes_text: '',
      auction_date: '',
      auction_start_time: '',
      auction_end_time: '',
      auction_price: '',
      is_auction: false
    });
    setIsEditingProduct(null);
    console.log('ًںژ¯ About to setShowProductModal(true)');
    setShowProductModal(true);
    console.log('ًںژ¯ setShowProductModal called');
  };

  const handleEditProduct = async (p: any) => {
    try {
      const isTopupStore = user?.store_type === 'topup';
      
      // Parse gallery
      let parsedGallery: string[] = [];
      if (p.gallery) {
        if (Array.isArray(p.gallery)) {
          parsedGallery = p.gallery;
        } else if (typeof p.gallery === 'string') {
          try {
            parsedGallery = JSON.parse(p.gallery);
            if (!Array.isArray(parsedGallery)) parsedGallery = [];
          } catch (e) {
            parsedGallery = [];
          }
        }
      }
      
      // Initialize base form data
      let formData = {
        name: p.name,
        description: p.description || '',
        price: isTopupStore ? '' : (p.price?.toString() || ''),
        retail_price: isTopupStore ? (p.retail_price?.toString() || '') : '',
        wholesale_price: isTopupStore ? (p.wholesale_price?.toString() || '') : '',
        stock: (p.stock || 0).toString(),
        image_url: p.image_url || '',
        category_id: p.category_id?.toString() || (categories.length > 0 ? categories[0].id.toString() : ''),
        gallery: parsedGallery,
        topup_codes_text: '',
        auction_date: '',
        auction_start_time: '',
        auction_end_time: '',
        auction_price: '',
        is_auction: false
      };
      
      console.log('âœ… Base form data initialized');
      
      // Check if product is auction
      const isAuction = p.is_auction === true || p.is_auction === 'true' || p.is_auction === 1;
      console.log('ًں”چ Product is_auction raw:', p.is_auction, '| Determined as:', isAuction);
      
      formData.is_auction = isAuction;
      
      // If auction product, read auction data directly from product columns (NEW: No API call needed!)
      if (isAuction && p.id) {
        // âœ… SIMPLE: Data now comes as strings from API (converted by TO_CHAR in SQL)
        let parsedDate = String(p.auction_date || '').trim();
        let parsedStartTime = String(p.auction_start_time || '').trim();
        let parsedEndTime = String(p.auction_end_time || '').trim();
        let parsedPrice = String(p.auction_price || '').trim();
        
        console.log('âœ¨ Auction data from API (already formatted as strings):');
        console.log('   - auction_date:', parsedDate, '(type:', typeof parsedDate + ')');
        console.log('   - auction_start_time:', parsedStartTime);
        console.log('   - auction_end_time:', parsedEndTime);
        console.log('   - auction_price:', parsedPrice);
        
        // Update formData
        formData.auction_date = parsedDate;
        formData.auction_start_time = parsedStartTime;
        formData.auction_end_time = parsedEndTime;
        formData.auction_price = parsedPrice;
        
        console.log('ًں”چ FORM DATA AFTER LOAD:');
        console.log('   auction_date:', formData.auction_date);
        console.log('   auction_start_time:', formData.auction_start_time);
        console.log('   auction_end_time:', formData.auction_end_time);
        console.log('   auction_price:', formData.auction_price);
      } else {
        console.log('â„¹ï¸ڈ Not an auction product');
      }
      
      console.log('ًں”¹ FINAL formData:', formData);
      
      // Set all state at once
      setProductForm(formData);
      setTopupCodesFile(null);
      setTopupCodesMessage(null);
      setIsEditingProduct(p.id);
      setShowProductModal(true);
      
      console.log('âœ…âœ…âœ… Modal opened with data!');
      
    } catch (err: any) {
      console.error('ًں’¥ ERROR:', err.message, err);
      alert('â‌Œ ط®ط·ط£: ' + (err?.message || 'ظپط´ظ„ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظ†طھط¬'));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬طں")) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setIsEditingProduct(null);
  };

  const normalizeAuctionDate = (value: string) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month}-${day}`;
    }
    return trimmed;
  };

  const saveProduct = async () => {
    console.log('ًںڑ€ SAVE PRODUCT CLICKED');
    console.log('productForm:', JSON.stringify(productForm, null, 2));
    const isTopupStore = user?.store_type === 'topup';
    
    // Check if it's auction
    console.log('âœ… is_auction:', productForm.is_auction);
    console.log('âœ… auction_date:', productForm.auction_date);
    console.log('âœ… auction_start_time:', productForm.auction_start_time);
    console.log('âœ… auction_end_time:', productForm.auction_end_time);
    console.log('âœ… auction_price:', productForm.auction_price);
    
    console.log('ًںڑ€ SAVE PRODUCT - productForm:', {
      name: productForm.name,
      is_auction: productForm.is_auction,
      auction_date: productForm.auction_date,
      auction_price: productForm.auction_price,
      auction_start_time: productForm.auction_start_time,
      auction_end_time: productForm.auction_end_time,
      isTopupStore: user?.store_type === 'topup'
    });
    
    // Validate required fields
    if (!productForm.name?.trim()) {
      alert("â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬");
      return;
    }

    if (!productForm.price) {
      alert("â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط³ط¹ط± ط§ظ„ظ…ظ†طھط¬");
      return;
    }

    if (!productForm.stock) {
      alert("â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھط§ط­ط©");
      return;
    }
    
    if (!productForm.image_url && !isEditingProduct) {
      alert("â‌Œ ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± طµظˆط±ط© ظ„ظ„ظ…ظ†طھط¬");
      return;
    }

    // âœ… Initialize body and URL
    const body: any = {
      store_id: user.store_id,
      category_id: productForm.category_id ? parseInt(productForm.category_id) : null
    };
    
    const url = isEditingProduct ? `/api/products/${isEditingProduct}` : '/api/products';
    const method = isEditingProduct ? 'PUT' : 'POST';

    if (isTopupStore) {
      // For topup store: send company_id, amount, and prices
      if (!productForm.company_id) {
        alert('â‌Œ ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ط§ظ„ط´ط±ظƒط©');
        return;
      }
      if (!productForm.amount) {
        alert('â‌Œ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ظ…ط¨ظ„ط؛');
        return;
      }
      
      body.company_id = parseInt(productForm.company_id);
      body.amount = parseInt(productForm.amount);
      body.price = Math.floor(parseFloat(productForm.price) || 0);
      body.bulk_price = Math.floor(parseFloat(productForm.wholesale_price) || 0);
      body.quantity_type = productForm.quantity_type || 'riyal';
    } else {
      const auctionDateInput = document.querySelector('input[name="auction_date"]') as HTMLInputElement | null;
      const auctionStartInput = document.querySelector('input[name="auction_start_time"]') as HTMLInputElement | null;
      const auctionEndInput = document.querySelector('input[name="auction_end_time"]') as HTMLInputElement | null;
      const auctionPriceInput = document.querySelector('input[name="auction_price"]') as HTMLInputElement | null;

      const auctionDateValue = normalizeAuctionDate(auctionDateInput?.value || productForm.auction_date || '');
      const auctionStartValue = String(auctionStartInput?.value || productForm.auction_start_time || '').trim();
      const auctionEndValue = String(auctionEndInput?.value || productForm.auction_end_time || '').trim();
      const auctionPriceValue = String(auctionPriceInput?.value || productForm.auction_price || '').trim();

      // For regular store: use regular price
      body.stock = parseInt(productForm.stock);
      body.name = productForm.name;
      body.description = productForm.description;
      body.price = Math.floor(parseFloat(productForm.price) || 0);
      body.image_url = productForm.image_url;
      body.gallery = productForm.gallery;
      
      // âœ… ALWAYS include is_auction flag and auction data (even if false)
      body.is_auction = productForm.is_auction === true;
      body.auction_date = auctionDateValue;
      body.auction_start_time = auctionStartValue;
      body.auction_end_time = auctionEndValue;
      body.auction_price = auctionPriceValue;
      
      // Add auction flag and data if applicable
      if (productForm.is_auction === true) {
        // âœ… CRITICAL VALIDATION: Ensure all auction fields are provided
        // Check without trim() because date/time inputs return clean values
        if (!auctionDateValue || !auctionStartValue || !auctionEndValue || !auctionPriceValue) {
          const missingFields = [];
          if (!auctionDateValue) missingFields.push('ط§ظ„طھط§ط±ظٹط®');
          if (!auctionStartValue) missingFields.push('ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©');
          if (!auctionEndValue) missingFields.push('ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©');
          if (!auctionPriceValue) missingFields.push('ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ');
          
          console.warn('â‌Œ VALIDATION FAILED - Missing fields:', missingFields);
          alert(`â‌Œ ظٹط±ط¬ظ‰ ظ…ظ„ط، ط¬ظ…ظٹط¹ ط­ظ‚ظˆظ„ ط§ظ„ظ…ط²ط§ط¯:\n${missingFields.join('\n')}`);
          return;
        }
        
        console.log('âœ… AUCTION FIELDS VALIDATED AND WILL BE SENT:');
        console.log('   is_auction:', body.is_auction);
        console.log('   auction_date:', body.auction_date);
        console.log('   auction_start_time:', body.auction_start_time);
        console.log('   auction_end_time:', body.auction_end_time);
        console.log('   auction_price:', body.auction_price);
      }
    }
    
    console.log('ًں“‌ FULL BODY BEING SENT:', { 
      store_id: body.store_id,
      name: body.name,
      price: body.price,
      stock: body.stock,
      is_auction: body.is_auction,
      auction_date: body.auction_date,
      auction_price: body.auction_price,
      auction_start_time: body.auction_start_time,
      auction_end_time: body.auction_end_time,
      image_url: body.image_url?.substring(0, 100),
      is_base64: !!body.image_url?.startsWith('data:'),
      body_keys: Object.keys(body)
    });
    
    console.log('ًں“¤ SENDING FETCH REQUEST TO:', url);
    console.log('ًں“¤ METHOD:', method);
    console.log('ًں“¤ FULL BODY JSON:', JSON.stringify(body, null, 2));
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      // Log response status
      console.log(`ًں“، API Response Status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const responseData = await res.json();
        const savedProduct = responseData?.product || responseData;
        const savedProductId = savedProduct?.id;
        console.log('âœ… PRODUCT SAVED:', { id: savedProductId, name: savedProduct?.name || productForm.name });
        
        // âœ… Reload products from API to ensure data is synced
        try {
          const productsRes = await fetch(`/api/products?storeId=${user.store_id}`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(Array.isArray(productsData) ? productsData : []);
            console.log('âœ… Products reloaded from API after save');
          }
        } catch (e) {
          console.error('âڑ ï¸ڈ Error reloading products:', e);
        }
        
        // Save topup codes if provided (only for topup stores)
        if (isTopupStore && (productForm.topup_codes_text.trim() || topupCodesFile) && savedProductId) {
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
                product_id: savedProductId,
                codes: codes
              })
            });
            
            if (codesRes.ok) {
              setTopupCodesMessage({ type: 'success', text: `âœ… طھظ… ط­ظپط¸ ${codes.length} ظƒظˆط¯ ط¨ظ†ط¬ط§ط­` });
              console.log(`âœ… طھظ… ط­ظپط¸ ${codes.length} ط£ظƒظˆط§ط¯ ط¨ظ†ط¬ط§ط­`);
              // Clear notification after 3 seconds
              setTimeout(() => setTopupCodesMessage(null), 3000);
            } else {
              setTopupCodesMessage({ type: 'error', text: 'ظپط´ظ„ ط­ظپط¸ ط§ظ„ط£ظƒظˆط§ط¯' });
              setTimeout(() => setTopupCodesMessage(null), 3000);
            }
          }
        }
        
        // ًں”´ DEBUG: Log conditions BEFORE auction check
        const debugCondition = {
          isTopupStore,
          productFormIsAuction: productForm.is_auction,
          savedProductId,
          notTopupStore: !isTopupStore,
          hasAuction: productForm.is_auction,
          hasSavedProductId: !!savedProductId,
          finalCondition: !isTopupStore && productForm.is_auction && savedProductId
        };
        console.log('ًں”´ SAVE CONDITIONS:', debugCondition);
        console.log('ًں”´ AFTER PRODUCT SAVED - AUCTION DATA:', {
          is_auction: productForm.is_auction,
          auction_was_created_at_backend: true,
          product_saved: productForm.name
        });
        
        // âœ… Reload auctions after product save (product creation already handled auction creation)
        if (productForm.is_auction) {
          try {
            const merchantAuctions = await fetchMerchantAuctions(user?.store_id);
            console.log('âœ… Auctions reloaded:', merchantAuctions.length);
          } catch (e) {
            console.error('âڑ ï¸ڈ Error reloading auctions:', e);
          }
        } else {
          try {
            await fetchMerchantAuctions(user?.store_id);
          } catch (e) {
            console.error('âڑ ï¸ڈ Error syncing auctions after save:', e);
          }
        }
        
        setIsEditingProduct(null);
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
          auction_start_time: '',
          auction_end_time: '',
          auction_price: '',
          is_auction: false
        });
        
        // Reload products
        const updated = await fetch(`/api/products?storeId=${user.store_id}`).then(r => r.json());
        setProducts(Array.isArray(updated) ? updated : []);
        
        // âœ¨ Trigger refresh for CustomerStorefront to see new products
        const { triggerProductsRefresh } = useRefreshStore.getState();
        triggerProductsRefresh();
        console.log('âœ… Products refresh triggered for CustomerStorefront');
        
        // Show success message
        alert(isEditingProduct ? 'âœ… طھظ… ط§ظ„طھط¹ط¯ظٹظ„ ط¨ظ†ط¬ط§ط­' : 'âœ… طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ط¨ظ†ط¬ط§ط­');
      } else {
        console.error('â‌Œ SAVE FAILED - Response status:', res.status);
        const errText = await res.text();
        let errMsg = "ظپط´ظ„ ط§ظ„ط­ظپط¸";
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.error || errMsg;
        } catch (e) {
          errMsg = errText || errMsg;
        }
        console.error('â‌Œ Error details:', errMsg);
        alert("â‌Œ ط®ط·ط£ ظ…ظ† ط§ظ„ط³ظٹط±ظپط±: " + errMsg);
      }
    } catch (err) {
      console.error('â‌Œ EXCEPTION CAUGHT:', err);
      alert("â‌Œ ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±. طھط£ظƒط¯ ط£ظ† ط­ط¬ظ… ط§ظ„طµظˆط±ط© ظ„ظٹط³ ظƒط¨ظٹط±ط§ظ‹ ط¬ط¯ط§ظ‹.");
    }
  };

  const handleAddCategory = () => {
    if (!user?.store_id) {
      alert("ط¹ط°ط±ط§ظ‹طŒ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط± ط§ظ„ط®ط§طµ ط¨ظƒ.");
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
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯طں ط³ظٹطھظ… ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ‚ط³ظ….")) return;
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
        let errMsg = "ظپط´ظ„ ط§ظ„ط­ظپط¸";
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.error || errMsg;
        } catch (e) {
          errMsg = errText || errMsg;
        }
        alert("ط®ط·ط£ ظ…ظ† ط§ظ„ط³ظٹط±ظپط±: " + errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±. طھط£ظƒط¯ ظ…ظ† ط«ط¨ط§طھ ط§ظ„ط§طھطµط§ظ„ ظˆط­ط¬ظ… ط§ظ„ظ…ظ„ظپ.");
    }
  };

  // Fetch customers from new API
  useEffect(() => {
    if (user?.store_id && section === 'customers') {
      console.log("ًں”„ Fetching customers for store:", user.store_id);
      fetch(`/api/merchant/customers?storeId=${user.store_id}`)
        .then(res => res.json())
        .then(data => {
          console.log("âœ… Customers loaded:", data);
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
      alert("ط®ط·ط£: ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط±");
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert("âڑ ï¸ڈ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ");
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: user.store_id,
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim(),
          password: customerForm.password || customerForm.phone,
          starting_balance: parseFloat(customerForm.starting_balance) || 0,
          credit_limit: parseFloat(customerForm.credit_limit) || 0,
          customer_type: customerForm.customer_type || 'cash',
          notes: customerForm.notes || ''
        })
      });

      if (res.ok) {
        alert("âœ… طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ…ظٹظ„ ط¨ظ†ط¬ط§ط­");
        setShowCustomerModal(false);
        setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
        
        // Refresh customers list
        const updated = await fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json());
        setCustomers(Array.isArray(updated) ? updated : []);
      } else {
        const error = await res.json();
        alert("â‌Œ ط®ط·ط£: " + (error.error || "ظپط´ظ„ ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ…ظٹظ„"));
      }
    } catch (err) {
      console.error(err);
      alert("ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±");
    }
  };

  // Handle Edit Customer
  const handleEditCustomer = async () => {
    if (!user?.store_id || !isEditingCustomer) {
      alert("ط®ط·ط£: ظ…ط¹ظ„ظˆظ…ط§طھ ظ†ط§ظ‚طµط©");
      return;
    }

    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert("âڑ ï¸ڈ ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ");
      return;
    }

    try {
      const res = await fetch(`/api/customers/${isEditingCustomer}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerForm.name.trim(),
          phone: customerForm.phone.trim(),
          password: customerForm.password,
          starting_balance: parseFloat(customerForm.starting_balance) || 0,
          credit_limit: parseFloat(customerForm.credit_limit) || 0,
          customer_type: customerForm.customer_type || 'cash',
          notes: customerForm.notes || ''
        })
      });

      if (res.ok) {
        alert("âœ… طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ط¨ظ†ط¬ط§ط­");
        setShowCustomerModal(false);
        setIsEditingCustomer(null);
        setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
        
        // Refresh customers list
        const updated = await fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json());
        setCustomers(Array.isArray(updated) ? updated : []);
      } else {
        const error = await res.json();
        alert("â‌Œ ط®ط·ط£: " + (error.error || "ظپط´ظ„ ط§ظ„طھط­ط¯ظٹط«"));
      }
    } catch (err) {
      console.error(err);
      alert("ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±");
    }
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async (customerId: number) => {
    if (user?.store_type !== 'topup') {
      alert("ظ‡ط°ظ‡ ط§ظ„ط´ط§ط´ط© طھط¹ط±ط¶ ط¨ظٹط§ظ†ط§طھ ظ…ط´طھظ‚ط© ظ…ظ† ط§ظ„ط·ظ„ط¨ط§طھطŒ ظ„ط°ظ„ظƒ ظ„ط§ ظٹطھظˆظپط± ط­ط°ظپ ط¹ظ…ظٹظ„ ظ…ظ†ظ‡ط§.");
      return;
    }

    if (!confirm("âڑ ï¸ڈ ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„طں")) return;

    try {
      console.log(`ًں—‘ï¸ڈ Attempting to delete customer: ${customerId}`);
      
      // For topup stores, use the dedicated endpoint
      const endpoint = user?.store_type === 'topup'
        ? `/api/topup/customers/${customerId}`
        : `/api/customers/${customerId}`;

      const res = await fetch(endpoint, { method: 'DELETE' });

      if (res.ok) {
        alert('âœ… طھظ… ط­ط°ظپ ط§ظ„ط¹ظ…ظٹظ„ ط¨ظ†ط¬ط§ط­');
        const updated = await fetch(`/api/merchant/customers?storeId=${user.store_id}`).then(r => r.json());
        setCustomers(Array.isArray(updated) ? updated : []);
      } else {
        const error = await res.json();
        alert('â‌Œ ط®ط·ط£: ' + (error.error || 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط¹ظ…ظٹظ„'));
      }
    } catch (err) {
      console.error(err);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط³ظٹط±ظپط±');
    }
  };

  const renderProductModal = () => {
    if (!showProductModal) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-lg shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingProduct ? 'طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ†طھط¬' : 'ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>{isTopupStore ? 'ظ…ظ†طھط¬ ط´ط­ظ†' : 'ظ…ظ†طھط¬ ط¹ط§ط¯ظٹ'}</p>
            </div>
            <button onClick={closeProductModal} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Name & Category in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ط³ظ… ط§ظ„ظ…ظ†طھط¬ *</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => updateProductForm({ name: e.target.value })}
                  placeholder="ظ…ط«ط§ظ„: ط´ط­ظ† ظ…ظˆط¨ط§ظٹظ„"
                  className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ظ‚ط³ظ… *</label>
                <select 
                  value={productForm.category_id}
                  onChange={(e) => updateProductForm({ category_id: e.target.value })}
                  className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ظˆطµظپ ط§ظ„ظ…ظ†طھط¬</label>
              <textarea
                value={productForm.description || ''}
                onChange={(e) => updateProductForm({ description: e.target.value })}
                placeholder="ط£ط¶ظپ ظˆطµظپط§ظ‹ ظ…ط®طھطµط±ط§ظ‹ ظ„ظ„ظ…ظ†طھط¬ ظٹط¸ظ‡ط± ظ„ظ„ط²ط¨ط§ط¦ظ†"
                rows={3}
                className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none resize-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
              />
            </div>

            {/* Stock & Price in one row */}
            {isTopupStore ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھط§ط­ط© *</label>
                  <input 
                    type="number" 
                    value={productForm.stock}
                    onChange={(e) => updateProductForm({ stock: e.target.value })}
                    placeholder="0"
                    min="0"
                    className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط³ط¹ط± ط§ظ„ط¨ظٹط¹ *</label>
                  <input 
                    type="number" 
                    value={productForm.retail_price}
                    onChange={(e) => updateProductForm({ retail_price: e.target.value })}
                    placeholder="0"
                    min="0"
                    className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھط§ط­ط© *</label>
                  <input 
                    type="number" 
                    value={productForm.stock}
                    onChange={(e) => updateProductForm({ stock: e.target.value })}
                    placeholder="0"
                    min="0"
                    className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط³ط¹ط± *</label>
                  <input 
                    type="number" 
                    value={productForm.price}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      if (productForm.is_auction) {
                        syncAuctionPriceFields(nextValue);
                        return;
                      }

                      updateProductForm({ price: nextValue });
                    }}
                    readOnly={productForm.is_auction}
                    placeholder="0"
                    min="0"
                    className={cn("w-full px-4 py-3 border rounded-xl transition-all font-normal outline-none", productForm.is_auction ? (isDarkMode ? "bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed" : "bg-gray-100 border-black/5 text-gray-500 cursor-not-allowed") : (isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" : "bg-gray-50 border-black/5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"))}
                  />
                  {productForm.is_auction && (
                    <p className={cn("text-xs mt-2", isDarkMode ? "text-amber-300" : "text-amber-700")}>
                      ظٹطھظ… ط§ظ„طھط­ظƒظ… ط¨ظ‡ط°ط§ ط§ظ„ط­ظ‚ظ„ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ…ظ† ط®ظ„ط§ظ„ "ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ" ظ„ظ„ظ…ط²ط§ط¯.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Additional prices for topup */}
            {isTopupStore && (
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط© (ط§ط®طھظٹط§ط±ظٹ)</label>
                <input 
                  type="number" 
                  value={productForm.wholesale_price}
                  onChange={(e) => updateProductForm({ wholesale_price: e.target.value })}
                  placeholder="0"
                  min="0"
                  className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                />
              </div>
            )}

            {/* Image Upload - for regular stores only */}
            {!isTopupStore && (
              <div className="space-y-4">
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`طµظˆط± ط§ظ„ظ…ظ†طھط¬ (ظٹظ…ظƒظ† ط§ط®طھظٹط§ط± ط¹ط¯ط© طµظˆط±)`}</label>
                <div className="flex flex-col gap-4">
                  {/* Main Image Upload */}
                  <div>
                    <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„طµظˆط±ط© ط§ظ„ط±ط¦ظٹط³ظٹط©:</p>
                    <label className="cursor-pointer group relative">
                      <div className={cn("w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden", isDarkMode ? "border-gray-600 bg-gray-700 group-hover:bg-gray-600 group-hover:border-gray-500" : "border-indigo-100 bg-gray-50 group-hover:bg-indigo-50/50 group-hover:border-indigo-300")}>
                        {productForm.image_url ? (
                          <div className="relative w-full h-full">
                            <img src={getSafeImageUrl(productForm.image_url)} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload size={24} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Plus size={24} className="text-indigo-500 mb-1" />
                            <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ط®طھط± ط§ظ„طµظˆط±ط© ط§ظ„ط±ط¦ظٹط³ظٹط©</p>
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
                            reader.onloadend = () => updateProductForm({ image_url: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input 
                      type="text" 
                      value={productForm.image_url.startsWith('data:') ? '' : productForm.image_url}
                      onChange={(e) => updateProductForm({ image_url: e.target.value })}
                      placeholder="ط£ظˆ ط¶ط¹ ط±ط§ط¨ط·ط§ظ‹ ظ…ط¨ط§ط´ط±ط§ظ‹..."
                      className={cn("w-full px-5 py-3 border rounded-xl font-normal outline-none text-xs mt-2", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                    />
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>طµظˆط± ط¥ط¶ط§ظپظٹط©:</p>
                      <span className={cn("text-[10px] font-normal px-2 py-1 rounded", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>{(productForm.gallery || []).length} طµظˆط±</span>
                    </div>
                    <label className="cursor-pointer group relative">
                      <div className={cn("w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all", isDarkMode ? "border-gray-600 bg-gray-700 group-hover:bg-gray-600 group-hover:border-gray-500" : "border-blue-100 bg-blue-50/30 group-hover:bg-blue-50 group-hover:border-blue-300")}>
                        <Plus size={24} className={isDarkMode ? "text-gray-400 mb-1" : "text-blue-400 mb-1"} />
                        <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-blue-600")}>ط£ط¶ظپ طµظˆط± ط¥ط¶ط§ظپظٹط© (ط§ط®طھظٹط§ط±ظٹ)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const gallery = [...(productForm.gallery || [])];
                          for (const file of files) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              gallery.push(reader.result as string);
                              setProductForm(prev => ({...prev, gallery: [...gallery]}));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Gallery Preview */}
                  {(productForm.gallery || []).length > 0 && (
                    <div className="space-y-2">
                      <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>ظ…ط¹ط§ظٹظ†ط© ط§ظ„طµظˆط± ط§ظ„ط¥ط¶ط§ظپظٹط©:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(productForm.gallery || []).map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} className="w-full h-24 object-cover rounded-lg" alt={`gallery-${idx}`} />
                            <button
                              type="button"
                              onClick={() => {
                                const newGallery = productForm.gallery.filter((_, i) => i !== idx);
                                setProductForm(prev => ({...prev, gallery: newGallery}));
                              }}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auction for Regular Stores */}
            {!isTopupStore && (
              <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <label className={cn("flex items-center gap-2 cursor-pointer text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  <input 
                    type="checkbox" 
                    checked={productForm.is_auction || false}
                    onChange={(e) => {
                      const isAuction = e.target.checked;

                      if (isAuction) {
                        const syncedPrice = String(productForm.price || productForm.auction_price || '').trim();
                        updateProductForm({
                          is_auction: true,
                          price: syncedPrice,
                          auction_price: syncedPrice
                        });
                        return;
                      }

                      updateProductForm({ is_auction: false });
                    }}
                    className="w-4 h-4"
                  />
                  ظ‡ط°ط§ ظ…ظ†طھط¬ ظ…ط²ط§ط¯
                </label>
                {productForm.is_auction && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“… طھط§ط±ظٹط® ط§ظ„ظ…ط²ط§ط¯</label>
                        <input 
                          type="date" 
                          name="auction_date"
                          value={productForm.auction_date || ''}
                          onChange={(e) => {
                            console.log('ًں“… Date changed to:', e.target.value);
                            updateProductForm({ auction_date: e.target.value });
                          }}
                          onFocus={() => {
                            console.log('ًں“… DATE FIELD FOCUSED - Current value:', productForm.auction_date, 'Type:', typeof productForm.auction_date);
                          }}
                          placeholder="yyyy-mm-dd"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_date && <p className="text-xs text-blue-500 mt-1">âœ“ ظ…ط­ظپظˆط¸: {productForm.auction_date}</p>}
                      </div>
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں’° ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ</label>
                        <input 
                          type="number" 
                          name="auction_price"
                          value={productForm.auction_price || ''}
                          onChange={(e) => {
                            console.log('ًں’° Price changed to:', e.target.value);
                            syncAuctionPriceFields(e.target.value);
                          }}
                          placeholder="ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ"
                          min="0"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_price && <p className="text-xs text-blue-500 mt-1">âœ“ {productForm.auction_price}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>âڈ±ï¸ڈ ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©</label>
                        <input 
                          type="time" 
                          name="auction_start_time"
                          value={productForm.auction_start_time || ''}
                          onChange={(e) => {
                            console.log('âڈ±ï¸ڈ Start time changed to:', e.target.value);
                            updateProductForm({ auction_start_time: e.target.value });
                          }}
                          placeholder="09:00"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_start_time && <p className="text-xs text-blue-500 mt-1">âœ“ {productForm.auction_start_time}</p>}
                      </div>
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>âڈ²ï¸ڈ ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©</label>
                        <input 
                          type="time" 
                          name="auction_end_time"
                          value={productForm.auction_end_time || ''}
                          onChange={(e) => {
                            console.log('âڈ²ï¸ڈ End time changed to:', e.target.value);
                            updateProductForm({ auction_end_time: e.target.value });
                          }}
                          placeholder="18:00"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_end_time && <p className="text-xs text-blue-500 mt-1">âœ“ {productForm.auction_end_time}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={cn("p-8 border-t flex gap-4", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={saveProduct}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg font-normal transition-all hover:scale-[1.02] active:scale-95 font-sans"
            >
              {isEditingProduct ? 'طھط­ط¯ظٹط«' : 'ط¥ط¶ط§ظپط©'} ط§ظ„ظ…ظ†طھط¬
            </Button>
            <Button 
              onClick={closeProductModal}
              className={cn("px-8 border-2 font-normal rounded-2xl transition-all font-sans", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 hover:bg-gray-500" : "bg-white border-black/5 text-gray-600 hover:bg-gray-100/50")}
            >
              ط¥ظ„ط؛ط§ط،
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
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingCategory ? 'طھط¹ط¯ظٹظ„ ط§ظ„ظ‚ط³ظ…' : 'ط¥ط¶ط§ظپط© ظ‚ط³ظ… ط¬ط¯ظٹط¯'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ظ„ط£ظ‚ط³ط§ظ… طھط³ط§ط¹ط¯ ظپظٹ طھظ†ط¸ظٹظ… ظ…طھط¬ط±ظƒ ظ„ظ„ط¹ظ…ظ„ط§ط،</p>
            </div>
            <button onClick={() => setShowCategoryModal(false)} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`ط§ط³ظ… ط§ظ„ظ‚ط³ظ…`}</label>
              <input 
                type="text" 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="ظ…ط«ط§ظ„: ظ…ظ„ط§ط¨ط³ طµظٹظپظٹط©طŒ ط¥ظ„ظƒطھط±ظˆظ†ظٹط§طھ"
                className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-700")}
              />
            </div>
            <div className="space-y-4">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`طµظˆط±ط© ط§ظ„ظ‚ط³ظ… (ط§ط®طھظٹط§ط±ظٹ)`}</label>
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
                        <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ط®طھط± طµظˆط±ط© ظ„ظ„ظ‚ط³ظ…</p>
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
                  placeholder="ط£ظˆ ط¶ط¹ ط±ط§ط¨ط·ط§ظ‹ ظ…ط¨ط§ط´ط±ط§ظ‹..."
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
              {isEditingCategory ? 'طھط¹ط¯ظٹظ„' : 'ط¥ط¶ط§ظپط© ط§ظ„ظ‚ط³ظ…'}
            </Button>
            <Button 
              onClick={() => setShowCategoryModal(false)}
              className={cn("px-8 border-2 font-normal rounded-2xl transition-all font-sans", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 hover:bg-gray-500" : "bg-white border-black/5 text-gray-600 hover:bg-gray-100/50")}
            >
              ط¥ظ„ط؛ط§ط،
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderCustomers = () => {
    console.log('ًںڈھ renderCustomers() called', {
      selectedCustomerForPayments: selectedCustomerForPayments?.name || null,
      selectedCustomerStatement: selectedCustomerStatement?.name || null,
      customersCount: customers.length
    });
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
            <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ…ظ„ط§ط،</h2>
            <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>
              {isTopupStore ? 'ط¹ظ…ظ„ط§ط، ظ…ط¯ط®ظ„ط© ظٹط¯ظˆظٹط§' : 'ظ…ظ† ط§ظ„ط·ظ„ط¨ط§طھ (طھظ„ظ‚ط§ط¦ظٹ)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("px-4 py-1.5 rounded-full text-xs font-normal", isDarkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
            {customers.length} ط¹ظ…ظٹظ„
          </div>
          {isTopupStore && (
            <Button 
              onClick={() => {
                setIsEditingCustomer(null);
                setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
                setShowCustomerModal(true);
              }}
              className={cn("px-4 py-2 rounded-xl text-sm font-normal transition-all shadow-sm", isDarkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-green-600 hover:bg-green-700 text-white")}
            >
              â‍• ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯
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
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ط§ط³ظ…</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ظ‡ط§طھظپ</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط©</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†ظٹ</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
                </>
              ) : (
                <>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط§ظ„ط¹ظ†ظˆط§ظ†</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط¥ط¬ظ…ط§ظ„ظٹ ظ…ط¨ظ„ط؛ ط§ظ„ط·ظ„ط¨ط§طھ</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={cn(isDarkMode ? "divide-gray-800" : "divide-gray-50")}> 
            {customers.length === 0 ? (
              <tr>
                <td colSpan={isTopupStore ? 6 : 4} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-sm font-normal">{isTopupStore ? 'ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظ„ط§ط، ط¨ط¹ط¯. ط£ط¶ظپ ط¹ظ…ظٹظ„ط§ظ‹ ط¬ط¯ظٹط¯ط§ظ‹' : 'ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط¹ظ…ظ„ط§ط، ظ„ط¹ط±ط¶ظ‡ط§ ط¨ط¹ط¯'}</div>
                </td>
              </tr>
            ) : customers.map((cust) => {
              if (isTopupStore) {
                // Topup Store View
                return (
                  <tr key={cust.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>{cust.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono", isDarkMode ? "text-gray-400" : "text-gray-600")}>{cust.phone}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono", isDarkMode ? "text-gray-300" : "text-gray-700")}>{formatCurrency(cust.starting_balance || 0)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono px-2 py-1 rounded-lg", isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700")}>{formatCurrency(0)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn("px-3 py-1 rounded-lg text-sm font-normal font-mono inline-block", isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700")}>
                        {formatCurrency(cust.current_debt || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            // Ensure customer object has customer_id field
                            const customerWithId = {
                              ...cust,
                              customer_id: cust.customer_id || cust.id
                            };
                            setSelectedCustomerStatement(customerWithId);
                            setShowCustomerStatement(true);
                            // Load transactions when opening statement modal
                            setTimeout(() => handleLoadStatement(customerWithId.customer_id), 100);
                          }}
                          title="ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-green-900/30 text-green-400 hover:bg-green-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white")}
                        >
                          <FileText size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditingCustomer(cust.id);
                            setCustomerForm({
                              name: cust.name,
                              phone: cust.phone,
                              password: cust.password || '',
                              starting_balance: Math.floor(cust.starting_balance || 0).toString(),
                              credit_limit: Math.floor(cust.credit_limit || 0).toString(),
                              notes: cust.notes || '',
                              customer_type: cust.customer_type || 'cash'
                            });
                            setShowCustomerModal(true);
                          }}
                          title="طھط¹ط¯ظٹظ„"
                          className={cn("p-2.5 rounded-lg transition-all shadow-sm hover:scale-110", isDarkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-600 hover:text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white")}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(cust.id)}
                          title="ط­ط°ظپ"
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
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg border", isDarkMode ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-50 text-gray-600 border-gray-100")}>{cust.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-normal px-2 py-1 rounded-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>{cust.address || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono px-3 py-1 rounded-lg", isDarkMode ? "bg-indigo-900/20 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>{cust.total_orders || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("text-sm font-normal font-mono px-3 py-1 rounded-lg", isDarkMode ? "bg-emerald-900/20 text-emerald-300" : "bg-emerald-50 text-emerald-700")}>{formatCurrency(cust.total_spent || 0)}</span>
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



  const renderCoupons = () => {
    return (
    <Card className={cn("rounded-[2rem] overflow-hidden border-none p-0 shadow-sm", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-6 border-b border-gray-100 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-gray-50/50")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Ticket size={20} />
          </div>
          <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>ظ‚ط³ط§ط¦ظ… ط§ظ„ط®طµظ…</h2>
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
          className={cn("bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg py-3 px-6 rounded-2xl text-sm font-normal flex items-center gap-2 transform transition-all hover:scale-105", isMobile && "py-2 px-4 text-xs")}
        >
          <Plus size={isMobile ? 16 : 20} /> {!isMobile && "ط¥ظ†ط´ط§ط، ظ‚ط³ظٹظ…ط© ط¬ط¯ظٹط¯ط©"}
        </Button>
      </div>

      {/* Desktop View - Table */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className={cn(isDarkMode ? "bg-gray-800" : "bg-gray-50/30")}>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط±ظ…ط²</th>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ظ†ظˆط¹ ط§ظ„ط®طµظ…</th>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط®طµظ…</th>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط§ط³طھط®ط¯ط§ظ…</th>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>طھظ†طھظ‡ظٹ ظپظٹ</th>
                <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
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
                       {coupon.discount_type === 'percentage' ? 'ظ†ط³ط¨ط© ظ…ط¦ظˆظٹط© %' : 'ط®طµظ… ط«ط§ط¨طھ'}
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
                    {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('ar-EG') : 'ط¨ط¯ظˆظ† طھط§ط±ظٹط®'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={async () => {
                         if (confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„ظ‚ط³ظٹظ…ط©طں")) {
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
                    <p className="font-normal">ظ„ط§ طھظˆط¬ط¯ ظ‚ط³ط§ط¦ظ… ط®طµظ… ط­ط§ظ„ظٹط§ظ‹</p>
                    <p className="text-xs font-normal mt-1">ط§ط¨ط¯ط£ ط¨ط¥ظ†ط´ط§ط، ط£ظˆظ„ ط±ظ…ط² طھط±ظˆظٹط¬ظٹ ظ„ظ…ط¶ط§ط¹ظپط© ظ…ط¨ظٹط¹ط§طھظƒ!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile View - Cards */}
      {isMobile && (
        <div className="p-4 space-y-3">
          {filteredCoupons.length === 0 ? (
            <div className={cn("p-12 text-center rounded-2xl", isDarkMode ? "bg-gray-700/50" : "bg-gray-50")}>
              <Ticket size={40} className="mx-auto mb-3 opacity-20" />
              <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>ظ„ط§ طھظˆط¬ط¯ ظ‚ط³ط§ط¦ظ…</p>
            </div>
          ) : (
            filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={cn(
                  "p-4 rounded-2xl border",
                  isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-100"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", isDarkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
                      <Gift size={16} />
                    </div>
                    <span className={cn("font-bold text-sm truncate", isDarkMode ? "text-gray-100" : "text-gray-900")}>{coupon.code}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("ط­ط°ظپطں")) {
                        const res = await fetch(`/api/coupons/${coupon.id}`, { method: 'DELETE' });
                        if (res.ok) setCoupons(coupons.filter(c => c.id !== coupon.id));
                      }
                    }}
                    className={cn("p-2 rounded-lg transition-all", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-100")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 text-sm">
                  {/* Discount Type & Value */}
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>ظ†ظˆط¹ ط§ظ„ط®طµظ…</span>
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-normal",
                      coupon.discount_type === 'percentage' ? (isDarkMode ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700") : (isDarkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700")
                    )}>
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value)}
                    </span>
                  </div>

                  {/* Usage Progress */}
                  {coupon.usage_limit && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ط§ط³طھط®ط¯ط§ظ…</span>
                        <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>{coupon.usage_count} / {coupon.usage_limit}</span>
                      </div>
                      <div className={cn("w-full h-1.5 rounded-full overflow-hidden", isDarkMode ? "bg-gray-600" : "bg-gray-200")}>
                        <div
                          className={cn("h-full rounded-full transition-all", isDarkMode ? "bg-indigo-500" : "bg-indigo-600")}
                          style={{ width: `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expiry Date */}
                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>طھظ†طھظ‡ظٹ ظپظٹ</span>
                    <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                      {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('ar-EG') : 'ط¨ط¯ظˆظ† طھط§ط±ظٹط®'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
  };

  const saveCoupon = async () => {
    if (!user?.store_id) return;
    if (!couponForm.code || !couponForm.discount_value) {
      alert("ظٹط±ط¬ظ‰ ظ…ظ„ط، ظƒط§ظپط© ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ط£ط³ط§ط³ظٹط©");
      return;
    }

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: user.store_id,
          code: couponForm.code.toUpperCase(),
          discount_type: couponForm.discount_type,
          discount_value: parseFloat(String(couponForm.discount_value) || '0'),
          min_order_value: parseFloat(couponForm.min_order_value || '0'),
          usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
          expiry_date: couponForm.expiry_date || null
        })
      });

      if (res.ok) {
        const newCoupon = await res.json();
        setCoupons([newCoupon, ...coupons]);
        setShowCouponModal(false);
        setCouponForm({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          min_order_value: '0',
          expiry_date: '',
          usage_limit: ''
        });
        alert("âœ“ طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ‚ط³ظٹظ…ط© ط¨ظ†ط¬ط§ط­!");
      } else {
        const err = await res.json();
        alert(err.error || "ظپط´ظ„ ط¥ظ†ط´ط§ط، ط§ظ„ظ‚ط³ظٹظ…ط©");
      }
    } catch (error: any) {
      alert("ط®ط·ط£: " + error.message);
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
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ظ†ط´ط§ط، ظ‚ط³ظٹظ…ط© ط¬ط¯ظٹط¯ط©</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ظ„ط®طµظˆظ…ط§طھ طھط¬ط°ط¨ ط§ظ„ط¹ظ…ظ„ط§ط، ظˆطھط²ظٹط¯ ظ…ظ† ظ…ط¨ظٹط¹ط§طھظƒ</p>
            </div>
            <button onClick={() => setShowCouponModal(false)} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400 hover:text-gray-300" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`ط±ظ…ط² ط§ظ„ط®طµظ… (Code)`}</label>
              <input 
                type="text" 
                value={couponForm.code}
                onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                placeholder="ظ…ط«ظ„ط§ظ‹: SAVE20, RAMADAN"
                className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal text-lg outline-none uppercase", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`ظ†ظˆط¹ ط§ظ„ط®طµظ…`}</label>
                  <select 
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({...couponForm, discount_type: e.target.value})}
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none appearance-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  >
                    <option value="percentage">ظ†ط³ط¨ط© ظ…ط¦ظˆظٹط© %</option>
                    <option value="fixed">ظ…ط¨ظ„ط؛ ط«ط§ط¨طھ (IQD)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`ظ‚ظٹظ…ط© ط§ظ„ط®طµظ…`}</label>
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
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰ ظ„ظ„ط·ظ„ط¨`}</label>
                  <input 
                    type="number" 
                    value={Math.floor(parseFloat(String(couponForm.min_order_value) || '0'))}
                    onChange={(e) => setCouponForm({...couponForm, min_order_value: e.target.value})}
                    placeholder="0"
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
               </div>
               <div className="space-y-2">
                  <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،`}</label>
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
               <label className="text-sm font-normal text-gray-700 block mr-1">ط­ط¯ ط§ظ„ط§ط³طھط®ط¯ط§ظ… (ط§ط®طھظٹط§ط±ظٹ)</label>
               <input 
                type="number" 
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})}
                placeholder="ظ…ط«ظ„ط§ظ‹: 100 ظ…ط±ط©"
                className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none"
              />
            </div>
          </div>

          <div className={cn("p-8 border-t", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <Button 
              onClick={saveCoupon}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl shadow-xl shadow-indigo-200 text-lg font-normal transition-all hover:scale-[1.02] active:scale-95"
            >
              طھظپط¹ظٹظ„ ط§ظ„ظ‚ط³ظٹظ…ط© ط§ظ„ط¢ظ†
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderProducts = () => {
    console.log('âœ…âœ… renderProducts EXECUTING NOW - Button should be visible on screen!');
    console.log('âœ…âœ… handleCreateProduct function exists?', typeof handleCreateProduct === 'function');
    
    if (!categories) console.warn('WARNING: categories is', categories);
    console.log('ï؟½ًں”µًں”µ renderProducts CALLED!!!');
    console.log('ï؟½ًں“¦ renderProducts called with:', {
      categoriesCount: categories.length,
      categories: categories,
      filteredProductsCount: filteredProducts.length,
      showProductModal: showProductModal
    });
    
    // Group filtered products by category
    console.log('ًں”چ RENDER PRODUCTS DEBUG:', {
      filteredProductsLength: filteredProducts.length,
      filteredProducts: filteredProducts.map(p => ({ id: p.id, name: p.name, category_name: p.category_name, price: p.price }))
    });
    
    const productsByCategory = filteredProducts.reduce((acc, product) => {
      const category = product.category_name || 'ط¨ط¯ظˆظ† ظ‚ط³ظ…';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, typeof filteredProducts>);

    const categoryNames = Object.keys(productsByCategory).sort();
    console.log('ًں“‚ PRODUCTS BY CATEGORY:', {
      categoryCount: categoryNames.length,
      categories: categoryNames.map(cat => ({ name: cat, count: productsByCategory[cat].length }))
    });

    return (
    <Card className={cn("rounded-[2.5rem] border-none shadow-xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-gray-50/50")}>
        <div>
          <h3 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طھط¬ط§طھ</h3>
          <p className={cn("font-medium text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط£ط¶ظپطŒ ط¹ط¯ظ„ ط£ظˆ ط§ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ظ† ظ…طھط¬ط±ظƒ</p>
        </div>
        <button 
          type="button"
          onClick={(e) => {
            console.log('ًںژ¯ BUTTON CLICKED - Event:', e);
            console.log('ًںژ¯ Target:', e.target);
            console.log('ًںژ¯ showProductModal before:', showProductModal);
            setShowProductModal(true);
            console.log('ًںژ¯ showProductModal after setState call');
          }}
          style={{ 
            zIndex: 50, 
            pointerEvents: 'auto !important', 
            cursor: 'pointer',
            background: '#4F46E5',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '18px',
            border: 'none',
            fontSize: '14px',
            fontWeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={20} /> ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯
        </button>
      </div>
      <div className={cn("p-8", isDarkMode ? "bg-gray-800" : "bg-white")}>
        {/* Search Bar */}
        <div className="mb-8 flex gap-3">
          <div className="flex-1 relative">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={18} />
            <input 
              type="text" 
              placeholder="ط§ط¨ط­ط« ط¹ظ† ط§ظ„ظ…ظ†طھط¬ط§طھ..." 
              value={dashboardQuery}
              onChange={(e) => setDashboardQuery(e.target.value)}
              className={cn("w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500/30 placeholder-gray-500" : "bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400")}
            />
          </div>
          {dashboardQuery && (
            <button
              onClick={() => setDashboardQuery('')}
              className={cn("px-4 py-3 rounded-xl transition-colors font-normal flex items-center gap-2", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600")}
            >
              <X size={18} /> ظ…ط³ط­
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className={cn("p-20 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
            <Package size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-normal text-lg">{dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ط­ط§ظ„ظٹط§ظ‹.'}</p>
            {!dashboardQuery && <p className="text-sm">ط§ط¨ط¯ط£ ط¨ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ظƒ ط§ظ„ط£ظˆظ„ ط§ظ„ط¢ظ†!</p>}
          </div>
        ) : (
          <div className="space-y-12">
            {categoryNames.map((category) => (
              <div key={category}>
                {/* Category Name */}
                <div className="mb-6 pb-4 border-b border-black/5">
                  <h4 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>{category}</h4>
                  <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    {productsByCategory[category].length} ظ…ظ†طھط¬
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
                          {/* Show Product Image if available */}
                          {p.image_url ? (
                            <img 
                              src={getSafeImageUrl(p.image_url)} 
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="flex items-center justify-center text-5xl font-bold">
                              ًں’³
                            </div>
                          )}
                          
                          {p.stock <= 2 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-normal px-2 py-0.5 rounded-full shadow-lg">
                              ظ…ظ†ط®ظپط¶
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Edit & Delete Buttons - Overlay */}
                        <div className="absolute top-2 left-2 flex gap-1 z-50 opacity-10 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200">
                          {console.log('ًںں¢ RENDERING EDIT BUTTON for product:', p.id, p.name)}
                          <button 
                            onClick={() => {
                              console.log('ًں”´ EDIT BUTTON CLICKED');
                              handleEditProduct(p);
                            }}
                            className={cn("p-2 rounded-lg shadow-lg transition-all cursor-pointer", isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                            title="طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ†طھط¬"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className={cn("p-2 rounded-lg shadow-lg transition-all cursor-pointer", isDarkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white")}
                            title="ط­ط°ظپ ط§ظ„ظ…ظ†طھط¬"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className={cn("font-normal text-sm line-clamp-1 mb-1", isDarkMode ? "text-gray-100" : "text-gray-900")}>{p.name}</h4>
                            <p className={cn("text-[11px] line-clamp-1 font-medium", isDarkMode ? "text-gray-400" : "text-gray-600")}>{p.description || 'ظ„ط§ ظٹظˆط¬ط¯ ظˆطµظپ'}</p>
                          </div>
                          <div className="space-y-1.5 pt-2 border-t border-black/5">
                            <div className="flex justify-between items-center gap-1">
                              <div className="flex flex-col">
                                <span className={cn("text-[10px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ظ…ط®ط²ظˆظ†</span>
                                <span className={cn("font-normal text-sm", p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-600" : "text-green-600")}>
                                  {p.stock}
                                </span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className={cn("text-[10px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ط³ط¹ط±</span>
                                <span className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>{formatCurrency(p.price)}</span>
                              </div>
                            </div>
                            {/* Show images count for topup products */}
                            {p.images && Array.isArray(p.images) && p.images.filter((img: any) => img && String(img).length > 0).length > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-black/5">
                                <span className={cn("text-sm font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>ًں“·</span>
                                <span className={cn("font-normal text-[11px]", isDarkMode ? "text-blue-300" : "text-blue-700")}>{p.images.filter((img: any) => img && String(img).length > 0).length} طµظˆط±</span>
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
    const isRegularStore = user?.store_type !== 'topup';
    const workflowStats = isRegularStore ? (merchantStats.fulfillmentStats || merchantStats.orderStats) : merchantStats.orderStats;
    return (
      <>
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', value: formatCurrency(merchantStats.totalRevenue), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', clickable: true },
            { label: isRegularStore ? 'ط¨ط§ظ†طھط¸ط§ط± ط§ظ„طھط¬ظ‡ظٹط²' : 'ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظ…ظƒطھظ…ظ„ط©', value: isRegularStore ? workflowStats.pending : merchantStats.orderStats.completed, icon: ShoppingCart, color: isRegularStore ? 'text-amber-600' : 'text-emerald-600', bg: isRegularStore ? 'bg-amber-50' : 'bg-emerald-50', clickable: false },
            { label: 'ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ†ط´ط·ط©', value: products.length, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', clickable: false },
            { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ط§ط،', value: customers.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', clickable: false },
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
                  ط§ط¶ط؛ط· ظ„ظ„ظ…ط²ظٹط¯ <ExternalLink size={12} />
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
                {isRegularStore ? 'ط­ط§ظ„ط© ط§ظ„طھط¬ظ‡ظٹط²' : 'ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ط§طھ'}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal text-amber-600">ط¨ط§ظ†طھط¸ط§ط± ط§ظ„طھط¬ظ‡ظٹط²</span>
                  <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{workflowStats.pending}</span>
                </div>
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                    style={{ width: `${(workflowStats.pending / (workflowStats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal text-emerald-600">ظ…ظƒطھظ…ظ„ط©</span>
                  <span className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{workflowStats.completed}</span>
                </div>
                <div className={cn("w-full h-2 rounded-full overflow-hidden", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(workflowStats.completed / (workflowStats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className={cn("mt-6 pt-6 border-t text-center", isDarkMode ? "border-gray-600" : "border-black/5")}>
                 <p className={cn("text-[10px] font-normal uppercase", isDarkMode ? "text-gray-500" : "text-gray-400")}>ط¥ط¬ظ…ط§ظ„ظٹ</p>
                 <p className={cn("text-2xl font-normal mt-1", isDarkMode ? "text-gray-300" : "text-gray-900")}>{workflowStats.total}</p>
              </div>
            </div>
          </Card>

          {/* Top Products */}
          <Card className="lg:col-span-2 rounded-2xl border-2 shadow-sm overflow-hidden">
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
              <h3 className={cn("font-normal text-lg flex items-center gap-2", isDarkMode ? "text-gray-200" : "text-gray-800")}>
                <TrendingUp size={20} className="text-indigo-500" />
                ط£ظƒط«ط± ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ط¨ظٹط¹ط§ظ‹
              </h3>
            </div>
            <div className={cn("divide-y max-h-96 overflow-y-auto", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
              {merchantStats.topProducts.length === 0 ? (
                <div className={cn("p-12 text-center font-normal", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                  ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط¨ظٹط¹ط§طھ ظƒط§ظپظٹط©
                </div>
              ) : (
                merchantStats.topProducts.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className={cn("p-4 transition-colors", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50")}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <div className="flex-1">
                        <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>{p.name}</p>
                        <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ظ„ظ…ط¨ظٹط¹ط§طھ: {p.sales_count}</p>
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
              ط¢ط®ط± ط§ظ„ط·ظ„ط¨ط§طھ
            </h3>
          </div>
          <div className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-black/5")}>
            {orders.length === 0 ? (
              <div className={cn("p-12 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-normal">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط­ط§ظ„ظٹط§ظ‹</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className={cn("p-4 transition-colors flex items-center justify-between", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50")}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-200" : "text-gray-900")}>ط·ظ„ط¨ #{order.id}</p>
                      <p className={cn("text-[10px]", isDarkMode ? "text-gray-500" : "text-gray-400")}>{new Date(order.created_at).toLocaleDateString('en-US')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 text-[9px] font-normal uppercase rounded-full",
                      order.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {order.status === 'pending' ? (isRegularStore ? 'ط؛ظٹط± ظ…ط´ط­ظˆظ†' : 'ط¨ط§ظ†طھط¸ط§ط±') : (isRegularStore ? 'طھظ… ط§ظ„ط´ط­ظ†' : 'ظ…ظƒطھظ…ظ„')}
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
    const currentSalesItems = salesData[selectedPeriod] || [];
    const reportSummary = salesData.summary || {
      totalRevenue: merchantStats.totalRevenue,
      totalOrders: merchantStats.orderStats.total,
      averageOrder: merchantStats.orderStats.total > 0 ? merchantStats.totalRevenue / merchantStats.orderStats.total : 0,
      saleType: salesTypeFilter
    };
    const countLabel = reportSummary.saleType === 'auction' ? 'ط¹ط¯ط¯ ط§ظ„ظ…ط²ط§ط¯ط§طھ' : reportSummary.saleType === 'order' ? 'ط¹ط¯ط¯ ط§ظ„ط·ظ„ط¨ط§طھ' : 'ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ';

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
            className="rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden bg-slate-900 text-white"
          >
            {/* Header */}
            <div className="p-5 md:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <div>
                <h2 className="text-xl md:text-2xl font-normal flex items-center gap-2 text-white">
                  <CreditCard size={28} className="text-blue-400" />
                  طھظ‚ط±ظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ
                </h2>
                <p className="text-sm mt-1 text-slate-300">ط¹ط±ط¶ طھظپطµظٹظ„ظٹ ظ„ظ„ظ…ط¨ظٹط¹ط§طھ ط®ظ„ط§ظ„ ظپطھط±ط§طھ ظ…ط®طھظ„ظپط©</p>
              </div>
              <button 
                onClick={() => setShowSalesModal(false)}
                className="p-2 rounded-xl transition-colors text-slate-200 hover:text-white hover:bg-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-800/90 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 min-h-[118px] flex flex-col justify-between">
                      <p className="text-sm font-normal mb-3 text-white">ظپطھط±ط© ط§ظ„ط¹ط±ط¶</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                          <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={cn(
                              "px-3 py-2 rounded-xl font-normal text-sm transition-all",
                              selectedPeriod === period
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-slate-800 text-white hover:bg-slate-700"
                            )}
                          >
                            {period === 'daily' ? 'ظٹظˆظ…ظٹ' : period === 'weekly' ? 'ط£ط³ط¨ظˆط¹ظٹ' : 'ط´ظ‡ط±ظٹ'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {[
                      { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', value: formatCurrency(reportSummary.totalRevenue || 0), color: 'from-blue-500/25 to-blue-700/10' },
                      { label: countLabel, value: reportSummary.totalOrders || 0, color: 'from-emerald-500/25 to-emerald-700/10' },
                      { label: 'ظ…طھظˆط³ط· ط§ظ„ط·ظ„ط¨', value: formatCurrency(reportSummary.averageOrder || 0), color: 'from-indigo-500/25 to-indigo-700/10' },
                    ].map((stat) => (
                      <div key={stat.label} className={cn("p-4 rounded-2xl border border-slate-700 bg-gradient-to-br min-h-[118px] flex flex-col justify-center", stat.color)}>
                        <p className="text-[11px] font-normal text-slate-200 mb-2">{stat.label}</p>
                        <p className="text-lg font-normal text-white leading-tight">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4 items-stretch">
                <div className="h-full">
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/90 p-4 space-y-4 h-full">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-sm font-normal mb-2 text-white">ظ…ظ†</label>
                        <input
                          type="date"
                          value={salesDateFrom}
                          onChange={(e) => setSalesDateFrom(e.target.value)}
                          className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 border-slate-600 text-white"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-normal mb-2 text-white">ط¥ظ„ظ‰</label>
                        <input
                          type="date"
                          value={salesDateTo}
                          onChange={(e) => setSalesDateTo(e.target.value)}
                          className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 border-slate-600 text-white"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <button
                          onClick={handleApplySalesFilters}
                          disabled={isLoadingSalesData || (!!salesDateFrom && !!salesDateTo && salesDateFrom > salesDateTo)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl font-normal text-sm transition-all",
                            isLoadingSalesData || (!!salesDateFrom && !!salesDateTo && salesDateFrom > salesDateTo)
                              ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          طھط·ط¨ظٹظ‚ ط§ظ„ظپظ„طھط±
                        </button>
                        <button
                          onClick={handleResetSalesFilters}
                          disabled={isLoadingSalesData}
                          className="px-5 py-2.5 rounded-xl font-normal text-sm transition-all border border-slate-600 text-white hover:bg-slate-700"
                        >
                          ظ…ط³ط­ ط§ظ„طھط§ط±ظٹط®
                        </button>
                      </div>
                    </div>

                    {!!salesDateFrom && !!salesDateTo && salesDateFrom > salesDateTo && (
                      <p className="text-sm text-red-400">طھط§ط±ظٹط® ط§ظ„ط¨ط¯ط§ظٹط© ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ظ‚ط¨ظ„ ط£ظˆ ظٹط³ط§ظˆظٹ طھط§ط±ظٹط® ط§ظ„ظ†ظ‡ط§ظٹط©.</p>
                    )}

                    <div>
                      <p className="text-sm font-normal mb-2 text-white">ظ†ظˆط¹ ط§ظ„ظ…ط¨ظٹط¹</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: 'all', label: 'ط§ظ„ظƒظ„' },
                          { value: 'order', label: 'ط§ظ„ط·ظ„ط¨ط§طھ' },
                          { value: 'auction', label: 'ط§ظ„ظ…ط²ط§ط¯ط§طھ' }
                        ] as const).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSalesTypeFilter(option.value)}
                            className={cn(
                              "px-3 py-2 rounded-xl font-normal text-sm transition-all border",
                              salesTypeFilter === option.value
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "border-slate-600 text-white hover:bg-slate-700"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5 border border-slate-700 bg-slate-800/90 h-full flex flex-col">
                  <h3 className="font-normal text-lg mb-4 text-white">ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ</h3>
                  <div className="space-y-3">
                    {isLoadingSalesData ? (
                      <div className="text-center py-12 text-slate-300">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="font-normal">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ...</p>
                      </div>
                    ) : salesReportError ? (
                      <div className="text-center py-12 text-red-400">
                        <p className="font-normal">{salesReportError}</p>
                      </div>
                    ) : currentSalesItems.length === 0 ? (
                      <div className="text-center py-12 text-slate-300">
                        <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-normal">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط¨ظٹط¹ط§طھ ظ„ظ‡ط°ظ‡ ط§ظ„ظپطھط±ط©</p>
                      </div>
                    ) : (
                      currentSalesItems.map((item: any, idx: number) => {
                        const maxAmount = Math.max(...currentSalesItems.map((i: any) => parseFloat(i.total) || 0), 1);
                        const percentage = (parseFloat(item.total) / maxAmount) * 100;
                        return (
                          <div key={idx} className="space-y-2 rounded-2xl bg-slate-900/70 border border-slate-700 p-3">
                            <div className="flex justify-between items-center">
                              <span className="font-normal text-sm text-white">{item.period}</span>
                              <span className="font-normal text-lg text-blue-300">{formatCurrency(item.total)}</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-700">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                              ></motion.div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-300 font-normal">
                              <span>{item.order_count} ط¹ظ…ظ„ظٹط©</span>
                              <span>{(percentage).toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                </div>
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
          <h3 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط£ظ‚ط³ط§ظ… ط§ظ„ظ…ظ†طھط¬ط§طھ</h3>
          <p className={cn("text-sm font-medium", isDarkMode ? "text-gray-300" : "text-gray-500")}>ظ†ط¸ظ… ظ…ظ†طھط¬ط§طھظƒ ظپظٹ ظ…ط¬ظ…ظˆط¹ط§طھ ظ„ظٹط³ظ‡ظ„ طھطµظپط­ظ‡ط§</p>
        </div>
        <Button 
          onClick={handleAddCategory}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg py-4 px-6 rounded-2xl text-sm font-normal flex items-center gap-2"
        >
          <Plus size={18} /> ط¥ط¶ط§ظپط© ظ‚ط³ظ…
        </Button>
      </div>
      <div className="divide-y divide-black/5">
        {filteredCategories.length === 0 ? (
          <div className={cn("p-16 text-center italic", isDarkMode ? "text-gray-300" : "text-gray-400")}>
            <Layout size={40} className="mx-auto mb-4 opacity-20" />
            {dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ طھظˆط¬ط¯ ط£ظ‚ط³ط§ظ… ط­ط§ظ„ظٹط§ظ‹.'}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className={cn("p-6 flex items-center justify-between group transition-all", isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50")}>
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-black/5", isDarkMode ? "bg-indigo-900/40" : "bg-indigo-50")}>
                  {cat.image_url ? (
                    <img src={getSafeImageUrl(cat.image_url)} className="w-full h-full object-cover" />
                  ) : (
                    <Layout size={24} className={isDarkMode ? "text-indigo-400" : "text-indigo-300"} />
                  )}
                </div>
                <div>
                  <p className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{cat.name}</p>
                  <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط¹ط¯ط¯ ط§ظ„ظ…ظ†طھط¬ط§طھ: {products.filter(p => (p as any).category_id === cat.id).length}</p>
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
        {/* Save Auction Sale Modal */}
        {showAuctionSaveModal && selectedAuctionForSave && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-2xl w-full max-w-md shadow-2xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}
            >
              <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-black/5")}>
                <h3 className={cn("text-lg font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                  ط­ظپط¸ ظ…ط¨ظٹط¹ط© ط§ظ„ظ…ط²ط§ط¯
                </h3>
                <button 
                  onClick={() => {
                    setShowAuctionSaveModal(false);
                    setSelectedAuctionForSave(null);
                    setFinalSalePrice('');
                  }}
                  className={cn("p-1 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500")}
                >
                  <X size={20} />
                </button>
              </div>
              <div className={cn("p-6 space-y-4", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    ط§ظ„ظ…ظ†طھط¬:
                  </p>
                  <p className={cn("text-base font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {selectedAuctionForSave.product_name}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    ط§ظ„ط³ط¹ط± ط§ظ„ظ†ظ‡ط§ط¦ظٹ (ظ…ظ† ط£ط¹ظ„ظ‰ ط¹ط·ط§ط،):
                  </p>
                  <p className={cn("text-lg font-bold text-emerald-600", isDarkMode ? "text-emerald-400" : "")}>
                    {formatCurrency(finalSalePrice ? parseFloat(finalSalePrice) : 0)}
                  </p>
                </div>
                {(selectedAuctionForSave as any)?.selectedBidder && (
                  <div className={cn("rounded-xl p-4 border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-black/5")}>
                    <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط®طھط§ط±:</p>
                    <p className={cn("text-base font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                      {(selectedAuctionForSave as any).selectedBidder.customer_name || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}
                    </p>
                    <p className={cn("text-sm mt-1", isDarkMode ? "text-indigo-300" : "text-indigo-600")}>
                      {(selectedAuctionForSave as any).selectedBidder.customer_phone || '-'}
                    </p>
                  </div>
                )}
                <div className="pt-4 space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/auctions/${selectedAuctionForSave.id}/finalize`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            final_sale_price: parseFloat(finalSalePrice),
                            sold_bidder_bid_id: (selectedAuctionForSave as any)?.selectedBidder?.id || null,
                            sold_bidder_name: (selectedAuctionForSave as any)?.selectedBidder?.customer_name || null,
                            sold_bidder_phone: (selectedAuctionForSave as any)?.selectedBidder?.customer_phone || null
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          alert(data.error || 'ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ظ…ط¨ظٹط¹ط©');
                        } else {
                          alert('طھظ… ط­ظپط¸ ط§ظ„ظ…ط¨ظٹط¹ط© ط¨ظ†ط¬ط§ط­!');
                          setShowAuctionSaveModal(false);
                          setSelectedAuctionForSave(null);
                          setFinalSalePrice('');
                          await refreshMerchantAuctionState(selectedAuctionForBidders?.id || selectedAuctionForSave.id);
                        }
                      } catch (err) {
                        console.error('Error finalizing auction:', err);
                        alert('ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ظ…ط¨ظٹط¹ط©');
                      }
                    }}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-normal text-sm hover:bg-emerald-700 transition-colors"
                  >
                    âœ“ طھط£ظƒظٹط¯ ط§ظ„ط¨ظٹط¹
                  </button>
                  <button
                    onClick={() => {
                      setShowAuctionSaveModal(false);
                    }}
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm transition-colors inline-flex items-center justify-center gap-2", isDarkMode ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")}
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    ط±ط¬ظˆط¹
                  </button>
                  <button
                    onClick={() => {
                      setShowAuctionSaveModal(false);
                      setSelectedAuctionForSave(null);
                      setFinalSalePrice('');
                    }}
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm transition-colors", isDarkMode ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                  >
                    ط¥ظ„ط؛ط§ط،
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bidders Modal */}
        {selectedAuctionForBidders && !showAuctionSaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}
            >
              <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50/50 border-black/5")}>
                <div>
                  <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    ط§ظ„ظ…ط´ط§ط±ظƒظˆظ† ظپظٹ: {selectedAuctionForBidders.product_name}
                  </h3>
                  <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    ط¬ظ…ظٹط¹ ط§ظ„ط¹ط·ط§ط،ط§طھ ط§ظ„ظ…ظ‚ط¯ظ…ط© ظ…ط¹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ط´ط§ط±ظƒظٹظ†
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
                    <p className="font-normal text-lg">ظ„ط§ طھظˆط¬ط¯ ط¹ط·ط§ط،ط§طھ ط­ط§ظ„ظٹط§ظ‹</p>
                  </div>
                ) : (
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700/50" : "bg-gray-50/50")}>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ظ…ط±ظƒط²</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ط³ظ… ط§ظ„ظ…ط´ط§ط±ظƒ</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ظ‚ظٹظ…ط© ط§ظ„ط¹ط·ط§ط،</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ظˆظ‚طھ</th>
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط¥ط¬ط±ط§ط،</th>
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
                              {bidder.customer_name || 'ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}
                            </p>
                            {bidder.is_confirmed_sale && (
                              <p className={cn("text-xs mt-1 font-normal", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                                ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯ ط­ط§ظ„ظٹط§ظ‹
                              </p>
                            )}
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
                          <td className="px-6 py-4 text-center">
                            {bidder.is_confirmed_sale ? (
                              <button
                                onClick={async () => {
                                  if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯ ظˆط¥ظ„ط؛ط§ط، ظ‡ط°ظ‡ ط§ظ„ظ…ط¨ظٹط¹ط©طں')) return;

                                  try {
                                    const res = await fetch(`/api/auctions/${selectedAuctionForBidders.id}/finalize`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' }
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                      alert(data.error || 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯');
                                      return;
                                    }

                                    alert('طھظ… ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯ ظˆطھط­ط¯ظٹط« ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ');
                                    await refreshMerchantAuctionState(selectedAuctionForBidders.id);
                                  } catch (err) {
                                    console.error('Failed to remove confirmed auction sale:', err);
                                    alert('ظپط´ظ„ ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯');
                                  }
                                }}
                                className={cn("px-3 py-2 rounded-lg font-normal text-xs transition-all inline-flex items-center gap-1", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100")}
                                title="ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ ط§ظ„ظ…ط¤ظƒط¯"
                              >
                                <Trash2 size={15} /> ط­ط°ظپ ط§ظ„ظ…ط´طھط±ظٹ
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAuctionForSave({
                                    ...selectedAuctionForBidders,
                                    selectedBidder: bidder
                                  });
                                  setFinalSalePrice(String(bidder.bid_price || ''));
                                  setShowAuctionSaveModal(true);
                                }}
                                className={cn("px-3 py-2 rounded-lg font-normal text-xs transition-all inline-flex items-center gap-1", isDarkMode ? "bg-green-900/30 text-green-400 hover:bg-green-900/50" : "bg-green-50 text-green-600 hover:bg-green-100")}
                                title="طھط£ظƒظٹط¯ ط§ظ„ط¨ظٹط¹ ظ„ظ‡ط°ط§ ط§ظ„ظ…ط´ط§ط±ظƒ"
                              >
                                <CheckCircle size={15} /> طھط£ظƒظٹط¯ ط§ظ„ط¨ظٹط¹
                              </button>
                            )}
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
              <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ†ط´ط·ط©</h2>
            </div>
          </div>

          {auctions.length === 0 ? (
            <div className={cn("p-20 text-center", isDarkMode ? "bg-gray-800 text-gray-500" : "bg-white text-gray-400")}>
              <Zap size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-normal text-lg">ظ„ط§ طھظˆط¬ط¯ ظ…ط²ط§ط¯ط§طھ ظ†ط´ط·ط© ط­ط§ظ„ظٹط§ظ‹</p>
              <p className="text-sm font-normal mt-1">ط§ط¨ط¯ط£ ط¨ط¥ظ†ط´ط§ط، ظ…ط²ط§ط¯ ط¬ط¯ظٹط¯ ظ„ظ…ظ†طھط¬ط§طھظƒ!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className={cn(isDarkMode ? "bg-gray-800" : "bg-gray-50/30")}>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ظ…ظ†طھط¬</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط³ط¹ط± ط§ظ„ط§ط¨طھط¯ط§ط¦ظٹ</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط£ط¹ظ„ظ‰ ط¹ط·ط§ط،</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط¹ط¯ط¯ ط§ظ„ظ…ط´ط§ط±ظƒظٹظ†</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط­ط§ظ„ط© ط§ظ„ظ…ط²ط§ط¯</th>
                    <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDarkMode ? "divide-gray-700" : "divide-gray-50")}>
                  {auctions.map((auction) => (
                    <tr key={auction.id} className={cn("transition-colors group", isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-indigo-50/30")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center", isDarkMode ? "bg-amber-900/30" : "bg-amber-50")}>
                            {auction.image_url ? (
                              <img src={getSafeImageUrl(auction.image_url)} alt={auction.product_name} className="w-full h-full object-cover rounded-lg" />
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
                          auction.status === 'sold' ? (isDarkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700") :
                          auction.status === 'active' ? (isDarkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700") :
                          auction.status === 'pending' ? (isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700") :
                          (isDarkMode ? "bg-gray-700/30 text-gray-400" : "bg-gray-100 text-gray-600")
                        )}>
                          {auction.status === 'sold' ? 'طھظ… ط§ظ„ط¨ظٹط¹' : auction.status === 'active' ? 'ظ†ط´ط·' : auction.status === 'pending' ? 'ظ‚ط±ظٹط¨ط§ظ‹' : 'ظ…ظ†طھظ‡ظٹ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2 flex justify-center items-center">
                        <button 
                          onClick={async () => {
                            setSelectedAuctionForBidders(auction);
                            try {
                              await fetchAuctionBidders(auction.id);
                            } catch (err) {
                              console.error('Failed to fetch bidders:', err);
                              setBidders([]);
                            }
                          }}
                          className={cn("px-4 py-2 rounded-lg font-normal text-xs transition-all", isDarkMode ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100")}
                        >
                          ط¹ط±ط¶ ط§ظ„ظ…ط´ط§ط±ظƒظٹظ† ({auction.total_bids || 0})
                        </button>
                        <button
                          onClick={async () => {
                            const isCompleted = auction.status === 'completed';
                            const message = isCompleted 
                              ? 'ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ط²ط§ط¯ ط§ظ„ظ…ظƒطھظ…ظ„طں' 
                              : 'ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ط²ط§ط¯طں';
                            
                            if (confirm(message)) {
                              try {
                                const res = await fetch(`/api/auctions/${auction.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' }
                                });
                                const data = await res.json();
                                if (!res.ok) {
                                  alert(data.error || 'ط®ط·ط£ ظپظٹ ط­ط°ظپ ط§ظ„ظ…ط²ط§ط¯');
                                } else {
                                  alert('طھظ… ط­ط°ظپ ط§ظ„ظ…ط²ط§ط¯ ط¨ظ†ط¬ط§ط­');
                                  // Refresh auctions
                                  await fetchMerchantAuctions(user?.store_id);
                                }
                              } catch (err) {
                                console.error('Failed to delete auction:', err);
                                alert('ط®ط·ط£ ظپظٹ ط­ط°ظپ ط§ظ„ظ…ط²ط§ط¯');
                              }
                            }
                          }}
                          className={cn("px-3 py-2 rounded-lg font-normal text-xs transition-all flex items-center gap-1", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100")}
                          title="ط­ط°ظپ ط§ظ„ظ…ط²ط§ط¯"
                        >
                          <Trash2 size={16} /> ط­ط°ظپ
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
        <h3 className={cn("font-normal text-xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±</h3>
        <button
          onClick={() => navigate('/merchant')}
          className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700")}
          title="ط¥ط؛ظ„ط§ظ‚"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-5">
        
        {/* ط§ط³ظ… ط§ظ„ظ…طھط¬ط± */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">ط§ط³ظ… ط§ظ„ظ…طھط¬ط±</label>
          <input 
            type="text" 
            value={merchantConfig.app_name} 
            onChange={(e) => setMerchantConfig({ ...merchantConfig, app_name: e.target.value })}
            placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±"
            className={cn("w-full px-4 py-2 border rounded-lg font-normal text-sm outline-none focus:ring-2 transition-all", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:ring-indigo-400")}
          />
        </div>
        
        {/* ط´ط¹ط§ط± ط§ظ„ظ…طھط¬ط± */}
        <div>
          <label className="text-sm font-normal text-gray-700 block mb-2">ط´ط¹ط§ط± ط§ظ„ظ…طھط¬ط±</label>
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
                <p className={cn("text-xs font-normal mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ط¶ط؛ط· ظ„ط§ط®طھظٹط§ط± طµظˆط±ط©</p>
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
        
        
        {/* ط²ط± ط§ظ„ط­ظپط¸ */}
        <button 
          onClick={handleSaveMerchantSettings} 
          className="w-full py-3 rounded-lg text-white font-normal text-base shadow-lg hover:shadow-xl transition-all active:scale-95 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
        >
          ًں’¾ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ
        </button>
      </div>
    </Card>
    );
  };

  const renderOrders = () => {
    const isRegularStore = user?.store_type !== 'topup';
    const unshippedOrdersCount = filteredOrders.filter((order: any) => order.status === 'pending').length;
    const refreshOrdersAndStats = async () => {
      const ordersEndpoint = user?.store_type === 'topup'
        ? `/api/topup/orders?storeId=${user?.store_id}`
        : `/api/orders?storeId=${user?.store_id}`;
      const updated = await fetch(ordersEndpoint).then(r => r.json());
      setOrders(Array.isArray(updated) ? updated : []);

      const statsRes = await fetch(`/api/merchant/stats?storeId=${user?.store_id}`);
      const statsData = await statsRes.json();
      if (statsData && !statsData.error) {
        setMerchantStats(statsData);
      }
    };
    console.log('ًں”چ renderOrders - Orders:', orders);
    console.log('ًں”چ renderOrders - Filtered Orders:', filteredOrders);
    console.log('ًں”چ renderOrders - Dashboard Query:', dashboardQuery);
    console.log('ًں”چ renderOrders - User Store Type:', user?.store_type);
    console.log('ًں”چ renderOrders - Total Orders:', orders.length, 'Filtered:', filteredOrders.length);
    return (
    <Card className={cn("w-full border-none shadow-xl rounded-[2rem] overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5", isDarkMode ? "bg-gray-900" : "bg-white")}>
        <h3 className={cn("font-normal text-4xl", isDarkMode ? "text-white" : "text-gray-900")}>ط·ظ„ط¨ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط،</h3>
        <p className={cn("text-base font-medium mt-2", isDarkMode ? "text-gray-300" : "text-gray-500")}>ط¥ط¯ط§ط±ط© ط¬ظ…ظٹط¹ ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§ط±ط¯ط© ظ„ظ…طھط¬ط±ظƒ</p>
        {orders.length > 0 && <p className="text-xs text-gray-400 mt-2">ًں“ٹ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظ…ط­ظ…ظ„ط©: {orders.length}</p>}
        {isRegularStore && <p className="text-sm text-amber-500 mt-2">ط·ظ„ط¨ط§طھ ط؛ظٹط± ظ…ط´ط­ظˆظ†ط©: {unshippedOrdersCount}</p>}
      </div>
      <div className="divide-y divide-black/5">
        {filteredOrders.length === 0 ? (
          <div className={cn("p-16 text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
            <p className={cn("font-normal text-lg", isDarkMode ? "text-gray-300" : "text-gray-600")}>{dashboardQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ.' : 'ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ظˆط§ط±ط¯ط© ط­ط§ظ„ظٹط§ظ‹'}</p>
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
                      <p className={cn("font-normal text-2xl", isDarkMode ? "text-white" : "text-gray-900")}>ط·ظ„ط¨ #{order.id}</p>
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-normal uppercase rounded-full tracking-wider shadow-sm",
                        order.status === 'pending' ? "bg-amber-100 text-amber-700" : 
                        order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {order.status === 'pending' ? (isRegularStore ? 'ظ„ظ… ظٹطھظ… ط§ظ„ط´ط­ظ† ط¨ط¹ط¯' : 'ط¨ط§ظ†طھط¸ط§ط± ط§ظ„طھط¬ظ‡ظٹط²') : 
                         order.status === 'completed' ? (isRegularStore ? 'طھظ… ط§ظ„ط´ط­ظ†' : 'طھظ… ط§ظ„طھط¬ظ‡ظٹط²') : 'ظ…ظ„ط؛ظٹ'}
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
                    <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظ„ط؛</p>
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
                      {orderItems.map((item: any, itemIndex: number) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={getSafeImageUrl(item.image_url)} className="w-10 h-10 rounded-lg object-cover bg-white shadow-sm ring-1 ring-black/5" />
                            <div>
                               <p className={cn("font-normal text-base", isDarkMode ? "text-white" : "text-gray-800")}>{item.product_name}</p>
                               <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>{item.quantity} أ— {formatCurrency(item.price)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={cn("text-base font-normal whitespace-nowrap", isDarkMode ? "text-white" : "text-gray-700")}>{formatCurrency(item.quantity * item.price)}</p>
                            {itemIndex === 0 && (
                              <div className="flex items-center gap-2">
                                {order.status === 'pending' && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const res = await fetch(`/api/orders/${order.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'completed' })
                                      });
                                      if (res.ok) {
                                        await refreshOrdersAndStats();
                                        alert(isRegularStore ? 'طھظ… ط´ط­ظ† ط§ظ„ط·ظ„ط¨ ظˆطھط£ظƒظٹط¯ ط§ظ„ط¨ظٹط¹ ط¨ظ†ط¬ط§ط­!' : 'طھظ… طھط¬ظ‡ظٹط² ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­!');
                                      }
                                    }}
                                    className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                    title={isRegularStore ? 'طھط£ظƒظٹط¯ ط§ظ„ط´ط­ظ† ظˆط§ظ„ط¨ظٹط¹' : 'طھط£ظƒظٹط¯ ط§ظ„طھط¬ظ‡ظٹط²'}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                <button
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
                                      console.error('ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظپط§طھظˆط±ط©:', err);
                                      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظپط§طھظˆط±ط©. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ„ط§ط­ظ‚ط§ظ‹.');
                                    }
                                  }}
                                  className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all", isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : "bg-white border-black/5 hover:bg-gray-100 text-gray-600")}
                                  title="طھط­ظ…ظٹظ„ ط§ظ„ظپط§طھظˆط±ط©"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط·ظ„ط¨طں ط³ظٹطھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط®ط²ظˆظ† ظˆط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ظٹط¹ط§طھ ط¨ط¹ط¯ ط§ظ„ط­ط°ظپ.')) {
                                      const res = await fetch(`/api/orders/${order.id}`, {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      if (res.ok) {
                                        await refreshOrdersAndStats();
                                        setExpandedOrder(null);
                                        alert('طھظ… ط­ط°ظپ ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­!');
                                      } else {
                                        const data = await res.json().catch(() => ({}));
                                        alert(data.error || 'ظپط´ظ„ ط­ط°ظپ ط§ظ„ط·ظ„ط¨');
                                      }
                                    }
                                  }}
                                  className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all"
                                  title="ط­ط°ظپ ط§ظ„ط·ظ„ط¨"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
        section === 'settings' ? "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±" : 
        section === 'products' ? "ط§ظ„ظ…ظ†طھط¬ط§طھ" : 
        section === 'categories' ? "ط£ظ‚ط³ط§ظ… ط§ظ„ظ…طھط¬ط±" :
        section === 'auctions' ? "ط§ظ„ظ…ط²ط§ط¯ط§طھ" :
        section === 'orders' ? "ط§ظ„ط·ظ„ط¨ط§طھ" : 
        section === 'customers' ? "ط§ظ„ط¹ظ…ظ„ط§ط،" :
        section === 'coupons' ? "ظ‚ط³ط§ط¦ظ… ط§ظ„ط®طµظ…" :
        "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…"
      } 
      role="merchant"
      counts={sidebarCounts}
    >
      <div dir="rtl" className="font-sans">
        {console.log('ًںژ¯ Rendering - section:', section, 'Conditions:', { isSettings: section === 'settings', isCategories: section === 'categories', isOrders: section === 'orders', isProducts: section === 'products', isCustomers: section === 'customers', isCoupons: section === 'coupons', isAuctions: section === 'auctions' })}
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

        {/* Customer Statement Modal - Topup Stores Only */}
        {showCustomerStatement && selectedCustomerStatement && user?.store_type === 'topup' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 overflow-y-auto font-sans" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-[2rem] w-11/12 md:w-10/12 lg:max-w-2xl xl:max-w-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
            >
              {/* Header */}
              <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <div>
                  <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨</h3>
                  <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                    {selectedCustomerStatement.name} - {selectedCustomerStatement.phone}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCustomerStatement(false)}
                  className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Customer Credit Info */}
              <div className={cn("p-4 sm:p-6 grid grid-cols-3 gap-2 sm:gap-4 border-b", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-blue-900/30" : "bg-blue-50")}>
                  <p className={cn("text-[10px] sm:text-xs font-normal mb-1", isDarkMode ? "text-blue-300" : "text-blue-600")}>ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†</p>
                  <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", isDarkMode ? "text-blue-400" : "text-blue-700")}>
                    {Math.round(Number(selectedCustomerStatement.credit_limit) || 0).toLocaleString('en-US')}
                    <span className="block text-[0.9em]">ط¯.ط¹</span>
                  </p>
                </div>
                <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-red-900/30" : "bg-red-50")}>
                  <p className={cn("text-[10px] sm:text-xs font-normal mb-1", isDarkMode ? "text-red-300" : "text-red-600")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</p>
                  <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", isDarkMode ? "text-red-400" : "text-red-700")}>
                    {Math.round(Number(selectedCustomerStatement.current_debt) || 0).toLocaleString('en-US')}
                    <span className="block text-[0.9em]">ط¯.ط¹</span>
                  </p>
                </div>
                <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-green-900/30" : "bg-green-50")}>
                  <p className={cn("text-[10px] sm:text-xs font-normal mb-1", isDarkMode ? "text-green-300" : "text-green-600")}>ط§ظ„ط±طµظٹط¯ ط§ظ„ظ…طھط§ط­</p>
                  <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", isDarkMode ? "text-green-400" : "text-green-700")}>
                    {Math.round((Number(selectedCustomerStatement.credit_limit) || 0) - (Number(selectedCustomerStatement.current_debt) || 0)).toLocaleString('en-US')}
                    <span className="block text-[0.9em]">ط¯.ط¹</span>
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="p-4 md:p-6 flex-1 overflow-y-auto min-h-0">
                {isLoadingCustomerTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: `${primaryColor}` }}></div>
                    <span className={cn("ml-3 font-normal", isDarkMode ? "text-gray-300" : "text-gray-600")}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ...</span>
                  </div>
                ) : (
                  <div className="max-h-[18rem] overflow-auto">
                    <table className="w-full text-right text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className={cn("border-b sticky top-0 z-10", isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„طھط§ط±ظٹط®</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„ط¨ظٹط§ظ†</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-red-400 border-gray-600" : "text-red-600 border-gray-300")}>ظ…ط¯ظٹظ† (Debit)</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-green-400 border-gray-600" : "text-green-600 border-gray-300")}>ط¯ط§ط¦ظ† (Credit)</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-blue-400 border-gray-600" : "text-blue-600 border-gray-300")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط¬ط§ظ„ظٹط©</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط¥ط¬ط±ط§ط،ط§طھ</th>
                        </tr>
                      </thead>
                      <tbody className={cn(isDarkMode ? "divide-gray-700" : "divide-gray-100")}>
                        {customerTransactions.map((transaction: any, idx: number) => {
                          // Format transaction type display
                          let displayType = 'ظ…ط¹ط§ظ…ظ„ط©';
                          if (transaction.type === 'opening') {
                            displayType = transaction.description || 'ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط©';
                          } else if (transaction.is_payment) {
                            displayType = 'âœ“ ط¯ظپط¹ط©';
                          } else if (transaction.type === 'debit') {
                            displayType = 'ط®طµظ…';
                          } else if (transaction.type === 'topup') {
                            displayType = transaction.description || 'ط¨ط·ط§ظ‚ط© ط´ط­ظ†';
                          } else {
                            displayType = transaction.description || transaction.type || 'ظ…ط¹ط§ظ…ظ„ط©';
                          }
                          
                          // Ensure balance is a number
                          const balanceValue = Number(transaction.balance) || 0;
                          const amountValue = Number(transaction.amount) || 0;
                          
                          // Determine if debit or credit based on type and is_payment field
                          // Topup, Debit, Opening are DEBITS (increase debt/charges) - when NOT a payment
                          // Payments are CREDITS (reduce debt/payments)
                          const isPayment = transaction.is_payment === true;
                          const isDebit = !isPayment && (transaction.type === 'topup' || transaction.type === 'debit' || transaction.type === 'opening');
                          const isCredit = isPayment;
                          
                          // Debug topup transactions
                          if (transaction.type === 'topup') {
                            console.log(`ًں“ٹ [MerchantDashboard Compact] Topup TX #${idx}:`, {
                              type: transaction.type,
                              amount: transaction.amount,
                              amountValue: amountValue,
                              is_payment: transaction.is_payment,
                              isPayment: isPayment,
                              isDebit: isDebit
                            });
                          }
                          
                          // Only show ONE value per row: either debit OR credit, not both
                          let debitAmount = 0;
                          let creditAmount = 0;
                          
                          // Debug detailed output
                          if (transaction.type === 'topup') {
                            console.log(`ًں”چ [TX ${idx}] CALCULATING AMOUNTS:`, {
                              type: transaction.type,
                              rawAmount: transaction.amount,
                              amountValue: amountValue,
                              amountNotZero: amountValue !== 0,
                              isDebit: isDebit,
                              isCredit: isCredit,
                              isPayment: isPayment,
                              willShowDebit: isDebit && amountValue !== 0,
                              willShowCredit: isCredit && amountValue !== 0
                            });
                          }
                          
                          // CRITICAL FIX: For topup transactions, ALWAYS show debit amount regardless
                          if (transaction.type === 'topup') {
                            // Topup orders should ALWAYS display their amount as debit
                            debitAmount = Math.abs(amountValue);
                            creditAmount = 0;
                            console.log(`ًں”¥ [TOPUP FIX] TX #${idx}: amount=${amountValue} â†’ debitAmount=${debitAmount}`);
                          } else if (isDebit && amountValue !== 0) {
                            debitAmount = Math.abs(amountValue);
                            creditAmount = 0;
                          } else if (isCredit && amountValue !== 0) {
                            debitAmount = 0;
                            creditAmount = Math.abs(amountValue);
                          }
                          
                          if (transaction.type === 'topup') {
                            console.log(`âœ… [TX ${idx}] FINAL RESULT:`, {
                              type: transaction.type,
                              rawAmount: transaction.amount,
                              debitAmount: debitAmount,
                              creditAmount: creditAmount,
                              willShow: debitAmount > 0 ? `Debit: ${debitAmount}` : creditAmount > 0 ? `Credit: ${creditAmount}` : 'DASHES'
                            });
                          }
                          
                          console.log(`Frontend [${idx}] ${transaction.type}: amount=${amountValue}, balance=${balanceValue}, isPayment=${isPayment}, is_payment_field=${transaction.is_payment}`);
                          
                          return (
                          <tr key={`${transaction.id}-${transaction.type}-${idx}`} className={cn("border-b transition-colors", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50")}>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-normal whitespace-nowrap border", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                              {new Date(transaction.created_at || transaction.date).toLocaleDateString('ar-IQ')}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-normal border", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                              {displayType}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-bold text-center whitespace-nowrap border", 
                              debitAmount > 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-gray-500" : "text-gray-400"), isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}>
                              {debitAmount > 0 ? formatCurrency(debitAmount) : 'â€”'}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-bold text-center whitespace-nowrap border", 
                              creditAmount > 0 ? (isDarkMode ? "text-green-400" : "text-green-600") : (isDarkMode ? "text-gray-500" : "text-gray-400"), isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}>
                              {creditAmount > 0 ? formatCurrency(creditAmount) : 'â€”'}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-bold text-center whitespace-nowrap border", 
                              balanceValue && balanceValue > 0 ? (isDarkMode ? "text-blue-400" : "text-blue-600") : (isDarkMode ? "text-gray-400" : "text-gray-600"), isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}>
                              {formatCurrency(balanceValue)}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 text-center")}>
                              <div className="flex items-center justify-center gap-1">
                                {/* Show edit/delete for all transactions - not just payments */}
                                <>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const newAmountStr = prompt(`ط£ط¯ط®ظ„ ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ط¬ط¯ظٹط¯ (ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ط­ط§ظ„ظٹ: ${transaction.amount}):`);
                                        if (!newAmountStr) return;
                                        
                                        const newAmount = parseFloat(newAmountStr);
                                        if (isNaN(newAmount) || newAmount <= 0) {
                                          alert('â‌Œ ط§ظ„ط±ط¬ط§ط، ط¥ط¯ط®ط§ظ„ ظ…ط¨ظ„ط؛ طµط­ظٹط­');
                                          return;
                                        }
                                        
                                        console.log('Editing transaction:', { id: transaction.id, type: transaction.type, newAmount });
                                        
                                        let res = await fetch(`/api/topup/payment/${transaction.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ newAmount })
                                        });
                                        
                                        if (res.ok) {
                                          alert('âœ“ طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­');
                                          setTimeout(async () => {
                                            setIsLoadingCustomerTransactions(true);
                                            const statementRes = await fetch(`/api/topup/customers/${selectedCustomerStatement.id}/statement`);
                                            if (statementRes.ok) {
                                              const data = await statementRes.json();
                                              setCustomerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
                                              setSelectedCustomerStatement(data.customer);
                                            }
                                            setIsLoadingCustomerTransactions(false);
                                          }, 300);
                                        } else {
                                          const error = await res.json();
                                          alert(`â‌Œ ${error.error}`);
                                        }
                                      } catch (error) {
                                        console.error('Edit error:', error);
                                        alert('â‌Œ ط­ط¯ط« ط®ط·ط£');
                                      }
                                    }}
                                    title="طھط¹ط¯ظٹظ„"
                                    className={cn("p-1.5 rounded-lg transition-all hover:scale-110", isDarkMode ? "hover:bg-amber-900/30 text-amber-400" : "hover:bg-amber-50 text-amber-600")}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„ظ…ط¹ط§ظ…ظ„ط©طں')) return;
                                      try {
                                        console.log('Deleting transaction:', { id: transaction.id, type: transaction.type });
                                        let res = await fetch(`/api/topup/payment/${transaction.id}`, { method: 'DELETE' });
                                        
                                        if (res.ok) {
                                          alert('âœ“ طھظ… ط§ظ„ط­ط°ظپ ط¨ظ†ط¬ط§ط­');
                                          setTimeout(async () => {
                                            setIsLoadingCustomerTransactions(true);
                                            const statementRes = await fetch(`/api/topup/customers/${selectedCustomerStatement.id}/statement`);
                                            if (statementRes.ok) {
                                              const data = await statementRes.json();
                                              setCustomerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
                                              setSelectedCustomerStatement(data.customer);
                                            }
                                            setIsLoadingCustomerTransactions(false);
                                          }, 300);
                                        } else {
                                          alert('ظپط´ظ„ ط§ظ„ط­ط°ظپ');
                                        }
                                      } catch (error) {
                                        console.error('Delete error:', error);
                                        alert('â‌Œ ط­ط¯ط« ط®ط·ط£');
                                      }
                                    }}
                                    title="ط­ط°ظپ"
                                    className={cn("p-1.5 rounded-lg transition-all hover:scale-110", isDarkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-600")}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Edit Transaction Modal */}
              {isEditingTransaction && editingTransactionId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("rounded-2xl w-full max-w-sm shadow-2xl p-6 border", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
                  >
                    <h3 className={cn("text-xl font-normal mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>طھط¹ط¯ظٹظ„ ط§ظ„ظ…ط¹ط§ظ…ظ„ط©</h3>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ظ…ط¨ظ„ط؛</label>
                        <input
                          type="number"
                          value={editingTransactionAmount}
                          onChange={(e) => setEditingTransactionAmount(e.target.value)}
                          className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                        />
                        <span className={cn("absolute left-3 bottom-3 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط¯.ط£</span>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleSaveEditTransaction}
                          className="flex-1 px-4 py-2 rounded-lg font-normal text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                        >
                          ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„
                        </button>
                        <button
                          onClick={() => {
                            setEditingTransactionId(null);
                            setEditingTransactionAmount('');
                          }}
                          className={cn("flex-1 px-4 py-2 rounded-lg font-normal transition-all border", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200")}
                        >
                          ط¥ظ„ط؛ط§ط،
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Payment Input Section */}
              <div className={cn("p-4 md:p-6 border-t", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <h4 className={cn("font-normal text-sm mb-4", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  ًں’³ طھط³ط¬ظٹظ„ ط¯ظپط¹ط© ظٹط¯ظˆظٹط© ظ…ظ† ط§ظ„طھط§ط¬ط±
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={merchantPaymentAmount}
                      onChange={(e) => setMerchantPaymentAmount(e.target.value)}
                      placeholder="ط£ط¯ط®ظ„ ظ…ط¨ظ„ط؛ ط§ظ„ط¯ظپط¹ط©"
                      className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400" : "bg-white border-black/5 placeholder-gray-400")}
                    />
                    <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط¯.ط£</span>
                  </div>
                  <button
                    onClick={handleAddMerchantPayment}
                    disabled={isProcessingMerchantPayment || !merchantPaymentAmount}
                    className={cn("px-6 py-3 rounded-lg font-normal text-white transition-all flex items-center gap-2", isProcessingMerchantPayment ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95")}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isProcessingMerchantPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ط¬ط§ط±ظٹ...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        ط¥ط¶ط§ظپط© ط§ظ„ط¯ظپط¹ط©
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div className={cn("p-4 border-t flex justify-end gap-3", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <button
                  onClick={() => setShowCustomerStatement(false)}
                  className={cn("px-6 py-2 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-100" : "bg-gray-200 hover:bg-gray-300 text-gray-700")}
                >
                  ط¥ط؛ظ„ط§ظ‚
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invoice Modal */}
        {invoiceModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
            >
              <div className={cn("p-6 border-b sticky top-0 flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظپط§طھظˆط±ط© #{invoiceModal.id}</h3>
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
                    ًں–¨ï¸ڈ ط·ط¨ط§ط¹ط©
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ط§ظ„ظƒظ„');
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [storeType, setStoreType] = useState<'regular' | 'topup'>('regular');
  const [isCustomerVerified, setIsCustomerVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [auctionData, setAuctionData] = useState<any>(null);
  const [auctionLoading, setAuctionLoading] = useState(false);
  
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
  const availableCategories = ['ط§ظ„ظƒظ„', ...Array.from(new Set(products.map((p: any) => (p as any).category_name).filter(Boolean)))];

  const filteredProducts = products.filter((p: any) => {
    const isAuctionProduct = p.is_auction === true || p.is_auction === 'true' || p.is_auction === 1;
    if (isAuctionProduct) return false;

    // Remove search filter requirement for initial display
    const matchesSearch = !searchQuery || (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ط§ظ„ظƒظ„' || (p.category_name === selectedCategory);
    const matchesNew = !showNewOnly || (p.created_at && new Date(p.created_at) > new Date(Date.now() - 7*24*60*60*1000));
    return matchesSearch && matchesCategory && matchesNew;
  });

  console.log('ًں“ٹ AFTER FILTER - Filtered products count:', filteredProducts.length);
  console.log('ًں”چ FILTERED PRODUCTS DEBUG:', filteredProducts.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    image_url_length: p.image_url ? String(p.image_url).length : 0,
    has_image: !!p.image_url,
    category_name: (p as any).category_name
  })));
  filteredProducts.slice(0, 3).forEach(p => {
    console.log('  Product item:', { id: p.id, name: p.name, image_url: p.image_url, hasImage: !!p.image_url });
  });

  useEffect(() => {
    // Always load admin settings first for the main page
    fetch('/api/settings?role=admin')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.app_name) {
          setDisplayAppName(data.app_name);
          setDisplayLogoUrl(data.logo_url || '');
          console.log("ًں“‹ Loaded ADMIN settings for main page display");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const loadStoreAndProducts = async () => {
      try {
        console.log('ًں”„ Loading store and products for slug:', storeId);
        const storeRes = await fetch(`/api/stores/slug/${storeId}`).then(r => r.json());
        
        if (storeRes && storeRes.error) {
          console.error('Store not found:', storeRes.error);
          setProducts([]);
          return;
        }
        
        console.log('âœ… Store loaded:', { id: storeRes.id, name: storeRes.store_name, type: storeRes.store_type });

        if (storeRes.slug && storeRes.slug !== storeId) {
          const nextPath = storeRes.store_type === 'topup' ? `/topup/${storeRes.slug}` : `/store/${storeRes.slug}`;
          console.log(`ًں”„ Redirecting customer to canonical store URL: ${nextPath}`);
          navigate(nextPath, { replace: true });
          return;
        }
        
        // If this is a regular (non-topup) store, clear topup customer data
        if (storeRes.store_type !== 'topup') {
          console.log('ًں§¹ Clearing topupCustomer as entering regular store');
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
          const productsData = await fetch(`/api/products?storeId=${actualStoreId}`).then(r => r.json());
          console.log('ًں“¦ API RESPONSE (raw):', { count: Array.isArray(productsData) ? productsData.length : 0, data: productsData });
          // Ensure regular products have store_type
          productsRes = Array.isArray(productsData) ? productsData.map((p: any) => {
            const mapped = {
              ...p,
              store_type: 'regular',
              image_url: p.image_url || ''
            };
            console.log('ًں”„ MAPPED Product:', { 
              id: mapped.id, 
              name: mapped.name, 
              image_url: mapped.image_url,
              image_url_exists: !!p.image_url,
              original_p: p
            });
            return mapped;
          }) : [];
          console.log('âœ… Final productsRes ready:', { count: productsRes.length, samples: productsRes.slice(0, 3) });
        }

        if (storeRes && !storeRes.error) {
          setStoreName(storeRes.store_name || '');
          setDisplayAppName(storeRes.store_name || '');
          setDisplayLogoUrl(storeRes.store_logo || storeRes.logo_url || '');
          const isTopup = storeRes.store_type === 'topup';
          setStoreType(isTopup ? 'topup' : 'regular');
          
          // ط§ط°ط§ ظƒط§ظ† ط§ظ„ظ…طھط¬ط± topupطŒ ط§ط¹ط¯ ط§ظ„طھظˆط¬ظٹظ‡ ط¥ظ„ظ‰ TopupStorefront
          if (isTopup) {
            console.log('ًں”„ Store is topup, redirecting to /topup/:slug');
            navigate(`/topup/${storeRes.slug || slug}`, { replace: true });
            return;
          }
        }

        const rows = Array.isArray(productsRes) ? productsRes : [];
        console.log('âœ… Products loaded:', { count: rows.length, samples: rows.slice(0, 2).map(p => ({ id: p.id, name: p.name, image_url: p.image_url })) });
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

  // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ط¹ظ…ظٹظ„ ظ…ط³ط¬ظ„ ظپظٹ ظ…طھط¬ط± ط§ظ„ط´ط­ظ†
  useEffect(() => {
    if (!storeId) return;
    
    setVerificationLoading(true);
    setVerificationError('');
    setIsCustomerVerified(false);

    // ط¥ط°ط§ ظ„ظ… ظ†ط­ظ…ظ„ ظ†ظˆط¹ ط§ظ„ظ…طھط¬ط± ط¨ط¹ط¯طŒ ظ„ط§ ظ†طھط­ظ‚ظ‚
    if (!storeType) {
      setVerificationLoading(true);
      return;
    }

    // ط¥ط°ط§ ظƒط§ظ† ظ…طھط¬ط±ط§ظ‹ ط¹ط§ط¯ظٹط§ظ‹طŒ ظ„ط§ ظ†ط­طھط§ط¬ ظ„ظ„طھط­ظ‚ظ‚
    if (storeType === 'regular') {
      setIsCustomerVerified(true);
      setVerificationLoading(false);
      return;
    }

    // ظ…طھط¬ط± ط´ط­ظ† - ظٹط¬ط¨ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† طھط³ط¬ظٹظ„ ط§ظ„ط¹ظ…ظٹظ„
    if (storeType === 'topup') {
      if (!user) {
        setVerificationError('ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ط¹ط±ط¶ ظ…طھط¬ط± ط§ظ„ط´ط­ظ†');
        setVerificationLoading(false);
        return;
      }

      // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ط³ط¬ظ„ ظƒط¹ظ…ظٹظ„ ظپظٹ ط§ظ„ظ…طھط¬ط±
      fetch(`/api/customers?storeId=${storeId}&customerId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            console.log('âœ… Customer verified from API:', {
              id: data.id,
              name: data.name,
              phone: data.phone,
              customer_type: data.customer_type
            });
            
            // ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ state
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
            setVerificationError('ط£ظ†طھ ط؛ظٹط± ظ…ط³ط¬ظ„ ظƒط¹ظ…ظٹظ„ ظپظٹ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±. ظٹط±ط¬ظ‰ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ظ…ط¯ظٹط± ط§ظ„ظ…طھط¬ط±.');
          }
        })
        .catch(err => {
          console.error('ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¹ظ…ظٹظ„:', err);
          setVerificationError('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ„ط§ط­ظ‚ط§ظ‹.');
        })
        .finally(() => setVerificationLoading(false));
    }
  }, [storeId, storeType, user]);

  useEffect(() => {
    if (selectedProduct) {
      setMainImage(getPrimaryProductImage(selectedProduct));
      
      // Load auction details if this product is an auction
      if ((selectedProduct as any).is_auction && (selectedProduct as any).auction_id) {
        setAuctionLoading(true);
        fetch(`/api/auctions/${(selectedProduct as any).auction_id}`)
          .then(res => res.json())
          .then(data => {
            console.log('âœ… Auction data loaded:', data);
            setAuctionData(data.auction);
          })
          .catch(err => {
            console.error('â‌Œ Error loading auction:', err);
            setAuctionData(null);
          })
          .finally(() => setAuctionLoading(false));
      } else {
        setAuctionData(null);
      }
    } else {
      setAuctionData(null);
    }
  }, [selectedProduct]);

  const handleAddToCart = (product: Product) => {
    console.log('ًں›’ Adding to cart:', { id: product.id, name: product.name, store_name: (product as any).store_name });
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
    const category = (product as any).category_name || 'ظ…ظ†طھط¬ط§طھ ط£ط®ط±ظ‰';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    console.log('â‍• Adding to category:', { category, product_id: product.id, image_url: product.image_url });
    return acc;
  }, {});

  console.log('ًں—‚ï¸ڈ PRODUCTS BY CATEGORY FINAL:', Object.keys(productsByCategory).map(cat => ({
    category: cat,
    count: productsByCategory[cat].length,
    samples: productsByCategory[cat].slice(0, 2).map(p => ({ id: p.id, name: p.name, image_url: p.image_url }))
  })));

  // Sort categories alphabetically
  const sortedCategories = Object.keys(productsByCategory).sort();

  const renderProductDetails = () => {
    if (!selectedProduct) return null;
    
    if (storeType === 'topup') {
      // Topup product modal - show card images instead of codes
      const images = Array.isArray(selectedProduct.images) 
        ? selectedProduct.images.filter((img: any) => img && String(img).length > 0)
        : [];
      
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
                <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-normal uppercase tracking-widest border inline-block", isDarkMode ? "bg-indigo-900/30 text-indigo-400 border-indigo-700" : "bg-indigo-50 text-indigo-600 border-indigo-100")}>ًں’³ ط¨ط·ط§ظ‚ط© ط´ط­ظ†</span>
                <h2 className={cn("text-2xl sm:text-4xl font-bold mt-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>{selectedProduct.name}</h2>
                <p className={cn("text-sm sm:text-lg mt-2", isDarkMode ? "text-gray-300" : "text-gray-600")}>{selectedProduct.description}</p>
              </div>

              {/* Card Images Gallery */}
              {images.length > 0 && (
                <>
                  <div className={cn("p-6 rounded-2xl mb-6 border-2", isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={cn("text-sm font-normal block mb-2", isDarkMode ? "text-blue-400" : "text-blue-600")}>ط¹ط¯ط¯ طµظˆط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ…طھط§ط­ط©</span>
                        <span className="text-3xl sm:text-4xl font-bold text-blue-500">{images.length}</span>
                      </div>
                      <div className="text-4xl sm:text-5xl">ًں“·</div>
                    </div>
                  </div>

                  {/* Image Preview Gallery */}
                  <div className={cn("mb-6 p-4 rounded-2xl border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                    <p className={cn("text-sm font-normal mb-3", isDarkMode ? "text-gray-300" : "text-gray-600")}>ط¹ظٹظ†ط© ظ…ظ† ط§ظ„طµظˆط±:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {images.slice(0, 3).map((imageUrl: any, idx: number) => (
                        <a 
                          key={idx}
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Card ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                    {images.length > 3 && (
                      <p className={cn("text-xs mt-2", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                        ... ظˆ {images.length - 3} طµظˆط± ط¥ط¶ط§ظپظٹط©
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between items-end pb-6 border-b border-black/10 mb-6">
                <div>
                  <p className={cn("text-xs font-normal mb-2 uppercase", isDarkMode ? "text-gray-500" : "text-gray-500")}>ط§ظ„ط³ط¹ط±</p>
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
                ط´ط±ط§ط، ط§ظ„ط¨ط·ط§ظ‚ط§طھ
              </button>
            </div>
          </motion.div>
        </div>
      );
    }
    
    return (
      <RegularProductModal
        product={selectedProduct}
        isDarkMode={isDarkMode}
        primaryColor={primaryColor}
        appLabel={displayAppName || appName}
        quantities={quantities}
        setQuantities={setQuantities}
        onAddToCart={(product) => {
          addItem(product);
          playAddToCartSound();
        }}
        onClose={() => setSelectedProduct(null)}
      />
    );
  };

  return (
    <div className={cn("min-h-screen pb-28 md:pb-0 flex flex-col", isDarkMode ? "bg-gray-900" : "bg-gray-50")}>
      {/* ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¹ظ…ظٹظ„ ظ„ظ…طھط§ط¬ط± ط§ظ„ط´ط­ظ† */}
      {storeType === 'topup' && (
        <>
          {verificationLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center">
              <div className={cn("rounded-2xl p-8 text-center", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <p className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„...</p>
              </div>
            </div>
          )}
          
          {!verificationLoading && !isCustomerVerified && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className={cn("rounded-2xl p-8 max-w-md", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className="text-center">
                  <div className="text-6xl mb-4">ًں”گ</div>
                  <h2 className={cn("text-2xl font-bold mb-4", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظˆطµظˆظ„ ظ…ظ‚ظٹط¯</h2>
                  <p className={cn("text-lg mb-6", isDarkMode ? "text-gray-300" : "text-gray-700")}>{verificationError}</p>
                  <button
                    onClick={() => navigate('/stores')}
                    className="w-full py-3 rounded-lg text-white font-normal bg-indigo-600 hover:bg-indigo-700 transition-all"
                  >
                    ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…طھط§ط¬ط±
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* ط¥ط¸ظ‡ط§ط± ط§ظ„ظ…ط­طھظˆظ‰ ظپظ‚ط· ط¥ط°ط§ طھظ… ط§ظ„طھط­ظ‚ظ‚ */}
      {(storeType !== 'topup' || isCustomerVerified) && (
        <>
          {renderProductDetails()}

          {/* Shopping Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className={cn('rounded-2xl shadow-lg p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">ط³ظ„ط© ط§ظ„ظ…ط´طھط±ظٹط§طھ</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                onClick={() => setShowCartModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">ط§ظ„ط³ظ„ط© ظپط§ط±ط؛ط©</p>
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
                    ط¹ط±ط¶ ط§ظ„ط³ظ„ط© ط§ظ„ظ…ظپطµظ„ط©
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
              title="ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط´ط§ط´ط© ط§ظ„ط±ط¦ظٹط³ظٹط©"
            >
              <ArrowRight size={24} />
            </button>
          ) : (
            <button 
              onClick={() => setShowCartModal(true)} 
              className="relative flex items-center justify-center p-2 hover:bg-indigo-700 rounded-lg transition-all"
              title="ط¹ط±ط¶ ط§ظ„ط³ظ„ط©"
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
            <h1 className="text-base sm:text-2xl font-normal truncate">{storeId ? displayAppName : 'ظ…ظ†طµط© ظ…ظٹط± ظ„ظ„طھط¬ط§ط±ط© ط§ظ„ط§ظ„ظƒطھط±ظˆظ†ظٹط©'}</h1>
            <p className="text-[10px] sm:text-xs text-indigo-200 truncate">{storeId ? 'ظ…طھط¬ط± ظ…طھط®طµطµ' : 'ط¬ظ…ظٹط¹ ظ…طھط§ط¬ط± ط§ظ„ط³ظˆظ‚ ظپظٹ ظ…ظƒط§ظ† ظˆط§ط­ط¯'}</p>
          </div>

          {/* Left: Cart and Auth */}
          <div className="flex gap-2 items-center">
            <Link to="/cart" className="relative flex items-center justify-center p-2 hover:bg-indigo-700 rounded-lg transition-all" title="ط¹ط±ط¶ ط§ظ„ط³ظ„ط©">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:pb-0 pb-24">

        <div className="space-y-12 sm:space-y-20 pb-10">
          {sortedCategories.map((category) => (
            <section key={category} className="w-full">
              {/* Category Header - Completely Separate */}
              <div className="mb-8 sm:mb-12 pb-6 sm:pb-8">
                <h2 className={cn("text-2xl sm:text-3xl font-bold mb-3", isDarkMode ? "text-white" : "text-indigo-600")}>{category}</h2>
                <p className={cn("text-sm sm:text-base font-semibold mb-6", isDarkMode ? "text-white" : "text-gray-700")}>
                  ط¹ط¯ط¯ ط§ظ„ظ…ظ†طھط¬ط§طھ: <span className={cn("text-xl sm:text-2xl", isDarkMode ? "text-white" : "text-gray-900")}>{productsByCategory[category].length}</span>
                </p>
                <div className="h-2 w-32 rounded-full" style={{ backgroundColor: isDarkMode ? '#818cf8' : '#4f46e5' }} />
                <div className="h-1 w-full mt-6 rounded-full" style={{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }} />
              </div>

              {/* Products Grid - 8 columns */}
              <div className="w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                  {productsByCategory[category].map((product) => {
                    const productImage = getPrimaryProductImage(product);
                    const productImageCandidates = getProductImageCandidates(product);
                    const hasImage = productImage !== PLACEHOLDER_IMAGE;
                    console.log('ًںژ¨ RENDERING CARD:', { 
                      id: product.id, 
                      name: product.name, 
                      image_url: product.image_url,
                      resolved_image_url: productImage,
                      image_url_type: typeof product.image_url,
                      image_url_length: product.image_url ? String(product.image_url).length : 0,
                      hasImage: hasImage,
                      category: category,
                      will_show_image: hasImage ? 'YES âœ…' : 'NO - WILL SHOW PACKAGE â‌Œ'
                    });
                    return (
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
                            {hasImage ? (
                              <img 
                                src={productImage} 
                                data-image-index="0"
                                onError={(event) => handleImageFallback(event, productImageCandidates)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                                alt={product.name}
                              />
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
                              <span className={cn("text-[8px] font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط§ظ„ط³ط¹ط±</span>
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
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <Search size={64} className={cn("mx-auto mb-4", isDarkMode ? "text-gray-600" : "text-gray-200")} />
            <h3 className={cn("text-xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ طھط·ط§ط¨ظ‚ ط¨ط­ط«ظƒ</h3>
            <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-500")}>ط­ط§ظˆظ„ ط§ط³طھط®ط¯ط§ظ… ظƒظ„ظ…ط§طھ ط¨ط­ط« ط£ط®ط±ظ‰ ط£ظˆ ط§ط³طھظƒط´ط§ظپ ط§ظ„ط£ظ‚ط³ط§ظ…</p>
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

  // Function to fetch auctions
  const fetchAuctionsData = async () => {
    try {
      const auctionsRes = await fetch('/api/auctions/active');
      const auctionsData = await auctionsRes.json();
      setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
    } catch (auctionErr) {
      console.warn('Failed to fetch auctions:', auctionErr);
    }
  };

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
        await fetchAuctionsData();
        
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

    // Poll auctions every 2 seconds for real-time bid updates
    const auctionInterval = setInterval(() => {
      fetchAuctionsData();
    }, 2000);

    return () => clearInterval(auctionInterval);
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
      setBidMessage({ type: 'error', text: 'â‌Œ ط§ظ†طھظ‡ظ‰ ظˆظ‚طھ ط§ظ„ظ…ط²ط§ط¯طŒ ظ„ط§ ظٹظ…ظƒظ† ط¥ط¶ط§ظپط© ط¹ط±ظˆط¶' });
      return;
    }

    if (!selectedAuction || !auctionBidForm.bid_price || !auctionBidForm.customer_name || !auctionBidForm.customer_phone) {
      setBidMessage({ type: 'error', text: 'ظٹط±ط¬ظ‰ ظ…ظ„ط، ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ (ط§ظ„ط§ط³ظ…طŒ ط§ظ„ظ‡ط§طھظپطŒ ظˆط§ظ„ط¹ط±ط¶)' });
      return;
    }

    // Validate phone number (basic validation)
    if (!/^\d{7,}$/.test(auctionBidForm.customer_phone.replace(/\D/g, ''))) {
      setBidMessage({ type: 'error', text: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط±ظ‚ظ… ظ‡ط§طھظپ طµط­ظٹط­' });
      return;
    }

    const bidPrice = parseFloat(auctionBidForm.bid_price);
    const minBidPrice = Math.max(
      selectedAuction.current_highest_price || selectedAuction.highest_bid || selectedAuction.starting_price,
      selectedAuction.starting_price
    );

    if (bidPrice <= minBidPrice) {
      setBidMessage({ 
        type: 'error', 
        text: `ط§ظ„ط¹ط±ط¶ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط£ظƒط«ط± ظ…ظ† ${formatCurrency(minBidPrice)}` 
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
        setBidMessage({ type: 'success', text: 'âœ… طھظ… ظ‚ط¨ظˆظ„ ط¹ط±ط¶ظƒ! ط³ظٹطھظ… طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ طھظ„ظ‚ط§ط¦ظٹط§ظ‹...' });
        
        // Update both field names for compatibility
        const updatedAuction = {
          ...selectedAuction,
          current_highest_price: bidPrice,
          highest_bid: bidPrice,
          total_bids: Number(selectedAuction.total_bids || 0) + 1
        };
        setSelectedAuction(updatedAuction);
        
        // Refresh the auctions list to show updated bid
        try {
          const auctionsRes = await fetch('/api/auctions/active');
          const auctionsData = await auctionsRes.json();
          setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
        } catch (e) {
          console.warn('Failed to refresh auctions:', e);
        }
        
        // Clear form
        setAuctionBidForm({ bid_price: '', customer_name: '', customer_phone: '' });
      } else {
        const errData = await res.json();
        setBidMessage({ type: 'error', text: errData.error || 'ظپط´ظ„ طھظ‚ط¯ظٹظ… ط§ظ„ط¹ط±ط¶' });
      }
    } catch (err) {
      console.error('Error submitting bid:', err);
      setBidMessage({ type: 'error', text: 'ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„ ط¨ط§ظ„ط®ط§ط¯ظ…' });
    } finally {
      setBidSubmitting(false);
    }
  };

  // Filtered products based on search query (excluding auctions)
  const filteredProducts = products.filter((p: any) => {
    // Exclude products that are auctions
    if (p.is_auction) return false;
    
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
            {/* ط´ط¹ط§ط± ط§ظ„ط¢ط¯ظ…ظ† (طµظˆط±ط©) ط£ظ‚طµظ‰ ط§ظ„ظٹظ…ظٹظ† */}
            <div className="flex-shrink-0 flex items-center justify-start w-auto md:w-36 h-auto md:h-28">
              <button
                className="relative focus:outline-none"
                onClick={() => setShowCartModal(true)}
                title="ط¹ط±ط¶ ط§ظ„ظ…ط´طھط±ظٹط§طھ"
              >
                {/* ط´ط¹ط§ط± ط§ظ„ط¢ط¯ظ…ظ† */}
                {useSettingsStore.getState().logoUrl ? (
                  <img
                    src={useSettingsStore.getState().logoUrl}
                    alt="ط´ط¹ط§ط± ط§ظ„ط¢ط¯ظ…ظ†"
                    className="h-14 w-14 md:h-24 md:w-24 object-contain rounded-full border-2 border-indigo-200 bg-white shadow"
                    style={{ maxHeight: 112, maxWidth: 112 }}
                  />
                ) : (
                  <UserIcon size={40} className={isDarkMode ? 'text-indigo-400' : 'text-indigo-700'} />
                )}
                {/* ط±ظ‚ظ… ط§ظ„ط³ظ„ط© */}
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-600 text-white text-xs md:text-lg font-bold min-w-6 h-6 md:w-9 md:h-9 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                    {items.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center flex-1 text-center min-w-0 px-1">
              <h1 className={cn('text-lg sm:text-2xl md:text-4xl font-normal leading-tight truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {appName || 'ظ…ظ†طµط© ظ…ظٹط± ظ„ظ„طھط¬ط§ط±ط© ط§ظ„ط§ظ„ظƒطھط±ظˆظ†ظٹط©'}
              </h1>
            </div>

            <div className="hidden md:flex gap-2 items-center mt-2 justify-end w-fit">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300')}
                title={isDarkMode ? 'ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­' : 'ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link to="/stores">
                <button className={cn("px-4 py-2 rounded-lg font-normal text-lg transition-all flex items-center gap-2", isDarkMode ? "bg-gray-700 text-white hover:bg-gray-800 border border-gray-600" : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-100")}>
                  <StoreIcon size={20} />
                  ط§ظ„ظ…طھط§ط¬ط±
                </button>
              </Link>
              <Link to="/register-merchant">
                <button className="px-4 py-2 rounded-lg font-normal text-white bg-indigo-600 hover:bg-indigo-700 transition-all">ط§ظ†ط¶ظ… ظƒطھط§ط¬ط±</button>
              </Link>
              <button className="hidden px-4 py-2 rounded-lg font-normal text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 transition-all" onClick={() => setShowLoginModal(true)}>
                طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300')}
                title={isDarkMode ? 'ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­' : 'ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†'}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setShowMobileMenu(prev => !prev)}
                className={cn('p-2 rounded-lg transition-all', isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                title="ط§ظ„ظ‚ط§ط¦ظ…ط©"
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
                  ط§ظ„ظ…طھط§ط¬ط±
                </button>
              </Link>
              <Link to="/register-merchant" onClick={() => setShowMobileMenu(false)}>
                <button className="w-full px-3 py-2.5 rounded-xl font-normal text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all">ط§ظ†ط¶ظ… ظƒطھط§ط¬ط±</button>
              </Link>
              <button
                className="hidden col-span-2 w-full px-3 py-2.5 rounded-xl font-normal text-sm text-indigo-600 border border-indigo-200 bg-white hover:bg-indigo-50 transition-all"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLoginModal(true);
                }}
              >
                طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
              </button>
            </div>
          )}

          {/* Cart Modal (ط¹ظ†ط¯ ط§ظ„ط¶ط؛ط· ط¹ظ„ظ‰ ط´ط¹ط§ط± ط§ظ„ط¢ط¯ظ…ظ†) */}
          {showCartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={cn('bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative', isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900')}>
                <button
                  className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  onClick={() => setShowCartModal(false)}
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-normal mb-6 text-center">ط³ظ„ط© ط§ظ„ظ…ط´طھط±ظٹط§طھ</h2>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <p className="text-center text-gray-500">ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظپظٹ ط§ظ„ط³ظ„ط©.</p>
                  ) : (
                    <>
                      <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {items.map((item, idx) => (
                          <li key={item.id + '-' + idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              {item.image_url && (
                                <img src={getSafeImageUrl(item.image_url)} alt={item.name} className="w-12 h-12 rounded-lg object-cover border" />
                              )}
                              <div>
                                <div className="font-medium text-base">{(item.store_name && item.store_name !== 'undefined') ? `${item.store_name} - ${item.name}` : item.name}</div>
                                <div className="text-xs text-gray-500">ط§ظ„ظƒظ…ظٹط©: {item.quantity || 1}</div>
                              </div>
                            </div>
                            <div className="font-bold text-indigo-600">{formatCurrency(item.price)}</div>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="w-full mt-6 py-3 rounded-xl text-white font-normal text-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          // ط§ظ„طھط­ظ‚ظ‚ ط¥ط°ط§ ظƒط§ظ†طھ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ظ† ط§ظ„ط´ط­ظ† ظپظ‚ط·
                          const allTopup = items.every((item: any) => item.store_type === 'topup');
                          
                          if (allTopup && items.length > 0) {
                            // ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ظ…ظ† ط§ظ„ط´ط­ظ† - ط§ظ„ط°ظ‡ط§ط¨ ظ…ط¨ط§ط´ط±ط© ط¥ظ„ظ‰ طھط£ظƒظٹط¯ ط§ظ„ط´ط±ط§ط،
                            setShowCartModal(false);
                            handleCheckout();
                          } else {
                            // ظ…ظ†طھط¬ط§طھ ط¹ط§ط¯ظٹط© ط£ظˆ ظ…ط®طھظ„ط·ط© - ط§ظ„ط°ظ‡ط§ط¨ ط¥ظ„ظ‰ طµظپط­ط© ط§ظ„ط³ظ„ط©
                            setShowCartModal(false);
                            navigate('/cart');
                          }
                        }}
                      >
                        <Send size={20} />
                        ط¥ط±ط³ط§ظ„ ط§ظ„ط·ظ„ط¨ ط¥ظ„ظ‰ ط§ظ„ظ…طھط¬ط±
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
            <h2 className="text-2xl font-normal mb-6 text-center">طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</h2>
            
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
                  alert('ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©');
                }
              } catch (err) {
                alert('ط­ط¯ط« ط®ط·ط£ ظ…ط§');
              }
            }} className="space-y-4">
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
                <input 
                  type="text" 
                  name="phone"
                  className={cn("w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/10 text-gray-900")}  
                  placeholder="077XXXXXXXX"
                  required
                />
              </div>
              <div>
                <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</label>
                <input 
                  type="password" 
                  name="password"
                  className={cn("w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/20", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/10 text-gray-900")}  
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-normal hover:bg-indigo-700 transition-all">
                طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
              </button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                ظ„ط§ طھظ…ظ„ظƒ ط­ط³ط§ط¨طں{' '}
                <Link to="/register-merchant" className="text-indigo-600 hover:text-indigo-700 font-normal">
                  ط³ط¬ظ„ ظƒطھط§ط¬ط±
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
                placeholder="ط§ط¨ط­ط« ط¹ظ† ظ…ظ†طھط¬..."
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
                ًں”¥ ط§ظ„ظ…ظ†طھط¬ط§طھ ظ‚ظٹط¯ ط§ظ„ظ…ط²ط§ط¯
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {auctions.filter(a => !shouldHideAuction(a.auction_end_time, a.auction_date)).map((auction) => {
                const timer = getTimeRemaining(auction.auction_end_time, auction.auction_date);
                const isEnded = timer.isEnded;
                
                return (
                  <motion.div key={auction.id} whileHover={{ y: -4 }} className="cursor-default">
                    <Card className={cn('h-full overflow-hidden border-2 border-amber-300 shadow-md transition-all duration-300 hover:shadow-lg cursor-default', isDarkMode ? 'bg-gray-800 border-amber-600' : 'bg-white border-amber-300')}>
                      {/* Image */}
                      <div className={cn('aspect-square w-full overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')} onClick={(e) => { e.stopPropagation(); auction.image_url && (setSelectedImage(getSafeImageUrl(auction.image_url)), setShowImageModal(true)); }}>
                        {auction.image_url ? (
                          <img src={getSafeImageUrl(auction.image_url)} className="w-full h-full object-cover" alt={auction.product_name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={40} className={cn(isDarkMode ? 'text-gray-500' : 'text-gray-300')} />
                          </div>
                        )}
                        
                        {/* Auction Badge */}
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Zap size={12} />
                          ظ…ط²ط§ط¯
                        </div>
                        
                        {/* Timer Badge */}
                        <div className={cn('absolute bottom-2 left-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1', isEnded ? 'bg-red-500 text-white' : 'bg-green-500 text-white')}>
                          <Clock size={12} />
                          {isEnded ? 'ط§ظ†طھظ‡ظ‰' : `${timer.hours}:${timer.minutes.toString().padStart(2, '0')}`}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-2 flex flex-col gap-2 cursor-default" onClick={(e) => e.stopPropagation()}>
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
                              ط§ظ„ط³ط¹ط±:
                            </span>
                            <span className={cn('text-xs font-bold', isDarkMode ? 'text-amber-400' : 'text-amber-600')}>
                              {formatCurrency(auction.starting_price)}
                            </span>
                          </div>
                          
                          {(auction.current_highest_price || auction.highest_bid) && (
                            <div className="flex justify-between items-center gap-1">
                              <span className={cn('text-[9px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                ط£ط¹ظ„ظ‰:
                              </span>
                              <span className={cn('text-xs font-bold', isDarkMode ? 'text-green-400' : 'text-green-600')}>
                                {formatCurrency(auction.current_highest_price || auction.highest_bid)}
                              </span>
                            </div>
                          )}
                          
                          {auction.total_bids && (
                            <div className="flex justify-between items-center gap-1">
                              <span className={cn('text-[9px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                                ط¹ط±ظˆط¶:
                              </span>
                              <span className={cn('text-xs font-bold', isDarkMode ? 'text-blue-400' : 'text-blue-600')}>
                                {auction.total_bids}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Button */}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedAuction(auction); }} className={cn('w-full py-1.5 rounded-lg font-bold text-xs transition-all mt-1 cursor-pointer', isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white')}>
                          ط¹ط±ط¶
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
            ط§ظ„ظ…ظ†طھط¬ط§طھ
          </h2>
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
            <p className={cn('font-normal', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className={cn('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
            <h3 className={cn('text-xl font-normal', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {searchQuery ? 'ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ طھط·ط§ط¨ظ‚ ط§ظ„ط¨ط­ط«' : 'ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظ…طھط§ط­ط© ط­ط§ظ„ظٹط§ظ‹'}
            </h3>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={cn('mt-4 px-4 py-2 rounded-lg font-normal text-white', isDarkMode ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-700')}>
                ظ…ط³ط­ ط§ظ„ط¨ط­ط«
              </button>
            )}
            {!searchQuery && (
              <Link to="/stores" className="mt-6 inline-block">
                <button className={cn("px-6 py-3 rounded-lg font-normal text-white transition-all", isDarkMode ? "bg-indigo-700 hover:bg-indigo-800" : "bg-indigo-600 hover:bg-indigo-700")}>
                  ط§ط³طھظƒط´ظپ ط§ظ„ظ…طھط§ط¬ط±
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {filteredProducts.map((p) => (
              <motion.div key={p.id} whileHover={{ y: -4 }}>
                {(() => {
                  const productImage = getPrimaryProductImage(p);
                  const productImageCandidates = getProductImageCandidates(p);
                  const hasImage = productImage !== PLACEHOLDER_IMAGE;
                  return (
                <Card className={cn('h-full flex flex-col border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group', isDarkMode ? 'bg-gray-800 border-green-700 hover:border-green-600' : 'bg-white border-green-500 hover:border-green-600')}>
                  {/* Image */}
                  <div
                    className={cn('aspect-square w-full overflow-hidden cursor-pointer', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}
                    onClick={() => setSelectedProduct(p)}
                  >
                    {hasImage ? (
                      <img src={productImage} data-image-index="0" onError={(event) => handleImageFallback(event, productImageCandidates)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={p.name} />
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
                      <span className={cn('text-[8px] font-normal', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>ط§ظ„ط³ط¹ط±</span>
                      <span className={cn('text-xs font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{formatCurrency(p.price)}</span>
                    </div>
                  </div>
                </Card>
                  );
                })()}
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Product modal */}
      {selectedProduct && (
        <RegularProductModal
          product={selectedProduct}
          isDarkMode={isDarkMode}
          primaryColor={primaryColor}
          appLabel={selectedProduct.store_name || appName}
          quantities={quantities}
          setQuantities={setQuantities}
          onAddToCart={handleAddToCart}
          onClose={() => setSelectedProduct(null)}
        />
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
                ظ…ظ† ظ…طھط¬ط± {selectedAuction.store_name}
              </p>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2.5">
              {/* Image */}
              <div className={cn('w-full max-h-48 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')} onClick={() => selectedAuction.image_url && (setSelectedImage(getSafeImageUrl(selectedAuction.image_url)), setShowImageModal(true))}>
                {selectedAuction.image_url && (
                  <img src={getSafeImageUrl(selectedAuction.image_url)} className="w-full h-full object-cover" alt={selectedAuction.product_name} />
                )}
              </div>

              {/* Auction Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-green-900/30' : 'bg-green-50')}>
                  <p className={cn('text-[10px] font-normal mb-1', isDarkMode ? 'text-green-300' : 'text-green-600')}>
                    ط§ظ„ط³ط¹ط± ط§ظ„ط£ط³ط§ط³ظٹ
                  </p>
                  <p className={cn('text-sm font-bold', isDarkMode ? 'text-green-400' : 'text-green-700')}>
                    {formatCurrency(selectedAuction.starting_price)}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-blue-300' : 'text-blue-600')}>
                    ط£ط¹ظ„ظ‰ ط¹ط±ط¶
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-blue-400' : 'text-blue-700')}>
                    {(selectedAuction.current_highest_price || selectedAuction.highest_bid) ? formatCurrency(selectedAuction.current_highest_price || selectedAuction.highest_bid) : 'ظ„ط§ طھظˆط¬ط¯ ط¹ط±ظˆط¶'}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-purple-300' : 'text-purple-600')}>
                    ط¹ط¯ط¯ ط§ظ„ط¹ط±ظˆط¶
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-purple-400' : 'text-purple-700')}>
                    {selectedAuction.total_bids || 0}
                  </p>
                </div>

                <div className={cn('p-2 rounded-lg text-center text-xs', isDarkMode ? 'bg-red-900/30' : 'bg-red-50')}>
                  <p className={cn('text-[9px] font-normal mb-0.5', isDarkMode ? 'text-red-300' : 'text-red-600')}>
                    ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھط¨ظ‚ظٹ
                  </p>
                  <p className={cn('text-xs font-bold', isDarkMode ? 'text-red-400' : 'text-red-700')}>
                    {(() => {
                      const timer = getTimeRemaining(selectedAuction.auction_end_time, selectedAuction.auction_date);
                      return timer.isEnded ? 'ط§ظ†طھظ‡ظ‰' : `${timer.hours}:${timer.minutes.toString().padStart(2, '0')}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Auction Times */}
              <div className={cn('p-2.5 rounded-lg border text-xs', isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                <h3 className={cn('font-bold mb-1.5 text-xs', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  ًں“… طھظپط§طµظٹظ„ ط§ظ„ظ…ط²ط§ط¯
                </h3>
                <div className="space-y-0.5 text-[11px]">
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">ط§ظ„طھط§ط±ظٹط®:</span> <span title={formatDateOnly(selectedAuction.auction_date)}>{formatDateOnly(selectedAuction.auction_date)}</span>
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">ظ…ظ†:</span> {selectedAuction.auction_start_time}
                  </p>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    <span className="font-semibold">ط¥ظ„ظ‰:</span> {selectedAuction.auction_end_time}
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
                      <span>â‌Œ ط§ظ†طھظ‡ظ‰ ظˆظ‚طھ ط§ظ„ظ…ط²ط§ط¯ ظˆظ„ط§ ظٹظ…ظƒظ† ط¥ط¶ط§ظپط© ط¹ط±ظˆط¶ ط¬ط¯ظٹط¯ط©</span>
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
                        placeholder="ط£ط¯ط®ظ„ ط§ط³ظ…ظƒ"
                        disabled={bidSubmitting || isAuctionEnded}
                        className={cn('w-full px-2 py-1.5 rounded-lg border outline-none font-normal text-xs', isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500', (bidSubmitting || isAuctionEnded) && 'opacity-50 cursor-not-allowed')}
                      />
                      
                      {/* Customer Phone */}
                      <input 
                        type="tel" 
                        value={auctionBidForm.customer_phone}
                        onChange={(e) => setAuctionBidForm({ ...auctionBidForm, customer_phone: e.target.value })}
                        placeholder="ط±ظ‚ظ… ظ‡ط§طھظپظƒ"
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
                                placeholder={`ط£ظƒط«ط± ظ…ظ† ${formatCurrency(Math.max(selectedAuction.current_highest_price || selectedAuction.highest_bid || selectedAuction.starting_price, selectedAuction.starting_price))}`}
                                disabled={bidSubmitting || isAuctionEnded}
                                className={cn('w-full px-2 py-1.5 rounded-lg border outline-none font-normal text-xs pl-6', isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500', (bidSubmitting || isAuctionEnded) && 'opacity-50 cursor-not-allowed')}
                              />
                              <span className={cn("absolute left-1.5 top-1/2 -translate-y-1/2 font-semibold text-[10px]", isDarkMode ? "text-gray-400" : "text-gray-500")}>ط¯.ط¹</span>
                            </div>
                            <button 
                              onClick={submitAuctionBid}
                              disabled={bidSubmitting || isAuctionEnded}
                              className={cn('flex-1 py-1.5 rounded-lg font-bold text-xs text-white transition-all', (bidSubmitting || isAuctionEnded) ? 'opacity-50 bg-green-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')}
                            >
                              {bidSubmitting ? 'âڈ³ ط¬ط§ط±ظٹ...' : isAuctionEnded ? 'â‌Œ ط§ظ†طھظ‡ظ‰' : 'ًں’° ط¹ط±ط¶'}
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
                      ط¥ط؛ظ„ط§ظ‚
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
            <p className={cn("text-sm", isDarkMode ? "text-gray-300" : "text-gray-500")}>ظ…ظ†طµط© ط§ظ„طھط¬ط§ط±ط© ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط© ظ…طھط¹ط¯ط¯ط© ط§ظ„ظ…ط³طھط£ط¬ط±ظٹظ† ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ظ„ظ„ط´ط±ظƒط§طھ ط§ظ„ط­ط¯ظٹط«ط©.</p>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ…ظ†طµط©</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>ظ…ظ† ظ†ط­ظ†</Link></li>
            </ul>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¯ط¹ظ…</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>ظ…ط±ظƒط² ط§ظ„ظ…ط³ط§ط¹ط¯ط©</Link></li>
            </ul>
          </div>
          <div>
            <h5 className={cn("font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط©</h5>
            <ul className="space-y-2 text-sm">
              <li><Link to="/security" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>ط³ظٹط§ط³ط© ط§ظ„ط£ظ…ط§ظ†</Link></li>
              <li><Link to="/privacy" className={cn("transition-colors", isDarkMode ? "hover:text-indigo-400 text-gray-300" : "hover:text-indigo-600 text-gray-500")}>ط³ظٹط§ط³ط© ط§ظ„ط®طµظˆطµظٹط©</Link></li>
            </ul>
          </div>
        </div>
      </footer>
      <MobileFooterNav />
    </div>
  );
};

// About Page - ظ…ظ† ظ†ط­ظ†
const AboutPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>ظ…ظ† ظ†ط­ظ†</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًںŒچ ظ…ظ†طµطھظ†ط§</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ†ط­ظ† ظ…ظ†طµط© طھط¬ط§ط±ط© ط¥ظ„ظƒطھط±ظˆظ†ظٹط© ط­ط¯ظٹط«ط© طھظˆظپط± ط­ظ„ظˆظ„ط§ظ‹ ط´ط§ظ…ظ„ط© ظ„ظ„طھط¬ط§ط± ظˆط§ظ„ظ…طھط§ط¬ط± ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©. طھط£ط³ط³طھ ط§ظ„ظ…ظ†طµط© ط¨ظ‡ط¯ظپ طھظ…ظƒظٹظ† ط§ظ„ط´ط±ظƒط§طھ ط§ظ„طµط؛ظٹط±ط© ظˆط§ظ„ظ…طھظˆط³ط·ط© ظ…ظ† ط§ظ„ط§ظ†ط·ظ„ط§ظ‚ ط±ظ‚ظ…ظٹط§ظ‹ ط¨ط³ظ‡ظˆظ„ط© ظˆظپط¹ط§ظ„ظٹط©.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًںژ¯ ط±ط³ط§ظ„طھظ†ط§</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              طھظˆظپظٹط± ط£ط¯ظˆط§طھ ظˆط®ط¯ظ…ط§طھ ظ…طھظ‚ط¯ظ…ط© طھظ…ظƒظ‘ظ† ط§ظ„طھط¬ط§ط± ظ…ظ† ط¥ط¯ط§ط±ط© ظ…طھط§ط¬ط±ظ‡ظ… ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط© ط¨ظƒظپط§ط،ط© ظˆطھظˆط³ظٹط¹ ط£ط¹ظ…ط§ظ„ظ‡ظ… ظپظٹ ط§ظ„ط³ظˆظ‚ ط§ظ„ط±ظ‚ظ…ظٹ.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>âœ¨ ظ‚ظٹظ…ظ†ط§</h2>
            <ul className={cn("space-y-2", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              <li>âœ“ ط§ظ„ط´ظپط§ظپظٹط© ظˆط§ظ„ط£ظ…ط§ظ†ط© ظپظٹ ط¬ظ…ظٹط¹ ظ…ط¹ط§ظ…ظ„ط§طھظ†ط§</li>
              <li>âœ“ ط§ظ„ط§ط¨طھظƒط§ط± ط§ظ„ظ…ط³طھظ…ط± ظ„طھط­ط³ظٹظ† ط§ظ„ط®ط¯ظ…ط§طھ</li>
              <li>âœ“ ط¯ط¹ظ… ط§ظ„ط¹ظ…ظ„ط§ط، ط¹ظ„ظ‰ ظ…ط¯ط§ط± ط§ظ„ط³ط§ط¹ط©</li>
              <li>âœ“ ط£ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ظ„ط®طµظˆطµظٹط©</li>
            </ul>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Help Center Page - ظ…ط±ظƒط² ط§ظ„ظ…ط³ط§ط¹ط¯ط©
const HelpCenterPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>ظ…ط±ظƒط² ط§ظ„ظ…ط³ط§ط¹ط¯ط©</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>â‌“ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ط´ط§ط¦ط¹ط©</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>ط³طھط¬ط¯ ط§ظ„ط¥ط¬ط§ط¨ط§طھ ط¹ظ„ظ‰ ط§ظ„ط£ط³ط¦ظ„ط© ط§ظ„ط£ظƒط«ط± ط´ظٹظˆط¹ط§ظ‹ ط­ظˆظ„ ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ…ظ†طµط© ظˆط¥ط¯ط§ط±ط© ظ…طھط¬ط±ظƒ.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں“ڑ ط§ظ„ط¯ظ„ط§ط¦ظ„ ظˆط§ظ„ط£ط¯ظ„ط©</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>ط®ط·ظˆط§طھ ظ…ظپطµظ„ط© ظˆط£ط¯ظ„ط© ط´ط§ظ…ظ„ط© طھط³ط§ط¹ط¯ظƒ ظپظٹ ط§ظ„ط¨ط¯ط، ظˆط§ظ„ظ‚ظٹط§ظ… ط¨ظ…ط®طھظ„ظپ ط§ظ„ط¹ظ…ظ„ظٹط§طھ.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں’¬ ط¯ط¹ظ… ط§ظ„ط¹ظ…ظ„ط§ط،</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>ظپط±ظٹظ‚ ط§ظ„ط¯ط¹ظ… ط§ظ„ط®ط§طµ ط¨ظ†ط§ ظ…طھط§ط­ ظ„ظ…ط³ط§ط¹ط¯طھظƒ ط¹ظ„ظ‰ ظ…ط¯ط§ط± ط§ظ„ط³ط§ط¹ط© ظٹظˆظ…ظٹط§ظ‹.</p>
            </div>
            <div className={cn("border-l-4 border-indigo-600 pl-4", isDarkMode ? 'bg-gray-700' : '')}>
              <h3 className={cn("text-xl font-normal mb-2", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں› ï¸ڈ ط§ظ„طµظٹط§ظ†ط© ظˆط§ظ„طھط­ط¯ظٹط«ط§طھ</h3>
              <p className={cn("text-sm", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>طھط§ط¨ط¹ ط¢ط®ط± ط§ظ„طھط­ط¯ظٹط«ط§طھ ظˆط§ظ„طµظٹط§ظ†ط© ط§ظ„ط¯ظˆط±ظٹط© ظ„ظ„ظ…ظ†طµط©.</p>
            </div>
          </div>
          <div className={cn("p-6 rounded-xl mt-8", isDarkMode ? 'bg-gray-700' : 'bg-indigo-50')}>
            <p className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              <strong>ًں“§ طھظˆط§طµظ„ ظ…ط¹ظ†ط§:</strong> ط¥ط°ط§ ظ„ظ… طھط¬ط¯ ط§ظ„ط¥ط¬ط§ط¨ط©طŒ ظٹظ…ظƒظ†ظƒ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ظپط±ظٹظ‚ظ†ط§ ط¹ط¨ط± ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط£ظˆ ط®ظ„ط§ظ„ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„.
            </p>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Security Policy Page - ط³ظٹط§ط³ط© ط§ظ„ط£ظ…ط§ظ†
const SecurityPolicyPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>ط³ظٹط§ط³ط© ط§ظ„ط£ظ…ط§ظ†</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں”’ ط£ظ…ط§ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ†ط³طھط®ط¯ظ… طھظ‚ظ†ظٹط§طھ ط§ظ„طھط´ظپظٹط± ط§ظ„ط­ط¯ظٹط«ط© ظ„ط­ظ…ط§ظٹط© ظ…ط¹ظ„ظˆظ…ط§طھ ط¹ظ…ظ„ط§ط¦ظ†ط§ ظˆط§ظ„ط­ظپط§ط¸ ط¹ظ„ظ‰ ط³ط±ظٹط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط§ط¬ط± ظˆط§ظ„ط¹ظ…ظ„ط§ط،.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں›،ï¸ڈ ط­ظ…ط§ظٹط© ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ط¬ظ…ظٹط¹ ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ ط§ظ„ظ…ط§ظ„ظٹط© ظ…ط­ظ…ظٹط© ط¨ظ…ط¹ط§ظٹظٹط± ط£ظ…ط§ظ† ط¯ظˆظ„ظٹط©. ظ„ط§ ظ†ظ‚ط¨ظ„ ط¨ط·ط§ظ‚ط§طھ ط§ط¦طھظ…ط§ظ† ظ…ط¨ط§ط´ط±ط© - ظٹطھظ… ط§ظ„طھط¹ط§ظ…ظ„ ظ…ظ† ط®ظ„ط§ظ„ ط¨ظˆط§ط¨ط§طھ ط¯ظپط¹ ط¢ظ…ظ†ط© ظ…ط¹طھظ…ط¯ط©.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں”گ ظƒظ„ظ…ط§طھ ط§ظ„ظ…ط±ظˆط±</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ط§ط³طھط®ط¯ظ… ظƒظ„ظ…ط§طھ ظ…ط±ظˆط± ظ‚ظˆظٹط© ظˆظ„ط§ طھط´ط§ط±ظƒ ط­ط³ط§ط¨ظƒ ظ…ط¹ ط£ط­ط¯. ظٹظ…ظƒظ†ظƒ طھط­ط¯ظٹط« ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظپظٹ ط£ظٹ ظˆظ‚طھ ظ…ظ† ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ط³ط§ط¨.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ط§ظ„ط¥ط¨ظ„ط§ط؛ ط¹ظ† ط§ظ„ظ…ط´ط§ظƒظ„ ط§ظ„ط£ظ…ظ†ظٹط©</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ط¥ط°ط§ ط§ظƒطھط´ظپطھ ط£ظٹ ظ…ط´ظƒظ„ط© ط£ظ…ظ†ظٹط©طŒ ظٹط±ط¬ظ‰ ط§ظ„ط¥ط¨ظ„ط§ط؛ ط¹ظ†ظ‡ط§ ظپظˆط±ط§ظ‹ ط¥ظ„ظ‰ ظپط±ظٹظ‚ ط§ظ„ط£ظ…ط§ظ† ط¨ط®طµظˆطµظٹط© طھط§ظ…ط©.
            </p>
          </div>
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

// Privacy Policy Page - ط³ظٹط§ط³ط© ط§ظ„ط®طµظˆطµظٹط©
const PrivacyPolicyPage = () => {
  const { isDarkMode } = useTheme();
  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-28 md:pb-0 flex flex-col", isDarkMode ? 'bg-gray-900' : '')}>
      <div className="flex-1 max-w-4xl mx-auto px-6 py-16">
        <h1 className={cn("text-4xl font-normal mb-8", isDarkMode ? 'text-white' : 'text-gray-900')}>ط³ظٹط§ط³ط© ط§ظ„ط®طµظˆطµظٹط©</h1>
        <div className={cn("rounded-2xl shadow-lg p-8 space-y-6", isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white')}>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں“‹ ط¬ظ…ط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ†ط¬ظ…ط¹ ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¶ط±ظˆط±ظٹط© ظ„طھظ‚ط¯ظٹظ… ط§ظ„ط®ط¯ظ…ط© ظپظ‚ط·طŒ ظ…ط«ظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط®طµظٹط© ظˆط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ ط§ظ„طھط¬ط§ط±ظٹط©.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں”’ ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط¨ظٹط§ظ†ط§طھ</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ†ط³طھط®ط¯ظ… ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط، ظپظ‚ط· ظ„طھط­ط³ظٹظ† ط§ظ„ط®ط¯ظ…ط© ظˆط§ظ„طھظˆط§طµظ„ ط­ظˆظ„ ط§ظ„ط­ط³ط§ط¨ط§طھ ظˆط§ظ„ط¹ط±ظˆط¶ ط§ظ„ط®ط§طµط©. ظ„ط§ ط¨ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ„ط£ط·ط±ط§ظپ ط«ط§ظ„ط«ط©.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًںڑ€ ظ…ظ„ظپط§طھ طھط¹ط±ظٹظپ ط§ظ„ط§ط±طھط¨ط§ط·</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ†ط³طھط®ط¯ظ… ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„طھط¹ط±ظٹظپظٹط© ظ„طھط­ط³ظٹظ† طھط¬ط±ط¨ط© ط§ظ„ط§ط³طھط®ط¯ط§ظ…. ظٹظ…ظƒظ†ظƒ ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„طھط¹ط±ظٹظپظٹط© ظ…ظ† ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھطµظپط­.
            </p>
          </div>
          <div>
            <h2 className={cn("text-2xl font-normal mb-4", isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>ًں—‘ï¸ڈ ط­ظ‚ظˆظ‚ظƒ</h2>
            <p className={cn("leading-relaxed", isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
              ظ„ط¯ظٹظƒ ط§ظ„ط­ظ‚ ظپظٹ ط·ظ„ط¨ ظ…ط¹ظ„ظˆظ…ط§طھظƒ ط§ظ„ط´ط®طµظٹط©طŒ طھطµط­ظٹط­ظ‡ط§طŒ ط£ظˆ ط­ط°ظپظ‡ط§ ظپظٹ ط£ظٹ ظˆظ‚طھ.
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
  const [isolatedTopupAuthFlow, setIsolatedTopupAuthFlow] = useState(false);
  const [topupAuthName, setTopupAuthName] = useState('');
  const [topupAuthPhone, setTopupAuthPhone] = useState('');
  const [topupAuthError, setTopupAuthError] = useState('');
  const [topupAuthLoading, setTopupAuthLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
        console.log('ًںڈھ Fetching stores from /api/stores...');
        const res = await fetch('/api/stores?limit=50');
        const data = await res.json();
        console.log('ًںڈھ STORES RESPONSE:', { count: Array.isArray(data) ? data.length : 0, data });
        // API now returns only active stores, no need to filter
        setStores(Array.isArray(data) ? data : []);

        setStoresWithLogos(buildStoreLogosMap(Array.isArray(data) ? data : []));
        setLoading(false);
      } catch (err) {
        console.error("â‌Œ Fetch error:", err);
        setStores([]);
        setLoading(false);
      }
    };
    
    fetchStores();
  }, []);

  useEffect(() => {
    if (loading || stores.length === 0) return;

    const shouldOpenTopup = searchParams.get('openTopup');
    const targetSlug = searchParams.get('topupSlug');

    if (!shouldOpenTopup) return;

    const matchedTopupStore = stores.find((store: any) => {
      if (store.store_type !== 'topup') return false;
      if (!targetSlug) return true;

      return String(store.slug) === targetSlug || String(store.id) === targetSlug;
    });

    if (matchedTopupStore) {
      setIsolatedTopupAuthFlow(true);
      setSelectedTopupStore(matchedTopupStore);
      setTopupAuthName('');
      setTopupAuthPhone('');
      setTopupAuthError('');
      setShowTopupAuthModal(true);
    }

    setSearchParams({}, { replace: true });
  }, [loading, stores, searchParams, setSearchParams]);

      useEffect(() => {
        setStoresWithLogos(buildStoreLogosMap(stores));
      }, [stores]);

      useEffect(() => {
        const handleSettingsUpdate = (event: any) => {
          const updatedStoreId = event?.detail?.storeId;
          console.log('ًں”” StoresPage received storeSettingsUpdated event for store:', updatedStoreId);

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
      console.log(`ًںڈھ Store clicked: ID=${store.id}, Name=${store.name}, Slug=${store.slug}`);
      setIsolatedTopupAuthFlow(false);
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
      setTopupAuthError('ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ');
      return;
    }

    setTopupAuthLoading(true);
    try {
      const res = await fetch(`/api/merchant/customers?storeId=${selectedTopupStore.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const customersData = await res.json();
      
      console.log(`ًں”ژ VERIFICATION INPUT: Name="${topupAuthName}", Phone="${topupAuthPhone}"`);
      console.log(`ًں“¦ API RESPONSE: ${Array.isArray(customersData) ? customersData.length : 0} customers`);
      
      // Normalize input phone number
      const normalizedInputPhone = normalizePhone(topupAuthPhone);
      console.log(`ًں“± Normalized Input Phone: "${normalizedInputPhone}"`);
      
      // Filter customers for the topup store
      const registeredCustomers = Array.isArray(customersData) ? customersData.filter((c: any) => {
        const normalizedDbPhone = normalizePhone(c.phone);
        const nameMatch = c.name.toLowerCase().trim() === topupAuthName.toLowerCase().trim();
        const phoneMatch = normalizedDbPhone === normalizedInputPhone;
        console.log(`  âœ“ Checking: Name="${c.name}" (match=${nameMatch}), Phone="${c.phone}" -> "${normalizedDbPhone}" (match=${phoneMatch})`);
        return nameMatch && phoneMatch;
      }) : [];

      console.log(`âœ… Found ${registeredCustomers.length} matching customer(s)`);
      
      if (registeredCustomers.length > 0) {
        // Customer verified - save data to localStorage
        const customer = registeredCustomers[0];
        const customerData = {
          customer_id: customer.id,
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          customer_type: customer.customer_type,
          credit_limit: customer.credit_limit,
          current_debt: customer.current_debt
        };
        console.log('âœ… Customer verified, saving:', customerData);
        // Save to localStorage
        localStorage.setItem('topupCustomer', JSON.stringify(customerData));
        
        // Close modal and navigate
        setShowTopupAuthModal(false);
        setSelectedTopupStore(null);
        setIsolatedTopupAuthFlow(false);
        setTopupAuthName('');
        setTopupAuthPhone('');
        setTopupAuthError('');
        
        // Wait a bit to ensure localStorage is synced, then navigate
        setTimeout(() => {
          const storeSlug = selectedTopupStore.slug || selectedTopupStore.id;
          console.log('ًںڑ€ Navigating to topup store:', storeSlug);
          navigate(`/topup/${storeSlug}`);
        }, 100);
      } else {
        setTopupAuthError('â‌Œ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط¨ظٹط§ظ†ط§طھ ظ…ط·ط§ط¨ظ‚ط©. طھط£ظƒط¯ ظ…ظ† ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط§ظ„طµط­ظٹط­');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setTopupAuthError('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ‚ظ‚. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ„ط§ط­ظ‚ط§ظ‹');
    } finally {
      setTopupAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-normal">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…طھط§ط¬ط±...</p>
        </div>
      </div>
    );
  }

  const closeTopupAuthModal = () => {
    setShowTopupAuthModal(false);
    setSelectedTopupStore(null);
    setTopupAuthName('');
    setTopupAuthPhone('');
    setTopupAuthError('');

    if (isolatedTopupAuthFlow) {
      setIsolatedTopupAuthFlow(false);
      navigate('/stores', { replace: true });
      return;
    }

    setIsolatedTopupAuthFlow(false);
  };

  const showIsolatedTopupAuthScreen = isolatedTopupAuthFlow && showTopupAuthModal && selectedTopupStore;

  return (
    <div className={cn("min-h-screen pb-28 md:pb-0 flex flex-col", showIsolatedTopupAuthScreen ? (isDarkMode ? "bg-gray-950 text-gray-100" : "bg-white text-gray-900") : (isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gradient-to-b from-indigo-50 to-white text-gray-900"))} dir="rtl">
      {/* Header */}
      {!showIsolatedTopupAuthScreen && (
      <div className={cn("border-b sticky top-0 z-40", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-black/5")}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className={cn("flex items-center gap-2 font-normal transition-colors", isDarkMode ? "text-gray-400 hover:text-indigo-400" : "text-gray-600 hover:text-indigo-600")}
          >
            <ChevronRight size={20} />
            <span className="hidden sm:inline">ط§ظ„ط¹ظˆط¯ط©</span>
          </Link>
          <h1 className={cn("text-lg sm:text-2xl font-normal text-center flex-1 truncate", isDarkMode ? "text-white" : "text-gray-900")}>ط§ط³طھظƒط´ظپ ط¬ظ…ظٹط¹ ط§ظ„ظ…طھط§ط¬ط±</h1>
          <div className="w-8 sm:w-16"></div>
        </div>
      </div>
      )}

      {/* Stores Grid */}
      {/* Topup Store Auth Modal */}
      {showTopupAuthModal && selectedTopupStore && (
        <div className={cn("fixed inset-0 flex items-center justify-center z-50 p-4", showIsolatedTopupAuthScreen ? (isDarkMode ? "bg-gray-950" : "bg-white") : "bg-black/50")} dir="rtl">
          <Card className={cn("w-full max-w-md", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn("text-xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط¯ط®ظˆظ„ ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ</h2>
                <button
                  onClick={closeTopupAuthModal}
                  className={cn("p-1 rounded hover:bg-gray-100", isDarkMode ? "hover:bg-gray-700" : "")}
                >
                  <X size={20} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
                </button>
              </div>

              <p className={cn("text-sm mb-4", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط£ط¯ط®ظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ط³ط§ط¨ ظ„ظ„طھط­ظ‚ظ‚</p>

              {topupAuthError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-normal">{topupAuthError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط§ظ„ط§ط³ظ…</label>
                  <input
                    type="text"
                    value={topupAuthName}
                    onChange={(e) => {
                      setTopupAuthName(e.target.value);
                      setTopupAuthError('');
                    }}
                    placeholder="ط£ط¯ط®ظ„ ط§ظ„ط§ط³ظ…"
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
                  <input
                    type="tel"
                    value={topupAuthPhone}
                    onChange={(e) => {
                      setTopupAuthPhone(e.target.value);
                      setTopupAuthError('');
                    }}
                    placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ"
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-300 text-gray-900")}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeTopupAuthModal}
                  className={cn("flex-1 px-4 py-2 rounded-lg font-normal text-sm transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-800")}
                >
                  ط¥ظ„ط؛ط§ط،
                </button>
                <button
                  onClick={handleTopupStoreVerification}
                  disabled={topupAuthLoading}
                  className="flex-1 px-4 py-2 rounded-lg font-normal text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {topupAuthLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚...
                    </>
                  ) : (
                    <>ط§ظ„طھط­ظ‚ظ‚ ظˆط¯ط®ظˆظ„ ط§ظ„ظ…طھط¬ط±</>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!showIsolatedTopupAuthScreen && (
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:py-12 w-full">
        {stores.length === 0 ? (
          <div className="text-center py-20">
            <StoreIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-normal text-white">ظ„ط§ طھظˆط¬ط¯ ظ…طھط§ط¬ط± ظ…طھط§ط­ط© ط­ط§ظ„ظٹط§ظ‹</h3>
            <p className="text-gray-300">طھط­ظ‚ظ‚ ظ„ط§ط­ظ‚ط§ظ‹ ظ„ظ„طھط³ظˆظ‚ ظ…ظ† ظ…طھط§ط¬ط± ط¬ط¯ظٹط¯ط©</p>
          </div>
        ) : (
            <div className="max-w-full sm:max-w-[75%] mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-max justify-items-center">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                whileHover={{ y: -4 }}
                onClick={() => handleStoreClick(store)}
                className="cursor-pointer h-full w-full flex justify-center"
              >
                <Card className={cn(
                  "h-full w-full max-w-[150px] min-h-[300px] flex flex-col overflow-hidden group rounded-[1.5rem] border-2 shadow-sm hover:shadow-xl transition-all duration-300",
                  isDarkMode ? "border-amber-400 bg-gray-800 ring-1 ring-amber-500/40" : "border-amber-500 bg-white ring-1 ring-amber-300/80"
                )}>
                  {/* Store Logo Badge - Always Visible */}
                  <div className={cn(
                    "p-0 flex items-center justify-center aspect-square w-full overflow-hidden border-b",
                    isDarkMode ? "bg-white border-amber-500/40" : "bg-white border-amber-200"
                  )}>
                    {storesWithLogos.has(store.id) && storesWithLogos.get(store.id) ? (
                      <img 
                        src={storesWithLogos.get(store.id)} 
                        className="w-auto h-auto max-w-[84%] max-h-[84%] object-contain" 
                        alt={store.store_name}
                        onError={(e) => console.error("Logo load error for", store.store_name)}
                      />
                    ) : store.store_type === 'topup' ? (
                      // Default logo for topup stores
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-red-600 mb-1">ًں’³</div>
                          <p className="text-xs font-normal text-red-600">ط¨ط·ط§ظ‚ط§طھ ط´ط­ظ†</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white text-gray-300">
                        <StoreIcon size={40} />
                      </div>
                    )}
                  </div>

                  {/* Store Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                    <div>
                      <h3 className={cn("font-normal text-base leading-tight line-clamp-2 min-h-[2.8rem] group-hover:text-indigo-300 transition-colors mb-1", isDarkMode ? "text-white" : "text-gray-900")}>
                        {store.store_name}
                      </h3>
                      <p className={cn("text-[11px] font-normal line-clamp-2 min-h-[2.2rem]", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                        {store.description || 'ظ…طھط¬ط± ظ…طھط®طµطµ'}
                      </p>
                    </div>

                    {/* Store Owner */}
                    {store.owner_name && (
                      <div className="text-[10px] space-y-1">
                        <p className={cn("font-normal", isDarkMode ? "text-gray-400" : "text-gray-500")}>طµط§ط­ط¨ ط§ظ„ظ…طھط¬ط±</p>
                        <p className={cn("font-normal line-clamp-2", isDarkMode ? "text-white" : "text-gray-900")}>{store.owner_name}</p>
                      </div>
                    )}

                    {/* Visit Button */}
                    <button 
                      className="mt-1 w-full py-2 px-3 rounded-xl font-normal text-white text-xs transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ط²ظٹط§ط±ط© ط§ظ„ظ…طھط¬ط±
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
            </div>
          </div>
        )}
      </main>
      )}

      {!showIsolatedTopupAuthScreen && <MobileFooterNav />}
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
          <h1 className="text-2xl font-normal mb-4">ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚</h1>
          <pre className="bg-white p-4 rounded border border-red-200 overflow-auto max-w-full">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طھط·ط¨ظٹظ‚
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main App ---

function App() {
  const { user, logout } = useAuthStore();
  const { setSettings } = useSettingsStore();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true; // ط§ظ„ظˆط¶ط¹ ط§ظ„ظ„ظٹظ„ظٹ ط§ظپطھط±ط§ط¶ظٹظ‹ط§
  });
  console.log("App Render - User:", user);

  // Save dark mode to localStorage
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Validate user session on mount and when location changes
  useEffect(() => {
    // Check if saved user is still valid from server
    if (user?.id) {
      fetch('/api/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: user.role })
      })
        .then(res => {
          if (!res.ok) {
            // User session is invalid, logout
            logout();
          }
        })
        .catch(() => {
          // Network error, but keep user logged in
        });
    }
  }, [user?.id, logout]);

  // Clear any persisted settings on app mount to force fresh data from API
  useEffect(() => {
    // Clear old persisted data that might be stale
    const keysToCheck = ['settings-store', 'cart-store', 'regular-cart-store', 'topup-cart-store'];
    keysToCheck.forEach(key => {
      localStorage.removeItem(key);
      console.log(`ًں§¹ Cleared localStorage key: ${key}`);
    });
  }, []);

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
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'merchant' ? (user.store_type === 'topup' ? '/topup-merchant' : '/merchant') : '/'} replace /> : <LoginPage />} />
          <Route path="/register-merchant" element={<RegisterMerchantPage />} />
          
          {/* Info Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/security" element={<SecurityPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            (() => {
              console.log('Admin Route - user:', user, 'role:', user?.role, 'isAdmin:', user?.role === 'admin');
              if (user?.role === 'admin') {
                return (
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path=":section" element={<AdminDashboard />} />
                  </Routes>
                );
              } else {
                console.log('Not admin - redirecting to login');
                return <Navigate to="/login" replace />;
              }
            })()
          } />

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
  const { primaryColor } = useSettingsStore();
  const { section } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  
  // Redirect to login if not authenticated
  if (!user || user.role !== 'merchant') {
    return <Navigate to="/login" replace />;
  }

  // Dashboard state
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalCodes: 0, activeCodes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCodeUploadModal, setShowCodeUploadModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [showCustomerStatement, setShowCustomerStatement] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedCustomerForPayments, setSelectedCustomerForPayments] = useState<any>(null);
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '' });
  const [isEditingPayment, setIsEditingPayment] = useState<number | null>(null);
  const [isLoadingCustomerTransactions, setIsLoadingCustomerTransactions] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState<number | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<number | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState<number | null>(null);
  const [selectedProductForCodes, setSelectedProductForCodes] = useState<number | null>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState({ name: '', logo_url: '' });
  const [productForm, setProductForm] = useState({ company_id: '', amount: '', price: '', bulk_price: '', quantity_type: 'unit', category_id: '' });
  const [productImages, setProductImages] = useState<File[]>([]);
  const [existingProductImages, setExistingProductImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
  const [storeSettings, setStoreSettings] = useState({ store_name: '', logo_url: '' });
  const [storeLogoBg, setStoreLogoFile] = useState<File | null>(null);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [dashboardLogo, setDashboardLogo] = useState<string>('');
  const [logoRefreshKey, setLogoRefreshKey] = useState(0);
  const [storeInfo, setStoreInfo] = useState<any>(null);

  // Store ID - for topup system, use user's store_id if available, otherwise find first topup store
  const [topupStoreId, setTopupStoreId] = useState<number | null>(null);
  const dashboardRequestRef = useRef(0);
  const latestDashboardDataRef = useRef({
    companies: [] as any[],
    products: [] as any[],
    customers: [] as any[],
    orders: [] as any[],
  });

  const getProductImageCount = (product: any) => {
    if (typeof product?.images_count === 'number') {
      return product.images_count;
    }

    return (product?.images && Array.isArray(product.images))
      ? product.images.filter((img: any) => img && String(img).length > 0).length
      : 0;
  };
  
  // Clean up old localStorage entries on mount
  useEffect(() => {
    const keysToRemove = ['storeInfo_13', 'storeSettings_13', 'topupStorefront_lastBuild'];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`ًں§¹ Removing old localStorage key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }, []);
  
  useEffect(() => {
    const resolveTopupStoreId = async () => {
      try {
        const response = await fetch('/api/stores?limit=100&includeInactive=true');
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          console.warn('âڑ ï¸ڈ No stores found while resolving topup store');
          setTopupStoreId(null);
          return;
        }

        const topupStores = data.filter((store: any) => store?.store_type === 'topup');
        const userTopupStore = topupStores.find((store: any) => Number(store.id) === Number(user?.store_id));
        const resolvedStore = userTopupStore || topupStores[0] || null;
        const resolvedStoreId = Number(resolvedStore?.id) || null;

        console.log('ًں”چ Resolved topup store:', {
          userStoreId: user?.store_id,
          topupStoreIds: topupStores.map((store: any) => store.id),
          resolvedStoreId,
          resolvedStoreType: resolvedStore?.store_type,
        });

        setTopupStoreId(prevStoreId => prevStoreId === resolvedStoreId ? prevStoreId : resolvedStoreId);
      } catch (err) {
        console.error('Failed to resolve topup store:', err);
        setTopupStoreId(null);
      }
    };

    resolveTopupStoreId();
  }, [user?.id, user?.store_id]);

  useEffect(() => {
    latestDashboardDataRef.current = {
      companies,
      products,
      customers,
      orders,
    };
  }, [companies, products, customers, orders]);

  const refreshDashboardData = async (targetStoreId: number | null = topupStoreId) => {
    try {
      if (!targetStoreId || targetStoreId === null || targetStoreId === undefined) {
        console.warn('â›” ABORT: Invalid topupStoreId:', targetStoreId);
        return;
      }

      const requestId = ++dashboardRequestRef.current;
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API request timeout')), 10000)
      );

      const fetchWithTimeout = (url: string) => 
        Promise.race([
          fetch(url)
            .then(r => {
              if (!r.ok) {
                throw new Error(`HTTP ${r.status}`);
              }
              return r.json();
            }),
          timeout
        ]);

      const [comp, prod, ordersData] = await Promise.all([
        fetchWithTimeout(`/api/topup/companies/${targetStoreId}`).catch(() => null),
        fetchWithTimeout(`/api/topup/products/${targetStoreId}?compact=true`).catch(() => null),
        fetchWithTimeout(`/api/topup/orders?storeId=${targetStoreId}`).catch(() => null),
      ]);

      if (requestId !== dashboardRequestRef.current) {
        return;
      }

      const currentDashboardData = latestDashboardDataRef.current;
      const nextCompanies = Array.isArray(comp) ? comp : currentDashboardData.companies;
      const nextProducts = Array.isArray(prod) ? prod : currentDashboardData.products;
      const nextCustomers = currentDashboardData.customers;
      const nextOrders = Array.isArray(ordersData) ? ordersData : currentDashboardData.orders;

      latestDashboardDataRef.current = {
        companies: nextCompanies,
        products: nextProducts,
        customers: nextCustomers,
        orders: nextOrders,
      };

      setCompanies(nextCompanies);
      setProducts(nextProducts);
      setCustomers(nextCustomers);
      setOrders(nextOrders);

      const calculatedStats = calculateStats(nextProducts, nextOrders);
      setStats({
        totalOrders: nextOrders.length,
        totalRevenue: calculatedStats.totalRevenue,
        totalCodes: calculatedStats.totalCodes,
        activeCodes: calculatedStats.totalCodes - calculatedStats.usedCodes
      });
      setIsLoading(false);

      fetchWithTimeout(`/api/topup/customers/${targetStoreId}`)
        .then((customerData: any) => {
          if (requestId !== dashboardRequestRef.current || !Array.isArray(customerData)) {
            return;
          }

          latestDashboardDataRef.current = {
            ...latestDashboardDataRef.current,
            customers: customerData,
          };
          setCustomers(customerData);
        })
        .catch(() => {});
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    useSettingsStore.getState().resetSettings();
    navigate('/login');
  };

  const calculateStats = (prod: any[], ordersData: any[] = []) => {
    let totalCodes = 0;
    let usedCodes = 0;
    let totalRevenue = 0;

    // Calculate image count from products (matching sidebar logic)
    prod.forEach(p => {
      const count = (p.images && Array.isArray(p.images)) 
        ? p.images.filter((img: any) => img && String(img).length > 0).length 
        : 0;
      totalCodes += count;
    });

    // Calculate used codes from orders (each order = one image/code used)
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

  // Load customer statement with transactions
  const handleLoadStatement = async (customerId?: number) => {
    const targetCustomerId = customerId || selectedCustomerStatement?.customer_id || selectedCustomerStatement?.id;
    
    if (!targetCustomerId) {
      console.warn('âڑ ï¸ڈ No customer_id found');
      return;
    }
    
    setIsLoadingCustomerTransactions(true);
    try {
      console.log('ًں”چ Fetching statement for customer:', targetCustomerId);
      const res = await fetch(`/api/topup/customers/${targetCustomerId}/statement`);
      const data = await res.json();
      console.log('ًں“ٹ Raw API response:', data);
      
      if (res.ok) {
        let transactions = [];
        if (data.transactions && Array.isArray(data.transactions)) {
          transactions = data.transactions;
        } else if (Array.isArray(data)) {
          transactions = data;
        }
        console.log('ًں“Œ Setting transactions:', transactions.length);
        setCustomerTransactions(transactions);
        
        // âœ… CRITICAL FIX: Also update customer data (credit_limit, current_debt) from fresh API response
        if (data.customer) {
          console.log('âœ… Updating customer data from API:', {
            id: data.customer.id,
            current_debt: data.customer.current_debt,
            credit_limit: data.customer.credit_limit
          });
          setSelectedCustomerStatement(data.customer);
        }
      } else {
        console.error('â‌Œ API Error:', data);
        setCustomerTransactions([]);
      }
    } catch (error) {
      console.error('â‌Œ Error loading statement:', error);
      setCustomerTransactions([]);
    } finally {
      setIsLoadingCustomerTransactions(false);
    }
  };

  useEffect(() => {
    // â›” CRITICAL: Never allow store ID 13 (doesn't exist in database)
    if (!topupStoreId || !user) {
      console.log('âڈ­ï¸ڈ Skipping refresh: topupStoreId=', topupStoreId, 'user=', user?.id);
      return;
    }

    console.log('âœ… Starting data refresh for store:', topupStoreId, 'user:', user?.id);
    
    // Load data immediately
    refreshDashboardData();

    // Set up auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      console.log('ًں”„ Auto-refreshing data...');
      refreshDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, [section, topupStoreId, user, user?.id]);

  // Fetch store settings on mount
  useEffect(() => {
    // â›” CRITICAL: Validate topupStoreId before any fetch
    if (!topupStoreId || topupStoreId === null || topupStoreId === undefined) {
      console.log('âڈ­ï¸ڈ topupStoreId not ready yet or invalid, skipping fetch:', topupStoreId);
      return;
    }
    
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
    console.log('ًں“چ Dashboard useEffect triggered, loading logo from localStorage for storeId:', topupStoreId);
    const storeSettings = localStorage.getItem(`storeSettings_${topupStoreId}`);
    if (storeSettings) {
      try {
        const parsed = JSON.parse(storeSettings);
        if (parsed.logo_url && parsed.logo_url.length > 100) {
          console.log('ًں“چ Found valid logo, setting it. Length:', parsed.logo_url.length);
          console.log('ًں“چ Logo data ends with:', parsed.logo_url.substring(parsed.logo_url.length - 30));
          setDashboardLogo(prev => {
            if (prev !== parsed.logo_url) {
              console.log('ًں“چ Logo is different from previous, updating');
              return parsed.logo_url;
            }
            console.log('ًں“چ Logo is same as previous, skipping');
            return prev;
          });
        } else {
          console.log('ًں“چ No valid logo found in settings');
        }
      } catch (err) {
        console.error('â‌Œ Error parsing store settings:', err);
      }
    } else {
      console.log('ًں“چ No store settings in localStorage for key:', `storeSettings_${topupStoreId}`);
    }
  }, [topupStoreId]);

  // Trigger refresh when dashboardLogo changes
  useEffect(() => {
    console.log('ًں“چ dashboardLogo changed, length:', dashboardLogo.length);
    setLogoRefreshKey(prev => prev + 1);
  }, [dashboardLogo]);

  // Listen for custom event from settings panel
  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      console.log('ًں”” Event received on Dashboard, topupStoreId:', topupStoreId);
      const storeSettings = localStorage.getItem(`storeSettings_${topupStoreId}`);
      console.log('ًں”” Reading from key:', `storeSettings_${topupStoreId}`);
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          console.log('ًں”” Parsed from localStorage:', {
            has_logo: !!parsed.logo_url,
            logoLength: parsed.logo_url?.length,
            logoEnds: parsed.logo_url?.substring(parsed.logo_url.length - 30)
          });
          if (parsed.logo_url && parsed.logo_url.length > 100) {
            console.log('ًں”” Setting logo from event. Length:', parsed.logo_url.length);
            // Clear first
            setDashboardLogo('');
            setTimeout(() => {
              console.log('ًں”” Now setting new logo');
              setDashboardLogo(parsed.logo_url);
              setLogoRefreshKey(prev => {
                const newKey = prev + 1;
                console.log('ًں”” Incrementing refresh key from', prev, 'to', newKey);
                return newKey;
              });
            }, 50);
          }
        } catch (err) {
          console.error('â‌Œ Error in event handler:', err);
        }
      }
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
    };
  }, [topupStoreId]);

  // Fetch store info for sidebar branding
  useEffect(() => {
    // â›” CRITICAL: Reject invalid store IDs before any fetch
    if (!topupStoreId || topupStoreId === null || topupStoreId === undefined) {
      console.log('âڈ­ï¸ڈ topupStoreId not ready yet or invalid:', topupStoreId);
      return;
    }
    
    console.log('ًں“¦ MerchantTopupDashboard - Fetching store info for store:', topupStoreId);
    
    // Try to load from localStorage first
    const cachedInfo = localStorage.getItem(`storeInfo_${topupStoreId}`);
    if (cachedInfo) {
      try {
        const cached = JSON.parse(cachedInfo);
        setStoreInfo(cached);
        // Also set logo if available
        if (cached.logo_url && cached.logo_url.length > 100) {
          setDashboardLogo(cached.logo_url);
        }
        console.log('âœ… Loaded store info from cache for sidebar');
      } catch (e) {
        console.error('Failed to parse cached store info:', e);
      }
    }
    
    // Always fetch fresh from API
    fetch(`/api/stores/${topupStoreId}`)
        .then(r => {
          if (!r.ok) {
            // If store doesn't exist (404), just use default fallback data
            if (r.status === 404) {
              console.warn(`âڑ ï¸ڈ Store ${topupStoreId} not found, using defaults`);
              throw new Error(`Store ${topupStoreId} not found`);
            }
            throw new Error(`Store fetch failed with status ${r.status}`);
          }
          return r;
        })
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            // Enrich with store_name fallback
            const enrichedData = {
              ...data,
              store_name: data.store_name || data.name || data.title || 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ'
            };
            setStoreInfo(enrichedData);
            // Also set logo if available
            if (enrichedData.logo_url && enrichedData.logo_url.length > 100) {
              setDashboardLogo(enrichedData.logo_url);
              setLogoRefreshKey(prev => prev + 1); // Force refresh the img tag
            }
            localStorage.setItem(`storeInfo_${topupStoreId}`, JSON.stringify(enrichedData));
            console.log('âœ… Updated store info for sidebar:', enrichedData.store_name, 'with logo:', !!enrichedData.logo_url);
          }
        })
        .catch(err => {
          console.error('Failed to fetch store info:', err);
          // Set default store info as fallback
          setStoreInfo({ 
            store_name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
            name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
            description: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ'
          });
        });
  }, [topupStoreId]);

  const handleStoreLogoUpload = async (file: File) => {
    if (!file) return;

    console.log('ًں”„ handleStoreLogoUpload called with file:', {
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
          
          console.log('ًں“¸ Base64 Data Preview:', {
            length: base64Data.length,
            firstChars: base64Data.substring(0, 50),
            lastChars: base64Data.substring(base64Data.length - 30),
            mimeType: file.type
          });
          
          // Compare with current logo
          console.log('ًں“¸ Comparing with current dashboard logo:', {
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
          
          console.log('ًں“‌ Updated Settings:', {
            store_name: updatedSettings.store_name,
            logo_url_length: updatedSettings.logo_url?.length,
            logoEnds: updatedSettings.logo_url?.substring(updatedSettings.logo_url.length - 30)
          });
          
          setStoreSettings(updatedSettings);
          setDashboardLogo(base64Data); // Update sidebar logo immediately
          setLogoPreview(base64Data); // Update preview immediately
          
          // Save to localStorage
          localStorage.setItem(`storeSettings_${topupStoreId}`, JSON.stringify(updatedSettings));
          console.log('âœ“ Saved to localStorage - verifying:', {
            topupStoreId: topupStoreId,
            keyName: `storeSettings_${topupStoreId}`,
            storedLength: localStorage.getItem(`storeSettings_${topupStoreId}`)?.length,
            dataLength: JSON.stringify(updatedSettings).length,
            logoLength: updatedSettings.logo_url?.length,
            logoEnds: updatedSettings.logo_url?.substring(updatedSettings.logo_url.length - 30)
          });
          
          // Also save to database
          try {
            const dbRes = await fetch(`/api/admin/stores/${topupStoreId}/logo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo_url: base64Data })
            });
            if (dbRes.ok) {
              console.log('âœ… Logo saved to database for store', topupStoreId);
            } else {
              console.warn('âڑ ï¸ڈ Failed to save logo to database:', await dbRes.json());
            }
          } catch (err) {
            console.error('â‌Œ Error saving logo to database:', err);
          }
          
          // Dispatch event for menu component
          window.dispatchEvent(new CustomEvent('storeSettingsUpdated', {
            detail: { storeId: topupStoreId, settings: updatedSettings }
          }));
          console.log('ًں“¢ Dispatched storeSettingsUpdated event with storeId:', topupStoreId);
          
          console.log('âœ“ Logo uploaded and saved:', {
            size: file.size,
            type: file.type,
            name: file.name,
            base64Length: base64Data.length
          });
          
          setStoreLogoFile(null);
          alert('âœ“ طھظ… طھط­ظ…ظٹظ„ ط§ظ„ط´ط¹ط§ط± ط¨ظ†ط¬ط§ط­');
          setLogoUploadLoading(false);
        } catch (error) {
          console.error('Error processing logo:', error);
          alert('â‌Œ ط­ط¯ط« ط®ط·ط£ ظپظٹ ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط´ط¹ط§ط±');
          setLogoUploadLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('â‌Œ ط®ط·ط£ ظپظٹ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ');
        setLogoUploadLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('â‌Œ ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„طھط­ظ…ظٹظ„');
      setLogoUploadLoading(false);
    }
  };

  const saveStoreSettings = async () => {
    if (!storeSettings.store_name.trim()) {
      alert('ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±');
      return;
    }

    try {
      // Save to localStorage first (always works)
      localStorage.setItem(`storeSettings_${topupStoreId}`, JSON.stringify(storeSettings));
      console.log('âœ“ Saved to localStorage:', storeSettings);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('storeSettingsUpdated', {
        detail: { storeId: topupStoreId, settings: storeSettings }
      }));
      console.log('ًں“¢ Dispatched storeSettingsUpdated event');

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
          alert('âœ“ طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­ (ظپظٹ ط§ظ„ط®ط§ط¯ظ… ظˆط§ظ„طھط·ط¨ظٹظ‚)');
        } else if (response.status === 404) {
          alert('âœ“ طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­ (ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚)');
          console.log('Note: API endpoint not available, saved locally');
        } else {
          alert('âœ“ طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­ (ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚)\nâڑ ï¸ڈ ظ„ظ… ظٹطھظ… ط­ظپط¸ظ‡ط§ ظپظٹ ط§ظ„ط®ط§ط¯ظ…');
        }
      } catch (apiError) {
        console.log('API not available, but saved locally:', apiError);
        alert('âœ“ طھظ… ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¨ظ†ط¬ط§ط­ (ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚)');
      }
    } catch (error) {
      console.error('Error saving store settings:', error);
      alert('â‌Œ ط­ط¯ط« ط®ط·ط£: ' + (error as any).message);
    }
  };

  const saveCompany = async () => {
    if (!companyForm.name) {
      alert('ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ط´ط±ظƒط©');
      return;
    }

    if (!topupStoreId) {
      alert('â‌Œ ط®ط·ط£: ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ظ…طھط¬ط± ط§ظ„ط´ط­ظ†. ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...');
      return;
    }

    try {
      const method = isEditingCompany ? 'PUT' : 'POST';
      const url = isEditingCompany ? `/api/topup/companies/${isEditingCompany}` : '/api/topup/companies';
      
      console.log('ًں“¤ Sending company data:', {
        store_id: topupStoreId,
        name: companyForm.name,
        logo_url: companyForm.logo_url
      });
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: topupStoreId,
          name: companyForm.name,
          logo_url: companyForm.logo_url || ''
        })
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: responseText };
      }

      if (response.ok) {
        alert(isEditingCompany ? 'طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­' : 'طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ط¨ظ†ط¬ط§ط­');
        setShowCompanyModal(false);
        setCompanyForm({ name: '', logo_url: '' });
        const reloadStoreId = Number(responseData?.store_id || topupStoreId);
        if (reloadStoreId && reloadStoreId !== topupStoreId) {
          setTopupStoreId(reloadStoreId);
        }
        // Reload companies
        const res = await fetch(`/api/topup/companies/${reloadStoreId}`);
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        console.error('â‌Œ Server error response:', responseData);
        const errorMsg = responseData?.error || responseData?.details || 'ظپط´ظ„ ط§ظ„ط­ظپط¸';
        alert('ط®ط·ط£ ظ…ظ† ط§ظ„ط³ظٹط±ظپط±: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„: ' + (error as any).message);
    }
  };

  const saveCustomer = async () => {
    if (!customerForm.name || !customerForm.phone || !customerForm.password) {
      alert('ظٹط±ط¬ظ‰ ظ…ظ„ط، ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©');
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
          password: customerForm.password || customerForm.phone,
          starting_balance: parseInt(customerForm.starting_balance) || 0,
          credit_limit: parseInt(customerForm.credit_limit) || 0,
          customer_type: customerForm.customer_type || 'cash',
          notes: customerForm.notes || ''
        })
      });

      if (response.ok) {
        alert(isEditingCustomer ? 'طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­' : 'طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ط¨ظ†ط¬ط§ط­');
        setShowCustomerModal(false);
        setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
        // Reload customers
        const res = await fetch(`/api/topup/customers/${topupStoreId}`);
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'ط­ط¯ط« ط®ط·ط£');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط§طھطµط§ظ„');
    }
  };

  // ًںژ¯ Handle create product for TOPUP merchant dashboard
  const handleCreateProductTopup = () => {
    if (!user?.store_id) {
      alert("ط¹ط°ط±ط§ظ‹طŒ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط±!");
      return;
    }
    console.log('ًںژ¯ handleCreateProductTopup triggered');
    setProductForm({
      company_id: '',
      amount: '',
      price: '',
      bulk_price: '',
      quantity_type: 'unit',
      category_id: ''
    });
    setProductImages([]);
    setExistingProductImages([]);
    setIsEditingProduct(null);
    console.log('ًںژ¯ About to setShowProductModal(true)');
    setShowProductModal(true);
    console.log('ًںژ¯ setShowProductModal called - modal should appear!');
  };

  // ًں–¼ï¸ڈ Compress image using Canvas API
  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality setting
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const originalSize = reader.result?.toString().length || 0;
          const compressedSize = compressedDataUrl.length;
          
          console.log('ًں”§ Image Compression:');
          console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
          console.log(`  Compressed: ${(compressedSize / 1024).toFixed(2)} KB`);
          console.log(`  Ratio: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction`);
          console.log(`  Dimensions: ${img.width}x${img.height} â†’ ${width}x${height}`);
          
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const saveProduct = async () => {
    if (!productForm.company_id || !productForm.amount || !productForm.price) {
      alert('ظٹط±ط¬ظ‰ ظ…ظ„ط، ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©');
      return;
    }

    try {
      const method = isEditingProduct ? 'PUT' : 'POST';
      const url = isEditingProduct ? `/api/topup/products/${isEditingProduct}` : '/api/topup/products';
      
      const amountInt = parseInt(productForm.amount);
      const priceInt = parseInt(productForm.price);
      const bulkPriceInt = productForm.bulk_price ? parseInt(productForm.bulk_price) : priceInt;
      
      if (isNaN(amountInt) || isNaN(priceInt)) {
        alert('ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط£ط±ظ‚ط§ظ… طµط­ظٹط­ط© ظ„ظ„ظ…ط¨ظ„ط؛ ظˆط§ظ„ط³ط¹ط±');
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

      console.log('ًں“¤ Sending product payload:', payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      console.log('ًں“¥ Product response:', responseData);

      if (response.ok) {
        // Get product ID from response - backend returns product directly
        const productId = isEditingProduct ? isEditingProduct : (responseData.id || responseData.product?.id);
        
        console.log('âœ… Product saved with ID:', productId);
        
        // Upload NEW images first if any are selected
        const uploadedImageUrls: string[] = [];
        if (productImages.length > 0 && productId) {
          console.log('ًں“¸ Uploading', productImages.length, 'new images to Firebase...');
          
          const uploadPromises = productImages.map(imageFile => {
            return new Promise<void>((resolve, reject) => {
              try {
                // Create FormData for multipart/form-data upload (binary, not base64)
                const formData = new FormData();
                formData.append('store_id', topupStoreId.toString());
                formData.append('topup_product_id', productId.toString());
                formData.append('images', imageFile); // Append File object directly
                
                // Send as multipart/form-data (NOT JSON with base64)
                fetch('/api/topup/upload-images-firebase', {
                  method: 'POST',
                  body: formData // FormData handles the multipart encoding
                  // Don't set Content-Type header - browser will set it with boundary automatically
                })
                  .then(async (imageResponse) => {
                    if (!imageResponse.ok) {
                      const imgError = await imageResponse.json();
                      console.warn('âڑ ï¸ڈ Error uploading image to Firebase:', imgError);
                    } else {
                      const uploadResult = await imageResponse.json();
                      console.log('âœ… Image uploaded successfully');
                      console.log('ًں“ٹ File:', imageFile.name, `(${(imageFile.size / 1024).toFixed(2)} KB)`);
                      console.log('ًں“¥ Server response:', JSON.stringify(uploadResult, null, 2));
                      
                      // Track uploaded image URLs if API returns them
                      if (uploadResult.image_urls && Array.isArray(uploadResult.image_urls)) {
                        console.log('ًں”— URLs received from server:', uploadResult.image_urls);
                        uploadedImageUrls.push(...uploadResult.image_urls);
                      } else {
                        console.warn('âڑ ï¸ڈ No image_urls in response. Response keys:', Object.keys(uploadResult));
                      }
                    }
                    resolve();
                  })
                  .catch((err) => {
                    console.error('â‌Œ Error uploading image:', err);
                    reject(err);
                  });
              } catch (err) {
                console.error('â‌Œ Error creating FormData:', err);
                reject(err);
              }
            });
          });
          
          try {
            await Promise.all(uploadPromises);
            console.log('âœ… All new images uploaded successfully');
          } catch (err) {
            console.error('â‌Œ Error uploading images:', err);
          }
        }
        
        // After uploading new images, update product metadata (without images)
        try {
          // DO NOT send images in PUT - images are managed separately via topup_product_images table
          // Only send to update product metadata (amount, price, company, etc.)
          
          console.log('ًں”„ Updating product metadata (images handled separately)');
            
          const updateResponse = await fetch(`/api/topup/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              store_id: topupStoreId,
              company_id: parseInt(productForm.company_id),
              amount: parseInt(productForm.amount),
              price: parseInt(productForm.price),
              bulk_price: productForm.bulk_price ? parseInt(productForm.bulk_price) : parseInt(productForm.price),
              quantity_type: productForm.quantity_type
              // â‌Œ NO images field - images are ONLY stored in topup_product_images table
            })
          });
          
          if (updateResponse.ok) {
            console.log('âœ… Product metadata updated successfully');
          } else {
            console.warn('âڑ ï¸ڈ Failed to update product metadata, status:', updateResponse.status);
          }
        } catch (err) {
          console.warn('âڑ ï¸ڈ Error updating product metadata:', err);
        }

        alert(isEditingProduct ? 'طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­' : 'طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ط¨ظ†ط¬ط§ط­');
        setShowProductModal(false);
        setProductForm({ company_id: '', amount: '', price: '', bulk_price: '', quantity_type: 'unit', category_id: '' });
        setProductImages([]);
        setExistingProductImages([]);
        
        // Reload products AFTER all images are uploaded
        setTimeout(async () => {
          const res = await fetch(`/api/topup/products/${topupStoreId}`);
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
          
          // âœ¨ Trigger refresh for TopupStorefront to see new products
          const { triggerProductsRefresh } = useRefreshStore.getState();
          triggerProductsRefresh();
          console.log('âœ… Products refresh triggered for TopupStorefront');
        }, 500);
      } else {
        const errorMsg = responseData.error || responseData.message || 'ظپط´ظ„ ط­ظپط¸ ط§ظ„ظ…ظ†طھط¬';
        alert('ط®ط·ط£: ' + errorMsg);
        console.error('â‌Œ Server error:', responseData);
      }
    } catch (error) {
      console.error('â‌Œ Error saving product:', error);
      alert('ط­ط¯ط« ط®ط·ط£: ' + (error instanceof Error ? error.message : 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ'));
    }
  };

  const handleUploadCodes = async () => {
    if (uploadedFiles.length === 0) {
      alert('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± طµظˆط±');
      return;
    }

    if (!selectedProductForCodes) {
      alert('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظ†طھط¬ ط£ظˆظ„ط§ظ‹');
      return;
    }

    setIsUploadingImage(true);
    try {
      // Helper function to fetch with timeout
      const fetchWithTimeout = (url: string, options: any, timeoutMs: number = 60000) => {
        return Promise.race([
          fetch(url, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Helper to compress image
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Calculate dimensions to keep aspect ratio
              const maxWidth = 1200;
              const maxHeight = 1200;
              if (width > height) {
                if (width > maxWidth) {
                  height *= maxWidth / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width *= maxHeight / height;
                  height = maxHeight;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
              }
              
              // Compress to JPEG with quality 0.7
              const compressed = canvas.toDataURL('image/jpeg', 0.7);
              resolve(compressed);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      };

      // Helper to convert file to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = e.target?.result as string;
            resolve(data);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      };

      console.log('ًں“¤ Starting upload for', uploadedFiles.length, 'images for product:', selectedProductForCodes);
      
      // Use FormData for multipart upload (binary files, no base64 conversion!)
      const formData = new FormData();
      formData.append('store_id', topupStoreId.toString());
      formData.append('topup_product_id', selectedProductForCodes.toString());
      
      // Add all files directly (no compression, no base64)
      uploadedFiles.forEach((file) => {
        console.log(`ًں“پ Adding file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        formData.append('images', file);
      });
      
      console.log('âœ… FormData prepared with', uploadedFiles.length, 'files');

      const response = await fetchWithTimeout('/api/topup/upload-images-firebase', {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it automatically with boundary
      }, 300000); // 5 minute timeout for large file uploads

      const responseData = await response.json();

      if (response.ok) {
        console.log('âœ… All images uploaded successfully');
        alert(responseData.message || `طھظ… طھط­ظ…ظٹظ„ ${uploadedFiles.length} طµظˆط±ط© ط¨ظ†ط¬ط§ط­!`);
        setShowCodeUploadModal(false);
        setUploadedFiles([]);
        setSelectedProductForCodes(null);
        
        // Refresh products with timeout
        try {
          const updatedRes = await fetchWithTimeout(`/api/topup/products/${topupStoreId}`, {});
          const data = await updatedRes.json();
          setProducts(Array.isArray(data) ? data : []);
          console.log('âœ… Products refreshed after upload');
        } catch (refreshError) {
          console.warn('âڑ ï¸ڈ Failed to refresh products:', refreshError);
          // Don't fail the whole upload if refresh fails, just log it
        }
      } else {
        alert(`ط®ط·ط£: ${responseData.error || 'ظپط´ظ„ طھط­ظ…ظٹظ„ ط§ظ„طµظˆط±ط©'}`);
      }
    } catch (error) {
      console.error('â‌Œ Error uploading image:', error);
      const errorMsg = error instanceof Error ? error.message : 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ';
      alert('ط­ط¯ط« ط®ط·ط£: ' + errorMsg);
    } finally {
      setIsUploadingImage(false);
    }
  };



  const currentSection = section || 'overview';

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDarkMode ? "bg-gray-950" : "bg-gray-50")} dir="rtl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600/20 mb-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className={cn("text-lg font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ...</p>
        </div>
      </div>
    );
  }

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
                  console.log('âœ… Sidebar image loaded successfully! Key:', logoRefreshKey, 'Src ends with:', dashboardLogo.substring(dashboardLogo.length - 30));
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <CreditCard size={24} />
              </div>
            )}
            <div>
              <h2 className={cn("font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{storeInfo?.store_name || 'ط§ظ„ط¥ط¯ط§ط±ط©'}</h2>
              <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'ظ…ظ„ط®طµ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', icon: BarChart3, badge: null },
              { id: 'companies', label: 'ط§ظ„ط´ط±ظƒط§طھ', icon: StoreIcon, badge: companies.length },
              { id: 'products', label: 'ط§ظ„ظ…ظ†طھط¬ط§طھ', icon: CreditCard, badge: products.length },
              { id: 'codes', label: 'ط§ظ„ط£ظƒظˆط§ط¯', icon: Ticket, badge: products.reduce((sum: number, p: any) => {
                // Count uploaded images from each product
                const count = (p.images && Array.isArray(p.images)) 
                  ? p.images.filter((img: any) => img && String(img).length > 0).length 
                  : 0;
                return sum + count;
              }, 0) },
              { id: 'customers', label: 'ط§ظ„ط¹ظ…ظ„ط§ط،', icon: Users, badge: customers.length },
              { id: 'orders', label: 'ط§ظ„ط·ظ„ط¨ط§طھ', icon: ShoppingCart, badge: orders.filter((o: any) => o.status !== 'returned').length },
              { id: 'settings', label: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', icon: Settings, badge: null },
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
                {item.badge !== null && (item.badge > 0 || item.id === 'codes') && (
                  <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full min-w-max", 
                    item.id === 'codes' 
                      ? currentSection === item.id ? "bg-yellow-400/30 text-yellow-200" : isDarkMode ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                      : item.id === 'products'
                      ? currentSection === item.id ? "bg-blue-400/30 text-blue-200" : isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800"
                      : item.id === 'orders'
                      ? currentSection === item.id ? "bg-red-400/30 text-red-200" : isDarkMode ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-800"
                      : item.id === 'companies'
                      ? currentSection === item.id ? "bg-green-400/30 text-green-200" : isDarkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800"
                      : item.id === 'customers'
                      ? currentSection === item.id ? "bg-purple-400/30 text-purple-200" : isDarkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-800"
                      : currentSection === item.id ? "bg-white/20" : isDarkMode ? "bg-gray-700 text-indigo-400" : "bg-indigo-100 text-indigo-700"
                  )}>
                    {item.badge === 0 && item.id === 'codes' ? '0ï¸ڈâƒ£' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className={cn("mt-8 pt-8 border-t", isDarkMode ? "border-gray-800" : "border-gray-200")}>
            <div className={cn("p-4 rounded-lg mb-4", isDarkMode ? "bg-gray-800" : "bg-gray-100")}>
              <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط£ظ†طھ ظ…ط³ط¬ظ„ ط¨طµظپط©</p>
              <p className={cn("font-normal mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>{user?.name || 'طھط§ط¬ط±'}</p>
            </div>
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
                {currentSection === 'overview' ? 'ظ…ظ„ط®طµ ط§ظ„ظ…ط¨ظٹط¹ط§طھ' :
                 currentSection === 'companies' ? 'ط¥ط¯ط§ط±ط© ط§ظ„ط´ط±ظƒط§طھ' :
                 currentSection === 'products' ? 'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طھط¬ط§طھ' :
                 currentSection === 'codes' ? 'ط¥ط¯ط§ط±ط© ط§ظ„ط£ظƒظˆط§ط¯' :
                 currentSection === 'orders' ? 'ط§ظ„ط·ظ„ط¨ط§طھ' :
                 currentSection === 'customers' ? 'ط§ظ„ط¹ظ…ظ„ط§ط،' :
                 currentSection === 'settings' ? 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ' : 'ط§ظ„ظ„ظˆط­ط©'}
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
                  { label: 'ًں“ٹ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ', value: stats.totalOrders.toString(), color: 'indigo' },
                  { label: 'ًں’° ط§ظ„ط¥ظٹط±ط§ط¯ط§طھ', value: `${formatNumber(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : parseFloat(String(stats.totalRevenue) || '0'))} ط¯.ط¹`, color: 'green' },
                  { label: 'ًں“¦ ط§ظ„ط£ظƒظˆط§ط¯ ط§ظ„ظ…طھط§ط­ط©', value: stats.totalCodes.toString(), color: 'blue' },
                  { label: 'âœ… ط§ظ„ط£ظƒظˆط§ط¯ ط§ظ„ظ…ط³طھط®ط¯ظ…ط©', value: ((stats.totalCodes || 0) - (stats.activeCodes || 0)).toString(), color: 'purple' },
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
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“ˆ ظ…طھظˆط³ط· ظ‚ظٹظ…ط© ط§ظ„ط·ظ„ط¨</p>
                  <p className={cn("text-2xl font-normal text-blue-600")}>{stats.totalOrders > 0 ? formatNumber(stats.totalRevenue / stats.totalOrders) : '0'} ط¯.ط¹</p>
                </Card>
                <Card className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“ٹ ظ†ط³ط¨ط© ط§ظ„ط§ط³طھط®ط¯ط§ظ…</p>
                  <p className={cn("text-2xl font-normal text-orange-600")}>{stats.totalCodes > 0 ? Math.round(((stats.totalCodes - stats.activeCodes) / stats.totalCodes) * 100) : 0}%</p>
                </Card>
                <Card className={cn("p-6 border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًںڈ¢ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط´ط±ظƒط§طھ</p>
                  <p className={cn("text-2xl font-normal text-green-600")}>{companies.length}</p>
                </Card>
              </div>

              {/* Top Products & Companies Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                    <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ًں”¥ ط£ط¹ظ„ظ‰ ط§ظ„ظ…ظ†طھط¬ط§طھ</h3>
                  </div>
                  <div className="p-6">
                    {Array.isArray(products) && products.length > 0 ? (
                      <div className="space-y-3">
                        {products
                          .sort((a, b) => {
                            const aRevenue = Number(a.amount) || 0;
                            const bRevenue = Number(b.amount) || 0;
                            return bRevenue - aRevenue;
                          })
                          .slice(0, 5)
                          .map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center pb-3 border-b last:border-b-0" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                              <div>
                                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{i + 1}. {p.company_name}</p>
                                <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>ط§ظ„ظ…ط¨ظ„ط؛: {formatNumber(p.amount || 0)} ط¯.ط¹</p>
                              </div>
                              <span className={cn("text-sm font-normal font-mono", isDarkMode ? "text-green-400" : "text-green-600")}>{(p.images && Array.isArray(p.images)) ? p.images.filter((img: any) => img && String(img).length > 0).length : 0} طµظˆط±ط©</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className={cn("text-center py-8", isDarkMode ? "text-gray-500" : "text-gray-400")}>ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ</p>
                    )}
                  </div>
                </Card>

                {/* Top Companies */}
                <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                  <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                    <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ًںڈ† ط£ط¹ظ„ظ‰ ط§ظ„ط´ط±ظƒط§طھ</h3>
                  </div>
                  <div className="p-6">
                    {Array.isArray(companies) && companies.length > 0 ? (
                      <div className="space-y-3">
                        {companies
                          .map(c => {
                            const companyProducts = products.filter(p => p.company_id === c.id);
                            const companyRevenue = companyProducts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                            return { ...c, totalRevenue: companyRevenue };
                          })
                          .sort((a, b) => b.totalRevenue - a.totalRevenue)
                          .slice(0, 5)
                          .map((c, i) => (
                            <div key={c.id} className="flex justify-between items-center pb-3 border-b last:border-b-0" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                              <div>
                                <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{i + 1}. {c.name}</p>
                                <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>ط§ظ„ط¥ظٹط±ط§ط¯ط§طھ: {Number(c.totalRevenue || 0).toLocaleString('en-US')} ط¯.ط¹</p>
                              </div>
                              <span className={cn("text-xs px-2 py-1 rounded", isDarkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700")}>ظ†ط´ط·ط©</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className={cn("text-center py-8", isDarkMode ? "text-gray-500" : "text-gray-400")}>ظ„ط§ طھظˆط¬ط¯ ط´ط±ظƒط§طھ</p>
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
                <Plus size={18} /> ط¥ط¶ط§ظپط© ط´ط±ظƒط© ط¬ط¯ظٹط¯ط©
              </button>

              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <table className="w-full">
                  <thead>
                    <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط§ط³ظ…</th>
                      <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
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
                                if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©طں')) return;
                                try {
                                  const res = await fetch(`/api/topup/companies/${company.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    alert('طھظ… ط§ظ„ط­ط°ظپ ط¨ظ†ط¬ط§ط­');
                                    const updatedRes = await fetch(`/api/topup/companies/${topupStoreId}`);
                                    const data = await updatedRes.json();
                                    setCompanies(Array.isArray(data) ? data : []);
                                  }
                                } catch (error) {
                                  console.error('Error deleting company:', error);
                                  alert('ط­ط¯ط« ط®ط·ط£');
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
                  console.log('âœ… Add Product button clicked in TOPUP merchant!');
                  // Call the TOPUP-specific handler
                  handleCreateProductTopup();
                }}
                className="px-6 py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯
              </button>

              {/* Group products by company */}
              {Object.entries(
                products.reduce((acc: any, product: any) => {
                  const companyId = product.company_id;
                  if (!acc[companyId]) {
                    acc[companyId] = {
                      company_name: product.company_name,
                      products: []
                    };
                  }
                  acc[companyId].products.push(product);
                  return acc;
                }, {})
              ).map(([companyId, group]: [string, any]) => (
                <div key={companyId} className="space-y-4">
                  {/* Company Header */}
                  <div className="flex items-center gap-3 px-2">
                    <div className={cn("w-1 h-8 rounded-full", "bg-gradient-to-b from-indigo-500 to-purple-600")}></div>
                    <h3 className={cn("text-xl font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                      {group.company_name}
                    </h3>
                    <span className={cn("ml-auto px-3 py-1 rounded-full text-sm font-medium", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700")}>
                      {group.products.length} ظ…ظ†طھط¬
                    </span>
                  </div>

                  {/* Products Grid - Modern Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.products.map((product: any) => {
                      // Parse product images - handle both object and string formats
                      let productImages: string[] = [];
                      if (product.images) {
                        if (Array.isArray(product.images)) {
                          productImages = product.images
                            .map((img: any) => {
                              // If it's an object with url property, extract the URL
                              if (typeof img === 'object' && img !== null && img.url) {
                                return img.url;
                              }
                              // If it's a string, use it directly
                              return typeof img === 'string' ? img : null;
                            })
                            .filter((img: any) => img && String(img).length > 0);
                        } else if (typeof product.images === 'string') {
                          try {
                            const parsed = JSON.parse(product.images);
                            if (Array.isArray(parsed)) {
                              productImages = parsed
                                .map((img: any) => {
                                  if (typeof img === 'object' && img !== null && img.url) {
                                    return img.url;
                                  }
                                  return typeof img === 'string' ? img : null;
                                })
                                .filter((img: any) => img && String(img).length > 0);
                            }
                          } catch (e) {
                            productImages = [];
                          }
                        }
                      }

                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border",
                            isDarkMode 
                              ? "bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-indigo-500/20" 
                              : "bg-white border-gray-200 hover:shadow-xl hover:shadow-indigo-500/20"
                          )}
                        >
                          {/* Content Section */}
                          <div className="p-4 space-y-3">
                            {/* Amount - Main Value */}
                            <div className={cn("py-2 px-3 rounded-lg text-center font-semibold text-lg", isDarkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700")}>
                              {product.company_name} - {formatNumber(product.amount)}
                            </div>

                            {/* Price Info */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className={isDarkMode ? "text-gray-400" : "text-gray-700"}>ط§ظ„ط³ط¹ط±:</span>
                                <span className={cn("font-semibold", isDarkMode ? "text-green-400" : "text-green-600")}>{formatNumber(product.price)} ط¯.ط¹</span>
                              </div>
                              {product.bulk_price && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className={isDarkMode ? "text-gray-400" : "text-gray-700"}>ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط©:</span>
                                  <span className={cn("font-semibold", isDarkMode ? "text-orange-400" : "text-orange-600")}>{formatNumber(product.bulk_price)} ط¯.ط¹</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={() => {
                                  setProductForm({ 
                                    company_id: product.company_id.toString(), 
                                    amount: product.amount.toString(), 
                                    price: product.price.toString(), 
                                    bulk_price: product.bulk_price?.toString() || '', 
                                    category_id: '', 
                                    quantity_type: product.quantity_type || 'unit' 
                                  });
                                  setProductImages([]);
                                  setExistingProductImages(productImages);
                                  setIsEditingProduct(product.id);
                                  setShowProductModal(true);
                                }}
                                className={cn("flex-1 p-2 rounded-lg transition-all flex items-center justify-center gap-1 text-sm font-medium", isDarkMode ? "bg-blue-900/40 text-blue-400 hover:bg-blue-900/60" : "bg-blue-50 text-blue-600 hover:bg-blue-100")}
                              >
                                <Edit2 size={14} /> طھط¹ط¯ظٹظ„
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedProductForCodes(product.id);
                                  setShowCodeUploadModal(true);
                                }}
                                className={cn("flex-1 p-2 rounded-lg transition-all flex items-center justify-center gap-1 text-sm font-medium", isDarkMode ? "bg-green-900/40 text-green-400 hover:bg-green-900/60" : "bg-green-50 text-green-600 hover:bg-green-100")}
                              >
                                <Upload size={14} /> ط£ظƒظˆط§ط¯ ({product.images?.filter((img: any) => img && String(img).length > 0).length || 0})
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬طں')) return;
                                  try {
                                    const res = await fetch(`/api/topup/products/${product.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      alert('طھظ… ط§ظ„ط­ط°ظپ ط¨ظ†ط¬ط§ط­');
                                      const updatedRes = await fetch(`/api/topup/products/${topupStoreId}`);
                                      const data = await updatedRes.json();
                                      setProducts(Array.isArray(data) ? data : []);
                                    }
                                  } catch (error) {
                                    console.error('Error deleting product:', error);
                                    alert('ط­ط¯ط« ط®ط·ط£');
                                  }
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-red-900/40 text-red-400 hover:bg-red-900/60" : "bg-red-50 text-red-600 hover:bg-red-100")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {products.length === 0 && (
                <div className={cn("rounded-xl border-2 border-dashed p-12 text-center", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <Package size={48} className={cn("mx-auto mb-4 opacity-50", isDarkMode ? "text-gray-600" : "text-gray-400")} />
                  <p className={cn("text-lg font-medium mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ</p>
                  <p className={cn("text-sm", isDarkMode ? "text-gray-500" : "text-gray-500")}>ط§ط¨ط¯ط£ ط¨ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯ ظ„ط¹ط±ط¶ظ‡ ظ‡ظ†ط§</p>
                </div>
              )}

              {/* Product Modal with Image Upload - MOVED INSIDE TOPUP SCOPE */}
              {showProductModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl" onClick={() => console.log('ًںژ¬ Modal visible in DOM!')}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn("rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
                  >
                    <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                      <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingProduct ? 'طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظ†طھط¬' : 'ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ ط¬ط¯ظٹط¯'}</h3>
                      <button onClick={() => setShowProductModal(false)}>
                        <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Row 1: Company & Amount */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ط§ظ„ط´ط±ظƒط©</label>
                          <select
                            value={productForm.company_id}
                            onChange={(e) => setProductForm({ ...productForm, company_id: e.target.value })}
                            className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200")}
                          >
                            <option value="">ط§ط®طھط± ط´ط±ظƒط©</option>
                            {companies && companies.length > 0 ? (
                              companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            ) : (
                              <option disabled>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ط§ظ„ظ…ط¨ظ„ط؛</label>
                          <input
                            type="number"
                            value={productForm.amount}
                            onChange={(e) => setProductForm({ ...productForm, amount: e.target.value })}
                            placeholder="ط§ظ„ظ…ط¨ظ„ط؛ (5000, 10000...)"
                            className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                          />
                        </div>
                      </div>

                      {/* Row 2: Price & Bulk Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ط§ظ„ط³ط¹ط±</label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="ط§ظ„ط³ط¹ط± (ط¨ط§ظ„ط¯ظٹظ†ط§ط±)"
                            className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                          />
                        </div>
                        <div>
                          <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط©</label>
                          <input
                            type="number"
                            value={productForm.bulk_price}
                            onChange={(e) => setProductForm({ ...productForm, bulk_price: e.target.value })}
                            placeholder="ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط© (ط§ط®طھظٹط§ط±ظٹ)"
                            className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
                          />
                        </div>
                      </div>

                      {/* Row 3: Images Upload Section */}
                      <div>
                        <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ًں–¼ï¸ڈ طµظˆط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ (ط§ط®طھظٹط§ط±ظٹ)</label>
                        <label className={cn("border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all", productImages.length > 0 ? "border-blue-500 bg-blue-50/10" : isDarkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300")}>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setProductImages(files);
                            }}
                            className="hidden"
                            accept="image/*"
                          />
                          {productImages.length > 0 ? (
                            <div>
                              <p className={cn("text-sm font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>
                                âœ“ {productImages.length} طµظˆط±ط©
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setProductImages([]);
                                }}
                                className={cn("mt-2 text-xs px-3 py-1 rounded", isDarkMode ? "bg-red-900 text-red-200 hover:bg-red-800" : "bg-red-100 text-red-600 hover:bg-red-200")}
                              >
                                ط­ط°ظپ
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className={cn("text-sm font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًں–¼ï¸ڈ ط§ط®طھط± طµظˆط±</p>
                              <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ط³ط­ط¨ ط£ظˆ ط§ظ†ظ‚ط±</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {/* Row 4: Existing Images Display */}
                      {existingProductImages.length > 0 && (
                        <div>
                          <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-white" : "text-gray-700")}>ًں“¸ ط§ظ„طµظˆط± ط§ظ„ظ…ظˆط¬ظˆط¯ط©</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {existingProductImages.map((imageUrl, index) => (
                              <div key={`existing-${index}`} className="relative group">
                                <img 
                                  src={imageUrl} 
                                  alt={`Existing ${index + 1}`}
                                  className={cn("w-full h-24 object-cover rounded-lg border", isDarkMode ? "border-gray-600" : "border-gray-300")}
                                />
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    
                                    if (!isEditingProduct) {
                                      console.warn('âڑ ï¸ڈ Cannot delete image for new product');
                                      return;
                                    }

                                    // Confirm deletion
                                    if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„طµظˆط±ط©طں')) {
                                      return;
                                    }

                                    try {
                                      console.log('ًں—‘ï¸ڈ Deleting image:', imageUrl);
                                      
                                      const deleteRes = await fetch(`/api/topup/products/${isEditingProduct}/remove-image`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          store_id: topupStoreId,
                                          image_url: imageUrl
                                        })
                                      });

                                      const deleteData = await deleteRes.json();

                                      if (deleteRes.ok) {
                                        console.log('âœ… Image deleted successfully');
                                        // Update local state
                                        setExistingProductImages(prev => prev.filter((_, i) => i !== index));
                                        // Update UI feedback
                                        alert('âœ… طھظ… ط­ط°ظپ ط§ظ„طµظˆط±ط© ط¨ظ†ط¬ط§ط­');
                                      } else {
                                        console.error('â‌Œ Delete failed:', deleteData.error);
                                        alert('â‌Œ ظپط´ظ„ ط­ط°ظپ ط§ظ„طµظˆط±ط©: ' + deleteData.error);
                                      }
                                    } catch (err) {
                                      console.error('â‌Œ Error deleting image:', err);
                                      alert('â‌Œ ط®ط·ط£ ظپظٹ ط­ط°ظپ ط§ظ„طµظˆط±ط©');
                                    }
                                  }}
                                  className={cn("absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity", isDarkMode ? "bg-red-900 text-red-200 hover:bg-red-800" : "bg-red-600 text-white hover:bg-red-700")}
                                  title="ط­ط°ظپ ط§ظ„طµظˆط±ط©"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Row 5: Submit Button */}
                      <button onClick={saveProduct} className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700">
                        {isEditingProduct ? 'طھط­ط¯ظٹط«' : 'ط¥ط¶ط§ظپط©'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {/* Card Images Section - طµظˆط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ */}
          {currentSection === 'codes' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className={cn("text-2xl font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ًں–¼ï¸ڈ طµظˆط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظ…ط±ظپظˆط¹ط©</h2>
              </div>
              
              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط´ط±ظƒط©</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ…ط¨ظ„ط؛</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط¹ط¯ط¯ ط§ظ„طµظˆط±</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„طµظˆط± ط§ظ„ظ…ط±ظپظˆط¹ط©</th>
                      </tr>
                    </thead>
                  <tbody>
                    {products.filter(p => {
                      const imagesCount = getProductImageCount(p);
                      return imagesCount > 0;
                    }).length > 0 ? (
                      products.map(product => {
                        const imagesCount = getProductImageCount(product);
                        return imagesCount > 0 && (
                          <tr key={product.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{product.company_name}</td>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{formatNumber(product.amount)} ط¯.ط¹</td>
                            <td className={cn("px-6 py-4 font-semibold", isDarkMode ? "text-green-400" : "text-green-600")}>{imagesCount}</td>
                            <td className={cn("px-6 py-4", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                              <div className="flex flex-wrap gap-2">
                                {product.images && Array.isArray(product.images) && product.images
                                  .filter((img: any) => img && String(img).length > 0)
                                  .slice(0, 5)
                                  .map((imageUrl: any, idx: number) => (
                                    <a 
                                      key={idx} 
                                      href={imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn("inline-block px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity cursor-pointer", isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-50 text-blue-700")}
                                    >
                                      ًں“· طµظˆط±ط© {idx + 1}
                                    </a>
                                  ))}
                                {product.images && Array.isArray(product.images) && product.images.filter((img: any) => img && String(img).length > 0).length > 5 && (
                                  <span className={cn("px-2 py-1 text-xs rounded", isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600")}>
                                    +{product.images.filter((img: any) => img && String(img).length > 0).length - 5} طµظˆط± ط£ط®ط±ظ‰
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className={cn("border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                        <td colSpan={4} className={cn("px-6 py-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                          ًں“¸ ط§ظ„طµظˆط± ط§ظ„ظ…ط±ظپظˆط¹ط© ط³طھط¸ظ‡ط± ظ‡ظ†ط§
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
                    setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
                    setIsEditingCustomer(null);
                    setShowCustomerModal(true);
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Plus size={18} /> ط¥ط¶ط§ظپط© ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯
                </button>
              </div>

              <Card className={cn("overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white")}>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط§ط³ظ…</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ‡ط§طھظپ</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ†ظˆط¹</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط©</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
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
                              {customer.customer_type === 'reseller' ? 'ًںڈھ ط¬ظ…ظ„ط©' : 'ًں‘¤ ظ…ظپط±ط¯'}
                            </span>
                          </td>
                          <td className={cn("px-6 py-4", isDarkMode ? "text-white" : "text-gray-900")}>{formatNumber(customer.credit_limit)} ط¯.ط¹</td>
                          <td className={cn("px-6 py-4 font-semibold", isDarkMode ? "text-purple-300" : "text-purple-700")}>{formatNumber(customer.starting_balance || 0)} ط¯.ط¹</td>
                          <td className={cn("px-6 py-4 font-semibold", customer.current_debt > customer.credit_limit ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-yellow-400" : "text-yellow-600"))}>{formatNumber(customer.current_debt)} ط¯.ط¹</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 pointer-events-auto">
                              {/* Statement button */}
                              <button 
                                onClick={async () => {
                                  setSelectedCustomerStatement(customer);
                                  setCustomerTransactions([]);
                                  setIsLoadingCustomerTransactions(true);
                                  setShowCustomerStatement(true);
                                  
                                  try {
                                    console.log('ًں”چ Fetching statement for customer ID:', customer.id);
                                    const res = await fetch(`/api/topup/customers/${customer.id}/statement`);
                                    if (res.ok) {
                                      const data = await res.json();
                                      console.log('âœ… Statement loaded for customer:', data.customer?.id, 'Transactions:', data.transactions?.length);
                                      
                                      // â­گ CRITICAL: Validate data belongs to correct customer
                                      if (data.customer?.id !== customer.id) {
                                        console.error('â‌Œ SECURITY: Data mismatch! Requested:', customer.id, 'Received:', data.customer?.id);
                                        alert('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ ط§ظ„ط¨ظٹط§ظ†ط§طھ: طھظ…طھ ط·ظ„ط¨ ط¨ظٹط§ظ†ط§طھ ط¹ظ…ظٹظ„ ظ…ط®طھظ„ظپ');
                                        return;
                                      }
                                      
                                      setCustomerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
                                    } else {
                                      const errorData = await res.json();
                                      console.error('â‌Œ API Error:', res.status, errorData);
                                      alert(`ظپط´ظ„ طھط­ظ…ظٹظ„ ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨: ${errorData.error || 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}`);
                                    }
                                  } catch (error) {
                                    console.error('Error loading statement:', error);
                                    alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨');
                                  } finally {
                                    setIsLoadingCustomerTransactions(false);
                                  }
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/60" : "text-blue-600 hover:bg-blue-50")}
                                title="ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨"
                              >
                                <FileText size={16} />
                              </button>

                              {/* Edit button */}
                              <button 
                                onClick={() => {
                                  setCustomerForm({ name: customer.name, phone: customer.phone, password: customer.password || '', starting_balance: Math.floor(customer.starting_balance || 0).toString(), credit_limit: Math.floor(customer.credit_limit || 0).toString(), notes: customer.notes || '', customer_type: customer.customer_type || 'cash' });
                                  setIsEditingCustomer(customer.id);
                                  setShowCustomerModal(true);
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-amber-900/30 text-amber-400 hover:bg-amber-900/60" : "text-amber-600 hover:bg-amber-50")}
                                title="طھط¹ط¯ظٹظ„"
                              >
                                <Edit size={16} />
                              </button>

                              {/* Delete button */}
                              <button 
                                onClick={async () => {
                                  if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„طں')) return;
                                  try {
                                    const res = await fetch(`/api/topup/customers/${customer.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      alert('طھظ… ط§ظ„ط­ط°ظپ ط¨ظ†ط¬ط§ط­');
                                      const updatedRes = await fetch(`/api/topup/customers/${topupStoreId}`);
                                      const data = await updatedRes.json();
                                      setCustomers(Array.isArray(data) ? data : []);
                                    }
                                  } catch (error) {
                                    console.error('Error deleting customer:', error);
                                    alert('ط­ط¯ط« ط®ط·ط£');
                                  }
                                }}
                                className={cn("p-2 rounded-lg transition-all", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/60" : "text-red-600 hover:bg-red-50")}
                                title="ط­ط°ظپ"
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
                          ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظ„ط§ط، ظ…ط³ط¬ظ„ظٹظ† ط­ط§ظ„ظٹط§ظ‹
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
                  ط·ظ„ط¨ط§طھ ط§ظ„ط¨ظٹط¹
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                  <table className="w-full">
                    <thead>
                      <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¹ظ…ظٹظ„</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ…ظ†طھط¬</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ظ…ط¨ظ„ط؛</th>
                        <th className={cn("px-6 py-3 text-right text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط­ط§ظ„ط©</th>
                        <th className={cn("px-6 py-3 text-center text-sm font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
                      </tr>
                    </thead>
                  <tbody>
                    {orders && orders.length > 0 ? (
                      orders.map((order: any) => (
                        <tr key={order.id} className={cn("border-t hover:bg-opacity-50", isDarkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50")}>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>#{order.id}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.phone || 'ط؛ظٹط± ظ…ط­ط¯ط¯'}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.company_name && order.product_amount ? `${order.company_name} - ${order.product_amount}` : order.company_name || 'ظ…ظ†طھط¬'}</td>
                          <td className={cn("px-6 py-4 text-right text-sm", isDarkMode ? "text-white" : "text-gray-900")}>{order.total_amount} ط¯.ط¹</td>
                          <td className={cn("px-6 py-4 text-right text-sm font-medium", isDarkMode ? order.status === 'completed' ? "text-green-400" : order.status === 'pending' ? "text-yellow-400" : "text-red-400" : order.status === 'completed' ? "text-green-600" : order.status === 'pending' ? "text-yellow-600" : "text-red-600")}>
                            {order.status === 'completed' ? 'âœ“ ظ…ظƒطھظ…ظ„' : order.status === 'pending' ? 'âڈ³ ظ…ط¹ظ„ظ‚' : order.status === 'returned' ? 'â†©ï¸ڈ ظ…ط³طھط±ط¬ط¹' : 'ظ…ظ„ط؛ظٹ'}
                          </td>
                          <td className={cn("px-6 py-4 text-center")}>
                            <div className="flex items-center justify-center gap-2">
                              {(order.status === 'completed' || order.status === 'returned') && (
                                <button
                                  onClick={async () => {
                                    const orderType = order.status === 'returned' ? 'ط§ظ„ظ…ط³طھط±ط¬ط¹' : 'ط§ظ„ظ…ظƒطھظ…ظ„';
                                    if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط·ظ„ط¨ ${orderType} #${order.id}طں`)) return;
                                    try {
                                      const res = await fetch(`/api/topup/orders/${order.id}`, { 
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      if (res.ok) {
                                        alert('âœ“ طھظ… ط­ط°ظپ ط§ظ„ط·ظ„ط¨ ط¨ظ†ط¬ط§ط­');
                                        refreshDashboardData();
                                      } else {
                                        const data = await res.json();
                                        alert(`â‌Œ ${data.error || 'ظپط´ظ„ ط§ظ„ط­ط°ظپ'}`);
                                      }
                                    } catch (error) {
                                      console.error('Error deleting order:', error);
                                      alert('â‌Œ ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط­ط°ظپ');
                                    }
                                  }}
                                  className={cn("inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200", isDarkMode ? "bg-red-900/40 text-red-300 hover:bg-red-900/70 hover:text-red-200" : "bg-red-100 text-red-600 hover:bg-red-200")}
                                  title="ط­ط°ظپ ط§ظ„ط·ظ„ط¨"
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
                          ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط­ط§ظ„ظٹط§ظ‹
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
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>âڑ™ï¸ڈ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط±</h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Store Name */}
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًںڈھ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±</label>
                    <input
                      type="text"
                      value={storeSettings.store_name}
                      onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                      placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…طھط¬ط±"
                      className={cn("w-full px-4 py-3 rounded-lg border font-normal", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400")}
                    />
                  </div>

                  {/* Store Logo */}
                  <div>
                    <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًں–¼ï¸ڈ ط´ط¹ط§ط± ط§ظ„ظ…طھط¬ط±</label>
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
                          console.log('ًں“پ File dropped for upload:', {
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
                            console.log('ًں“پ File selected for upload:', {
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
                        {logoUploadLoading ? 'âڈ³ ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط´ط¹ط§ط±...' : 'ًں“¤ ط§ط®طھط± ط§ظ„طµظˆط±ط© ط£ظˆ ط§ط³ط­ط¨ظ‡ط§ ظ‡ظ†ط§'}
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
                            console.log('âœ“ Preview image loaded successfully');
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
                    ًں’¾ ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ
                  </button>
                </div>
              </Card>

              {/* Statistics Card */}
              <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ًں“ٹ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“ٹ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-indigo-400" : "text-indigo-600")}>{stats.totalOrders}</p>
                    </div>
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں’° ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¥ظٹط±ط§ط¯ط§طھ</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-green-400" : "text-green-600")}>{formatNumber(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : parseFloat(String(stats.totalRevenue) || '0'))} ط¯.ط¹</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>ًں“¦ ط§ظ„ط£ظƒظˆط§ط¯ ط§ظ„ظ…طھط§ط­ط©</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>{stats.activeCodes}</p>
                    </div>
                    <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700" : "bg-gray-50")}>
                      <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>âœ… ط§ظ„ظ…ط³طھط®ط¯ظ…ط©</p>
                      <p className={cn("text-2xl font-normal", isDarkMode ? "text-purple-400" : "text-purple-600")}>{stats.totalCodes - stats.activeCodes}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Store Info Card */}
              <Card className={cn("border-none", isDarkMode ? "bg-gray-800" : "bg-white")}>
                <div className={cn("p-6 border-b", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                  <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>â„¹ï¸ڈ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…طھط¬ط±</h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>ظ…ط¹ط±ظ‘ظپ ط§ظ„ظ…طھط¬ط±:</span>
                    <span className={cn("font-mono font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{topupStoreId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط¹ط¯ط¯ ط§ظ„ط´ط±ظƒط§طھ:</span>
                    <span className={cn("font-normal", isDarkMode ? "text-gray-300" : "text-gray-900")}>{companies.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className={cn("text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط¹ط¯ط¯ ط§ظ„ظ…ظ†طھط¬ط§طھ:</span>
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
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingCompany ? 'طھط¹ط¯ظٹظ„ ط§ظ„ط´ط±ظƒط©' : 'ط¥ط¶ط§ظپط© ط´ط±ظƒط© ط¬ط¯ظٹط¯ط©'}</h3>
              <button onClick={() => setShowCompanyModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="ط§ط³ظ… ط§ظ„ط´ط±ظƒط© (ظ…ط«ط§ظ„: Zain, Asiacell)"
                className={cn("w-full px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900")}
              />
              <button onClick={saveCompany} className="w-full py-3 bg-indigo-600 text-white font-normal rounded-lg hover:bg-indigo-700">
                {isEditingCompany ? 'طھط­ط¯ظٹط«' : 'ط¥ط¶ط§ظپط©'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Images Upload Modal */}
      {showCodeUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-md shadow-2xl", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ًں–¼ï¸ڈ ط±ظپط¹ طµظˆط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ</h3>
              <button onClick={() => setShowCodeUploadModal(false)}>
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className={cn("text-sm", isDarkMode ? "text-white" : "text-gray-600")}>
                ط±ظپط¹ طµظˆط± ط¨ط·ط§ظ‚ط§طھ ط§ظ„ط´ط­ظ† (ط§ظ„ظƒظˆط¯ ظˆط§ظ„ط³ظٹط±ظٹط§ظ„ ظ…ط·ط¨ظˆط¹ ط¹ظ„ظ‰ ط§ظ„طµظˆط±ط©)
              </p>
              <label className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all", uploadedFiles.length > 0 ? "border-green-500 bg-green-50/10" : isDarkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300")}>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles: File[] = [];
                    let hasError = false;

                    for (const file of files) {
                      // âœ… REMOVED 500KB limit - support large files with multipart/form-data!
                      // Check MIME type only
                      if (!file.type.startsWith('image/')) {
                        alert(`ط§ظ„ظ…ظ„ظپ "${file.name}" ظ„ظٹط³ طµظˆط±ط©. ط§ظ„ط±ط¬ط§ط، ط§ط®طھظٹط§ط± ظ…ظ„ظپط§طھ طµظˆط± ظپظ‚ط·.`);
                        hasError = true;
                      } else {
                        console.log(`ًں“پ Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
                        validFiles.push(file);
                      }
                    }

                    if (!hasError) {
                      setUploadedFiles(validFiles);
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />
                {uploadedFiles.length > 0 ? (
                  <div className={cn("font-normal space-y-2", isDarkMode ? "text-green-400" : "text-green-600")}>
                    <div className="font-semibold">âœ“ طھظ… ط§ط®طھظٹط§ط± {uploadedFiles.length} طµظˆط±ط©</div>
                    <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/10 p-2 rounded">
                          <span>{file.name}</span>
                          <span className="opacity-70">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={cn("font-normal", isDarkMode ? "text-white" : "text-gray-900")}>ط§ط®طھط± طµظˆط± ط£ظˆ ط§ط³ط­ط¨ظ‡ط§ ظ‡ظ†ط§</p>
                    <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ظٹظ…ظƒظ†ظƒ ط§ط®طھظٹط§ط± ط¹ط¯ط© طµظˆط± ط¨ط¯ظˆظ† ط­ط¯ ظ„ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ</p>
                  </div>
                )}
              </label>
              <button 
                onClick={handleUploadCodes} 
                disabled={isUploadingImage || uploadedFiles.length === 0}
                className={cn("w-full py-3 text-white font-normal rounded-lg transition-all", isUploadingImage ? "bg-green-500 cursor-not-allowed opacity-70" : "bg-green-600 hover:bg-green-700")}
              >
                {isUploadingImage ? 'âڈ³ ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...' : `ط±ظپط¹ ${uploadedFiles.length} طµظˆط±ط©`}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Modal */}
      {/* Customer Modal - Clean Single Version */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            {/* Header */}
            <div className={cn("sticky top-0 p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gradient-to-r from-indigo-50 to-blue-50 border-gray-200")}>
              <div>
                <h3 className={cn("font-bold text-xl", isDarkMode ? "text-white" : "text-gray-900")}>
                  {isEditingCustomer ? 'âœڈï¸ڈ طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„' : 'â‍• ط¥ط¶ط§ظپط© ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯'}
                </h3>
                <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط£ظƒظ…ظ„ ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©</p>
              </div>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className={cn("p-2 rounded-full hover:bg-black/10 transition", isDarkMode ? "hover:bg-gray-600" : "")}
              >
                <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں“‌ ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ط¹ظ…ظٹظ„ ظƒط§ظ…ظ„ط§ظ‹"
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                  />
                </div>
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں“± ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="07800000000"
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                  />
                </div>
              </div>

              {/* Row 2: Password & Credit Limit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں”گ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={customerForm.password}
                    onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                    placeholder="ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                  />
                </div>
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں’³ ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ† (ط¯.ط¹) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={Math.floor(parseFloat(customerForm.credit_limit) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={(e) => {
                      const num = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(num)) {
                        setCustomerForm({ ...customerForm, credit_limit: num });
                      }
                    }}
                    placeholder="0"
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                  />
                </div>
              </div>

              {/* Row 3: Starting Balance & Customer Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں’° ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط© (ط¯.ط¹) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={Math.floor(parseFloat(customerForm.starting_balance) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={(e) => {
                      const num = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(num)) {
                        setCustomerForm({ ...customerForm, starting_balance: num });
                      }
                    }}
                    placeholder="0"
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                  />
                </div>
                <div>
                  <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًںڈ·ï¸ڈ ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„ <span className="text-red-500">*</span></label>
                  <select
                    value={customerForm.customer_type}
                    onChange={(e) => setCustomerForm({ ...customerForm, customer_type: e.target.value })}
                    className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 focus:border-indigo-500")}
                  >
                    <option value="cash">ًں‘¤ ظ…ظپط±ط¯ (ط¹ظ…ظٹظ„ ظپط±ط¯ظٹ)</option>
                    <option value="reseller">ًںڈھ ط¬ظ…ظ„ط© (ظ†ظ‚ط·ط© ط¨ظٹط¹)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Notes */}
              <div>
                <label className={cn("block text-sm font-bold mb-2", isDarkMode ? "text-white" : "text-gray-900")}>ًں“Œ ظ…ظ„ط§ط­ط¸ط§طھ ط¥ط¶ط§ظپظٹط© (ط§ط®طھظٹط§ط±ظٹ)</label>
                <textarea
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  placeholder="ط£ط¶ظپ ط£ظٹ ظ…ظ„ط§ط­ط¸ط§طھ ط®ط§طµط© ط¨ظ‡ط°ط§ ط§ظ„ط¹ظ…ظٹظ„..."
                  rows={3}
                  className={cn("w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none", isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className={cn("sticky bottom-0 p-4 border-t flex gap-3 justify-end", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <button
                onClick={() => setShowCustomerModal(false)}
                className={cn("px-6 py-2.5 rounded-lg font-bold transition-all text-sm", isDarkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-300 text-gray-900 hover:bg-gray-400")}
              >
                âœ• ط¥ظ„ط؛ط§ط،
              </button>
              <button
                onClick={saveCustomer}
                className={cn("px-6 py-2.5 rounded-lg font-bold transition-all text-sm text-white shadow-lg hover:shadow-xl active:scale-95", isEditingCustomer ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}
              >
                {isEditingCustomer ? 'ًں’¾ طھط­ط¯ظٹط«' : 'â‍• ط¥ط¶ط§ظپط© ط¹ظ…ظٹظ„'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Customer Statement Modal */}
      {showCustomerStatement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto", isDarkMode ? "bg-gray-800" : "bg-white")}
          >
            <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
              <h3 className={cn("font-normal text-lg", isDarkMode ? "text-white" : "text-gray-900")}>ظƒط´ظپ ط­ط³ط§ط¨ - {selectedCustomerStatement?.name}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm flex items-center gap-2", isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700")}
                >
                  <Plus size={16} /> طھط³ط¯ظٹط¯
                </button>
                <button onClick={() => {
                  setShowCustomerStatement(false);
                  setShowPaymentForm(false);
                  setPaymentForm({ amount: '' });
                  setCustomerTransactions([]);
                  setSelectedCustomerStatement(null);
                }}>
                  <X size={24} className={isDarkMode ? "text-white" : "text-gray-900"} />
                </button>
              </div>
            </div>

            {/* Credit Summary Cards */}
            {(() => {
              // Calculate current debt from the last transaction (excluding opening balance)
              const currentDebt = (() => {
                if (!customerTransactions || customerTransactions.length === 0) {
                  return selectedCustomerStatement?.current_debt || 0;
                }
                // Find the last non-opening balance row (opening balance has source='opening')
                const lastNonOpening = customerTransactions.find(tx => tx.source !== 'opening');
                if (lastNonOpening && lastNonOpening.balance !== undefined) {
                  return lastNonOpening.balance;
                }
                return selectedCustomerStatement?.current_debt || 0;
              })();
              
              const creditLimit = selectedCustomerStatement?.credit_limit || 0;
              const availableBalance = Math.max(0, creditLimit - currentDebt);

              return (
                <div className={cn("p-4 sm:p-6 border-b grid grid-cols-3 gap-2 sm:gap-4", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                  {/* Credit Limit */}
                  <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-blue-900/30 border border-blue-700/50" : "bg-blue-50 border border-blue-200")}>
                    <p className={cn("text-[10px] sm:text-xs font-normal mb-1 sm:mb-2", isDarkMode ? "text-blue-300" : "text-blue-600")}>ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†</p>
                    <p className={cn("text-[clamp(0.95rem,4vw,1.5rem)] font-semibold leading-tight break-words", isDarkMode ? "text-blue-300" : "text-blue-700")}>
                      {formatNumber(creditLimit)}
                      <span className="block text-[0.9em]">ط¯.ط¹</span>
                    </p>
                  </div>
                  
                  {/* Current Debt */}
                  <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-red-900/30 border border-red-700/50" : "bg-red-50 border border-red-200")}>
                    <p className={cn("text-[10px] sm:text-xs font-normal mb-1 sm:mb-2", isDarkMode ? "text-red-300" : "text-red-600")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</p>
                    <p className={cn("text-[clamp(0.95rem,4vw,1.5rem)] font-semibold leading-tight break-words", isDarkMode ? "text-red-300" : "text-red-700")}>
                      {formatNumber(currentDebt)}
                      <span className="block text-[0.9em]">ط¯.ط¹</span>
                    </p>
                  </div>

                  {/* Available Balance */}
                  <div className={cn("min-w-0 p-2 sm:p-4 rounded-lg", isDarkMode ? "bg-green-900/30 border border-green-700/50" : "bg-green-50 border border-green-200")}>
                    <p className={cn("text-[10px] sm:text-xs font-normal mb-1 sm:mb-2", isDarkMode ? "text-green-300" : "text-green-600")}>ط§ظ„ط±طµظٹط¯ ط§ظ„ط­ط§ظ„ظٹ</p>
                    <p className={cn("text-[clamp(0.95rem,4vw,1.5rem)] font-semibold leading-tight break-words", isDarkMode ? "text-green-300" : "text-green-700")}>
                      {formatNumber(availableBalance)}
                      <span className="block text-[0.9em]">ط¯.ط¹</span>
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Payment Form */}
            {showPaymentForm && (
              <div className={cn("p-6 border-b", isDarkMode ? "bg-green-900/20 border-green-600/50" : "bg-green-50 border-green-200")}>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="ط£ط¯ط®ظ„ ط§ظ„ظ…ط¨ظ„ط؛..."
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      max={selectedCustomerStatement?.current_debt || 0}
                      className={cn("flex-1 px-4 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300")}
                    />
                    <button
                      onClick={async () => {
                        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
                          alert('ط£ط¯ط®ظ„ ظ…ط¨ظ„ط؛ طµط­ظٹط­');
                          return;
                        }
                        try {
                          const res = await fetch(`/api/topup/payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              customer_id: selectedCustomerStatement.id,
                              store_id: topupStoreId,
                              amount: parseFloat(paymentForm.amount)
                            })
                          });
                          if (res.ok) {
                            const paymentData = await res.json();
                            alert('âœ“ طھظ… ط§ظ„طھط³ط¯ظٹط¯ ط¨ظ†ط¬ط§ط­');
                            setPaymentForm({ amount: '' });
                            setShowPaymentForm(false);
                            
                            // Update customer data immediately from response
                            if (paymentData.customer) {
                              console.log('ًں’³ Payment response received:', {
                                starting_balance: paymentData.customer.starting_balance,
                                current_debt: paymentData.customer.current_debt,
                                credit_limit: paymentData.customer.credit_limit
                              });
                              setSelectedCustomerStatement({
                                ...selectedCustomerStatement,
                                starting_balance: paymentData.customer.starting_balance,
                                current_debt: paymentData.customer.current_debt,
                                credit_limit: paymentData.customer.credit_limit ?? selectedCustomerStatement.credit_limit
                              });
                            }
                            
                            // Reload statement after short delay to ensure DB is updated
                            setTimeout(async () => {
                              setIsLoadingCustomerTransactions(true);
                              console.log('ًں”„ Reloading statement for customer:', selectedCustomerStatement.id);
                              const statementRes = await fetch(`/api/topup/customers/${selectedCustomerStatement.id}/statement`);
                              console.log('ًں“، Statement response status:', statementRes.status);
                              if (statementRes.ok) {
                                const data = await statementRes.json();
                                console.log('âœ… Statement data received:', data);
                                console.log('âœ… Transactions array:', data.transactions);
                                console.log('âœ… Transactions count:', data.transactions?.length || 0);
                                if (data.transactions && Array.isArray(data.transactions)) {
                                  console.log('âœ… Setting transactions:', data.transactions.length, 'items');
                                  setCustomerTransactions(data.transactions);
                                } else {
                                  console.error('â‌Œ Transactions is not an array:', typeof data.transactions);
                                  setCustomerTransactions([]);
                                }
                                setSelectedCustomerStatement(data.customer);
                              } else {
                                console.error('â‌Œ Statement fetch failed:', statementRes.status);
                              }
                              setIsLoadingCustomerTransactions(false);
                            }, 300);
                          } else {
                            const errorData = await res.json();
                            console.error('â‌Œ Payment failed:', res.status, errorData);
                            alert(`â‌Œ ظپط´ظ„ ط§ظ„طھط³ط¯ظٹط¯: ${errorData.error || 'ط®ط·ط£ ط؛ظٹط± ظ…ط¹ط±ظˆظپ'}`);
                          }
                        } catch (error) {
                          console.error('Payment error:', error);
                          alert(`â‌Œ ط­ط¯ط« ط®ط·ط£: ${(error as any).message}`);
                        }
                      }}
                      className={cn("px-6 py-2 rounded-lg text-white font-normal text-sm", isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700")}
                    >
                      طھط£ظƒظٹط¯
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              {isLoadingCustomerTransactions ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: primaryColor}}></div>
                  <p className={cn("mt-3", isDarkMode ? "text-gray-300" : "text-gray-600")}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ...</p>
                </div>
              ) : !customerTransactions || customerTransactions.length === 0 ? (
                <div className={cn("text-center py-8", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  <p className="text-sm">ظ„ط§ طھظˆط¬ط¯ ظ…ط¹ط§ظ…ظ„ط§طھ</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className={cn("sticky top-0", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                        <th className={cn("px-4 py-3 text-right font-normal border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„طھط§ط±ظٹط®</th>
                        <th className={cn("px-4 py-3 text-right font-normal border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„ط¨ظٹط§ظ†</th>
                        <th className={cn("px-4 py-3 text-center font-normal border", isDarkMode ? "text-red-400 border-gray-600" : "text-red-600 border-gray-300")}>ظ…ط¯ظٹظ†</th>
                        <th className={cn("px-4 py-3 text-center font-normal border", isDarkMode ? "text-green-400 border-gray-600" : "text-green-600 border-gray-300")}>ط¯ط§ط¦ظ†</th>
                        <th className={cn("px-4 py-3 text-center font-normal border", isDarkMode ? "text-blue-400 border-gray-600" : "text-blue-600 border-gray-300")}>ط§ظ„ط±طµظٹط¯</th>
                        <th className={cn("px-4 py-3 text-center font-normal border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerTransactions.map((tx, idx) => {
                        const isPayment = tx.is_payment === true;
                        const debit = isPayment ? 0 : Math.abs(tx.amount || 0);
                        const credit = isPayment ? Math.abs(tx.amount || 0) : 0;
                        console.log(`ًں“ٹ Statement Row ${idx}:`, { 
                          description: tx.description, 
                          description_bytes: Array.from(tx.description || '').map(c => c.charCodeAt(0)),
                          type: tx.type, 
                          is_payment: tx.is_payment, 
                          debit, 
                          credit,
                          source: tx.source
                        });
                        return (
                          <tr key={idx} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50")}>
                            <td className={cn("px-4 py-3 border text-right", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                              {tx.created_at ? new Date(tx.created_at).toLocaleDateString('ar-IQ') : 'â€”'}
                            </td>
                            <td className={cn("px-4 py-3 border text-right", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                              {tx.description || 'ظ…ط¹ط§ظ…ظ„ط©'}
                            </td>
                            <td className={cn("px-4 py-3 border text-center font-semibold", isDarkMode ? "text-red-400 border-gray-700" : "text-red-600 border-gray-200")}>
                              {debit > 0 ? formatNumber(debit) : 'â€”'}
                            </td>
                            <td className={cn("px-4 py-3 border text-center font-semibold", isDarkMode ? "text-green-400 border-gray-700" : "text-green-600 border-gray-200")}>
                              {credit > 0 ? formatNumber(credit) : 'â€”'}
                            </td>
                            <td className={cn("px-4 py-3 border text-center font-semibold", isDarkMode ? "text-blue-400 border-gray-700" : "text-blue-600 border-gray-200")}>
                              {(tx.balance || 0).toLocaleString('en-US')}
                            </td>
                            <td className={cn("px-4 py-3 border text-center", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                              <div className="flex gap-2 justify-center">
                                {isPayment && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const newAmountStr = prompt(`ط£ط¯ط®ظ„ ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ط¬ط¯ظٹط¯ ظ„ظ„طھط³ط¯ظٹط¯ (ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ط­ط§ظ„ظٹ: ${tx.amount}):`);
                                          if (!newAmountStr) return;
                                          
                                          const newAmount = parseFloat(newAmountStr);
                                          if (isNaN(newAmount) || newAmount <= 0) {
                                            alert('â‌Œ ط§ظ„ط±ط¬ط§ط، ط¥ط¯ط®ط§ظ„ ظ…ط¨ظ„ط؛ طµط­ظٹط­');
                                            return;
                                          }
                                          
                                          const res = await fetch(`/api/topup/payment/${tx.id}`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ newAmount })
                                          });
                                          
                                          if (res.ok) {
                                            alert('âœ“ طھظ… ط§ظ„طھط­ط¯ظٹط« ط¨ظ†ط¬ط§ط­');
                                            // Reload statement
                                            setIsLoadingCustomerTransactions(true);
                                            const statementRes = await fetch(`/api/topup/customers/${selectedCustomerStatement.id}/statement`);
                                            if (statementRes.ok) {
                                              const data = await statementRes.json();
                                              setCustomerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
                                              setSelectedCustomerStatement(data.customer);
                                            }
                                            setIsLoadingCustomerTransactions(false);
                                          } else {
                                            const error = await res.json();
                                            alert(`â‌Œ ${error.error}`);
                                          }
                                        } catch (error) {
                                          console.error('Edit error:', error);
                                          alert('â‌Œ ط­ط¯ط« ط®ط·ط£');
                                        }
                                      }}
                                      className={cn("p-1.5 rounded transition-all", isDarkMode ? "text-amber-400 hover:bg-amber-900/30" : "text-amber-600 hover:bg-amber-50")}
                                      title="طھط­ط¯ظٹط«"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm('ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ط§ ط§ظ„طھط³ط¯ظٹط¯طں')) return;
                                        try {
                                          const res = await fetch(`/api/topup/payment/${tx.id}`, { method: 'DELETE' });
                                          if (res.ok) {
                                            alert('âœ“ طھظ… ط§ظ„ط­ط°ظپ ط¨ظ†ط¬ط§ط­');
                                            // Reload statement
                                            setIsLoadingCustomerTransactions(true);
                                            const statementRes = await fetch(`/api/topup/customers/${selectedCustomerStatement.id}/statement`, {
                                              headers: {
                                                'Cache-Control': 'no-store, no-cache, must-revalidate',
                                                'Pragma': 'no-cache',
                                                'Expires': '0'
                                              }
                                            });
                                            if (statementRes.ok) {
                                              const data = await statementRes.json();
                                              setCustomerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
                                              setSelectedCustomerStatement(data.customer);
                                            }
                                            setIsLoadingCustomerTransactions(false);
                                          } else {
                                            alert('ظپط´ظ„ ط§ظ„ط­ط°ظپ');
                                          }
                                        } catch (error) {
                                          console.error('Delete error:', error);
                                          alert('ط­ط¯ط« ط®ط·ط£');
                                        }
                                      }}
                                      className={cn("p-1.5 rounded transition-all", isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50")}
                                      title="ط­ط°ظپ"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                    <h2 className={cn("font-normal text-sm", isDarkMode ? "text-gray-100" : "text-gray-900")}>ط§ظ„ط¥ط¯ط§ط±ط©</h2>
                    <p className={cn("text-xs", isDarkMode ? "text-gray-500" : "text-gray-500")}>ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ</p>
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
                  { id: 'overview', label: 'ظ…ظ„ط®طµ ط§ظ„ظ…ط¨ظٹط¹ط§طھ', icon: BarChart3, badge: null },
                  { id: 'companies', label: 'ط§ظ„ط´ط±ظƒط§طھ', icon: StoreIcon, badge: companies.length },
                  { id: 'products', label: 'ط§ظ„ظ…ظ†طھط¬ط§طھ', icon: CreditCard, badge: products.length },
                  { id: 'codes', label: 'ط§ظ„ط£ظƒظˆط§ط¯', icon: Ticket, badge: products.reduce((sum: number, p: any) => {
                    // Count uploaded images from each product
                    const count = getProductImageCount(p);
                    return sum + count;
                  }, 0) },
                  { id: 'customers', label: 'ط§ظ„ط¹ظ…ظ„ط§ط،', icon: Users, badge: customers.length },
                  { id: 'orders', label: 'ط§ظ„ط·ظ„ط¨ط§طھ', icon: ShoppingCart, badge: orders.filter((o: any) => o.status !== 'returned').length },
                  { id: 'settings', label: 'ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ', icon: Settings, badge: null },
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
                    {item.badge !== null && (item.badge > 0 || item.id === 'codes') && (
                      <span className={cn("text-sm font-bold px-3 py-1.5 rounded-full min-w-max", 
                        item.id === 'codes' 
                          ? currentSection === item.id ? "bg-yellow-400/30 text-yellow-200" : isDarkMode ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                          : item.id === 'products'
                          ? currentSection === item.id ? "bg-blue-400/30 text-blue-200" : isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-800"
                          : item.id === 'orders'
                          ? currentSection === item.id ? "bg-red-400/30 text-red-200" : isDarkMode ? "bg-red-900/40 text-red-300" : "bg-red-100 text-red-800"
                          : item.id === 'companies'
                          ? currentSection === item.id ? "bg-green-400/30 text-green-200" : isDarkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800"
                          : item.id === 'customers'
                          ? currentSection === item.id ? "bg-purple-400/30 text-purple-200" : isDarkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-800"
                          : currentSection === item.id ? "bg-white/20" : isDarkMode ? "bg-gray-700 text-indigo-400" : "bg-indigo-100 text-indigo-700"
                      )}>
                        {item.badge === 0 && item.id === 'codes' ? '0ï¸ڈâƒ£' : item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className={cn("mt-8 pt-8 border-t", isDarkMode ? "border-gray-800" : "border-gray-200")}>
                <div className={cn("p-4 rounded-lg mb-4", isDarkMode ? "bg-gray-800" : "bg-gray-100")}>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط£ظ†طھ ظ…ط³ط¬ظ„ ط¨طµظپط©</p>
                  <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-100" : "text-gray-900")}>{user?.name || 'طھط§ط¬ط±'}</p>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileDrawer(false);
                  }}
                  className={cn("w-full px-4 py-3 rounded-lg font-normal flex items-center justify-center gap-2 transition-all", isDarkMode ? "bg-red-900/20 text-red-400 hover:bg-red-900/40" : "bg-red-50 text-red-600 hover:bg-red-100")}
                >
                  <LogOut size={16} /> طھط³ط¬ظٹظ„ ط®ط±ظˆط¬
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
  const { slug: rawStoreId } = useParams();
  const [topupStoreId, setTopupStoreId] = useState<string | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  useEffect(() => {
    const determineStoreId = async () => {
      setIsLoadingStore(true);
      let storeId = rawStoreId;
      const storeNum = parseInt(rawStoreId || '0');

      console.log(`ًں”چ Determining store ID from rawStoreId: "${rawStoreId}" (parsed: ${storeNum})`);

      // If it's a numeric ID that equals 21 or 1, find the first available topup store
      if (!isNaN(storeNum) && (storeNum === 21 || storeNum === 1)) {
        try {
          console.log('ًں”چ Finding available topup store...');
          const res = await fetch('/api/stores?page=1&pageSize=100');
          const stores = await res.json();
          const topupStore = Array.isArray(stores) ? stores.find((s: any) => s.store_type === 'topup') : null;
          if (topupStore) {
            storeId = String(topupStore.id);
            console.log(`âœ… Using available topup store: ${storeId}`);
          } else if (Array.isArray(stores) && stores.length > 0) {
            storeId = String(stores[0].id);
            console.log(`âڑ ï¸ڈ No topup store found, using first available store: ${storeId}`);
          } else {
            storeId = '1';
            console.log(`âڑ ï¸ڈ No stores found, defaulting to store 1`);
          }
        } catch (err) {
          console.error('Error fetching stores:', err);
          storeId = '1';
        }
      } else if (isNaN(storeNum)) {
        // It's a text slug, search for store by name
        try {
          console.log(`ًں”چ Looking up store by slug/name: "${rawStoreId}"`);
          const res = await fetch('/api/stores?page=1&pageSize=100');
          const stores = await res.json();
          
          // Try to find by store_name or slug
          const foundStore = Array.isArray(stores) ? stores.find((s: any) => 
            s.store_name === rawStoreId || 
            s.slug === rawStoreId || 
            s.name === rawStoreId ||
            (s.store_name && s.store_name.toLowerCase().includes(rawStoreId.toLowerCase()))
          ) : null;
          
          if (foundStore) {
            storeId = String(foundStore.id);
            console.log(`âœ… Found store by name: ${storeId}`);
          } else {
            // If no exact match, just use the first topup store
            const topupStore = Array.isArray(stores) ? stores.find((s: any) => s.store_type === 'topup') : null;
            if (topupStore) {
              storeId = String(topupStore.id);
              console.log(`âڑ ï¸ڈ No exact match, using first topup store: ${storeId}`);
            } else {
              storeId = '1';
              console.log(`âڑ ï¸ڈ No topup store found, defaulting to store 1`);
            }
          }
        } catch (err) {
          console.error('Error fetching stores by name:', err);
          storeId = '1';
        }
      }

      console.log(`âœ… Final storeId resolved to: ${storeId}`);
      setTopupStoreId(storeId);
      setIsLoadingStore(false);
    };

    determineStoreId();
  }, [rawStoreId]);
  
  const storeId = topupStoreId || rawStoreId || '1';
  
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { primaryColor } = useSettingsStore();
  const { addItem, items: cartItems } = useTopupCartStore();
  const navigate = useNavigate();
  
  // Force cache bust on component mount
  useEffect(() => {
    const timestamp = Date.now();
    const cacheKey = `topupStorefront_build_${timestamp}`;
    const lastBuild = sessionStorage.getItem('topupStorefront_lastBuild');
    
    if (!lastBuild || (timestamp - parseInt(lastBuild)) > 60000) {
      // More than 1 minute old, reload
      sessionStorage.setItem('topupStorefront_lastBuild', timestamp.toString());
      console.log('ًں”„ Cache-busting reload for TopupStorefront');
      // window.location.reload();
    }
  }, []);
  
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
  const [refreshProductsKey, setRefreshProductsKey] = useState(0);  // Trigger for refreshing products

  // Auth state
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [showAccountStatement, setShowAccountStatement] = useState(false);
  const [statementTransactions, setStatementTransactions] = useState<any[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);
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

  // Customer statement modal states (for merchant operations)
  const [showCustomerStatement, setShowCustomerStatement] = useState(false);
  const [selectedCustomerStatement, setSelectedCustomerStatement] = useState<any>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [isLoadingCustomerTransactions, setIsLoadingCustomerTransactions] = useState(false);

  // Load customer data from localStorage on component mount - HIGH PRIORITY
  useEffect(() => {
    console.log('ًں”چ TopupStorefront: Loading customer from localStorage on mount');
    const loadCustomerFromLocalStorage = () => {
      const topupData = localStorage.getItem('topupCustomer');
      console.log('ًں“¦ topupCustomer in localStorage:', !!topupData);
      if (topupData) {
        try {
          const customerData = JSON.parse(topupData);
          console.log('âœ… TopupStorefront: Loaded customer from localStorage:', customerData);
          setCustomer(customerData);
          setPurchaseForm({
            name: customerData.name || '',
            phone: customerData.phone || '',
            customer_type: customerData.customer_type || 'cash'
          });
        } catch (err) {
          console.error('âڑ ï¸ڈ TopupStorefront: Error parsing topupCustomer:', err);
        }
      } else {
        console.log('â‌Œ No topupCustomer in localStorage');
        // Fallback to customerData
        const fallbackData = localStorage.getItem('customerData');
        if (fallbackData) {
          try {
            const data = JSON.parse(fallbackData);
            console.log('âœ… TopupStorefront: Fallback to customerData:', data);
            setPurchaseForm({
              name: data.name || '',
              phone: data.phone || '',
              customer_type: data.customer_type || 'cash'
            });
          } catch (err) {
            console.error('âڑ ï¸ڈ Error parsing customerData:', err);
          }
        }
      }
    };

    // Load immediately
    loadCustomerFromLocalStorage();

    // Also listen for storage changes
    window.addEventListener('storage', () => {
      console.log('ًں”„ Storage changed externally');
      loadCustomerFromLocalStorage();
    });

    return () => {
      window.removeEventListener('storage', loadCustomerFromLocalStorage);
    };
  }, []);

  // Load and sync store logo from localStorage
  useEffect(() => {
    if (!actualStoreId) return;

    const loadStoreLogo = () => {
      console.log('ًں”چ TopupStorefront - Loading logo for actualStoreId:', actualStoreId);
      const storeSettings = localStorage.getItem(`storeSettings_${actualStoreId}`);
      console.log('ًں”چ localStorage key:', `storeSettings_${actualStoreId}`);
      console.log('ًں”چ Found in localStorage:', !!storeSettings);
      
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          console.log('ًں”چ Parsed settings:', {
            has_logo: !!parsed.logo_url,
            logo_length: parsed.logo_url?.length,
            ends_with: parsed.logo_url?.substring(parsed.logo_url.length - 30)
          });
          if (parsed.logo_url && parsed.logo_url.length > 100) {
            console.log('âœ… Setting store logo. Length:', parsed.logo_url.length);
            setStoreLogo(parsed.logo_url);
          } else {
            // Check if there's a logo from store info
            console.log('âڑ ï¸ڈ Logo too short or missing, checking storeInfo');
            setStoreLogo('');
          }
        } catch (err) {
          console.error('â‌Œ Error parsing store settings:', err);
          setStoreLogo('');
        }
      } else {
        console.log('âڑ ï¸ڈ No store settings found in localStorage');
        // Try to get logo from store info if available
        if (storeInfo?.logo_url && storeInfo.logo_url.length > 100) {
          console.log('âœ… Loading logo from storeInfo');
          setStoreLogo(storeInfo.logo_url);
        } else {
          setStoreLogo('');
        }
      }
    };

    // Load on mount with a small delay to ensure actualStoreId is set
    const loadTimer = setTimeout(() => {
      loadStoreLogo();
    }, 100);

    // Listen for custom event from settings panel
    const handleSettingsUpdate = (e: any) => {
      console.log('ًں”” TopupStorefront received storeSettingsUpdated event, loading logo');
      loadStoreLogo();
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
    };
  }, [actualStoreId, storeInfo]);

  useEffect(() => {
    if (isLoadingStore) {
      console.log('âڈ³ Still loading store ID, skipping data fetch');
      return;
    }
    
    if (!storeId) {
      console.log(`âڑ ï¸ڈ No storeId resolved, using default store 1 (ط¹ظ„ظٹ_ط§ظ„ظ‡ط§ط¯ظٹ)`);
      setActualStoreId(1); // Set default store 1 when no storeId
      return;
    }
    
    console.log(`ًںڑ€ TopupStorefront mount with storeId: ${storeId}`);
    console.log(`ًں“، API_BASE_URL: "${API_BASE_URL}"`);
    
    let isMounted = true; // Track if component is still mounted
    
    const fetchData = async () => {
      console.log('ًں“‹ fetchData: Starting fetch operation');
      
      if (!isMounted) {
        console.log('â‌Œ Component unmounted, aborting fetch');
        return;
      }
      
      try {
        // First, resolve the store slug to numeric ID
        console.log(`ًں”چ Resolving store slug: "${storeId}"`);
        console.log(`ًں“چ Full API URL: /api/stores/slug/${storeId}`);
        
        // If slug is just "store" or numeric, handle differently
        let actualStoreId: number | null = null;
        
        // Try to parse as numeric ID first
        const numericAttempt = parseInt(storeId);
        if (!isNaN(numericAttempt) && numericAttempt > 0) {
          actualStoreId = numericAttempt;
          console.log(`âœ… Parsed storeId as numeric directly: ${actualStoreId}`);
        } else if (storeId === 'store' || storeId === 'topup') {
          // For generic slugs, use store 1 (ط¹ظ„_ط§ظ„ظ‡ط§ط¯ظٹ - topup store)
          console.log(`âڑ ï¸ڈ Generic slug detected (${storeId}), using store 1...`);
          actualStoreId = 1;
        } else {
          // Try to resolve via API
          const storeRes = await fetch(`/api/stores/slug/${storeId}`);
          console.log(`ًں“ٹ Store response status: ${storeRes.status}`);
          
          if (!storeRes.ok) {
            console.warn(`âڑ ï¸ڈ Store slug not found (${storeRes.status}), searching for store with topup products...`);
            try {
              const storesRes = await fetch('/api/topup/products?limit=1');
              if (storesRes.ok) {
                const firstProduct = await storesRes.json();
                if (Array.isArray(firstProduct) && firstProduct.length > 0) {
                  actualStoreId = firstProduct[0].store_id;
                  console.log(`âœ… Found store from first product: ${actualStoreId}`);
                } else {
                  actualStoreId = 1;
                  console.log(`âڑ ï¸ڈ No products found, using default store: 1`);
                }
              }
            } catch (e) {
              actualStoreId = 1;
              console.log(`âڑ ï¸ڈ Error in fallback search: ${e}, using default: 1`);
            }
          } else {
            const storeData = await storeRes.json();
            console.log(`ًں“¦ Store data received:`, storeData);
            console.log(`ًں“¦ Store name field:`, storeData.store_name, `Other name fields: name=${storeData.name}, title=${storeData.title}`);

            if (storeData.slug && storeData.slug !== rawStoreId) {
              console.log(`ًں”„ Redirecting topup customer to canonical slug: /topup/${storeData.slug}`);
              navigate(`/topup/${storeData.slug}`, { replace: true });
              return;
            }
            
            actualStoreId = storeData.id;
            if (!actualStoreId || actualStoreId === undefined) {
              console.error(`â‌Œ No ID in store data! Using default: 1`);
              actualStoreId = 1;
            }
            
            // Store the info for later use - ensure store_name is available
            const enrichedStoreData = {
              ...storeData,
              store_name: storeData.store_name || storeData.name || storeData.title || 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ'
            };
            console.log(`âœ… Enriched store data:`, enrichedStoreData);
            setStoreInfo(enrichedStoreData);
          }
        }
        
        // Ensure it's numeric
        actualStoreId = Number(actualStoreId);
        if (isNaN(actualStoreId) || actualStoreId <= 0) {
          console.error(`â‌Œ Could not resolve store ID, using default: 1`);
          actualStoreId = 1;
        }
        
        console.log(`âœ… Using store ID: ${actualStoreId}`);
        if (isMounted) setActualStoreId(actualStoreId);
        
        // ًں”¥ CRITICAL: Fetch store info even if not using slug resolution
        if (!storeInfo || !storeInfo.store_name) {
          console.log(`ًں“¦ Fetching store info for store ID ${actualStoreId}`);
          try {
            const storeInfoRes = await fetch(`/api/stores/${actualStoreId}`);
            if (storeInfoRes.ok) {
              const storeInfoData = await storeInfoRes.json();
              console.log(`ًں“¦ Store info fetched:`, storeInfoData);
              const enrichedStoreData = {
                ...storeInfoData,
                store_name: storeInfoData.store_name || storeInfoData.name || storeInfoData.title || 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ'
              };
              if (isMounted) {
                setStoreInfo(enrichedStoreData);
                // Save to localStorage for later retrieval
                localStorage.setItem(`storeInfo_${actualStoreId}`, JSON.stringify(enrichedStoreData));
                console.log(`âœ… Saved store info to localStorage:`, enrichedStoreData.store_name);
              }
            } else if (storeInfoRes.status === 404) {
              // Store not found - fallback to store 1
              console.warn(`âڑ ï¸ڈ Store ${actualStoreId} returned 404, trying store 1...`);
              const fallbackRes = await fetch(`/api/stores/1`);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                const enrichedStoreData = {
                  ...fallbackData,
                  store_name: fallbackData.store_name || fallbackData.name || fallbackData.title || 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ'
                };
                if (isMounted) {
                  setStoreInfo(enrichedStoreData);
                  setActualStoreId(1); // Update to store 1
                  localStorage.setItem(`storeInfo_1`, JSON.stringify(enrichedStoreData));
                  console.log(`âœ… Fallback to store 1 successful`);
                }
              } else {
                throw new Error('Store 1 also not found');
              }
            } else {
              console.warn(`âڑ ï¸ڈ Could not fetch store info (status: ${storeInfoRes.status})`);
              // Try to load from localStorage as fallback
              const cachedInfo = localStorage.getItem(`storeInfo_${actualStoreId}`);
              if (cachedInfo) {
                const cached = JSON.parse(cachedInfo);
                if (isMounted) setStoreInfo(cached);
                console.log(`âœ… Loaded cached store info from localStorage`);
              } else {
                // Set default store info
                if (isMounted) setStoreInfo({ 
                  store_name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
                  name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
                  description: 'ط§ط®طھط± ط´ط±ظƒطھظƒ ط§ظ„ظ…ظپط¶ظ„ط© ظˆظ‚ظٹظ…ط© ط§ظ„ط´ط­ظ†'
                });
              }
            }
          } catch (err) {
            console.warn(`âڑ ï¸ڈ Error fetching store info:`, err);
            // Try to load from localStorage as fallback
            const cachedInfo = localStorage.getItem(`storeInfo_${actualStoreId}`);
            if (cachedInfo) {
              const cached = JSON.parse(cachedInfo);
              if (isMounted) setStoreInfo(cached);
              console.log(`âœ… Loaded cached store info from localStorage (on error)`);
            } else {
              if (isMounted) setStoreInfo({ 
                store_name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
                name: 'ظ…طھط¬ط± ط§ظ„ط¨ط·ط§ظ‚ط§طھ',
                description: 'ط§ط®طھط± ط´ط±ظƒطھظƒ ط§ظ„ظ…ظپط¶ظ„ط© ظˆظ‚ظٹظ…ط© ط§ظ„ط´ط­ظ†'
              });
            }
          }
        }
        
        // ط¥ط¶ط§ظپط© timestamp ظ„ظپط±ط¶ ط¬ظ„ط¨ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط© ظ…ظ† ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
        const timestamp = Date.now();
        console.log('ًں”چ Fetching products with timestamp:', timestamp);
        
        // Create AbortController with 60-second timeout (increased from 30)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('âڈ±ï¸ڈ Fetch timeout after 60 seconds - aborting');
          controller.abort();
        }, 60000);
        
        // Fetch companies, categories, products with timeout in PARALLEL (no waiting for store)
        console.log(`ًں“، Fetching companies, categories, and products in parallel for store ID: ${actualStoreId}...`);
        
        const [companiesRes, categoriesRes, productsRes] = await Promise.all([
          // Fetch companies
          fetch(`/api/topup/companies/${actualStoreId}?_t=${timestamp}`, { 
            cache: 'no-store',
            signal: controller.signal 
          }).then(async r => {
            console.log('   Companies response status:', r.status);
            if (!r.ok) {
              console.warn('âڑ ï¸ڈ Companies fetch for store returned status:', r.status);
              console.log('   Trying fallback: GET /api/topup/companies');
              // Fallback to get all companies
              const fallback = await fetch('/api/topup/companies', { cache: 'no-store', signal: controller.signal });
              if (!fallback.ok) {
                console.warn('âڑ ï¸ڈ Fallback companies fetch also failed:', fallback.status);
                return [];
              }
              const data = await fallback.json();
              console.log('âœ… Companies fetched (fallback):', Array.isArray(data) ? data.length : 0);
              return Array.isArray(data) ? data : [];
            }
            const data = await r.json();
            console.log('âœ… Companies fetched:', Array.isArray(data) ? data.length : 0);
            if (!Array.isArray(data) || data.length === 0) {
              console.log('   No data from store endpoint, trying fallback');
              const fallback = await fetch('/api/topup/companies', { cache: 'no-store', signal: controller.signal });
              if (!fallback.ok) return [];
              const fallbackData = await fallback.json();
              console.log('âœ… Companies fetched (fallback):', Array.isArray(fallbackData) ? fallbackData.length : 0);
              return Array.isArray(fallbackData) ? fallbackData : [];
            }
            return Array.isArray(data) ? data : [];
          }).catch(e => {
            console.warn('âڑ ï¸ڈ Companies fetch error:', e.message);
            return [];
          }),
          
          // Fetch categories
          fetch(`/api/topup/categories/${actualStoreId}?_t=${timestamp}`, { 
            cache: 'no-store',
            signal: controller.signal 
          }).then(async r => {
            console.log('   Categories response status:', r.status);
            if (!r.ok) {
              console.warn('âڑ ï¸ڈ Categories fetch returned status:', r.status);
              return [];
            }
            const data = await r.json();
            console.log('âœ… Categories fetched:', Array.isArray(data) ? data.length : 0);
            return Array.isArray(data) ? data : [];
          }).catch(e => {
            console.warn('âڑ ï¸ڈ Categories fetch error:', e.message);
            return [];
          }),
          
          // Fetch products
          fetch(`/api/topup/products/${actualStoreId}?_t=${timestamp}`, { 
            cache: 'no-store',
            signal: controller.signal 
          }).then(async r => {
            console.log('   Categories response status:', r.status);
            if (!r.ok) {
              console.warn('âڑ ï¸ڈ Categories fetch returned status:', r.status);
              return [];
            }
            const data = await r.json();
            console.log('âœ… Categories fetched:', Array.isArray(data) ? data.length : 0);
            return Array.isArray(data) ? data : [];
          }).catch(e => {
            console.warn('âڑ ï¸ڈ Categories fetch error:', e.message);
            return [];
          }),
          
          fetch(`/api/topup/products/${actualStoreId}?_t=${timestamp}`, { 
            cache: 'no-store',
            signal: controller.signal 
          }).then(async r => {
            console.log('   Products response status:', r.status);
            if (!r.ok) {
              console.warn('âڑ ï¸ڈ Products fetch returned status:', r.status);
              // Log more details about the failed request
              console.log('   Trying fallback: GET /api/topup/products');
              const fallback = await fetch('/api/topup/products', { cache: 'no-store', signal: controller.signal });
              if (!fallback.ok) {
                console.warn('âڑ ï¸ڈ Fallback products fetch also failed:', fallback.status);
                return [];
              }
              const fallbackData = await fallback.json();
              console.log('âœ… Products fetched (fallback):', Array.isArray(fallbackData) ? fallbackData.length : 0);
              return Array.isArray(fallbackData) ? fallbackData : [];
            }
            const data = await r.json();
            console.log('âœ… Products fetched:', Array.isArray(data) ? data.length : 0);
            if (Array.isArray(data) && data.length > 0) {
              console.log('   Sample product:', { 
                id: data[0].id, 
                company_name: data[0].company_name,
                hasImages: !!data[0].images,
                imagesCount: Array.isArray(data[0].images) ? data[0].images.filter((img: any) => img && String(img).length > 0).length : 0
              });
            }
            return Array.isArray(data) ? data : [];
          }).catch(e => {
            console.warn('âڑ ï¸ڈ Products fetch error:', e.message);
            return [];
          })
        ]);
        
        clearTimeout(timeoutId);
        
        if (!isMounted) {
          console.log('âڑ ï¸ڈ Component unmounted before state update');
          return;
        }
        
        console.log('ًں“ٹ Data Summary:', {
          companies: companiesRes.length,
          categories: categoriesRes.length,
          products: productsRes.length
        });
        
        if (companiesRes.length === 0) {
          console.warn('âڑ ï¸ڈ NO COMPANIES FETCHED! Checking data...');
          console.log('   Companies response:', companiesRes);
        }
        
        if (productsRes.length === 0) {
          console.warn('âڑ ï¸ڈ NO PRODUCTS FETCHED! Checking data...');
          console.log('   Products response:', productsRes);
        }
        
        console.log('ًں”„ Setting state (all at once)...');
        setCompanies(companiesRes);
        setCategories(categoriesRes);
        setProducts(productsRes);
        
        console.log('âœ… Setting loading to false');
        setLoading(false);
        console.log('âœ… Data load complete');
      } catch (error) {
        console.error('â‌Œ Error loading data - Caught in main try/catch:', error);
        console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   Error message:', error instanceof Error ? error.message : String(error));
        if (isMounted) {
          alert(`ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ: ${(error as Error).message}`);
          setLoading(false);
        }
      }
    };
    
    // Fetch immediately on mount
    console.log('ًں“چ Calling fetchData on component mount');
    fetchData();
    
    // طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ ظƒظ„ 30 ط«ط§ظ†ظٹط© ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† طھط­ط¯ظٹط«ط§طھ ط¬ط¯ظٹط¯ط© (ط¨ط¯ظ„ط§ظ‹ ظ…ظ† ظƒظ„ 3 ط«ظˆط§ظ†ظٹ)
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        console.log('ًں”„ Auto-refreshing products data...');
        fetchData();
      }
    }, 30000);
    
    return () => {
      console.log('ًں§¹ Cleaning up TopupStorefront product fetch effect');
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [storeId, isLoadingStore, refreshProductsKey]);

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
        console.log('âœ… Loaded customer from topupCustomer:', customerData);
      } catch (err) {
        console.error('âڑ ï¸ڈ Error parsing topupCustomer:', err);
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
          console.log('âœ… Loaded purchase form from customerData:', data);
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing customerData:', err);
        }
      }
    }
  }, [storeId]);

  // Load store logo from localStorage
  useEffect(() => {
    if (!actualStoreId) return;
    
    // First, try to load cached storeInfo
    const cachedInfo = localStorage.getItem(`storeInfo_${actualStoreId}`);
    if (cachedInfo && (!storeInfo || !storeInfo.store_name)) {
      try {
        const cached = JSON.parse(cachedInfo);
        console.log(`âœ… Loading cached store info from localStorage:`, cached.store_name);
        setStoreInfo(cached);
      } catch (err) {
        console.error('âڑ ï¸ڈ Error loading cached store info:', err);
      }
    }

    const loadStoreLogo = () => {
      const storeSettings = localStorage.getItem(`storeSettings_${actualStoreId}`);
      if (storeSettings) {
        try {
          const parsed = JSON.parse(storeSettings);
          if (parsed.logo_url) {
            setStoreLogo(parsed.logo_url);
            console.log('âœ… Loaded store logo from localStorage:', {
              hasLogo: !!parsed.logo_url,
              logoLength: parsed.logo_url?.length
            });
          } else {
            setStoreLogo('');
          }
        } catch (err) {
          console.error('âڑ ï¸ڈ Error parsing store settings:', err);
        }
      } else {
        console.log('âڑ ï¸ڈ No store settings found in localStorage for ID:', actualStoreId);
      }
    };

    // Load on mount
    loadStoreLogo();

    // Listen for custom event from settings panel
    const handleSettingsUpdate = (e: any) => {
      if (e.detail?.storeId === actualStoreId) {
        console.log('ًں”” Received storeSettingsUpdated event, reloading logo');
        loadStoreLogo();
      }
    };

    window.addEventListener('storeSettingsUpdated', handleSettingsUpdate);

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `storeSettings_${actualStoreId}` || e.key === `storeInfo_${actualStoreId}`) {
        console.log('ًں”„ Store settings or info changed in browser storage, reloading');
        loadStoreLogo();
        const cachedInfo = localStorage.getItem(`storeInfo_${actualStoreId}`);
        if (cachedInfo) {
          const cached = JSON.parse(cachedInfo);
          setStoreInfo(cached);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storeSettingsUpdated', handleSettingsUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [actualStoreId]);

  // ظ…ط±ط§ظ‚ط¨ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط© - طھط­ط¯ظٹط« طھظ„ظ‚ط§ط¦ظٹ ط¹ظ†ط¯ طھط؛ظٹظٹط± localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('ًں”„ TopupStorefront: localStorage changed - reloading customer');
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const customerData = JSON.parse(topupData);
          console.log('âœ… TopupStorefront: Updated customer from topupCustomer:', customerData);
          setCustomer(customerData);
          setPurchaseForm({
            name: customerData.name || '',
            phone: customerData.phone || '',
            customer_type: customerData.customer_type || 'cash'
          });
        } catch (err) {
          console.error('âڑ ï¸ڈ TopupStorefront: Error parsing topupCustomer:', err);
        }
      }
    };

    // ط§ط³طھظ…ط¹ ط¥ظ„ظ‰ طھط؛ظٹظٹط±ط§طھ ط§ظ„طھط®ط²ظٹظ† ظ…ظ† ظ†ظˆط§ظپط°/ط¹ظ„ط§ظ…ط§طھ طھط¨ظˆظٹط¨ ط£ط®ط±ظ‰
    window.addEventListener('storage', handleStorageChange);
    
    // طھط­ظ‚ظ‚ ظ…ظ† طھط؛ظٹظٹط±ط§طھ topupCustomer ط¨ط´ظƒظ„ ط¯ظˆط±ظٹ
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

  // Refetch products and companies when customer logs in
  useEffect(() => {
    if (customer && customer.customer_id && !loading) {
      console.log('ًں”„ Customer logged in or changed - refetching products/companies...');
      setLoading(true);
      
      // Re-trigger the data fetch
      const timer = setTimeout(() => {
        setLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [customer?.customer_id]);

  // ط±ط§ظ‚ط¨ ط¹ظ†ط¯ ط¥ط؛ظ„ط§ظ‚ ظ†ظ…ظˆط°ط¬ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„طھط£ظƒط¯ ظ…ظ† طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ط¨ط§ط´ط±ط©
  useEffect(() => {
    if (!showAuthForm) {
      console.log('ًں’، Auth form closed - checking localStorage');
      // طھط­ظ‚ظ‚ ظ…ظ† localStorage ط¹ظ†ط¯ظ…ط§ ظٹظڈط؛ظ„ظ‚ ظ†ظ…ظˆط°ط¬ ط§ظ„ط¯ط®ظˆظ„ (ط¨ط؛ط¶ ط§ظ„ظ†ط¸ط± ط¹ظ† customer state)
      const topupData = localStorage.getItem('topupCustomer');
      if (topupData) {
        try {
          const customerData = JSON.parse(topupData);
          console.log('âœ… Found customer data in localStorage:', customerData);
          // طھط­ط¯ظٹط« customer ط¨ط؛ط¶ ط§ظ„ظ†ط¸ط± ط¹ظ† ط§ظ„ط­ط§ظ„ط© ط§ظ„ط³ط§ط¨ظ‚ط©
          setCustomer(customerData);
        } catch (err) {
          console.error('âڑ ï¸ڈ Error loading from localStorage:', err);
        }
      } else {
        console.log('â‌Œ No customer data in localStorage');
      }
    }
  }, [showAuthForm]);

  // Filter companies and categories - show ALL companies/categories for adding products
  const companiesWithProducts = companies; // ط¹ط±ط¶ ط¬ظ…ظٹط¹ ط§ظ„ط´ط±ظƒط§طھ
  
  const categoriesWithProducts = categories; // ط¹ط±ط¶ ط¬ظ…ظٹط¹ ط§ظ„ظپط¦ط§طھ ط¯ط§ط¦ظ…ط§ظ‹

  // طھط­ط¯ظٹط« selectedProduct ط¹ظ†ط¯ طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط£ط­ط¯ط« ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ…ط§ ظپظٹظ‡ط§ available_codes
  useEffect(() => {
    if (selectedProduct?.id && products.length > 0) {
      const updatedProduct = products.find(p => p.id === selectedProduct.id);
      if (updatedProduct && updatedProduct.available_codes !== selectedProduct.available_codes) {
        console.log('ًں”„ Product codes changed! Updating:', {
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

  const filteredProducts = products.filter(p => {
    if (!selectedCompany || selectedCompany.trim() === '') return true;
    
    // Filter by company_id (numeric match from dropdown value)
    const selectedId = parseInt(selectedCompany);
    if (!isNaN(selectedId)) {
      return p.company_id === selectedId;
    }
    
    // Fallback: search by company name if not numeric
    const searchTerm = selectedCompany.trim().toLowerCase();
    const companyName = (p.company_name || '').toLowerCase();
    return companyName.includes(searchTerm);
  });

  const handleAuth = async () => {
    if (!authPhone || !authPassword) {
      alert('ظٹط±ط¬ظ‰ ظ…ظ„ط، ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±');
      return;
    }

    setIsAuthenticating(true);
    try {
      console.log('ًں”گ Auth attempt with:', { phone: authPhone, store_id: actualStoreId });
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
      console.log('ًں”گ Auth response:', { status: response.status, ok: response.ok, data });
      
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
        console.log('ًں”گ handleAuth - customerData prepared:', customerData);
        // ط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ‚ط¯ظٹظ…ط© ط£ظˆظ„ط§ظ‹
        localStorage.removeItem('customerData');
        localStorage.removeItem('topupCustomer');
        // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط©
        localStorage.setItem('topupCustomer', JSON.stringify(customerData));
        console.log('ًں’¾ handleAuth - saved to localStorage');
        console.log('âœ… handleAuth - calling setCustomer:', customerData);
        setCustomer(customerData);
        setPhone(data.phone); // Auto-fill phone in purchase form
        setAuthPassword(''); // Clear password from memory
        
        // ًں”„ IMMEDIATELY refresh customer debt from statement (not from DB)
        console.log('ًں”„ [LOGIN] Refreshing customer debt from statement...');
        await refreshCustomerDebt(data.customer_id);
        
        // طھط£ط®ظٹط± طµط؛ظٹط± ظ„ظ„طھط£ظƒط¯ ظ…ظ† طھط­ط¯ظٹط« state ظ‚ط¨ظ„ ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ†ظ…ظˆط°ط¬
        setTimeout(() => {
          console.log('âڈ±ï¸ڈ handleAuth - closing auth form');
          setShowAuthForm(false);
        }, 100);
        alert('طھظ… طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ظƒ ط¨ظ†ط¬ط§ط­! âœ“');
      } else {
        alert(data.error || 'ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„');
      }
    } catch (error) {
      console.error('Error authenticating:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظ…ط¨ظ„ط؛ طµط­ظٹط­');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > Number(customer?.current_debt || 0)) {
      alert(`ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ط®ظ„ ط£ظƒط¨ط± ظ…ظ† ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط© (${Math.round(Number(customer?.current_debt || 0))?.toLocaleString('en-US')} ط¯.ط¹)`);
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
        alert('âœ… طھظ… طھط³ط¯ظٹط¯ ط§ظ„ظ…ط¨ظ„ط؛ ط¨ظ†ط¬ط§ط­!');
        
        // ًں”„ IMMEDIATE Update: Add payment transaction to statement INSTANTLY
        console.log('âڑ، IMMEDIATE UPDATE: Adding payment transaction to statement');
        
        // ًںژ¯ Get ACCURATE current debt from statement (not from DB)
        let currentActualDebt = Number(customer.current_debt || 0);
        if (statementTransactions && statementTransactions.length > 0) {
          // Use the latest balance from statement transactions
          currentActualDebt = Number(statementTransactions[0]?.balance || customer.current_debt || 0);
        }
        
        console.log('ًں’° Payment calculation:', { 
          dbDebt: customer.current_debt, 
          statementDebt: statementTransactions[0]?.balance,
          actualDebt: currentActualDebt,
          payment: amount,
          newDebt: Math.max(0, currentActualDebt - amount)
        });
        
        const newPaymentTransaction = {
          id: Math.random(),
          type: 'payment',
          description: 'ط¯ظپط¹ط©',
          amount: amount,
          is_payment: true,
          balance: Math.max(0, currentActualDebt - amount),
          created_at: new Date().toISOString(),
          source: 'payment'
        };
        
        // Update statement transactions IMMEDIATELY
        setStatementTransactions(prev => [newPaymentTransaction, ...prev].slice(0, 50));
        
        // Update customer debt IMMEDIATELY with ACCURATE value
        const newDebt = Math.max(0, currentActualDebt - amount);
        setCustomer(prevCustomer => ({
          ...prevCustomer,
          current_debt: newDebt
        }));
        
        console.log('âœ… Payment transaction added to statement immediately');
        
        setPaymentAmount('');
        // Don't close payment form here, user's existing payment form
        
        // Then refresh from server in background (async)
        setTimeout(async () => {
          console.log('ًں”„ Refreshing full statement from server');
          await handleLoadStatement();
        }, 300);
      } else {
        alert(data.error || 'ظپط´ظ„ طھط³ط¯ظٹط¯ ط§ظ„ظ…ط¨ظ„ط؛');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط¹ظ…ظ„ظٹط© ط§ظ„ط¯ظپط¹');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Load customer statement with transactions
  const handleLoadStatement = async (customerId?: number) => {
    const targetCustomerId = customerId || customer?.customer_id;
    
    if (!targetCustomerId) {
      console.warn('âڑ ï¸ڈ No customer_id found');
      return;
    }
    
    setIsLoadingStatement(true);
    try {
      console.log('ًں”چ Fetching TOPUP statement for customer:', targetCustomerId);
      const res = await fetch(`/api/topup/customers/${targetCustomerId}/statement`);
      const data = await res.json();
      console.log('ًں“ٹ Raw API response:', data);
      console.log('ًں“ٹ Response status:', res.status, 'OK:', res.ok);
      
      if (res.ok) {
        // Handle topup response format: { customer: {...}, transactions: [...], current_debt: X }
        let transactions = [];
        
        if (data.transactions && Array.isArray(data.transactions)) {
          console.log('âœ“ Found data.transactions with', data.transactions.length, 'items');
          transactions = data.transactions;
        } else if (Array.isArray(data)) {
          console.log('âœ“ Data is array (fallback)');
          transactions = data;
        } else {
          console.warn('âڑ ï¸ڈ Unknown response format:', Object.keys(data));
          transactions = [];
        }
        
        console.log('ًں“ٹ Final transactions count:', transactions.length);
        if (transactions.length > 0) {
          console.log('ًں“ٹ Sample transactions:', transactions.slice(0, 3));
        }
        
        setStatementTransactions(transactions);
        
        // Update customer debt from API response
        if (data.current_debt !== undefined) {
          console.log('ًں’° Updating customer debt from API:', data.current_debt);
          setCustomer(prevCustomer => ({
            ...prevCustomer,
            current_debt: data.current_debt
          }));
        }
      } else {
        console.error('â‌Œ API returned error status:', res.status);
        setStatementTransactions([]);
      }
    } catch (error) {
      console.error('â‌Œ Error loading statement:', error);
      setStatementTransactions([]);
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Load specific customer's statement (for merchant dashboard operations)
  const handleLoadCustomerStatement = async (customerId: number) => {
    if (!customerId) {
      console.warn('âڑ ï¸ڈ No customer_id provided to handleLoadCustomerStatement');
      return;
    }
    
    setIsLoadingCustomerTransactions(true);
    try {
      console.log('ًں”چ Fetching statement for customer:', customerId);
      const res = await fetch(`/api/customers/${customerId}/statement`);
      const data = await res.json();
      console.log('ًں“ٹ Raw API response:', data);
      
      if (res.ok) {
        // Handle different response formats
        let transactions = [];
        if (Array.isArray(data)) {
          transactions = data;
        } else if (data.transactions && Array.isArray(data.transactions)) {
          transactions = data.transactions;
        } else if (data.data && Array.isArray(data.data)) {
          transactions = data.data;
        } else if (data.orders && Array.isArray(data.orders)) {
          transactions = data.orders;
        } else if (data.purchases && Array.isArray(data.purchases)) {
          transactions = data.purchases;
        } else {
          console.warn('âڑ ï¸ڈ Unknown response format:', Object.keys(data));
          transactions = [];
        }
        
        console.log('ًں“Œ Setting customer transactions with:', transactions.length, 'items');
        setCustomerTransactions(transactions);
        
        // Update selectedCustomerStatement with current_debt from API if available
        if (data.current_debt !== undefined) {
          setSelectedCustomerStatement(prevCustomer => ({
            ...prevCustomer,
            current_debt: data.current_debt
          }));
        }
      } else {
        console.error('â‌Œ API returned error status:', res.status);
        setCustomerTransactions([]);
      }
    } catch (error) {
      console.error('â‌Œ Error loading customer statement:', error);
      setCustomerTransactions([]);
    } finally {
      setIsLoadingCustomerTransactions(false);
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
    alert('طھظ… طھط³ط¬ظٹظ„ ط®ط±ظˆط¬ظƒ');
    const targetSlug = rawStoreId || storeId || 'store';
    navigate(`/stores?openTopup=1&topupSlug=${encodeURIComponent(targetSlug)}`, { replace: true });
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
          setCreditError(`â‌Œ ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†: ظ„ط§ ظٹظ…ظƒظ†ظƒ ط§ظ„ط´ط±ط§ط،. ط§ظ„ط±طµظٹط¯ ط§ظ„ط­ط§ظ„ظٹ: ${formatCurrency(creditData.availableCredit)}`);
          setCanProceedWithPurchase(false);
        } else if (creditData.isNearLimit) {
          setCreditError(`âڑ ï¸ڈ طھط­ط°ظٹط±: ط£ظ†طھ ظ‚ط±ظٹط¨ ظ…ظ† ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†. ${creditData.warning}`);
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
      console.warn('âڑ ï¸ڈ getDisplayPrice: selectedProduct is null');
      return 0;
    }
    
    const customerType = customer?.customer_type || purchaseForm.customer_type;
    
    console.log('ًں’° getDisplayPrice DEBUG:', {
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
        console.log(`âœ… Reseller: Using retail_price = ${selectedProduct.retail_price}`);
        return selectedProduct.retail_price;
      } else if (selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0) {
        console.log(`âڑ ï¸ڈ Reseller: retail_price not available, using wholesale_price = ${selectedProduct.wholesale_price}`);
        return selectedProduct.wholesale_price;
      } else if (selectedProduct.price && selectedProduct.price > 0) {
        console.log(`âڑ ï¸ڈ Reseller: Using base price = ${selectedProduct.price}`);
        return selectedProduct.price;
      }
    }
    
    // For cash customers, use wholesale_price
    if (selectedProduct.wholesale_price && selectedProduct.wholesale_price > 0) {
      console.log(`âœ… Cash: Using wholesale_price = ${selectedProduct.wholesale_price}`);
      return selectedProduct.wholesale_price;
    } else if (selectedProduct.price && selectedProduct.price > 0) {
      console.log(`âœ… Cash: Using base price = ${selectedProduct.price}`);
      return selectedProduct.price;
    }
    
    console.error('â‌Œ Could not determine price!');
    return 0;
  };

  // Refresh customer debt data after purchase
  const refreshCustomerDebt = async (customerId: number) => {
    if (!customerId) return;
    
    try {
      console.log('ًں”„ Refreshing customer debt data after purchase...');
      // Fetch customer's statement to get current debt
      const response = await fetch(`/api/customers/${customerId}/statement`);
      
      if (response.ok) {
        const transactions = await response.json();
        
        // Calculate final balance from transactions
        let finalBalance = 0;
        if (Array.isArray(transactions)) {
          const lastTransaction = transactions[transactions.length - 1];
          if (lastTransaction) {
            finalBalance = Number(lastTransaction.balance) || 0;
          }
        }
        
        console.log('ًں“ٹ Updated customer debt from statement:', finalBalance);
        
        // Update customer with new debt
        const updatedCustomer = {
          ...customer,
          current_debt: finalBalance
        };
        setCustomer(updatedCustomer);
        
        // Save updated data to localStorage
        localStorage.setItem('topupCustomer', JSON.stringify(updatedCustomer));
        console.log('âœ… Customer data refreshed and saved to localStorage');
      }
    } catch (err) {
      console.error('Error refreshing customer debt:', err);
    }
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
        alert('ظٹط±ط¬ظ‰ ظ…ظ„ط، ط§ط³ظ…ظƒ ظˆط±ظ‚ظ… طھظ„ظپظˆظ†ظƒ');
        return;
      }
    } else if (!customer) {
      alert('ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط£ظˆظ„ط§ظ‹');
      return;
    }

    if (!selectedProduct) {
      alert('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظ†طھط¬');
      return;
    }

    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھظˆظپط±ط©
    if (!selectedProduct.available_codes || selectedProduct.available_codes <= 0) {
      alert('â‌Œ ط¹ط°ط±ط§ظ‹طŒ ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…طھظˆظپط± ط­ط§ظ„ظٹط§ظ‹');
      return;
    }

    if (quantity > selectedProduct.available_codes) {
      alert(`â‌Œ ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…ط·ظ„ظˆط¨ط© (${quantity}) طھط²ظٹط¯ ط¹ظ† ط§ظ„ظ…طھظˆظپط± (${selectedProduct.available_codes})`);
      return;
    }

    if (!canProceedWithPurchase) {
      alert(creditError);
      return;
    }

    if (showCreditWarning) {
      const confirmed = window.confirm(`${creditError}\n\nظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط© ط±ط؛ظ… ط§ظ„طھط­ط°ظٹط±طں`);
      if (!confirmed) return;
    }

    setIsProcessing(true);
    try {
      const displayPrice = getDisplayPrice();
      const finalCustomerType = customer?.customer_type || purchaseForm.customer_type;
      const finalName = customer?.name || purchaseForm.name;
      const finalPhone = customer?.phone || purchaseForm.phone;

      console.log('ًں›’ PURCHASE REQUEST DATA:', {
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
          total_amount: displayPrice * quantity,
          selected_images: selectedProduct.images?.slice(0, quantity) || []
        })
      });

      const data = await response.json();
      if (response.ok) {
        // ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„ ظپظٹ localStorage
        localStorage.setItem('topupCustomer', JSON.stringify({
          name: finalName,
          phone: finalPhone,
          customer_type: finalCustomerType
        }));
        // ط§ط­ط°ظپ customerData ظ„طھط¬ظ†ط¨ ط§ظ„طھط¶ط§ط±ط¨
        localStorage.removeItem('customerData');
        playAddToCartSound();
        setShowPurchaseForm(false);
        setPurchaseForm({ name: '', phone: '', customer_type: 'cash' });
        
        // ًں”„ IMMEDIATE Update: Add new transaction to statement INSTANTLY
        if (customer?.customer_id) {
          console.log('âڑ، IMMEDIATE UPDATE: Adding new topup transaction to statement');
          
          // ًںژ¯ Get ACCURATE current debt from statement (not from DB)
          let currentActualDebt = Number(customer.current_debt || 0);
          if (statementTransactions && statementTransactions.length > 0) {
            // Use the latest balance from statement transactions
            currentActualDebt = Number(statementTransactions[0]?.balance || customer.current_debt || 0);
          }
          
          console.log('ًں’° Debt calculation:', { 
            dbDebt: customer.current_debt, 
            statementDebt: statementTransactions[0]?.balance,
            actualDebt: currentActualDebt,
            purchase: displayPrice * quantity,
            newDebt: currentActualDebt + (displayPrice * quantity)
          });
          
          // Create new transaction object for immediate display
          const newTransaction = {
            id: data.order_id || Math.random(),
            type: 'topup',
            description: 'ط´ط±ط§ط،',
            amount: displayPrice * quantity,
            is_payment: false,
            balance: currentActualDebt + (displayPrice * quantity),
            created_at: new Date().toISOString(),
            source: 'topup_order'
          };
          
          // Update statement transactions IMMEDIATELY
          setStatementTransactions(prev => [newTransaction, ...prev].slice(0, 50));
          
          // Update customer debt IMMEDIATELY with ACCURATE value
          const newDebt = currentActualDebt + (displayPrice * quantity);
          setCustomer(prevCustomer => ({
            ...prevCustomer,
            current_debt: newDebt
          }));
          
          console.log('âœ… Transaction added to statement immediately with accurate debt');
          
          // Then refresh from server in background (async)
          setTimeout(async () => {
            await refreshCustomerDebt(customer.customer_id);
            await handleLoadStatement();
          }, 300);
        }
        
        // ًں”„ Refresh products list to show updated inventory
        console.log('ًں”„ Refreshing products list after purchase');
        setRefreshProductsKey(prev => prev + 1);
        
        navigate(`/topup/${storeId}/order/${data.order_id}`);
      } else {
        alert(data.error || 'ظپط´ظ„ ط¥طھظ…ط§ظ… ط§ظ„ط¹ظ…ظ„ظٹط©');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      alert('ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط¹ظ…ظ„ظٹط©');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingStore) return (
    <div className={cn("p-8 text-center min-h-screen flex flex-col items-center justify-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>ط¬ط§ط±ظٹ طھط­ط¯ظٹط¯ ط§ظ„ظ…طھط¬ط±...</p>
      <p className={cn("text-sm mt-2", isDarkMode ? "text-gray-500" : "text-gray-500")}>ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ظ‚ظ„ظٹظ„ط§ظ‹</p>
    </div>
  );

  if (loading) return (
    <div className={cn("p-8 text-center min-h-screen flex flex-col items-center justify-center", isDarkMode ? "bg-gray-900" : "bg-white")}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
      <p className={cn("text-sm mt-2", isDarkMode ? "text-gray-500" : "text-gray-500")}>ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ظ‚ظ„ظٹظ„ط§ظ‹</p>
    </div>
  );

  if (!customer?.customer_id) {
    const targetSlug = rawStoreId || storeId || 'store';
    return <Navigate to={`/stores?openTopup=1&topupSlug=${encodeURIComponent(targetSlug)}`} replace />;
  }

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      {/* Main scrollable container for header and content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header with Auth */}
        <div className={cn("border-b sticky top-0 z-30 backdrop-blur-sm", isDarkMode ? "border-gray-700 bg-gray-900/95" : "border-gray-200 bg-white/95")}>
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            {/* Search and Theme Toggle Bar */}
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={cn(
                  "p-2 rounded-lg border transition-all flex items-center justify-center flex-shrink-0",
                  isDarkMode 
                    ? "bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800" 
                    : "bg-gray-50 border-black/5 text-gray-500 hover:bg-gray-100"
                )}
                title={isDarkMode ? "ط§ظ„ظˆط¶ط¹ ط§ظ„ظپط§طھط­" : "ط§ظ„ظˆط¶ط¹ ط§ظ„ط¯ط§ظƒظ†"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="relative flex-1">
                <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={16} />
                <input 
                  type="text" 
                  placeholder="ط¨ط­ط« ط­ط³ط¨ ط§ظ„ط´ط±ظƒط© ط£ظˆ ط§ظ„ظ…طھط¬..." 
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className={cn("w-full pl-9 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500/30 placeholder-gray-500" : "bg-gray-50 border-black/5 focus:ring-indigo-500/20 placeholder-gray-400")}
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4 mb-4">
              <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto order-2 lg:order-1">
                <button 
                  onClick={() => window.location.reload()}
                  className={cn("flex items-center gap-1 font-normal transition-colors text-sm sm:text-base", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900")}
                >
                  <ChevronRight size={18} />
                  <span className="hidden sm:inline">ط§ظ„ط¹ظˆط¯ط©</span>
                </button>
              {/* Shopping Cart Button with Filters */}
              <div className="flex flex-row gap-2 ml-auto lg:ml-0 items-center sm:flex-col sm:gap-2">
                <button
                  onClick={() => {
                    // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† customer ط£ظˆ purchaseForm ط¥ظ„ظ‰ localStorage ظ‚ط¨ظ„ ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ط¹ط±ط¨ط©
                    console.log('ًں›’ Cart button clicked - current customer:', customer);
                    // ط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ‚ط¯ظٹظ…ط© ط£ظˆظ„ط§ظ‹
                    localStorage.removeItem('customerData');
                    localStorage.removeItem('topupCustomer');
                    
                    if (customer) {
                      // ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ customer ظ…ط³ط¬ظ„طŒ ط§ط®ط²ظ† ط¨ظٹط§ظ†ط§طھظ‡
                      console.log('âœ… Saving customer to topupCustomer:', customer);
                      localStorage.setItem('topupCustomer', JSON.stringify(customer));
                    } else if (purchaseForm.name || purchaseForm.phone) {
                      // ظˆط¥ظ„ط§طŒ ط§ط­ظپط¸ purchaseForm
                      console.log('âœ… Saving purchaseForm to topupCustomer:', purchaseForm);
                      localStorage.setItem('topupCustomer', JSON.stringify(purchaseForm));
                    }
                    // Store the topup store slug for navigation back after checkout
                    // Always use store 1 (ط¹ظ„ظٹ_ط§ظ„ظ‡ط§ط¯ظٹ) - the main topup store
                    const safeStoreId = (parseInt(storeId || '0') === 21 || parseInt(storeId || '0') === 13) ? '1' : storeId;
                    localStorage.setItem('topupStoreSlug', safeStoreId);
                    console.log('âœ… Saved topupStoreSlug:', safeStoreId);
                    navigate('/topup-cart');
                  }}
                  className="relative rounded-lg font-normal text-white transition-all hover:scale-105 flex items-center gap-2 shadow group"
                  style={{ backgroundColor: primaryColor }}
                  title="ط¹ط±ط¶ ط³ظ„ط© ط§ظ„ظ…ط´طھط±ظٹط§طھ"
                >
                  <div className="p-2 sm:p-3 relative">
                    <ShoppingCart size={28} className="sm:w-9 sm:h-9 group-hover:scale-110 transition-transform" />
                    {cartItems.length > 0 && (
                      <div className={cn("absolute top-0 right-0 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg", isDarkMode ? "bg-red-600" : "bg-red-500")}>
                        {cartItems.length}
                      </div>
                    )}
                  </div>
                </button>
                {/* Filters Dropdown */}
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setSelectedCategory('');
                    setSelectedProduct(null);
                  }}
                  className={cn("px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm font-normal", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                >
                  <option value="">ط¬ظ…ظٹط¹ ط§ظ„ط´ط±ظƒط§طھ ({companiesWithProducts.length})</option>
                  {companiesWithProducts.length === 0 ? (
                    <option disabled>â‌Œ ظ„ط§ طھظˆط¬ط¯ ط´ط±ظƒط§طھ ظ…طھط§ط­ط©</option>
                  ) : (
                    companiesWithProducts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  )}
                </select>
                {companiesWithProducts.length === 0 && (
                  <button
                    onClick={() => {
                      console.log('ًں”„ Reloading data...');
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1000);
                    }}
                    className={cn("px-2 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm font-normal ", isDarkMode ? "bg-yellow-900/30 border-yellow-600 text-yellow-300 hover:bg-yellow-900/50" : "bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100")}
                    title="ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ"
                  >
                    ًں”„ طھط­ط¯ظٹط«
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto order-1 lg:order-2 justify-center">
              {storeLogo && storeLogo.length > 100 && (
                <img 
                  key={`topup-logo-${storeLogo.substring(storeLogo.length - 30)}`}
                  src={storeLogo} 
                  alt="Store Logo" 
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-lg flex-shrink-0"
                  onLoad={() => {
                    console.log('âœ… TopupStorefront logo loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('Error loading logo:', e);
                    setStoreLogo('');
                  }}
                />
              )}
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal leading-tight">
                  {storeInfo?.store_name ? storeInfo.store_name : 'ظ…طھط¬ط± ط¨ط·ط§ظ‚ط§طھ ط§ظ„ط´ط­ظ†'}
                  {console.log('ًں”چ Store Name Debug:', { store_name: storeInfo?.store_name, storeInfo })}
                </h1>
                <p className={cn("mt-1 text-xs sm:text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                  {storeInfo?.description || 'ط§ط®طھط± ط´ط±ظƒطھظƒ ط§ظ„ظ…ظپط¶ظ„ط© ظˆظ‚ظٹظ…ط© ط§ظ„ط´ط­ظ†'}
                </p>
              </div>
            </div>
            {customer ? (
              <>
                {console.log('ًںں¢ Rendering customer debt info for:', customer.name, customer.customer_id)}
                {/* Debt Summary Card */}
                {customer.customer_id && (
                  <div className={cn("w-full lg:w-auto p-3 sm:p-4 rounded-lg border-2 space-y-2 sm:space-y-3 order-3", isDarkMode ? "bg-red-900/30 border-red-600" : "bg-red-50 border-red-300")}>
                    <div>
                      <p className={cn("text-xs font-normal mb-1 sm:mb-2", isDarkMode ? "text-red-300" : "text-red-600")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</p>
                      <p className={cn("text-2xl sm:text-3xl font-bold", (() => {
                        // ط§ظ„ظ…طµط¯ط± ط§ظ„ط£ط³ط§ط³ظٹ: statementTransactions ط§ظ„ط£ط®ظٹط± (ط¥ط°ط§ ظ…طھظˆظپط±)
                        // ط§ظ„ظ…طµط¯ط± ط§ظ„ط«ط§ظ†ظˆظٹ: customer.current_debt (ط¨ط¯ظٹظ„ ظ…ط¨ط§ط´ط±)
                        let currentDebt = Number(customer.current_debt || 0);
                        
                        // ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ transactionsطŒ ط§ط³طھط®ط¯ظ… ط§ظ„ط±طµظٹط¯ ط§ظ„ط£ط®ظٹط± (ط§ظ„ط£ط­ط¯ط«)
                        if (statementTransactions && statementTransactions.length > 0) {
                          currentDebt = Number(statementTransactions[0]?.balance || customer.current_debt || 0);
                        }
                        
                        return currentDebt > Number(customer.credit_limit || 0) 
                          ? (isDarkMode ? "text-red-400" : "text-red-600") 
                          : (isDarkMode ? "text-yellow-300" : "text-yellow-700");
                      })())}>{(() => {
                        let currentDebt = Number(customer.current_debt || 0);
                        
                        // ط§ط³طھط®ط¯ط§ظ… ط£ط­ط¯ط« ط±طµظٹط¯ ظ…ظ† transactions
                        if (statementTransactions && statementTransactions.length > 0) {
                          currentDebt = Number(statementTransactions[0]?.balance || customer.current_debt || 0);
                        }
                        
                        return Math.round(currentDebt).toLocaleString('en-US');
                      })()} <span className="text-base sm:text-lg">ط¯.ط¹</span></p>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button
                        onClick={handleLogout}
                        className={cn("py-2 px-2 sm:px-3 rounded text-xs font-normal hidden", isDarkMode ? "bg-red-900 text-red-100 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200")}
                        title="طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬"
                      >
                        ًںڑھ <span className="hidden sm:inline">ط®ط±ظˆط¬</span>
                      </button>
                      <button
                        onClick={async () => {
                          await handleLoadStatement(customer?.customer_id);
                          setShowAccountStatement(true);
                        }}
                        className={cn("py-2 px-2 sm:px-3 rounded text-xs font-normal", isDarkMode ? "bg-blue-900 text-blue-100 hover:bg-blue-800" : "bg-blue-100 text-blue-700 hover:bg-blue-200")}
                        title="ط¹ط±ط¶ ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨ ط§ظ„ظƒط§ظ…ظ„"
                      >
                        ًں“‹ <span className="hidden sm:inline">ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨</span>
                      </button>
                    </div>
                  </div>
                )}

                  {/* Payment Form */}
                  {showPaymentForm && (
                    <div className={cn("mt-4 p-4 rounded-lg border-2", isDarkMode ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300")}>
                      <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-green-400" : "text-green-700")}>ط£ط¯ط®ظ„ ط§ظ„ظ…ط¨ظ„ط؛ (ط¯.ط¹)</label>
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
                          {isPaymentProcessing ? 'ط¬ط§ط±ظٹ...' : 'طھط£ظƒظٹط¯'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentAmount('');
                          }}
                          className={cn("px-4 py-2 rounded-lg text-white font-normal text-sm transition-colors", isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-400 hover:bg-gray-500")}
                        >
                          ط¥ظ„ط؛ط§ط،
                        </button>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => navigate(`/stores?openTopup=1&topupSlug=${encodeURIComponent(rawStoreId || storeId || 'store')}`, { replace: true })}
                  className={cn("w-full py-2 px-3 rounded text-sm font-normal text-white", isDarkMode ? "bg-red-900 hover:bg-red-800" : "bg-red-600 hover:bg-red-700")}
                >
                  ًں”“ ط¯ط®ظˆظ„
                </button>
                <div className={cn("p-3 rounded-lg border", isDarkMode ? "bg-amber-900/20 border-amber-600/30" : "bg-amber-50 border-amber-200")}>
                  <p className={cn("text-xs font-bold mb-2", isDarkMode ? "text-amber-300" : "text-amber-700")}>ًں“‹ ظ…ظ„ط®طµ ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨</p>
                  <p className={cn("text-[11px] mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    <span className={cn("px-2 py-0.5 rounded inline-block text-[10px] font-bold", isDarkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-700")}>
                      ًں”’ ط؛ظٹط± ظ…ط³ط¬ظ„
                    </span>
                  </p>
                  <ul className={cn("text-[11px] space-y-1", isDarkMode ? "text-gray-300" : "text-gray-600")}>
                    <li>ًں’، ط¨ط¹ط¯ ط§ظ„ط¯ط®ظˆظ„ ط³طھط¸ظ‡ط±:</li>
                    <li>âœ“ ط­ط¯ ط§ط¦طھظ…ط§ظ†ظƒ</li>
                    <li>âœ“ ط¯ظٹظˆظ†ظƒ ط§ظ„ط­ط§ظ„ظٹط©</li>
                    <li>âœ“ ط±طµظٹط¯ظƒ ط§ظ„ظ…طھط§ط­</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Account Statement Modal */}
          {showAccountStatement && customer && (
            <div className={cn("fixed inset-0 flex items-center justify-center z-50 p-4", isDarkMode ? "bg-black/50" : "bg-black/30")}>
              <Card className={cn("w-full max-w-5xl max-h-auto", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200")}>
                <div className={cn("p-6 border-b sticky top-0 z-10", isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white")}>
                  <div className="flex justify-between items-center">
                    <h3 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
                      ًں“‹ ظƒط´ظپ ط§ظ„ط­ط³ط§ط¨ ط§ظ„ظƒط§ظ…ظ„
                    </h3>
                    <button
                      onClick={() => setShowAccountStatement(false)}
                      className={cn("text-xl font-bold", isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")}
                    >
                      âœ•
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Customer Info */}
                  <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-gray-700/30" : "bg-gray-50")}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={cn("text-xs mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ظ„ط¹ظ…ظٹظ„</p>
                        <p className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-gray-900")}>{customer.name}</p>
                        <p className={cn("text-xs mt-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>{customer.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className={cn("min-w-0 p-2 sm:p-3 rounded-lg border-2", isDarkMode ? "bg-blue-900/20 border-blue-600" : "bg-blue-50 border-blue-300")}>
                      <p className={cn("text-[10px] sm:text-[11px] font-normal mb-1", isDarkMode ? "text-blue-400" : "text-blue-600")}>ط­ط¯ ط§ظ„ط§ط¦طھظ…ط§ظ†</p>
                      <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", isDarkMode ? "text-blue-300" : "text-blue-600")}>
                        {Math.round(Number(customer.credit_limit) || 0)?.toLocaleString('en-US')}
                        <span className="block text-[0.9em]">ط¯.ط¹</span>
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg border-2 hidden", isDarkMode ? "bg-purple-900/20 border-purple-600" : "bg-purple-50 border-purple-300")}>
                      <p className={cn("text-[11px] font-normal mb-1", isDarkMode ? "text-purple-400" : "text-purple-600")}>ط§ظ„ط±طµظٹط¯ ط§ظ„ط£ظˆظ„ظٹ</p>
                      <p className={cn("text-lg font-bold", isDarkMode ? "text-purple-300" : "text-purple-600")}>
                        {Math.round(Number(customer.current_debt) || 0)?.toLocaleString('en-US')} ط¯.ط¹
                      </p>
                    </div>
                    <div className={cn("min-w-0 p-2 sm:p-3 rounded-lg border-2", isDarkMode ? "bg-yellow-900/20 border-yellow-600" : "bg-yellow-50 border-yellow-300")}>
                      <p className={cn("text-[10px] sm:text-[11px] font-normal mb-1", isDarkMode ? "text-yellow-400" : "text-yellow-600")}>ط§ظ„ط¯ظٹظˆظ† ط§ظ„ط­ط§ظ„ظٹط©</p>
                      <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", isDarkMode ? "text-yellow-300" : "text-yellow-600")}>
                        {(() => {
                          // ط­ط³ط§ط¨ ط¢ط®ط± ط±طµظٹط¯ ظ…ظ† ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ
                          if (statementTransactions && statementTransactions.length > 0) {
                            const lastTransaction = statementTransactions[0]; // ط§ظ„ط£ط­ط¯ط« ظپظٹ ط§ظ„ط£ط¹ظ„ظ‰
                            const finalDebt = Math.round(Number(lastTransaction.balance) || 0);
                            return finalDebt.toLocaleString('en-US');
                          }
                          return Math.round(Number(customer.current_debt) || 0).toLocaleString('en-US');
                        })()}
                        <span className="block text-[0.9em]">ط¯.ط¹</span>
                      </p>
                    </div>
                    <div className={cn("min-w-0 p-2 sm:p-3 rounded-lg border-2", (() => {
                      const currentDebt = statementTransactions && statementTransactions.length > 0 
                        ? Number(statementTransactions[0]?.balance || 0)
                        : Number(customer.current_debt || 0);
                      return (Number(customer.credit_limit || 0) - currentDebt) <= 0 ? (isDarkMode ? "bg-red-900/20 border-red-600" : "bg-red-50 border-red-300") : (isDarkMode ? "bg-green-900/20 border-green-600" : "bg-green-50 border-green-300");
                    })())}>
                      <p className={cn("text-[10px] sm:text-[11px] font-normal mb-1", (() => {
                        const currentDebt = statementTransactions && statementTransactions.length > 0 
                          ? Number(statementTransactions[0]?.balance || 0)
                          : Number(customer.current_debt || 0);
                        return (Number(customer.credit_limit || 0) - currentDebt) <= 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-green-400" : "text-green-600");
                      })())}>ط§ظ„ط±طµظٹط¯ ط§ظ„ظ…طھط§ط­</p>
                      <p className={cn("text-[clamp(0.95rem,4vw,1.35rem)] font-bold leading-tight break-words", (() => {
                        const currentDebt = statementTransactions && statementTransactions.length > 0 
                          ? Number(statementTransactions[0]?.balance || 0)
                          : Number(customer.current_debt || 0);
                        return (Number(customer.credit_limit || 0) - currentDebt) <= 0 ? (isDarkMode ? "text-red-300" : "text-red-600") : (isDarkMode ? "text-green-300" : "text-green-600");
                      })())}>
                        {(() => {
                          const currentDebt = statementTransactions && statementTransactions.length > 0 
                            ? Number(statementTransactions[0]?.balance || 0)
                            : Number(customer.current_debt || 0);
                          return Math.round(Math.max(0, Number(customer.credit_limit || 0) - currentDebt)).toLocaleString('en-US');
                        })()}
                        <span className="block text-[0.9em]">ط¯.ط¹</span>
                      </p>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div>
                    <h4 className={cn("text-sm font-bold mb-3", isDarkMode ? "text-white" : "text-gray-900")}>
                      ًں“ٹ ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ {isLoadingStatement && <span className="text-xs font-normal">(ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...)</span>}
                    </h4>
                    <div className={cn("border rounded-lg overflow-hidden", isDarkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50")}>
                      {console.log('ًں“‹ Statement Modal Debug:', { 
                        showAccountStatement, 
                        isLoadingStatement, 
                        transactionCount: statementTransactions?.length,
                        transactions: statementTransactions
                      })}
                      {isLoadingStatement ? (
                        <div className="p-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{borderColor: primaryColor}}></div>
                          <p className={cn("mt-2 text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ...</p>
                        </div>
                      ) : !statementTransactions || statementTransactions.length === 0 ? (
                        <div className={cn("p-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                          <p className="text-sm font-semibold mb-2">âڑ ï¸ڈ ظ„ط§ طھظˆط¬ط¯ ظ…ط¹ط§ظ…ظ„ط§طھ</p>
                          <p className="text-xs">ظ‚ط¯ ظ„ظ… ظٹطھظ… طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ط¹ط¯. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.</p>
                        </div>
                      ) : (
                        <div className="max-h-[18rem] overflow-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className={cn("sticky top-0 z-10", isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                            <tr>
                              <th className={cn("px-3 py-2 text-right font-bold border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„طھط§ط±ظٹط®</th>
                              <th className={cn("px-3 py-2 text-right font-bold border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>ط§ظ„ط¨ظٹط§ظ†</th>
                              <th className={cn("px-3 py-2 text-center font-bold border", isDarkMode ? "text-red-400 border-gray-600" : "text-red-600 border-gray-300")}>ظ…ط¯ظٹظ†<br/>(Debit)</th>
                              <th className={cn("px-3 py-2 text-center font-bold border", isDarkMode ? "text-green-400 border-gray-600" : "text-green-600 border-gray-300")}>ط¯ط§ط¦ظ†<br/>(Credit)</th>
                              <th className={cn("px-3 py-2 text-center font-bold border", isDarkMode ? "text-blue-400 border-gray-600" : "text-blue-600 border-gray-300")}>ط§ظ„ط±طµظٹط¯</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statementTransactions && statementTransactions.map((transaction, idx) => {
                              const txDate = transaction.created_at || transaction.date || transaction.transaction_date;
                              const txType = transaction.type || transaction.transaction_type || 'unknown';
                              let txDescription = transaction.description || transaction.notes || transaction.detail || `ظ…ط¹ط§ظ…ظ„ط© #${idx + 1}`;
                              
                              // Translate transaction types to Arabic
                              if (txType === 'opening') {
                                txDescription = transaction.description || 'ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط©';
                              } else if (txType === 'debit') {
                                txDescription = 'ط®طµظ…';
                              } else if (txType === 'topup') {
                                txDescription = transaction.description || 'ط¨ط·ط§ظ‚ط© ط´ط­ظ†';
                              } else if (txType === 'payment') {
                                txDescription = 'âœ“ ط¯ظپط¹ط©';
                              }
                              
                              const txAmount = Math.round(Number(transaction.amount || transaction.value || 0));
                              const txBalance = Math.round(Number(transaction.balance || transaction.current_balance || 0));
                              // Payments (ط¯ظپط¹ط§طھ) are CREDIT (ط¯ط§ط¦ظ†) - they reduce debt
                              // Opening balance (ط¯ظٹظˆظ† ط³ط§ط¨ظ‚ط©) and Topup are DEBIT - they increase debt
                              const isPayment = transaction.is_payment === true || txType === 'payment' || txType === 'payment_received';
                              const isDebit = !isPayment && (transaction.type === 'topup' || txType === 'debit' || txType === 'ظ…ط¯ظٹظ†' || txType === 'ط®طµظ…' || txType === 'opening');
                              const isCredit = isPayment || txType === 'credit' || txType === 'ط±طµظٹط¯' || txType === 'ط¯ط§ط¦ظ†' || txType === 'ط¥ظٹط¯ط§ط¹';
                              
                              // Debug logging for topup transactions
                              if (txType === 'topup') {
                                console.log(`ًں“ٹ [MerchantDashboard Statement] Topup TX #${idx}:`, {
                                  type: txType,
                                  amount: transaction.amount,
                                  txAmount: txAmount,
                                  is_payment: transaction.is_payment,
                                  isPayment: isPayment,
                                  isDebit: isDebit,
                                  isCredit: isCredit
                                });
                              }
                              
                              // Only show ONE value per row: either debit OR credit, not both
                              let debitAmount = 0;
                              let creditAmount = 0;
                              
                              // CRITICAL FIX: For topup transactions, ALWAYS show debit amount
                              if (txType === 'topup') {
                                debitAmount = Math.abs(txAmount);
                                creditAmount = 0;
                              } else if (isDebit && txAmount !== 0) {
                                debitAmount = Math.abs(txAmount);
                                creditAmount = 0;
                              } else if (isCredit && txAmount !== 0) {
                                debitAmount = 0;
                                creditAmount = Math.abs(txAmount);
                              }
                              
                              return (
                                <tr key={idx} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-100")}>
                                  <td className={cn("px-3 py-2 border text-right", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                                    {txDate ? new Date(txDate).toLocaleDateString('ar-IQ') : 'â€”'}
                                  </td>
                                  <td className={cn("px-3 py-2 border text-right", isDarkMode ? "text-gray-300 border-gray-700" : "text-gray-700 border-gray-200")}>
                                    {txDescription}
                                  </td>
                                  <td className={cn("px-3 py-2 border text-center font-bold", debitAmount > 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : (isDarkMode ? "text-gray-500" : "text-gray-400"))}>
                                    {debitAmount > 0 ? debitAmount.toLocaleString('en-US') : 'â€”'}
                                  </td>
                                  <td className={cn("px-3 py-2 border text-center font-bold", creditAmount > 0 ? (isDarkMode ? "text-green-400" : "text-green-600") : (isDarkMode ? "text-gray-500" : "text-gray-400"))}>
                                    {creditAmount > 0 ? creditAmount.toLocaleString('en-US') : 'â€”'}
                                  </td>
                                  <td className={cn("px-3 py-2 border text-center font-bold", isDarkMode ? "text-blue-300" : "text-blue-700")}>
                                    {txBalance.toLocaleString('en-US')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-1 gap-3 mt-6">
                    <button
                      onClick={handleLogout}
                      className={cn("py-2 px-3 rounded text-sm font-normal hidden", isDarkMode ? "bg-red-900 text-red-100 hover:bg-red-800" : "bg-red-100 text-red-700 hover:bg-red-200")}
                    >
                      ط®ط±ظˆط¬
                    </button>
                    <button
                      onClick={() => setShowAccountStatement(false)}
                      className={cn("py-2 px-3 rounded text-sm font-normal text-white transition-colors", isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-400 hover:bg-gray-500")}
                    >
                      ط¥ط؛ظ„ط§ظ‚
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
        
        {/* Filters and Products Content */}
        <div className="max-w-6xl mx-auto px-4 py-0">
          {/* Products Grid */}
          {showPurchaseForm && selectedProduct && !customer && (
            <Card className={cn("mt-6 border-2", isDarkMode ? "bg-gray-800 border-indigo-700" : "bg-indigo-50 border-indigo-200")}> 
              <div className="p-6 space-y-4">
                <div>
                  <h3 className={cn("text-lg font-normal mb-4", isDarkMode ? "text-white" : "text-gray-900")}>ًں“‌ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط±ط§ط،</h3>
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًں‘¤ ط§ظ„ط§ط³ظ…</label>
                  <input 
                    type="text"
                    value={purchaseForm.name}
                    onChange={(e) => setPurchaseForm({...purchaseForm, name: e.target.value})}
                    placeholder="ط£ط¯ط®ظ„ ط§ط³ظ…ظƒ"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًں“± ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ</label>
                  <input 
                    type="tel"
                    value={purchaseForm.phone}
                    onChange={(e) => setPurchaseForm({...purchaseForm, phone: e.target.value})}
                    placeholder="07xxxxxxxxx"
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  />
                </div>

                <div>
                  <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>ًںڈھ ظ†ظˆط¹ ط§ظ„ط¹ظ…ظٹظ„</label>
                  <select 
                    value={purchaseForm.customer_type}
                    onChange={(e) => setPurchaseForm({...purchaseForm, customer_type: e.target.value as 'cash' | 'reseller'})}
                    className={cn("w-full px-3 py-2 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}
                  >
                    <option value="cash">ًں‘¤ ط¹ظ…ظٹظ„ ظ†ظ‚ط¯ظٹ (ظ…ظپط±ط¯)</option>
                    <option value="reseller">ًںڈھ ظ†ظ‚ط·ط© ط¨ظٹط¹ (ط¬ظ…ظ„ط©)</option>
                  </select>
                  <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    ط§ظ„ط³ط¹ط±: {formatCurrency(getDisplayPrice())} ط¯.ط¹ / ط¨ط·ط§ظ‚ط©
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className={cn("py-2 rounded-lg text-white font-normal text-sm transition-all hover:scale-[1.02] active:scale-95", isProcessing ? "opacity-50" : "")}
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isProcessing ? 'ط¬ط§ط±ظٹ...' : 'âœ“ ط´ط±ط§ط،'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPurchaseForm(false);
                      setPurchaseForm({ name: '', phone: '', customer_type: 'cash' });
                    }}
                    className={cn("py-2 rounded-lg text-white font-normal text-sm transition-all hover:scale-[1.02] active:scale-95", isDarkMode ? "bg-gray-700" : "bg-gray-400")}
                  >
                    âœ• ط¥ظ„ط؛ط§ط،
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Product Images Gallery - 100% Width */}
          <div className="w-full mx-auto">
            {console.log('ًں”چ DEBUG TopupStorefront:', {
              productsCount: products.length,
              filteredProductsCount: filteredProducts.length,
              selectedCompany,
              loading,
              hasImages: filteredProducts.some(p => Array.isArray(p.images) && p.images.length > 0)
            })}
            <h2 className={cn("text-2xl font-normal mb-6", isDarkMode ? "text-white" : "text-gray-900")}>ï؟½ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…طھط§ط­ط© ظ„ظ„ط´ط±ط§ط،</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4" key={`products-list-${products.length}-${Date.now()}`}>
              {filteredProducts
                .map((product: any) => {
                // Get images count for this product
                const productImages = Array.isArray(product.images) 
                  ? product.images.filter((img: any) => img && String(img).length > 0)
                  : [];
                const imagesCount = productImages.length;
                
                // Log all products for debugging
                console.log(`ًں“‹ Product ${product.id}: amount=${product.amount}, price=${product.price}, images=${imagesCount}`, product);

                // Calculate price based on customer type
                const displayPrice = (() => {
                  // If customer is not logged in, use wholesale price
                  if (!customer) {
                    return product.wholesale_price || product.price || 0;
                  }
                  // If customer is reseller and has retail price, use it
                  if (customer.customer_type === 'reseller' && product.retail_price) {
                    return product.retail_price;
                  }
                  // Otherwise use wholesale price
                  return product.wholesale_price || product.price || 0;
                })();
                
                return (
                  <motion.div
                    key={`product-${product.id}`}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "rounded-lg border-2 p-3 transition-all relative scale-100 origin-center",
                      isDarkMode ? "border-indigo-700 hover:border-indigo-600 bg-gray-800" : "border-indigo-400 hover:border-indigo-500 bg-white"
                    )}
                  >
                    {/* Company Name and Product Amount in One Line */}
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="text-base font-bold text-gray-300">{product.company_name || 'ط؛ظٹط± ظ…ط­ط¯ط¯'}</div>
                      <div className={cn("text-base font-bold whitespace-nowrap", isDarkMode ? "text-blue-400" : "text-indigo-600")}> 
                        {formatNumber(product.amount || 0)}
                      </div>
                    </div>

                    {/* Price info */}
                    <div className="mb-2">
                      <div className="text-xs font-bold text-green-700">
                        ط§ظ„ط³ط¹ط±: {formatNumber(displayPrice || 0)} ط¯.ط¹ {imagesCount > 0 ? `â€¢ ${imagesCount} طµظˆط±ط©` : 'â€¢ ط¨ط¯ظˆظ† طµظˆط±'}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mb-3">
                      <label className="block text-xs font-normal mb-1">ط§ظ„ظƒظ…ظٹط©:</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max={imagesCount || 100}
                          defaultValue="1"
                          id={`qty-${product.id}`}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded text-xs border-2 transition-all",
                            isDarkMode 
                              ? "bg-gray-700 border-gray-600 text-white focus:border-indigo-500" 
                              : "bg-white border-gray-300 text-gray-900 focus:border-indigo-500"
                          )}
                        />
                        <span className={cn("text-xs font-normal leading-6 px-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                          max: {imagesCount}
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        const qtyInput = document.getElementById(`qty-${product.id}`) as HTMLInputElement;
                        const quantity = parseInt(qtyInput?.value || '1');
                        
                        // Get images for this quantity
                        const imagesToAdd = productImages.slice(0, quantity);
                        
                        console.log('ًں›’ Adding product to cart:', {
                          productId: product.id,
                          quantity,
                          imagesCount: imagesToAdd.length,
                          customerType: customer?.customer_type,
                          price: displayPrice
                        });
                        
                        // Add item with images based on quantity
                        addItem({ 
                          ...product,
                          price: displayPrice,
                          images: imagesToAdd, // Add selected images
                          quantity,
                          store_type: 'topup',
                          store_id: actualStoreId || parseInt(storeId || '0')
                        });
                        playAddToCartSound();
                        
                        // Reset quantity
                        if (qtyInput) qtyInput.value = '1';
                      }}
                      disabled={imagesCount === 0}
                      className={cn(
                        "w-full py-1.5 px-2 rounded text-xs font-normal transition-all flex items-center justify-center gap-2",
                        imagesCount === 0
                          ? isDarkMode ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isDarkMode ? "bg-green-900 hover:bg-green-800 text-green-200" : "bg-green-100 hover:bg-green-200 text-green-700"
                      )}
                      title={imagesCount === 0 ? "ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ…طھط§ط­ط©" : "ط¥ط¶ط§ظپط© ظ„ظ„ط³ظ„ط©"}
                    >
                      <ShoppingCart size={16} />
                      <span>ط£ط¶ظپ</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className={cn("text-center py-8", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
                    <p className="text-lg font-normal">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p>
                  </>
                ) : filteredProducts.length === 0 ? (
                  <>
                    <p className="text-lg font-normal mb-2">ًں“¸ ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ</p>
                    <p className="text-sm">ط§ط®طھط± ط´ط±ظƒط© ظ…ظ† ط§ظ„ظپظ„طھط± ط£ط¹ظ„ط§ظ‡</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-normal mb-2">ًں“¸ ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ…طھط§ط­ط©</p>
                    <p className="text-sm">ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…طھط§ط­ط© ظ„ط§ طھط­طھظˆظٹ ط¹ظ„ظ‰ طµظˆط±. طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ظ…طھط¬ط±.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Closing flex-1 overflow-y-auto div */}
      </div>
      <div className="flex-shrink-0 border-t" style={isDarkMode ? {borderColor: '#374151'} : {borderColor: '#f3f4f6'}}>
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
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Refresh customer debt when page loads
  const refreshCustomerDebt = async () => {
    try {
      const topupCustomer = localStorage.getItem('topupCustomer');
      if (!topupCustomer) return;
      
      const customer = JSON.parse(topupCustomer);
      if (!customer.customer_id) return;
      
      console.log('ًں”„ [TopupOrderDetails] Refreshing customer debt...');
      const response = await fetch(`/api/customers/${customer.customer_id}/statement`);
      
      if (response.ok) {
        const transactions = await response.json();
        
        // Calculate final balance from transactions
        let finalBalance = 0;
        if (Array.isArray(transactions)) {
          const lastTransaction = transactions[transactions.length - 1];
          if (lastTransaction) {
            finalBalance = Number(lastTransaction.balance) || 0;
          }
        }
        
        console.log('ًں“ٹ [TopupOrderDetails] Updated debt:', finalBalance);
        
        // Update customer with new debt
        const updatedCustomer = {
          ...customer,
          current_debt: finalBalance
        };
        localStorage.setItem('topupCustomer', JSON.stringify(updatedCustomer));
        console.log('âœ… [TopupOrderDetails] Customer debt saved to localStorage');
      }
    } catch (err) {
      console.error('[TopupOrderDetails] Error refreshing debt:', err);
    }
  };

  useEffect(() => {
    // Refresh customer debt when page loads
    refreshCustomerDebt();

    const loadOrderData = async () => {
      try {
        let loadedImages: string[] = [];
        let loadedCodes: string[] = [];

        try {
          const imagesRes = await fetch(`/api/topup/order-images/${orderId}`);
          if (imagesRes.ok) {
            const imagesData = await imagesRes.json();
            loadedImages = parseImageCollection(imagesData.images).map(getSafeImageUrl);
          }
        } catch (error) {
          console.error('[TopupOrderDetails] Error loading order-images:', error);
        }

        try {
          const codesRes = await fetch(`/api/topup/order-codes/${orderId}`);
          const codesData = await codesRes.json();
          loadedCodes = Array.isArray(codesData.codes) ? codesData.codes : [];

          if (loadedImages.length === 0) {
            loadedImages = parseImageCollection(codesData.images || codesData.codes).map(getSafeImageUrl);
          }

          if (loadedImages.length === 0 && codesData.store_id) {
            const productsRes = await fetch(`/api/topup/products/${codesData.store_id}`);
            if (productsRes.ok) {
              const productsData = await productsRes.json();
              if (Array.isArray(productsData)) {
                const matchingProduct = productsData.find((product: any) => {
                  const amountValue = Number(product?.amount ?? product?.price ?? 0);
                  return loadedCodes.some((code: string) => String(code).includes(String(amountValue)));
                });

                if (matchingProduct) {
                  loadedImages = getProductImageCandidates(matchingProduct);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading codes:', error);
        }

        setCodes(loadedCodes);
        setImages(Array.from(new Set(loadedImages.filter(Boolean))).slice(0, Math.max(loadedCodes.length, loadedImages.length, 1)));
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  const copyAllCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-4 sm:p-8 text-center">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط£ظƒظˆط§ط¯ظƒ...</div>;

  return (
    <div className={cn("min-h-screen p-4 sm:p-8", isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")} dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal mb-2">ط´ظƒط±ط§ظ‹ ظ„ظƒ! ًںژ‰</h1>
          <p className={cn(isDarkMode ? "text-gray-400" : "text-gray-600")}>طھظ… ط§ط³طھظ„ط§ظ… ط·ظ„ط¨ظƒ ط¨ظ†ط¬ط§ط­</p>
        </div>

        <Card className={cn(isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50")}>
          <div className={cn("p-6 border-b border-green-500", isDarkMode ? "border-green-900" : "")}>
            <h2 className="font-normal text-lg text-green-600">ط£ظƒظˆط§ط¯ظƒ ط§ظ„ط®ط§طµط©</h2>
            <p className={cn("text-xs mt-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>ط§ط­ظپط¸ ظ‡ط°ظ‡ ط§ظ„ط£ظƒظˆط§ط¯ ظپظٹ ظ…ظƒط§ظ† ط¢ظ…ظ†</p>
          </div>

          <div className="p-6 border-b border-gray-200 space-y-3">
            <h3 className={cn("font-normal text-base", isDarkMode ? "text-gray-200" : "text-gray-800")}>ط§ظ„طµظˆط±</h3>
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {images.map((imageUrl, idx) => {
                  const imageCandidates = parseImageCollection(imageUrl);
                  const primaryImage = imageCandidates[0] || PLACEHOLDER_IMAGE;

                  return (
                    <button
                      key={`${primaryImage}-${idx}`}
                      type="button"
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedImage(primaryImage);
                        setShowImageModal(true);
                      }}
                    >
                      <img
                        src={primaryImage}
                        data-image-index="0"
                        alt={`طµظˆط±ط© ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300 hover:border-blue-500 hover:scale-105 transition-all"
                        onError={(event) => handleImageFallback(event, imageCandidates)}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">ظ„ط§ طھظˆط¬ط¯ طµظˆط± ظ…طھط§ط­ط©</p>
            )}
          </div>

          <div className="p-6 space-y-3">
            {codes.length > 0 ? (
              codes.map((code, idx) => (
                <div key={idx} className={cn("p-4 rounded-lg border-2 font-mono text-lg font-normal", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200")}>
                  {code}
                </div>
              ))
            ) : (
              <div className={cn("p-4 rounded-lg border text-sm", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-white border-gray-200 text-gray-500")}>
                ظ„ط§ طھظˆط¬ط¯ ط£ظƒظˆط§ط¯ ظ…طھط§ط­ط© ظ„ظ‡ط°ط§ ط§ظ„ط·ظ„ط¨
              </div>
            )}
          </div>

          <div className={cn("p-4 border-t", isDarkMode ? "border-gray-700" : "border-gray-200")}>
            <button
              onClick={copyAllCodes}
              className="w-full py-3 rounded-lg font-normal transition-all"
              style={{ backgroundColor: copied ? '#22c55e' : '#3b82f6', color: 'white' }}
            >
              {copied ? 'âœ“ طھظ… ط§ظ„ظ†ط³ط®!' : 'ظ†ط³ط® ط¬ظ…ظٹط¹ ط§ظ„ط£ظƒظˆط§ط¯'}
            </button>
          </div>
        </Card>

        <div className={cn("mt-8 p-4 rounded-lg", isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700")}>
          <p className="text-sm font-normal">ًں’، ظ†طµظٹط­ط©: ط³ظٹطھظ… ط¥ط±ط³ط§ظ„ ط§ظ„ط£ظƒظˆط§ط¯ ط¹ط¨ط± طھظ„ظٹط¬ط±ط§ظ… ط£ظٹط¶ط§ظ‹ ط¹ظ„ظ‰ ط§ظ„ظ…ط¹ط±ظ‘ظپ ط£ظˆ ط§ظ„ط±ظ‚ظ… ط§ظ„ظ…ط³ط¬ظ„</p>
        </div>

        <button
          onClick={() => navigate(`/topup/${storeId}`)}
          className={cn("w-full mt-8 py-3 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300")}
        >
          â†گ ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظ…طھط¬ط±
        </button>

        {showImageModal && selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-2xl max-h-screen" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-300"
              >
                âœ•
              </button>
              <img src={selectedImage} alt="طµظˆط±ط© ظƒط§ظ…ظ„ط©" className="w-full h-full object-contain rounded-lg" onError={(e: any) => e.target.style.display = 'none'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;




