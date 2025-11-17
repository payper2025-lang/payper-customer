"use client";

import { useAuth } from "./AuthContext";
import { useApp } from "./AppContxt";
import Loading from "@/components/ui/loading";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleKey } from "@/utils/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, ArrowLeft } from "lucide-react";

// Define route to module mapping
const ROUTE_MODULES: Record<string, ModuleKey> = {
  '/menu': 'qrmenu',
  '/cart': 'qrmenu',
  '/gifts': 'complimentary_gifts',
  '/add-balance': 'add_balance',
  '/profile': 'qrmenu',
  '/transfer': 'qrmenu',
  '/transfer-balance': 'qrmenu',
  '/my-qr': 'qrmenu',
  '/scan-qr': 'qrmenu',
  '/history': 'qrmenu',
  '/order-confirmation': 'qrmenu',
  '/order-delivered': 'qrmenu',
  '/product': 'qrmenu',
};

// Routes that don't require module checks (always accessible if authenticated)
const AUTH_ONLY_ROUTES = [
  '/profile-detail',
  '/payment',
];

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, setQrId } = useAuth();
  const { isModuleEnabled, tenantModulesLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState<"auth" | "module">("auth");

  useEffect(() => {
    // Handle QR tracking redirect
    if (pathname.includes("qr-tracking")) {
      if (user) {
        setQrId(pathname.split("/").pop() || "", user.id);
      } else {
        localStorage.setItem("qrId", pathname.split("/").pop() || "");
      }
      router.push("/menu");
      return;
    }

    // Skip if still loading
    if (isLoading || tenantModulesLoading) {
      return;
    }

    // Define public routes that don't require authentication
    const publicRoutes = ["/login", "/auth"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Check authentication first
    if (!user && !isPublicRoute) {
      // Store the attempted URL for redirect after login
      localStorage.setItem("redirectTo", pathname);
      console.log("Redirecting to login:", pathname);
      router.push("/login");
      setAccessDenied(false);
      setIsAuthorized(false);
      return;
    }

    // If public route, allow access
    if (isPublicRoute) {
      setIsAuthorized(true);
      setAccessDenied(false);
      return;
    }

    // Check if route requires only authentication (no module check)
    const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route =>
      pathname.startsWith(route)
    );

    if (isAuthOnlyRoute) {
      setIsAuthorized(true);
      setAccessDenied(false);
      return;
    }

    // Check module access for protected routes
    const requiredModule = Object.keys(ROUTE_MODULES).find(route =>
      pathname.startsWith(route)
    );

    if (requiredModule) {
      const moduleKey = ROUTE_MODULES[requiredModule];
      const hasModuleAccess = isModuleEnabled(moduleKey);

      if (!hasModuleAccess) {
        console.warn(`⚠️ Module '${moduleKey}' not enabled for route '${pathname}'`);
        setDenialReason("module");
        setAccessDenied(true);
        setIsAuthorized(false);
        return;
      }
    }

    // Access granted
    setIsAuthorized(true);
    setAccessDenied(false);
  }, [user, isLoading, tenantModulesLoading, pathname, router, isModuleEnabled, setQrId]);

  // Show loading state while checking auth status
  if ((isLoading || tenantModulesLoading) && !pathname.startsWith("/login")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Show access denied message
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              {denialReason === "module" ? (
                <Lock className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              <CardTitle>Acceso Denegado</CardTitle>
            </div>
            <CardDescription>
              {denialReason === "module"
                ? "Esta funcionalidad no está habilitada para tu organización."
                : "No tienes permisos para acceder a esta página."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {denialReason === "module"
                ? "Por favor, contacta con el administrador de tu organización para habilitar este módulo."
                : "Si crees que esto es un error, contacta con el administrador."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                onClick={() => router.push('/menu')}
                className="flex-1"
              >
                Ir al Menú
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while not authorized
  if (!isAuthorized && !pathname.startsWith("/login")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
};
