import { NextRequest, NextResponse } from 'next/server';
import { CryptoCompareResponse, HttpStatusCode } from '@/types/api-responses';
import {
  validateParameters,
  createValidationErrorResponse,
  createExternalApiErrorResponse,
  handleApiRequest,
  CORS_HEADERS
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fsyms = searchParams.get('fsyms');
    const tsyms = searchParams.get('tsyms') || 'USD';

    // Validate parameters
    const validation = validateParameters(
      { fsyms, tsyms },
      {
        fsyms: {
          required: true,
          type: 'string',
          minLength: 1,
          pattern: /^[A-Z,]+$/
        },
        tsyms: {
          type: 'string',
          pattern: /^[A-Z,]+$/
        }
      }
    );

    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    const cryptocompareUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsyms}&tsyms=${tsyms}`;

    const apiResult = await handleApiRequest(
      async () => {
        const response = await fetch(cryptocompareUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Galaxy-Smart-Wallet/1.0'
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json() as CryptoCompareResponse;
      },
      'CryptoCompare',
      10000
    );

    if (apiResult.error) {
      return apiResult.error;
    }

    const data = apiResult.data!;

    // Return response with CORS headers
    return NextResponse.json(data, {
      status: HttpStatusCode.OK,
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('CryptoCompare proxy error:', error);
    return createExternalApiErrorResponse('CryptoCompare');
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: HttpStatusCode.OK,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
