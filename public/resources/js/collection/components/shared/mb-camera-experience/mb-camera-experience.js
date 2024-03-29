/**
 * Copyright (c) Microblink Ltd. All rights reserved.
 */
import { Component, Element, Event, Host, h, Method, Prop, State, Watch } from '@stencil/core';
import { CameraExperience, CameraExperienceState, CameraExperienceStateDuration } from '../../../utils/data-structures';
import { setWebComponentParts, classNames, getWebComponentParts } from '../../../utils/generic.helpers';
import * as Utils from './mb-camera-experience.utils';
export class MbCameraExperience {
  constructor() {
    this.cameraCursorBarcodeClassName = 'rectangle';
    this.cameraCursorIdentityCardClassName = 'reticle';
    this.cameraCursorPaymentCardClassName = 'rectangle';
    this.cameraMessageIdentityCardClassName = 'message';
    this.cameraStateChangeId = 0;
    this.cameraStateInProgress = false;
    this.flipCameraStateInProgress = false;
    /**
     * Configure camera experience state timeout durations
     */
    this.cameraExperienceStateDurations = null;
    /**
     * Unless specifically granted by your license key, you are not allowed to
     * modify or remove the Microblink logo displayed on the bottom of the camera
     * overlay.
     */
    this.showOverlay = true;
    /**
     * Camera horizontal state passed from root component.
     *
     * Horizontal camera image can be mirrored
     */
    this.cameraFlipped = false;
    /**
     * Show scanning line on camera
     */
    this.showScanningLine = false;
    /**
     * Show camera feedback message on camera for Barcode scanning
     */
    this.showCameraFeedbackBarcodeMessage = false;
    this.clearIsCameraActive = false;
  }
  apiStateHandler(apiState, _oldValue) {
    if (apiState === '' && (this.type === CameraExperience.CardSingleSide || this.type === CameraExperience.CardMultiSide))
      this.cardIdentityElement.classList.add('visible');
    else
      this.cardIdentityElement.classList.remove('visible');
  }
  /**
   * Change active camera.
   */
  async setActiveCamera(cameraId) {
    this.cameraToolbar.setActiveCamera(cameraId);
  }
  /**
   * Populate list of camera devices.
   */
  async populateCameraDevices() {
    await this.cameraToolbar.populateCameraDevices();
  }
  /**
   * Method is exposed outside which allow us to control Camera Flip state from parent component.
   */
  async setCameraFlipState(isFlipped) {
    this.cameraFlipped = isFlipped;
  }
  /**
   * Set camera state which includes animation and message.
   */
  setState(state, isBackSide = false, force = false) {
    return new Promise((resolve) => {
      if (!force && (!state || this.cameraStateInProgress || this.flipCameraStateInProgress)) {
        resolve();
        return;
      }
      this.cameraStateInProgress = true;
      let cameraStateChangeId = this.cameraStateChangeId + 1;
      this.cameraStateChangeId = cameraStateChangeId;
      if (state === CameraExperienceState.Flip) {
        this.flipCameraStateInProgress = true;
      }
      const stateClass = Utils.getStateClass(state);
      switch (this.type) {
        case CameraExperience.CardSingleSide:
        case CameraExperience.CardMultiSide:
          this.cameraCursorIdentityCardClassName = `reticle ${stateClass}`;
          break;
        case CameraExperience.Barcode:
          stateClass === 'is-detection' && this.showScanningLine ? this.scanningLineBarcodeClassName = 'is-active' : this.scanningLineBarcodeClassName = '';
          this.cameraCursorBarcodeClassName = `rectangle ${stateClass}`;
          break;
        case CameraExperience.PaymentCard:
          stateClass === 'is-default' && this.showScanningLine ? this.scanningLinePaymentCardClassName = 'is-active' : this.scanningLinePaymentCardClassName = '';
          this.cameraCursorPaymentCardClassName = `rectangle ${stateClass}`;
          break;
      }
      this.setMessage(state, isBackSide, this.type);
      window.setTimeout(() => {
        if (this.flipCameraStateInProgress && state === CameraExperienceState.Flip) {
          this.flipCameraStateInProgress = false;
        }
        if (this.cameraStateChangeId === cameraStateChangeId) {
          this.cameraStateInProgress = false;
        }
        resolve();
      }, this.getCameraExperienceStateDuration(state));
    });
  }
  getCameraExperienceStateDuration(state) {
    return this.cameraExperienceStateDurations ? this.getStateDurationFromUserInput(state) : CameraExperienceStateDuration.get(state);
  }
  getStateDurationFromUserInput(state) {
    const cameraExperienceStateDurationMap = new Map(Object.entries(this.cameraExperienceStateDurations));
    const stateAdjusted = state[0].toLocaleLowerCase() + state.slice(1);
    const duration = cameraExperienceStateDurationMap.get(stateAdjusted);
    return duration || CameraExperienceStateDuration.get(state);
  }
  /**
   * Set camera state to initial method.
   */
  resetState() {
    return new Promise((resolve) => {
      // Reset flags
      this.cameraStateChangeId = 0;
      this.cameraStateInProgress = false;
      this.flipCameraStateInProgress = false;
      // Reset DOM
      while (this.cameraMessageIdentityCard.firstChild) {
        this.cameraMessageIdentityCard.removeChild(this.cameraMessageIdentityCard.firstChild);
      }
      while (this.cameraMessagePaymentCard.firstChild) {
        this.cameraMessagePaymentCard.removeChild(this.cameraMessagePaymentCard.firstChild);
      }
      while (this.cameraMessageBarcode.firstChild) {
        this.cameraMessageBarcode.removeChild(this.cameraMessageBarcode.firstChild);
      }
      resolve();
    });
  }
  flipCamera() {
    this.flipCameraAction.emit();
  }
  handleStop() {
    this.close.emit();
  }
  setMessage(state, isBackSide, type) {
    const message = this.getStateMessage(state, isBackSide, type);
    switch (type) {
      case CameraExperience.CardSingleSide:
      case CameraExperience.CardMultiSide:
        while (this.cameraMessageIdentityCard.firstChild) {
          this.cameraMessageIdentityCard.removeChild(this.cameraMessageIdentityCard.firstChild);
        }
        if (message) {
          this.cameraMessageIdentityCard.appendChild(message);
        }
        this.cameraMessageIdentityCardClassName = message && message !== null ? 'message is-active' : 'message';
        break;
      case CameraExperience.PaymentCard:
        while (this.cameraMessagePaymentCard.firstChild) {
          this.cameraMessagePaymentCard.removeChild(this.cameraMessagePaymentCard.firstChild);
        }
        if (message) {
          this.cameraMessagePaymentCard.appendChild(message);
        }
        this.cameraMessagePaymentCard.setAttribute('class', message && message !== null ? 'message is-active' : 'message');
        break;
      case CameraExperience.Barcode:
        while (this.cameraMessageBarcode.firstChild) {
          this.cameraMessageBarcode.removeChild(this.cameraMessageBarcode.firstChild);
        }
        if (this.showCameraFeedbackBarcodeMessage) {
          if (message) {
            this.cameraMessageBarcode.appendChild(message);
          }
          this.cameraMessageBarcode.setAttribute('class', message && message !== null ? 'message is-active' : 'message');
        }
        break;
      default:
      // Do nothing
    }
  }
  getStateMessage(state, isBackSide = false, type) {
    const getStateMessageAsHTML = (message) => {
      if (message) {
        const messageArray = typeof message === 'string' ? [message] : message;
        const children = [];
        while (messageArray.length) {
          const sentence = messageArray.shift();
          children.push(document.createTextNode(sentence));
          if (messageArray.length) {
            children.push(document.createElement('br'));
          }
        }
        const spanElement = document.createElement('span');
        while (children.length) {
          spanElement.appendChild(children.shift());
        }
        return spanElement;
      }
    };
    switch (state) {
      case CameraExperienceState.Default:
        if (type === CameraExperience.Barcode && this.showCameraFeedbackBarcodeMessage) {
          return getStateMessageAsHTML(this.translationService.i('camera-feedback-barcode-message'));
        }
        const key = isBackSide ? 'camera-feedback-scan-back' : 'camera-feedback-scan-front';
        return getStateMessageAsHTML(this.translationService.i(key));
      case CameraExperienceState.MoveFarther:
        return getStateMessageAsHTML(this.translationService.i('camera-feedback-move-farther'));
      case CameraExperienceState.MoveCloser:
        return getStateMessageAsHTML(this.translationService.i('camera-feedback-move-closer'));
      case CameraExperienceState.AdjustAngle:
        return getStateMessageAsHTML(this.translationService.i('camera-feedback-adjust-angle'));
      case CameraExperienceState.Flip:
        return getStateMessageAsHTML(this.translationService.i('camera-feedback-flip'));
      case CameraExperienceState.Classification:
      case CameraExperienceState.Detection:
        return type === CameraExperience.Barcode ? getStateMessageAsHTML(this.translationService.i('camera-feedback-barcode-message')) : null;
      case CameraExperienceState.Done:
      case CameraExperienceState.DoneAll:
      default:
        return null;
    }
  }
  handleChangeCameraDevice(camera) {
    this.changeCameraDevice.emit(camera);
  }
  componentDidLoad() {
    setWebComponentParts(this.hostEl);
    const parts = getWebComponentParts(this.hostEl.shadowRoot);
    this.hostEl.setAttribute('exportparts', parts.join(', '));
  }
  render() {
    return (h(Host, { class: classNames({ 'no-overlay': !this.showOverlay }) },
      h("div", { id: "barcode", class: classNames({ visible: this.type === CameraExperience.Barcode }) },
        h("div", { class: "rectangle-container" },
          h("div", { class: this.cameraCursorBarcodeClassName },
            h("div", { class: "rectangle__cursor" },
              h("div", { class: "rectangle__el" }),
              h("div", { class: "rectangle__el" }),
              h("div", { class: "rectangle__el" }),
              h("div", { class: "rectangle__el" }),
              h("div", { class: `scanning-line ${this.scanningLineBarcodeClassName}` }))),
          h("p", { class: "message", ref: el => this.cameraMessageBarcode = el }))),
      h("div", { id: "card-identity", ref: (el) => this.cardIdentityElement = el, class: classNames({ visible: this.type === CameraExperience.CardSingleSide || this.type === CameraExperience.CardMultiSide }) },
        h("div", { class: "reticle-container" },
          h("div", { class: this.cameraCursorIdentityCardClassName },
            h("div", { class: "reticle__cursor" },
              h("div", { class: "reticle__el" }),
              h("div", { class: "reticle__el" }),
              h("div", { class: "reticle__el" }),
              h("div", { class: "reticle__el" })),
            h("img", { class: "reticle__done", src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwLjk3MiAzMy40NkMyMC43MDk1IDMzLjQ2MDUgMjAuNDQ5NCAzMy40MDkyIDIwLjIwNjggMzMuMzA5QzE5Ljk2NDEgMzMuMjA4OCAxOS43NDM2IDMzLjA2MTYgMTkuNTU4IDMyLjg3NkwxMS4wNzQgMjQuMzlDMTAuODgyOSAyNC4yMDU2IDEwLjczMDMgMjMuOTg1MSAxMC42MjU0IDIzLjc0MTFDMTAuNTIwNCAyMy40OTcyIDEwLjQ2NSAyMy4yMzQ4IDEwLjQ2MjUgMjIuOTY5MkMxMC40NiAyMi43MDM3IDEwLjUxMDQgMjIuNDQwMyAxMC42MTA4IDIyLjE5NDRDMTAuNzExMiAyMS45NDg2IDEwLjg1OTYgMjEuNzI1MiAxMS4wNDcyIDIxLjUzNzNDMTEuMjM0OSAyMS4zNDkzIDExLjQ1ODEgMjEuMjAwNyAxMS43MDM4IDIxLjA5OTlDMTEuOTQ5NSAyMC45OTkyIDEyLjIxMjggMjAuOTQ4NCAxMi40Nzg0IDIwLjk1MDVDMTIuNzQzOSAyMC45NTI2IDEzLjAwNjQgMjEuMDA3NiAxMy4yNTA1IDIxLjExMjNDMTMuNDk0NiAyMS4yMTY5IDEzLjcxNTQgMjEuMzY5MSAxMy45IDIxLjU2TDIwLjk3IDI4LjYzTDMzLjcgMTUuOTA0QzM0LjA3NSAxNS41Mjg3IDM0LjU4MzggMTUuMzE3OCAzNS4xMTQzIDE1LjMxNzZDMzUuNjQ0OCAxNS4zMTc0IDM2LjE1MzcgMTUuNTI4IDM2LjUyOSAxNS45MDNDMzYuOTA0MyAxNi4yNzggMzcuMTE1MiAxNi43ODY4IDM3LjExNTQgMTcuMzE3M0MzNy4xMTU2IDE3Ljg0NzggMzYuOTA1IDE4LjM1NjcgMzYuNTMgMTguNzMyTDIyLjM4NiAzMi44NzZDMjIuMjAwNCAzMy4wNjE2IDIxLjk3OTkgMzMuMjA4OCAyMS43MzcyIDMzLjMwOUMyMS40OTQ2IDMzLjQwOTIgMjEuMjM0NSAzMy40NjA1IDIwLjk3MiAzMy40NloiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=" })),
          h("p", { class: this.cameraMessageIdentityCardClassName, ref: el => this.cameraMessageIdentityCard = el }))),
      h("div", { id: "card-payment", class: classNames({ visible: this.type === CameraExperience.PaymentCard }) },
        h("div", { class: "rectangle-container" },
          h("div", { class: "box wrapper" }),
          h("div", { class: "box body" },
            h("div", { class: "middle-left wrapper" }),
            h("div", { class: this.cameraCursorPaymentCardClassName },
              h("div", { class: "rectangle__cursor" },
                h("div", { class: "rectangle__el" }),
                h("div", { class: "rectangle__el" }),
                h("div", { class: "rectangle__el" }),
                h("div", { class: "rectangle__el" }),
                h("div", { class: `scanning-line ${this.scanningLinePaymentCardClassName}` }))),
            h("p", { class: "message", ref: el => this.cameraMessagePaymentCard = el }),
            h("div", { class: "middle-right wrapper" })),
          h("div", { class: "box wrapper" }))),
      h("div", { class: "gradient-overlay bottom" }),
      h("mb-camera-toolbar", { "clear-is-camera-active": this.clearIsCameraActive, "show-close": this.apiState !== "error", "camera-flipped": this.cameraFlipped, onCloseEvent: () => this.handleStop(), onFlipEvent: () => this.flipCamera(), onChangeCameraDevice: (ev) => this.handleChangeCameraDevice(ev.detail), ref: el => this.cameraToolbar = el })));
  }
  static get is() { return "mb-camera-experience"; }
  static get encapsulation() { return "shadow"; }
  static get originalStyleUrls() { return {
    "$": ["mb-camera-experience.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["mb-camera-experience.css"]
  }; }
  static get properties() { return {
    "type": {
      "type": "string",
      "mutable": false,
      "complexType": {
        "original": "CameraExperience",
        "resolved": "CameraExperience.Barcode | CameraExperience.CardMultiSide | CameraExperience.CardSingleSide | CameraExperience.PaymentCard",
        "references": {
          "CameraExperience": {
            "location": "import",
            "path": "../../../utils/data-structures"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Choose desired camera experience.\n\nEach experience type must be implemented in this component."
      },
      "attribute": "type",
      "reflect": false
    },
    "cameraExperienceStateDurations": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "CameraExperienceTimeoutDurations",
        "resolved": "CameraExperienceTimeoutDurations",
        "references": {
          "CameraExperienceTimeoutDurations": {
            "location": "import",
            "path": "../../../utils/data-structures"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Configure camera experience state timeout durations"
      },
      "defaultValue": "null"
    },
    "showOverlay": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Unless specifically granted by your license key, you are not allowed to\nmodify or remove the Microblink logo displayed on the bottom of the camera\noverlay."
      },
      "attribute": "show-overlay",
      "reflect": false,
      "defaultValue": "true"
    },
    "translationService": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "TranslationService",
        "resolved": "TranslationService",
        "references": {
          "TranslationService": {
            "location": "import",
            "path": "../../../utils/translation.service"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Instance of TranslationService passed from root component."
      }
    },
    "apiState": {
      "type": "string",
      "mutable": false,
      "complexType": {
        "original": "string",
        "resolved": "string",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Api state passed from root component."
      },
      "attribute": "api-state",
      "reflect": false
    },
    "cameraFlipped": {
      "type": "boolean",
      "mutable": true,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Camera horizontal state passed from root component.\n\nHorizontal camera image can be mirrored"
      },
      "attribute": "camera-flipped",
      "reflect": false,
      "defaultValue": "false"
    },
    "showScanningLine": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Show scanning line on camera"
      },
      "attribute": "show-scanning-line",
      "reflect": false,
      "defaultValue": "false"
    },
    "showCameraFeedbackBarcodeMessage": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Show camera feedback message on camera for Barcode scanning"
      },
      "attribute": "show-camera-feedback-barcode-message",
      "reflect": false,
      "defaultValue": "false"
    },
    "clearIsCameraActive": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "attribute": "clear-is-camera-active",
      "reflect": false,
      "defaultValue": "false"
    }
  }; }
  static get states() { return {
    "cameraCursorBarcodeClassName": {},
    "cameraCursorIdentityCardClassName": {},
    "cameraCursorPaymentCardClassName": {},
    "scanningLineBarcodeClassName": {},
    "scanningLinePaymentCardClassName": {},
    "cameraMessageIdentityCardContent": {},
    "cameraMessageIdentityCardClassName": {}
  }; }
  static get events() { return [{
      "method": "close",
      "name": "close",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Emitted when user clicks on 'X' button."
      },
      "complexType": {
        "original": "void",
        "resolved": "void",
        "references": {}
      }
    }, {
      "method": "setIsCameraActive",
      "name": "setIsCameraActive",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Emitted when camera stream becomes active."
      },
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      }
    }, {
      "method": "changeCameraDevice",
      "name": "changeCameraDevice",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Emitted when user selects a different camera device."
      },
      "complexType": {
        "original": "CameraEntry",
        "resolved": "CameraEntry",
        "references": {
          "CameraEntry": {
            "location": "import",
            "path": "../../../utils/data-structures"
          }
        }
      }
    }, {
      "method": "flipCameraAction",
      "name": "flipCameraAction",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Emitted when user clicks on Flip button."
      },
      "complexType": {
        "original": "void",
        "resolved": "void",
        "references": {}
      }
    }]; }
  static get methods() { return {
    "setActiveCamera": {
      "complexType": {
        "signature": "(cameraId: string) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Change active camera.",
        "tags": []
      }
    },
    "populateCameraDevices": {
      "complexType": {
        "signature": "() => Promise<void>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Populate list of camera devices.",
        "tags": []
      }
    },
    "setCameraFlipState": {
      "complexType": {
        "signature": "(isFlipped: boolean) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Method is exposed outside which allow us to control Camera Flip state from parent component.",
        "tags": []
      }
    },
    "setState": {
      "complexType": {
        "signature": "(state: CameraExperienceState, isBackSide?: boolean, force?: boolean) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "CameraExperienceState": {
            "location": "import",
            "path": "../../../utils/data-structures"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Set camera state which includes animation and message.",
        "tags": []
      }
    },
    "resetState": {
      "complexType": {
        "signature": "() => Promise<void>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Set camera state to initial method.",
        "tags": []
      }
    }
  }; }
  static get elementRef() { return "hostEl"; }
  static get watchers() { return [{
      "propName": "apiState",
      "methodName": "apiStateHandler"
    }]; }
}
