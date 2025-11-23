import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dlpgymdrjhzgggaeiwew.supabase.co';
const supabaseKey = 'sb_publishable_RcIV5pf1LWvqL1AtClr3Fg_sQVsR2ku';
export const supabase = createClient(supabaseUrl, supabaseKey);