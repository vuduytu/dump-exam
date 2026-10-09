"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";

/** A form whose Server Action returns {error} or {ok}; shows the message under the fields. */
export function ActionForm({ action, submit, className, children }: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  submit: string;
  className?: string;
  children: ReactNode;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={className ?? "flex flex-col gap-3"}>
      {children}
      {state?.error && <p role="alert" className="text-red-600">{state.error}</p>}
      {state?.ok && <p role="status" className="text-green-700">{state.ok}</p>}
      <button disabled={pending} className="rounded border px-3 py-1 text-sm disabled:opacity-50">{submit}</button>
    </form>
  );
}
