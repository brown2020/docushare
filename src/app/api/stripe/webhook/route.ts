import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { isFirebaseAdminReady } from "@/firebase/firebaseAdminConfig";
import { CREDIT_PACK_PURPOSE, isCreditPackPayment } from "@/lib/billing";
import { grantCreditPack } from "@/lib/billing/credits";

export const dynamic = "force-dynamic";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook is not configured" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe || !isFirebaseAdminReady()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object;
  const uid = paymentIntent.metadata?.userId;
  const purpose = paymentIntent.metadata?.purpose;
  if (
    !uid ||
    purpose !== CREDIT_PACK_PURPOSE ||
    !isCreditPackPayment(paymentIntent.amount, paymentIntent.currency)
  ) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    await grantCreditPack(uid, {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      created: paymentIntent.created,
    });
  } catch (error) {
    console.warn(
      "[stripe] grant_failed",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
