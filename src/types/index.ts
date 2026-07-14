export type Plan = 'trial' | 'starter' | 'growth' | 'pro' | 'enterprise'
export type PlanStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type CallDirection = 'inbound' | 'outbound'
export type CallStatus = 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy' | 'human-takeover'
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
export type FallbackChannel = 'none' | 'sms' | 'whatsapp'

export interface Agency {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string
  custom_domain: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: Plan
  plan_status: PlanStatus
  trial_ends_at: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  agency_id: string
  email: string
  full_name: string | null
  role: 'admin' | 'operator' | 'viewer'
  created_at: string
}

export interface SubClient {
  id: string
  agency_id: string
  name: string
  business_name: string | null
  phone: string | null
  email: string | null
  sector: string | null
  fallback_channel: FallbackChannel
  notes: string | null
  created_at: string
  updated_at: string
}

export interface KnowledgeBase {
  id: string
  agency_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Assistant {
  id: string
  agency_id: string
  knowledge_base_id: string | null
  name: string
  description: string | null
  vapi_assistant_id: string | null
  phone_number: string | null
  voice_id: string
  language: string
  system_prompt: string | null
  first_message: string | null
  end_call_message: string | null
  is_active: boolean
  sector: string | null
  created_at: string
  updated_at: string
}

export interface Call {
  id: string
  agency_id: string
  assistant_id: string | null
  sub_client_id: string | null
  vapi_call_id: string | null
  direction: CallDirection
  status: CallStatus
  caller_number: string | null
  callee_number: string | null
  duration_seconds: number
  transcript: string | null
  summary: string | null
  recording_url: string | null
  cost: number | null
  fallback_sent: boolean
  fallback_status: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  // Joined
  assistant?: Assistant
  sub_client?: SubClient
}

export interface Campaign {
  id: string
  agency_id: string
  assistant_id: string | null
  name: string
  description: string | null
  status: CampaignStatus
  total_leads: number
  called: number
  answered: number
  failed: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CampaignLead {
  id: string
  campaign_id: string
  agency_id: string
  phone: string
  name: string | null
  custom_data: Record<string, unknown>
  call_status: 'pending' | 'calling' | 'completed' | 'failed' | 'no-answer' | 'fallback-sent'
  call_id: string | null
  attempted_at: string | null
  created_at: string
}

export interface BillingUsage {
  id: string
  agency_id: string
  period: string
  minutes_used: number
  minutes_limit: number
  overage_minutes: number
  overage_charged: boolean
  stripe_invoice_id: string | null
}

export interface PlanConfig {
  name: string
  price: number
  minuteLimit: number
  maxClients: number
  maxAssistants: number
  features: string[]
  stripePriceId: string
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  trial: {
    name: 'Free Trial',
    price: 0,
    minuteLimit: 100,
    maxClients: 2,
    maxAssistants: 1,
    features: ['100 minutes', '2 sub-clients', '1 assistant', 'Basic analytics'],
    stripePriceId: '',
  },
  starter: {
    name: 'Starter',
    price: 49,
    minuteLimit: 500,
    maxClients: 3,
    maxAssistants: 1,
    features: ['500 minutes/month', '3 sub-clients', '1 assistant', 'Call transcripts', 'Basic analytics'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
  },
  growth: {
    name: 'Growth',
    price: 149,
    minuteLimit: 2000,
    maxClients: 15,
    maxAssistants: 5,
    features: ['2,000 minutes/month', '15 sub-clients', '5 assistants', 'Campaign management', 'SMS/WhatsApp fallback', 'CRM webhooks'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID || '',
  },
  pro: {
    name: 'Pro',
    price: 349,
    minuteLimit: 6000,
    maxClients: -1,
    maxAssistants: -1,
    features: ['6,000 minutes/month', 'Unlimited clients', 'Unlimited assistants', 'Human takeover', 'Live monitoring', 'Priority support'],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  },
  enterprise: {
    name: 'Enterprise',
    price: 0,
    minuteLimit: -1,
    maxClients: -1,
    maxAssistants: -1,
    features: ['Custom minutes', 'Dedicated infrastructure', 'SLA guarantee', 'SSO', '24/7 support', 'Custom integrations'],
    stripePriceId: '',
  },
}
