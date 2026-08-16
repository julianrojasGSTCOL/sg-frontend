export default function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <span aria-hidden className="text-2xl">
        🔍
      </span>
      <p className="text-sm text-muted">{mensaje}</p>
    </div>
  );
}
