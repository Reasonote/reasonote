import {streamObject} from "ai";
import _ from "lodash";
import {z} from "zod";

import {openai} from "@ai-sdk/openai";

function formatStreamPart(type: string, data: any) {
  return `${type}:${JSON.stringify(data)}\n\n`;
}

export const runtime = 'edge';

export const maxDuration = 300;

interface StreamObject {
  status?: string;
  progress?: number;
  midwayResult?: string;
  finalResult?: string;
}

type PartialObject<T> = Partial<T>;

class PartialObjectStream<T extends object> {
  private generator: AsyncGenerator<PartialObject<T>, void, unknown>;

  constructor(generator: AsyncGenerator<PartialObject<T>, void, unknown>) {
    this.generator = generator;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<string, void, unknown> {
    for await (const partial of this.generator) {
      yield formatStreamPart('partial_object', partial);
    }
    yield formatStreamPart('finish', {});
  }

  // toResponse(init?: ResponseInit): Response {
  //   const stream = this.toReadableStream().pipeThrough(new TextEncoderStream()  as TransformStream<string, Uint8Array>);
  //   return new Response(stream, {
  //     headers: {
  //       'Content-Type': 'text/event-stream',
  //       'Cache-Control': 'no-cache',
  //       'Connection': 'keep-alive',
  //       ...init?.headers,
  //     },
  //     ...init,
  //   });
  // }

  toReadableStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of this as any) {
          controller.enqueue(encoder.encode(chunk + '\n'));
        }
        controller.close();
      },
    });
  }
}

export async function* createPartialObject<T extends object>(
  generator: () => AsyncGenerator<PartialObject<T>, void, unknown>
): AsyncGenerator<PartialObject<T>, void, unknown> {
  yield* generator();
}

export function streamPartialObject<T extends object>(
  generator: () => AsyncGenerator<PartialObject<T>, void, unknown>
): PartialObjectStream<T> {
  return new PartialObjectStream(createPartialObject(generator));
}

async function* generatePartialObjects() {
  yield JSON.stringify({ type: 'partial_object', value: { status: 'starting' } });
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield JSON.stringify({ type: 'partial_object', value: { progress: 25 } });
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield JSON.stringify({ type: 'partial_object', value: { progress: 50, midwayResult: 'some data' } });
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield JSON.stringify({ type: 'partial_object', value: { progress: 75 } });
  await new Promise(resolve => setTimeout(resolve, 1000));
  yield JSON.stringify({ type: 'partial_object', value: { status: 'completed', finalResult: 'all data' } });
  yield JSON.stringify({ type: 'finish' });
}

async function* jsonFeedSlow() {
  const bigJsonObject = {
    lorem: 'ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
    dolor: 'sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
    ipsum: 'consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
    orci: 'consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  };

  const stringified = JSON.stringify(bigJsonObject);
  const numCharsAtOnce = 3;

  for (let i = 0; i < stringified.length; i += numCharsAtOnce) {
    yield stringified.slice(i, i + numCharsAtOnce);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}


const items = [
  {id: '1', name: 'item 1'},
  {id: '2', name: 'item 2'},
  {id: '3', name: 'item 3'},
  {id: '4', name: 'item 4'},
  {id: '5', name: 'item 5'},
  {id: '6', name: 'item 6'},
  {id: '7', name: 'item 7'},
  {id: '8', name: 'item 8'},
  {id: '9', name: 'item 9'},
  {id: '10', name: 'item 10'},
  {id: '11', name: 'item 11'},
  {id: '12', name: 'item 12'},
  {id: '13', name: 'item 13'},
  {id: '14', name: 'item 14'},
]

async function* arrayFeedSlow(arrItems: any[]){
  yield `[`;

  for (const item of items) {
    yield `${JSON.stringify(item)},`;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  yield `]`;
}

export const POST = async function handler(req, res) {
  const jsonRequest = await req.json();
  console.log(jsonRequest);


  /**
   * ARRAY
   */
  if (jsonRequest.type === 'array') {
    const stream = new ReadableStream({
      async start(controller) {
        // for await (const chunk of generatePartialObjects()) {
        //   controller.enqueue(new TextEncoder().encode(`data: ${chunk}\n\n`));
        // }
        for await (const chunk of arrayFeedSlow(items)) {
          controller.enqueue(new TextEncoder().encode(`${chunk}`));
        }
        controller.close();
      },
    });
  
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
  else if (jsonRequest.type === 'json') {
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of jsonFeedSlow()) {
          controller.enqueue(new TextEncoder().encode(`${chunk}`));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } else if (jsonRequest.type === 'ai'){
    const objres = streamObject({
      model: openai('gpt-4o-mini'),
      prompt: 'say hello for each field response',
      schema: z.object({
        message: z.string(),
        message2: z.string(),
        message3: z.string(),
        message4: z.string(),
        message5: z.string(),
        message6: z.string(),
        message7: z.string(),
        message8: z.string(),
        message9: z.string(),
        message10: z.string(),
        message11: z.string(),
        message12: z.string(),
        message13: z.string(),
        message14: z.string(),
      })
    });

    return new Response(objres.textStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }); 
  }
}