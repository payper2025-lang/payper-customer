"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Banknote, QrCode, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { shortenId } from "@/utils/utils"


export default function AddBalancePage() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [paymentType, setPaymentType] = useState("card")
  const [codeCopied, setCodeCopied] = useState(false)
  const { user, profile } = useAuth();
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [isAddingBalance, setIsAddingBalance] = useState(false)
  // Datos de usuario simulados - en una app real vendrían de un estado global o API
  const userData = {
    name: profile?.name,
    userId: user?.id,
    qrData: "barapp://user/USR7A2B",
    email: user?.email,
  }

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would process the payment here
    setIsAddingBalance(true)
    const res = await fetch("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chargeAmount: Number(amount),
        userId: userData?.userId,
        payer: {
          email: user?.email,
          name: userData?.name,
        },
      }),
    })
    const data = await res.json()

    console.log('payment link -------->', data.data)
    setPaymentLink(data.data.payment_url)
    setPaymentModal(true)
    setIsAddingBalance(false)
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(userData?.userId || "");
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const presetAmounts = [100, 200, 500, 1000]

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Agregar saldo</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <Tabs defaultValue="card" value={paymentType} onValueChange={setPaymentType} className="mb-6">
          <TabsList className="w-full bg-secondary mb-4 p-1">
            <TabsTrigger value="card" className="flex-1">
              <CreditCard className="w-4 h-4 mr-2" />
              Tarjeta
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex-1">
              <Banknote className="w-4 h-4 mr-2" />
              Efectivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card">
            <form onSubmit={handleAddBalance}>
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">Monto</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === preset.toString() ? "default" : "outline"}
                      onClick={() => setAmount(preset.toString())}
                      className={
                        amount === preset.toString()
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary border-0 hover:bg-secondary/80"
                      }
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Otro monto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="0.00"
                      className="pl-8 bg-secondary border-border"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">Método de pago</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <Card
                    className={`bg-card border-0 shadow-none ${paymentMethod === "card1" ? "ring-2 ring-primary" : ""}`}
                  >
                    <CardContent className="p-3 flex items-center space-x-3">
                      <RadioGroupItem value="card1" id="card1" className="border-primary text-primary" />
                      <Label htmlFor="card1" className="flex-1 flex items-center">
                        <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Visa terminada en 4242</div>
                          <div className="text-sm text-muted-foreground">Expira 12/25</div>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card
                    className={`bg-card border-0 shadow-none ${paymentMethod === "card2" ? "ring-2 ring-primary" : ""}`}
                  >
                    <CardContent className="p-3 flex items-center space-x-3">
                      <RadioGroupItem value="card2" id="card2" className="border-primary text-primary" />
                      <Label htmlFor="card2" className="flex-1 flex items-center">
                        <CreditCard className="w-5 h-5 mr-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Mastercard terminada en 5678</div>
                          <div className="text-sm text-muted-foreground">Expira 08/24</div>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div> */}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!amount || Number.parseFloat(amount) <= 0 || isAddingBalance}
              >
                {isAddingBalance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Agregar ${amount ? Number.parseFloat(amount).toFixed(2) : "0.00"}`
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="cash">
            {/* Información de usuario más compacta */}
            <div className="mb-4">
              <Badge
                variant="outline"
                className="py-2 px-3 bg-secondary border-0 text-foreground flex items-center justify-between w-full"
              >
                <span className="font-medium">{userData?.name || userData?.email}</span>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2">ID: {shortenId(userData?.userId || "")}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={copyUserId}>
                    {codeCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </Badge>
            </div>

            <Card className="w-full mb-6 bg-card border-0 shadow-none">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="bg-black p-4 rounded-lg mb-4">
                  <div className="w-48 h-48 flex items-center justify-center">
                    <QRCodeSVG
                      id="qr-canvas"
                      value={`${userData?.userId}/${amount}`}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Muestra este código al cajero para agregar saldo en efectivo
                </p>
              </CardContent>
            </Card>

            <div className="mb-6">
              <h2 className="text-lg font-bold mb-4">Monto a agregar</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset.toString() ? "default" : "outline"}
                    onClick={() => setAmount(preset.toString())}
                    className={
                      amount === preset.toString()
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border-0 hover:bg-secondary/80"
                    }
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash-amount">Otro monto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="cash-amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-8 bg-secondary border-border"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Card className="bg-card border-0 shadow-none p-4">
                <div className="flex items-center">
                  <Banknote className="w-6 h-6 mr-3 text-primary" />
                  <div>
                    <h3 className="font-medium">Instrucciones</h3>
                    <p className="text-sm text-muted-foreground">1. Muestra este código QR al cajero</p>
                    <p className="text-sm text-muted-foreground">2. Entrega el efectivo correspondiente</p>
                    <p className="text-sm text-muted-foreground">3. El cajero confirmará la carga del saldo</p>
                  </div>
                </div>
              </Card>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/menu")}
              >
                Volver al menú
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
          <DialogContent className="sm:max-w-100vw bg-card border-0">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-1">{`Complete your payment`}</h2>
              <p className="text-sm text-muted-foreground">
                The payment link is:{" "}
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {paymentLink}
                </a>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

