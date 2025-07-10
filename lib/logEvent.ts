import { supabase } from "@/lib/supabase"

export interface LogEventOptions {
  type: string
  status: string
  message: string
  data?: any
  user_id?: string
  ip?: string
  device?: string
  region?: string
  twilio_sid?: string
}

/**
 * Universele loggingfunctie voor Auria Admin Dashboard.
 * Stuurt een logregel naar Supabase en logt naar console.
 */
export async function logEvent({
  type,
  status,
  message,
  data = null,
  user_id = undefined,
  ip = undefined,
  device = undefined,
  region = undefined,
  twilio_sid = undefined,
}: LogEventOptions) {
  const log = {
    type,
    status,
    message,
    data,
    user_id,
    ip,
    device,
    region,
    twilio_sid,
    // created_at wordt automatisch door Supabase ingevuld
  }
  // Stuur naar Supabase
  const { error } = await supabase.from("logs").insert([log])
  if (error) {
    console.error("[logEvent] Fout bij loggen naar Supabase:", error)
  }
} 