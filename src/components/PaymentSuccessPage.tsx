"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import useProfileStore from "@/zustand/useProfileStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { validatePaymentIntent } from "@/actions/paymentActions";

type Props = {
  payment_intent: string;
};

type PaymentView = {
  message: string;
  created: number;
  id: string;
  amount: number;
  status: string;
};

export default function PaymentSuccessPage({ payment_intent }: Props) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<PaymentView>({
    message: "",
    created: 0,
    id: "",
    amount: 0,
    status: "",
  });

  const addPayment = usePaymentsStore((state) => state.addPayment);
  const checkIfPaymentProcessed = usePaymentsStore(
    (state) => state.checkIfPaymentProcessed
  );
  const addCredits = useProfileStore((state) => state.addCredits);
  const uid = useAuthStore((state) => state.uid);

  useEffect(() => {
    let ignore = false;

    if (!payment_intent) {
      setView((v) => ({ ...v, message: "No payment intent found" }));
      setLoading(false);
      return;
    }

    if (!uid) return;

    void (async () => {
      try {
        const data = await validatePaymentIntent(payment_intent);
        if (ignore) return;

        if (data.status !== "succeeded") {
          setView((v) => ({ ...v, message: "Payment validation failed" }));
          return;
        }

        const existingPayment = await checkIfPaymentProcessed(data.id);
        if (ignore) return;

        if (existingPayment) {
          setView({
            message: "Payment has already been processed.",
            created: existingPayment.createdAt
              ? existingPayment.createdAt.toMillis()
              : 0,
            id: existingPayment.id,
            amount: existingPayment.amount,
            status: existingPayment.status,
          });
          return;
        }

        await addPayment({
          id: data.id,
          amount: data.amount,
          status: data.status,
        });
        if (ignore) return;

        await addCredits(data.amount + 1);
        if (ignore) return;

        setView({
          message: "Payment successful",
          created: data.created * 1000,
          id: data.id,
          amount: data.amount,
          status: data.status,
        });
      } catch {
        if (!ignore) {
          setView((v) => ({
            ...v,
            message: "Error handling payment success",
          }));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [payment_intent, addPayment, checkIfPaymentProcessed, addCredits, uid]);

  const createdLabel = view.created
    ? new Date(view.created).toISOString()
    : "";

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-sm border-black">
      {loading ? (
        <div>validating...</div>
      ) : view.id ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-sm my-5 text-4xl font-bold mx-auto">
            ${view.amount / 100}
          </div>
          <div>Uid: {uid}</div>
          <div>Id: {view.id}</div>
          <div>Created: {createdLabel}</div>
          <div>Status: {view.status}</div>
        </div>
      ) : (
        <div>{view.message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:opacity-50"
      >
        View Profile
      </Link>
    </main>
  );
}
