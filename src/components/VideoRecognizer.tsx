import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import i18n from '../locales';
import Navbar from './Navbar';
import { EMode } from '../types/env';
import { ScaleLoader } from 'react-spinners';
import {
  VERIFICATION_TYPES,
  VerifyActionCodeResponseType,
  clearLocaleStorage,
  getActionCode,
  getLicenseKeyByEnvironment,
  initializeBlinkCardSDK,
  validateActionCode,
  verifyPaymentMethod,
} from '../utils';
import { AxiosResponse } from 'axios';
import Modal from './Modal';

const VideoRecognizer = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { t } = useTranslation();

  const [isShown, setIsShown] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showButton, setShowButton] = useState<boolean>(false);
  const [oneTimeCode, setOneTimeCode] = useState<string>(searchParams.get('otp') as string);

  const language = searchParams.get('language');
  const currEnvironment = searchParams.get('env') as EMode;
  const licenseKey = getLicenseKeyByEnvironment(currEnvironment);
  const userToken = searchParams.get('userToken');
  const paymentMethodId = searchParams.get('paymentID') as string;
  const [retryCount, setRetryCount] = useState<number>(3);
  const [flipMessage, setFlipMessage] = useState('');

  const [continueToScan, setContinueToScan] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    i18n.changeLanguage(language as string | undefined);
  }, [language]);

  useEffect(() => {
    const storedCode = localStorage.getItem('oneTimeCode');
    const storedRetryCount = localStorage.getItem('retryCount');

    if (storedCode) {
      setOneTimeCode(storedCode);
    }

    if (storedRetryCount) {
      setRetryCount(parseInt(storedRetryCount));
    }
    window.addEventListener('beforeunload', clearLocaleStorage);

    return () => window.addEventListener('beforeunload', clearLocaleStorage);
  }, []);

  useEffect(() => {
    // Save code state and retry count to localStorage
    localStorage.setItem('oneTimeCode', oneTimeCode);
    localStorage.setItem('retryCount', retryCount.toString());
  }, [oneTimeCode, retryCount]);

  useEffect(() => {
    if (!oneTimeCode) {
      setContinueToScan(false);
      setUserMessage(t('failed'));
      setCompleted(false);
      setShowButton(false);
      setIsOpen(true);
    } else {
      setShowLoader(true);
      validateActionCode({
        action: VERIFICATION_TYPES.PM_VERIFICATION,
        code: oneTimeCode,
        token: userToken as string,
      })
        .then(({ data }: AxiosResponse<VerifyActionCodeResponseType>) => {
          // in case the otp is wrong / empty
          setShowLoader(false);
          if (data.status) {
            setContinueToScan(true);
            setIsOpen(false);
          } else {
            setUserMessage(t('failed'));
            setCompleted(false);
            setIsShown(true);
          }
        })
        // in case server error getting verifying the code
        .catch(() => {
          setShowLoader(false);
          setUserMessage(t('failed'));
          setCompleted(false);
          setIsOpen(true);
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneTimeCode]);

  // Init the blinkcard recognizer and begin recognition
  useEffect(() => {
    if (retryCount === 0) {
      setIsOpen(true);
      setUserMessage(t('failed'));
    } else if (continueToScan && retryCount > 0) {
      setShowLoader(true);
      initializeBlinkCardSDK({
        setIsShown,
        setIsOpen,
        setShowButton,
        setUserMessage,
        browserErrorString: t('browserNotSupported'),
        errorString: t('failed'),
        setCompleted,
      })
        .then(async (wasmSDK) => {
          setShowLoader(false);
          const callbacks = {
            onFirstSideResult: () => setFlipMessage(t('flip')),
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
              //  Extract the needed card numbers
              const bin = trimmedCardNumber.substring(0, 6);
              const lastDigits = trimmedCardNumber.substring(trimmedCardNumber.length - 4);
              const expiryMonth = blinkCardResult?.expiryDate?.month;
              const expiryYear = blinkCardResult?.expiryDate?.month;
              const cardHolder = blinkCardResult?.owner;
              try {
                setShowLoader(true);
                await verifyPaymentMethod({
                  paymentMethodId,
                  bin,
                  lastDigits,
                  expiryMonth,
                  expiryYear,
                  cardHolder,
                  token: userToken,
                }).then(() => {
                  setUserMessage(t('completed'));
                  setShowLoader(false);
                  setCompleted(true);
                  setShowButton(false);
                  setIsOpen(true);
                });
              } catch (err) {
                setCompleted(false);
                setShowLoader(false);
                setUserMessage(t('failed'));
                setShowButton(false);
                setIsOpen(true);
              }
            }

            videoRecognizer?.releaseVideoFeed();
            setIsShown(false);
            // Release memory on WebAssembly heap used by the RecognizerRunner
            recognizerRunner?.delete();
            // Release memory on WebAssembly heap used by the recognizer
            recognizer?.delete();
          } else {
            // data is empty we would like to retry
            setUserMessage(t('failed'));
            videoRecognizer?.releaseVideoFeed();
            setIsShown(true);
            setShowButton(false);
            // Release memory on WebAssembly heap used by the RecognizerRunner
            recognizerRunner?.delete();

            // Release memory on WebAssembly heap used by the recognizer
            recognizer?.delete();
          }
        })
        .catch();
    }
  }, [licenseKey, t, userToken, continueToScan, paymentMethodId, retryCount]);

  const isTransparent = isShown ? { color: 'white' } : { color: 'black' };

  const handleRetry = async () => {
    // Decrement retry count and trigger scanning again
    setRetryCount((prevCount) => prevCount - 1);
    setIsOpen(false);
    setContinueToScan(true);
    setUserMessage('');
    setFlipMessage('');

    try {
      const { data } = await getActionCode({
        action: 'pmVerification',
        token: userToken as string,
      });
      if (data.response.err) {
        setUserMessage(t('exceeded'));
        setIsOpen(true);
        setShowButton(false);
        setContinueToScan(false);
      } else {
        setOneTimeCode(data.code);
        setIsOpen(false);
        setContinueToScan(true);
      }
    } catch (error) {
      setUserMessage(t('failed'));
      setShowButton(false);
      setIsOpen(true);
      setContinueToScan(false);
    }
  };

  return (
    <>
      <Navbar />
      <div id="screen-scanning">
        {continueToScan && <video ref={videoRef} id="camera-feed" playsInline />}
        {!completed && !isOpen && (
          <p id="camera-guides" style={isTransparent}>
            {t('cameraGuide')}
          </p>
        )}

        <div id="flip-guides">
          <p style={isTransparent} className={completed ? 'completed-text' : 'text'}>
            {flipMessage}
          </p>
          {showLoader && <ScaleLoader color="#821ec8" className="spinner" />}
        </div>
      </div>
      {!showLoader && (
        <Modal
          open={isOpen}
          type={completed ? 'success' : 'failure'}
          message={userMessage}
          btnText={showButton && retryCount > 0 ? 'Try Again' : ''}
          onClickBtn={retryCount > 0 ? handleRetry : undefined}
        />
      )}
    </>
  );
};

export default VideoRecognizer;
