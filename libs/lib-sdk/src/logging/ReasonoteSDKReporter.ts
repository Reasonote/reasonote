import _ from 'lodash';

import {
  createSimpleLogger,
  uuidv4,
} from '@reasonote/lib-utils';

export interface BasicLoggingData {
  user?: {
    id?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  page?: {
    url: string;
    title: string;
  } | null;
}

/** The parameters the ReasonoteSBLogger needs to complete a `sendEvent` call. */
export interface ReasonoteSDKReporterSendEventParams {
  basicLoggingData: BasicLoggingData;
}

/** The parameters the ReasonoteSDKReporter needs to complete a `sendError` call. */
export interface ReasonoteSDKReporterSendErrorParams {
  basicLoggingData: BasicLoggingData;
}

/** The parameters the ReasonoteSDKReporter needs to complete a `sendPageView` call. */
export interface ReasonoteSDKReporterSendPageViewParams {
  basicLoggingData: BasicLoggingData;
}

/** The parameters the ReasonoteSDKReporter needs to complete a `sendPageView` call. */
export interface ReasonoteSDKReporterSendEndPageViewParams {
  basicLoggingData: BasicLoggingData;
}



interface ReasonoteSDKReporterConfig {
  rsnApplicationId: string;
  // deepDebugMode?: boolean;
}

export class ReasonoteSDKReporter {
  /** This is the logger for the logger... */
  private _sessionId = uuidv4();
  private _internalLogger = createSimpleLogger("ReasonoteSDKLogger");
  private _userDataInitialized = false;
  private _timeInitializedMS = Date.now();
  private _currentUserData: Partial<BasicLoggingData> = {};
  // private _sbLogger: ReasonoteSBLogger;
  // private _deepDebugMode = false;

  // private _sendEventQueuedFunction: (params: Reasonote) => void;
  // private _sendErrorQueuedFunction: (params: ReasonoteSDKLoggerSendErrorParams) => void;
  // private _sendPageViewQueuedFunction: (params: ReasonoteSDKLoggerSendPageViewParams) => void;
  // private _sendEndPageViewQueuedFunction: (params?: any) => void;

  public constructor(readonly config: ReasonoteSDKReporterConfig) {
    this._internalLogger.debug("constructor called");
    // this._appInsightsLogger = new AppInsightsUtil({
    //     connectionString: props.appInsightsParams.connectionString,
    //     instrumentationKey: props.appInsightsParams.instrumentationKey,
    //     sourceApp: props.appInsightsParams.sourceApp,
    //     userBasicInfo: props.userBasicInfo,
    // });


    // this._sendEventQueuedFunction = queuedFunction(this._sendEvent, this.isReadyToSend, {
    //     beforeDrainCallback: (p) => {
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(`Draining sendEvent queue of ${p.itemsToDrain.length} elements.`);
    //     },
    //     afterDrainCallback: (p) => {
    //         const successCount = p.drainResult.filter((i) => i.success).length;
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(
    //                 `Drained sendEvent queue of ${p.drainResult.length} elements. (${successCount}/${p.drainResult.length} successes)`,
    //             );
    //     },
    //     pollReadyIntervalMs: 1000,
    // });
    // this._sendErrorQueuedFunction = queuedFunction(this._sendError, this.isReadyToSend, {
    //     beforeDrainCallback: (p) => {
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(`Draining sendError queue of ${p.itemsToDrain.length} elements.`);
    //     },
    //     afterDrainCallback: (p) => {
    //         const successCount = p.drainResult.filter((i) => i.success).length;
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(
    //                 `Drained sendError queue of ${p.drainResult.length} elements. (${successCount} / ${p.drainResult.length} successes)`,
    //             );
    //     },
    //     pollReadyIntervalMs: 1000,
    // });
    // this._sendPageViewQueuedFunction = queuedFunction(this._sendPageView, this.isReadyToSend, {
    //     beforeDrainCallback: (p) => {
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(`Draining sendPageView queue of ${p.itemsToDrain.length} elements.`);
    //     },
    //     afterDrainCallback: (p) => {
    //         const successCount = p.drainResult.filter((i) => i.success).length;
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(
    //                 `Drained sendPageView queue of ${p.drainResult.length} elements. (${successCount} / ${p.drainResult.length} successes)`,
    //             );
    //     },
    //     pollReadyIntervalMs: 1000,
    // });
    // this._sendEndPageViewQueuedFunction = queuedFunction(this._sendEndPageView, this.isReadyToSend, {
    //     beforeDrainCallback: (p) => {
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(`Draining sendEndPageView queue of ${p.itemsToDrain.length} elements.`);
    //     },
    //     afterDrainCallback: (p) => {
    //         const successCount = p.drainResult.filter((i) => i.success).length;
    //         this._deepDebugMode &&
    //             this._internalLogger.debug(
    //                 `Drained sendEndPageView queue of ${p.drainResult.length} elements. (${successCount} / ${p.drainResult.length} successes)`,
    //             );
    //     },
    //     pollReadyIntervalMs: 1000,
    // });
  }

  isReadyToSend = (): boolean => {
    // Check if we have User Data OR if we've waited for too long.
    return (
      // Has the core user data been initialized yet?
      _.every(
        [
          this._currentUserData.user?.email,
          this._currentUserData.user?.id,
          this._currentUserData.user?.firstName,
          this._currentUserData.user?.lastName,
        ],
        (i) => !!i
      ) ||
      // Have we waited for more than 10 seconds?
      this._timeInitializedMS + 10000 < Date.now()
    );
  };

  initializeUserData = (userData: Partial<BasicLoggingData>) => {
    this._internalLogger.debug("initializeUserData called.");

    // Initialize any parameters that are not already set.
    const newUserData = { ...userData };
    _.defaultsDeep(newUserData, this._currentUserData);
    this._currentUserData = newUserData;

    // this._appInsightsLogger.initializeUserData(userData);
  };

  sendEvent = (params: ReasonoteSDKReporterSendEventParams) => {
    this._internalLogger.debug("sendEvent called");
    // try {
    //     this._sendEventQueuedFunction(params);
    // } catch (error: any) {
    //     this._internalLogger.error("sendEvent: Error sending event to backend. Error was: ", error);
    // }
  };

  sendError = (params: ReasonoteSDKReporterSendErrorParams) => {
    this._internalLogger.debug("sendError called");
    // try {
    //     this._sendErrorQueuedFunction(params);
    // } catch (error: any) {
    //     this._internalLogger.error(
    //         "sendError: Error sending client error to backend 😬. Error sending was: ",
    //         error,
    //     );
    // }
  };

  sendPageView = (params: ReasonoteSDKReporterSendPageViewParams) => {
    this._internalLogger.log("sendPageView called");
    // try {
    //     this._sendPageViewQueuedFunction(params);
    // } catch (error: any) {
    //     this._internalLogger.error(
    //         "sendPageView: Error sending client page view to backend. Error sending was: ",
    //         error,
    //     );
    // }
  };

  sendEndPageView = () => {
    this._internalLogger.log("sendEndPageView called");
    // try {
    //     this._sendEndPageViewQueuedFunction();
    // } catch (error: any) {
    //     this._internalLogger.error(
    //         "sendPageView: Error sending client page view to backend. Error sending was: ",
    //         error,
    //     );
    // }
  };

  // private _sendEvent = (params: ReasonoteSDKLoggerSendEventParams) => {
  //     this._appInsightsLogger.sendEvent(params);
  //     this._sbLogger.sendEvent({
  //         ...params,
  //         currentUserData: this._currentUserData,
  //     });
  // };

  // private _sendError = (params: ReasonoteSDKLoggerSendErrorParams) => {
  //     this._appInsightsLogger.sendError(params);
  //     this._sbLogger.sendError({
  //         ...params,
  //         currentUserData: this._currentUserData,
  //     });
  // };

  // private _sendPageView = (params: ReasonoteSDKLoggerSendPageViewParams) => {
  //     this._appInsightsLogger.sendPageView(params);
  //     this._sbLogger.sendPageView({
  //         ...params,
  //         currentUserData: this._currentUserData,
  //     });
  // };

  // private _sendEndPageView = () => {
  //     this._appInsightsLogger.sendEndPageView();
  //     this._sbLogger.sendEndPageView({
  //         currentUserData: this._currentUserData,
  //     });
  // };
}
