import {SuggestTopicsMessage} from "./SuggestTopicsMessage";

export interface BotSuggestionMessageProps {
  msg: any;
  data: any;
  i: number;
}

export function BotSuggestionMessage({
  msg,
  data,
  i,
}: BotSuggestionMessageProps) {
  if (data.name === "suggestLearningTopics") {
    return (
      <>
        <SuggestTopicsMessage call={data} i={i} />
      </>
    );
  }

  return null;
}
