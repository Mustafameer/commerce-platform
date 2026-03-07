import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product } from './types';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('user');
    if (!saved || saved === 'undefined') return null;
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));

// اعادة تحميل user من localStorage عند تحميل الصفحة
if (typeof window !== 'undefined') {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.id) {
        useAuthStore.getState().setUser(user);
      }
    } catch (e) {
      // ignore parse errors
    }
  }
}

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: any | null;
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setAppliedCoupon: (coupon: any | null) => void;
  total: number;
}

const createCartStore = (storageKey: string) =>
  create<CartState>(
    persist(
      (set, get) => ({
        items: [],
        appliedCoupon: null,
        addItem: (product) => {
          const items = get().items;
          const existing = items.find((i) => i.id === product.id);
          const quantityToAdd = product.quantity || 1;
          if (existing) {
            set({
              items: items.map((i) =>
                i.id === product.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
              ),
            });
          } else {
            set({ items: [...items, { ...product, quantity: quantityToAdd }] });
          }
        },
        removeItem: (productId) => {
          set({ items: get().items.filter((i) => i.id !== productId) });
        },
        updateQuantity: (productId, quantity) => {
          set({
            items: get().items.map((i) =>
              i.id === productId ? { ...i, quantity } : i
            ),
          });
        },
        clearCart: () => set({ items: [], appliedCoupon: null }),
        setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
        get total() {
          return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
      }),
      {
        name: storageKey,
        partialize: (state) => ({
          items: state.items,
          appliedCoupon: state.appliedCoupon,
        }),
      }
    )
  );

export const useCartStore = createCartStore('cart-store');
export const useRegularCartStore = createCartStore('regular-cart-store');

interface SettingsState {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  setSettings: (settings: { app_name: string; logo_url: string; primary_color?: string }) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  return {
    appName: 'منصتي',
    logoUrl: '',
    primaryColor: '#4F46E5',
    setSettings: function(settings) {
      console.log('📝 setSettings called with:', settings);
      set({ 
        appName: settings.app_name, 
        logoUrl: settings.logo_url,
        primaryColor: settings.primary_color || '#4F46E5'
      });
    },
    resetSettings: function() {
      console.log('🔄 resetSettings called');
      set({
        appName: 'منصتي',
        logoUrl: '',
        primaryColor: '#4F46E5'
      });
    }
  };
});

interface SearchState {
  dashboardQuery: string;
  setDashboardQuery: (query: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  dashboardQuery: '',
  setDashboardQuery: (query) => set({ dashboardQuery: query }),
}));

interface RefreshState {
  productsRefreshTime: number;
  triggerProductsRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
  productsRefreshTime: 0,
  triggerProductsRefresh: () => set({ productsRefreshTime: Date.now() }),
}));

interface DarkModeState {
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

export const useDarkModeStore = create<DarkModeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      setIsDarkMode: (dark) => set({ isDarkMode: dark }),
      toggleDarkMode: () => set({ isDarkMode: !get().isDarkMode }),
    }),
    {
      name: 'darkMode',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
