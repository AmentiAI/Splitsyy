export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          kyc_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          kyc_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          kyc_status?: string;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          currency?: string;
          created_at?: string;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: string;
          spend_cap: number | null;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: string;
          spend_cap?: number | null;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          role?: string;
          spend_cap?: number | null;
        };
      };
      pools: {
        Row: {
          id: string;
          group_id: string;
          target_amount: number;
          status: string;
          designated_payer: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          target_amount: number;
          status?: string;
          designated_payer?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          target_amount?: number;
          status?: string;
          designated_payer?: string | null;
          created_at?: string;
        };
      };
      contributions: {
        Row: {
          id: string;
          pool_id: string;
          user_id: string;
          amount: number;
          method: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          user_id: string;
          amount: number;
          method: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          user_id?: string;
          amount?: number;
          method?: string;
          status?: string;
          created_at?: string;
        };
      };
      virtual_cards: {
        Row: {
          id: string;
          pool_id: string;
          provider_card_id: string;
          network: string;
          status: string;
          apple_pay_tokenized: boolean;
        };
        Insert: {
          id?: string;
          pool_id: string;
          provider_card_id: string;
          network: string;
          status?: string;
          apple_pay_tokenized?: boolean;
        };
        Update: {
          id?: string;
          pool_id?: string;
          provider_card_id?: string;
          network?: string;
          status?: string;
          apple_pay_tokenized?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          pool_id: string;
          amount: number;
          currency: string;
          type: string;
          status: string;
          merchant_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          amount: number;
          currency: string;
          type: string;
          status: string;
          merchant_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          amount?: number;
          currency?: string;
          type?: string;
          status?: string;
          merchant_name?: string | null;
          created_at?: string;
        };
      };
      splits: {
        Row: {
          id: string;
          created_by: string;
          description: string;
          total_amount: number;
          status: string;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          description: string;
          total_amount: number;
          status?: string;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          description?: string;
          total_amount?: number;
          status?: string;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      split_participants: {
        Row: {
          id: string;
          split_id: string;
          name: string;
          phone: string;
          amount: number;
          payment_link: string;
          status: string;
          user_id: string | null;
          payment_intent_id: string | null;
          error_message: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          split_id: string;
          name: string;
          phone: string;
          amount: number;
          payment_link: string;
          status?: string;
          user_id?: string | null;
          payment_intent_id?: string | null;
          error_message?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          split_id?: string;
          name?: string;
          phone?: string;
          amount?: number;
          payment_link?: string;
          status?: string;
          user_id?: string | null;
          payment_intent_id?: string | null;
          error_message?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      split_payments: {
        Row: {
          id: string;
          split_id: string;
          participant_id: string;
          amount: number;
          payment_method: string;
          status: string;
          payment_intent_id: string | null;
          provider_payment_id: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          split_id: string;
          participant_id: string;
          amount: number;
          payment_method: string;
          status?: string;
          payment_intent_id?: string | null;
          provider_payment_id?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          split_id?: string;
          participant_id?: string;
          amount?: number;
          payment_method?: string;
          status?: string;
          payment_intent_id?: string | null;
          provider_payment_id?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

