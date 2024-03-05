import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import i18n from '../locales';
import Navbar from './Navbar';
import CompletedSvg from './CompletedSvg';
import FailedSvg from './FailedSvg';
import { EMode } from '../types/env';
import { getLicenseKeyByEnvironment } from '../utils';
import axios from 'axios';

const VideoRecognizer = () => {
  const [isShown, setIsShown] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');

  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const language = searchParams.get('language');
  const currEnvironment = searchParams.get('env') as EMode;
  const licenseKey = getLicenseKeyByEnvironment(currEnvironment);

  const userToken = searchParams.get('userToken');

  type PaymentMethodRequestType = {
    bin: string;
    lastDigits: string;
    expiryYear: number;
    expiryMonth: number;
    cardHolder: string;
    token: string | null;
  };

  const verifyPaymentMethod = async ({
    bin,
    lastDigits,
    expiryMonth,
    expiryYear,
    cardHolder,
    token,
  }: PaymentMethodRequestType) => {
    axios.post(
      'v1/payment/verifyPaymentMethod',
      {
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
  };

  // Set the language based on the language of front app
  useEffect(() => {
    i18n.changeLanguage(language as string | undefined);
  }, [language]);

  // Init the blinkcard recognizer and begin recognition
  useEffect(() => {
    const initializeBlinkCardSDK = async () => {
      // Check if browser is supported
      if (BlinkCardSDK.isBrowserSupported()) {
        const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(
          import.meta.env.VITE_MICROBLINK_LICENSE_KEY_DEV
        );

        try {
          const wasmSDK = await BlinkCardSDK.loadWasmModule(loadSettings);
          setIsShown(true);
          // The SDK was initialized successfully, you can save the wasmSDK for future use
          return wasmSDK;
        } catch (error) {
          // Error happened during the initialization of the SDK
          setFailed(true);
          setUserMessage(t('errorInitialization'));
          console.error('Error during the initialization of the BlinkCard SDK:', error);
        }
      } else {
        setUserMessage(t('browserNotSupported'));
        console.log('This browser is not supported by the BlinkCard SDK!');
      }
    };

    initializeBlinkCardSDK()
      .then(async (wasmSDK) => {
        const callbacks = {
          onFirstSideResult: () => setUserMessage(t('flip')),
        };
        const recognizer = await BlinkCardSDK.createBlinkCardRecognizer(wasmSDK);
        const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(
          wasmSDK,
          [recognizer],
          false,
          callbacks
        );
        return { recognizerRunner, recognizer };
      })
      .then(async ({ recognizerRunner, recognizer }) => {
        const cameraFeed = document.getElementById('camera-feed') as HTMLVideoElement;
        const videoRecognizer =
          await BlinkCardSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
            cameraFeed,
            recognizerRunner
          );
        return { videoRecognizer, recognizer, recognizerRunner };
      })
      .then(async ({ videoRecognizer, recognizer, recognizerRunner }) => {
        const processResult = await videoRecognizer.recognize();

        if (processResult !== BlinkCardSDK.RecognizerResultState.Empty) {
          const blinkCardResult = await recognizer.getResult();
          if (blinkCardResult.state !== BlinkCardSDK.RecognizerResultState.Empty) {
            // Remove spaces from the card number
            const trimmedCardNumber = blinkCardResult?.cardNumber.replace(/\s+/g, '');
            // Extract the needed card numbers
            const bin = trimmedCardNumber.substring(0, 6);
            const lastDigits = trimmedCardNumber.substring(trimmedCardNumber.length - 4);
            const expiryMonth = blinkCardResult?.expiryDate?.month;
            const expiryYear = blinkCardResult?.expiryDate?.month;
            const cardHolder = blinkCardResult?.owner;
            //  TODO: add server request to send data.

            try {
              await verifyPaymentMethod({
                bin,
                lastDigits,
                expiryMonth,
                expiryYear,
                cardHolder,
                token: userToken,
              });
              setUserMessage(t('completed'));
              setCompleted(true);
            } catch (err) {
              setFailed(true);
              setUserMessage(t('failed'));
            }
          }

          videoRecognizer?.releaseVideoFeed();
          setIsShown(false);
          // Release memory on WebAssembly heap used by the RecognizerRunner
          recognizerRunner?.delete();

          // Release memory on WebAssembly heap used by the recognizer
          recognizer?.delete();
        } else {
          setUserMessage(t('errorExtracting'));
          videoRecognizer?.releaseVideoFeed();
          setIsShown(false);
          // Release memory on WebAssembly heap used by the RecognizerRunner
          recognizerRunner?.delete();

          // Release memory on WebAssembly heap used by the recognizer
          recognizer?.delete();
        }
      });
  }, [licenseKey, t]);

  const isTransparent = isShown ? { color: 'white' } : { color: 'black' };

  return (
    <>
      <Navbar />
      <div id="screen-scanning">
        <video id="camera-feed" playsInline></video>
        {!completed && (
          <p id="camera-guides" style={isTransparent}>
            {t('cameraGuide')}
          </p>
        )}

        <div id="flip-guides">
          <p style={isTransparent} className={completed ? 'completed-text' : 'text'}>
            {userMessage}
          </p>
          <CompletedSvg show={completed} />
          <FailedSvg show={failed} />
        </div>
      </div>
    </>
  );
};

export default VideoRecognizer;
