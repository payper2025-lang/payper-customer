"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Wallet,
  DollarSign,
  MapPin,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  address: z.string().optional(),
  phone: z.string().min(8, "Teléfono debe tener al menos 8 dígitos").optional(),
});

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, profile, refreshSession } = useAuth();
  console.log(profile);
  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      email: user?.email || "",
      address: profile?.address || "",
      phone: profile?.phone || "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        email: user?.email || "",
        address: profile.address || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    try {
      // Update profile in Supabase
      const data = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: profile?.id,
          email: values.email,
          name: values.name,
          address: values.address,
          phone: values.phone,
        }),
      });

      if (!data.ok) throw new Error("Error updating profile");
      refreshSession();
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente",
      });
      router.push("/profile");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Editar Perfil</h1>
        </div>
      </header>

      {/* Profile Form */}
      <main className="flex-1 container px-4 py-6">
        {/* <h3 className="font-bold mb-3">Notificaciones</h3>
        <Card className="mb-6 bg-card border-0 shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push">Notificaciones push</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe alertas sobre tus pedidos
                </p>
              </div>
              <Switch id="push" defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email">Notificaciones por email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe resúmenes de tus pedidos
                </p>
              </div>
              <Switch id="email" defaultChecked />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Ofertas y promociones</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe ofertas especiales y descuentos
                </p>
              </div>
              <Switch id="marketing" />
            </div>
          </CardContent>
        </Card> */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 mr-3 text-muted-foreground" />
                    <FormLabel>Nombre</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder="Tu nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <Mail className="w-5 h-5 mr-3 text-muted-foreground" />
                    <FormLabel>Email</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Field */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <MapPin className="w-5 h-5 mr-3 text-muted-foreground" />
                    <FormLabel>Dirección</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder="Tu dirección" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Field */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center mb-2">
                    <Phone className="w-5 h-5 mr-3 text-muted-foreground" />
                    <FormLabel>Teléfono</FormLabel>
                  </div>
                  <FormControl>
                    <Input placeholder="Número de teléfono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Read-only Fields */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Miembro desde</p>
                  <p>
                    {new Date(
                      profile?.created_at || new Date()
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Wallet className="w-5 h-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Saldo actual</p>
                  <p className="text-green-500 font-medium">
                    ${profile?.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={() => router.push("/profile")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
