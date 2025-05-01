export interface JsonSchemaNodeProps<T = any>{
    currentSchema: T;
    updateSchema: (newSchema: T) => any;
    updateOwnName: (newName: string) => any;
    deleteSelf: () => any;
    level?: number;
    title?: string;
} 