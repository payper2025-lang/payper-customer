"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Transfer } from "@/utils/types"
import {format} from "date-fns";
import { shortenId } from "@/utils/utils"
import { useSearchParams } from 'next/navigation';
import Loading from "@/components/ui/loading";

export default function TransferSuccessPage() {
  const searchParams = useSearchParams();
  const transferId = searchParams.get('transferId');
  const router = useRouter()
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);

  const getTransfer = async (transferId: string) => {
    setLoading(true)
    const res = await fetch(`/api/transfers/${transferId}`)
    const data = await res.json()
    setTransfer(data.data)
    setLoading(false)
  }

  useEffect(() => {
    if (transferId) {
      getTransfer(transferId)
    }
  }, [transferId])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex flex-col bg-background">
      <main className="flex-1 container px-4 py-6">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-green-900/20 rounded-full p-4 mb-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Transferencia exitosa!</h1>
          <p className="text-muted-foreground">
            Has transferido ${transfer?.amount.toFixed(2)} a {transfer?.user?.name || transfer?.user?.email}
          </p>
        </div>

        <Card className="mb-6 bg-card">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-sm text-muted-foreground">ID de transferencia</h2>
                <p className="font-medium">{shortenId(transfer?.id || "")}</p>
              </div>
              <Separator className="bg-border" />
              <div>
                <h2 className="text-sm text-muted-foreground">Fecha y hora</h2>
                <p className="font-medium">{format(new Date(transfer?.created_at || 0), "dd/MM/yyyy HH:mm:ss")}</p>
              </div>
              <Separator className="bg-border" />
              <div>
                <h2 className="text-sm text-muted-foreground">Destinatario</h2>
                <p className="font-medium">{transfer?.user?.name || transfer?.user?.email}</p>
              </div>
              <Separator className="bg-border" />
              <div>
                <h2 className="text-sm text-muted-foreground">Monto</h2>
                <p className="font-medium">${transfer?.amount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 border-border" onClick={() => router.push("/history")}>
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

