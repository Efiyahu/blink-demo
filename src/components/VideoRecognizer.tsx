import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import i18n from '../locales';
import Navbar from './Navbar';
import CompletedSvg from './CompletedSvg';

const VideoRecognizer = () => {
  const [isShown, setIsShown] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<string>('');

  const { t } = useTranslation();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const language = searchParams.get('language');
  // const userToken = searchParams.get('userToken');
  // const paymentID = searchParams.get('paymentID');

  // Set the Language based on the language code that's passed
  useEffect(() => {
    i18n.changeLanguage(language as string | undefined);
  }, [language]);

  // Init the blinkcard recognizer and begin recognition
  useEffect(() => {
    const initializeBlinkCardSDK = async () => {
      // Check if browser is supported
      if (BlinkCardSDK.isBrowserSupported()) {
        const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(
          import.meta.env.VITE_MICROBLINK_LICENSE_KEY
        );

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
            // TODO: add server request to send data.
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
        <p id="camera-guides" style={isTransparent}>
          {t('cameraGuide')}
        </p>

        <div id="flip-guides">
          <p className="text" style={isTransparent}>
            {userMessage}
          </p>
          <CompletedSvg show={completed} />
        </div>
      </div>
    </>
  );
};

export default VideoRecognizer;
