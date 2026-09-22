"use client";

import PaymentCheckoutPage from "@/components/PaymentCheckoutPage";
import convertToSubcurrency from "@/lib/convertToSubcurrency";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function PaymentAttempt() {
  const amount = 99.99;

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
        amount: convertToSubcurrency(amount),
        currency: "usd",
      }}
    >
      <PaymentCheckoutPage amount={amount} />
    </Elements>
  );
}
