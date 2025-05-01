import { NextApiRequest, NextApiResponse } from "next";

// async function loadImageFromUrl(url: string) {
//     const response = await fetch(url);
//     const buffer = await response.buffer();
//     return await loadImage(buffer);
// }

// function cropFace(inputCanvas: Canvas, boundingBox: [number, number, number, number]) {
//     const [x, y, width, height] = boundingBox;
//     const faceCanvas = createCanvas(width, height);
//     const ctx = faceCanvas.getContext('2d');
//     ctx.drawImage(inputCanvas, x, y, width, height, 0, 0, width, height);
//     return faceCanvas;
// }

// async function processImage(imageUrl: string) {
//     const image = await loadImageFromUrl(imageUrl);
//     const inputCanvas = createCanvas(image.width, image.height);
//     const inputCtx = inputCanvas.getContext('2d');
//     inputCtx.drawImage(image, 0, 0, image.width, image.height);

//     const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
//     const detectorConfig = {
//         runtime: 'mediapipe', // or 'tfjs'
//         solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
//     }
//     const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);

//     const predictions = await detector.estimateFaces(image);
//     const predictions = await model.estimateFaces({ input: inputCanvas });

//     if (predictions.length > 0) {
//         const boundingBox = predictions[0].boundingBox;
//         const faceCanvas = cropFace(inputCanvas, boundingBox);
//         return faceCanvas.toDataURL();
//     }

//     return null;
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  if (!req.body.imageUrl) {
    res.status(400).json({ message: "Missing imageUrl parameter" });
    return;
  }

  res.status(404).json({ message: "Not implemented" });

  // await initializeFaceApi();
  // const croppedFaceDataUrl = await processImage(req.body.imageUrl);

  // if (croppedFaceDataUrl) {
  //     res.status(200).json({ croppedFaceDataUrl });
  // } else {
  //     res.status(404).json({ message: 'No faces detected in the image' });
  // }
}
