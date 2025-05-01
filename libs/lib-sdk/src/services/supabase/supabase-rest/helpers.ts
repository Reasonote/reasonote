import { Database } from './codegen';

export type DBReturnType<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]['Returns'];

