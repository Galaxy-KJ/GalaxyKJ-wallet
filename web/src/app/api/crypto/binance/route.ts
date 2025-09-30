import { NextRequest, NextResponse } from 'next/server';
import { 
  BinanceTickerResponse, 
  CryptoPriceResponse,
  HttpStatusCode 
} from '@/types/api-responses';
import {
  validateParameters,
  createValidationErrorResponse,
  createExternalApiErrorResponse,
  handleApiRequest,
  CORS_HEADERS
} from '@/lib/api-utils';

// Mapping from our symbols to Binance symbols
const BINANCE_SYMBOL_MAP: { [key: string]: string } = {
  'XLM': 'XLMUSDT',
  'USDC': 'USDCUSDT',
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'ADA': 'ADAUSDT',
  'DOT': 'DOTUSDT',
  'LINK': 'LINKUSDT',
  'UNI': 'UNIUSDT',
  'MATIC': 'MATICUSDT',
  'SOL': 'SOLUSDT'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');

    // Validate parameters
    const validation = validateParameters(
      { symbols },
      {
        symbols: {
          required: true,
          type: 'string',
          minLength: 1,
          pattern: /^[A-Z,]+$/i
        }
      }
    );

    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }

    const symbolList = symbols!.split(',').map(s => s.trim().toUpperCase());
    const binanceSymbols = symbolList
      .map(symbol => BINANCE_SYMBOL_MAP[symbol])
      .filter(Boolean);

    if (binanceSymbols.length === 0) {
      return createValidationErrorResponse(['No valid symbols found. Supported symbols: ' + Object.keys(BINANCE_SYMBOL_MAP).join(', ')]);
    }

    // Get 24hr ticker statistics for all symbols
    const tickerUrl = 'https://api.binance.com/api/v3/ticker/24hr';
    
    const apiResult = await handleApiRequest(
      async () => {
        const response = await fetch(tickerUrl, {
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

        return await response.json() as BinanceTickerResponse;
      },
      'Binance',
      10000
    );

    if (apiResult.error) {
      return apiResult.error;
    }

    const allTickers = apiResult.data!;

    // Filter and format the data for our symbols
    const filteredData: CryptoPriceResponse = allTickers
      .filter((ticker) => binanceSymbols.includes(ticker.symbol))
      .reduce((acc, ticker) => {
        // Find the original symbol
        const originalSymbol = Object.keys(BINANCE_SYMBOL_MAP)
          .find(key => BINANCE_SYMBOL_MAP[key] === ticker.symbol);
        
        if (originalSymbol) {
          acc[originalSymbol] = {
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent)
          };
        }
        return acc;
      }, {} as CryptoPriceResponse);

    // Return response with CORS headers
    return NextResponse.json(filteredData, {
      status: HttpStatusCode.OK,
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('Binance proxy error:', error);
    return createExternalApiErrorResponse('Binance');
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
