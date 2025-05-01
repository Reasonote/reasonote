import * as Priompt from '@anysphere/priompt';
import {
  PromptElement,
  PromptProps,
  SystemMessage,
  UserMessage,
} from '@anysphere/priompt';
import {
  Block,
  priomptRenderToString,
} from '@reasonote/lib-ai';

// Simple greeting prompt component
export function FormalGreeting(props: PromptProps<{ name: string }>): PromptElement {
  return (
    <SystemMessage>
      {`Greetings to the most honorable ${props.name}! I bow before thee with the utmost respect
      and reverence. May your days be filled with glory and triumph, noble one.`}
    </SystemMessage>
  );
}

// Casual response prompt component
export function CasualResponse(): PromptElement {
  return (
    <SystemMessage>
      {`So anyway, yeah, what's up? Just gonna keep this super chill and casual from now on.
      Think like a cool teenager texting their BFF. Use slang, abbreviations, maybe some emojis,
      and keep it totally relaxed. No need for proper grammar or anything fancy.`}
    </SystemMessage>
  );
}
// Background context prompt component
export function BackgroundContext(): PromptElement {
  return (
    <>  
      {`You are an AI assistant with a flair for the dramatic. You love to switch between
      different communication styles to keep conversations interesting and engaging.`}
    </>
  );
}

export type ExamplePromptProps = PromptProps<{
  name: string;
  message: string;
}>;

export function NestedPrompt(props: PromptProps<{}>): PromptElement {
  return <>
    {`<nested>`}
    {props.children}
    {`</nested>`}
  </>
}

export function ExamplePrompt(
  props: ExamplePromptProps,
): PromptElement {
  return (
    <>
      {/* Including formal greeting with the user's name */}
      <FormalGreeting name={props.name} />
      
      {/* Adding casual response style guidance */}
      <CasualResponse />
      
      {/* Main instruction combining the styles */}
      <SystemMessage>
        {`The user's name is ${props.name}. Please always greet them in an
        extremely formal, medieval style, with lots of fanfare. Then seamlessly
        proceed to reply to their message in the most casual, 2010s, cool dude
        texting style. Please be over-the-top in both respects, and make the
        transition seem like it never happened.`}
      </SystemMessage>
      <SystemMessage>
        {/* <Block name="div">
            <NestedPrompt>
            {`Hello!!!!`}
            </NestedPrompt>
        </Block> */}
      </SystemMessage>
      <UserMessage>{props.message}</UserMessage>
      <empty tokens={1000} />
    </>
  );
}

export function SimplePrompt(
  props: PromptProps<
    {
      language: string;
      text: string;
    },
    boolean
  >
): PromptElement {
  return (
    <>
      <SystemMessage>
        {`Please determine if the following text is in ${props.language}. If it is,
        please reply with "yes". If it is not, please reply with "no". Do not
        output anything else.`}
      </SystemMessage>
      <UserMessage>{props.text}</UserMessage>
      <empty tokens={1000} />
      <capture
        onOutput={async (output: any) => {
          if (output.content?.toLowerCase().includes("yes") === true) {
            return await props.onReturn(true);
          } else if (output.content?.toLowerCase().includes("no") === true) {
            return await props.onReturn(false);
          }
          // bad
          throw new Error(`Invalid output: ${output.content}`);
        }}
      />
    </>
  );
}

// More complex nested prompt that uses the SimplePrompt to check languages
export function LanguageDetectionAssistant(
  props: PromptProps<{
    text: string;
    possibleLanguages: string[];
  }, string>
): PromptElement {
  return (
    <>
      <SystemMessage>
        {`I am a language detection assistant. I can detect which language a piece of text is written in.`}
      </SystemMessage>
      
      {/* Checking each possible language using nested SimplePrompt components */}
      {props.possibleLanguages.map((language, index) => (
        <scope name={`Check if text is ${language}`}>
          <SimplePrompt
            language={language}
            text={props.text}
            onReturn={async (isTargetLanguage: boolean) => {
              if (isTargetLanguage) {
                await props.onReturn(language);
              }
              // If not this language, continue checking others
            }}
          />
        </scope>
      ))}
      
      {/* Fallback if no language was detected */}
      <SystemMessage>
        {`If none of the language checks returned true, please respond with "unknown".`}
      </SystemMessage>
      <capture
        onOutput={async () => {
          await props.onReturn("unknown");
        }}
      />
    </>
  );
}

export function ArvidStory(
  props: PromptProps<undefined, AsyncIterable<string>>
): PromptElement {
  return (
    <>
      <SystemMessage>
        {`Please write a short story about a young boy named Arvid. Only a
        paragraph please.`}
      </SystemMessage>
      <empty tokens={1000} />
      <capture
        onStream={async (stream: any) => {
          // we want to replace every R with a J
          await props.onReturn(
            (async function* () {
              for await (const chunk of stream) {
                if (chunk.content === undefined) {
                  continue;
                }
                yield chunk.content.replace(/r/g, "j");
              }
            })()
          );
        }}
      />
    </>
  );
}

export async function renderExamplePrompt(props: ExamplePromptProps): Promise<string> {
  return await priomptRenderToString(
    <NestedPrompt>
      <BackgroundContext />
      <br/>
      <Block name="NAME">
        {`NAME: ${props.name}`}
      </Block>
      <br/>
      <Block name="MESSAGE">
        {`MESSAGE: ${props.message}`}
      </Block>
    </NestedPrompt>
  )
}