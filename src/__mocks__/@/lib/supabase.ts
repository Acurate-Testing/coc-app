import { Database } from "@/types/supabase";

// Create a proper Jest mock function with chaining support
const createMockFunction = () => {
  const mockFn = jest.fn();
  mockFn.mockReturnThis = () => mockFn;
  mockFn.mockResolvedValueOnce = (value) => {
    mockFn.mockImplementationOnce(() => Promise.resolve(value));
    return mockFn;
  };
  mockFn.mockReturnValueOnce = (value) => {
    mockFn.mockImplementationOnce(() => value);
    return mockFn;
  };
  return mockFn;
};

// Create a mock query builder with proper typing
const createMockQueryBuilder = () => {
  const fn = createMockFunction();
  const methods = {
    select: createMockFunction(),
    insert: createMockFunction(),
    update: createMockFunction(),
    delete: createMockFunction(),
    eq: createMockFunction(),
    single: createMockFunction(),
    order: createMockFunction(),
    range: createMockFunction(),
  };

  // Type assertion to allow string indexing
  const typedFn = fn as any;
  Object.entries(methods).forEach(([key, method]) => {
    typedFn[key] = method;
    method.mockReturnThis();
  });

  return typedFn;
};

// Create mock functions for each auth method
const mockSignInWithPassword = createMockFunction();
const mockSignOut = createMockFunction();
const mockGetUser = createMockFunction();
const mockResetPasswordForEmail = createMockFunction();
const mockUpdateUser = createMockFunction();
const mockSignUp = createMockFunction();

// Set default implementations
mockSignInWithPassword.mockImplementation(() => ({
  data: {
    user: null,
    session: null,
  },
  error: null,
}));

mockSignOut.mockImplementation(() => ({
  error: null,
}));

mockGetUser.mockImplementation(() => ({
  data: { user: null },
  error: null,
}));

mockResetPasswordForEmail.mockImplementation(() => ({
  error: null,
}));

mockUpdateUser.mockImplementation(() => ({
  data: { user: null },
  error: null,
}));

mockSignUp.mockImplementation(() => ({
  data: { user: null, session: null },
  error: null,
}));

const mockAuth = {
  signInWithPassword: mockSignInWithPassword,
  signOut: mockSignOut,
  getUser: mockGetUser,
  resetPasswordForEmail: mockResetPasswordForEmail,
  updateUser: mockUpdateUser,
  signUp: mockSignUp,
};

const mockFrom = jest.fn(() => createMockQueryBuilder());

// Export the mock Supabase client
export const supabase = {
  auth: mockAuth,
  from: mockFrom,
} as any; // Type assertion needed because we're mocking a complex type

// Export the mock service client
export const getServiceSupabase = createMockFunction();
