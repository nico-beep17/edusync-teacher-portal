const PAYMONGO_BASE = "https://api.paymongo.com/v1";

/**
 * Creates a Basic auth header. Works on both client (btoa) and server (Buffer).
 */
function getAuthHeader(key: string): string {
  if (typeof window !== "undefined") {
    return `Basic ${btoa(`${key}:`)}`;
  }
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

/**
 * Generic PayMongo fetch wrapper. Throws on non-2xx with the API error detail.
 */
async function paymongoFetch(
  path: string,
  options: { method: string; body?: unknown; key: string }
): Promise<{ data: any }> {
  const res = await fetch(`${PAYMONGO_BASE}${path}`, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(options.key),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    const detail = json.errors?.[0]?.detail || `${options.method} ${path} failed`;
    throw new Error(detail);
  }
  return json;
}

// ─── Server-side (secret key) ───────────────────────────────────────────

/**
 * Creates a PayMongo Payment Intent.
 * @param amount — in PHP pesos (e.g. 899). Converted to centavos internally.
 * @param description — shown on the PayMongo dashboard.
 * @returns the payment intent `data` object.
 */
export async function createPaymentIntent(amount: number, description: string) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) throw new Error("PAYMONGO_SECRET_KEY not configured");

  const body = {
    data: {
      attributes: {
        amount: Math.round(amount * 100), // pesos → centavos
        payment_method_allowed: ["card"],
        currency: "PHP",
        description,
      },
    },
  };

  const { data } = await paymongoFetch("/payment_intents", {
    method: "POST",
    body,
    key: secretKey,
  });
  return data;
}

/**
 * Attaches a Payment Method to a Payment Intent.
 * @returns the updated payment intent `data` object.
 */
export async function attachPaymentMethod(
  paymentIntentId: string,
  paymentMethodId: string
) {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) throw new Error("PAYMONGO_SECRET_KEY not configured");

  const body = {
    data: {
      attributes: {
        payment_method: paymentMethodId,
      },
    },
  };

  const { data } = await paymongoFetch(
    `/payment_intents/${paymentIntentId}/attach`,
    { method: "POST", body, key: secretKey }
  );
  return data;
}

// ─── Client-side (public key) ────────────────────────────────────────────

/**
 * Tokenizes card details into a Payment Method.
 * Safe to call from the browser — uses the public key.
 */
export async function createPaymentMethod(params: {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  billingName?: string;
}) {
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
  if (!publicKey) throw new Error("NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY not configured");

  const body = {
    data: {
      attributes: {
        type: "card",
        details: {
          card_number: params.cardNumber.replace(/\s/g, ""),
          exp_month: params.expMonth,
          exp_year: params.expYear,
          cvc: params.cvc,
        },
        billing: params.billingName
          ? { name: params.billingName }
          : undefined,
      },
    },
  };

  const { data } = await paymongoFetch("/payment_methods", {
    method: "POST",
    body,
    key: publicKey,
  });
  return data;
}
