import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/supabase";
export default async function Update() {
  await requireUser();
  return (
    <section className="auth-card">
      <h1>Sua nova senha.</h1>
      <p>Escolha uma senha única com pelo menos 10 caracteres.</p>
      <AuthForm mode="update" />
    </section>
  );
}
