"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");

    // Add a slight delay for smooth transition effect
    const timeoutId = setTimeout(() => {
      if (token) {
        router.push("/joinRoom");
      } else {
        router.push("/signin");
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="auth-backdrop flex min-h-[100dvh] flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-600/5 ring-1 ring-violet-500/20 dark:from-violet-400/20 dark:to-violet-600/5 dark:ring-violet-400/25"
          aria-hidden
        >
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-200/80 dark:border-zinc-600/50" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-600 dark:border-t-violet-400" />
          </div>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
          Exdraww
        </p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Opening your workspace…
        </p>
      </div>
    </div>
  );
}

