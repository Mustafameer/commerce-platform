export const UI_TEXT = {
  roleLabel: {
    admin: 'الإدارة',
    merchant: 'التاجر',
  },
  dashboardLayout: {
    admin: {
      dashboard: 'الرئيسية',
      users: 'المستخدمون',
      stores: 'المتاجر',
      approvals: 'طلبات التفعيل',
      stats: 'الإحصاءات',
      settings: 'الإعدادات',
    },
    merchant: {
      dashboard: 'الرئيسية',
      products: 'المنتجات',
      categories: 'التصنيفات',
      auctions: 'المزادات',
      orders: 'الطلبات',
      coupons: 'القسائم',
      customers: 'العملاء',
      settings: 'الإعدادات',
    },
  },
  loginRequired: {
    title: 'تسجيل الدخول مطلوب',
    description: 'يجب تسجيل الدخول أولاً حتى تتمكن من متابعة هذه العملية والوصول إلى حسابك.',
    close: 'إغلاق',
    login: 'تسجيل الدخول',
  },
  dashboardMenu: {
    title: 'أقسام لوحة التحكم',
    stats: 'الإحصاءات',
    products: 'المنتجات',
    orders: 'الطلبات',
    customers: 'العملاء',
    coupons: 'القسائم',
    auctions: 'المزادات',
    settings: 'الإعدادات',
  },
} as const;
