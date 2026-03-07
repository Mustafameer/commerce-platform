export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'admin' | 'merchant' | 'customer';
  customer_type?: 'cash' | 'reseller'; // نوع العميل إن كان دور العميل
  store_active?: boolean;
  store_status?: 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';
  store_id?: number;
  store_slug?: string;
  store_type?: 'regular' | 'topup';
}

export interface Store {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  description: string;
  logo_url?: string;
}

export interface Product {
  id: number;
  store_id: number;
  category_id?: number;
  name: string;
  description: string;
  price: number;
  bulk_price?: number; // سعر الجملة للعملاء reseller
  image_url: string;
  stock: number;
  gallery?: string[];
  topup_codes?: string[];
  store_type?: 'regular' | 'topup';
  store_name?: string; // اسم المتجر أو الشركة
  company_name?: string; // اسم شركة التوبأب
  created_at?: string;
}

export interface Category {
  id: number;
  store_id: number;
  name: string;
  image_url?: string;
  created_at?: string;
}

export interface Order {
  id: number;
  customer_id: number;
  store_id: number;
  total: number;
  status: string;
  created_at: string;
}

export interface Customer {
  id: number;
  store_id: number;
  name: string;
  phone: string;
  email?: string;
  customer_type: 'cash' | 'reseller';
  credit_limit: number;
  current_debt: number;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerTransaction {
  id: number;
  customer_id: number;
  order_id?: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description?: string;
  created_at?: string;
}
