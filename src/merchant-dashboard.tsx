import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-m';
import { useAuthStore, useSearchStore, useSettingsStore } from './store';
import type { Product } from './types';
import { useTheme } from './theme';
import { Button, Card, DashboardLayout, cn, formatCurrency, formatDateOnly, formatNumber, getSafeImageUrl, loadJSZip } from './App';

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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 700 : false);
  const { section } = useParams();
  const navigate = useNavigate();
  
  console.log('🔧 MerchantDashboard - section:', section, 'orders length:', orders.length);
  const logoUploadRef = useRef<HTMLInputElement>(null);

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
  const getEmptyProductForm = () => ({
    name: '',
    description: '',
    price: '',
    retail_price: '',
    wholesale_price: '',
    stock: '',
    image_url: '',
    category_id: categories.length > 0 ? categories[0].id.toString() : '',
    gallery: [] as string[],
    topup_codes_text: '',
    auction_date: '',
    auction_start_time: '',
    auction_end_time: '',
    auction_price: '',
    is_auction: false
  });
  const resetProductModalState = () => {
    setProductForm(getEmptyProductForm());
    setIsEditingProduct(null);
    setTopupCodesFile(null);
    setTopupCodesPreview([]);
    setTopupCodesMessage(null);
  };
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
            const newUser = {
              ...user,
              store_id: myStore.id,
              store_type: myStore.store_type || user.store_type || 'regular',
              store_active: myStore.is_active !== false,
              store_status: myStore.status || (myStore.is_active === false ? 'suspended' : 'active'),
            };
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
      console.log('📥 MerchantDashboard - Fetching data for store:', user.store_id, 'Type:', user?.store_type, '❗ Type check:', user?.store_type === 'topup' ? 'TOPUP' : 'REGULAR');
      
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
        console.log('✅ Data fetched:', { products: products?.length, categories: categories?.length });
        console.log('📦 RAW PRODUCTS FROM API:', {
          count: Array.isArray(products) ? products.length : 'NOT_ARRAY',
          products: Array.isArray(products) ? products.map((p: any) => ({ id: p.id, name: p.name, category_name: p.category_name })) : products
        });
        setProducts(Array.isArray(products) ? products : []);
        
        const validCategories = Array.isArray(categories) ? categories.filter(c => c && c.name) : [];
        console.log('✅ Valid categories:', validCategories);
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
        console.log('🔄 AUTO-REFRESH products from API:', {
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
        setSalesReportError(data.error || 'تعذر تحميل تقرير المبيعات');
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
      setSalesReportError('تعذر تحميل تقرير المبيعات');
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
      alert("عذراً، لم يتم العثور على معرّف المتجر!");
      return;
    }
    console.log('🎯 handleCreateProduct triggered');
    resetProductModalState();
    console.log('🎯 About to setShowProductModal(true)');
    setShowProductModal(true);
    console.log('🎯 setShowProductModal called');
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
      
      console.log('✅ Base form data initialized');
      
      // Check if product is auction
      const isAuction = p.is_auction === true || p.is_auction === 'true' || p.is_auction === 1;
      console.log('🔍 Product is_auction raw:', p.is_auction, '| Determined as:', isAuction);
      
      formData.is_auction = isAuction;
      
      // If auction product, read auction data directly from product columns (NEW: No API call needed!)
      if (isAuction && p.id) {
        // ✅ SIMPLE: Data now comes as strings from API (converted by TO_CHAR in SQL)
        let parsedDate = String(p.auction_date || '').trim();
        let parsedStartTime = String(p.auction_start_time || '').trim();
        let parsedEndTime = String(p.auction_end_time || '').trim();
        let parsedPrice = String(p.auction_price || '').trim();
        
        console.log('✨ Auction data from API (already formatted as strings):');
        console.log('   - auction_date:', parsedDate, '(type:', typeof parsedDate + ')');
        console.log('   - auction_start_time:', parsedStartTime);
        console.log('   - auction_end_time:', parsedEndTime);
        console.log('   - auction_price:', parsedPrice);
        
        // Update formData
        formData.auction_date = parsedDate;
        formData.auction_start_time = parsedStartTime;
        formData.auction_end_time = parsedEndTime;
        formData.auction_price = parsedPrice;
        
        console.log('🔍 FORM DATA AFTER LOAD:');
        console.log('   auction_date:', formData.auction_date);
        console.log('   auction_start_time:', formData.auction_start_time);
        console.log('   auction_end_time:', formData.auction_end_time);
        console.log('   auction_price:', formData.auction_price);
      } else {
        console.log('ℹ️ Not an auction product');
      }
      
      console.log('🔹 FINAL formData:', formData);
      
      // Set all state at once
      setProductForm(formData);
      setTopupCodesFile(null);
      setTopupCodesMessage(null);
      setIsEditingProduct(p.id);
      setShowProductModal(true);
      
      console.log('✅✅✅ Modal opened with data!');
      
    } catch (err: any) {
      console.error('💥 ERROR:', err.message, err);
      alert('❌ خطأ: ' + (err?.message || 'فشل تحميل بيانات المنتج'));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    resetProductModalState();
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
    console.log('🚀 SAVE PRODUCT CLICKED');
    console.log('productForm:', JSON.stringify(productForm, null, 2));
    const isTopupStore = user?.store_type === 'topup';
    const wasEditingProduct = !!isEditingProduct;
    
    // Check if it's auction
    console.log('✅ is_auction:', productForm.is_auction);
    console.log('✅ auction_date:', productForm.auction_date);
    console.log('✅ auction_start_time:', productForm.auction_start_time);
    console.log('✅ auction_end_time:', productForm.auction_end_time);
    console.log('✅ auction_price:', productForm.auction_price);
    
    console.log('🚀 SAVE PRODUCT - productForm:', {
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
    
    if (!productForm.image_url && !isEditingProduct) {
      alert("❌ يرجى اختيار صورة للمنتج");
      return;
    }

    // ✅ Initialize body and URL
    const body: any = {
      store_id: user.store_id,
      category_id: productForm.category_id ? parseInt(productForm.category_id) : null
    };
    
    const url = isEditingProduct ? `/api/products/${isEditingProduct}` : '/api/products';
    const method = isEditingProduct ? 'PUT' : 'POST';

    if (isTopupStore) {
      // For topup store: send company_id, amount, and prices
      if (!productForm.company_id) {
        alert('❌ يرجى اختيار الشركة');
        return;
      }
      if (!productForm.amount) {
        alert('❌ يرجى إدخال المبلغ');
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
      
      // ✅ ALWAYS include is_auction flag and auction data (even if false)
      body.is_auction = productForm.is_auction === true;
      body.auction_date = auctionDateValue;
      body.auction_start_time = auctionStartValue;
      body.auction_end_time = auctionEndValue;
      body.auction_price = auctionPriceValue;
      
      // Add auction flag and data if applicable
      if (productForm.is_auction === true) {
        // ✅ CRITICAL VALIDATION: Ensure all auction fields are provided
        // Check without trim() because date/time inputs return clean values
        if (!auctionDateValue || !auctionStartValue || !auctionEndValue || !auctionPriceValue) {
          const missingFields = [];
          if (!auctionDateValue) missingFields.push('التاريخ');
          if (!auctionStartValue) missingFields.push('وقت البداية');
          if (!auctionEndValue) missingFields.push('وقت النهاية');
          if (!auctionPriceValue) missingFields.push('السعر الأساسي');
          
          console.warn('❌ VALIDATION FAILED - Missing fields:', missingFields);
          alert(`❌ يرجى ملء جميع حقول المزاد:\n${missingFields.join('\n')}`);
          return;
        }
        
        console.log('✅ AUCTION FIELDS VALIDATED AND WILL BE SENT:');
        console.log('   is_auction:', body.is_auction);
        console.log('   auction_date:', body.auction_date);
        console.log('   auction_start_time:', body.auction_start_time);
        console.log('   auction_end_time:', body.auction_end_time);
        console.log('   auction_price:', body.auction_price);
      }
    }
    
    console.log('📝 FULL BODY BEING SENT:', { 
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
    
    console.log('📤 SENDING FETCH REQUEST TO:', url);
    console.log('📤 METHOD:', method);
    console.log('📤 FULL BODY JSON:', JSON.stringify(body, null, 2));
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      // Log response status
      console.log(`📡 API Response Status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const responseData = await res.json();
        const savedProduct = responseData?.product || responseData;
        const savedProductId = savedProduct?.id;
        console.log('✅ PRODUCT SAVED:', { id: savedProductId, name: savedProduct?.name || productForm.name });

        if (savedProduct) {
          setProducts(prev => {
            if (wasEditingProduct) {
              return prev.map(product => product.id === savedProduct.id ? { ...product, ...savedProduct } : product);
            }

            return [savedProduct, ...prev.filter(product => product.id !== savedProduct.id)];
          });
        }

        setShowProductModal(false);
        resetProductModalState();
        
        // ✅ Reload products from API to ensure data is synced
        try {
          const productsRes = await fetch(`/api/products?storeId=${user.store_id}`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(Array.isArray(productsData) ? productsData : []);
            console.log('✅ Products reloaded from API after save');
          }
        } catch (e) {
          console.error('⚠️ Error reloading products:', e);
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
        
        // 🔴 DEBUG: Log conditions BEFORE auction check
        const debugCondition = {
          isTopupStore,
          productFormIsAuction: productForm.is_auction,
          savedProductId,
          notTopupStore: !isTopupStore,
          hasAuction: productForm.is_auction,
          hasSavedProductId: !!savedProductId,
          finalCondition: !isTopupStore && productForm.is_auction && savedProductId
        };
        console.log('🔴 SAVE CONDITIONS:', debugCondition);
        console.log('🔴 AFTER PRODUCT SAVED - AUCTION DATA:', {
          is_auction: productForm.is_auction,
          auction_was_created_at_backend: true,
          product_saved: productForm.name
        });
        
        // ✅ Reload auctions after product save (product creation already handled auction creation)
        if (productForm.is_auction) {
          try {
            const merchantAuctions = await fetchMerchantAuctions(user?.store_id);
            console.log('✅ Auctions reloaded:', merchantAuctions.length);
          } catch (e) {
            console.error('⚠️ Error reloading auctions:', e);
          }
        } else {
          try {
            await fetchMerchantAuctions(user?.store_id);
          } catch (e) {
            console.error('⚠️ Error syncing auctions after save:', e);
          }
        }

        try {
          const { triggerProductsRefresh } = useRefreshStore.getState();
          triggerProductsRefresh();
          console.log('✅ Products refresh triggered for CustomerStorefront');
        } catch (refreshError) {
          console.error('⚠️ Error triggering storefront refresh:', refreshError);
        }

        // Show success message
        alert(wasEditingProduct ? '✅ تم التعديل بنجاح' : '✅ تمت الإضافة بنجاح');
      } else {
        console.error('❌ SAVE FAILED - Response status:', res.status);
        const errText = await res.text();
        let errMsg = "فشل الحفظ";
        try {
          const errObj = JSON.parse(errText);
          errMsg = errObj.error || errMsg;
        } catch (e) {
          errMsg = errText || errMsg;
        }
        console.error('❌ Error details:', errMsg);
        alert("❌ خطأ من السيرفر: " + errMsg);
      }
    } catch (err) {
      console.error('❌ EXCEPTION CAUGHT:', err);
      alert("❌ حدث خطأ أثناء الاتصال بالسيرفر. تأكد أن حجم الصورة ليس كبيراً جداً.");
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
        alert("✅ تمت إضافة العميل بنجاح");
        setShowCustomerModal(false);
        setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
        
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
        alert("✅ تم تحديث بيانات العميل بنجاح");
        setShowCustomerModal(false);
        setIsEditingCustomer(null);
        setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
        
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
    if (user?.store_type !== 'topup') {
      alert("هذه الشاشة تعرض بيانات مشتقة من الطلبات، لذلك لا يتوفر حذف عميل منها.");
      return;
    }

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
        alert(`✅ ${data.message || 'تمت العملية بنجاح'}`);
        
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

  const isMerchantStoreBlocked = user?.role === 'merchant' && (
    user.store_active === false ||
    (typeof user.store_status === 'string' && user.store_status.length > 0 && user.store_status !== 'approved' && user.store_status !== 'active')
  );

  if (isMerchantStoreBlocked) {
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

  // Product modal with all form fields
  const renderProductModal = () => {
    console.log('[MODAL] renderProductModal check:', showProductModal);
    if (!showProductModal) return null;
    const isTopupStore = user?.store_type === 'topup';

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={cn("rounded-[2.5rem] w-full max-w-lg shadow-2xl border overflow-hidden", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
        >
          <div className={cn("p-8 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
            <div>
              <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>{isEditingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>{isTopupStore ? 'منتج شحن' : 'منتج عادي'}</p>
            </div>
            <button onClick={closeProductModal} className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}>
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Name & Category in one row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>اسم المنتج *</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => updateProductForm({ name: e.target.value })}
                  placeholder="مثال: شحن موبايل"
                  className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>القسم *</label>
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
              <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>وصف المنتج</label>
              <textarea
                value={productForm.description || ''}
                onChange={(e) => updateProductForm({ description: e.target.value })}
                placeholder="أضف وصفاً مختصراً للمنتج يظهر للزبائن"
                rows={3}
                className={cn("w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal outline-none resize-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
              />
            </div>

            {/* Stock & Price in one row */}
            {isTopupStore ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>الكمية المتاحة *</label>
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
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>سعر البيع *</label>
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
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>الكمية المتاحة *</label>
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
                  <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>السعر *</label>
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
                      يتم التحكم بهذا الحقل تلقائياً من خلال "السعر الأساسي" للمزاد.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Additional prices for topup */}
            {isTopupStore && (
              <div className="space-y-2">
                <label className={cn("text-sm font-normal block", isDarkMode ? "text-gray-300" : "text-gray-700")}>سعر الجملة (اختياري)</label>
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
                <label className={cn("text-sm font-normal block mr-1", isDarkMode ? "text-gray-300" : "text-gray-700")}>{`صور المنتج (يمكن اختيار عدة صور)`}</label>
                <div className="flex flex-col gap-4">
                  {/* Main Image Upload */}
                  <div>
                    <p className={cn("text-xs font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>الصورة الرئيسية:</p>
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
                            <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>اختر الصورة الرئيسية</p>
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
                      placeholder="أو ضع رابطاً مباشراً..."
                      className={cn("w-full px-5 py-3 border rounded-xl font-normal outline-none text-xs mt-2", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500" : "bg-gray-50 border-black/5 placeholder-gray-400")}
                    />
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>صور إضافية:</p>
                      <span className={cn("text-[10px] font-normal px-2 py-1 rounded", isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600")}>{(productForm.gallery || []).length} صور</span>
                    </div>
                    <label className="cursor-pointer group relative">
                      <div className={cn("w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all", isDarkMode ? "border-gray-600 bg-gray-700 group-hover:bg-gray-600 group-hover:border-gray-500" : "border-blue-100 bg-blue-50/30 group-hover:bg-blue-50 group-hover:border-blue-300")}>
                        <Plus size={24} className={isDarkMode ? "text-gray-400 mb-1" : "text-blue-400 mb-1"} />
                        <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-blue-600")}>أضف صور إضافية (اختياري)</p>
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
                      <p className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-600")}>معاينة الصور الإضافية:</p>
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
                  هذا منتج مزاد
                </label>
                {productForm.is_auction && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>📅 تاريخ المزاد</label>
                        <input 
                          type="date" 
                          name="auction_date"
                          value={productForm.auction_date || ''}
                          onChange={(e) => {
                            console.log('📅 Date changed to:', e.target.value);
                            updateProductForm({ auction_date: e.target.value });
                          }}
                          onFocus={() => {
                            console.log('📅 DATE FIELD FOCUSED - Current value:', productForm.auction_date, 'Type:', typeof productForm.auction_date);
                          }}
                          placeholder="yyyy-mm-dd"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_date && <p className="text-xs text-blue-500 mt-1">✓ محفوظ: {productForm.auction_date}</p>}
                      </div>
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>💰 السعر الأساسي</label>
                        <input 
                          type="number" 
                          name="auction_price"
                          value={productForm.auction_price || ''}
                          onChange={(e) => {
                            console.log('💰 Price changed to:', e.target.value);
                            syncAuctionPriceFields(e.target.value);
                          }}
                          placeholder="السعر الأساسي"
                          min="0"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_price && <p className="text-xs text-blue-500 mt-1">✓ {productForm.auction_price}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>⏱️ وقت البداية</label>
                        <input 
                          type="time" 
                          name="auction_start_time"
                          value={productForm.auction_start_time || ''}
                          onChange={(e) => {
                            console.log('⏱️ Start time changed to:', e.target.value);
                            updateProductForm({ auction_start_time: e.target.value });
                          }}
                          placeholder="09:00"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_start_time && <p className="text-xs text-blue-500 mt-1">✓ {productForm.auction_start_time}</p>}
                      </div>
                      <div>
                        <label className={cn("text-xs font-normal block mb-1", isDarkMode ? "text-gray-400" : "text-gray-600")}>⏲️ وقت النهاية</label>
                        <input 
                          type="time" 
                          name="auction_end_time"
                          value={productForm.auction_end_time || ''}
                          onChange={(e) => {
                            console.log('⏲️ End time changed to:', e.target.value);
                            updateProductForm({ auction_end_time: e.target.value });
                          }}
                          placeholder="18:00"
                          required
                          className={cn("w-full px-3 py-2 border rounded-lg text-xs font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-black/10")}
                        />
                        {productForm.auction_end_time && <p className="text-xs text-blue-500 mt-1">✓ {productForm.auction_end_time}</p>}
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
              {isEditingProduct ? 'تحديث' : 'إضافة'} المنتج
            </Button>
            <Button 
              onClick={closeProductModal}
              className={cn("px-8 border-2 font-normal rounded-2xl transition-all font-sans", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 hover:bg-gray-500" : "bg-white border-black/5 text-gray-600 hover:bg-gray-100/50")}
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
    console.log('🏪 renderCustomers() called', {
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
                setCustomerForm({ name: '', phone: '', password: '', starting_balance: '', credit_limit: '', notes: '', customer_type: 'cash' });
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
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الاسم</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الهاتف</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>ديون سابقة</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الحد الائتماني</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الديون الحالية</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>الإجراءات</th>
                </>
              ) : (
                <>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>رقم الهاتف</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider", isDarkMode ? "text-gray-400" : "text-gray-400")}>العنوان</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>إجمالي الطلبات</th>
                  <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-400" : "text-gray-400")}>إجمالي مبلغ الطلبات</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={cn(isDarkMode ? "divide-gray-800" : "divide-gray-50")}> 
            {customers.length === 0 ? (
              <tr>
                <td colSpan={isTopupStore ? 6 : 4} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-sm font-normal">{isTopupStore ? 'لا توجد عملاء بعد. أضف عميلاً جديداً' : 'لا توجد طلبات عملاء لعرضها بعد'}</div>
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
                          title="كشف الحساب"
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
          <h2 className={cn("text-xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-800")}>قسائم الخصم</h2>
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
          <Plus size={isMobile ? 16 : 20} /> {!isMobile && "إنشاء قسيمة جديدة"}
        </Button>
      </div>

      {/* Desktop View - Table */}
      {!isMobile && (
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
                    {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('ar-EG') : 'بدون تاريخ'}
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
      )}

      {/* Mobile View - Cards */}
      {isMobile && (
        <div className="p-4 space-y-3">
          {filteredCoupons.length === 0 ? (
            <div className={cn("p-12 text-center rounded-2xl", isDarkMode ? "bg-gray-700/50" : "bg-gray-50")}>
              <Ticket size={40} className="mx-auto mb-3 opacity-20" />
              <p className={cn("font-normal text-sm", isDarkMode ? "text-gray-300" : "text-gray-600")}>لا توجد قسائم</p>
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
                      if (confirm("حذف؟")) {
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
                    <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>نوع الخصم</span>
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
                        <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>الاستخدام</span>
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
                    <span className={cn("text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>تنتهي في</span>
                    <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                      {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString('ar-EG') : 'بدون تاريخ'}
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
      alert("يرجى ملء كافة الحقول الأساسية");
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
        alert("✓ تم إنشاء القسيمة بنجاح!");
      } else {
        const err = await res.json();
        alert(err.error || "فشل إنشاء القسيمة");
      }
    } catch (error: any) {
      alert("خطأ: " + error.message);
    }
  };

  const renderCouponModal = () => {
    if (!showCouponModal) return null;
    const couponModalLabelClass = cn("text-sm font-bold block mr-1 leading-6 tracking-tight", isDarkMode ? "!text-white drop-shadow-sm" : "text-gray-900");

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
              <label className={couponModalLabelClass}>{`رمز الخصم (Code)`}</label>
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
                <label className={couponModalLabelClass}>{`نوع الخصم`}</label>
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
                  <label className={couponModalLabelClass}>{`قيمة الخصم`}</label>
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
            <label className={couponModalLabelClass}>{`الحد الأدنى للطلب`}</label>
                  <input 
                    type="number" 
                    value={Math.floor(parseFloat(String(couponForm.min_order_value) || '0'))}
                    onChange={(e) => setCouponForm({...couponForm, min_order_value: e.target.value})}
                    placeholder="0"
                    className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                  />
               </div>
               <div className="space-y-2">
                  <label className={couponModalLabelClass}>{`تاريخ الانتهاء`}</label>
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
              <label className={couponModalLabelClass}>حد الاستخدام (اختياري)</label>
               <input 
                type="number" 
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})}
                placeholder="مثلاً: 100 مرة"
                className={cn("w-full px-5 py-4 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium outline-none placeholder:opacity-100", isDarkMode ? "bg-slate-700 border-slate-500 text-white placeholder:text-slate-200" : "bg-gray-50 border-black/5 text-gray-900 placeholder:text-gray-500")}
              />
              <p className={cn("text-xs mr-1", isDarkMode ? "text-slate-200" : "text-gray-500")}>اتركه فارغاً إذا لم ترد تحديد عدد مرات الاستخدام.</p>
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
    console.log('✅✅ renderProducts EXECUTING NOW - Button should be visible on screen!');
    console.log('✅✅ handleCreateProduct function exists?', typeof handleCreateProduct === 'function');
    
    if (!categories) console.warn('WARNING: categories is', categories);
    console.log('�🔵🔵 renderProducts CALLED!!!');
    console.log('�📦 renderProducts called with:', {
      categoriesCount: categories.length,
      categories: categories,
      filteredProductsCount: filteredProducts.length,
      showProductModal: showProductModal
    });
    
    // Group filtered products by category
    console.log('🔍 RENDER PRODUCTS DEBUG:', {
      filteredProductsLength: filteredProducts.length,
      filteredProducts: filteredProducts.map(p => ({ id: p.id, name: p.name, category_name: p.category_name, price: p.price }))
    });
    
    const productsByCategory = filteredProducts.reduce((acc, product) => {
      const category = product.category_name || 'بدون قسم';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, typeof filteredProducts>);

    const categoryNames = Object.keys(productsByCategory).sort();
    console.log('📂 PRODUCTS BY CATEGORY:', {
      categoryCount: categoryNames.length,
      categories: categoryNames.map(cat => ({ name: cat, count: productsByCategory[cat].length }))
    });

    return (
    <Card className={cn("rounded-[2.5rem] border-none shadow-xl overflow-hidden", isDarkMode ? "bg-gray-800" : "bg-white")}>
      <div className={cn("p-8 border-b border-black/5 flex justify-between items-center", isDarkMode ? "bg-gray-900" : "bg-gray-50/50")}>
        <div>
          <h3 className={cn("font-normal text-2xl", isDarkMode ? "text-gray-100" : "text-gray-900")}>إدارة المنتجات</h3>
          <p className={cn("font-medium text-sm mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>أضف، عدل أو احذف المنتجات من متجرك</p>
        </div>
        <button 
          type="button"
          onClick={handleCreateProduct}
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
          <Plus size={20} /> إضافة منتج جديد
        </button>
      </div>
      <div className={cn("p-8", isDarkMode ? "bg-gray-800" : "bg-white")}>
        {/* Search Bar */}
        <div className="mb-8 flex gap-3">
          <div className="flex-1 relative">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2", isDarkMode ? "text-gray-500" : "text-gray-400")} size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن المنتجات..." 
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
              <X size={18} /> مسح
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className={cn("p-20 text-center", isDarkMode ? "text-gray-500" : "text-gray-400")}>
            <Package size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-normal text-lg">{dashboardQuery ? 'لا توجد نتائج تطابق بحثك.' : 'لا توجد منتجات حالياً.'}</p>
            {!dashboardQuery && <p className="text-sm">ابدأ بإضافة منتجك الأول الآن!</p>}
          </div>
        ) : (
          <div className="space-y-12">
            {categoryNames.map((category) => (
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
                          {/* Show Product Image if available */}
                          {p.image_url ? (
                            <img 
                              src={getSafeImageUrl(p.image_url)} 
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="flex items-center justify-center text-5xl font-bold">
                              💳
                            </div>
                          )}
                          
                          {p.stock <= 2 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-normal px-2 py-0.5 rounded-full shadow-lg">
                              منخفض
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Edit & Delete Buttons - Overlay */}
                        <div className="absolute top-2 left-2 flex gap-1 z-50 opacity-10 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200">
                          {console.log('🟢 RENDERING EDIT BUTTON for product:', p.id, p.name)}
                          <button 
                            onClick={() => {
                              console.log('🔴 EDIT BUTTON CLICKED');
                              handleEditProduct(p);
                            }}
                            className={cn("p-2 rounded-lg shadow-lg transition-all cursor-pointer", isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white")}
                            title="تعديل المنتج"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className={cn("p-2 rounded-lg shadow-lg transition-all cursor-pointer", isDarkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white")}
                            title="حذف المنتج"
                          >
                            <Trash2 size={16} />
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
                            {/* Show images count for topup products */}
                            {p.images && Array.isArray(p.images) && p.images.filter((img: any) => img && String(img).length > 0).length > 0 && (
                              <div className="flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-black/5">
                                <span className={cn("text-sm font-normal", isDarkMode ? "text-blue-400" : "text-blue-600")}>📷</span>
                                <span className={cn("font-normal text-[11px]", isDarkMode ? "text-blue-300" : "text-blue-700")}>{p.images.filter((img: any) => img && String(img).length > 0).length} صور</span>
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
            { label: 'إجمالي المبيعات', value: formatCurrency(merchantStats.totalRevenue), icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50', clickable: true },
            { label: isRegularStore ? 'بانتظار التجهيز' : 'الطلبات المكتملة', value: isRegularStore ? workflowStats.pending : merchantStats.orderStats.completed, icon: ShoppingCart, color: isRegularStore ? 'text-amber-600' : 'text-emerald-600', bg: isRegularStore ? 'bg-amber-50' : 'bg-emerald-50', clickable: false },
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
                {isRegularStore ? 'حالة التجهيز' : 'حالة الطلبات'}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-normal text-amber-600">بانتظار التجهيز</span>
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
                  <span className="text-sm font-normal text-emerald-600">مكتملة</span>
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
                 <p className={cn("text-[10px] font-normal uppercase", isDarkMode ? "text-gray-500" : "text-gray-400")}>إجمالي</p>
                 <p className={cn("text-2xl font-normal mt-1", isDarkMode ? "text-gray-300" : "text-gray-900")}>{workflowStats.total}</p>
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
                      {order.status === 'pending' ? (isRegularStore ? 'غير مشحون' : 'بانتظار') : (isRegularStore ? 'تم الشحن' : 'مكتمل')}
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
    const countLabel = reportSummary.saleType === 'auction' ? 'عدد المزادات' : reportSummary.saleType === 'order' ? 'عدد الطلبات' : 'عدد العمليات';

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
                  تقرير المبيعات
                </h2>
                <p className="text-sm mt-1 text-slate-300">عرض تفصيلي للمبيعات خلال فترات مختلفة</p>
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
                      <p className="text-sm font-normal mb-3 text-white">فترة العرض</p>
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
                            {period === 'daily' ? 'يومي' : period === 'weekly' ? 'أسبوعي' : 'شهري'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {[
                      { label: 'إجمالي المبيعات', value: formatCurrency(reportSummary.totalRevenue || 0), color: 'from-blue-500/25 to-blue-700/10' },
                      { label: countLabel, value: reportSummary.totalOrders || 0, color: 'from-emerald-500/25 to-emerald-700/10' },
                      { label: 'متوسط الطلب', value: formatCurrency(reportSummary.averageOrder || 0), color: 'from-indigo-500/25 to-indigo-700/10' },
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
                        <label className="block text-sm font-normal mb-2 text-white">من</label>
                        <input
                          type="date"
                          value={salesDateFrom}
                          onChange={(e) => setSalesDateFrom(e.target.value)}
                          className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-900 border-slate-600 text-white"
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-normal mb-2 text-white">إلى</label>
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
                          تطبيق الفلتر
                        </button>
                        <button
                          onClick={handleResetSalesFilters}
                          disabled={isLoadingSalesData}
                          className="px-5 py-2.5 rounded-xl font-normal text-sm transition-all border border-slate-600 text-white hover:bg-slate-700"
                        >
                          مسح التاريخ
                        </button>
                      </div>
                    </div>

                    {!!salesDateFrom && !!salesDateTo && salesDateFrom > salesDateTo && (
                      <p className="text-sm text-red-400">تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.</p>
                    )}

                    <div>
                      <p className="text-sm font-normal mb-2 text-white">نوع المبيع</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { value: 'all', label: 'الكل' },
                          { value: 'order', label: 'الطلبات' },
                          { value: 'auction', label: 'المزادات' }
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
                  <h3 className="font-normal text-lg mb-4 text-white">بيانات المبيعات</h3>
                  <div className="space-y-3">
                    {isLoadingSalesData ? (
                      <div className="text-center py-12 text-slate-300">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="font-normal">جاري تحميل بيانات المبيعات...</p>
                      </div>
                    ) : salesReportError ? (
                      <div className="text-center py-12 text-red-400">
                        <p className="font-normal">{salesReportError}</p>
                      </div>
                    ) : currentSalesItems.length === 0 ? (
                      <div className="text-center py-12 text-slate-300">
                        <CreditCard size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-normal">لا توجد بيانات مبيعات لهذه الفترة</p>
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
                              <span>{item.order_count} عملية</span>
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
                    <img src={getSafeImageUrl(cat.image_url)} className="w-full h-full object-cover" />
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
                  حفظ مبيعة المزاد
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
                    المنتج:
                  </p>
                  <p className={cn("text-base font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                    {selectedAuctionForSave.product_name}
                  </p>
                </div>
                <div>
                  <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>
                    السعر النهائي (من أعلى عطاء):
                  </p>
                  <p className={cn("text-lg font-bold text-emerald-600", isDarkMode ? "text-emerald-400" : "")}>
                    {formatCurrency(finalSalePrice ? parseFloat(finalSalePrice) : 0)}
                  </p>
                </div>
                {(selectedAuctionForSave as any)?.selectedBidder && (
                  <div className={cn("rounded-xl p-4 border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-black/5")}>
                    <p className={cn("text-sm font-normal mb-2", isDarkMode ? "text-gray-400" : "text-gray-600")}>المشتري المختار:</p>
                    <p className={cn("text-base font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>
                      {(selectedAuctionForSave as any).selectedBidder.customer_name || 'غير معروف'}
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
                          alert(data.error || 'خطأ في حفظ المبيعة');
                        } else {
                          alert('تم حفظ المبيعة بنجاح!');
                          setShowAuctionSaveModal(false);
                          setSelectedAuctionForSave(null);
                          setFinalSalePrice('');
                          await refreshMerchantAuctionState(selectedAuctionForBidders?.id || selectedAuctionForSave.id);
                        }
                      } catch (err) {
                        console.error('Error finalizing auction:', err);
                        alert('خطأ في حفظ المبيعة');
                      }
                    }}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-normal text-sm hover:bg-emerald-700 transition-colors"
                  >
                    ✓ تأكيد البيع
                  </button>
                  <button
                    onClick={() => {
                      setShowAuctionSaveModal(false);
                    }}
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm transition-colors inline-flex items-center justify-center gap-2", isDarkMode ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")}
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    رجوع
                  </button>
                  <button
                    onClick={() => {
                      setShowAuctionSaveModal(false);
                      setSelectedAuctionForSave(null);
                      setFinalSalePrice('');
                    }}
                    className={cn("w-full px-4 py-2 rounded-lg font-normal text-sm transition-colors", isDarkMode ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                  >
                    إلغاء
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
                        <th className={cn("px-6 py-4 text-xs font-normal uppercase tracking-wider text-center", isDarkMode ? "text-gray-300" : "text-gray-400")}>الإجراء</th>
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
                            {bidder.is_confirmed_sale && (
                              <p className={cn("text-xs mt-1 font-normal", isDarkMode ? "text-emerald-400" : "text-emerald-600")}>
                                المشتري المؤكد حالياً
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
                                  if (!confirm('هل تريد حذف المشتري المؤكد وإلغاء هذه المبيعة؟')) return;

                                  try {
                                    const res = await fetch(`/api/auctions/${selectedAuctionForBidders.id}/finalize`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' }
                                    });
                                    const data = await res.json();
                                    if (!res.ok) {
                                      alert(data.error || 'فشل حذف المشتري المؤكد');
                                      return;
                                    }

                                    alert('تم حذف المشتري المؤكد وتحديث إجمالي المبيعات');
                                    await refreshMerchantAuctionState(selectedAuctionForBidders.id);
                                  } catch (err) {
                                    console.error('Failed to remove confirmed auction sale:', err);
                                    alert('فشل حذف المشتري المؤكد');
                                  }
                                }}
                                className={cn("px-3 py-2 rounded-lg font-normal text-xs transition-all inline-flex items-center gap-1", isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100")}
                                title="حذف المشتري المؤكد"
                              >
                                <Trash2 size={15} /> حذف المشتري
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
                                title="تأكيد البيع لهذا المشارك"
                              >
                                <CheckCircle size={15} /> تأكيد البيع
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
                          {auction.status === 'sold' ? 'تم البيع' : auction.status === 'active' ? 'نشط' : auction.status === 'pending' ? 'قريباً' : 'منتهي'}
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
                                  await fetchMerchantAuctions(user?.store_id);
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
        {isRegularStore && <p className="text-sm text-amber-500 mt-2">طلبات غير مشحونة: {unshippedOrdersCount}</p>}
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
                        {order.status === 'pending' ? (isRegularStore ? 'لم يتم الشحن بعد' : 'بانتظار التجهيز') : 
                         order.status === 'completed' ? (isRegularStore ? 'تم الشحن' : 'تم التجهيز') : 'ملغي'}
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
                      {orderItems.map((item: any, itemIndex: number) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img src={getSafeImageUrl(item.image_url)} className="w-10 h-10 rounded-lg object-cover bg-white shadow-sm ring-1 ring-black/5" />
                            <div>
                               <p className={cn("font-normal text-base", isDarkMode ? "text-white" : "text-gray-800")}>{item.product_name}</p>
                               <span className={cn("text-xs font-normal", isDarkMode ? "text-gray-400" : "text-gray-400")}>{item.quantity} × {formatCurrency(item.price)}</span>
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
                                        alert(isRegularStore ? 'تم شحن الطلب وتأكيد البيع بنجاح!' : 'تم تجهيز الطلب بنجاح!');
                                      }
                                    }}
                                    className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                    title={isRegularStore ? 'تأكيد الشحن والبيع' : 'تأكيد التجهيز'}
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
                                      console.error('خطأ في تحميل الفاتورة:', err);
                                      alert('حدث خطأ في تحميل الفاتورة. يرجى المحاولة لاحقاً.');
                                    }
                                  }}
                                  className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-all", isDarkMode ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white" : "bg-white border-black/5 hover:bg-gray-100 text-gray-600")}
                                  title="تحميل الفاتورة"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('هل أنت متأكد من حذف هذا الطلب؟ سيتم تحديث المخزون وإجمالي المبيعات بعد الحذف.')) {
                                      const res = await fetch(`/api/orders/${order.id}`, {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' }
                                      });
                                      if (res.ok) {
                                        await refreshOrdersAndStats();
                                        setExpandedOrder(null);
                                        alert('تم حذف الطلب بنجاح!');
                                      } else {
                                        const data = await res.json().catch(() => ({}));
                                        alert(data.error || 'فشل حذف الطلب');
                                      }
                                    }
                                  }}
                                  className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all"
                                  title="حذف الطلب"
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
        section === 'settings' ? "إعدادات المتجر" : 
        section === 'products' ? "المنتجات" : 
        section === 'categories' ? "أقسام المتجر" :
        section === 'auctions' ? "المزادات" :
        section === 'orders' ? "الطلبات" : 
        section === 'customers' ? "العملاء" :
        section === 'coupons' ? "قسائم الخصم" :
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

        {/* Customer Statement Modal - Topup Stores Only */}
        {showCustomerStatement && selectedCustomerStatement && user?.store_type === 'topup' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 overflow-hidden font-sans" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("rounded-[2rem] w-11/12 md:w-10/12 lg:max-w-2xl xl:max-w-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
            >
              {/* Header */}
              <div className={cn("p-6 border-b flex justify-between items-center", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <div>
                  <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>كشف الحساب</h3>
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
              <div className={cn("p-6 grid grid-cols-3 gap-4 border-b", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-blue-900/30" : "bg-blue-50")}>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-blue-300" : "text-blue-600")}>حد الائتمان</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-blue-400" : "text-blue-700")}>
                    {formatCurrency(selectedCustomerStatement.credit_limit || 0)}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-red-900/30" : "bg-red-50")}>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-red-300" : "text-red-600")}>الديون الحالية</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-red-400" : "text-red-700")}>
                    {formatCurrency(selectedCustomerStatement.current_debt || 0)}
                  </p>
                </div>
                <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-green-900/30" : "bg-green-50")}>
                  <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-green-300" : "text-green-600")}>الرصيد المتاح</p>
                  <p className={cn("text-lg font-bold", isDarkMode ? "text-green-400" : "text-green-700")}>
                    {formatCurrency((selectedCustomerStatement.credit_limit || 0) - (selectedCustomerStatement.current_debt || 0))}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="p-4 md:p-6 flex-1 overflow-hidden min-h-0">
                {isLoadingCustomerTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: `${primaryColor}` }}></div>
                    <span className={cn("ml-3 font-normal", isDarkMode ? "text-gray-300" : "text-gray-600")}>جاري تحميل المعاملات...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto overflow-y-auto max-h-[22rem] md:max-h-[24rem] rounded-xl border min-h-0" style={{ borderColor: isDarkMode ? '#4b5563' : '#d1d5db' }}>
                    <table className="w-full text-right text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className={cn("border-b sticky top-0", isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>التاريخ</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs border", isDarkMode ? "text-gray-300 border-gray-600" : "text-gray-600 border-gray-300")}>البيان</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-red-400 border-gray-600" : "text-red-600 border-gray-300")}>مدين (Debit)</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-green-400 border-gray-600" : "text-green-600 border-gray-300")}>دائن (Credit)</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center border", isDarkMode ? "text-blue-400 border-gray-600" : "text-blue-600 border-gray-300")}>الديون الجالية</th>
                          <th className={cn("px-2 md:px-4 py-2 font-bold text-xs text-center", isDarkMode ? "text-gray-400" : "text-gray-600")}>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className={cn(isDarkMode ? "divide-gray-700" : "divide-gray-100")}>
                        {customerTransactions.map((transaction: any, idx: number) => {
                          // Format transaction type display
                          let displayType = 'معاملة';
                          if (transaction.type === 'opening') {
                            displayType = transaction.description || 'ديون سابقة';
                          } else if (transaction.is_payment) {
                            displayType = '✓ دفعة';
                          } else if (transaction.type === 'debit') {
                            displayType = 'خصم';
                          } else if (transaction.type === 'topup') {
                            displayType = transaction.description || 'بطاقة شحن';
                          } else {
                            displayType = transaction.description || transaction.type || 'معاملة';
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
                            console.log(`📊 [MerchantDashboard Compact] Topup TX #${idx}:`, {
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
                            console.log(`🔍 [TX ${idx}] CALCULATING AMOUNTS:`, {
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
                            console.log(`🔥 [TOPUP FIX] TX #${idx}: amount=${amountValue} → debitAmount=${debitAmount}`);
                          } else if (isDebit && amountValue !== 0) {
                            debitAmount = Math.abs(amountValue);
                            creditAmount = 0;
                          } else if (isCredit && amountValue !== 0) {
                            debitAmount = 0;
                            creditAmount = Math.abs(amountValue);
                          }
                          
                          if (transaction.type === 'topup') {
                            console.log(`✅ [TX ${idx}] FINAL RESULT:`, {
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
                              {debitAmount > 0 ? formatCurrency(debitAmount) : '—'}
                            </td>
                            <td className={cn("px-2 md:px-4 py-2 md:py-3 font-bold text-center whitespace-nowrap border", 
                              creditAmount > 0 ? (isDarkMode ? "text-green-400" : "text-green-600") : (isDarkMode ? "text-gray-500" : "text-gray-400"), isDarkMode ? "border-gray-700" : "border-gray-200"
                            )}>
                              {creditAmount > 0 ? formatCurrency(creditAmount) : '—'}
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
                                        const newAmountStr = prompt(`أدخل المبلغ الجديد (المبلغ الحالي: ${transaction.amount}):`);
                                        if (!newAmountStr) return;
                                        
                                        const newAmount = parseFloat(newAmountStr);
                                        if (isNaN(newAmount) || newAmount <= 0) {
                                          alert('❌ الرجاء إدخال مبلغ صحيح');
                                          return;
                                        }
                                        
                                        console.log('Editing transaction:', { id: transaction.id, type: transaction.type, newAmount });
                                        
                                        let res = await fetch(`/api/topup/payment/${transaction.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ newAmount })
                                        });
                                        
                                        if (res.ok) {
                                          alert('✓ تم التحديث بنجاح');
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
                                          alert(`❌ ${error.error}`);
                                        }
                                      } catch (error) {
                                        console.error('Edit error:', error);
                                        alert('❌ حدث خطأ');
                                      }
                                    }}
                                    title="تعديل"
                                    className={cn("p-1.5 rounded-lg transition-all hover:scale-110", isDarkMode ? "hover:bg-amber-900/30 text-amber-400" : "hover:bg-amber-50 text-amber-600")}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('هل تريد حذف هذه المعاملة؟')) return;
                                      try {
                                        console.log('Deleting transaction:', { id: transaction.id, type: transaction.type });
                                        let res = await fetch(`/api/topup/payment/${transaction.id}`, { method: 'DELETE' });
                                        
                                        if (res.ok) {
                                          alert('✓ تم الحذف بنجاح');
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
                                          alert('فشل الحذف');
                                        }
                                      } catch (error) {
                                        console.error('Delete error:', error);
                                        alert('❌ حدث خطأ');
                                      }
                                    }}
                                    title="حذف"
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
                    <h3 className={cn("text-xl font-normal mb-4", isDarkMode ? "text-gray-100" : "text-gray-900")}>تعديل المعاملة</h3>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <label className={cn("block text-sm font-normal mb-2", isDarkMode ? "text-gray-300" : "text-gray-700")}>المبلغ</label>
                        <input
                          type="number"
                          value={editingTransactionAmount}
                          onChange={(e) => setEditingTransactionAmount(e.target.value)}
                          className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-gray-50 border-black/5")}
                        />
                        <span className={cn("absolute left-3 bottom-3 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>د.أ</span>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleSaveEditTransaction}
                          className="flex-1 px-4 py-2 rounded-lg font-normal text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          onClick={() => {
                            setEditingTransactionId(null);
                            setEditingTransactionAmount('');
                          }}
                          className={cn("flex-1 px-4 py-2 rounded-lg font-normal transition-all border", isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200")}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Payment Input Section */}
              <div className={cn("p-4 md:p-6 border-t", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <h4 className={cn("font-normal text-sm mb-4", isDarkMode ? "text-gray-300" : "text-gray-700")}>
                  💳 تسجيل دفعة يدوية من التاجر
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={merchantPaymentAmount}
                      onChange={(e) => setMerchantPaymentAmount(e.target.value)}
                      placeholder="أدخل مبلغ الدفعة"
                      className={cn("w-full px-4 py-3 border rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-normal outline-none pl-12", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400" : "bg-white border-black/5 placeholder-gray-400")}
                    />
                    <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 font-normal text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>د.أ</span>
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
                        جاري...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        إضافة الدفعة
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
                  إغلاق
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

export default MerchantDashboard;
