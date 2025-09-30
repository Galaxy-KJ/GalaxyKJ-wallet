
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}


// Error response structure
export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
  timestamp: number;
}


export interface CryptoPriceData {
  price: number;
  change24h: number;
}

export interface CryptoPriceResponse {
  [symbol: string]: CryptoPriceData;
}


export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export type BinanceTickerResponse = BinanceTicker[];


export interface CoinGeckoPriceData {
  [currency: string]: number | undefined;
  usd_24h_change?: number;
}

export interface CoinGeckoResponse {
  [coinId: string]: CoinGeckoPriceData;
}


export interface CryptoCompareRawData {
  TYPE: string;
  MARKET: string;
  FROMSYMBOL: string;
  TOSYMBOL: string;
  FLAGS: string;
  PRICE: number;
  LASTUPDATE: number;
  LASTVOLUME: number;
  LASTVOLUMETO: number;
  LASTTRADEID: string;
  VOLUMEDAY: number;
  VOLUMEDAYTO: number;
  VOLUME24HOUR: number;
  VOLUME24HOURTO: number;
  OPENDAY: number;
  HIGHDAY: number;
  LOWDAY: number;
  OPEN24HOUR: number;
  HIGH24HOUR: number;
  LOW24HOUR: number;
  LASTMARKET: string;
  VOLUMEHOUR: number;
  VOLUMEHOURTO: number;
  OPENHOUR: number;
  HIGHHOUR: number;
  LOWHOUR: number;
  TOPTIERVOLUME24HOUR: number;
  TOPTIERVOLUME24HOURTO: number;
  CHANGE24HOUR: number;
  CHANGEPCT24HOUR: number;
  CHANGEDAY: number;
  CHANGEPCTDAY: number;
  CHANGEHOUR: number;
  CHANGEPCTHOUR: number;
  CONVERSIONTYPE: string;
  CONVERSIONSYMBOL: string;
  SUPPLY: number;
  MKTCAP: number;
  MKTCAPPENALTY: number;
  TOTALVOLUME24H: number;
  TOTALVOLUME24HTO: number;
  TOTALTOPTIERVOLUME24H: number;
  TOTALTOPTIERVOLUME24HTO: number;
  IMAGEURL: string;
}

export interface CryptoCompareDisplayData {
  FROMSYMBOL: string;
  TOSYMBOL: string;
  MARKET: string;
  PRICE: string;
  LASTUPDATE: string;
  LASTVOLUME: string;
  LASTVOLUMETO: string;
  LASTTRADEID: string;
  VOLUMEDAY: string;
  VOLUMEDAYTO: string;
  VOLUME24HOUR: string;
  VOLUME24HOURTO: string;
  OPENDAY: string;
  HIGHDAY: string;
  LOWDAY: string;
  OPEN24HOUR: string;
  HIGH24HOUR: string;
  LOW24HOUR: string;
  LASTMARKET: string;
  VOLUMEHOUR: string;
  VOLUMEHOURTO: string;
  OPENHOUR: string;
  HIGHHOUR: string;
  LOWHOUR: string;
  TOPTIERVOLUME24HOUR: string;
  TOPTIERVOLUME24HOURTO: string;
  CHANGE24HOUR: string;
  CHANGEPCT24HOUR: string;
  CHANGEDAY: string;
  CHANGEPCTDAY: string;
  CHANGEHOUR: string;
  CHANGEPCTHOUR: string;
  CONVERSIONTYPE: string;
  CONVERSIONSYMBOL: string;
  SUPPLY: string;
  MKTCAP: string;
  MKTCAPPENALTY: string;
  TOTALVOLUME24H: string;
  TOTALVOLUME24HTO: string;
  TOTALTOPTIERVOLUME24H: string;
  TOTALTOPTIERVOLUME24HTO: string;
  IMAGEURL: string;
}

export interface CryptoCompareSymbolData {
  [targetSymbol: string]: {
    RAW: CryptoCompareRawData;
    DISPLAY: CryptoCompareDisplayData;
  };
}

export interface CryptoCompareResponse {
  RAW: {
    [sourceSymbol: string]: CryptoCompareSymbolData;
  };
  DISPLAY: {
    [sourceSymbol: string]: CryptoCompareSymbolData;
  };
}


export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp?: number;
}


export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}


// Common API error types
export type ApiErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR';

// Standard error messages
export const ERROR_MESSAGES = {
  MISSING_PARAMETER: 'Missing required parameter',
  INVALID_PARAMETER: 'Invalid parameter value',
  EXTERNAL_API_FAILED: 'External API request failed',
  TIMEOUT_ERROR: 'Request timeout exceeded',
  NETWORK_ERROR: 'Network connection failed',
  INVALID_SYMBOLS: 'No valid symbols provided',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
} as const;

export interface DetailedErrorResponse {
  error: string;
  type: ApiErrorType;
  status: HttpStatusCode;
  details?: Record<string, unknown>;
  timestamp: number;
}