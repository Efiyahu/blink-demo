import { EMode } from '../types/env';

export function getLicenseKeyByEnvironment(env: EMode) {
  switch (env) {
    case EMode.DEV:
      return import.meta.env.VITE_MICROBLINK_LICENSE_KEY_DEV;
    case EMode.PROD:
      return import.meta.env.VITE_MICROBLINK_LICENSE_KEY_PRODUCTION;
    case EMode.STAGE:
      return import.meta.env.VITE_MICROBLINK_LICENSE_KEY_STAGING;
  }
}
