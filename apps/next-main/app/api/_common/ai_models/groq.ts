import {createGroqDriver} from "@reasonote/lib-ai";

export const groq = createGroqDriver(process.env.GROQ_API_KEY!);