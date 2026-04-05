import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AuthShell({
  eyebrow = "Exdraww",
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="auth-backdrop min-h-[100dvh] flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="auth-panel w-full max-w-[420px] rounded-2xl p-8 sm:p-10">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-3">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
