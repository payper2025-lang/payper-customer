"use client"

import { useRouter } from "next/navigation"
import { CheckCircle, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function OrderDeliveredPage() {
  const router = useRouter()

  // En una app real, estos datos vendrían del estado o de la API
  const order = {
    id: "A-1234",
    date: new Date().toLocaleString(),
    items: [
      { name: "Cerveza Artesanal", quantity: 2, price: 350 },
      { name: "Nachos con Queso", quantity: 1, price: 600 },
    ],
    total: 1300,
    server: {
      name: "Carlos",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  }

  const rateOrder = () => {
    // En una app real, mostrarías un formulario de calificación
    alert("¡Gracias por calificar tu pedido!")
    router.push("/")
  }

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-green-900/20 rounded-full p-4 mb-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Pedido entregado! 🎉</h1>
          <p className="text-muted-foreground">Tu pedido ha sido entregado correctamente</p>
        </div>

        <Card className="mb-6 bg-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={order.server.avatar} alt={order.server.name} />
                <AvatarFallback>{order.server.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-bold">Entregado por {order.server.name}</h2>
                <p className="text-sm text-muted-foreground">{order.date}</p>
              </div>
            </div>

            <Separator className="mb-4 bg-border" />

            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="mb-4 bg-border" />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center mb-6">
          <h2 className="text-lg font-bold mb-2">¿Cómo fue tu experiencia?</h2>
          <p className="text-sm text-center text-muted-foreground mb-4">Califica tu pedido y ayúdanos a mejorar</p>
          <div className="flex space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                size="icon"
                className="h-12 w-12 bg-secondary border-0 hover:bg-primary/20"
              >
                <Star className={`h-6 w-6 ${rating <= 3 ? "text-muted-foreground" : "text-primary"}`} />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={rateOrder}>
            <MessageSquare className="w-4 h-4" />
            Dejar comentario
          </Button>

          <Button
            variant="outline"
            className="w-full bg-secondary border-0 hover:bg-secondary/80"
            onClick={() => router.push("/")}
          >
            Volver al inicio
          </Button>
        </div>
      </main>
    </div>
  )
}

