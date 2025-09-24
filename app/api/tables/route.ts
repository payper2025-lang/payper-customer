import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
export interface TableOrder {
  id: string;
  table_id: string;
  order_id: string;
  created_at: string;
}

export interface TableNotification {
  id: string;
  table_id: string;
  type: "waiter_call" | "bill_request" | "special_request" | "new_order";
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

export type DatabaseTableStatus =
  | "free"
  | "occupied"
  | "waiting_order"
  | "preparing"
  | "delivered"
  | "bill_requested"
  | "producing"
  | "paid";

export async function createTableOrder(
  tableId: string,
  orderId: string
): Promise<TableOrder> {
  try {
    // Find the table by converting frontend ID back to database format
    const { data: tables } = await supabase.from("tables").select("id");

    if (!tables) {
      throw new Error("No tables found");
    }

    const { data, error } = await supabase
      .from("table_orders")
      .insert({
        table_id: tableId,
        order_id: orderId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table order:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from table order creation");
    }

    return data;
  } catch (error) {
    console.error("Failed to create table order:", error);
    throw error;
  }
}

/**
 * Create a new table notification
 */
export async function createTableNotification(
  tableId: string,
  type: "waiter_call" | "bill_request" | "special_request" | "new_order"
): Promise<TableNotification> {
  try {

    const { data, error } = await supabase
      .from("table_notifications")
      .insert({
        table_id: tableId,
        type: type,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table notification:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from table notification creation");
    }

    return data;
  } catch (error) {
    console.error("Failed to create table notification:", error);
    throw error;
  }
}

/**
 * Update table status
 */
export async function updateTableStatus(
  tableId: string,
  newStatus: DatabaseTableStatus
): Promise<void> {
  try {
    const { error } = await supabase
      .from("tables")
      .update({
        status: newStatus,
        current_guests: newStatus === "free" ? 0 : undefined,
      })
      .eq("id", tableId);

    if (error) {
      console.error("Error updating table status:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to update table status:", error);
    throw error;
  }
}
