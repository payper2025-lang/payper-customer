"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, Copy, Check, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MyQrPage() {
  const router = useRouter()
  const [codeCopied, setCodeCopied] = useState(false)

  // En una app real, estos datos vendrían de la API o estado global
  const user = {
    name: "Juan Pérez",
    userId: "USR" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    qrData: "barapp://user/USR" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    table: "12", // Agregar número de mesa
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(user.userId)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const shareProfile = () => {
    // En una app real, implementarías la funcionalidad de compartir
    if (navigator.share) {
      navigator.share({
        title: "Mi perfil en BarApp",
        text: `Conéctate conmigo en BarApp: ${user.userId}`,
        url: `https://barapp.com/user/${user.userId}`,
      })
    } else {
      alert("Compartir no está disponible en este dispositivo")
    }
  }

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Mi código QR</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h2 className="text-xl font-bold mb-2">{user.name}</h2>
            <Badge variant="outline" className="ml-2 py-0 h-5 bg-primary/10 text-primary border-0">
              Mesa {user.table}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6">Muestra este código para identificarte</p>

          <Card className="w-full max-w-xs mb-6 bg-card border-0 shadow-none">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-black p-4 rounded-lg mb-4">
                <div className="w-64 h-64 flex items-center justify-center">
                  <QrCode className="w-48 h-48 text-white" />
                </div>
              </div>

              <div className="flex items-center w-full">
                <div className="flex-1 text-center font-mono text-sm font-bold truncate">{user.userId}</div>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-secondary border-0 hover:bg-secondary/80"
                  onClick={copyUserId}
                >
                  {codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 w-full max-w-xs">
            <Button
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={shareProfile}
            >
              <Share2 className="w-4 h-4" />
              Compartir mi perfil
            </Button>

            <Button
              variant="outline"
              className="w-full bg-secondary border-0 hover:bg-secondary/80"
              onClick={() => router.push("/profile")}
            >
              Volver a mi perfil
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

