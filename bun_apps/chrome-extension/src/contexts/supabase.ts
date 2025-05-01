// Require doesn't handle types, so we need to use import for that
import {
  createClient,
  createClient as createClientType,
} from '@supabase/supabase-js';

import { getConfig } from '../config';

const config = getConfig();
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey) as ReturnType<typeof createClientType<any>>;
