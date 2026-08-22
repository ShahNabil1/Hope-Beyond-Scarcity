/**
 * Central Supabase access point for the app.
 *
 * The typed browser client is generated in `src/integrations/supabase/client.ts`.
 * Import from here so feature code has one stable entry point:
 *
 *   import { supabase } from "@/lib/supabase";
 *
 * Auth is intentionally not wired up yet — only the connection structure.
 */
export { supabase } from "@/integrations/supabase/client";
export type { Database, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
