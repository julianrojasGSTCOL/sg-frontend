export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          SECOP Guardian es una iniciativa ciudadana independiente, no afiliada
          ni respaldada por el Estado colombiano.
        </p>
        <p>
          Fuente de datos:{" "}
          <a
            href="https://www.datos.gov.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 hover:underline"
          >
            datos.gov.co
          </a>{" "}
          — SECOP II
        </p>
      </div>
    </footer>
  );
}
