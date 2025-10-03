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

export interface TableSession {
  id: string;
  table_id: string;
  start_time: string;
  end_time: string | null;
  total_spent: number;
  status: "active" | "closed";
}

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
 * Create or retrieve a table session based on the following rules:
 * 1. Each table can only have one table_session at a time
 * 2. If an active session exists, return it (don't create new)
 * 3. If a closed session exists, create a new active session
 * 4. If no session exists, create a new active session
 */
export async function createTableSession(
  tableId: string
): Promise<TableSession> {
  try {
    // Check if there's already a session for this table (active or closed)
    // Get the most recent session ordered by start_time
    const { data: existingSessions, error: checkError } = await supabase
      .from("table_sessions")
      .select("*")
      .eq("table_id", tableId)
      .order("start_time", { ascending: false })
      .limit(1);

    if (checkError) {
      console.error("❌ Error checking existing sessions:", checkError);
      throw checkError;
    }

    // If a session exists, check its status
    if (existingSessions && existingSessions.length > 0) {
      const latestSession = existingSessions[0] as TableSession;

      // Rule 2: If active session exists, return it (don't create new)
      if (latestSession.status === "active") {
        return latestSession;
      }
    }

    // Create a new active session
    const startTime = new Date();
    const { data, error } = await supabase
      .from("table_sessions")
      .insert({
        table_id: tableId,
        start_time: startTime.toISOString(),
        end_time: null,
        total_spent: 0,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating table session:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from table session creation");
    }

    return data;
  } catch (error) {
    console.error("Failed to create table session:", error);
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
 * Calculate and update the total_spent for an active table session
 * Based on business rules:
 * - For cash/balance: Always include orders.total_amount
 * - For mercadopago: Only include if transaction.status = 'approved' and type = 'order'
 */
export async function updateTableSessionTotalSpent(
  tableId: string
): Promise<number> {
  try {
    console.log(`💰 Calculating total_spent for table: ${tableId}`);

    // Get the active session for this table
    const { data: activeSessions, error: sessionError } = await supabase
      .from("table_sessions")
      .select("id")
      .eq("table_id", tableId)
      .eq("status", "active")
      .order("start_time", { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error("❌ Error fetching active session:", sessionError);
      throw sessionError;
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log(`⚠️ No active session found for table ${tableId}`);
      return 0;
    }

    const activeSessionId = activeSessions[0].id;

    // Get all orders for this table through table_orders
    const { data: tableOrders, error: ordersError } = await supabase
      .from("table_orders")
      .select(
        `
        order_id,
        orders!inner (
          id,
          total_amount,
          payment_method,
          is_table_order,
          table_id
        )
      `
      )
      .eq("table_id", tableId);

    if (ordersError) {
      console.error("❌ Error fetching table orders:", ordersError);
      throw ordersError;
    }

    if (!tableOrders || tableOrders.length === 0) {
      console.log(`ℹ️ No orders found for table ${tableId}`);
      // Update session with 0
      await supabase
        .from("table_sessions")
        .update({ total_spent: 0 })
        .eq("id", activeSessionId);
      return 0;
    }

    let totalSpent = 0;

    // Process each order based on payment method
    for (const tableOrder of tableOrders) {
      const order = tableOrder.orders as any;

      if (
        order.payment_method === "cash" ||
        order.payment_method === "balance"
      ) {
        // Rule: Always include for cash/balance
        totalSpent += Number(order.total_amount);
        console.log(
          `  ✅ Added ${order.payment_method} order ${order.id}: $${order.total_amount}`
        );
      } else if (order.payment_method === "mercadopago") {
        // Rule: Only include if transaction is approved
        const { data: transaction, error: txError } = await supabase
          .from("transactions")
          .select("status, amount, type")
          .eq("order_id", order.id)
          .eq("type", "order")
          .single();

        if (!txError && transaction && transaction.status === "approved") {
          totalSpent += Number(transaction.amount);
          console.log(
            `  ✅ Added mercadopago order ${order.id}: $${transaction.amount} (approved)`
          );
        } else {
          console.log(
            `  ⏳ Skipped mercadopago order ${order.id}: ${transaction?.status || "no transaction"}`
          );
        }
      }
    }

    // Update the active session with the calculated total
    const { error: updateError } = await supabase
      .from("table_sessions")
      .update({
        total_spent: totalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeSessionId);

    if (updateError) {
      console.error("❌ Error updating session total_spent:", updateError);
      throw updateError;
    }

    console.log(
      `✅ Updated session ${activeSessionId} total_spent: $${totalSpent}`
    );
    return totalSpent;
  } catch (error) {
    console.error("Failed to update table session total_spent:", error);
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
  console.log("Updating table status:", { tableId, newStatus });

  try {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Reset current_guests to 0 when table becomes free
    if (newStatus === "free") {
      updateData.current_guests = 0;
    }

    const { data, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("id", tableId)
      .select();

    if (error) {
      console.error("Error updating table status:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(`No table found with ID: ${tableId}`);
    }
  } catch (error) {
    console.error("Failed to update table status:", error);
    throw error;
  }
}

export async function getTableStatus(
  tableId: string
): Promise<DatabaseTableStatus> {
  try {
    const { data, error } = await supabase
      .from("tables")
      .select("status")
      .eq("id", tableId)
      .single();

    if (error) {
      console.error("Error fetching table status:", error);
      throw error;
    }

    if (!data) {
      throw new Error(`No table found with ID: ${tableId}`);
    }

    return data.status;
  } catch (error) {
    console.error("Failed to fetch table status:", error);
    throw error;
  }
}
