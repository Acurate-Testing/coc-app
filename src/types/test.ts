/**
 * Test type interface
 */
export interface Test {
  /** Unique identifier */
  id: string;
  /** Test name */
  name: string;
  /** Test description */
  description: string | null;
  /** Created by user ID */
  created_by: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Deletion timestamp */
  deleted_at: string | null;
  /** Test code */
  test_code: string | null;
  /** Matrix type */
  matrix_type: string[] | null;
  /** Matrix types */
  matrix_types: string[];
} 