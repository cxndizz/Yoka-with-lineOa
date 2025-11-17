export type AppProfile = 'customer' | 'admin';

const profileFromEnv = process.env.APP_PROFILE?.toLowerCase();

export const APP_PROFILE: AppProfile =
  profileFromEnv === 'admin' ? 'admin' : 'customer';

export const isAdminProfile = APP_PROFILE === 'admin';
