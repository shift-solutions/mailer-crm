"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Field, Input, surfaceClass, cn } from "@/components/ui";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const notAdmin = useSearchParams().get("error") === "not_admin";

  return (
    <form action={action} className={cn(surfaceClass, "space-y-4 p-6")}>
      <div className="mb-1">
        <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-stone-500">Admin access for Shift Solutions.</p>
      </div>
      {notAdmin && !state.error ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This account isn&apos;t set up as an admin.
        </p>
      ) : null}
      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
