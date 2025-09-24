"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ReceiveTransferPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)

  // En una app real, estos datos vendrían de la API basados en el ID del link
  const transferId = params.id
  const sender = "Juan Pérez"
  const amount = 200
  const note = "Pago de la cuenta"

  const acceptTransfer = () => {
    setIsAccepting(true)
    // Simular proceso de aceptación
    setTimeout(() => {
      router.push("/transfer/receive/success")
    }, 1500)
  }

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Recibir transferencia</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/20 rounded-full p-4 mb-4">
            <ArrowDown className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">${amount.toFixed(2)}</h1>
          <p className="text-muted-foreground">{sender} quiere transferirte dinero</p>
        </div>

        <Card className="mb-6 bg-card">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm text-muted-foreground">De</h2>
                <p className="font-medium">{sender}</p>
              </div>
              <Separator className="bg-border" />
              <div>
                <h2 className="text-sm text-muted-foreground">Monto</h2>
                <p className="font-medium">${amount.toFixed(2)}</p>
              </div>
              {note && (
                <>
                  <Separator className="bg-border" />
                  <div>
                    <h2 className="text-sm text-muted-foreground">Nota</h2>
                    <p className="font-medium">{note}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full mb-4" onClick={acceptTransfer} disabled={isAccepting}>
          {isAccepting ? "Procesando..." : "Aceptar transferencia"}
        </Button>

        <Button
          variant="outline"
          className="w-full border-border"
          onClick={() => router.push("/")}
          disabled={isAccepting}
        >
          Rechazar
        </Button>
      </main>
    </div>
  )
}

