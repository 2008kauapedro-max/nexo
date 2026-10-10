"use client";
import { useActionState } from "react";
import { startStudy } from "@/app/actions/study";
export function SimulationForm({
  subjects,
}: {
  subjects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(startStudy, {});
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="mode" value="simulation" />
      <label>
        Matéria
        <select name="subject">
          <option value="">Todas as matérias</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantidade de questões
        <select name="target">
          <option value="5">5 questões</option>
          <option value="10">10 questões</option>
          <option value="30">30 questões</option>
          <option value="90">90 questões</option>
          <option value="180">180 questões</option>
        </select>
      </label>
      <label>
        Tempo de prova
        <select name="minutes">
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
          <option value="180">3 horas</option>
        </select>
      </label>
      <p className="notice">
        No modo prova, o resultado e as explicações aparecem ao terminar. O
        tempo é controlado pelo servidor. Cada prova iniciada conta no limite de simulados dos últimos 7 dias, mesmo se você sair antes do fim.
      </p>
      {state.error && (
        <p role="alert" className="notice error">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="button primary">
        {pending ? "Preparando sua prova…" : "Iniciar simulado →"}
      </button>
    </form>
  );
}
