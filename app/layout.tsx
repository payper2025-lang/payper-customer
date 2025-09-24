import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContxt";
const inter = Inter({ subsets: ["latin"] });
import Layout from "@/app/(components)/layout";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Suspense } from 'react'
import Loading from "@/components/ui/loading";
import { ProtectedRoute } from '@/context/ProtectedRoute'

export const metadata: Metadata = {
  title: "BarApp - Pedidos en bares",
  description: "Aplicación para realizar pedidos en bares y restaurantes",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<Loading />}>
                <ProtectedRoute>
                  <Layout>{children}</Layout>
                </ProtectedRoute>
              </Suspense>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
