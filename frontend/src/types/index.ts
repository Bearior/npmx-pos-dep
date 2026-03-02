// ============================================================
// NPMX POS – Shared TypeScript Types
// ============================================================

// --- Auth / Profile ---
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "admin" | "manager" | "cashier";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Category ---
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Product ---
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  category_id: string;
  categories?: { name: string };
  sku?: string;
  image_url?: string;
  is_active: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  product_variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

// --- Product Variant ---
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  type: "size" | "add_on" | "color" | "custom";
  price_modifier: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Cart ---
export interface CartItem {
  id: string; // unique cart-line id
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

// --- Order ---
export interface Order {
  id: string;
  order_number: string;
  parent_order_id?: string;
  status: OrderStatus;
  cashier_id: string;
  customer_name?: string;
  table_number?: string;
  notes?: string;
  discount_id?: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  voided_by?: string;
  voided_at?: string;
  order_items?: OrderItem[];
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "voided"
  | "split";

// --- Order Item ---
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_info?: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  products?: { name: string; image_url?: string };
  created_at: string;
}

// --- Payment ---
export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  tendered?: number;
  change_amount: number;
  reference_number?: string;
  status: "completed" | "refunded" | "partially_refunded" | "failed";
  processed_by: string;
  created_at: string;
}

export type PaymentMethod = "cash" | "qr" | "credit_card" | "transfer";

// --- Discount ---
export interface Discount {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  max_discount?: number;
  min_order_amount?: number;
  max_uses?: number;
  times_used: number;
  starts_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Inventory ---
export interface InventoryTransaction {
  id: string;
  product_id: string;
  type: "sale" | "restock" | "adjustment" | "waste" | "return";
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  performed_by: string;
  profiles?: { full_name: string };
  created_at: string;
}

// --- Dashboard ---
export interface DashboardSummary {
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  active_orders: number;
  low_stock_count: number;
  average_order_value: number;
}

export interface DashboardAlert {
  type: "low_stock" | "stale_order";
  severity: "critical" | "warning" | "info";
  message: string;
  product_id?: string;
  order_id?: string;
}

// --- Reports ---
export interface SalesReportRow {
  date: string;
  orders: number;
  subtotal: number;
  discounts: number;
  tax: number;
  total: number;
}

export interface ProductReportRow {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

// --- API Response ---
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
