import {NextResponse} from "next/server";
import webpush from "web-push";

export async function POST() {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    return NextResponse.json(vapidKeys);
  } catch (error) {
    console.error('Error generating VAPID keys:', error);
    return NextResponse.json({ error: 'Failed to generate VAPID keys' }, { status: 500 });
  }
}