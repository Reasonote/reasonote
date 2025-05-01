"use client";
import {
  useEffect,
  useState,
} from "react";

import {useMutation} from "@apollo/client";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Typography,
} from "@mui/material";
import {DEFAULT_PERSONA_LIST} from "@reasonote/lib-datasets";
import {
  createBotFlatMutDoc,
  getBotFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

const Component = () => {
  const [createPersonas] = useMutation(createBotFlatMutDoc);

  function addPersonas() {
    createPersonas({
      variables: {
        objects: DEFAULT_PERSONA_LIST.map((persona) => ({
          ...persona,
          id: null,
        })),
      },
    });
  }

  return (
    <>
      <Button onClick={() => addPersonas()}>Add Personas</Button>
      <Accordion>
        <AccordionSummary>
          <Typography>Personas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ApolloClientInfiniteScroll
            wrapperElId="notification-infinite-scroll-component-id"
            overrideWrapperElProps={{
              className: "overflow-scroll scroll firefox-scroll",
              style: {
                maxHeight: "80vh",
              },
            }}
            overrideInfiniteScrollProps={{
              loader: <div>hi</div>,
              style: {
                display: "flex",
                flexDirection: "column",
              },
            }}
            queryOpts={{
              query: getBotFlatQueryDoc,
              variables: {},
            }}
            fetchMoreOptions={(qResult) => {
              return {
                variables: {
                  after:
                    qResult.data?.botCollection?.pageInfo.endCursor ||
                    undefined,
                },
              };
            }}
            getChildren={(latestQueryResult) => {
              const personas = latestQueryResult.data?.botCollection?.edges.map(
                (edge) => edge.node
              );

              return personas
                ? personas.map((p) => <div key={p.id}>{p.name}</div>)
                : null;
            }}
            hasMore={(latestQueryResult) => {
              const ret =
                latestQueryResult.loading ||
                latestQueryResult.data?.botCollection?.pageInfo.hasNextPage;
              return !!ret;
            }}
          />
        </AccordionDetails>
      </Accordion>
    </>
  );
};

//////////////////////////////////////////////
// The actual exported page.
export default function Web() {
  // This is my way of doing NoSSR.
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return <>{domLoaded && <Component />}</>;
}
