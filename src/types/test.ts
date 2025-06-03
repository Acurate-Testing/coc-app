/**
 * Test type interface
 */
export interface Test {
  /** Unique identifier */
  id: string;
  /** Test name */
  name: string;
  /** Test code */
  code: string;
  /** Test description */
  description?: string;
  /** Test matrix type */
  matrix_type?: string;
  /** Test status */
  status?: "active" | "inactive";
  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string;
  /** Deletion timestamp */
  deleted_at?: string | null;
} 