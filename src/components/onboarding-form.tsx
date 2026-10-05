"use client";
import { useActionState } from "react";
import { savePreferences } from "@/app/actions/study";
import { goals } from "@/domain/validation";
export function OnboardingForm({
  subjects,
  name = "",
  initial,
}: {
  subjects: { id: string; name: string }[];
  name?: string;
  initial?: {
    goal: string;
    level: string;
    daily_goal: number;
    subjects: string[];
  };
}) {
  const [state, action, pending] = useActionState(savePreferences, {});
  return (
    <form action={action} className="form-stack">
      <label>
        Como podemos chamar você?
        <input
          name="name"
          autoComplete="given-name"
          required
          minLength={2}
          maxLength={60}
          defaultValue={name}
          placeholder="Seu nome"
        />
      </label>
      <label>
        O que você quer alcançar?
        <select name="goal" defaultValue={initial?.goal || "ENEM"}>
          {goals.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Quais matérias fazem parte do seu caminho?</legend>
        <div className="choice-grid">
          {subjects.map((s) => (
            <label
              key={s.id}
              className="choice"
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <input
                style={{ width: 18, minHeight: 18 }}
                type="checkbox"
                name="subjects"
                value={s.id}
                defaultChecked={initial?.subjects.includes(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Qual é seu nível hoje?
        <select name="level" defaultValue={initial?.level || "unknown"}>
          <option value="unknown">Não sei — quero descobrir</option>
          <option value="initial">Estou começando</option>
          <option value="intermediate">Já tenho uma base</option>
          <option value="advanced">Quero desafios avançados</option>
        </select>
      </label>
      <label>
        Sua meta diária
        <select name="dailyGoal" defaultValue={initial?.daily_goal || 10}>
          <option value="5">5 questões · um começo leve</option>
          <option value="10">10 questões · criando constância</option>
          <option value="20">20 questões · um passo além</option>
          <option value="30">30 questões · foco total</option>
        </select>
      </label>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="button primary">
        {pending ? "Salvando seu caminho…" : "Vamos começar →"}
      </button>
    </form>
  );
}
