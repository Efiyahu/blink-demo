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
// import axios from 'axios';

const VideoRecognizer = () => {
  const [isShown, setIsShown] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  // const [failed, setFailed] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');

  const { t } = useTranslation();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const language = searchParams.get('language');
  const currEnvironment = searchParams.get('env') as EMode;
  const licenseKey = getLicenseKeyByEnvironment(currEnvironment);
  // const userToken = searchParams.get('userToken');
  // const paymentId = searchParams.get('paymentID');

  // Set the Language based on the language code that's passed
  console.log(licenseKey);
  useEffect(() => {
    i18n.changeLanguage(language as string | undefined);
  }, [language]);

  // Init the blinkcard recognizer and begin recognition
  useEffect(() => {
    const initializeBlinkCardSDK = async () => {
      // Check if browser is supported
      if (BlinkCardSDK.isBrowserSupported()) {
        const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);

        try {
          const wasmSDK = await BlinkCardSDK.loadWasmModule(loadSettings);
          setIsShown(true);
          // The SDK was initialized successfully, you can save the wasmSDK for future use
          console.log('BlinkCard SDK initialized successfully:', wasmSDK);
          return wasmSDK;
        } catch (error) {
          // Error happened during the initialization of the SDK
          console.error('Error during the initialization of the BlinkCard SDK:', error);
        }
      } else {
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
            setUserMessage(t('completed'));

            //  // Remove spaces from the card number
            //   const trimmedCardNumber = blinkCardResult?.cardNumber.replace(/\s+/g, '');
            //  // Extract the needed card numbers
            //   const firstSixDigits = trimmedCardNumber.substring(0, 6);
            //   const lastFourDigits = trimmedCardNumber.substring(trimmedCardNumber.length - 4);
            //   const expiryDate = blinkCardResult?.expiryDate?.originalString;
            // //  TODO: add server request to send data.

            // try {
            //   axios.post('endpoint-here', {
            //     token: userToken,
            //     paymentId,
            //     cardHolderName: blinkCardResult.owner,
            //     prefix: firstSixDigits,
            //     suffix: lastFourDigits,
            //     expiryDate,
            //   })
            // } catch(err) {
            //  setFailed(true);
            //  setUserMessage(t('failed'));
            // }

            setCompleted(true);
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
  }, [t]);

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
          <FailedSvg show={false} />
        </div>
      </div>
    </>
  );
};

export default VideoRecognizer;
