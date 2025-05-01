import {NextResponse} from "next/server";
import WebSocket from "ws";

import {makeServerApiHandlerV3} from "../helpers/serverApiHandlerV3";
import {RealtimeAudioRoute} from "./routeSchema";

export const { POST } = makeServerApiHandlerV3({
  route: RealtimeAudioRoute,
  handler: async (ctx) => {
    const { parsedReq, apiEnv, supabase } = ctx;
    const { text, style } = parsedReq;

    const audioChunks: string[] = [];

    // Only admin users can use this endpoint
    const isAdmin = await supabase.rpc("is_admin");

    if (!isAdmin.data) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
        headers: {
          "Authorization": `Bearer ${apiEnv.OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });

      ws.on("open", () => {
        console.log("Connected to OpenAI Realtime API");
        
        // Initialize the session
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            instructions: `
            <CRITICAL_INSTRUCTION>
            IF STAGE DIRECTION (i.e. "[OMINOUS PAUSE, LOADS WEAPON]") IS PROVIDED, DO NOT SAY THE TEXT IN THE STAGE DIRECTION.
            </CRITICAL_INSTRUCTION>

            You are a world-class voice actor who will say *precisely* and *only* what is asked of you, EXCEPT for the stage directions, which you should only use to inform your intonation and emotion.
            
            You should respond with the emotion, tone, accent given in your character description.

            Really *lean in* to the voice acting.


            IF You are provided with text that is *clearly* stage direction, DO NOT SAY THE TEXT IN THE STAGE DIRECTION.

            Instead, use the stage direction to inform your intonation and emotion.

            <EXAMPLE>
              <EXAMPLE_INPUT>
              \`\`\`
              ${JSON.stringify({text: "How are you Mr. Jones? [PAUSES, SPEAKS QUIETER] I sure would like to see you again..."}, null, 2)}
              \`\`\`
              </EXAMPLE_INPUT>
              <EXAMPLE_OUTPUT>
              [You say, "How are you Mr. Jones?"]
              [You say, after a pause, quieter, "I sure would like to see you again..."]
              </EXAMPLE_OUTPUT>
            </EXAMPLE>

            <CHARACTER_DESCRIPTION>
            Your character description:
            \`\`\`
            ${style}
            \`\`\`
            </CHARACTER_DESCRIPTION>

            <CRITICAL_INSTRUCTION>
            IF STAGE DIRECTION (i.e. "[OMINOUS PAUSE, LOADS WEAPON]") IS PROVIDED, DO NOT SAY THE TEXT IN THE STAGE DIRECTION.
            </CRITICAL_INSTRUCTION>
            `,
            "voice": "echo",
          },
        }));

        // Send the user's prompt
        ws.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `

                Please say the following:
                \`\`\`
                ${JSON.stringify({text}, null, 2)}
                \`\`\`
                `
              },
            ],
          },
        }));

        // Request a response
        ws.send(JSON.stringify({ type: "response.create" }));
      });

      ws.on("message", async (data) => {
        const event = JSON.parse(data.toString());

        console.log("Received event:", JSON.stringify(event, null, 2).slice(0, 1000));

        if (event.type === "response.audio.delta") {
          if (event.delta) {
            audioChunks.push(event.delta);
          } else {
            console.error("Received audio delta event without audio data:", event);
          }
        } else if (event.type === "response.audio.done") {
          ws.close();
          resolve(NextResponse.json({
            audioChunks: audioChunks
          }));
        } else {
          console.log("Received unexpected event type:", event.type);
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        reject(NextResponse.json({ error: "WebSocket error occurred" }, { status: 500 }));
      });

      ws.on("close", () => {
        console.log("Disconnected from OpenAI Realtime API");
      });
    });
  },
});