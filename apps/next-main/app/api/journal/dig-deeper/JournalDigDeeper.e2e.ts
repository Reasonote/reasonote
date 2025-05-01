import {SupabaseClient} from "@supabase/supabase-js";

import {getApiEnv} from "../../helpers/apiEnv";
import {JournalDigDeeperRoute} from "./routeSchema";

test("Journal Dig Deeper", async () => {
  const apiEnv = getApiEnv();

  // TODO: make an abstraction around this for the default admin user, etc.
  const sb = new SupabaseClient(
    apiEnv.NEXT_PUBLIC_SUPABASE_URL,
    apiEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const results = await sb.auth.signInWithPassword({
    email: "system@reasonote.com",
    password: "rootchangeme",
  });
  const token = results.data.session?.access_token;

  if (!token) {
    throw new Error("Failed to get token");
  }

  const res = await JournalDigDeeperRoute.call(
    {
      sessionGoals: [],
      pastJournalEntries: [
        {
          type: "ai",
          content: `What do you want to accomplish today?`,
        },
        {
          type: "human",
          content: `I don't know, I'm feeling a little lost. I want to exercise today but I don't know what else.`,
        },
      ],
      driverConfig: {
        type: "openai",
        config: {
          model: "gpt-4o-mini",
        },
      },
    },
    {
      baseUrl: "http://localhost:3456",
      headers: {
        Authorization: token,
      },
    }
  );

  console.log(res);

  expect(res.success).toBe(true);

  const resJson = res.data;

  expect(res.data?.suggestedNewGoals).toBeDefined();

  console.log(JSON.stringify(resJson, null, 2));
}, 45000);
