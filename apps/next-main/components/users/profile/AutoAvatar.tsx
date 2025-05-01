"use client";
// import { useState } from "react";

// import wiki from "wikipedia";

import {
  Avatar,
  AvatarProps,
} from "@mui/material";

// import { useAsyncEffect } from "@reasonote/lib-utils-frontend";

// import { useFaceLandmarksDetector } from "../../../clientOnly/hooks/useFaceLandmarksDetector";
// import CroppedAvatar from "./CroppedAvatar";

interface AutoAvatarProps {
  name?: string | null;
  avatarProps?: AvatarProps;
}

export default function AutoAvatar({ name, avatarProps }: AutoAvatarProps) {
  return <Avatar {...avatarProps} />;
}

// export default function AutoAvatar({ name, avatarProps }: AutoAvatarProps) {
//   const [searchRes, setSearchRes] = useState<any>(null);
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [box, setBox] = useState<BoundingBox | null>(null);
//   const [couldNotFindFace, setCouldNotFindFace] = useState<boolean>(false);
//   const { data: detector } = useFaceLandmarksDetector();

//   useAsyncEffect(async () => {
//     setImageUrl(null);
//     setBox(null);
//     setCouldNotFindFace(false);
//     if (!name) {
//       return;
//     }
//     // Search wikipedia
//     const res = await wiki.search(name);
//     const json = await res.results[0];
//     setSearchRes(json);

//     if (json) {
//       const resAgain = await wiki.summary(json.title);

//       const src = resAgain?.thumbnail?.source
//         ? resAgain?.thumbnail?.source
//         : resAgain?.originalimage?.source;

//       console.log("got this image for name", name, src);

//       setImageUrl(src);
//     }
//   }, [name]);

//   useAsyncEffect(async () => {
//     if (!imageUrl) return;
//     if (!detector) return;
//     // Don't try again.
//     if (couldNotFindFace) return;

//     // Load the image from the URL
//     const loadImage = (url: string) => {
//       return new Promise<HTMLImageElement>((resolve, reject) => {
//         const image = new Image();
//         image.crossOrigin = "anonymous";
//         image.onload = () => resolve(image);
//         image.onerror = (error) => reject(error);
//         image.src = url;
//       });
//     };

//     try {
//       if (!detector) return;
//       const image = await loadImage(imageUrl);

//       const predictions = await detector.estimateFaces(image);

//       const firstPred = predictions[0];

//       if (!firstPred) {
//         setCouldNotFindFace(true);
//         return;
//       } else {
//         console.log("firstPred", firstPred);
//         setBox(predictions[0].box);
//       }
//     } catch (error) {
//       setCouldNotFindFace(true);
//       console.error("ISSUE FINDING FACES", error);
//     }
//   }, [imageUrl, detector]);

//   console.log(
//     "name",
//     name,
//     "imageUrl",
//     imageUrl,
//     "box",
//     box,
//     "couldNotFindFace",
//     couldNotFindFace
//   );

//   return imageUrl ? (
//     box ? (
//       <CroppedAvatar imageUrl={imageUrl} box={box} avatarProps={avatarProps} />
//     ) : couldNotFindFace ? (
//       <Avatar src={imageUrl} {...avatarProps} />
//     ) : (
//       <Avatar {...avatarProps} />
//     )
//   ) : (
//     <Avatar {...avatarProps} />
//   );
// }
