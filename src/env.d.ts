/// <reference types="vite/client" />
/// <reference types="vite-plugin-electron/electron-env" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'fix-webm-duration';

interface Window {
  electronAPI: import("../electron/preload").ElectronAPI;
}
