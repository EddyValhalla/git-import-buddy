/**
 * Cliente Supabase — Lumière CRM
 * Usa VITE_SUPABASE_ANON_KEY (JWT padrão) definida em .env.local
 * Projeto: dpfodqctsnzdsqjwrixw
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  // Lê variáveis de ambiente — Vite injeta as VITE_* em build time
  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const SUPABASE_ANON_KEY =
    import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['VITE_SUPABASE_URL'] : []),
      ...(!SUPABASE_ANON_KEY ? ['VITE_SUPABASE_ANON_KEY'] : []),
    ];
    const message = `Variáveis de ambiente ausentes no .env.local: ${missing.join(', ')}`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

/**
 * Singleton lazy — instanciado na primeira chamada.
 * Uso: import { supabase } from "@/integrations/supabase/client";
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

