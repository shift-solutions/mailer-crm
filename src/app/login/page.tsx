import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-lg font-semibold tracking-tight">Mailer CRM</h1>
        <p className="mb-6 text-sm text-stone-500">Shift Solutions · admin sign-in</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
