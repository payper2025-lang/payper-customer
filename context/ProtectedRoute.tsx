"use client";

import { useAuth } from "./AuthContext";
import Loading from "@/components/ui/loading";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, setQrId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname.includes("qr-tracking")) {
      if (user) {
        setQrId(pathname.split("/").pop() || "", user.id);
      } else {
        localStorage.setItem("qrId", pathname.split("/").pop() || "");
      }
      router.push("/menu");
    }
    // Skip if still loading or already authorized
    if (isLoading || isAuthorized) return;

    // Define public routes that don't require authentication
    const publicRoutes = ["/login"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!user && !isLoading && !isPublicRoute) {
      // Store the attempted URL for redirect after login
      localStorage.setItem("redirectTo", pathname);
      console.log("Redirecting to login:", pathname);
      router.push("/login");
      // } else if (user && isPublicRoute) {
      //   // Redirect away from auth pages if already logged in
      //   const redirectTo = localStorage.getItem("redirectTo") || "/menu";
      //   localStorage.removeItem("redirectTo");
      //   router.push(redirectTo);
    } else {
      setIsAuthorized(true);
    }
  }, [user, isLoading, pathname, router, isAuthorized]);

  // Show loading state while checking auth status
  if (!isAuthorized && !pathname.startsWith("/login")) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
};
