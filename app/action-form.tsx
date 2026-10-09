"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";

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
      {state?.error && <p role="alert" className="text-destructive">{state.error}</p>}
      {state?.ok && <p role="status" className="text-correct">{state.ok}</p>}
      <Button type="submit" variant="outline" disabled={pending}>{submit}{pending && "…"}</Button>
    </form>
  );
}
