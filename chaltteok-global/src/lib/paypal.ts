// src/lib/paypal.ts
// 서버 전용 PayPal 유틸리티

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not set in environment variables');
  }

  const base64Auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const host = env === 'production' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';

  const res = await fetch(`https://${host}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to get PayPal access token: ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function getPayPalSubscription(subscriptionId: string) {
  const env = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
  const host = env === 'production' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
  const token = await getPayPalAccessToken();

  const res = await fetch(`https://${host}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve PayPal subscription ${subscriptionId}: ${res.statusText}`);
  }

  return res.json();
}
