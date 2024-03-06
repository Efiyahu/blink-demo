import axios from 'axios';
import { EMode } from '../types/env';
import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import React, { SetStateAction } from 'react';

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

type InitBlinkCardSDK = {
  setIsShown: React.Dispatch<SetStateAction<boolean>>;
  setUserMessage: React.Dispatch<SetStateAction<string>>;
  setFailed: React.Dispatch<SetStateAction<boolean>>;
  browserErrorString: string;
  errorString: string;
};

export const initializeBlinkCardSDK = async ({
  setIsShown,
  setFailed,
  setUserMessage,
  browserErrorString,
  errorString,
}: InitBlinkCardSDK) => {
  // Check if browser is supported
  if (BlinkCardSDK.isBrowserSupported()) {
    const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(
      'sRwAAAYZcG12LWludGVncmF0aW9uLmtsaXBzLmRldsP9eD1ByXlqVIXcVwCnhnbT3MP/K8rAxTOoiSgX/uKWOHL26W9Py0HAQ7aT855H8FIOtVAI2Jnh3YuWADLy7n6nWGFvYseyym3KGCxcMki28pk5ND4GGxGk+xgZk1X4pVO35GZaukr1qr/6Fk0QDoN9JIOC6o4VOyNIGwcLrNaf9Cu4bNbB7MpZ'
    );

    try {
      const wasmSDK = await BlinkCardSDK.loadWasmModule(loadSettings);
      setIsShown(true);
      // The SDK was initialized successfully, you can save the wasmSDK for future use
      return wasmSDK;
    } catch (error) {
      // Error happened during the initialization of the SDK
      setFailed(true);
      setUserMessage(errorString);
      console.error('Error during the initialization of the BlinkCard SDK:', error);
    }
  } else {
    setUserMessage(browserErrorString);
    console.log('This browser is not supported by the BlinkCard SDK!');
  }
};

export enum VERIFICATION_TYPES {
  PM_VERIFICATION = 'pmVerification',
}

type PaymentMethodRequestType = {
  paymentMethodId: string;
  bin: string;
  lastDigits: string;
  expiryYear: number;
  expiryMonth: number;
  cardHolder: string;
  token: string | null;
};

export type GetActionCodeResponseType = {
  code: string;
  expiryTime: number; // in seconds
};

export type VerifyActionCodeResponseType = {
  status: boolean;
};

export const verifyPaymentMethod = async ({
  paymentMethodId,
  bin,
  lastDigits,
  expiryMonth,
  expiryYear,
  cardHolder,
  token,
}: PaymentMethodRequestType) =>
  axios.post(
    'https://gwcrm-integration.klips.dev/v1/payment/verifyPaymentMethod',
    {
      paymentMethodId,
      bin,
      lastDigits,
      expiryYear,
      expiryMonth,
      cardHolder,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

export const getActionCode = ({ action, token }: { action: string; token: string }) =>
  axios.post(
    'https://gwcrm-integration.klips.dev/v1/user/getActionCode',
    {
      action,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

export const validateActionCode = ({
  action,
  code,
  token,
}: {
  action: string;
  code: string;
  token: string;
}) =>
  axios.post(
    'https://gwcrm-integration.klips.dev/v1/user/validateActionCode',
    {
      action,
      code,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
