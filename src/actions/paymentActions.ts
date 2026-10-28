"use server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import {
  CREDIT_PACK_PRICE_CENTS,
  CREDIT_PACK_PURPOSE,
  isCreditPackPayment,
} from "@/lib/billing";
import {
  isCheckoutConfigured,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/checkout";
import Stripe from "stripe";

export type PaymentIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; message: string };

export async function getPaymentAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  if (
    isCheckoutConfigured({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      productName: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME,
      adminReady: isFirebaseAdminReady(),
    })
  ) {
    return { available: true, message: "" };
  }
  return { available: false, message: PAYMENTS_UNAVAILABLE_MESSAGE };
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createPaymentIntent(): Promise<PaymentIntentResult> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { ok: false, message: "You are not signed in." };
  }

  const availability = await getPaymentAvailability();
  if (!availability.available) {
    return { ok: false, message: availability.message };
  }

  const stripe = getStripe();
  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;
  if (!stripe || !product) {
    return { ok: false, message: PAYMENTS_UNAVAILABLE_MESSAGE };
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

    if (!paymentIntent.client_secret) {
      return { ok: false, message: PAYMENTS_UNAVAILABLE_MESSAGE };
    }
    return { ok: true, clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error(
      "Error creating payment intent:",
      error instanceof Error ? error.message : "unknown"
    );
    return { ok: false, message: "Failed to start checkout. Please try again." };
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
