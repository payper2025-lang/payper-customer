"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle,
  QrCode,
  Copy,
  Clock,
  Bell,
  X,
  AlertTriangle,
  Loader2,
  CookingPot,
  ClockAlert,
  CreditCard,
  Clock10,
  ListIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OrderItem } from "@/utils/types";
import { QRCodeSVG } from "qrcode.react";
import { format, set } from "date-fns";
import { Order } from "@/utils/types";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const ORDER_WAIT_TIME = 600; // 10 minutes in seconds
const CANCELLATION_WINDOW = 120; // 2 minutes in seconds

const StatusIcons = {
  pending: CheckCircle,
  delivered: CheckCircle,
  cancelled: X,
};

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { id: orderId } = useParams();
  const { user } = useAuth();
  // State management
  const [codeCopied, setCodeCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ORDER_WAIT_TIME);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentModal, setPaymentModal] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [canCancel, setCanCancel] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel("order_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        async (payload: any) => {
          console.log(
            "Change detected for order:",
            orderId,
            "Payload:",
            payload
          );
          try {
            if (payload.new?.id == orderId || payload.old?.id == orderId) {
              console.log("Our order changed:", payload);
              await getOrderById();
            }
          } catch (error) {
            console.error("Error fetching updated profile:", error);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to changes for order ${orderId}`);
        }
        if (err) {
          console.error("Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from changes for order ${orderId}`);
    };
  }, [orderId]);

  const getPaymentLink = async () => {
    const res = await fetch(`/api/payment?orderId=${orderId}`);
    const data = await res.json();
    if (data.error) {
      console.error("Error fetching transaction:", data.error);
      return;
    }
    setPaymentLink(data.data?.payment_url || "");
  };

  useEffect(() => {
    if (order?.payment_method == "mercadopago") {
      getPaymentLink();
    }
    if (order?.status === "paying" && order?.payment_method == "mercadopago") {
      setPaymentModal(true);
    }
    setTimeLeft(
      new Date(order?.created_at || "").getTime() / 1000 +
      ORDER_WAIT_TIME -
      60 -
      Date.now() / 1000
    );
  }, [order]);

  // Calculate time elapsed since order creation and determine cancellation eligibility
  useEffect(() => {
    if (!order?.created_at) return;

    const updateTimeElapsed = () => {
      const orderCreatedTime = new Date(order.created_at).getTime();
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - orderCreatedTime) / 1000);

      setTimeElapsed(elapsed);

      // Cancellation rules:
      // 1. Cannot cancel if order status is "preparing", "ready", "delivered", or "cancelled"
      // 2. Can cancel within 2 minutes if status is "pending" or "paying"
      // 3. After 2 minutes, order moves to suspension (cannot be cancelled)
      const canCancelByStatus = order.status === "pending" || order.status === "paying";
      const canCancelByTime = elapsed < CANCELLATION_WINDOW;

      setCanCancel(canCancelByStatus && canCancelByTime);
    };

    // Update immediately
    updateTimeElapsed();

    // Update every second
    const interval = setInterval(updateTimeElapsed, 1000);

    return () => clearInterval(interval);
  }, [order?.created_at, order?.status]);

  // Memoized calculations
  const subtotal = useMemo(
    () =>
      order?.order_items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      ),
    [order]
  );

  const serviceCharge = useMemo(() => subtotal || 0 * 0.1, [subtotal]);
  const total = useMemo(
    () => subtotal || 0 + serviceCharge,
    [subtotal, serviceCharge]
  );
  const progress = useMemo(
    () => (timeLeft / ORDER_WAIT_TIME) * 100,
    [timeLeft]
  );

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${mins}:${secs}`;
  }, []);

  const getOrderById = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }
      const data = await response.json();
      setOrder(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    getOrderById();
  }, [orderId]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // Event handlers
  const copyOrderNumber = useCallback(() => {
    if (!orderId) return;

    navigator.clipboard.writeText(
      Array.isArray(orderId) ? orderId.join(" ") : orderId
    );
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [orderId]);

  const checkDeliveryStatus = useCallback(() => {
    router.push("/order-delivered");
  }, [router]);

  const cancelOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
      });

      if (response.ok) {
        // Send cancellation email
        fetch("/api/mails", {
          method: "POST",
          body: JSON.stringify({
            email: user?.email,
            type: "order_cancelled",
            orderNumber: orderId,
          }),
        });

        // Show success message with refund info if applicable
        if (order?.payment_method === "balance") {
          // You could show a toast or modal here about the refund
          console.log(`Refund of $${order.total_amount} processed for order ${orderId}`);
        }
      } else {
        const errorData = await response.json();
        console.error("Cancellation failed:", errorData.error);
        // Close dialog and refresh order data to show updated status
        setShowCancelDialog(false);
        await getOrderById();
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId, router, user?.email, order?.payment_method, order?.total_amount]);

  // Status display configuration
  const statusConfig = {
    paying: {
      title: "Esperando pago",
      description:
        "Esperando pago. Por favor acercate a la barra para abonar tu pedido",
      icon: CreditCard,
      iconColor: "text-yellow-500",
    },
    pending: {
      title: "Orden creada",
      description:
        `Tu pedido fue recibido correctamente. ${timeLeft <= 0 ? "Expiró el tiempo para cancelar." : `Tienes ${formatTime(timeLeft)} para cancelar el pedido.`}`,
      icon: Clock10,
      iconColor: "text-primary",
    },
    preparing: {
      title: "Preparación iniciada",
      description:
        "El local está preparando tu pedido. Ya no puede ser cancelado. Te avisamos cuando esté listo.",
      icon: CookingPot,
      iconColor: "text-gray-500",
    },
    ready: {
      title: "Tu pedido está listo para retirar",
      description:
        "¡Tu pedido ya está listo! Podés pasar a retirarlo por la barra que quieras.",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    delivered: {
      title: "Pedido entregado",
      description:
        "Ya retiraste tu pedido o fue entregado correctamente. ¡Gracias por tu compra!",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    cancelled: {
      title: "Pedido cancelado",
      description:
        "Este pedido fue cancelado. Si tenés dudas, podés comunicarte con alguien a cargo",
      icon: X,
      iconColor: "text-red-500",
    },
    expired: {
      title: "Pedido demorado",
      description:
        "Hubo una demora con la preparación. Te avisaremos cuando esté listo para retirar.",
      icon: ClockAlert,
      iconColor: "text-gray-500",
    },
    // suspended: {
    //   title: "Pedido en suspensión",
    //   description:
    //     "Tu pedido está en suspensión. Ya no puede ser cancelado y está siendo procesado.",
    //   icon: Clock,
    //   iconColor: "text-orange-500",
    // },
  };

  const [currentStatus, setCurrentStatus] = useState(statusConfig.pending);
  useEffect(() => {
    let status = order?.status as keyof typeof statusConfig;

    // Handle suspension logic for pending/paying orders
    if ((order?.status === "pending" || order?.status === "paying") && timeElapsed >= CANCELLATION_WINDOW) {
      if (order?.status === "paying") {
        status = "paying";
      } else {
        status = "pending";
      }
    }
    // If order is pending and time has expired for preparation, show as expired
    else if (timeLeft <= 0 && order?.status === "pending") {
      status = "expired";
    }

    setCurrentStatus(statusConfig[status] || statusConfig.pending);
  }, [order?.status, timeLeft, timeElapsed]);

  // Early return if loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <main className="flex-1 container px-4 py-6">
          {/* Status Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="bg-primary/20 rounded-full p-4 mb-4">
              <currentStatus.icon
                className={`w-12 h-12 ${currentStatus.iconColor}`}
              />
            </div>
            <h1 className="text-2xl font-bold mb-2">{currentStatus.title}</h1>
            <p className="text-muted-foreground">{currentStatus.description}</p>
            {order?.payment_method === "mercadopago" && (
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                Payment link
              </a>
            )}
          </div>

          {/* Order Details Card */}
          <Card className="mb-6 bg-card border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold">Pedido #{orderId}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      order?.created_at || new Date(),
                      "dd/MM/yyyy HH:mm"
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyOrderNumber}
                  className="h-8 w-8"
                  aria-label="Copy order number"
                >
                  {codeCopied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Separator className="mb-4 bg-border" />

              <div className="space-y-2 mb-4">
                {order?.order_items.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex justify-between"
                  >
                    <span>
                      {item.quantity}x {item.products?.name}
                    </span>
                    <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="mb-4 bg-border" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Servicio </span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timer Progress */}
          {order?.status === "pending" && (
            <div className="w-full mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>
                    {timeLeft <= 0
                      ? "Expired"
                      : `Tiempo estimado: ${formatTime(timeLeft)}`}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {progress > 0 ? "Preparando" : "Listo"}
                </span>
              </div>
              <Progress value={progress} className="h-2" />

              {/* Cancellation Timer - only show for pending/paying orders within cancellation window */}
              {((order?.status === "pending" || order?.status === "paying") && timeElapsed < CANCELLATION_WINDOW) && (
                <div className="mt-3 p-2 bg-orange-900/10 border border-orange-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-500">Tiempo para cancelar:</span>
                    <span className="font-medium text-orange-400">
                      {formatTime(Math.max(0, CANCELLATION_WINDOW - timeElapsed))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Code Section */}
          {order?.status !== "paying" && (
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-lg font-bold mb-4">Código de pedido</h2>
              <div className="bg-black p-4 rounded-lg mb-4">
                <div className="w-48 h-48 flex items-center justify-center">
                  <QRCodeSVG
                    value={orderId?.toString() || ""}
                    size={160}
                    level="H"
                    includeMargin
                  />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground mb-4">
                Muestra este código QR al mozo o en la barra para retirar tu
                pedido
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 bg-secondary border-0 hover:bg-secondary/80"
                onClick={() => router.push("/cart?view=all")}
              >
                <ListIcon className="w-4 h-4 mr-2" />
                Ver todos los pedidos
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-secondary border-0 hover:bg-secondary/80"
                onClick={() => router.push("/history")}
              >
                Ver historial
              </Button>
              {/* <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={checkDeliveryStatus}
            >
              <Bell className="w-4 h-4 mr-2" />
              Verificar estado
            </Button> */}
            </div>

            {/* Cancel button - only show for pending/paying orders within cancellation window */}
           {((order?.status === "pending" || order?.status === "paying") && canCancel) && (
              <Button
                variant="outline"
                className="w-full border-red-800 bg-red-900/10 text-red-500 hover:bg-red-900/20 hover:text-red-400"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar pedido
              </Button>
            )}

            {/* Suspension message - for pending/paying orders after cancellation window */}
            {((order?.status === "pending" || order?.status === "paying") && !canCancel && timeElapsed >= CANCELLATION_WINDOW) && (
              <div className="w-full p-3 bg-orange-900/10 border border-orange-800 rounded-lg">
                <div className="flex items-center text-orange-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    El plazo de cancelación ha expirado. Su pedido está en espera y ya ha sido procesado.
                  </span>
                </div>
              </div>
            )}

            {/* Preparation started message - for preparing/ready orders */}
            {(order?.status === "preparing" || order?.status === "ready") && (
              <div className="w-full p-3 bg-blue-900/10 border border-blue-800 rounded-lg">
                <div className="flex items-center text-blue-500">
                  <CookingPot className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    La preparación ha comenzado. Tu pedido ya no puede ser cancelado.
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-card border-0">
          <DialogHeader>
            <DialogTitle>¿Cancelar pedido?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas cancelar tu pedido? Esta acción no se
              puede deshacer.
              {order?.payment_method === "balance" && (
                <div className="mt-2 text-green-500 text-sm">
                  Se reembolsará ${order.total_amount} a tu saldo automáticamente.
                </div>
              )}
              {((order?.status === "pending" || order?.status === "paying") && timeElapsed < CANCELLATION_WINDOW) && (
                <div className="mt-2 text-orange-500 text-sm">
                  Tiempo restante para cancelar: {formatTime(Math.max(0, CANCELLATION_WINDOW - timeElapsed))}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="bg-red-900/20 rounded-full p-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-secondary border-0 hover:bg-secondary/80"
              onClick={() => setShowCancelDialog(false)}
            >
              Volver al pedido
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={cancelOrder}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Sí, cancelar pedido"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="sm:max-w-100vw bg-card border-0">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-1">{`Completa tu pago`}</h2>
            <p className="text-sm text-muted-foreground">
              The payment link is:{" "}
              <a href={paymentLink} target="_blank" className="text-blue-500 break-all font-medium">
                {paymentLink}
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
