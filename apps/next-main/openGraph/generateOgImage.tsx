import {ReactElement} from "react";

import {ImageResponseOptions} from "next/server";

import {ImageResponse} from "@vercel/og";

export function genBase64ImageFromReact(text) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="50%" y="50%" fill="#000" font-size="48" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;
    // Encode the SVG to Base64
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

export async function genBase64ImageFromReact2(reactElement: ReactElement, opts?: ImageResponseOptions) {
    const resp = new ImageResponse(
        reactElement,
        opts
    );

    // Convert the stream to a buffer
    const arrayBuffer = await resp.arrayBuffer();
    // Convert to base64
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
}
