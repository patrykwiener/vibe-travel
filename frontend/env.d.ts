/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Replace empty object types with 'object' and 'any' with 'unknown'
  const component: DefineComponent<object, object, unknown>
  export default component
}
