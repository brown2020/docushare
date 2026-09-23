"use client";

import { HardSignOutButton } from "@/components/auth/HardSignOutButton";

export default function Footer() {
  return (
    <footer className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-4 mx-auto h-14 px-4 py-2 max-w-6xl w-full">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Docushare AI Demo
        </span>
        <HardSignOutButton label="Clear session & reload" variant="footer" />
      </div>
    </footer>
  );
}
