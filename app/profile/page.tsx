"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  CreditCard,
  LogOut,
  QrCode,
  Copy,
  Check,
  Share2,
  History,
  Clock,
  Receipt,
  Gift,
  Wallet,
  Plus,
  Send,
  Trophy,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Transaction } from "@/utils/types";
import { format } from "date-fns";
import { formatArgentineNumber } from "@/utils/utils";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [codeCopied, setCodeCopied] = useState(false);
  const { signOut } = useAuth();
  const { profile, user } = useAuth();
  const [transfers, setTransfers] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // En una app real, estos datos vendrían de la API o estado global
  const userData = {
    name: profile?.name,
    email: user?.email,
    phone: profile?.phone,
    userId: user?.id,
    qrData: "barapp://user/" + user?.id,
    balance: profile?.balance,
    points: 759,
    nextRewardAt: 1000,
    table: profile?.table_id,
  };

  const handleLogout = () => {
    signOut();
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(userData?.userId || "");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareProfile = () => {
    // En una app real, implementarías la funcionalidad de compartir
    if (navigator.share) {
      navigator.share({
        title: "Mi perfil en BarApp",
        text: `Conéctate conmigo en BarApp: ${userData?.userId}`,
        url: `https://barapp.com/user/${userData?.userId}`,
      });
    } else {
      alert("Compartir no está disponible en este dispositivo");
    }
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/api/transfers?userId=${user?.id}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("Transfers data:", data);
        setTransfers(data.data);
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };
    fetchTransfers();
    setIsLoading(false);
  }, [user]);

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-bold">{userData?.name}</h2>
              {userData?.table && (
                <Badge
                  variant="outline"
                  className="ml-2 py-0 h-5 bg-primary/10 text-primary border-0"
                >
                  Mesa {userData?.table}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{userData?.email}</p>
          </div>
        </div>

        <Tabs
          defaultValue="info"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="w-full bg-secondary mb-4 p-1">
            <TabsTrigger value="info" className="flex-1">
              Información
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex-1">
              Saldo
            </TabsTrigger>
            {/* <TabsTrigger value="history" className="flex-1">
              Historial
            </TabsTrigger> */}
            <TabsTrigger value="qr" className="flex-1">
              Mi QR
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            {/* Sección de puntos */}
            {/* <Card className="mb-6 bg-card border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-primary/20 p-2 rounded-full mr-3">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Tus Puntos</h3>
                      <p className="text-sm text-muted-foreground">
                        Acumula puntos con cada compra
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{userData?.points}</span>
                    <span className="text-sm text-muted-foreground"> pts</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Próxima cortesía a {userData?.nextRewardAt} pts</span>
                    <span>
                      {userData?.points}/{userData?.nextRewardAt}
                    </span>
                  </div>
                  <Progress
                    value={(userData?.points / userData?.nextRewardAt) * 100}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    ¡Te faltan {userData?.nextRewardAt - userData?.points} puntos para
                    desbloquear Gin Tonic Premium!
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 bg-secondary border-0 hover:bg-secondary/80"
                  onClick={() => router.push("/gifts")}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Ver mis cortesías
                </Button>
              </CardContent>
            </Card> */}

            <h3 className="font-bold mb-3 mt-4">Últimas transacciones</h3>
            <Card className="bg-card border-0 shadow-none">
              <CardContent className="p-4 space-y-4 overflow-scroll h-[50vh]">
                {transfers.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-start">
                      <div
                        className={`
                        rounded-full p-2 mr-3
                        ${transaction.type === "charge" ? "bg-green-900/20" : ""
                          }
                        ${transaction.type === "send" ? "bg-orange-900/20" : ""}
                        ${transaction.type === "receive" ? "bg-blue-900/20" : ""
                          }
                      `}
                      >
                        {transaction.type === "charge" && (
                          <Plus className="w-4 h-4 text-green-400" />
                        )}
                        {transaction.type === "sent" && (
                          <Send className="w-4 h-4 text-orange-400" />
                        )}
                        {transaction.type === "received" && (
                          <CreditCard className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {/* add description according to the type */}
                              {transaction.type === "charge"
                                ? "Carga"
                                : transaction.type === "sent"
                                  ? "Transferencia enviada"
                                  : "Transferencia recibida"}
                            </p>
                            <div className="flex items-center mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground mr-1" />
                              <p className="text-xs text-muted-foreground">
                                {format(
                                  new Date(transaction.createdAt || ""),
                                  "dd/MM/yyyy, HH:mm"
                                )}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`text-sm font-medium
                            ${transaction.type === "charge"
                                ? "text-green-400"
                                : ""
                              }
                            ${transaction.type === "sent"
                                ? "text-orange-400"
                                : ""
                              }
                            ${transaction.type === "received"
                                ? "text-blue-400"
                                : ""
                              }
                          `}
                          >
                            {transaction.type === "charge" ? (
                              transaction.status === "approved" ? (<>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                                  {formatArgentineNumber(transaction.amount)}
                                </div>
                              </>) : (<>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-orange-400" />
                                  {formatArgentineNumber(transaction.amount)}
                                </div>
                              </>)
                            ) : transaction.type === "sent" ? (
                              <div className="flex items-center gap-1">
                                <Send className="w-3 h-3 text-orange-400" />
                                {formatArgentineNumber(transaction.amount)}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3 text-blue-400" />
                                {formatArgentineNumber(transaction.amount)}
                              </div>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < transfers.length - 1 && (
                      <Separator className="my-4 bg-border" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button
              className="w-full bg-primary border-0 my-2"
              onClick={() => router.push("/history?tab=transfers")}
            >
              <History className="w-4 h-4 mr-2" />
              Ver todas las transacciones
            </Button>
            <Card className="mb-2 bg-card border-0 shadow-none">
              <CardContent className="p-0">
                <Button
                  variant="ghost"
                  className="w-full justify-center px-4 py-3 rounded-none h-auto hover:bg-secondary/50"
                  onClick={() => router.push("/profile-detail")}
                >
                  <User className="w-5 h-5 mr-3" />
                  Editar perfil
                </Button>
                {/* <Separator className="bg-border" /> */}
                {/* <Button
                  variant="ghost"
                  className="w-full justify-start px-4 py-3 rounded-none h-auto hover:bg-secondary/50"
                  onClick={() => router.push("/payment-methods")}
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  Métodos de pago
                </Button> */}
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="w-full gap-2 text-red-500 hover:text-red-600 bg-secondary border-0 hover:bg-red-900/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </TabsContent>

          {/* Pestaña de Saldo - Botones circulares con texto al lado */}
          <TabsContent value="balance">
            <div className="space-y-6">
              <Card className="bg-card border-0 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center mb-2">
                    <Wallet className="w-5 h-5 mr-2 text-primary" />
                    <h3 className="text-lg font-bold">Tu saldo disponible</h3>
                  </div>
                  <p className="text-3xl font-bold mb-6">
                    ${formatArgentineNumber(userData?.balance || 0)}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 mr-3"
                        onClick={() => router.push("/add-balance")}
                        title="Agregar saldo"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                      <span className="text-sm">Agregar saldo</span>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 rounded-full bg-secondary border-0 hover:bg-secondary/80 mr-3"
                        onClick={() => router.push("/transfer")}
                        title="Transferir"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                      <span className="text-sm">Transferir</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pestaña de Historial */}
          {/* <TabsContent value="history">
            <div className="space-y-4">
              <Card className="bg-card border-0 shadow-none">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 rounded-none h-auto hover:bg-secondary/50"
                    onClick={() => router.push("/history")}
                  >
                    <Receipt className="w-5 h-5 mr-3" />
                    Historial de pedidos
                  </Button>
                  <Separator className="bg-border" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 rounded-none h-auto hover:bg-secondary/50"
                    onClick={() => router.push("/history?tab=transfers")}
                  >
                    <CreditCard className="w-5 h-5 mr-3" />
                    Historial de transferencias
                  </Button>
                  <Separator className="bg-border" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-3 rounded-none h-auto hover:bg-secondary/50"
                    onClick={() => router.push("/gifts")}
                  >
                    <Gift className="w-5 h-5 mr-3" />
                    Mis cortesías
                  </Button>
                </CardContent>
              </Card>

              <h3 className="font-bold mb-3">Actividad reciente</h3>
              <Card className="bg-card border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start">
                    <div className="bg-secondary rounded-full p-2 mr-3">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Pedido #A-1234</p>
                          <p className="text-sm text-muted-foreground">
                            2 Cerveza Artesanal, 1 Nachos con Queso
                          </p>
                        </div>
                        <p className="text-sm font-medium">$1,300.00</p>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground mr-1" />
                        <p className="text-xs text-muted-foreground">
                          Hoy, 18:30
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-start">
                    <div className="bg-secondary rounded-full p-2 mr-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Transferencia enviada</p>
                          <p className="text-sm text-muted-foreground">
                            A María García
                          </p>
                        </div>
                        <p className="text-sm font-medium">$200.00</p>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground mr-1" />
                        <p className="text-xs text-muted-foreground">
                          Hoy, 14:30
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/history")}
              >
                <History className="w-4 h-4 mr-2" />
                Ver historial completo
              </Button>
            </div>
          </TabsContent> */}

          <TabsContent value="qr">
            <div className="flex flex-col items-center text-center mb-6">
              <h2 className="text-lg font-bold mb-4">
                Tu código de identificación
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Muestra este código QR para identificarte rápidamente en eventos
                y promociones
              </p>

              <Card className="w-full max-w-xs mb-6 bg-card border-0 shadow-none">
                <CardContent className="p-6 flex flex-col items-center">
                  <div className="bg-black p-4 rounded-lg mb-4">
                    <div className="w-56 h-56 flex items-center justify-center">
                      <QRCodeSVG
                        id="qr-canvas"
                        value={`${userData?.userId}`}
                        size={160}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="flex items-center w-full">
                    <div className="flex-1 text-center font-mono text-sm font-bold truncate">
                      {userData?.userId || ""}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-secondary border-0 hover:bg-secondary/80"
                      onClick={copyUserId}
                    >
                      {codeCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full gap-2 bg-secondary border-0 hover:bg-secondary/80 mb-2"
                onClick={shareProfile}
              >
                <Share2 className="w-4 h-4" />
                Compartir mi perfil
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                Este código QR contiene tu identificador único de usuario.
                Compártelo con amigos para conectar o muéstralo en eventos para
                registrar tu asistencia.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
