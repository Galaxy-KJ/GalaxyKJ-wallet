import { NextRequest, NextResponse } from 'next/server';
import { CoinGeckoResponse, HttpStatusCode } from '@/types/api-responses';
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
    const ids = searchParams.get('ids');
    const vs_currencies = searchParams.get('vs_currencies') || 'usd';
    const include_24hr_change = searchParams.get('include_24hr_change') || 'true';

    // Validate parameters
    const validation = validateParameters(
      { ids, vs_currencies, include_24hr_change },
      {
        ids: {
          required: true,
          type: 'string',
          minLength: 1,
          pattern: /^[a-z0-9,-]+$/
        },
        vs_currencies: {
          type: 'string',
          allowedValues: ['usd', 'eur', 'btc', 'eth']
        },
        include_24hr_change: {
          type: 'string',
          allowedValues: ['true', 'false']
        }
      }
    );

    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&include_24hr_change=${include_24hr_change}`;

    const apiResult = await handleApiRequest(
      async () => {
        const response = await fetch(coingeckoUrl, {
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

        return await response.json() as CoinGeckoResponse;
      },
      'CoinGecko',
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
    console.error('CoinGecko proxy error:', error);
    return createExternalApiErrorResponse('CoinGecko');
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
