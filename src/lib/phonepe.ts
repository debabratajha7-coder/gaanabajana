import crypto from "crypto";

type TokenCache = {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  issuedAt: number;
};

let tokenCache: TokenCache | null = null;

function isProduction() {
  return process.env.PHONEPE_ENV === "production";
}

function pgBaseUrl() {
  return isProduction()
    ? "https://api.phonepe.com/apis/pg"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

function oauthBaseUrl() {
  return isProduction()
    ? "https://api.phonepe.com/apis/identity-manager"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";
}

function credentials() {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || "1");
  if (!clientId || !clientSecret) {
    throw new Error("PhonePe credentials missing");
  }
  return { clientId, clientSecret, clientVersion };
}

export function isPhonePeConfigured() {
  return Boolean(
    process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET
  );
}

async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!forceRefresh && tokenCache) {
    const reloadAt = Math.floor(
      tokenCache.issuedAt + (tokenCache.expiresAt - tokenCache.issuedAt) / 2
    );
    if (now < reloadAt) {
      return `${tokenCache.tokenType} ${tokenCache.accessToken}`;
    }
  }

  const { clientId, clientSecret, clientVersion } = credentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    client_version: String(clientVersion),
    grant_type: "client_credentials",
  });

  const res = await fetch(`${oauthBaseUrl()}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    expires_at?: number;
    issued_at?: number;
    message?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.message || "PhonePe OAuth token failed");
  }

  tokenCache = {
    accessToken: data.access_token,
    tokenType: data.token_type || "O-Bearer",
    expiresAt: data.expires_at || now + 3000,
    issuedAt: data.issued_at || now,
  };

  return `${tokenCache.tokenType} ${tokenCache.accessToken}`;
}

async function phonePeFetch<T>(
  path: string,
  init: RequestInit & { retryAuth?: boolean } = {}
): Promise<T> {
  const { retryAuth = true, headers, ...rest } = init;
  const auth = await getAccessToken();
  const res = await fetch(`${pgBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: auth,
      ...headers,
    },
    cache: "no-store",
  });

  if (res.status === 401 && retryAuth) {
    await getAccessToken(true);
    return phonePeFetch(path, { ...init, retryAuth: false });
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string })?.message ||
        JSON.stringify(data) ||
        `PhonePe request failed (${res.status})`
    );
  }
  return data as T;
}

/** Amount must be in paise (₹1 = 100). */
export async function createPhonePePayment(input: {
  merchantOrderId: string;
  amountInr: number;
  redirectUrl: string;
  message?: string;
}) {
  const amount = Math.round(input.amountInr * 100);
  if (amount < 100) {
    throw new Error("Minimum payment amount is ₹1");
  }

  return phonePeFetch<{
    orderId: string;
    state: string;
    expireAt: number;
    redirectUrl: string;
  }>("/checkout/v2/pay", {
    method: "POST",
    body: JSON.stringify({
      merchantOrderId: input.merchantOrderId,
      amount,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: input.message || "Payment for Gaanbajna order",
        merchantUrls: {
          redirectUrl: input.redirectUrl,
        },
      },
    }),
  });
}

export async function getPhonePeOrderStatus(merchantOrderId: string) {
  return phonePeFetch<{
    merchantOrderId?: string;
    orderId: string;
    state: string;
    amount: number;
    paymentDetails?: Array<{ transactionId?: string; state?: string }>;
  }>(
    `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    { method: "GET" }
  );
}

/** Dashboard username:password hashed — matches PhonePe Node SDK validation. */
export function verifyPhonePeCallbackAuthorization(authorization: string | null) {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password || !authorization) return false;
  const expected = crypto
    .createHash("sha256")
    .update(`${username}:${password}`)
    .digest("hex");
  // Header may be raw hash or "SHA256{hash}" depending on dashboard config
  const normalized = authorization.replace(/^SHA256/i, "").trim();
  return normalized === expected || authorization === expected;
}

export function isPhonePePaidState(state?: string) {
  return state === "COMPLETED";
}

export function isPhonePeFailedState(state?: string) {
  return state === "FAILED";
}
