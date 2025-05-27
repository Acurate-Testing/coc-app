// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Request
global.Request = class Request {
  constructor(url, init) {
    this._url = url
    this._method = init?.method || 'GET'
    this._headers = new Headers(init?.headers)
    this._body = init?.body
  }

  get url() {
    return this._url
  }

  get method() {
    return this._method
  }

  get headers() {
    return this._headers
  }

  async json() {
    return this._body ? JSON.parse(this._body) : {}
  }
}

// Polyfill for Response
global.Response = class Response {
  constructor(body, init) {
    this._body = body
    this._status = init?.status || 200
    this._statusText = init?.statusText || ''
    this._headers = new Headers(init?.headers)
  }

  get status() {
    return this._status
  }

  get statusText() {
    return this._statusText
  }

  get headers() {
    return this._headers
  }

  async json() {
    return this._body ? JSON.parse(this._body) : {}
  }

  static json(body, init) {
    const response = new Response(JSON.stringify(body), init)
    response.headers.set('content-type', 'application/json')
    return response
  }
}

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  class Headers {
    constructor(init) {
      this._headers = new Map(Object.entries(init || {}))
    }
    get(key) {
      return this._headers.get(key)
    }
    set(key, value) {
      this._headers.set(key, value)
    }
  }

  class NextRequest {
    constructor(input, init = {}) {
      this._url = input
      this._method = init.method || 'GET'
      this._headers = new Headers(init.headers)
      this._body = init.body
    }

    get url() {
      return this._url
    }

    get method() {
      return this._method
    }

    get headers() {
      return this._headers
    }

    async json() {
      return this._body ? JSON.parse(this._body) : {}
    }
  }

  class NextResponse extends Response {
    constructor(body, init = {}) {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
      super(bodyString, init)
      this._body = body
      this._status = init.status || 200
      this._headers = new Headers(init.headers)
    }

    get status() {
      return this._status
    }

    get statusText() {
      return this._statusText
    }

    get headers() {
      return this._headers
    }

    async json() {
      return this._body
    }

    static json(body, init) {
      return new NextResponse(body, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      })
    }
  }

  return {
    NextRequest,
    NextResponse,
  }
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers() {
    return new Headers()
  },
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.SMTP_EMAIL = 'test@example.com'
process.env.SMTP_PASSWORD = 'test-smtp-password'
process.env.ENCRYPTION_KEY = 'test-encryption-key'

// Mock Supabase
jest.mock('@/lib/supabase') 