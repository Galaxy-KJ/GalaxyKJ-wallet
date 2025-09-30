import { NextResponse } from 'next/server';
import { 
  ErrorResponse, 
  HttpStatusCode, 
  ApiErrorType, 
  ERROR_MESSAGES 
} from '@/types/api-responses';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedValues?: string[];
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ApiValidationError extends Error {
  constructor(
    public field: string,
    public rule: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiValidationError';
  }
}

export function validateParameters(
  params: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = params[field];

    // Required field validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${ERROR_MESSAGES.MISSING_PARAMETER}: ${field}`);
      continue;
    }

    // Skip further validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${ERROR_MESSAGES.INVALID_PARAMETER}: ${field} must be of type ${rules.type}`);
      continue;
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${ERROR_MESSAGES.INVALID_PARAMETER}: ${field} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${ERROR_MESSAGES.INVALID_PARAMETER}: ${field} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${ERROR_MESSAGES.INVALID_PARAMETER}: ${field} format is invalid`);
      }
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(`${ERROR_MESSAGES.INVALID_PARAMETER}: ${field} must be one of: ${rules.allowedValues.join(', ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createErrorResponse(
  type: ApiErrorType,
  message: string,
  status: HttpStatusCode,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: type,
    code: type,
    message,
    status,
    details,
    timestamp: Date.now()
  };

  return NextResponse.json(errorResponse, { status });
}

export function createValidationErrorResponse(
  errors: string[]
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'VALIDATION_ERROR',
    errors.join('; '),
    HttpStatusCode.BAD_REQUEST,
    { validationErrors: errors }
  );
}

export function createExternalApiErrorResponse(
  provider: string,
  status?: number
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'EXTERNAL_API_ERROR',
    `${ERROR_MESSAGES.EXTERNAL_API_FAILED}: ${provider}`,
    HttpStatusCode.BAD_GATEWAY,
    { provider, externalStatus: status }
  );
}

export function createTimeoutErrorResponse(
  provider: string
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'TIMEOUT_ERROR',
    `${ERROR_MESSAGES.TIMEOUT_ERROR}: ${provider}`,
    HttpStatusCode.GATEWAY_TIMEOUT,
    { provider }
  );
}

export function createNetworkErrorResponse(
  provider: string,
  error?: Error
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'NETWORK_ERROR',
    `${ERROR_MESSAGES.NETWORK_ERROR}: ${provider}`,
    HttpStatusCode.BAD_GATEWAY,
    { provider, error: error?.message }
  );
}

export async function handleApiRequest<T>(
  apiCall: () => Promise<T>,
  provider: string,
  timeout = 10000
): Promise<{ data?: T; error?: NextResponse<ErrorResponse> }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const data = await Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);

    clearTimeout(timeoutId);
    return { data };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Timeout' || error.name === 'AbortError') {
        return { error: createTimeoutErrorResponse(provider) };
      }
      if (error.message.includes('fetch')) {
        return { error: createNetworkErrorResponse(provider, error) };
      }
    }
    return { error: createExternalApiErrorResponse(provider) };
  }
}

// CORS headers for all crypto API responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 's-maxage=60, stale-while-revalidate'
} as const;