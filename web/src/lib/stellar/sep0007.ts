export function generateStellarUri({
  destination,
  amount,
  assetCode,
  assetIssuer,
  memo,
}: {
  destination: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
}) {
  const url = new URL("web+stellar:pay");
  url.searchParams.append("destination", destination);
  if (amount) url.searchParams.append("amount", amount);
  if (assetCode) url.searchParams.append("asset_code", assetCode);
  if (assetIssuer) url.searchParams.append("asset_issuer", assetIssuer);
  if (memo) {
    url.searchParams.append("memo", memo);
    url.searchParams.append("memo_type", "text");
  }
  // Standard replaces + with %20 for spaces
  return url.toString().replace(/\+/g, "%20");
}

export function parseStellarUri(uri: string) {
  // If it's just a raw address (56 chars starting with G)
  if (uri.startsWith("G") && uri.length === 56) {
    return { destination: uri };
  }

  try {
    const url = new URL(uri);
    if (url.protocol !== "web+stellar:") return null;
    if (url.pathname !== "pay") return null;

    return {
      destination: url.searchParams.get("destination") || "",
      amount: url.searchParams.get("amount") || undefined,
      assetCode: url.searchParams.get("asset_code") || undefined,
      assetIssuer: url.searchParams.get("asset_issuer") || undefined,
      memo: url.searchParams.get("memo") || undefined,
    };
  } catch (e) {
    return null;
  }
}
