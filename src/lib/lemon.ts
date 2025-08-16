'use server';

import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';

if (!process.env.LEMONSQUEEZY_API_KEY) {
  throw new Error('Missing LEMONSQUEEZY_API_KEY in environment variables');
}

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  onError: (err) => console.error('Lemon Squeezy API error:', err),
});

export { createCheckout };
