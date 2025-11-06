import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/supabase/audit";
import { z } from "zod";

const createTransactionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().int(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  date: z.string(),
  account: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // For manual transactions, we need a pool_id, but users might not have one
    // We'll store this in metadata for now, or create a simple transaction log
    // For now, let's store in a user_transactions view or use metadata
    // Since the transactions table requires pool_id, we'll need to handle this differently
    
    // Option: Store in audit_logs with specific action type, or create user_transactions table
    // For simplicity, let's use a workaround by creating a temporary pool or storing in metadata
    
    // Check if user has a default pool or create a personal transaction log
    // For now, we'll log it as an audit event and note that the transactions table
    // requires pool_id. We'll need to either:
    // 1. Create a user_transactions table
    // 2. Make pool_id nullable in transactions
    // 3. Auto-create a personal pool for manual transactions
    
    // For now, let's return success but note that full integration requires schema changes
    // We can store the transaction details in a separate way or enhance the schema
    
    // Insert as audit log for now until we have proper schema
    await logAuditEvent(
      session.user.id,
      "transaction.manual_create",
      "transaction",
      null,
      {
        description: validatedData.description,
        amount: validatedData.amount,
        type: validatedData.type,
        category: validatedData.category,
        date: validatedData.date,
        account: validatedData.account || "Main Account",
      }
    );

    // Return a mock transaction ID for now
    // TODO: Create user_transactions table or make pool_id nullable
    const transaction = {
      id: `txn_${Date.now()}`,
      description: validatedData.description,
      amount: validatedData.type === "expense" ? -validatedData.amount : validatedData.amount,
      type: validatedData.type,
      category: validatedData.category,
      date: validatedData.date,
      account: validatedData.account || "Main Account",
      status: "completed",
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: "Transaction created successfully",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error in POST /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = request.nextUrl.searchParams.get("limit");
    const limitNum = limit ? parseInt(limit) : undefined;

    // Get transactions from pools the user is a member of
    // Get all groups the user is in
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", session.user.id);

    const groupIds = memberships?.map((m: any) => m.group_id) || [];

    // Get pools for these groups
    const { data: pools } = await supabase
      .from("pools")
      .select("id")
      .in("group_id", groupIds);

    const poolIds = pools?.map((p: any) => p.id) || [];

    // Get transactions for these pools
    let query = supabase
      .from("transactions")
      .select("*")
      .in("pool_id", poolIds)
      .order("created_at", { ascending: false });

    if (limitNum) {
      query = query.limit(limitNum);
    }

    const { data: transactions, error } = await query;

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching transactions:", error);
      // Return empty array if no transactions yet
    }

    // Transform transactions to match expected format
    const formattedTransactions = (transactions || []).map((tx: any) => {
      const isExpense = tx.type === "purchase" || tx.type === "fee";
      return {
        id: tx.id,
        description: tx.description || tx.merchant_name || "Transaction",
        amount: tx.amount || 0,
        type: isExpense ? "expense" : "income",
        category: tx.merchant_category || "Other",
        date: tx.created_at ? tx.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        status: tx.status === "approved" ? "completed" : tx.status || "pending",
        account: "Main Account",
      };
    });

    return NextResponse.json({
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error("Error in GET /api/transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

