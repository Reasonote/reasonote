"use client";
import React from "react";

import {useRouter} from "next/navigation";

import {
  gql,
  useMutation,
} from "@apollo/client";

const CREATE_JOURNAL_ENTRY = gql`
  mutation CreateJournalEntry($input: RsnPageInsertInput!) {
    insertIntoRsnPageCollection(objects: [$input]) {
      affectedCount
      records {
        id
      }
    }
  }
`;

export default function NewJournalPage() {
  const router = useRouter();
  const [createJournalEntry] = useMutation(CREATE_JOURNAL_ENTRY);

  const handleCreate = async () => {
    const { data } = await createJournalEntry({
      variables: {
        input: {
          name: "New Journal Entry",
          body: "",
        },
      },
    });

    if (data?.insertIntoRsnPageCollection?.records[0]?.id) {
      router.push(`/app/journal/${data.insertIntoRsnPageCollection.records[0].id}`);
    }
  };

  React.useEffect(() => {
    handleCreate();
  }, []);

  return <div>Creating new journal entry...</div>;
}