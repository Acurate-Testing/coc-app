export interface User {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  created_at?: string;
  active?: boolean;
  deleted_at?: string; // Added for deleted user detection
}
