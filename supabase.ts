import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qacwvfccapzshfipwnae.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhY3d2ZmNjYXB6c2hmaXB3bmFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg2MzIyODQsImV4cCI6MjAzNDIwODI4NH0.QiKSc57CVz50PcwcYcwaIxXDG2mqoKvTv8DH2u0CC8c"
);
export default supabase;
