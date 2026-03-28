import { ValueTransformer } from 'typeorm';

export const dateTransformer: ValueTransformer = {
  /** DB → JS: pg returns 'date' columns as strings; pass through as-is */
  from(value: string | null): string | null {
    return value ?? null;
  },

  /** JS → DB: accept Date objects or strings, normalize to YYYY-MM-DD */
  to(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return (value as string).split('T')[0];
  },
};
