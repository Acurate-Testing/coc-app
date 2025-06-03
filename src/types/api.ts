import { Sample } from "./sample";
import { User } from "./user";
import { Test } from "./test";

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  /** Response data */
  data?: T;
  /** Error message if any */
  error?: string;
  /** Total count for paginated responses */
  total?: number;
  /** Total pages for paginated responses */
  totalPages?: number;
  /** Current page for paginated responses */
  page?: number;
}

/**
 * Paginated API response interface
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  /** Array of items */
  items: T[];
  /** Total count */
  total: number;
  /** Total pages */
  totalPages: number;
  /** Current page */
  page: number;
}

/**
 * Sample API response types
 */
export interface SamplesResponse extends PaginatedResponse<Sample> {
  items: Sample[];
}

/**
 * User API response types
 */
export interface UsersResponse extends PaginatedResponse<User> {
  items: User[];
}

/**
 * Test API response types
 */
export interface TestsResponse extends PaginatedResponse<Test> {
  items: Test[];
}

/**
 * Error response type
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
} 