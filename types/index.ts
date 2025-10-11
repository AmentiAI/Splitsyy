export type UserRole = "owner" | "admin" | "member";
export type PoolStatus = "open" | "closed";
export type ContributionMethod = "card" | "ach";
export type ContributionStatus = "pending" | "succeeded" | "failed";
export type CardNetwork = "visa" | "mastercard";
export type CardStatus = "active" | "suspended" | "closed";
export type TransactionType = "purchase" | "refund" | "fee";
export type KYCStatus = "pending" | "approved" | "rejected" | "not_started";

export interface User {
  id: string;
  email: string;
  name: string;
  kyc_status: KYCStatus;
  created_at: string;
}

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: UserRole;
  spend_cap: number | null;
}

export interface Pool {
  id: string;
  group_id: string;
  target_amount: number;
  status: PoolStatus;
  designated_payer: string | null;
  created_at: string;
}

export interface Contribution {
  id: string;
  pool_id: string;
  user_id: string;
  amount: number;
  method: ContributionMethod;
  status: ContributionStatus;
  created_at: string;
}

export interface VirtualCard {
  id: string;
  pool_id: string;
  provider_card_id: string;
  network: CardNetwork;
  status: CardStatus;
  apple_pay_tokenized: boolean;
}

export interface Transaction {
  id: string;
  pool_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: string;
  merchant_name: string | null;
  created_at: string;
}

