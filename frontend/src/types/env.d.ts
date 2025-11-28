/// <reference types="vite/client" />

// 登录相关的环境变量类型声明，便于在使用时获得类型提示
interface ImportMetaEnv {
  readonly MODE: 'development' | 'test' | 'release' | 'mock' | 'site';
  readonly VITE_BASE_URL: string;
  readonly VITE_ENABLE_REGISTER?: 'true' | 'false';
  readonly VITE_ENABLE_FORGOT_ACCOUNT?: 'true' | 'false';
  readonly VITE_ENABLE_QR_LOGIN?: 'true' | 'false';
  readonly VITE_ENABLE_PHONE_LOGIN?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
