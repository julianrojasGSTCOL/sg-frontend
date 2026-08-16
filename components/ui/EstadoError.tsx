export default function EstadoError({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-alert-high/30 bg-alert-high-bg px-4 py-3 text-sm">
      <span aria-hidden className="mt-0.5 text-base">
        ⚠️
      </span>
      <p className="text-foreground">{mensaje}</p>
    </div>
  );
}
