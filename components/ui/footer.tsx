"use client";

import { useRouter } from "next/navigation";
import { QrCode, MenuIcon, User, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContxt";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModuleKey } from "@/utils/types";

interface NavItem {
  id: string;
  title: string;
  icon: any;
  path: string;
  moduleKey: ModuleKey;
}

const navItems: NavItem[] = [
  {
    id: "menu",
    title: "Menú",
    icon: MenuIcon,
    path: "/menu",
    moduleKey: "qrmenu", // Core module
  },
  {
    id: "cart",
    title: "Carrito",
    icon: QrCode,
    path: "/cart",
    moduleKey: "qrmenu", // Core module
  },
  {
    id: "gifts",
    title: "Cortesías",
    icon: Gift,
    path: "/gifts",
    moduleKey: "complimentary_gifts", // Courtesy sub-functionality
  },
  {
    id: "add-balance",
    title: "Agregar Saldo",
    icon: Wallet,
    path: "/add-balance",
    moduleKey: "add_balance", // Balance sub-functionality
  },
  {
    id: "profile",
    title: "Perfil",
    icon: User,
    path: "/profile",
    moduleKey: "qrmenu", // Core module
  },
];

export default function Footer() {
  const router = useRouter();
  const { cartItems, isModuleEnabled, tenantModulesLoading } = useApp();

  const goToCart = () => {
    router.push("/cart");
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="sticky bottom-0 bg-card border-t border-border">
      <div className="container flex justify-between items-center h-16">
        {navItems.map((item) => {
          const moduleEnabled = isModuleEnabled(item.moduleKey);
          const isDisabled = !moduleEnabled && !tenantModulesLoading;
          const showBadge = item.id === "cart" && getTotalItems() > 0;

          return (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`flex-1 flex-col h-full rounded-none ${
                      isDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        if (item.id === "cart") {
                          goToCart();
                        } else {
                          router.push(item.path);
                        }
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5" />
                      {showBadge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                          {getTotalItems()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs mt-1">{item.title}</span>
                  </Button>
                </TooltipTrigger>
                {isDisabled && (
                  <TooltipContent side="top">
                    <p className="text-xs">Módulo no habilitado</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
