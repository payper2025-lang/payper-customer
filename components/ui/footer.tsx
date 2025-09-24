"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QrCode, MenuIcon, User, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContxt";

export default function Footer() {
  const router = useRouter();

  const goToCart = () => {
    // En una app real, guardarías el carrito en localStorage o en un estado global
    router.push("/cart");
  };
  const { cartItems } = useApp();

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="sticky bottom-0 bg-card border-t border-border">
      <div className="container flex justify-between items-center h-16">
        <Button
          variant="ghost"
          className="flex-1 flex-col h-full rounded-none"
          onClick={() => router.push("/menu")}
        >
          <MenuIcon className="w-5 h-5" />
          <span className="text-xs mt-1">Menú</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col h-full rounded-none"
          onClick={goToCart}
        >
          <div className="relative">
            <QrCode className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Pedido</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col h-full rounded-none"
          onClick={() => router.push("/gifts")}
        >
          <Gift className="w-5 h-5" />
          <span className="text-xs mt-1">Cortesías</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex-col h-full rounded-none"
          onClick={() => router.push("/profile")}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Perfil</span>
        </Button>
      </div>
    </div>
  );
}
