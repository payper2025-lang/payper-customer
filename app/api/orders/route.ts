import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
import { metadata } from "@/app/layout";
import { format } from "date-fns";
import {
  createTableNotification,
  createTableOrder,
  createTableSession,
  updateTableStatus,
  updateTableSessionTotalSpent,
} from "../tables/route";

const supabase = createClient();

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("*, table:tables!table_id(*)")
      .eq("id", body.user_id)
      .single();
    if (userError) {
      throw userError;
    }
    if (user.balance < body.total_amount && body.payment_method == "balance") {
      throw new Error("Not enough balance");
    }

    //check products stock
    for (const item of body.order_items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (productError) throw productError;
      // if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.id}`);
    }

    // Update user balance for balance payment method
    if (body.payment_method === "balance") {
      const { data: updatedUser, error: updatedUserError } = await supabase
        .from("profiles")
        .update({ balance: user.balance - body.total_amount })
        .eq("id", body.user_id)
        .select()
        .single();
      if (updatedUserError) {
        throw updatedUserError;
      }
      console.log("Balance deducted from user:", updatedUser);
    }

    // Determine table information
    const isTableOrder = !!user?.table_id;
    const tableNumber = user?.table?.table_number || null;

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: body.user_id,
          user_name: body.user_name,
          total_amount: body.total_amount,
          notes: body.notes,
          status: body.status,
          payment_method: body.payment_method,
          qr_id: user?.qr_id,
          table_id: user?.table_id,
          is_table_order: isTableOrder,
          table_number: tableNumber,
        },
      ])
      .select()
      .single();

    if (isTableOrder) {
      const tableId = user?.table_id;
      // Create table order record
      await createTableOrder(tableId, data.id);

      // Create table session record if it doesn't exist
      await createTableSession(tableId);

      // Create table notification record for new order
      await createTableNotification(tableId, "new_order");

      // Update table status to "occupied"
      await updateTableStatus(tableId, "occupied");

      // Calculate and update total_spent for the active session
      await updateTableSessionTotalSpent(tableId);
    }

    if (error) {
      throw error;
    }
    const { error: itemsError } = await supabase.from("order_items").insert(
      body.order_items.map((item: any) => ({
        order_id: data.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.product.sale_price,
      }))
    );
    if (itemsError) {
      throw itemsError;
    }

    let notifications = [];

    for (const item of body.order_items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (productError) throw productError;
      // if (product.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.id}`);
      if (product.stock - item.quantity < 5) {
        notifications.push({
          user_id: body.user_id,
          message: `El producto ${item.product.name} está agotándose (${product.stock - item.quantity < 0 ? 0 : product.stock - item.quantity} restantes)`,
          type: "stock",
          title: "Stock agotándose",
          metadata: {
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.product.sale_price,
          },
        });
      }
      // const { error: updateError } = await supabase
      //     .from('products')
      //     .update({ stock: product.stock - item.quantity })
      //     .eq('id', item.id);

      // if (updateError) throw updateError;
    }

    notifications.push({
      user_id: body.user_id,
      message: `Nuevo pedido ${data.id} ha sido creado a las ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`,
      type: "order",
      title: "Nuevo pedido",
      metadata: {
        order_id: data.id,
        user_id: body.user_id,
        user_name: body.user_name,
        total_amount: body.total_amount,
        payment_method: body.payment_method,
      },
    });

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);
    if (notificationError) throw notificationError;
    return NextResponse.json({ data: data, status: 200 });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export async function GET(req: NextRequest) {
  try {
    //get id from search params
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get("userId");
    const { data, error } = await supabase
      .from("orders")
      .select(
        `*, order_items (
                    id,
                    product_id,
                    quantity,
                    unit_price,
                    products (
                        name,
                        image_url
                    )
                )`
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    return NextResponse.json({ data: data, status: 200 });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
