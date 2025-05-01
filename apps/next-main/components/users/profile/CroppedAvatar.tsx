"use client";

import React, { useEffect, useState } from "react";

import _ from "lodash";

import { Avatar, AvatarProps } from "@mui/material";

interface CroppedAvatarProps {
  imageUrl: string;
  box: {
    xMin: number;
    yMin: number;
    width: number;
    height: number;
  };
  padding?: number;
  avatarProps?: AvatarProps;
}

const CroppedAvatar: React.FC<CroppedAvatarProps> = ({
  imageUrl,
  box,
  padding,
  avatarProps,
}) => {
  const [foundFaceBox, setFoundFaceBox] = useState(box);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const aspectRatio = box.width / box.height;
    const size = Math.sqrt(Math.pow(box.width, 2) + Math.pow(box.height, 2));
    const calculatedPadding =
      padding !== undefined ? padding : (size / 2) * (1 - aspectRatio);

    const paddingBox = {
      xMin: Math.max(0, box.xMin - calculatedPadding),
      yMin: Math.max(0, box.yMin - calculatedPadding),
      width: box.width + calculatedPadding * 2,
      height: box.height + calculatedPadding * 2,
    };
    setFoundFaceBox(paddingBox);

    const sourceImage = new Image();
    sourceImage.src = imageUrl;
    sourceImage.crossOrigin = "anonymous"; // Add this line
    sourceImage.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = paddingBox.width;
      canvas.id = _.uniqueId(`CroppedAvatar-canvas`);
      canvas.height = paddingBox.height;

      const ctx = canvas.getContext("2d");
      ctx!.drawImage(
        sourceImage,
        paddingBox.xMin,
        paddingBox.yMin,
        paddingBox.width,
        paddingBox.height,
        0,
        0,
        paddingBox.width,
        paddingBox.height
      );

      const dataUrl = canvas.toDataURL();
      setCroppedImageUrl(dataUrl);
    };
  }, [imageUrl, box, padding]);

  if (!croppedImageUrl) {
    return null;
  }

  console.log("CroppedAvatar", avatarProps);
  return <Avatar src={croppedImageUrl} {...avatarProps} />;
};

export default CroppedAvatar;
