import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type cho Candidate - reused in multiple places
export type Candidate = {
  id: string
  user_id: string
  full_name: string
  applied_position: string
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected'
  skills: string[]           
  matching_score: number 
  resume_url: string
  created_at: string
}