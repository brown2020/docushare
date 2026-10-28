"use client";

import PaymentCheckoutPage from "@/components/PaymentCheckoutPage";
import {
  CREDIT_PACK_AMOUNT_USD,
  CREDIT_PACK_PRICE_CENTS,
} from "@/lib/billing";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function PaymentAttempt() {
  const amount = CREDIT_PACK_AMOUNT_USD;

  if (!stripePromise) {
    return (
      <main className="max-w-xl mx-auto p-10 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payments unavailable</h1>
        <p className="text-neutral-600">
          Stripe publishable key is not configured for this environment.
        </p>
      </main>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: CREDIT_PACK_PRICE_CENTS,
        currency: "usd",
      }}
    >
      <PaymentCheckoutPage amount={amount} />
    </Elements>
  );
}
