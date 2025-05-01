"use client";
// import {
//   FaceLandmarksDetector,
// } from "@tensorflow-models/face-landmarks-detection";

// import {faceDetectorVar} from "../state/detectorVar";

/**
 * This is a global simply becuase multiple instances were causing issues.
 */
// class FaceDetectorGlobal {
//   private static _detector: FaceLandmarksDetector | null = null;

//   static get detector() {
//     return this._detector;
//   }

//   static async initialize() {
//     // // Dynamically load because not doing this was causing issues.
//     // const faceLandmarksDetection = (
//     //   await import("@tensorflow-models/face-landmarks-detection")
//     // ).default;
//     // const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
//     // const detectorConfig = {
//     //   runtime: "mediapipe" as const, // or 'tfjs'
//     //   solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
//     //   refineLandmarks: true,
//     // };
//     // FaceDetectorGlobal._detector = await faceLandmarksDetection.createDetector(
//     //   model,
//     //   detectorConfig
//     // );

//     // faceDetectorVar({
//     //   data: FaceDetectorGlobal._detector,
//     //   loading: false,
//     //   error: null,
//     // });
//   }
// }

// try {
//   FaceDetectorGlobal.initialize();
// } catch (err: any) {
//   console.error("Could not initialize FaceDetectorGlobal.");
// }

// export function useFaceLandmarksDetector() {
//   // const faceDetectorGlobal = useReactiveVar(faceDetectorVar);

//   // return faceDetectorGlobal;
// }

export default 1;