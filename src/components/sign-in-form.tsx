"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (result.error) {
      setError("The email or password was not accepted.");
      return;
    }
    const returnTo = searchParams.get("returnTo");
    router.push(returnTo?.startsWith("/studio") ? returnTo : "/studio");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Editor email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={12}
          required
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Opening studio…" : "Sign in"}
      </button>
    </form>
  );
}
