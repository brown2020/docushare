"use server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import {
  CREDIT_PACK_PRICE_CENTS,
  CREDIT_PACK_PURPOSE,
  isCreditPackPayment,
} from "@/lib/billing";
import Stripe from "stripe";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createPaymentIntent() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error("User is not signed in.");
  }
  if (!isFirebaseAdminReady()) {
    throw new Error("Payments are not configured.");
  }

  const stripe = getStripe();
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;
  if (!stripe || !product || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Payments are not configured.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: CREDIT_PACK_PRICE_CENTS,
      currency: "usd",
      metadata: {
        product,
        userId: authUser.uid,
        purpose: CREDIT_PACK_PURPOSE,
      },
      description: `Payment for product ${product}`,
    });

    return paymentIntent.client_secret;
  } catch (error) {
    console.error(
      "Error creating payment intent:",
      error instanceof Error ? error.message : "unknown"
    );
    throw new Error("Failed to create payment intent");
  }
}

export async function validatePaymentIntent(paymentIntentId: string) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error("User is not signed in.");
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Payments are not configured.");
  }

  if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
    throw new Error("Invalid payment.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata?.userId !== authUser.uid) {
      throw new Error("Payment was not successful");
    }
    if (
      paymentIntent.status !== "succeeded" ||
      !isCreditPackPayment(paymentIntent.amount, paymentIntent.currency)
    ) {
      throw new Error("Payment was not successful");
    }

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      created: paymentIntent.created,
      status: paymentIntent.status,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
    };
  } catch (error) {
    console.error(
      "Error validating payment intent:",
      error instanceof Error ? error.message : "unknown"
    );
    throw new Error("Failed to validate payment intent");
  }
}
