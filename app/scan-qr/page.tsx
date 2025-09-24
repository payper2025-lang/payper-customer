"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrScanner } from "@/app/(components)/qr-scanner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

export default function ScanQrPage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  // In a real app, you would implement actual QR scanning
  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
      // Simulate successful scan
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryCode, setManualEntryCode] = useState("");

  const handleUpdateQrId = async (qr_id: string) => {
    setLoading(true);
    await fetch(`/api/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user?.id,
        qr_id: qr_id,
      }),
    });
    setLoading(false);
    refreshSession();
    router.push("/menu");
  };

  const handleManualEntry = async () => {
    // Handle manual table code entry
    await handleUpdateQrId(manualEntryCode.split("/").pop() || "");
    setIsManualEntryOpen(false);
    setManualEntryCode("");
  };

  const handleScan = async (result: string) => {
    console.log(result);
    await handleUpdateQrId(result.split("/").pop() || "");
  };

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Escanear código QR</h1>
        </div>
      </header>

      <main className="flex-1 container px-4 py-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle>Escanea el código QR</CardTitle>
            <CardDescription>
              Apunta la cámara al código QR ubicado en tu mesa
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full aspect-square bg-black/10 dark:bg-black/30 rounded-lg mb-4 flex items-center justify-center">
              <QrScanner onScan={handleScan} />
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 bg-secondary border-0 hover:bg-secondary/80"
              onClick={() => setIsManualEntryOpen(true)}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Ingresar código manualmente"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
      {/* manual entry modal */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ingrese el código manualmente</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            placeholder="Ingrese el código"
            value={manualEntryCode}
            onChange={(e) => setManualEntryCode(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              className="mb-2"
              onClick={() => setIsManualEntryOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="mb-2"
              onClick={handleManualEntry}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Ingresar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
