/**
 * Loose Supabase client — bypasses generated types.
 * Use ONLY for tables/RPCs that aren't yet reflected in the generated schema.
 */
import { supabase } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseLoose = supabase as unknown as any;
