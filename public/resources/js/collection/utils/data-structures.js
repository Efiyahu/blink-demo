/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */
export { SDKError } from '@microblink/blinkcard-in-browser-sdk';
/**
 * Events
 */
export class EventReady {
  constructor(sdk) {
    this.sdk = sdk;
  }
}
export class EventScanError {
  constructor(code, fatal, message, recognizerName, details) {
    this.code = code;
    this.fatal = fatal;
    this.message = message;
    this.recognizerName = recognizerName;
    if (details) {
      this.details = details;
    }
  }
}
export class EventScanSuccess {
  constructor(recognizer, recognizerName, successFrame) {
    this.recognizer = recognizer;
    this.recognizerName = recognizerName;
    if (successFrame) {
      this.successFrame = successFrame;
    }
  }
}
/**
 * Error codes
 */
export var Code;
(function (Code) {
  Code["EmptyResult"] = "EMPTY_RESULT";
  Code["InvalidRecognizerOptions"] = "INVALID_RECOGNIZER_OPTIONS";
  Code["NoImageFileFound"] = "NO_IMAGE_FILE_FOUND";
  Code["NoFirstImageFileFound"] = "NO_FIRST_IMAGE_FILE_FOUND";
  Code["NoSecondImageFileFound"] = "NO_SECOND_IMAGE_FILE_FOUND";
  Code["GenericScanError"] = "GENERIC_SCAN_ERROR";
  Code["CameraNotAllowed"] = "CAMERA_NOT_ALLOWED";
  Code["CameraInUse"] = "CAMERA_IN_USE";
  Code["CameraGenericError"] = "CAMERA_GENERIC_ERROR";
})(Code || (Code = {}));
/**
 * Scan structures
 */
export const AvailableRecognizers = {
  BlinkCardRecognizer: 'createBlinkCardRecognizer',
};
export var ImageRecognitionType;
(function (ImageRecognitionType) {
  ImageRecognitionType["SingleSide"] = "SingleSide";
  ImageRecognitionType["MultiSide"] = "MultiSide";
})(ImageRecognitionType || (ImageRecognitionType = {}));
export var MultiSideImageType;
(function (MultiSideImageType) {
  MultiSideImageType["First"] = "First";
  MultiSideImageType["Second"] = "Second";
})(MultiSideImageType || (MultiSideImageType = {}));
export var RecognitionStatus;
(function (RecognitionStatus) {
  RecognitionStatus["NoImageFileFound"] = "NoImageFileFound";
  RecognitionStatus["NoFirstImageFileFound"] = "NoFirstImageFileFound";
  RecognitionStatus["NoSecondImageFileFound"] = "NoSecondImageFileFound";
  RecognitionStatus["Preparing"] = "Preparing";
  RecognitionStatus["Ready"] = "Ready";
  RecognitionStatus["Processing"] = "Processing";
  RecognitionStatus["DetectionFailed"] = "DetectionFailed";
  RecognitionStatus["EmptyResultState"] = "EmptyResultState";
  RecognitionStatus["OnFirstSideResult"] = "OnFirstSideResult";
  RecognitionStatus["ScanSuccessful"] = "ScanSuccessful";
  RecognitionStatus["DocumentClassified"] = "DocumentClassified";
  // Camera states
  RecognitionStatus["DetectionStatusChange"] = "DetectionStatusChange";
  RecognitionStatus["NoSupportForMediaDevices"] = "NoSupportForMediaDevices";
  RecognitionStatus["CameraNotFound"] = "CameraNotFound";
  RecognitionStatus["CameraNotAllowed"] = "CameraNotAllowed";
  RecognitionStatus["UnableToAccessCamera"] = "UnableToAccessCamera";
  RecognitionStatus["CameraInUse"] = "CameraInUse";
  RecognitionStatus["CameraGenericError"] = "CameraGenericError";
  // Errors
  RecognitionStatus["UnknownError"] = "UnknownError";
  // BlinkCardSDK.DetectionStatus
  RecognitionStatus["DetectionStatusFail"] = "Fail";
  RecognitionStatus["DetectionStatusSuccess"] = "Success";
  RecognitionStatus["DetectionStatusCameraTooHigh"] = "CameraTooHigh";
  RecognitionStatus["DetectionStatusFallbackSuccess"] = "FallbackSuccess";
  RecognitionStatus["DetectionStatusPartial"] = "Partial";
  RecognitionStatus["DetectionStatusCameraAtAngle"] = "CameraAtAngle";
  RecognitionStatus["DetectionStatusCameraTooNear"] = "CameraTooNear";
  RecognitionStatus["DetectionStatusDocumentTooCloseToEdge"] = "DocumentTooCloseToEdge";
})(RecognitionStatus || (RecognitionStatus = {}));
export var CameraExperience;
(function (CameraExperience) {
  CameraExperience["Barcode"] = "BARCODE";
  CameraExperience["CardMultiSide"] = "CARD_MULTI_SIDE";
  CameraExperience["CardSingleSide"] = "CARD_SINGLE_SIDE";
  CameraExperience["PaymentCard"] = "PAYMENT_CARD";
})(CameraExperience || (CameraExperience = {}));
export var CameraExperienceState;
(function (CameraExperienceState) {
  CameraExperienceState["AdjustAngle"] = "AdjustAngle";
  CameraExperienceState["Classification"] = "Classification";
  CameraExperienceState["Default"] = "Default";
  CameraExperienceState["Detection"] = "Detection";
  CameraExperienceState["Done"] = "Done";
  CameraExperienceState["DoneAll"] = "DoneAll";
  CameraExperienceState["Flip"] = "Flip";
  CameraExperienceState["MoveCloser"] = "MoveCloser";
  CameraExperienceState["MoveFarther"] = "MoveFarther";
})(CameraExperienceState || (CameraExperienceState = {}));
export const CameraExperienceStateDuration = new Map([
  [CameraExperienceState.AdjustAngle, 2500],
  [CameraExperienceState.Default, 500],
  [CameraExperienceState.Done, 300],
  [CameraExperienceState.DoneAll, 400],
  [CameraExperienceState.Flip, 4000],
  [CameraExperienceState.MoveCloser, 2500],
  [CameraExperienceState.MoveFarther, 2500]
]);
/**
 * User feedback structures
 */
export var FeedbackCode;
(function (FeedbackCode) {
  FeedbackCode["CameraDisabled"] = "CAMERA_DISABLED";
  FeedbackCode["CameraGenericError"] = "CAMERA_GENERIC_ERROR";
  FeedbackCode["CameraInUse"] = "CAMERA_IN_USE";
  FeedbackCode["CameraNotAllowed"] = "CAMERA_NOT_ALLOWED";
  FeedbackCode["GenericScanError"] = "GENERIC_SCAN_ERROR";
  FeedbackCode["ScanStarted"] = "SCAN_STARTED";
  FeedbackCode["ScanUnsuccessful"] = "SCAN_UNSUCCESSFUL";
  FeedbackCode["ScanSuccessful"] = "SCAN_SUCCESSFUL";
})(FeedbackCode || (FeedbackCode = {}));
