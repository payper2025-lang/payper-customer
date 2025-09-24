"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, Copy, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"
import { Gift } from "@/utils/types"
import { shortenId } from "@/utils/utils";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/utils/supabase/client"

export default function RedeemGiftPage() {
  const router = useRouter()
  const params = useParams();
  const giftId = params?.id;

  const [codeCopied, setCodeCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [progress, setProgress] = useState(100)

  const [gift, setGift] = useState<Gift | null>(null)

  // En una app real, estos datos vendrían de una API basados en el ID del regalo
  // const gift = {
  //   id: giftId,
  //   name: "Margarita Clásica",
  //   image: "/placeholder.svg?height=300&width=300",
  //   sender: {
  //     name: "Juan Pérez",
  //     avatar: "/placeholder.svg?height=40&width=40",
  //   },
  //   message: "¡Disfrutalo en la casa!",
  //   code: "GFT" + Math.random().toString().substring(2, 8),
  // }

  useEffect(() => {
    if (!giftId) return;
    const fetchGift = async () => {
      const res = await fetch(`/api/gifts?giftId=${giftId}`)
      const data = await res.json()
      setGift(data.data[0])
    }
    fetchGift()
  }, [giftId])


  useEffect(() => {
      if (!giftId) return;
      
      console.log('giftId ----->', giftId);
      const channel = supabase
        .channel('gifts_realtime_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gifts',
            filter: `id=eq.${giftId}`,
          },
          async (payload: any) => {
            try {
              console.log('Received payload -------> ', payload);
              if(payload.new.status == "redeemed") {
                router.push("/gifts/redeem/success")
              }
            } catch (err) {
              console.error('Error processing order update:', err);
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to gifts changes');
          }
          if (err) {
            console.error('Subscription error:', err);
          }
        });
    }, [giftId]);
  
  // Temporizador para la validez del QR
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTimeLeft((prev) => {
  //       if (prev <= 1) {
  //         clearInterval(interval)
  //         return 0
  //       }
  //       return prev - 1
  //     })
  //   }, 1000)

  //   return () => clearInterval(interval)
  // }, [])

  // Actualizar la barra de progreso
  // useEffect(() => {
  //   setProgress((timeLeft / 600) * 100)
  // }, [timeLeft])

  // const formatTime = (seconds: number) => {
  //   const mins = Math.floor(seconds / 60)
  //   const secs = seconds % 60
  //   return `${mins}:${secs.toString().padStart(2, "0")}`
  // }

  const copyCode = () => {
    // navigator.clipboard.writeText(gift?.code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Canjear Regalo</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-xl font-bold mb-2">{gift?.products?.name}</h2>
          <p className="text-muted-foreground mb-4">Mostrá este QR en la barra para recibir tu regalo</p>

          <Card className="w-full max-w-xs mb-6 bg-card border-0 shadow-none">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                {/* <QrCode className="w-48 h-48 text-black" /> */}
                <QRCodeSVG value={gift?.id || ""} size={128} />
              </div>

              <div className="flex items-center w-full">
                <div className="flex-1 text-center font-mono text-xl font-bold">{shortenId(gift?.id || "")}</div>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-secondary border-0 hover:bg-secondary/80"
                  onClick={copyCode}
                >
                  {codeCopied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* <div className="w-full max-w-xs mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>Válido por {formatTime(timeLeft)}</span>
              </div>
              <span className="text-sm font-medium">{progress > 0 ? "Activo" : "Expirado"}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Este código QR es válido por 10 minutos una vez generado. Si expira, puedes generar uno nuevo.
          </p> */}
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full bg-secondary border-0 hover:bg-secondary/80"
            onClick={() => router.push("/gifts")}
          >
            Cancelar y volver
          </Button>
        </div>
      </main>
    </div>
  )
}

