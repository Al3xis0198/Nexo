// lib/supabase/types.ts — Tipos de la base de datos Supabase

export type UserLevel = 'standard' | 'pro' | 'vip'
export type UserStatus = 'active' | 'suspended' | 'banned'
export type KycStatus = 'pending' | 'verified' | 'rejected'
export type PositionType = 'buy' | 'sell'
export type PositionStatus = 'open' | 'closed'
export type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity'
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'trade_open'
  | 'trade_close'
  | 'admin_adjustment'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  balance: number
  level: UserLevel
  status: UserStatus
  kyc_status: KycStatus
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
}

export interface Position {
  id: string
  user_id: string
  symbol: string
  name: string | null
  type: PositionType
  asset_type: AssetType
  amount: number
  entry_price: number
  close_price: number | null
  leverage: number
  status: PositionStatus
  fixed_pnl: number | null
  opened_at: string
  closed_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  admin_note: string | null
  created_at: string
}

// Tipo de base de datos completo para createClient<Database>
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      user_roles: {
        Row: UserRoleRecord
        Insert: Omit<UserRoleRecord, 'id'>
        Update: Partial<Omit<UserRoleRecord, 'id'>>
      }
      positions: {
        Row: Position
        Insert: Omit<Position, 'id' | 'opened_at'>
        Update: Partial<Omit<Position, 'id' | 'user_id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id' | 'user_id'>>
      }
    }
    Functions: {
      has_role: {
        Args: { p_user_id: string; p_role: string }
        Returns: boolean
      }
    }
  }
}
