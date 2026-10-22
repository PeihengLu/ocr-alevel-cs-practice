/// <reference types="vite/client" />

type Edition = 'student' | 'teacher'

interface ImportMetaEnv {
  readonly VITE_EDITION: Edition
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface PortableLeetcodeBridge {
  platform: NodeJS.Platform
  editions: readonly Edition[]
}

interface Window {
  portableLeetcode?: PortableLeetcodeBridge
}
