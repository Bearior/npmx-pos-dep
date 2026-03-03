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
  variants?: ProductVariant[];
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
export interface DashboardPeriod {
  total_orders: number;
  completed_orders: number;
  revenue: number;
  profit: number;
  total_cost: number;
  avg_order_value: number;
}

export interface DashboardSummary {
  today: DashboardPeriod;
  month: DashboardPeriod;
  active_orders: number;
  low_stock_count: number;
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
  period: string;
  total_orders: number;
  revenue: number;
  tax: number;
  discounts: number;
  avg_order_value: number;
}

export interface SalesReportResponse {
  start_date: string;
  end_date: string;
  group_by: string;
  total_revenue: number;
  total_orders: number;
  data: SalesReportRow[];
}

export interface ProductReportRow {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number | null;
  order_count: number;
}

export interface ProductReportResponse {
  start_date: string;
  end_date: string;
  data: ProductReportRow[];
}

export interface PaymentMethodRow {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

export interface PaymentMethodResponse {
  start_date: string;
  end_date: string;
  grand_total: number;
  data: PaymentMethodRow[];
}

export interface HourlyRow {
  hour: number;
  label: string;
  order_count: number;
  revenue: number;
}

export interface HourlyResponse {
  date: string;
  total_orders: number;
  total_revenue: number;
  data: HourlyRow[];
}

// --- API Response ---
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// --- Customer Behavior Analytics ---
export type CustomerClassification = "long_stay" | "moderate" | "quick";

export interface BehaviorSession {
  session_key: string;
  table_number: string | null;
  customer_name: string | null;
  is_delivery: boolean;
  first_order_at: string;
  last_order_at: string;
  session_duration_min: number;
  order_count: number;
  total_items: number;
  total_revenue: number;
  avg_basket_value: number;
  basket_value_cv: number;
  unique_categories: number;
  category_diversity: number;
  avg_time_gap_min: number;
  dwell_score: number;
  classification: CustomerClassification;
  order_numbers: string[];
}

export interface BehaviorKPIs {
  total_sessions: number;
  dine_in_sessions: number;
  delivery_sessions: number;
  avg_session_duration: number;
  avg_orders_per_session: number;
  avg_basket_value: number;
  long_stay_avg_revenue: number;
  quick_avg_revenue: number;
  long_stay_pct: number;
  quick_pct: number;
  avg_dwell_score: number;
  revenue_by_type: {
    long_stay: number;
    moderate: number;
    quick: number;
    delivery: number;
  };
}

export interface BehaviorHourlyPattern {
  hour: number;
  long_stay: number;
  moderate: number;
  quick: number;
}

export interface MethodologyVariable {
  name: string;
  formula: string;
  description: string;
}

export interface BehaviorMethodology {
  session_definition: string;
  derived_variables: MethodologyVariable[];
  classification_rules: Record<string, string>;
  model_suggestions: string[];
  assumptions: string[];
  limitations: string[];
  validation: string[];
}

export interface CustomerBehaviorResponse {
  date_from: string;
  date_to: string;
  sessions: BehaviorSession[];
  summary: { long_stay: number; moderate: number; quick: number };
  kpis: BehaviorKPIs;
  hourly_pattern: BehaviorHourlyPattern[];
  methodology: BehaviorMethodology;
}
