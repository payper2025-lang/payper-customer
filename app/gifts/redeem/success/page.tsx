"use client"

import { useRouter } from "next/navigation"
import { CheckCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function RedeemSuccessPage() {
  const router = useRouter()

  // En una app real, estos datos vendrían del estado o de la API
  const gift = {
    name: "Margarita Clásica",
    image: "/placeholder.svg?height=300&width=300",
    sender: {
      name: "Juan Pérez",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    date: new Date().toLocaleString(),
    location: "Bar La Esquina",
  }

  const sendThanks = () => {
    // En una app real, enviarías un agradecimiento al remitente
    alert("¡Gracias enviadas a " + gift.sender.name + "!")
    router.push("/gifts")
  }

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/20 rounded-full p-4 mb-4">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Tu regalo fue canjeado! 🎉</h1>
          <p className="text-muted-foreground">Disfrutá tu {gift.name}</p>
        </div>

        <Card className="mb-6 bg-card border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <div
                className="w-16 h-16 bg-center bg-cover rounded-md mr-4"
                style={{ backgroundImage: `url(${gift.image})` }}
              />
              <div>
                <h2 className="font-bold text-lg">{gift.name}</h2>
                <div className="flex items-center">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={gift.sender.avatar} alt={gift.sender.name} />
                    <AvatarFallback>{gift.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Regalo de {gift.sender.name}</p>
                </div>
              </div>
            </div>

            <Separator className="my-4 bg-border" />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-muted-foreground">Fecha y hora de canje</h3>
                <p className="font-medium">{gift.date}</p>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground">Lugar de canje</h3>
                <p className="font-medium">{gift.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={sendThanks}>
            <MessageSquare className="w-4 h-4" />
            Agradecer a {gift.sender.name}
          </Button>

          <Button
            variant="outline"
            className="w-full bg-secondary border-0 hover:bg-secondary/80"
            onClick={() => router.push("/gifts")}
          >
            Volver a mis regalos
          </Button>
        </div>
      </main>
    </div>
  )
}

