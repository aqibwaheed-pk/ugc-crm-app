import { createClient } from '@supabase/supabase-js'

// Yahan apni Supabase URL aur ANON KEY (Public) dalein
const supabaseUrl = 'https://qgnwwstyirwkdzmpcqgq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbnd3c3R5aXJ3a2R6bXBjcWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNjAxMzAsImV4cCI6MjA4NjYzNjEzMH0.0NqoVpu11jCtQsgSxdd2fSsDOVBVpAXj9rnRzH5c2AQ'

export const supabase = createClient(supabaseUrl, supabaseKey)