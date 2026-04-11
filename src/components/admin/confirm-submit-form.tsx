"use client";

import type { ReactNode } from "react";

/**
 * Server action + bevestiging vóór submit (destructieve acties).
 * Geen extra UI — alleen native `confirm`.
 */
export function ConfirmSubmitForm({
  message,
  action,
  children,
  className,
}: {
  message: string;
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      className={className}
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
