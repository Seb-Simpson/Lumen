import { AuthForm } from "@/components/auth-forms";
export const metadata = { title: "verify email" };
export default function Page() {
  return <AuthForm mode="verify-email" />;
}
