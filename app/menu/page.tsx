"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Send,
  HandPlatter,
  ReceiptIcon,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/context/AuthContext";
import { Product } from "@/utils/types";
import { useApp } from "@/context/AppContxt";
import { Skeleton } from "@/components/ui/skeleton";
import { formatArgentineNumber } from "@/utils/utils";
import {
  createTableNotification,
  updateTableStatus,
} from "../api/tables/route";

export default function Home() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("all");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // fetch products
  const {
    cartItems,
    inventories,
    updateCartItems,
    fetchProducts,
    products,
    loading,
    fetchOrders,
    fetchInventories,
  } = useApp();
  const { refreshSession } = useAuth();

  // Filter products based on search query and active category
  useEffect(() => {
    const stockFilteredProducts = products
      .map((product) => {
        const inventory = inventories.find(
          (inventory) => inventory.product_id === product.id
        );
        return {
          ...product,
          stock:
            inventory && inventory?.quantity > product.stock
              ? inventory?.quantity
              : product.stock,
        };
      })
      .filter(
        (product) =>
          product.stock > 0 || product.recipe_id || product.ingredient_id
      );

    setFilteredProducts(
      stockFilteredProducts.filter((product) => {
        if (activeCategory === "all") return true;
        return product.category == activeCategory;
      })
    );
  }, [activeCategory, products, inventories]);

  const { user, profile } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!profile) refreshSession();
    if (profile?.qr_id?.bar_id) fetchInventories(profile?.qr_id?.bar_id);
  }, [profile]);

  const addToCart = (productId: string) => {
    const existingItem = cartItems.find((item) => item.id === productId);
    const updatedCart = existingItem
      ? cartItems.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...cartItems, { id: productId, quantity: 1 }];

    updateCartItems(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cartItems.find((item) => item.id === productId);
    const updatedCart =
      existingItem && existingItem.quantity > 1
        ? cartItems.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
        : cartItems.filter((item) => item.id !== productId);

    updateCartItems(updatedCart);
  };

  const getItemQuantity = (productId: string) => {
    const item = cartItems.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const categories = [
    "all",
    ...Array.from(new Set(products.map((product) => product.category))),
  ];

  const simulateBillRequest = async (tableId: string) => {
    try {
      // Create table notification record
      await createTableNotification(tableId, "bill_request");
      await updateTableStatus(tableId, "bill_requested");
    } catch (error) {
      console.error("Failed to create bill request:", error);
    }
  };

  const simulateWaiterCall = async (tableId: string) => {
    try {
      // Create table notification record
      await createTableNotification(tableId, "waiter_call");
    } catch (error) {
      console.error("Failed to simulate waiter call:", error);
    }
  };

  const simulateLeavingTip = async (tableId: string) => {
    try {
      // Create table notification record
      await createTableNotification(tableId, "special_request");
    } catch (error) {
      console.error("Failed to simulate leaving tip:", error);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}

      {/* User Identification Bar */}

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-card shadow-none border-0 w-full">
         
          <CardContent className="p-6 gap-2 space-y-2">
            {profile?.table_id && (
                <div className="flex items-start gap-2">
                  <Button
                    className="bg-secondary text-white hover:bg-secondary/80 h-8 px-2 text-xs"
                    onClick={() => simulateWaiterCall(profile?.table_id || "")}
                  >
                    <HandPlatter className="h-4 w-4 mr-2" />
                    {/* Call Waiter */}
                    Llamar Mozo
                  </Button>
                  <Button
                    className="bg-secondary text-white hover:bg-secondary/80 h-8 px-2 text-xs"
                    onClick={() => simulateBillRequest(profile?.table_id || "")}
                  >
                    <ReceiptIcon className="h-4 w-4 mr-2" />
                    {/* Bill request */}
                    Pedir Cuenta
                  </Button>
                  <Button
                    className="bg-secondary text-white hover:bg-secondary/80 h-8 px-2 text-xs"
                    onClick={() => simulateLeavingTip(profile?.table_id || "")}
                  >
                    {/* Leaving tip */}
                    <HandCoins className="h-4 w-4 mr-2" />
                    Dejar Propina
                  </Button>
                </div>
            )}
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Tu saldo disponible
                </p>
                {profile ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-3xl font-bold">
                      ${formatArgentineNumber(profile.balance)}
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 mr-2.5"
                          onClick={() => router.push("/add-balance")}
                          title="Agregar saldo"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <span className="text-sm">Agregar</span>
                      </div>
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-10 w-10 rounded-full bg-secondary border-0 hover:bg-secondary/80 mr-2.5"
                          onClick={() => router.push("/transfer")}
                          title="Transferir"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                        <span className="text-sm">Enviar</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-10 w-20" />
                )}
              </div>
              <img src="/images/icon.png" alt="logo" className="h-10" />
            </div>
          </CardContent>
        </Card>

        {/* Menu Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Descubrí más</h2>
          <Tabs defaultValue="all" onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {filteredProducts.length == 0 && loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full" />
                ))
              : filteredProducts
                  .filter((item) => item.is_active === true)
                  .map((item: Product) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden bg-card border-0 shadow-none"
                    >
                      <div
                        className="relative h-32 bg-center bg-cover cursor-pointer group"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                        onClick={() => router.push(`/product/${item.id}`)}
                      >
                        {/* Stock count badge */}
                        {/* <div
                        className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full 
                ${item.stock < 5 ? "bg-red-600" : "bg-black/70"}`}
                      >
                        {item.stock} left
                      </div> */}

                        {/* Optional hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                      </div>
                      <CardContent className="p-3">
                        <h3
                          className="font-medium cursor-pointer"
                          onClick={() => router.push(`/product/${item.id}`)}
                        >
                          {item.name}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <p className="font-bold">
                            ${formatArgentineNumber(item.sale_price)}
                          </p>

                          {getItemQuantity(item.id) > 0 ? (
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6 bg-secondary border-0 hover:bg-secondary rounded-full"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-2 w-2" color="white" />
                              </Button>
                              <span className="mx-2 font-medium">
                                {getItemQuantity(item.id)}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                disabled={
                                  !item.recipe_id &&
                                  !item.ingredient_id &&
                                  item.stock <= getItemQuantity(item.id)
                                }
                                className="h-6 w-6 bg-secondary border-0 hover:bg-secondary rounded-full"
                                onClick={() => addToCart(item.id)}
                              >
                                <Plus className="h-2 w-2" color="white" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              className="h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => addToCart(item.id)}
                              disabled={
                                !item.recipe_id &&
                                !item.ingredient_id &&
                                item.stock == 0
                              }
                            >
                              <Plus className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Simplificada a 4 elementos */}

      {/* QR Code Dialog */}
    </div>
  );
}
