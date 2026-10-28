"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { db } from "@/firebase/firebaseClient";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  payment_intent: string;
};

const PAYMENT_ID = /^pi_[A-Za-z0-9]+$/;

export default function PaymentSuccessPage({ payment_intent }: Props) {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [amount, setAmount] = useState(0);
  const uid = useAuthStore((state) => state.uid);
  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!payment_intent || !PAYMENT_ID.test(payment_intent)) {
      setLoading(false);
      return;
    }
    if (!uid) return;

    const paymentRef = doc(db, "users", uid, "payments", payment_intent);
    const unsubscribe = onSnapshot(
      paymentRef,
      (snap) => {
        if (snap.exists() && snap.data()?.status === "succeeded") {
          setConfirmed(true);
          const paid = snap.data()?.amount;
          setAmount(typeof paid === "number" ? paid : 0);
          void fetchProfile();
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [payment_intent, uid, fetchProfile]);

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-sm border-black">
      {loading ? (
        <div>Confirming your payment…</div>
      ) : confirmed ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-sm my-5 text-4xl font-bold mx-auto">
            ${amount / 100}
          </div>
          <div>Id: {payment_intent}</div>
        </div>
      ) : (
        <div>
          Payment submitted. Credits appear after Stripe confirms the charge.
        </div>
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
