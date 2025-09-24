"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, Link, QrCode, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import { QRCodeSVG } from "qrcode.react"


export default function TransferPage() {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [note, setNote] = useState("")
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const { user, profile, refreshSession } = useAuth();
  const [transferLink, setTransferLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [sending, setSending] = useState(false);

  const handleDirectTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if(recipient == user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No puedes transferir saldo a ti mismo",
      })
      return
    }
    setSending(true)
    const res = await fetch("/api/payment/transfer-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromUser: profile?.id,
        toUserEmail: recipient,
        amount: Number(amount),
        note: note,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast({
        variant: "destructive",
        title: "Error",
        description: data.message,
      })
      return
    }
    console.log("Transfer result:", data)
    router.push(`/transfer/success?transferId=${data.data.transfer_id}`)
    refreshSession()
    setSending(false)
  }

  const generateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsGeneratingLink(true)
      const res = await fetch('/api/payment/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          note,
          userId: profile?.id
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error,
        });
        setIsGeneratingLink(false)
        return;
      }
      
      setTransferLink(data.paymentLink);
      setLinkGenerated(true);
      setIsGeneratingLink(false)
      
    } catch (error) {
      setIsGeneratingLink(false)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate payment link",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(transferLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const presetAmounts = [100, 200, 500, 1000];

  const handleAmountChange = (value: string) => {
    if (Number(value) < (profile?.balance || 0)) {
      setAmount(value);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No tienes saldo suficiente",
      })
      setAmount('');
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Transferir saldo</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6">
        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card">
            <TabsTrigger value="direct">Transferencia directa</TabsTrigger>
            <TabsTrigger value="link">Generar link</TabsTrigger>
          </TabsList>

          <TabsContent value="direct">
            <form onSubmit={handleDirectTransfer}>
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-4">Monto a transferir</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {presetAmounts.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === preset.toString() ? "default" : "outline"}
                      onClick={() => setAmount(preset.toString())}
                      className={amount === preset.toString() ? "" : "border-border"}
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
                      className="pl-8 bg-secondary border-input"
                      max={profile?.balance}
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="recipient">Destinatario</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="Email o teléfono"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="bg-secondary border-input"
                />
              </div>

              <div className="space-y-2 mb-6">
                <Label htmlFor="note">Nota (opcional)</Label>
                <Input
                  id="note"
                  type="text"
                  placeholder="Ej: Pago de la cuenta"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-secondary border-input"
                />
              </div>

              <Card className="mb-6 bg-card">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <span>Monto a transferir</span>
                    <span>${amount ? Number.parseFloat(amount).toFixed(2) : "0.00"}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Comisión</span>
                    <span>$0.00</span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${amount ? Number.parseFloat(amount).toFixed(2) : "0.00"}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!amount || Number.parseFloat(amount) <= 0 || !recipient || sending}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Transferir
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="link">
            {!linkGenerated ? (
              <form onSubmit={generateLink}>
                <div className="mb-6">
                  <h2 className="text-lg font-bold mb-4">Monto a transferir</h2>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {presetAmounts.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={amount === preset.toString() ? "default" : "outline"}
                        onClick={() => setAmount(preset.toString())}
                        className={amount === preset.toString() ? "" : "border-border"}
                      >
                        ${preset}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-amount">Otro monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="link-amount"
                        type="number"
                        placeholder="0.00"
                        className="pl-8 bg-secondary border-input"
                        max={profile?.balance}
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="link-note">Nota (opcional)</Label>
                  <Input
                    id="link-note"
                    type="text"
                    placeholder="Ej: Pago de la cuenta"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="bg-secondary border-input"
                  />
                </div>

                <Card className="mb-6 bg-card">
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
                      <span>Monto a transferir</span>
                      <span>${amount ? Number.parseFloat(amount).toFixed(2) : "0.00"}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Comisión</span>
                      <span>$0.00</span>
                    </div>
                    <Separator className="my-2 bg-border" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${amount ? Number.parseFloat(amount).toFixed(2) : "0.00"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full gap-2" disabled={!amount || Number.parseFloat(amount) <= 0 || isGeneratingLink}>
                  {isGeneratingLink ? <Loading /> : "Generar link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-bold mb-2">¡Link generado!</h2>
                  <p className="text-muted-foreground mb-6">
                    Comparte este link con quien quieras transferir ${amount}
                  </p>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border mb-6 flex flex-col items-center">
                  <div className="w-48 h-48 bg-black flex items-center justify-center mb-4">
                  <QRCodeSVG
                      id="qr-canvas"
                      value={transferLink}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-center font-medium">
                    Escanea este código QR para recibir la transferencia
                  </p>
                </div>

                <Card className="mb-6 bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Input readOnly value={transferLink} className="mr-2 bg-secondary border-input" />
                      <Button variant="outline" size="icon" onClick={copyLink} className="border-border">
                        {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => router.push("/menu")}>
                    Volver al inicio
                  </Button>
                  <Button variant="outline" className="w-full border-border" onClick={() => setLinkGenerated(false)}>
                    Generar otro link
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

