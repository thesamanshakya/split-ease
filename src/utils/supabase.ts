import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a Supabase client with proper session handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-auth-token",
    storage: {
      getItem: (key) => {
        if (typeof window === "undefined") {
          return null;
        }

        // Get from localStorage
        const itemStr = localStorage.getItem(key);

        // Also store in a cookie for middleware access
        if (itemStr) {
          document.cookie = `${key}=${itemStr}; path=/; max-age=2592000; SameSite=Lax; secure`;
        }

        return itemStr;
      },
      setItem: (key, value) => {
        if (typeof window === "undefined") {
          return;
        }

        // Store in localStorage
        localStorage.setItem(key, value);

        // Also store in a cookie for middleware access
        document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax; secure`;
      },
      removeItem: (key) => {
        if (typeof window === "undefined") {
          return;
        }

        // Remove from localStorage
        localStorage.removeItem(key);

        // Also remove from cookies
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure`;
      },
    },
  },
});
