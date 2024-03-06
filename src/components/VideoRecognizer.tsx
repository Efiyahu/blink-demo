import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import i18n from '../locales';
import Navbar from './Navbar';
import CompletedSvg from './CompletedSvg';
import FailedSvg from './FailedSvg';
import { EMode } from '../types/env';
import {
  GetActionCodeResponseType,
  VERIFICATION_TYPES,
  VerifyActionCodeResponseType,
  getActionCode,
  getLicenseKeyByEnvironment,
  initializeBlinkCardSDK,
  validateActionCode,
  verifyPaymentMethod,
} from '../utils';
import { AxiosResponse } from 'axios';

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
  const paymentMethodId = searchParams.get('paymentID')?.toString() as string;

  const [continueToScan, setContinueToScan] = useState<boolean>(true);

  useEffect(() => {
    i18n.changeLanguage(language as string | undefined);
  }, [language]);

  useEffect(() => {
    getActionCode({ action: VERIFICATION_TYPES.PM_VERIFICATION, token: userToken as string })
      .then(({ data }: AxiosResponse<GetActionCodeResponseType>) => {
        if (data.expiryTime > 0) {
          validateActionCode({
            action: VERIFICATION_TYPES.PM_VERIFICATION,
            code: data.code,
            token: userToken as string,
          })
            .then(({ data }: AxiosResponse<VerifyActionCodeResponseType>) => {
              if (data.status) {
                setContinueToScan(true);
              } else {
                setUserMessage('codeFail');
                setFailed(true);
              }
            })
            .catch(() => {
              setUserMessage('codeFail');
              setFailed(true);
            });
        }
      })
      .catch(() => {
        setUserMessage('codeFail');
        setFailed(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init the blinkcard recognizer and begin recognition
  useEffect(() => {
    if (continueToScan)
      initializeBlinkCardSDK({
        setIsShown,
        setUserMessage,
        browserErrorString: t('browserNotSupported'),
        errorString: t('errorInitialization'),
        setFailed,
      })
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
              // const trimmedCardNumber = blinkCardResult?.cardNumber.replace(/\s+/g, '');
              // Extract the needed card numbers
              // const bin = trimmedCardNumber.substring(0, 6);
              // const lastDigits = trimmedCardNumber.substring(trimmedCardNumber.length - 4);
              // const expiryMonth = blinkCardResult?.expiryDate?.month;
              // const expiryYear = blinkCardResult?.expiryDate?.month;
              // const cardHolder = blinkCardResult?.owner;
              try {
                await verifyPaymentMethod({
                  paymentMethodId: '129',
                  bin: '411111',
                  lastDigits: '1111',
                  expiryMonth: 12,
                  expiryYear: 26,
                  cardHolder: 'test test',
                  token: userToken,
                }).then((res) => {
                  if (res.data.message === 'Payment method already verified.') {
                    setUserMessage('');
                  }
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
        })
        .catch(() => {
          setUserMessage(t('errorInitialization'));
        });
  }, [licenseKey, t, userToken, continueToScan, paymentMethodId]);

  const isTransparent = isShown ? { color: 'white' } : { color: 'black' };

  return (
    <>
      <Navbar />
      <div id="screen-scanning">
        {continueToScan && <video id="camera-feed" playsInline></video>}
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
