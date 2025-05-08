import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Custom storage implementation that ensures consistent session state across PWA contexts
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      // Get from localStorage
      const itemStr = localStorage.getItem(key);

      // Also store in a cookie for middleware access
      if (itemStr) {
        document.cookie = `${key}=${encodeURIComponent(itemStr)}; path=/; max-age=2592000; SameSite=Lax; secure`;
      }

      return itemStr;
    } catch (error) {
      console.error('Error getting auth data from storage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Store in localStorage
      localStorage.setItem(key, value);

      // Also store in a cookie for middleware access
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax; secure`;
      
      // Dispatch a storage event to notify other tabs
      if (key.includes('auth')) {
        localStorage.setItem("auth-state-change", Date.now().toString());
      }
    } catch (error) {
      console.error('Error setting auth data in storage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Remove from localStorage
      localStorage.removeItem(key);

      // Also remove from cookies
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure`;
      
      // Dispatch a storage event to notify other tabs
      if (key.includes('auth')) {
        localStorage.setItem("auth-state-change", Date.now().toString());
      }
    } catch (error) {
      console.error('Error removing auth data from storage:', error);
    }
  },
};

// Create a Supabase client with proper session handling for client-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-auth-token",
    storage: customStorage,
  },
});

// Create an authenticated Supabase client with a user's access token
export const createAuthenticatedClient = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
