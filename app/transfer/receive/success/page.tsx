"use client"

import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ReceiveSuccessPage() {
  const router = useRouter()

  // En una app real, estos datos vendrían del estado o de la API
  const transferAmount = 200
  const sender = "Juan Pérez"
  const transferId = "T-" + Math.random().toString(36).substring(2, 8).toUpperCase()
  const transferDate = new Date().toLocaleString()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Transferencia recibida!</h1>
          <p className="text-muted-foreground">
            Has recibido ${transferAmount.toFixed(2)} de {sender}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm text-muted-foreground">ID de transferencia</h2>
                <p className="font-medium">{transferId}</p>
              </div>
              <Separator />
              <div>
                <h2 className="text-sm text-muted-foreground">Fecha y hora</h2>
                <p className="font-medium">{transferDate}</p>
              </div>
              <Separator />
              <div>
                <h2 className="text-sm text-muted-foreground">Remitente</h2>
                <p className="font-medium">{sender}</p>
              </div>
              <Separator />
              <div>
                <h2 className="text-sm text-muted-foreground">Monto</h2>
                <p className="font-medium">${transferAmount.toFixed(2)}</p>
              </div>
              <Separator />
              <div>
                <h2 className="text-sm text-muted-foreground">Nuevo saldo</h2>
                <p className="font-medium">$1,450.00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/history")}>
            Ver historial
          </Button>
          <Button className="flex-1" onClick={() => router.push("/")}>
            Volver al inicio
          </Button>
        </div>
      </main>
    </div>
  )
}

