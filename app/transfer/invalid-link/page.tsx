// app/transfer/invalid-link/page.tsx
"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function InvalidLinkPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid Payment Link</h1>
          <p className="text-muted-foreground">
            This payment link is either expired, already used, or doesn't exist.
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <Button onClick={() => router.push("/transfer")}>
            Create New Transfer
          </Button>
          <Button variant="outline" onClick={() => router.push("/menu")}>
            Return to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}