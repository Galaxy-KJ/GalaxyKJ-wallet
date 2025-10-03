export interface Database {
  public: {
    Tables: {
      scheduled_payments: {
        Row: {
          id: string
          user_id: string
          public_key: string
          encrypted_secret: string
          recipient: string
          asset: string
          amount: number
          memo: string | null
          frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at: string
          executed_at: string | null
          tx_hash: string | null
          last_error: string | null
          status: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          public_key: string
          encrypted_secret: string
          recipient: string
          asset: string
          amount: number
          memo?: string | null
          frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at: string
          executed_at?: string | null
          tx_hash?: string | null
          last_error?: string | null
          status?: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          public_key?: string
          encrypted_secret?: string
          recipient?: string
          asset?: string
          amount?: number
          memo?: string | null
          frequency?: 'once' | 'weekly' | 'monthly' | 'yearly'
          execute_at?: string
          executed_at?: string | null
          tx_hash?: string | null
          last_error?: string | null
          status?: 'pending' | 'executed' | 'cancelled' | 'error'
          created_at?: string
        }
      }
      ,
      automations: {
        Row: {
          id: string
          user_id: string
          public_key: string
          encrypted_secret: string
          type: 'payment' | 'swap' | 'rule'
          active: boolean

          recipient: string | null
          asset: string | null
          amount: number | null
          frequency: 'once' | 'weekly' | 'monthly' | 'yearly' | null
          next_execute_at: string | null

          asset_from: string | null
          asset_to: string | null
          amount_from: number | null
          condition: 'price_increase' | 'price_decrease' | 'price_target' | null
          condition_value: number | null
          slippage: number | null

          rule_threshold: number | null
          rule_action: 'alert' | 'buy' | 'sell' | 'custom' | null
          rule_amount: number | null

          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          public_key: string
          encrypted_secret: string
          type: 'payment' | 'swap' | 'rule'
          active?: boolean

          recipient?: string | null
          asset?: string | null
          amount?: number | null
          frequency?: 'once' | 'weekly' | 'monthly' | 'yearly' | null
          next_execute_at?: string | null

          asset_from?: string | null
          asset_to?: string | null
          amount_from?: number | null
          condition?: 'price_increase' | 'price_decrease' | 'price_target' | null
          condition_value?: number | null
          slippage?: number | null

          rule_threshold?: number | null
          rule_action?: 'alert' | 'buy' | 'sell' | 'custom' | null
          rule_amount?: number | null

          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          public_key?: string
          encrypted_secret?: string
          type?: 'payment' | 'swap' | 'rule'
          active?: boolean

          recipient?: string | null
          asset?: string | null
          amount?: number | null
          frequency?: 'once' | 'weekly' | 'monthly' | 'yearly' | null
          next_execute_at?: string | null

          asset_from?: string | null
          asset_to?: string | null
          amount_from?: number | null
          condition?: 'price_increase' | 'price_decrease' | 'price_target' | null
          condition_value?: number | null
          slippage?: number | null

          rule_threshold?: number | null
          rule_action?: 'alert' | 'buy' | 'sell' | 'custom' | null
          rule_amount?: number | null

          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ,
      automation_executions: {
        Row: {
          id: string
          automation_id: string
          executed_at: string
          status: 'pending' | 'executed' | 'error' | 'skipped' | 'retrying'
          tx_hash: string | null
          error: string | null
          metadata: Record<string, unknown> | null
        }
        Insert: {
          id?: string
          automation_id: string
          executed_at?: string
          status: 'pending' | 'executed' | 'error' | 'skipped' | 'retrying'
          tx_hash?: string | null
          error?: string | null
          metadata?: Record<string, unknown> | null
        }
        Update: {
          id?: string
          automation_id?: string
          executed_at?: string
          status?: 'pending' | 'executed' | 'error' | 'skipped' | 'retrying'
          tx_hash?: string | null
          error?: string | null
          metadata?: Record<string, unknown> | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_frequency: 'once' | 'weekly' | 'monthly' | 'yearly'
      payment_status: 'pending' | 'executed' | 'cancelled' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for use in the application
export type ScheduledPayment = Database['public']['Tables']['scheduled_payments']['Row']
export type ScheduledPaymentInsert = Database['public']['Tables']['scheduled_payments']['Insert']
export type ScheduledPaymentUpdate = Database['public']['Tables']['scheduled_payments']['Update']
export type PaymentFrequency = Database['public']['Enums']['payment_frequency']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type AutomationRow = Database['public']['Tables']['automations']['Row']
export type AutomationInsert = Database['public']['Tables']['automations']['Insert']
export type AutomationUpdate = Database['public']['Tables']['automations']['Update']
export type AutomationExecutionRow = Database['public']['Tables']['automation_executions']['Row']
export type AutomationExecutionInsert = Database['public']['Tables']['automation_executions']['Insert']
export type AutomationExecutionUpdate = Database['public']['Tables']['automation_executions']['Update']