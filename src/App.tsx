import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { useEffect, useState } from 'react';

import './App.css';

function App() {
  const [state, setState] = useState<BlinkCardSDK.BlinkCardRecognizerResult | null>(null);
  const [flip, setFlip] = useState<string>('');
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
          onFirstSideResult: () => setFlip('Flip the card'),
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
          setState(blinkCardResult);
          if (blinkCardResult.state !== BlinkCardSDK.RecognizerResultState.Empty) {
            console.log('BlinkCard results', blinkCardResult);

            setFlip(
              `${blinkCardResult.owner} ${blinkCardResult.cardNumber} ${blinkCardResult.expiryDate.year} ${blinkCardResult.expiryDate.month}`
            );
          }

          videoRecognizer?.releaseVideoFeed();

          // Release memory on WebAssembly heap used by the RecognizerRunner
          recognizerRunner?.delete();

          // Release memory on WebAssembly heap used by the recognizer
          recognizer?.delete();
        } else {
          alert('Could not extract information!');
        }
      });
  }, []);

  return (
    <div id="screen-scanning">
      <video id="camera-feed" playsInline></video>
      <p id="camera-guides">Point the camera towards Payment cards</p>
      <div style={{ position: 'relative' }}>
        <p id="camera-guides">{flip}</p>
        <p id="camera-guides"> {state && JSON.stringify(state)}</p>
      </div>
    </div>
  );
}

export default App;
