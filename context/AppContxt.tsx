"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { CartItem, Product, Gift, Order, Inventory, TenantModule, ModuleKey } from "@/utils/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/utils/supabase/client";
import { getTableStatus } from "@/app/api/tables/route";

interface AppContextType {
  cartItems: CartItem[];
  products: Product[];
  loading: boolean;
  gifts: Gift[];
  orders: Order[];
  inventories: Inventory[];
  updateCartItems: (items: CartItem[]) => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchGifts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchInventories: (barId: string) => Promise<void>;
  currentTableStatus: DatabaseTableStatus;
  fetchTableStatus: () => Promise<void>;
  tenantModules: TenantModule[];
  tenantModulesLoading: boolean;
  isModuleEnabled: (moduleKey: ModuleKey) => boolean;
  fetchTenantModules: () => Promise<void>;
}

export type DatabaseTableStatus =
  | "free"
  | "occupied"
  | "waiting_order"
  | "producing"
  | "delivered"
  | "bill_requested"
  | "paid";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const { user, profile } = useAuth();
  const [currentTableStatus, setCurrentTableStatus] =
    useState<DatabaseTableStatus>("free");
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [tenantModulesLoading, setTenantModulesLoading] = useState(false);
  const TENANT_ID = "0af64252-5332-4769-8952-05f87f999dda"
  const updateCartItems = useCallback(async (items: CartItem[]) => {
    setCartItems(items);
  }, []);

  const fetchGifts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/gifts?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch gifts");

      const { data } = await response.json();
      setGifts(data || []);
    } catch (error) {
      console.error("Error fetching gifts:", error);
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");

      const { products } = await response.json();
      setProducts(products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTableStatus = useCallback(async () => {
    try {
      if (!profile?.table_id) return;
      const tableStatus = await getTableStatus(profile?.table_id); // Fetch the table status from the database
      setCurrentTableStatus(tableStatus as DatabaseTableStatus); // Set the table status in the state
    } catch (error) {
      console.error("Error fetching table:", error);
    }
  }, [profile?.table_id]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/orders?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch orders");

      const { data } = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  }, [user?.id]);

  const fetchInventories = useCallback(async (barId: string) => {
    if (!barId) return;

    try {
      const response = await fetch(`/api/inventories?barId=${barId}`);
      if (!response.ok) throw new Error("Failed to fetch inventories");

      const { inventory } = await response.json();
      setInventories(inventory || []);
    } catch (error) {
      console.error("Error fetching inventories:", error);
      setInventories([]);
    }
  }, []);

  const fetchTenantModules = useCallback(async () => {
    if (!user?.id) {
      console.log("⚠️ No user ID, skipping tenant modules fetch");
      return;
    }

    try {
      setTenantModulesLoading(true);

      // Fetch tenant_modules without apps_registry join
      const { data: modulesData, error: modulesError } = await supabase
        .from("tenant_modules")
        .select("*")
        .eq("tenant_id", TENANT_ID);

      if (modulesError) {
        console.error("❌ Error fetching tenant_modules:", modulesError);
        throw modulesError;
      }

      console.log("📦 Fetched tenant modules:", modulesData);

      // Collect all unique app_ids
      const appIds = modulesData
        ?.map((m) => m.app_id)
        .filter((id): id is string => !!id) || [];

      // Fetch apps_registry data separately
      let appsData: any[] = [];
      if (appIds.length > 0) {
        const { data, error: appsError } = await supabase
          .from("apps_registry")
          .select("id, key, name, description, is_core")
          .in("id", appIds);

        if (appsError) {
          console.error("❌ Error fetching apps_registry:", appsError);
        } else {
          appsData = data || [];
          console.log("📋 Fetched apps registry:", appsData);
        }
      }

      // Merge the data manually
      const mergedModules = modulesData?.map((module) => ({
        ...module,
        apps_registry: appsData.find((app) => app.id === module.app_id) || null,
      })) || [];

      console.log("✅ Merged tenant modules:", mergedModules);
      setTenantModules(mergedModules);
    } catch (error) {
      console.error("❌ Error in fetchTenantModules:", error);
      setTenantModules([]);
    } finally {
      setTenantModulesLoading(false);
    }
  }, [user?.id]);

  const isModuleEnabled = useCallback(
    (moduleKey: ModuleKey): boolean => {
      const module = tenantModules.find(
        (m) => m.apps_registry?.key === moduleKey
      );

      if (!module) {
        console.warn(`⚠️ Module '${moduleKey}' not found in tenant modules`);
        return false;
      }

      return module.enabled;
    },
    [tenantModules]
  );

  // Fetch tenant modules when user changes
  useEffect(() => {
    if (user?.id) {
      fetchTenantModules();
    }
  }, [user?.id, fetchTenantModules]);

  useEffect(() => {
    if (!profile?.table_id) return;

    const tableStatusChannel = supabase
      .channel(`table_status_${profile?.table_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
          filter: `id=eq.${profile?.table_id}`,
        },
        (payload: any) => {
          if (payload.new?.status) {
            setCurrentTableStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tableStatusChannel);
    };
  }, [!profile?.table_id]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("orders_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          if (!payload?.new?.id) {
            console.warn("Payload missing ID:", payload);
            return;
          }

          try {
            const { data: updatedOrder, error } = await supabase
              .from("orders")
              .select(
                `*, order_items (
                  id,
                  product_id,
                  quantity,
                  unit_price,
                  products (
                    name,
                    image_url
                  )
                )`
              )
              .eq("id", payload.new.id)
              .single();

            if (error) throw error;

            setOrders((prev) => {
              switch (payload.eventType) {
                case "INSERT":
                  return [updatedOrder, ...prev];
                case "UPDATE":
                  return prev.map((order) =>
                    order.id === updatedOrder.id ? updatedOrder : order
                  );
                case "DELETE":
                  return prev.filter((order) => order.id !== payload.old.id);
                default:
                  return prev;
              }
            });
          } catch (error) {
            console.error("Error processing order update:", error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to orders changes");
        }
        if (err) {
          console.error("Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value = useMemo(
    () => ({
      cartItems,
      products,
      loading,
      gifts,
      orders,
      inventories,
      updateCartItems,
      fetchProducts,
      fetchGifts,
      fetchOrders,
      fetchInventories,
      currentTableStatus,
      fetchTableStatus,
      tenantModules,
      tenantModulesLoading,
      isModuleEnabled,
      fetchTenantModules,
    }),
    [
      cartItems,
      products,
      loading,
      gifts,
      orders,
      inventories,
      updateCartItems,
      fetchProducts,
      fetchGifts,
      fetchOrders,
      fetchInventories,
      currentTableStatus,
      fetchTableStatus,
      tenantModules,
      tenantModulesLoading,
      isModuleEnabled,
      fetchTenantModules,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
