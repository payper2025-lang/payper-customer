"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Minus,
  Plus,
  Heart,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CartItem, Product } from "@/utils/types";
import Loading from "@/components/ui/loading";
import { useApp } from "@/context/AppContxt";
import { useAuth } from "@/context/AuthContext";
import { formatArgentineNumber } from "@/utils/utils";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const { cartItems, updateCartItems, inventories, fetchInventories } =
    useApp();

  // useEffect(() => {
  //   // Set default variant if available
  //   if (product?.variants && product?.variants.length > 0) {
  //     setSelectedVariant(product?.variants[0].id);
  //   }
  // }, [product?.variants]);

  useEffect(() => {
    if (profile?.qr_id?.bar_id) fetchInventories(profile?.qr_id?.bar_id);
  }, [profile]);

  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?id=${productId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const currentCartItem = cartItems.find((item) => item.id === productId);
    if (currentCartItem) {
      setQuantity(currentCartItem.quantity);
      setNotes(currentCartItem.notes || "");
    }

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product?.id && !product.recipe_id && !product.ingredient_id) {
      const inventory = inventories.find(
        (inventory) => inventory.product_id === product.id
      );

      if (inventory && product.stock > inventory.quantity) {
        setProduct({
          ...product,
          stock: inventory.quantity,
        });
      }
    }
  }, [product?.id, inventories]);



  const updateCartWithCurrentQuantity = (newQuantity: number, newNotes?: string) => {
    if (typeof productId !== "string") return;

    const existingItem = cartItems.find((item) => item.id === productId);
    const notesToUse = newNotes !== undefined ? newNotes : notes;

    if (newQuantity === 0) {
      // Remove item from cart if quantity is 0
      const updatedCart = cartItems.filter((item) => item.id !== productId);
      updateCartItems(updatedCart);
    } else {
      const updatedCart: CartItem[] = existingItem
        ? cartItems.map((item: CartItem) =>
            item.id === productId
              ? { ...item, quantity: newQuantity, notes: notesToUse || undefined }
              : item
          )
        : [...cartItems, { id: productId, quantity: newQuantity, notes: notesToUse || undefined }];

      updateCartItems(updatedCart);
    }
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    // If item is already in cart, update it with new notes
    if (cartItems.find((item) => item.id === productId)) {
      updateCartWithCurrentQuantity(quantity, newNotes);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      updateCartWithCurrentQuantity(newQuantity);
    }
  };

  const increaseQuantity = () => {
    // Allow unlimited quantity increase for products with recipe_id
    if (product?.recipe_id || product?.ingredient_id || (product?.stock && product.stock > quantity)) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      updateCartWithCurrentQuantity(newQuantity);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleExtraChange = (extraId: string, checked: boolean) => {
    if (checked) {
      setSelectedExtras([...selectedExtras, extraId]);
    } else {
      setSelectedExtras(selectedExtras.filter((id) => id !== extraId));
    }
  };

  const getVariantPrice = () => {
    if (!selectedVariant || !sampleProduct.variants) return 0;
    const variant = sampleProduct.variants.find(
      (v) => v.id === selectedVariant
    );
    return variant ? variant.additionalPrice : 0;
  };

  const getExtrasTotal = () => {
    if (!product?.extras) return 0;
    return product.extras
      .filter((extra) => selectedExtras.includes(extra.id))
      .reduce((sum, extra) => sum + extra.price, 0);
  };

  const getItemTotal = () => {
    return (
      ((product?.sale_price ?? 0) + getVariantPrice() + getExtrasTotal()) *
      quantity
    );
  };

  const addToCart = () => {
    if (typeof productId !== "string") {
      setError("Invalid product ID");
      return;
    }

    // Ensure the cart is updated with current quantity and notes
    updateCartWithCurrentQuantity(quantity);

    // Navigate to cart
    router.push("/cart");
  };

  return (
    <div className="flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="container flex items-center h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-bold">Detalle del producto</h1>
        </div>
      </header>
      {loading || !product ? (
        <Loading />
      ) : (
        <main className="flex-1 container px-4 py-6">
          {/* {sampleProduct?.hasVideo ? (
            <div className="relative w-full h-64 bg-black rounded-lg mb-6 overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={sampleProduct?.video}
                poster={sampleProduct?.image}
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/50 h-9 w-9 rounded-full"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-black/50 hover:bg-black/50 h-9 w-9 rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                Video
              </Badge>
            </div>
          ) : ( */}
          {/* <div
            className="w-full h-64 bg-center bg-cover rounded-lg mb-6"
            style={{ backgroundImage: `url(${product?.image_url})` }}
          /> */}
          <div
            className="relative h-56 bg-center bg-cover cursor-pointer group rounded-lg mb-2"
            style={{ backgroundImage: `url(${product?.image_url})` }}
          >
            {/* <div
              className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full 
                ${product?.stock < 5 ? "bg-red-600" : "bg-black/70"}`}
            >
              {product?.stock || 0} left
            </div> */}

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
          </div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{product?.name}</h1>
              <p className="text-xl font-bold text-primary">
                ${formatArgentineNumber(product?.sale_price)}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="bg-secondary border-0 hover:bg-secondary/80"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-6">
            {product?.description ||
              "Deliciosa bebida preparada con los mejores ingredientes. Perfecta para disfrutar en cualquier momento."}
          </p>

          <Separator className="my-6 bg-border" />

          {/* Variantes */}
          {/* {sampleProduct?.variants && sampleProduct?.variants.length > 0 && (
            <div className="mb-6">
              <h2 className="font-medium mb-3">Variantes</h2>
              <RadioGroup
                value={selectedVariant}
                onValueChange={setSelectedVariant}
                className="space-y-3"
              >
                {sampleProduct?.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center space-x-2 border border-border rounded-lg p-3"
                  >
                    <RadioGroupItem
                      value={variant.id}
                      id={variant.id}
                      className="border-primary text-primary"
                    />
                    <Label
                      htmlFor={variant.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{variant.name}</div>
                      {variant.additionalPrice > 0 && (
                        <div className="text-sm text-muted-foreground">
                          +${variant.additionalPrice.toFixed(2)}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )} */}

          {/* Extras */}
          {product?.extras && product?.extras.length > 0 && (
            <div className="mb-6">
              <h2 className="font-medium mb-3">Extras</h2>
              <div className="space-y-3">
                {product?.extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="flex items-start space-x-2 border border-border rounded-lg p-3"
                  >
                    <Checkbox
                      id={extra.id}
                      checked={selectedExtras.includes(extra.id)}
                      onCheckedChange={(checked) =>
                        handleExtraChange(extra.id, checked as boolean)
                      }
                      className="border-primary text-primary mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={extra.id}
                        className="font-medium cursor-pointer"
                      >
                        {extra.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {extra.description}
                      </p>
                      <p className="text-sm font-medium">
                        +${extra.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="font-medium mb-2">Cantidad</h2>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="bg-secondary border-0 hover:bg-secondary"
              >
                <Minus className="w-4 h-4" color="white" />
              </Button>
              <span className="mx-4 font-medium text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={increaseQuantity}
                disabled={!product?.recipe_id && !product?.ingredient_id && (product?.stock || 0) <= quantity}
                className="bg-secondary border-0 hover:bg-secondary"
              >
                <Plus className="w-4 h-4" color="white" />
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-medium mb-2">Notas especiales</h2>
            <Textarea
              placeholder="Ej: Sin hielo, extra limón, etc."
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="bg-secondary border-border resize-none"
            />
          </div>

          <Card className="mb-6 bg-card border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <span>Precio base</span>
                <span>${formatArgentineNumber(product?.sale_price)}</span>
              </div>

              {getVariantPrice() > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Variante</span>
                  <span>+${formatArgentineNumber(getVariantPrice())}</span>
                </div>
              )}

              {getExtrasTotal() > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Extras</span>
                  <span>+${formatArgentineNumber(getExtrasTotal())}</span>
                </div>
              )}

              <div className="flex justify-between mb-2">
                <span>Cantidad</span>
                <span>x{quantity}</span>
              </div>

              <Separator className="my-2 bg-border" />

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${formatArgentineNumber(getItemTotal())}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={addToCart}
          >
            Agregar al pedido
          </Button>
        </main>
      )}
    </div>
  );
}

const sampleProduct = {
  id: 4,
  name: "Fernet con Cola",
  price: 500,
  description:
    "Clásico trago argentino con Fernet Branca y cola. Refrescante y con personalidad.",
  image: "/placeholder.svg?height=400&width=600",
  hasVideo: true,
  video: "https://example.com/videos/fernet.mp4", // En una app real, esta sería una URL válida
  variants: [
    { id: "regular", name: "Regular (70/30)", additionalPrice: 0 },
    { id: "strong", name: "Fuerte (80/20)", additionalPrice: 50 },
    { id: "light", name: "Suave (60/40)", additionalPrice: 0 },
  ],
  extras: [
    {
      id: "ice",
      name: "Extra hielo",
      description: "Doble porción de hielo",
      price: 0,
    },
    {
      id: "speed",
      name: "Speed en lugar de Cola",
      description: "Cambia la cola por energizante",
      price: 80,
    },
    {
      id: "lemon",
      name: "Rodaja de limón",
      description: "Toque cítrico para realzar el sabor",
      price: 20,
    },
  ],
};
