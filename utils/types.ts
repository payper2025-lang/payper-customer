export interface Product {
    id: string;
    name: string;
    href: string;
    icon: any;
    category: string;
    description: string;
    image_url: string;
    purchase_price: number;
    sale_price: number;
    stock: number;
    created_at: string;
    updated_at: string;
    extras?: any[];
    notes?: string;
    recipe_id?: string;
    ingredient_id?: string;
    is_active?: boolean;
}

export interface Gift {
    id: string;
    user_id: string;
    product_id: string;
    quantity: number;
    products?: any;
    description?: string;
    status?: string;
    accepted?: boolean;
    sender?: any;
    created_at: string;
}

export type OrderStatus = 'pending' | 'paying' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'expired'

export type MailType = "sign_up" | 'new_order' | "order_delivered" | "order_cancelled" | "order_delayed" | "balance_updated" | "reminder"

export interface CartItem {
    id: string;
    quantity: number;
    notes?: string;
}

export interface PaymentWebhookData {
    id: string;
    action: string;
    apiVersion: string;
    application_id: string;
    date_created: string;
    live_mode: boolean;
    type: string;
    user_id: string;
    data: {
        id: string;
    };
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    status: string;
    createdAt?: string;
    paymentUrl?: string;
    counterparty?: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products?: { name: string, image_url: string };
}

export interface Order {
    id: string;
    user_id: string;
    user_name: string;
    total_amount: number;
    notes: string;
    status: string;
    created_at: string;
    updated_at: string;
    payment_method: string;
    order_items: OrderItem[];
    is_table_order?: boolean;
    table_number?: string;
    table_id?: string;
}

export interface Transfer {
    id: string,
    from_user: string,
    to_user: string,
    amount: number,
    note: string,
    status: string,
    created_at: string,
    updated_at: string,
    user?: {
        name: string;
        email: string;
    }
}

export interface QrCodeT {
    id: string,
    name: string,
    location: string,
    purpose: string,
    bar_id: string
}

export interface Inventory {
    id: string;
    product_id: string;
    quantity: number;
    created_at: string;
}

export interface Table {
    id: string;
    venue_id: string;
    table_number: string;
    capacity: number;
    current_guest: number;
    status: string;
    assigned_wait: string;
    created_at: string;
    updated_at: string;
}

// Module types for tenant module system
export type ModuleKey =
  | 'qrmenu'           // Main QRMENU module
  | 'complimentary_gifts'  // Courtesy/Gifts functionality
  | 'add_balance';  // Add balance functionality

export interface AppsRegistry {
    id: string;
    key: ModuleKey;
    name: string;
    description: string;
    is_core: boolean;
    created_at: string;
}

export interface TenantModule {
    id: string;
    tenant_id: string;
    app_id: string;
    enabled: boolean;
    activated_at: string | null;
    created_at: string;
    apps_registry?: AppsRegistry | null;
}
