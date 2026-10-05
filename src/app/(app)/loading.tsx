export default function Loading() {
  return (
    <section
      role="status"
      aria-label="Carregando página"
      aria-busy="true"
      className="form-stack"
    >
      <div className="skeleton" style={{ width: "60%", height: 36 }} />
      <div className="skeleton" style={{ width: "100%", height: 160 }} />
      <div className="skeleton" style={{ width: "100%", height: 100 }} />
      <span className="muted">Preparando seu próximo passo…</span>
    </section>
  );
}
