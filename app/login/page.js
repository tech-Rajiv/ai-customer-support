import { redirect } from "next/navigation";
import LoginForm from "@/app/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Log in — NovaCart" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="px-4 py-12">
      <LoginForm />
    </div>
  );
}
