/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */
import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { AvailableRecognizers, CameraExperience, EventReady, ImageRecognitionType, RecognitionStatus, SDKError } from './data-structures';
import * as ErrorTypes from './error-structures';
const _IS_IMAGE_CAPTURE = false;
export async function getCameraDevices() {
  const devices = await BlinkCardSDK.getCameraDevices();
  const allDevices = devices.frontCameras.concat(devices.backCameras);
  const finalEntries = allDevices.map((el) => {
    return {
      prettyName: el.label,
      details: el
    };
  });
  return finalEntries;
}
export class SdkService {
  constructor() {
    this.cancelInitiatedFromOutside = false;
    this.showOverlay = false;
    this.eventEmitter$ = document.createElement('a');
  }
  delete() {
    var _a;
    (_a = this.sdk) === null || _a === void 0 ? void 0 : _a.delete();
  }
  initialize(licenseKey, sdkSettings) {
    const loadSettings = new BlinkCardSDK.WasmSDKLoadSettings(licenseKey);
    loadSettings.allowHelloMessage = sdkSettings.allowHelloMessage;
    loadSettings.engineLocation = sdkSettings.engineLocation;
    loadSettings.workerLocation = sdkSettings.workerLocation;
    if (sdkSettings.wasmType) {
      loadSettings.wasmType = sdkSettings.wasmType;
    }
    return new Promise((resolve) => {
      BlinkCardSDK.loadWasmModule(loadSettings)
        .then((sdk) => {
        this.sdk = sdk;
        this.showOverlay = sdk.showOverlay;
        resolve(new EventReady(this.sdk));
      })
        .catch(error => {
        resolve(new SDKError(ErrorTypes.componentErrors.sdkLoadFailed, error));
      });
    });
  }
  checkRecognizers(recognizers) {
    if (!recognizers || !recognizers.length) {
      return {
        status: false,
        message: 'There are no provided recognizers!'
      };
    }
    for (const recognizer of recognizers) {
      if (!this.isRecognizerAvailable(recognizer)) {
        return {
          status: false,
          message: `Recognizer "${recognizer}" doesn't exist!`
        };
      }
    }
    return {
      status: true
    };
  }
  getDesiredCameraExperience(_recognizers = [], _recognizerOptions = {}) {
    return CameraExperience.PaymentCard;
  }
  async scanFromCamera(configuration, eventCallback) {
    var _a, _b;
    eventCallback({ status: RecognitionStatus.Preparing });
    this.cancelInitiatedFromOutside = false;
    // Prepare terminate mechanism before recognizer and runner instances are created
    this.eventEmitter$.addEventListener('terminate', async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      (_b = (_a = this.videoRecognizer) === null || _a === void 0 ? void 0 : _a.cancelRecognition) === null || _b === void 0 ? void 0 : _b.call(_a);
      window.setTimeout(() => { var _a, _b; return (_b = (_a = this.videoRecognizer) === null || _a === void 0 ? void 0 : _a.releaseVideoFeed) === null || _b === void 0 ? void 0 : _b.call(_a); }, 1);
      if (recognizerRunner) {
        try {
          await recognizerRunner.delete();
        }
        catch (error) {
          // Psst, this error should not happen.
        }
      }
      for (const recognizer of recognizers) {
        if (!recognizer) {
          continue;
        }
        if (((_c = recognizer.recognizer) === null || _c === void 0 ? void 0 : _c.objectHandle) > -1) {
          (_e = (_d = recognizer.recognizer).delete) === null || _e === void 0 ? void 0 : _e.call(_d);
        }
        if (((_f = recognizer.successFrame) === null || _f === void 0 ? void 0 : _f.objectHandle) > -1) {
          (_h = (_g = recognizer.successFrame).delete) === null || _h === void 0 ? void 0 : _h.call(_g);
        }
      }
    });
    // Prepare recognizers and runner
    const recognizers = await this.createRecognizers(configuration.recognizers, configuration.recognizerOptions, configuration.successFrame);
    const recognizerRunner = await this.createRecognizerRunner(recognizers, eventCallback);
    try {
      this.videoRecognizer = await BlinkCardSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(configuration.cameraFeed, recognizerRunner, configuration.cameraId);
      eventCallback({ status: RecognitionStatus.Ready });
      await this.videoRecognizer.setVideoRecognitionMode(BlinkCardSDK.VideoRecognitionMode.Recognition);
      this.videoRecognizer.startRecognition(async (recognitionState) => {
        this.videoRecognizer.pauseRecognition();
        eventCallback({ status: RecognitionStatus.Processing });
        if (recognitionState !== BlinkCardSDK.RecognizerResultState.Empty) {
          for (const recognizer of recognizers) {
            const results = await recognizer.recognizer.getResult();
            this.recognizerName = recognizer.recognizer.recognizerName;
            if (!results || results.state === BlinkCardSDK.RecognizerResultState.Empty) {
              eventCallback({
                status: RecognitionStatus.EmptyResultState,
                data: {
                  initiatedByUser: this.cancelInitiatedFromOutside,
                  recognizerName: this.recognizerName
                }
              });
            }
            else {
              const recognitionResults = {
                recognizer: results,
                recognizerName: this.recognizerName
              };
              if (recognizer.successFrame) {
                const successFrameResults = await recognizer.successFrame.getResult();
                if (successFrameResults && successFrameResults.state !== BlinkCardSDK.RecognizerResultState.Empty) {
                  recognitionResults.successFrame = successFrameResults;
                }
              }
              recognitionResults.imageCapture = _IS_IMAGE_CAPTURE;
              const scanData = {
                result: recognitionResults,
                initiatedByUser: this.cancelInitiatedFromOutside,
                imageCapture: _IS_IMAGE_CAPTURE
              };
              eventCallback({
                status: RecognitionStatus.ScanSuccessful,
                data: scanData
              });
              break;
            }
          }
        }
        else {
          eventCallback({
            status: RecognitionStatus.EmptyResultState,
            data: {
              initiatedByUser: this.cancelInitiatedFromOutside,
              recognizerName: ''
            }
          });
        }
        window.setTimeout(() => void this.cancelRecognition(), 400);
      }, configuration.recognitionTimeout)
        .then(() => { })
        .catch((error) => { throw error; });
      ;
    }
    catch (error) {
      if (error && ((_a = error.details) === null || _a === void 0 ? void 0 : _a.reason)) {
        const reason = (_b = error.details) === null || _b === void 0 ? void 0 : _b.reason;
        switch (reason) {
          case BlinkCardSDK.NotSupportedReason.MediaDevicesNotSupported:
            eventCallback({ status: RecognitionStatus.NoSupportForMediaDevices });
            break;
          case BlinkCardSDK.NotSupportedReason.CameraNotFound:
            eventCallback({ status: RecognitionStatus.CameraNotFound });
            break;
          case BlinkCardSDK.NotSupportedReason.CameraNotAllowed:
            eventCallback({ status: RecognitionStatus.CameraNotAllowed });
            break;
          case BlinkCardSDK.NotSupportedReason.CameraInUse:
            eventCallback({ status: RecognitionStatus.CameraInUse });
            break;
          default:
            eventCallback({ status: RecognitionStatus.UnableToAccessCamera });
        }
        console.warn('VideoRecognizerError', error.name, '[' + reason + ']:', error.message);
      }
      else {
        eventCallback({ status: RecognitionStatus.UnknownError });
      }
      void this.cancelRecognition();
    }
  }
  async flipCamera() {
    await this.videoRecognizer.flipCamera();
  }
  isCameraFlipped() {
    if (!this.videoRecognizer) {
      return false;
    }
    return this.videoRecognizer.isCameraFlipped();
  }
  isScanFromImageAvailable(_recognizers = [], _recognizerOptions = {}) {
    return false;
  }
  getScanFromImageType(_recognizers = [], _recognizerOptions = {}) {
    if (_recognizers.indexOf('BlinkCardRecognizer') > -1) {
      return ImageRecognitionType.MultiSide;
    }
    return ImageRecognitionType.SingleSide;
  }
  async scanFromImage(configuration, eventCallback) {
    eventCallback({ status: RecognitionStatus.Preparing });
    const recognizers = await this.createRecognizers(configuration.recognizers, configuration.recognizerOptions);
    const recognizerRunner = await this.createRecognizerRunner(recognizers, eventCallback);
    const handleTerminate = async () => {
      var _a, _b, _c;
      this.eventEmitter$.removeEventListener('terminate', handleTerminate);
      if (recognizerRunner) {
        try {
          await recognizerRunner.delete();
        }
        catch (error) {
          // Psst, this error should not happen.
        }
      }
      for (const recognizer of recognizers) {
        if (!recognizer) {
          continue;
        }
        if (((_a = recognizer.recognizer) === null || _a === void 0 ? void 0 : _a.objectHandle) > -1) {
          (_c = (_b = recognizer.recognizer).delete) === null || _c === void 0 ? void 0 : _c.call(_b);
        }
      }
      this.eventEmitter$.dispatchEvent(new Event('terminate:done'));
    };
    this.eventEmitter$.addEventListener('terminate', handleTerminate);
    // Get image file
    if (!configuration.file || !RegExp(/^image\//).exec(configuration.file.type)) {
      eventCallback({ status: RecognitionStatus.NoImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }
    const file = configuration.file;
    const imageElement = new Image();
    imageElement.src = URL.createObjectURL(file);
    await imageElement.decode();
    const imageFrame = BlinkCardSDK.captureFrame(imageElement);
    // Get results
    eventCallback({ status: RecognitionStatus.Processing });
    const processResult = await recognizerRunner.processImage(imageFrame);
    if (processResult !== BlinkCardSDK.RecognizerResultState.Empty) {
      for (const recognizer of recognizers) {
        const results = await recognizer.recognizer.getResult();
        if (!results || results.state === BlinkCardSDK.RecognizerResultState.Empty) {
          eventCallback({
            status: RecognitionStatus.EmptyResultState,
            data: {
              initiatedByUser: this.cancelInitiatedFromOutside,
              recognizerName: recognizer.name
            }
          });
        }
        else {
          const recognitionResults = {
            recognizer: results,
            imageCapture: _IS_IMAGE_CAPTURE,
            recognizerName: recognizer.name
          };
          eventCallback({
            status: RecognitionStatus.ScanSuccessful,
            data: recognitionResults
          });
          break;
        }
      }
    }
    else {
      eventCallback({
        status: RecognitionStatus.EmptyResultState,
        data: {
          initiatedByUser: this.cancelInitiatedFromOutside,
          recognizerName: ''
        }
      });
    }
    window.setTimeout(() => void this.cancelRecognition(), 500);
  }
  async scanFromImageMultiSide(configuration, eventCallback) {
    eventCallback({ status: RecognitionStatus.Preparing });
    const recognizers = await this.createRecognizers(configuration.recognizers, configuration.recognizerOptions);
    const recognizerRunner = await this.createRecognizerRunner(recognizers, eventCallback);
    const handleTerminate = async () => {
      var _a, _b, _c;
      this.eventEmitter$.removeEventListener('terminate', handleTerminate);
      if (recognizerRunner) {
        try {
          await recognizerRunner.delete();
        }
        catch (error) {
          // Psst, this error should not happen.
        }
      }
      for (const recognizer of recognizers) {
        if (!recognizer) {
          continue;
        }
        if (((_a = recognizer.recognizer) === null || _a === void 0 ? void 0 : _a.objectHandle) > -1) {
          (_c = (_b = recognizer.recognizer).delete) === null || _c === void 0 ? void 0 : _c.call(_b);
        }
      }
      this.eventEmitter$.dispatchEvent(new Event('terminate:done'));
    };
    this.eventEmitter$.addEventListener('terminate', handleTerminate);
    if (!configuration.firstFile) {
      eventCallback({ status: RecognitionStatus.NoFirstImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }
    if (!configuration.secondFile) {
      eventCallback({ status: RecognitionStatus.NoSecondImageFileFound });
      window.setTimeout(() => void this.cancelRecognition(), 500);
      return;
    }
    // Get results
    eventCallback({ status: RecognitionStatus.Processing });
    const imageElement = new Image();
    imageElement.src = URL.createObjectURL(configuration.firstFile);
    await imageElement.decode();
    const firstFrame = BlinkCardSDK.captureFrame(imageElement);
    const firstProcessResult = await recognizerRunner.processImage(firstFrame);
    if (firstProcessResult !== BlinkCardSDK.RecognizerResultState.Empty) {
      const imageElement = new Image();
      imageElement.src = URL.createObjectURL(configuration.secondFile);
      await imageElement.decode();
      const secondFrame = BlinkCardSDK.captureFrame(imageElement);
      const secondProcessResult = await recognizerRunner.processImage(secondFrame);
      if (secondProcessResult !== BlinkCardSDK.RecognizerResultState.Empty) {
        for (const recognizer of recognizers) {
          const results = await recognizer.recognizer.getResult();
          if (!results || results.state === BlinkCardSDK.RecognizerResultState.Empty) {
            eventCallback({
              status: RecognitionStatus.EmptyResultState,
              data: {
                initiatedByUser: this.cancelInitiatedFromOutside,
                recognizerName: recognizer.name
              }
            });
          }
          else {
            const recognitionResults = {
              recognizer: results,
              imageCapture: _IS_IMAGE_CAPTURE,
              recognizerName: recognizer.name
            };
            eventCallback({
              status: RecognitionStatus.ScanSuccessful,
              data: recognitionResults
            });
            break;
          }
        }
      }
      else {
        eventCallback({
          status: RecognitionStatus.EmptyResultState,
          data: {
            initiatedByUser: this.cancelInitiatedFromOutside,
            recognizerName: ''
          }
        });
      }
    }
    else {
      eventCallback({
        status: RecognitionStatus.EmptyResultState,
        data: {
          initiatedByUser: this.cancelInitiatedFromOutside,
          recognizerName: ''
        }
      });
    }
    window.setTimeout(() => void this.cancelRecognition(), 500);
  }
  async stopRecognition() {
    void await this.cancelRecognition(true);
  }
  async resumeRecognition() {
    this.videoRecognizer.resumeRecognition(true);
  }
  changeCameraDevice(camera) {
    return new Promise((resolve) => {
      this.videoRecognizer.changeCameraDevice(camera)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }
  getProductIntegrationInfo() {
    return this.sdk.getProductIntegrationInfo();
  }
  //////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  isRecognizerAvailable(recognizer) {
    return !!AvailableRecognizers[recognizer];
  }
  async createRecognizers(recognizers, recognizerOptions, successFrame = false) {
    const pureRecognizers = [];
    for (const recognizer of recognizers) {
      const instance = await BlinkCardSDK[AvailableRecognizers[recognizer]](this.sdk);
      pureRecognizers.push(instance);
    }
    if (recognizerOptions && Object.keys(recognizerOptions).length > 0) {
      for (const recognizer of pureRecognizers) {
        const settings = await recognizer.currentSettings();
        let updated = false;
        if (!recognizerOptions[recognizer.recognizerName] ||
          Object.keys(recognizerOptions[recognizer.recognizerName]).length < 1) {
          continue;
        }
        for (const [key, value] of Object.entries(recognizerOptions[recognizer.recognizerName])) {
          if (key in settings) {
            settings[key] = value;
            updated = true;
          }
        }
        if (updated) {
          await recognizer.updateSettings(settings);
        }
      }
    }
    const recognizerInstances = [];
    for (let i = 0; i < pureRecognizers.length; ++i) {
      const recognizer = pureRecognizers[i];
      const instance = { name: recognizers[i], recognizer };
      if (successFrame) {
        const successFrameGrabber = await BlinkCardSDK.createSuccessFrameGrabberRecognizer(this.sdk, recognizer);
        instance.successFrame = successFrameGrabber;
      }
      recognizerInstances.push(instance);
    }
    return recognizerInstances;
  }
  async createRecognizerRunner(recognizers, eventCallback) {
    const metadataCallbacks = {
      onDetectionFailed: () => eventCallback({ status: RecognitionStatus.DetectionFailed }),
      onQuadDetection: (quad) => {
        eventCallback({ status: RecognitionStatus.DetectionStatusChange, data: quad });
        const detectionStatus = quad.detectionStatus;
        switch (detectionStatus) {
          case BlinkCardSDK.DetectionStatus.Fail:
            eventCallback({ status: RecognitionStatus.DetectionStatusSuccess });
            break;
          case BlinkCardSDK.DetectionStatus.Success:
            eventCallback({ status: RecognitionStatus.DetectionStatusSuccess });
            break;
          case BlinkCardSDK.DetectionStatus.CameraTooHigh:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraTooHigh });
            break;
          case BlinkCardSDK.DetectionStatus.FallbackSuccess:
            eventCallback({ status: RecognitionStatus.DetectionStatusFallbackSuccess });
            break;
          case BlinkCardSDK.DetectionStatus.Partial:
            eventCallback({ status: RecognitionStatus.DetectionStatusPartial });
            break;
          case BlinkCardSDK.DetectionStatus.CameraAtAngle:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraAtAngle });
            break;
          case BlinkCardSDK.DetectionStatus.CameraTooNear:
            eventCallback({ status: RecognitionStatus.DetectionStatusCameraTooNear });
            break;
          case BlinkCardSDK.DetectionStatus.DocumentTooCloseToEdge:
            eventCallback({ status: RecognitionStatus.DetectionStatusDocumentTooCloseToEdge });
            break;
          default:
          // Send nothing
        }
      }
    };
    for (const el of recognizers) {
      if (el.recognizer.recognizerName === 'BlinkCardRecognizer') {
        metadataCallbacks.onFirstSideResult = () => eventCallback({ status: RecognitionStatus.OnFirstSideResult });
      }
    }
    const recognizerRunner = await BlinkCardSDK.createRecognizerRunner(this.sdk, recognizers.map((el) => el.successFrame || el.recognizer), false, metadataCallbacks);
    return recognizerRunner;
  }
  async cancelRecognition(initiatedFromOutside = false) {
    this.cancelInitiatedFromOutside = initiatedFromOutside;
    this.eventEmitter$.dispatchEvent(new Event('terminate'));
  }
}
