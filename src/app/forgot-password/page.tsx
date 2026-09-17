import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="container-gb py-16">Loading…</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
