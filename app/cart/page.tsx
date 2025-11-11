"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Edit,
  QrCode,
  Plus,
  Minus,
  AlertTriangle,
  MenuIcon,
  ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContxt";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCodeT } from "@/utils/types";
import { supabase } from "@/utils/supabase/client";
import { formatArgentineNumber } from "@/utils/utils";
import { Textarea } from "@/components/ui/textarea";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    updateCartItems,
    products,
    fetchProducts,
    orders,
    fetchOrders,
  } = useApp();
  const [paymentMethod, setPaymentMethod] = useState("balance");
  const { user, profile, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedQrId, setSelectedQrId] = useState(profile?.qr_id?.id || "");
  const [qrCodes, setQrCodes] = useState<QrCodeT[] | []>([]);
  const [notes, setNotes] = useState("");

  // useEffect(() => {
  //   if (orders)
  //     orders.map((order) => {
  //       if (order.status != "delivered" && order.status !== "cancelled") {
  //         router.push(`/order-confirmation/${order.id}`);
  //       }
  //     });
  // }, [orders]);

  useEffect(() => {
    if (!profile?.qr_id) return;
    setSelectedQrId(profile.qr_id.id);
  }, [profile]);

  useEffect(() => {
    const fetchQrCodes = async () => {
      const res = await fetch(`/api/qr-codes`);
      const data = await res.json();
      setQrCodes(data.data);
    };
    fetchQrCodes();
    fetchOrders();
  }, []);

  const cartItemList = cartItems.map((item) => {
    return {
      ...item,
      product: products.find((product) => product.id === item.id),
    };
  });

  const removeItem = (id: string) => {
    updateCartItems(cartItemList.filter((item) => item.id !== id));
  };

  const editItem = (id: string) => {
    router.push(`/product/${id}`);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    updateCartItems(
      cartItemList.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  console.log("test")

  const subtotal = cartItemList.reduce(
    (sum, item) => sum + (item.product?.sale_price || 0) * item.quantity,
    0
  );
  const serviceCharge = subtotal * 0; // 10% service charge
  const total = subtotal + serviceCharge;

  const confirmOrder = async () => {
    setLoading(true);

    if (paymentMethod === "balance" && total > (profile?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes suficiente saldo para realizar el pedido",
      });
      setLoading(false);
      return;
    }

    const orderData = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: profile?.id,
        user_name: profile?.name || user?.email,
        total_amount: total,
        payment_method: paymentMethod,
        notes: notes,
        order_items: cartItemList,
        status:
          paymentMethod == "mercadopago" || paymentMethod == "cash"
            ? "paying"
            : "pending",
      }),
    });

    if (paymentMethod === "balance") {
      refreshSession();
    }

    if (orderData.ok) {
      const orderDataJson = await orderData.json();
      fetch("/api/mails", {
        method: "POST",
        body: JSON.stringify({
          email: user?.email,
          type: "new_order",
          userName: profile?.name,
          orderNumber: orderDataJson.data.id,
        }),
      });
      updateCartItems([]);
      toast({
        variant: "default",
        title: "Success",
        description: "Order created successfully",
      });
      if (paymentMethod == "mercadopago") {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderDataJson.data.id,
            chargeAmount: total,
            userId: profile?.id,
            type: "order",
            payer: {
              email: profile?.email,
              name: profile?.name,
            },
          }),
        });
      }
      fetchProducts();
      router.push(`/order-confirmation/${orderDataJson.data.id}`);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order",
      });
    }
    setLoading(false);
  };

  const selectedQr = qrCodes?.find((qr) => qr?.id === selectedQrId);

  const handleQrChange = async (qrId: string) => {
    setSelectedQrId(qrId);
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user?.id,
        qr_id: qrId,
      }),
    });
    refreshSession();
  };
  console.log("leng: ", cartItemList)
  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
        {cartItemList.length > 0 ? (
          <>
            <Card className="mb-6 bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <MapPin className="w-5 h-5 text-primary mr-2" />
                  <h2 className="font-medium">Punto de entrega</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <div>
                        <p className="font-medium text-primary">
                          Pedirás desde: {selectedQr?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedQr?.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="qr-select"
                      className="text-sm text-muted-foreground"
                    >
                      ¿Te moviste? Cambia tu ubicación:
                    </Label>
                    <Select value={selectedQrId} onValueChange={handleQrChange}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Seleccionar QR" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {qrCodes.map((qr) => (
                          <SelectItem
                            key={qr?.id}
                            value={qr?.id}
                            className="hover:bg-secondary"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{qr?.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {qr?.location}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!selectedQrId && (
                  <Alert className="mt-3 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      Debes seleccionar una barra para continuar con tu pedido.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4">Productos</h2>
              {cartItemList.map((item) => (
                <Card
                  key={item.id}
                  className="mb-3 bg-card border-0 shadow-none"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{item.product?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          $
                          {formatArgentineNumber(item.product?.sale_price || 0)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-secondary border-0 hover:bg-secondary/80"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <input
                            className="mx-2 font-medium w-14 text-center"
                            value={item.quantity}
                            type="number"
                            onChange={(e) =>
                              updateQuantity(item.id, parseInt(e.target.value))
                            }
                            max={item.product?.stock || 0}
                            min={1}
                            style={{ backgroundColor: "transparent" }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-secondary border-0 hover:bg-secondary/80"
                            disabled={
                              item.product?.stock !== null
                                ? item.quantity >= (item.product?.stock ?? 0)
                                : false
                            }

                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editItem(item.id)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4">Método de pago</h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 border-0 bg-card rounded-lg p-3">
                  <RadioGroupItem
                    value="balance"
                    id="balance"
                    className="border-primary text-primary"
                  />
                  <Label htmlFor="balance" className="flex-1">
                    <div className="font-medium">Saldo en cuenta</div>
                    <div className="text-sm text-muted-foreground">
                      ${formatArgentineNumber(profile?.balance || 0)} disponible
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-0 bg-card rounded-lg p-3">
                  <RadioGroupItem
                    value="mercadopago"
                    id="mercadopago"
                    className="border-primary text-primary"
                  />
                  <Label htmlFor="mercadopago" className="flex-1">
                    <div className="font-medium">Tarjeta de crédito/débito</div>
                    <div className="text-sm text-muted-foreground">
                      Visa, Mastercard, etc.
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border-0 bg-card rounded-lg p-3">
                  <RadioGroupItem
                    value="cash"
                    id="cash"
                    className="border-primary text-primary"
                  />
                  <Label htmlFor="cash" className="flex-1">
                    <div className="font-medium">Efectivo</div>
                    <div className="text-sm text-muted-foreground">
                      Pagar al mozo
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Card className="mb-6 bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>${formatArgentineNumber(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Servicio (0%)</span>
                  <span>${formatArgentineNumber(serviceCharge)}</span>
                </div>
                <Separator className="my-2 bg-border" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${formatArgentineNumber(total)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="mb-6">
              <h2 className="font-medium mb-2">Notas especiales</h2>
              <Textarea
                placeholder="Ej: Sin hielo, extra limón, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-secondary border-border resize-none"
              />
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={confirmOrder}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Confirmar pedido"}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-secondary rounded-full p-6 mb-4">
              <QrCode className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tu pedido está vacío</h2>
            <p className="text-muted-foreground mb-6">
              Agrega productos desde el menú para comenzar tu pedido
            </p>
            <div className="flex gap-4">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/menu")}
              >
                <MenuIcon />
                Ver menú
              </Button>
              <Button
                className="bg-[#141415] text-white hover:bg-[#141415]/90"
                onClick={() => router.push("/history")}
              >
                <ListIcon />
                View Orders
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
