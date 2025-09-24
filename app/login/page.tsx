"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/utils/supabase/client";
import { AuthSupaTheme } from "@/utils/supabase/theme";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const supabaseClient = createClient();
  const router = useRouter();

  const { user } = useAuth();
  const [redirectDomain, setRedirectDomain] = useState<string>("");

  useEffect(() => {
    setRedirectDomain(window.location.origin);
  }, []);
  useEffect(() => {
    const redirectTo = localStorage.getItem("redirectTo") || "/menu";
    if (user) {
      router.push(redirectTo);
      localStorage.removeItem("redirectTo");
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-12 min-h-screen items-center justify-center bg-background p-4">
      <img src="/images/icon.png" alt="logo" className="h-[60px]" />
      <Card className="w-full max-w-md ">
        <CardHeader className="text-center mb-4">
          {/* <CardTitle className="text-2xl">Crear cuenta</CardTitle> */}
          <CardDescription>
            ¡Registrate en segundos y pedí sin hacer fila!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabaseClient}
            providers={["google"]}
            // redirectTo={`${redirectDomain}${redirectTo}`}
            appearance={{ theme: ThemeSupa, variables: AuthSupaTheme }}
            socialLayout="horizontal"
          />
        </CardContent>
      </Card>
    </div>
  );
}
