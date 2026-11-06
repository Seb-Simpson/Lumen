import { AuthForm } from "@/components/auth-forms";
export const metadata = { title: "forgot password" };
export default function Page() {
  return <AuthForm mode="forgot-password" />;
}
