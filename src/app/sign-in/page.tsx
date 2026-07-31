import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = {
  title: "Editor sign in",
  robots: { index: false, follow: false, noarchive: true },
};

export default function SignInPage() {
  return (
    <section className="auth-page">
      <div>
        <p className="eyebrow">Private editorial studio</p>
        <h1>Editor sign in</h1>
        <p>
          There is no public registration. Access is limited to the configured
          editor account.
        </p>
      </div>
      <Suspense fallback={<p>Preparing sign in…</p>}>
        <SignInForm />
      </Suspense>
    </section>
  );
}
