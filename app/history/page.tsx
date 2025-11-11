"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Search, Filter, Gift, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import { Order, Transaction } from "@/utils/types"
import { shortenId } from "@/utils/utils"
import { format } from "date-fns"
import Loading from "@/components/ui/loading"
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "@/context/AppContxt";

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { orders, fetchOrders } = useApp();
  const [transfers, setTransfers] = useState<Transaction[]>([]);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchOrders();

    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/api/transfers?userId=${user?.id}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        // Sort transfers by latest first
        const sortedTransfers = data.data.sort((a: Transaction, b: Transaction) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setTransfers(sortedTransfers);
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };
    fetchTransfers();
    setIsLoading(false);
  }, [user]);

  // Filter orders based on search query and sort by latest first
  useEffect(() => {
    let result = orders;

    if (searchQuery.trim()) {
      result = orders.filter((order) =>
        String(order.id).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by latest first (descending order)
    const sorted = result.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setFilteredOrders(sorted);
  }, [searchQuery, orders]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) { // Case-insensitive matching
      case "delivered":
        return (
          <Badge variant="outline" className="text-green-600 hover:bg-green-100/20 border-green-500">
            Entregado
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100/10 text-yellow-600 hover:bg-yellow-100/10 border-yellow-500">
            Pendiente
          </Badge>
        )
      case 'preparing':
        return (
          <Badge variant="outline" className="bg-blue-100/10 text-blue-600 hover:bg-blue-100/10 border-blue-500">
            Preparando
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="outline" className="bg-purple-100/10 text-purple-600 hover:bg-purple-100/10 border-purple-500">
            Listo
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100/10 text-red-600 hover:bg-red-100/10 border-red-500">
            Cancelado
          </Badge>
        )
      case "shipped":
        return (
          <Badge variant="outline" className="bg-indigo-100/10 text-indigo-600 hover:bg-indigo-100/10 border-indigo-500">
            Enviado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100/10 text-gray-600 hover:bg-gray-100/10 border-gray-500">
            {status} {/* Show the raw status if unknown */}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Historial</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pedidos..."
              className="pl-8 bg-secondary border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="border-border">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="orders" className="mb-6">
          <TabsList className="w-full bg-card">
            <TabsTrigger value="orders" className="flex-1">
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex-1">
              Transferencias
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1">
              Regalos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <div className="space-y-4">
              {isLoading ? (
                <Loading />
              ) :
                filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer bg-card"
                    onClick={() => router.push(`/order-confirmation/${order.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">Pedido #{order.id}</h3>
                          <p className="text-sm text-muted-foreground">{format(order.created_at, "dd/MM/yyyy, HH:mm")}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="text-sm text-muted-foreground mb-2">
                        {order.order_items.map((item, index) => (
                          <span key={index}>
                            {item.quantity}x {item.products?.name}
                            {index < order.order_items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold">${order.total_amount.toFixed(2)}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="mt-4">
            <div className="space-y-4">
              {isLoading ? (
                <Loading />
              ) :
                transfers.map((transfer) => (
                  <Card
                    key={transfer.id}
                    className="cursor-pointer bg-card"
                    // onClick={() => router.push(`/transfer/details/${transfer.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">

                        <div>
                          <h3 className="font-medium">
                            {transfer.type === "sent" ? "Enviado a" : transfer.type == "charge" ? "Cargado" : "Recibido de"} {transfer.counterparty}
                          </h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(transfer.createdAt || ""), "dd/MM/yyyy, HH:mm")}</p>
                        </div>
                        <div className="flex items-center gap-2">

                        <Badge
                          variant="outline"
                          className={`
                            ${transfer.type === "sent"
                              ? "bg-orange-900/20 text-orange-400 hover:bg-orange-900/20 border-orange-800"
                              : transfer.type === "charge"
                                ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/20 border-blue-800"
                                : "bg-green-900/20 text-green-400 hover:bg-green-900/20 border-green-800"
                            }
                        `}
                        >
                          {transfer.type === "sent" ? "Enviado" : transfer.type === "charge" ? "Cargado" : "Recibido"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 p-1
                            ${transfer.status === "pending"
                              ? "bg-orange-900/20 text-orange-400 hover:bg-orange-900/20 border-orange-800"
                              : transfer.status === "completed"
                                ? "bg-blue-900/20 text-blue-400 hover:bg-blue-900/20 border-blue-800"
                                : "bg-green-900/20 text-green-400 hover:bg-green-900/20 border-green-800"
                            }
                        `}
                        >
                          {transfer.status === "pending" ? (
                            <>
                              <Clock className="h-3 w-3" />
                            </>
                          ) : transfer.status === "completed" ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                            </>
                          )}
                        </Badge>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-bold">${transfer.amount.toFixed(2)}</span>
                        {transfer.type == "charge" && transfer.status == "pending" && (
                          <a href={transfer.paymentUrl} target="_blank" rel="noopener noreferrer">
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="gifts" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted rounded-full p-6 mb-4">
                <Gift className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">No tienes regalos aún</h2>
              <p className="text-muted-foreground mb-6">Realiza pedidos para acumular puntos y recibir regalos</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

