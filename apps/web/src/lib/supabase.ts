import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://bsbbyuaqibehvcbwugif.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYmJ5dWFxaWJlaHZjYnd1Z2lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyNjM4OSwiZXhwIjoyMTAzNDAyMzg5fQ.vcEJqHNWfCMoPRRkNs6bvNKTeMI9x4HYmzEE8bXkZgU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
