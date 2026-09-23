"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { hardSignOut } from "@/lib/auth/hardSignOut";

type HardSignOutButtonProps = {
  className?: string;
  label?: string;
  variant?: "footer" | "danger" | "link";
};

export function HardSignOutButton({
  className = "",
  label = "Hard sign out",
  variant = "footer",
}: HardSignOutButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await hardSignOut("/signin");
    } catch {
      // Always force a hard navigation even if something threw.
      if (typeof window !== "undefined") {
        window.location.replace(`/signin?_=${Date.now()}`);
      }
    }
  };

  const base =
    variant === "danger"
      ? "inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
      : variant === "link"
        ? "inline-flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-red-600 underline-offset-2 hover:underline transition-colors disabled:opacity-60"
        : "inline-flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-red-600 transition-colors disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className={`${base} ${className}`.trim()}
      title="Clear Firebase session, cookies, and local auth storage, then reload sign-in"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{busy ? "Clearing session..." : label}</span>
    </button>
  );
}
