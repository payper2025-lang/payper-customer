"use client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gift,
  Clock,
  CheckCircle,
  MenuIcon,
  QrCode,
  User,
  Star,
  Trophy,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";
import { useApp } from "@/context/AppContxt";
import { format } from "date-fns";
export default function CortesiasPage() {
  const router = useRouter();

  const { gifts, fetchGifts } = useApp();
  console.log("gifts ------>", gifts);
  // En una app real, estos datos vendrían de una API
  const userPoints = 750;
  const nextRewardAt = 1000;
  const pointsToNext = nextRewardAt - userPoints;

  useEffect(() => {
    fetchGifts();
  }, []);

  // Cortesías canjeadas
  const redeemedCortesias = [
    {
      id: "g4",
      name: "Mojito",
      image: "/placeholder.svg?height=200&width=200",
      sender: {
        name: "Ana Martínez",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      message: "¡Feliz aniversario!",
      status: "redeemed",
      date: "15/06/2023, 21:30",
      location: "Bar La Esquina",
    },
  ];

  // Cortesías por desbloquear
  const lockedCortesias = [
    {
      id: "l1",
      name: "Gin Tonic Premium",
      image: "/placeholder.svg?height=200&width=200",
      pointsRequired: 1000,
      description: "Gin premium con tónica artesanal y botánicos seleccionados",
    },
    {
      id: "l2",
      name: "Whisky Single Malt",
      image: "/placeholder.svg?height=200&width=200",
      pointsRequired: 1500,
      description: "Whisky escocés de malta única, añejado 12 años",
    },
    {
      id: "l3",
      name: "Tabla de Degustación",
      image: "/placeholder.svg?height=200&width=200",
      pointsRequired: 2500,
      description: "Selección de 4 cervezas artesanales con maridaje de quesos",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-primary/20 text-primary border-0">
            Disponible
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-blue-900/20 text-blue-400 border-0">
            Pendiente de confirmación
          </Badge>
        );
      case "redeemed":
        return (
          <Badge className="bg-red-900/20 text-red-400 border-0">
            Canjeado
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleRedeemGift = (id: string) => {
    router.push(`/gifts/redeem/${id}`);
  };

  console.log("gifts", gifts);

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
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
                <span className="text-2xl font-bold">{userPoints}</span>
                <span className="text-sm text-muted-foreground"> pts</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Próxima cortesía a {nextRewardAt} pts</span>
                <span>
                  {userPoints}/{nextRewardAt}
                </span>
              </div>
              <Progress
                value={(userPoints / nextRewardAt) * 100}
                className="h-2"
              />
              <p className="text-sm text-muted-foreground text-center">
                ¡Te faltan {pointsToNext} puntos para desbloquear Gin Tonic
                Premium!
              </p>
            </div>
          </CardContent>
        </Card> */}

        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Tienes {gifts.filter((g) => g.status === "available").length}{" "}
            cortesías sin usar
          </p>
        </div>

        <Tabs defaultValue="available" className="mb-6">
          <TabsList className="w-full bg-secondary mb-4 p-1">
            <TabsTrigger value="available" className="flex-1">
              Disponibles
            </TabsTrigger>
            <TabsTrigger value="redeemed" className="flex-1">
              Canjeadas
            </TabsTrigger>
            {/* <TabsTrigger value="locked" className="flex-1">
              Por desbloquear
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {gifts
              .filter((g) => g.status === "pending")
              .map(
                (gift) =>
                  gift.products && (
                    <Card
                      key={gift.id}
                      className="overflow-hidden bg-card border-0 shadow-none"
                    >
                      <div className="flex">
                        <div
                          className="w-1/3 bg-center bg-cover"
                          style={{
                            backgroundImage: `url(${gift?.products?.image_url})`,
                          }}
                        />
                        <CardContent className="w-2/3 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">
                              {gift.products.name}
                            </h3>
                            {getStatusBadge("available")}
                          </div>

                          <div className="flex items-center mb-2">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={"/placeholder.svg?height=40&width=40"}
                                alt={gift?.sender?.email || gift?.sender?.name}
                              />
                              {/* <AvatarFallback>
                                {gift?.sender?.name.charAt(0) ||
                                  gift?.sender?.email.charAt(0)}
                              </AvatarFallback> */}
                            </Avatar>
                            <p className="text-sm text-muted-foreground">
                              Enviado por{" "}
                              {gift?.sender?.name || gift?.sender?.email}
                            </p>
                          </div>

                          {gift?.description && (
                            <p className="text-sm italic mb-3 text-muted-foreground">
                              "{gift.description}"
                            </p>
                          )}

                          <Button
                            className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleRedeemGift(gift.id)}
                            disabled={gift.status === "redeemed"}
                          >
                            {gift.status === "pending"
                              ? "Pendiente de confirmación"
                              : "Redeemed"}
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  )
              )}

            {gifts.filter((g) => g.status === "pending").length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-secondary rounded-full p-6 mb-4">
                  <Gift className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  No tienes cortesías disponibles
                </h2>
                <p className="text-muted-foreground mb-6">
                  Cuando recibas una cortesía, aparecerá aquí
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="redeemed" className="space-y-4">
            {gifts
              .filter((g) => g.status === "redeemed")
              .map(
                (gift) =>
                  gift.products && (
                    <Card
                      key={gift.id}
                      className="overflow-hidden bg-card border-0 shadow-none"
                    >
                      <div className="flex">
                        <div
                          className="w-1/3 bg-center bg-cover opacity-70"
                          style={{
                            backgroundImage: `url(${gift.products.image_url})`,
                          }}
                        />
                        <CardContent className="w-2/3 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">
                              {gift.products.name}
                            </h3>
                            {getStatusBadge(gift.status || "available")}
                          </div>

                          <div className="flex items-center mb-2">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={gift?.sender?.avatar}
                                alt={gift?.sender?.name}
                              />
                              {/* <AvatarFallback>
                                {gift?.sender?.name.charAt(0)}
                              </AvatarFallback> */}
                            </Avatar>
                            <p className="text-sm text-muted-foreground">
                              Enviado por {gift?.sender?.name}
                            </p>
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground mb-1">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              Canjeado el{" "}
                              {format(gift.created_at, "dd/MM/yyyy")}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>En {gift.products.name}</span>
                          </div>

                          {/* <Button
                        variant="outline"
                        className="w-full mt-3 bg-secondary border-0 hover:bg-secondary/80"
                        onClick={() => router.push(`/gifts/details/${gift.id}`)}
                      >
                        Ver detalles
                      </Button> */}
                        </CardContent>
                      </div>
                    </Card>
                  )
              )}

            {gifts.filter((g) => g.status === "redeemed").length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-secondary rounded-full p-6 mb-4">
                  <CheckCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  No tienes cortesías canjeadas
                </h2>
                <p className="text-muted-foreground mb-6">
                  Cuando canjees una cortesía, aparecerá aquí
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-4">
            {lockedCortesias.map((cortesia) => (
              <Card
                key={cortesia.id}
                className="overflow-hidden bg-card border-0 shadow-none"
              >
                <div className="flex">
                  <div
                    className="w-1/3 relative bg-center bg-cover grayscale"
                    style={{ backgroundImage: `url(${cortesia.image})` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Lock className="w-8 h-8 text-white/80" />
                    </div>
                  </div>
                  <CardContent className="w-2/3 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{cortesia.name}</h3>
                      <Badge
                        variant="outline"
                        className="bg-secondary/80 border-0"
                      >
                        {cortesia.pointsRequired} pts
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {cortesia.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tu progreso</span>
                        <span>
                          {userPoints}/{cortesia.pointsRequired}
                        </span>
                      </div>
                      <Progress
                        value={(userPoints / cortesia.pointsRequired) * 100}
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Te faltan {cortesia.pointsRequired - userPoints} puntos
                        para desbloquear
                      </p>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}

            {lockedCortesias.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-secondary rounded-full p-6 mb-4">
                  <Star className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  ¡Has desbloqueado todas las cortesías!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Sigue acumulando puntos para futuras recompensas
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
