// auth.js - Version compatible Vercel
import { SUPABASE_CONFIG } from './config.js';

// Charger Supabase uniquement côté client
let supabaseClient = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(
      SUPABASE_CONFIG.URL,
      SUPABASE_CONFIG.ANON_KEY,
      {
        auth: {
          persistSession: true,
          storage: window.localStorage
        }
      }
    );
  }
  return supabaseClient;
}

// Initialiser au chargement
if (typeof window !== 'undefined') {
  initSupabase();
  window.supabaseClient = supabaseClient;
}

// Fonctions d'authentification
export async function inscrireUtilisateur(userData) {
  const client = initSupabase();
  if (!client) throw new Error('Supabase non initialisé');
  
  // ... (garder votre code existant)
}

// ... (autres fonctions)
