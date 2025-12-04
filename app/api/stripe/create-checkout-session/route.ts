import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ініціалізуємо Stripe тільки якщо ключ є
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(request: NextRequest) {
  try {
    // Перевірка чи Stripe ініціалізовано
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe is not configured. Please check your environment variables.' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const {
      listingId,
      listingTitle,
      amount,
      currency,
      billingCycle,
      customerEmail,
      customerName,
      successUrl,
      cancelUrl,
    } = body;

    // Перетворюємо суму в центи (Stripe працює з центами/найменшими одиницями валюти)
    const amountInCents = Math.round(amount * 100);

    // Визначаємо інтервал повторення для підписки
    let interval: 'month' | 'year' = 'month';
    let intervalCount = 1;

    if (billingCycle === '3months') {
      interval = 'month';
      intervalCount = 3;
    } else if (billingCycle === 'year') {
      interval = 'year';
      intervalCount = 1;
    }

    // Створюємо Checkout Session для підписки
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: listingTitle,
              description: `Subscription for ${listingTitle} - ${billingCycle}`,
            },
            unit_amount: amountInCents,
            recurring: {
              interval: interval,
              interval_count: intervalCount,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: listingId,
        billingCycle: billingCycle,
        customerName: customerName,
      },
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/listings/${listingId}?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/listings/${listingId}?canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
