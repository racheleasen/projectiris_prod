// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_WS_URL: string
    readonly VITE_EVENTS_URL: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  