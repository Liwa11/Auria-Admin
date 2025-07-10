import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fuvtitcjzovzkknuuhcw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1dnRpdGNqem92emtrbnV1aGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDY2ODYsImV4cCI6MjA2NzM4MjY4Nn0.y5mlR_RyjI0HbKaM754VVUoQNiS1O_n1EqzhGxPjwTM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
})

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error("Supabase Error:", error)
  if (error?.message?.includes("row-level security")) {
    return "Toegang geweigerd. Controleer de database instellingen."
  }
  return error?.message || "Er is een fout opgetreden"
}

// Database types - Supabase schema als enige waarheid
export interface AdminUser {
  id: string;
  email: string;
  rol?: string; // default 'agent'
  actief?: boolean; // default true
  aangemaakt_op?: string; // default now()
}

export interface CallScript {
  id: string;
  script?: string;
  ai_prompt?: string;
  updated_at?: string;
}

export interface Campagne {
  id: string;
  naam: string;
  startdatum?: string;
  einddatum?: string;
}

export interface Gesprek {
  id: string;
  datum: string;
  tijdslot: string;
  opmerkingen?: string;
  klant_id?: string;
  verkoper_id?: string;
  campagne_id?: string;
  regio_id?: string;
  aangemaakt_op?: string;
}

export interface Klant {
  id: string;
  bedrijfsnaam: string;
  email?: string;
  telefoon?: string;
  adres?: string;
  aangemaakt_op?: string;
  btw_nummer?: string;
}

export interface Log {
  id: string;
  type: string;
  status: string;
  message: string;
  data?: any;
  created_at: string;
  user_id?: string;
  ip?: string;
  device?: string;
  region?: string;
  twilio_sid?: string;
}

export interface Regio {
  id: string;
  naam: string;
  Beschrijving?: string;
}

export interface Verkoper {
  id: string;
  naam: string;
  email: string;
  is_admin?: boolean;
  aangemaakt_op?: string;
  regio_id?: string;
}

export interface ExternalApi {
  id: string
  name: string
  api_key: string
  provider: "twilio" | "elevenlabs" | "openai" | "other"
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Setting {
  id: string
  key: string
  value: string
  description?: string
  updated_at: string
}
