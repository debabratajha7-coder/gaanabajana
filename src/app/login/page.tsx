import { Suspense } from "react";
import { googleConfigured } from "@/lib/google-oauth";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const googleEnabled = googleConfigured();

  return (
    <Suspense fallback={<div className="container-gb py-16">Loading…</div>}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
