import { backend } from "@/integrations/local/client";

export interface UserPaymentRow {
  id: string;
  status: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
  verified_at: string | null;
}

export async function fetchUserRecentPayments(limit = 3): Promise<UserPaymentRow[]> {
  const { data: auth } = await backend.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await backend
    .from("manual_payments")
    .select("id, status, plan_type, amount, currency, payment_method, created_at, verified_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[fetchUserPayments]", error.message);
    return [];
  }

  return data ?? [];
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "verified":
    case "approved":
      return "Activated";
    case "rejected":
      return "Needs review";
    case "pending":
    default:
      return "Pending verification";
  }
}

export function paymentStatusTone(status: string): "pending" | "success" | "warning" {
  if (status === "verified" || status === "approved") return "success";
  if (status === "rejected") return "warning";
  return "pending";
}
