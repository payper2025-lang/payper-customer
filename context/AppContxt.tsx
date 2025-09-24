"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { CartItem, Product, Gift, Order, Inventory } from "@/utils/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/utils/supabase/client";

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const { user } = useAuth();

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
