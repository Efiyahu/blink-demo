import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect } from 'react';

import './App.css';

function App() {
  useEffect(() => {
    const initializeBlinkCardSDK = async () => {
      // Check if browser is supported
      if (BlinkCardSDK.isBrowserSupported()) {
        const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(
          'sRwAAAYgdHJhbnF1aWwtZmF1bi1hNGNjNTkubmV0bGlmeS5hcHDXf9Q0aVtnvt6Sl5eT3TqUfKkqrb6Yt9QZZWpGq/2D/IFHmvFSlun1UBdVpp+ubS6U8CYUYQuJUOCGFtqKQ/Cz+ri3KAFg3dMYHwu5jUt1s7jFZAkigTEKRP+0ZLQA25EHL2FwaNALzbMwm1g2W/1jgj9C5VbATsWll9RU8Z0W6hxBUz3YQHHAuw=='
        );

        try {
          const wasmSDK = await BlinkCardSDK.loadWasmModule(loadSettings);
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
          onFirstSideResult: () => alert('Flip the card'),
        };
        const recognizer = await BlinkCardSDK.createBlinkCardRecognizer(wasmSDK);
        const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(
          wasmSDK,
          [recognizer],
          true,
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
      .then(async ({ videoRecognizer, recognizer }) => {
        const processResult = await videoRecognizer.recognize();

        if (processResult !== BlinkCardSDK.RecognizerResultState.Empty) {
          const blinkCardResult = await recognizer.getResult();
          if (blinkCardResult.state !== BlinkCardSDK.RecognizerResultState.Empty) {
            console.log('BlinkCard results', blinkCardResult);

            // const firstAndLastName = blinkCardResult.owner;
            // const cardNumber = blinkCardResult.cardNumber;
            // const dateOfExpiry = {
            //   year: blinkCardResult.expiryDate.year,
            //   month: blinkCardResult.expiryDate.month,
            // };
          }
          return blinkCardResult;

          //   videoRecognizer?.releaseVideoFeed();

          // // Release memory on WebAssembly heap used by the RecognizerRunner
          // recognizerRunner?.delete();

          // // Release memory on WebAssembly heap used by the recognizer
          // recognizer?.delete();
        } else {
          alert('Could not extract information!');
        }
      });
  }, []);

  return (
    <>
      <div id="screen-initial">
        <h1 id="msg">Loading...</h1>
        <progress id="load-progress" value="0" max="100"></progress>
      </div>

      <div id="screen-start" className="hidden">
        <a href="#" id="start-scan">
          Start scan
        </a>
      </div>

      <div id="screen-scanning" className="hidden">
        <video id="camera-feed" playsInline></video>
        <canvas id="camera-feedback"></canvas>
        <p id="camera-guides">Point the camera towards Payment cards</p>
      </div>
    </>
  );
}

export default App;
