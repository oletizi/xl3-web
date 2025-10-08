import { supabase } from '@/lib/supabase';

/**
 * HTTP request options
 */
export interface RequestOptions extends RequestInit {
  /**
   * Request timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Whether to automatically inject authentication token
   * @default true
   */
  includeAuth?: boolean;
}

/**
 * API Client for making authenticated HTTP requests to Netlify Functions
 *
 * IMPORTANT: This client is specifically for custom Netlify Functions, NOT for Supabase.
 *
 * Architecture Overview:
 * - Authentication is 100% Supabase-direct (client-side auth)
 * - This client is ONLY for Netlify Functions that need:
 *   - API secrets (e.g., third-party API keys)
 *   - Server-side processing (heavy computation, file processing)
 *   - Webhooks and external integrations
 *   - Custom business logic that can't run client-side
 *
 * Deployment Configuration:
 * - Production: Functions deployed at `/.netlify/functions/*`
 * - Local Dev: Use `netlify dev` and set VITE_API_BASE_URL if needed
 * - Override: Set VITE_API_BASE_URL environment variable
 *
 * Features:
 * - Automatic Supabase access token injection
 * - Token refresh on 401 responses
 * - Configurable request timeouts
 * - Full TypeScript type safety
 *
 * @example
 * ```typescript
 * // Call a Netlify Function at /.netlify/functions/process-audio
 * const result = await apiClient.post('/process-audio', {
 *   fileUrl: 'https://...',
 *   options: { format: 'wav' }
 * });
 * ```
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions',
    defaultTimeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Get current access token from Supabase session
   */
  private async getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  /**
   * Refresh the current session and return new access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }

    return session?.access_token ?? null;
  }

  /**
   * Make an HTTP request with automatic auth token injection and retry on 401
   */
  private async fetchWithAuth(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const {
      timeout = this.defaultTimeout,
      includeAuth = true,
      headers = {},
      ...fetchOptions
    } = options;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Inject auth token if requested
      const requestHeaders = new Headers(headers);

      if (includeAuth) {
        const token = await this.getAccessToken();
        if (token) {
          requestHeaders.set('Authorization', `Bearer ${token}`);
        }
      }

      // Make initial request
      const fullUrl = this.baseUrl + url;
      let response = await fetch(fullUrl, {
        ...fetchOptions,
        headers: requestHeaders,
        signal: controller.signal,
      });

      // Handle 401 - attempt token refresh and retry once
      if (response.status === 401 && includeAuth) {
        try {
          const newToken = await this.refreshAccessToken();

          if (newToken) {
            // Retry request with new token
            requestHeaders.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(fullUrl, {
              ...fetchOptions,
              headers: requestHeaders,
              signal: controller.signal,
            });
          }
        } catch (refreshError) {
          // If refresh fails, return original 401 response
          console.error('Token refresh failed during 401 retry:', refreshError);
          return response;
        }
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms: ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Perform GET request
   */
  async get<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      ...options,
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `GET request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Perform POST request
   */
  async post<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `POST request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Perform PUT request
   */
  async put<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `PUT request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Perform PATCH request
   */
  async patch<T = unknown>(
    url: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `PATCH request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Perform DELETE request
   */
  async delete<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.fetchWithAuth(url, {
      ...options,
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(
        `DELETE request failed: ${response.status} ${response.statusText}`
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}

/**
 * Singleton API client instance for Netlify Functions
 *
 * Use this for making authenticated requests to custom Netlify Functions.
 * Do NOT use this for Supabase operations - use the Supabase client directly.
 *
 * Configuration:
 * - Default: `/.netlify/functions` (production)
 * - Override: Set VITE_API_BASE_URL environment variable
 * - Local Dev: Use `netlify dev` to run functions locally
 *
 * @example
 * ```typescript
 * // Call a Netlify Function
 * const data = await apiClient.get('/my-function');
 *
 * // Post with auth token automatically injected
 * await apiClient.post('/webhook-handler', { event: 'user.created' });
 * ```
 */
export const apiClient = new ApiClient();
