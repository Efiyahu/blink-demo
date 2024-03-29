/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */
import * as BlinkCardSDK from '@microblink/blinkcard-in-browser-sdk';
import { CameraEntry, CameraExperience, EventReady, VideoRecognitionConfiguration, ImageRecognitionConfiguration, MultiSideImageRecognitionConfiguration, ImageRecognitionType, RecognitionEvent, SdkSettings, SDKError } from './data-structures';
export interface CheckConclusion {
  status: boolean;
  message?: string;
}
export declare function getCameraDevices(): Promise<Array<CameraEntry>>;
export declare class SdkService {
  private sdk;
  private eventEmitter$;
  private cancelInitiatedFromOutside;
  private recognizerName;
  videoRecognizer: BlinkCardSDK.VideoRecognizer;
  showOverlay: boolean;
  constructor();
  delete(): void;
  initialize(licenseKey: string, sdkSettings: SdkSettings): Promise<EventReady | SDKError>;
  checkRecognizers(recognizers: Array<string>): CheckConclusion;
  getDesiredCameraExperience(_recognizers?: Array<string>, _recognizerOptions?: any): CameraExperience;
  scanFromCamera(configuration: VideoRecognitionConfiguration, eventCallback: (ev: RecognitionEvent) => void): Promise<void>;
  flipCamera(): Promise<void>;
  isCameraFlipped(): boolean;
  isScanFromImageAvailable(_recognizers?: Array<string>, _recognizerOptions?: any): boolean;
  getScanFromImageType(_recognizers?: Array<string>, _recognizerOptions?: any): ImageRecognitionType;
  scanFromImage(configuration: ImageRecognitionConfiguration, eventCallback: (ev: RecognitionEvent) => void): Promise<void>;
  scanFromImageMultiSide(configuration: MultiSideImageRecognitionConfiguration, eventCallback: (ev: RecognitionEvent) => void): Promise<void>;
  stopRecognition(): Promise<void>;
  resumeRecognition(): Promise<void>;
  changeCameraDevice(camera: BlinkCardSDK.SelectedCamera): Promise<boolean>;
  getProductIntegrationInfo(): Promise<BlinkCardSDK.ProductIntegrationInfo>;
  private isRecognizerAvailable;
  private createRecognizers;
  private createRecognizerRunner;
  private cancelRecognition;
}
