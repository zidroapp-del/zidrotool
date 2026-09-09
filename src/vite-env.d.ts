/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADSENSE_CLIENT_ID?: string;
  readonly VITE_ADSENSE_SLOT_HEADER?: string;
  readonly VITE_ADSENSE_SLOT_SIDEBAR?: string;
  readonly VITE_ADSENSE_SLOT_INLINE?: string;
  readonly VITE_ADSENSE_SLOT_FOOTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob: (pattern: string) => Record<string, () => Promise<{ default: React.ComponentType<any> }>>;
}
