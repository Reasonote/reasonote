import React from "react";

import {merge} from "lodash";
import {OnChangeHandlerFunc} from "react-mentions";

import {useAsyncEffect} from "@reasonote/lib-utils-frontend";

import {useSupabase} from "../../../../components/supabase/SupabaseProvider";
import { Theme, useTheme } from "@mui/material";

const defaultStyle = (theme: Theme) => (  {
  color: theme.palette.text.primary,
  control: {
    backgroundColor: "transparent",
    color: theme.palette.text.primary,
    fontSize: 14,
    fontWeight: "normal",
  },

  "&multiLine": {
    color: theme.palette.text.primary,
    control: {
      fontFamily: "monospace",
      minHeight: 63,
    },
    highlighter: {
      padding: 9,
      border: "1px solid transparent",
    },
    input: {
      color: theme.palette.text.primary,
      padding: 9,
      border: `1px solid ${theme.palette.text.primary}`,
      borderRadius: 4,
    },
  },

  "&singleLine": {
    color: theme.palette.text.primary,
    display: "inline-block",
    width: 180,

    highlighter: {
      padding: 1,
      backgroundColor: theme.palette.success.main,
      border: `2px inset transparent`,
    },
    input: {
      padding: 1,
      border: "2px inset",
    },
  },

  suggestions: {
    list: {
      backgroundColor: theme.palette.text.primary,
      color: theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      fontSize: 14,
    },
    item: {
      color: theme.palette.success.main,
      padding: "5px 15px",
      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      "&focused": {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
});

interface EditorTextField2Props {
  // mentionables: {
  //     pages: {
  //         id: string,
  //         display: string,
  //     }[]
  // },
  sx?: any;
  value: string;
  onChange?: OnChangeHandlerFunc | undefined;
  onKeyUp?: (ev: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function EditorTextField2(props: EditorTextField2Props) {
  const theme = useTheme();
  const curref = React.useRef(null);
  const { supabase } = useSupabase();
  const [suggestions, setSuggestions] = React.useState<
    { id: string; display: string }[]
  >([]);

  // TODO:INEFFICIENT
  useAsyncEffect(async () => {
    // First, fetch the ids of all the pages that we can see.
    const res = await supabase.from("rsn_page").select("id, _name");

    if (res.data) {
      setSuggestions(
        res.data
          .map((page) => {
            console.log(page);
            return {
              id: page.id,
              display: page._name ?? "",
            };
          })
          .filter((p) => p.display.trim().length > 0)
      );
    } else {
      console.error("Could not fetch pages for mentionables");
    }
  }, []);

  let scrollableStyle = merge({}, defaultStyle(theme), {
    input: {
      overflow: "auto",
      //height: 70,
    },
  });

  return (
    <div
      style={{
        ...props.sx,
      }}
    >
      <div
        id="suggestionPortal"
        style={{
          height: "1px",
          width: "1px",
        }}
        ref={curref}
      ></div>
      <div
        style={{
          //   position: 'absolute',
          //   height: '100px',
          //   width: '100px',
          overflow: "auto",
          //   border: '1px solid green',
          //    padding: '8px',
        }}
      >
        {/* <MentionsInput
          value={props.value}
          onChange={props.onChange}
          onKeyUp={props.onKeyUp}
          style={scrollableStyle}
          suggestionsPortalHost={curref.current ?? undefined}
          allowSuggestionsAboveCursor={true}
        >
          <Mention
            trigger="@"
            data={suggestions}
            renderSuggestion={(
              suggestion,
              search,
              highlightedDisplay,
              index,
              focused
            ) => {
              return (
                <div className={`mention ${focused ? "focused" : ""}`}>
                  {highlightedDisplay}
                </div>
              );
            }}
          />
          
        </MentionsInput> */}
      </div>
    </div>
  );
}
