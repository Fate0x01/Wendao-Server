// 登录页可选功能开关，统一从环境变量读取
const envToBoolean = (value?: 'true' | 'false') => value === 'true';

export const loginFeatureConfig = {
  enableRegister: envToBoolean(import.meta.env.VITE_ENABLE_REGISTER),
  enableForgotAccount: envToBoolean(import.meta.env.VITE_ENABLE_FORGOT_ACCOUNT),
  enableQrLogin: envToBoolean(import.meta.env.VITE_ENABLE_QR_LOGIN),
  enablePhoneLogin: envToBoolean(import.meta.env.VITE_ENABLE_PHONE_LOGIN),
};

export type LoginFeatureConfig = typeof loginFeatureConfig;
