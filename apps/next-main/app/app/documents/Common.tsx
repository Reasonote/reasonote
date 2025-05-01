// Document is a hypothetical type representing your document object.
export type Document = {
  docId: string;
  title: string;
  body: string;
  dateCreated: string;
  dateModified: string;
};

export type Column = {
  id: "name" | "createdDate" | "updatedDate";
  label: string;
};

export const columns: Column[] = [
  { id: "name", label: "Title" },
  { id: "createdDate", label: "Date Created" },
  { id: "updatedDate", label: "Date Modified" },
];
