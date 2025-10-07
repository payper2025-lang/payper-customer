"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Scan, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContxt";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { shortenId } from "@/utils/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const statusColors = {
  free: "bg-green-500 text-white border-green-400",
  occupied: "bg-orange-500 text-white border-orange-400",
  producing: "bg-blue-500 text-white border-blue-400",
  bill_requested: "bg-red-500 text-white border-red-400",
  paid: "bg-green-500 text-white border-green-400",
  waiting_order: "bg-yellow-500 text-white border-yellow-400",
  delivered: "bg-green-500 text-white border-green-400",
} as const;

export default function Header() {
  const router = useRouter();
  const { cartItems, currentTableStatus, fetchTableStatus } = useApp();
  const [showQrDialog, setShowQrDialog] = useState(false);

  const { user, profile } = useAuth();
  // Datos de usuario simulados - en una app real vendrían de un estado global o API
  const userInfo = {
    name: profile?.name || profile?.email,
    userId: user?.id,
    balance: profile?.balance || 0,
    qrData: `barapp://user/${user?.id}`,
    avatar: "/placeholder.svg?height=40&width=40",
    table: profile?.table?.table_number || "",
  };

  useEffect(() => {
    if (profile?.table_id) fetchTableStatus();
  }, [profile?.table_id]);

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const goToCart = () => {
    // En una app real, guardarías el carrito en localStorage o en un estado global
    router.push("/cart");
  };

  const showUserQr = () => {
    setShowQrDialog(true);
  };

  return (
    <header className="sticky top-0 z-10 bg-background">
      <div className="flex items-center justify-between h-16 w-full">
        {/* <h1 className="text-xl font-bold">BarApp</h1> */}

        <div
          className="bg-card border-b border-border py-2 px-4 flex items-center justify-between cursor-pointer w-full mr-4"
          onClick={showUserQr}
        >
          <div className="flex items-center">
            <QrCode
              className="w-5 h-5 mr-2 text-primary"
              // onClick={() => router.push("/scan-qr")}
            />
            <div>
              <div className="flex items-center">
                <p className="text-sm font-medium">{userInfo.name}</p>
                {userInfo.table && (
                  <Badge
                    variant="outline"
                    className="ml-2 py-0 h-5 bg-primary/10 text-primary border-0"
                  >
                    Mesa {userInfo.table}
                  </Badge>
                )}
                {userInfo.table && currentTableStatus && (
                  <Badge
                    variant="outline"
                    className={`ml-2 py-0 h-5 bg-primary/10 text-primary border-0 ${statusColors[currentTableStatus]}`}
                  >
                    {currentTableStatus}
                  </Badge>
                )}
              </div>
              {/* <div className="h-6" /> */}
              {/* <p className="text-xs text-muted-foreground">
              ID: {shortenId(userInfo.userId || "")}
            </p> */}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {/* <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            title="Escanear QR"
          >
            <Scan className="w-5 h-5" />
          </Button> */}
          <Button
            variant="ghost"
            size="icon"
            className="relative mr-4"
            onClick={goToCart}
            disabled={getTotalItems() === 0}
          >
            <ShoppingCart className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500  text-white">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md bg-card border-0">
          <DialogHeader>
            <DialogTitle className="text-center">Tu código QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            {/* <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
              <AvatarFallback>
                {(userInfo?.name || profile?.email)?.charAt(0)}
              </AvatarFallback>
            </Avatar> */}
            <h2 className="text-xl font-bold mb-1">{userInfo.name}</h2>
            <div className="flex items-center mb-2">
              <p className="text-sm text-muted-foreground">
                ID: {shortenId(userInfo.userId || "")}
              </p>
              {userInfo.table && (
                <Badge
                  variant="outline"
                  className="ml-2 py-0 h-5 bg-primary/10 text-primary border-0"
                >
                  Mesa {userInfo.table}
                </Badge>
              )}
            </div>

            <div className="bg-black p-4 rounded-lg mb-4">
              <div className="w-56 h-56 flex items-center justify-center">
                <QRCodeSVG
                  id="qr-canvas"
                  value={`${userInfo.userId}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Muestra este código QR para identificarte en eventos y promociones
            </p>

            <Button
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/profile")}
            >
              Ver perfil completo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
