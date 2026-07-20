/** Shared shapes used across every module's api and store layers. */

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ListParams {
  readonly search?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface SelectOption<T extends string = string> {
  readonly label: string;
  readonly value: T;
}
