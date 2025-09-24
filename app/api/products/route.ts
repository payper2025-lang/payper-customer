import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id"); // Get id from query params
    const pageNumber = parseInt(searchParams.get("page_number") ?? "1", 10);

    const supabase = createClient();

    try {
        if (productId) {
            // Fetch a specific product by ID
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                // .eq("is_active", true)
                .single();

            if (error) {
                return NextResponse.json(
                    { message: "Failed to fetch product", error: error.message },
                    { status: 404 }
                );
            }

            return NextResponse.json({ product: data });
        } else {
            // Fetch all products or handle pagination
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .is("deleted_at", null)
                // .eq('is_active', true)
                .order("id", { ascending: true });

            if (error) {
                return NextResponse.json(
                    { message: "Failed to fetch products", error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ products: data, page: pageNumber });
        }
    } catch (err) {
        return NextResponse.json(
            { message: "An unexpected error occurred", error: (err as Error).message },
            { status: 500 }
        );
    }
}