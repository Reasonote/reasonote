"use client";
import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import _ from "lodash";
import {useRouter} from "next/navigation";

import {
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  Add,
  ArrowDropDown,
  ArrowRight,
  Delete,
} from "@mui/icons-material";
import {
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import {
  createRsnPageFlatMutDoc,
  deleteRsnPageFlatMutDoc,
  getRsnPageAndDirectChildrenFlatQueryDoc,
  OrderByDirection,
} from "@reasonote/lib-sdk-apollo-client";
import {
  ApolloClientInfiniteScroll,
} from "@reasonote/lib-sdk-apollo-client-react";

import {useRsnUser} from "../../../clientOnly/hooks/useRsnUser";
import {
  Column,
  columns,
} from "./Common";

export interface DocumentListParams {
  selectedDocId: string | null;
  setSelectedDocId: (docId: string | null) => void;
}

function TheRow(props: {
  doc: any;
  selectedDocId: string | null;
  expandedDocIds: string[];
  setSelectedDocId: (docId: string) => any;
  onDeleteDocument: (docId: string) => any;
  onReview: (docId: string) => any;
  setDocExpanded: (docId: string, expand: boolean) => any;
  onAddChild: (docId: string) => any;
  depth: number;
}) {
  const { rsnUserId } = useRsnUser();
  const {
    doc,
    selectedDocId,
    expandedDocIds,
    setSelectedDocId,
    onDeleteDocument,
    setDocExpanded,
    onAddChild,
    onReview,
  } = props;

  const theme = useTheme();

  const thisIsExpanded = expandedDocIds.includes(doc.id);

  const shouldLoadChildren = !doc.rsnPageCollection && thisIsExpanded;

  const rootQueryOpts = {
    query: getRsnPageAndDirectChildrenFlatQueryDoc,
    variables: {
      filter: {
        createdBy: { eq: shouldLoadChildren ? rsnUserId : "FAKE" },
        parent: { eq: doc.id },
      },
      first: 50,
    },
  };

  const extraChildResults = useQuery(rootQueryOpts.query, {
    variables: rootQueryOpts.variables,
  });

  const theChildren = doc.rsnPageCollection
    ? doc.rsnPageCollection.edges.map((e: any) => e.node)
    : extraChildResults.data?.rsnPageCollection?.edges.map((e: any) => e.node);

  const childItems = theChildren?.map((child: any) => (
    <TheRow
      doc={child}
      selectedDocId={selectedDocId}
      expandedDocIds={expandedDocIds}
      setSelectedDocId={setSelectedDocId}
      onDeleteDocument={onDeleteDocument}
      setDocExpanded={setDocExpanded}
      onAddChild={onAddChild}
      onReview={onReview}
      depth={props.depth + 1}
    />
  ));

  return (
    <>
      <TableRow
        key={doc.id}
        onClick={() => setSelectedDocId(doc.id)}
        style={{
          cursor: "pointer",
          backgroundColor:
            selectedDocId === doc.id ? theme.palette.background.paper : "inherit",
        }}
      >
        <TableCell>
          <Stack direction="row" spacing={2}>
            {/* <div
              style={{ whiteSpace: "pre" }}
              onClick={() => setDocExpanded(doc.id, !thisIsExpanded)}
            >
              {_.repeat("\t", props.depth)}{" "}
              {thisIsExpanded ? <ArrowDropDown /> : <ArrowRight />}
            </div> */}
            <div>{doc.name}</div>
          </Stack>
        </TableCell>
        <TableCell>{new Date(doc.createdDate).toLocaleDateString()}</TableCell>
        <TableCell>{new Date(doc.updatedDate).toLocaleDateString()}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={2}>
            {/* <IconButton onClick={() => onReview(doc.id)}>
              <Grading fontSize="small" />
            </IconButton> */}
            <IconButton onClick={() => onDeleteDocument(doc.id)}>
              <Delete fontSize="small" />
            </IconButton>
            {/* <IconButton onClick={() => onAddChild(doc.id)}>
              <Add />
            </IconButton> */}
          </Stack>
        </TableCell>
      </TableRow>
      {/* {
                thisIsExpanded && <TableRow key={'add-child-row'} onClick={() => onAddChild(doc.id)} style={{cursor: 'pointer'}}>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                        <Stack direction="row" spacing={2}>
                            <div style={{display: 'flex', alignItems: 'center', width: 'max-content'}}><Add /> Add Child</div>
                        </Stack>
                    </TableCell>
                </TableRow>
            */}
      {thisIsExpanded && childItems}
    </>
  );
}

// Add this type for sort directions
type SortDirection = "asc" | "desc";

export function DocumentList(params: DocumentListParams) {
  // TODO get all bots from the server
  const { rsnUserId } = useRsnUser();
  const router = useRouter();

  const [createRsnPage] = useMutation(createRsnPageFlatMutDoc);
  const [deleteRsnPage] = useMutation(deleteRsnPageFlatMutDoc);


  const { selectedDocId, setSelectedDocId } = params;

  const [expandedDocIds, setExpandedDocIds] = useState<string[]>([]);
  const [currentSortColumn, setCurrentSortColumn] =
    useState<Column["id"]>("name");
  const [currentSortDirection, setCurrentSortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [updateCount, setUpdateCount] = useState<number>(0);

  const rootQueryOpts = useMemo(() => {
    return {
      query: getRsnPageAndDirectChildrenFlatQueryDoc,
      variables: {
        filter: {
          createdBy: { eq: rsnUserId },
          // Only want root-level documents
          parent: { is: "NULL" },
        },
        orderBy: [{
          [currentSortColumn]: currentSortDirection === "asc" ? OrderByDirection.AscNullsLast : OrderByDirection.DescNullsLast
        }],
        first: 10,
      }
    }
  }, [currentSortColumn, currentSortDirection]);

  const onSort = (column: Column) => {
    // If clicking the same column, toggle direction
    if (currentSortColumn === column.id) {
      setCurrentSortDirection(currentSortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new column, set it as the sort column with ascending direction
      setCurrentSortColumn(column.id);
      setCurrentSortDirection("asc");
    }
    
    // Force a refresh of the data
    setUpdateCount(prev => prev + 1);
  };



  const onNewDocument = async () => {
    await createRsnPage({
      variables: {
        objects: [
          {
            name: "New Document",
            body: "",
          },
        ],
      },
    });

    setUpdateCount(updateCount + 1);
  };

  const onDeleteDocument = async (docId: string) => {
    deleteRsnPage({
      variables: {
        filter: {
          id: { eq: docId },
        },
        atMost: 1,
      },
    });

    setUpdateCount(updateCount + 1);
  };

  const onReview = useCallback(async (docId: string) => {
    console.log("onReview", docId)
    // //@ts-ignore
    // window.href = `/app/skillsets/create/fromdocument/${docId}`
    // router.push(`/app/skillsets/create/fromdocument/${docId}`)
    console.log('what')
  }, [router])

  const onAddChild = async (pageId: string | null) => {
    await createRsnPage({
      variables: {
        objects: [
          {
            name: "New Document",
            body: "",
            parent: pageId,
          },
        ],
      },
    });
    setUpdateCount(updateCount + 1);
  };

  return (
    <Paper>
      <Toolbar>
        <Typography variant="body1" component="div">
          Documents
        </Typography>
      </Toolbar>
      <TableContainer>
        {/* {sortedDocuments.map(doc => (
                    
                    ))} */}
        <ApolloClientInfiniteScroll
          wrapperElId={"doc-list-container"}
          inverse={false}
          overrideWrapperElProps={{
            style: {
              display: "flex",
              flexDirection: "column",
              overflowY: "scroll",
              flexGrow: 1,
              height: "100%",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            },
          }}
          overrideInfiniteScrollProps={{
            loader: <div>Loading</div>,
            style: {
              overflow: "visible",
              display: "flex",
              flexDirection: "column",
            },
            className: "gap-y-4",
          }}
          // TODO not sure why this is happening.
          //@ts-ignore
          queryOpts={rootQueryOpts}
          updateCount={updateCount}
          fetchMoreOptions={(qResult) => {
            const after = qResult.data?.rsnPageCollection?.pageInfo.endCursor;

            const ret = {
              variables: {
                after,
              },
            };

            return ret;
          }}
          getChildren={(latestQueryResult) => {
            const docIds = latestQueryResult.data?.rsnPageCollection?.edges.map(
              (e) => e.node.id
            );

            const flatDocs =
              latestQueryResult.data?.rsnPageCollection?.edges.map(
                (e) => e.node
              );

            const ret = flatDocs ? (
              <Table>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        onClick={() => onSort(column)}
                        style={{ cursor: "pointer" }}
                      >
                        {column.label}
                        {currentSortColumn === column.id &&
                          (currentSortDirection === "asc" ? "▼" : "▲")}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div style={{ justifyItems: "end" }}>
                        {/* <IconButton onClick={() => onAddChild(null)}>
                          <Add />
                        </IconButton> */}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flatDocs
                    // Filter out spaceAssetIds which are currently converting,
                    // As they are shown at the top of the list.
                    .map((doc) => {
                      const thisIsExpanded = expandedDocIds.includes(doc.id);
                      const theChildren = doc.rsnPageCollection?.edges.map(
                        (e) => e.node
                      );

                      return (
                        <TheRow
                          doc={doc}
                          selectedDocId={selectedDocId}
                          expandedDocIds={expandedDocIds}
                          setSelectedDocId={setSelectedDocId}
                          onDeleteDocument={onDeleteDocument}
                          onReview={onReview}
                          setDocExpanded={(docId: string, expand: boolean) => {
                            if (expand) {
                              setExpandedDocIds([...expandedDocIds, docId]);
                            } else {
                              setExpandedDocIds(
                                expandedDocIds.filter((id) => id !== docId)
                              );
                            }
                          }}
                          onAddChild={onAddChild}
                          depth={0}
                        />
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div>Loading</div>
            );

            return ret;
          }}
          hasMore={(latestQueryResult) => {
            const ret =
              latestQueryResult.loading ||
              latestQueryResult.data?.rsnPageCollection?.pageInfo.hasNextPage;

            return !!ret;
          }}
        />
      </TableContainer>
    </Paper>
  );
}
