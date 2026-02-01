"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { useEffect } from "react";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentsDisplayProps {
  className?: string;
}

export default function PaymentsDisplay({ className = "" }: PaymentsDisplayProps) {
  const uid = useAuthStore((state) => state.uid);
  const { payments, paymentsLoading, paymentsError, fetchPayments } =
    usePaymentsStore();

  useEffect(() => {
    if (uid) {
      fetchPayments();
    }
  }, [uid, fetchPayments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  return (
    <div className={`flex flex-col w-full max-w-4xl mx-auto gap-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Payment History
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            View your past transactions
          </p>
        </div>
      </div>

      {paymentsLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 animate-pulse"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {paymentsError && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error loading payments: {paymentsError}
          </p>
        </div>
      )}

      {!paymentsLoading && !paymentsError && payments.length === 0 && (
        <div className="text-center py-12 px-4 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700">
          <CreditCard className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            No payments yet
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
            Your payment history will appear here
          </p>
        </div>
      )}

      {!paymentsLoading && !paymentsError && payments.length > 0 && (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-lg text-neutral-900 dark:text-white">
                  ${(payment.amount / 100).toFixed(2)}
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {getStatusIcon(payment.status)}
                  {payment.status}
                </div>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {payment.createdAt
                  ? payment.createdAt.toDate().toLocaleString()
                  : "Date unavailable"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
