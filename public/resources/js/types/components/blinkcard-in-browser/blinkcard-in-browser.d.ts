/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */
import { EventEmitter } from '../../stencil-public-runtime';
import { EventReady, EventScanError, EventScanSuccess, FeedbackMessage, MicroblinkUI, SDKError, ProductIntegrationInfo, CameraExperienceTimeoutDurations } from '../../utils/data-structures';
export declare class BlinkcardInBrowser implements MicroblinkUI {
  private blocked;
  /**
   * Write a hello message to the browser console when license check is successfully performed.
   *
   * Hello message will contain the name and version of the SDK, which are required information for all support
   * tickets.
   *
   * Default value is true.
   */
  allowHelloMessage: boolean;
  /**
   * Absolute location of WASM and related JS/data files. Useful when resource files should be loaded over CDN, or
   * when web frameworks/libraries are used which store resources in specific locations, e.g. inside "assets" folder.
   *
   * Important: if engine is hosted on another origin, CORS must be enabled between two hosts. That is, server where
   * engine is hosted must have 'Access-Control-Allow-Origin' header for the location of the web app.
   *
   * Important: SDK and WASM resources must be from the same version of package.
   *
   * Default value is empty string, i.e. "". In case of empty string, value of "window.location.origin" property is
   * going to be used.
   */
  engineLocation: string;
  /**
   * The absolute location of the Web Worker script file that loads the WebAssembly module.
   *
   * Important: the worker script must be served via HTTPS and must be of the same origin as the initiator.
   * See https://github.com/w3c/ServiceWorker/issues/940 (same applies for Web Workers).
   *
   * Important: SDK, worker script and WebAssembly resources must be from the same version of the package.
   *
   * The default value is an empty string, i.e. "", and in that case, the worker script is loaded from the default location in resources folder.
   */
  workerLocation: string;
  /**
   * License key which is going to be used to unlock WASM library.
   *
   * Keep in mind that UI component will reinitialize every time license key is changed.
   */
  licenseKey: string;
  /**
   * Defines the type of the WebAssembly build that will be loaded. If omitted, SDK will determine
   * the best possible WebAssembly build which should be loaded based on the browser support.
   *
   * Available WebAssembly builds:
   *
   * - 'BASIC'
   * - 'ADVANCED'
   * - 'ADVANCED_WITH_THREADS'
   *
   * For more information about different WebAssembly builds, check out the `src/MicroblinkSDK/WasmType.ts` file.
   */
  wasmType: string;
  /**
   * List of recognizers which should be used.
   *
   * Available recognizers for BlinkCard:
   *
   * - BlinkCardRecognizer
   *
   * Recognizers can be defined by setting HTML attribute "recognizers", for example:
   *
   * `<blinkcard-in-browser recognizers="BlinkCardRecognizer"></blinkcard-in-browser>`
   */
  rawRecognizers: string;
  /**
   * List of recognizers which should be used.
   *
   * Available recognizers for BlinkCard:
   *
   * - BlinkCardRecognizer
   *
   * Recognizers can be defined by setting HTML attribute "recognizers", for example:
   *
   * ```
   * const blinkCard = document.querySelector('blinkcard-in-browser');
   * blinkCard.recognizers = ['BlinkCardRecognizer'];
   * ```
   */
  recognizers: Array<string>;
  /**
   * Specify recognizer options. This option can only bet set as a JavaScript property.
   *
   * Pass an object to `recognizerOptions` property where each key represents a recognizer, while
   * the value represents desired recognizer options.
   *
   * ```
   * blinkCard.recognizerOptions = {
   *   'BlinkCardRecognizer': {
   *     'extractCvv': true,
   *
   *     // When setting values for enums, check the source code to see possible values.
   *     // For AnonymizationSettings we can see the list of possible values in
   *     // `src/Recognizers/BlinkCard/BlinkCardRecognizer.ts` file.
   *     anonymizationSettings: {
   *       cardNumberAnonymizationSettings: {
   *         mode: 0,
   *         prefixDigitsVisible: 0,
   *         suffixDigitsVisible: 0
   *       },
   *       cardNumberPrefixAnonymizationMode: 0,
   *       cvvAnonymizationMode: 0,
   *       ibanAnonymizationMode: 0,
   *       ownerAnonymizationMode: 0
   *     }
   *   }
   * }
   * ```
   *
   * For a full list of available recognizer options see source code of a recognizer. For example,
   * list of available recognizer options for BlinkCardRecognizer can be seen in the
   * `src/Recognizers/BlinkCard/BlinkCardRecognizer.ts` file.
   */
  recognizerOptions: {
    [key: string]: any;
  };
  /**
   * Amount of time in milliseconds before the recognition process is cancelled regardless of
   * whether recognition was successful or not.
   *
   * This setting applies only to video recognition.
   *
   * Keep in mind that the timer starts after the first non-empty result. This behaviour ensures
   * that the user has enough time to take out the document and place it in front of the camera
   * device.
   */
  recognitionTimeout: number;
  /**
   * Amount of time in milliseconds before the recognition process is resumed after it is being paused previously.
   *
   * This setting applies only to video recognition.
   *
   * Keep in mind that the timer starts after the front side was scanned. This behaviour ensures
   * that the user has enough time to flip the document and place its back side in front of the camera
   * device.
   */
  recognitionPauseTimeout: number;
  /**
   * Configure camera experience state timeout durations
   */
  cameraExperienceStateDurations: CameraExperienceTimeoutDurations;
  /**
   * Set to 'true' if success frame should be included in final scanning results.
   *
   * Default value is 'false'.
   */
  includeSuccessFrame: boolean;
  /**
   * Set to 'false' if component should not enable drag and drop functionality.
   *
   * Default value is 'true'.
   */
  enableDrag: boolean;
  /**
   * If set to 'true', UI component will not display feedback, i.e. information and error messages.
   *
   * Setting this attribute to 'false' won't disable 'scanError' and 'scanInfo' events.
   *
   * Default value is 'false'.
   */
  hideFeedback: boolean;
  /**
   * If set to 'true', UI component will become visible after successful SDK initialization. Also, error screen
   * is not going to be displayed in case of initialization error.
   *
   * If set to 'false', loading and error screens of the UI component will be visible during initialization and in case
   * of an error.
   *
   * Default value is 'false'.
   */
  hideLoadingAndErrorUi: boolean;
  /**
   * Set to 'true' if scan from camera should be enabled. If set to 'true' and camera is not available or disabled,
   * related button will be visible but disabled.
   *
   * Default value is 'true'.
   */
  scanFromCamera: boolean;
  /**
   * Set to 'true' if scan from image should be enabled.
   *
   * Default value is 'false'.
   */
  scanFromImage: boolean;
  /**
   * Define whether to use 'FULLSCREEN' or 'INLINE' gallery overlay type.
   *
   * If 'FULLSCREEN' is used, when a user selects an image from which data should be extracted, an overlay will pop up
   * and cover the whole screen.
   *
   * On the other hand, if 'INLINE' is used, there is no overlay but rather a 'Processing' message inside the UI
   * component.
   *
   * Default value is 'INLINE'.
   */
  galleryOverlayType: 'FULLSCREEN' | 'INLINE';
  /**
   * Define whether to use 'FULLSCREEN' or 'INLINE' gallery dropdown type.
   *
   * If 'FULLSCREEN' is used, when a user drags an image over the UI component, an overlay will pop up and cover the
   * whole screen.
   *
   * If 'INLINE' is used, there is no fullscreen overlay, but rather the overlay is restricted to the size of the UI
   * component.
   *
   * Default value is 'INLINE'.
   */
  galleryDropType: 'FULLSCREEN' | 'INLINE';
  /**
   * Set to 'true' if text labels should be displayed below action buttons.
   *
   * Default value is 'false'.
   */
  showActionLabels: boolean;
  /**
   * Set to 'true' if modal window should be displayed in case of an error.
   *
   * Default value is 'false'.
   */
  showModalWindows: boolean;
  /**
   * Set custom translations for UI component. List of available translation keys can be found in
   * `src/utils/translation.service.ts` file.
   */
  rawTranslations: string;
  /**
   * Set custom translations for UI component. List of available translation keys can be found in
   * `src/utils/translation.service.ts` file.
   */
  translations: {
    [key: string]: string;
  };
  /**
   * Provide alternative camera icon.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative camera icon.
   *
   * Image is scaled to 20x20 pixels.
   */
  iconCameraDefault: string;
  /**
   * Hover state of iconCameraDefault.
   */
  iconCameraActive: string;
  /**
   * Provide alternative gallery icon. This icon is also used during drag and drop action.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative gallery icon.
   *
   * Image is scaled to 20x20 pixels. In drag and drop dialog image is scaled to 24x24 pixels.
   */
  iconGalleryDefault: string;
  /**
   * Hover state of iconGalleryDefault.
   */
  iconGalleryActive: string;
  /**
   * Provide alternative invalid format icon which is used during drag and drop action.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative icon.
   *
   * Image is scaled to 24x24 pixels.
   */
  iconInvalidFormat: string;
  /**
   * Provide alternative loading icon. CSS rotation is applied to this icon.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative icon.
   *
   * Image is scaled to 24x24 pixels.
   */
  iconSpinnerScreenLoading: string;
  /**
   * Provide alternative loading icon. CSS rotation is applied to this icon.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative icon.
   *
   * Image is scaled to 24x24 pixels.
   */
  iconSpinnerFromGalleryExperience: string;
  /**
   * Provide alternative completed icon. This icon is used when gallery scanning process is done, in case that
   * `galleryOverlayType` property is set to `INLINE`.
   *
   * Every value that is placed here is passed as a value of `src` attribute to <img> element. This attribute can be
   * used to provide location, base64 or any URL of alternative icon.
   *
   * Image is scaled to 24x24 pixels.
   */
  iconGalleryScanningCompleted: string;
  /**
   * Camera device ID passed from root component.
   *
   * Client can choose which camera to turn on if array of cameras exists.
   *
   */
  cameraId: string | null;
  /**
   * Scan line animation option passed from root component.
   *
   * Client can choose if scan line animation will be present in UI.
   *
   * Default value is 'false'
   *
   */
  showScanningLine: boolean;
  /**
   * Event which is emitted during initialization of UI component.
   *
   * Each event contains `code` property which has deatils about fatal errror.
   */
  fatalError: EventEmitter<SDKError>;
  /**
   * Event which is emitted when UI component is successfully initialized and ready for use.
   */
  ready: EventEmitter<EventReady>;
  /**
   * Event which is emitted during or immediately after scan error.
   */
  scanError: EventEmitter<EventScanError>;
  /**
   * Event which is emitted after successful scan. This event contains recognition results.
   */
  scanSuccess: EventEmitter<EventScanSuccess>;
  /**
   * Event which is emitted during positive or negative user feedback. If attribute/property
   * `hideFeedback` is set to `false`, UI component will display the feedback.
   */
  feedback: EventEmitter<FeedbackMessage>;
  /**
   * Event which is emitted when camera scan is started, i.e. when user clicks on
   * _scan from camera_ button.
   */
  cameraScanStarted: EventEmitter<null>;
  /**
   * Event which is emitted when image scan is started, i.e. when user clicks on
   * _scan from gallery button.
   */
  imageScanStarted: EventEmitter<null>;
  /**
   * Event which is emitted when scan is aborted, i.e. when user clicks on
   * close from the gallery toolbar, or presses escape key.
   */
  scanAborted: EventEmitter<null>;
  /**
   * Control UI state of camera overlay.
   *
   * Possible values are 'ERROR' | 'LOADING' | 'NONE' | 'SUCCESS'.
   *
   * In case of state `ERROR` and if `showModalWindows` is set to `true`, modal window
   * with error message will be displayed. Otherwise, UI will close.
   */
  setUiState(state: 'ERROR' | 'LOADING' | 'NONE' | 'SUCCESS'): Promise<void>;
  /**
   * Starts camera scan using camera overlay with usage instructions.
   */
  startCameraScan(): Promise<void>;
  /**
   * Starts image scan, emits results from provided file.
   *
   * @param file File to scan
   */
  startImageScan(file: File): Promise<void>;
  /**
   * Starts multi-side image scan, emits results from provided files.
   *
   * @param firstFile File to scan as first image
   * @param secondFile File to scan as second image
   */
  startMultiSideImageScan(firstFile: File, secondFile: File): Promise<void>;
  /**
   * Show message alongside UI component.
   *
   * Possible values for `state` are 'FEEDBACK_ERROR' | 'FEEDBACK_INFO' | 'FEEDBACK_OK'.
   */
  setUiMessage(state: 'FEEDBACK_ERROR' | 'FEEDBACK_INFO' | 'FEEDBACK_OK', message: string): Promise<void>;
  /**
   * Get information about product integration.
   */
  getProductIntegrationInfo(): Promise<ProductIntegrationInfo>;
  hostEl: HTMLElement;
  componentWillLoad(): void;
  componentWillUpdate(): void;
  disconnectedCallback(): void;
  private init;
  render(): any;
  private sdkService;
  private translationService;
  private finalRecognizers;
  private finalTranslations;
  private feedbackEl;
  private mbComponentEl;
}
