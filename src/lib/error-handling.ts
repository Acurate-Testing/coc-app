import { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleDatabaseError = (error: PostgrestError): AppError => {
  console.error('Database error:', error);

  // Handle common database errors
  if (error.code === '23505') { // Unique violation
    const field = error.message.match(/Key \(([^)]+)\)/)?.[1];
    return new AppError(
      `A record with this ${field} already exists`,
      409,
      'DUPLICATE_ENTRY'
    );
  }

  if (error.code === '23503') { // Foreign key violation
    return new AppError(
      'Referenced record does not exist',
      400,
      'FOREIGN_KEY_VIOLATION'
    );
  }

  if (error.code === '22P02') { // Invalid input syntax
    return new AppError(
      'Invalid input data',
      400,
      'INVALID_INPUT'
    );
  }

  // Default error
  return new AppError(
    'An unexpected error occurred',
    500,
    'INTERNAL_ERROR'
  );
};

export const handleAuthError = (error: any): AppError => {
  console.error('Auth error:', error);

  if (error.message?.includes('Invalid login credentials')) {
    return new AppError(
      'Invalid email or password',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  if (error.message?.includes('Email not confirmed')) {
    return new AppError(
      'Please confirm your email address',
      401,
      'EMAIL_NOT_CONFIRMED'
    );
  }

  if (error.message?.includes('User already registered')) {
    return new AppError(
      'An account with this email already exists',
      409,
      'USER_EXISTS'
    );
  }

  // Default error
  return new AppError(
    'Authentication failed',
    401,
    'AUTH_ERROR'
  );
};

export const handleApiError = (error: unknown): AppError => {
  console.error('API error:', error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  return new AppError(
    'An unexpected error occurred',
    500,
    'INTERNAL_ERROR'
  );
}; 