"use client";

import { getPaymentAvailability } from "@/actions/paymentActions";
import { creditsAvailableLabel } from "@/lib/billing/creditBalance";
import { PAYMENTS_UNAVAILABLE_MESSAGE } from "@/lib/billing/checkout";
import { LoadingState } from "@/components/ui/LoadingState";
import useProfileStore from "@/zustand/useProfileStore";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfileCreditComponent() {
  const profile = useProfileStore((state) => state.profile);
  const creditsLoaded = useProfileStore((state) => state.creditsLoaded);
  const creditsLabel = creditsAvailableLabel(creditsLoaded, profile.credits);
  const [availability, setAvailability] = useState<
    "unknown" | "ready" | "unavailable"
  >("unknown");
  const [message, setMessage] = useState(PAYMENTS_UNAVAILABLE_MESSAGE);

  useEffect(() => {
    let ignore = false;
    getPaymentAvailability()
      .then((result) => {
        if (ignore) return;
        setAvailability(result.available ? "ready" : "unavailable");
        if (!result.available && result.message) setMessage(result.message);
      })
      .catch(() => {
        if (!ignore) setAvailability("unavailable");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-col p-5 border border-lightGray bg-lightGray mt-[60px] max-sm:mt-[30px] rounded-[10px] shadow-drop-shadow">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex max-sm:flex-col gap-2 w-full items-center">
          <div className="flex-1 text-lg font-medium" aria-live="polite" aria-busy={!creditsLoaded}>
            {creditsLabel ?? (
              <LoadingState
                size="sm"
                text="Loading credits"
                className="flex-row justify-start gap-2 py-0"
              />
            )}
          </div>
          {availability === "ready" ? (
            <Link
              className="bg-blue-500 text-white px-[60px] py-3 rounded-sm hover:opacity-50 text-center"
              href="/payment-attempt"
            >
              Buy 10,000 Credits
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="bg-blue-500 text-white px-[60px] py-3 rounded-sm opacity-50 cursor-not-allowed text-center"
              aria-describedby="payments-unavailable"
            >
              Buy 10,000 Credits
            </button>
          )}
        </div>
      </div>
      {availability === "unavailable" ? (
        <p id="payments-unavailable" className="mt-3 text-sm text-neutral-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
