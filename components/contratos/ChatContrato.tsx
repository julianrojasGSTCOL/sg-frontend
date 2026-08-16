"use client";

import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { IconSpinner } from "@/components/ui/icons";
import { enviarMensajeChat } from "@/server/contratos/enviarMensajeChat";
import { explicarContrato } from "@/server/contratos/explicarContrato";
import { getChatHistorial } from "@/server/contratos/getChatHistorial";
import type { MensajeChat } from "@/types/contrato";

type EstadoHistorial =
  | { tipo: "cargando" }
  | { tipo: "listo"; mensajes: MensajeChat[] }
  | { tipo: "error"; mensaje: string };

type ErrorAccion = {
  mensaje: string;
  reintentar: () => void;
};

function mensajeDeError(e: unknown): string {
  if (e instanceof Error) {
    if (e.cause === 502) {
      return "El asistente no respondió a tiempo, intenta de nuevo.";
    }
    if (e.cause === "SERVER_ERROR") {
      return "Error de conexión con el servidor, por favor intenta de nuevo.";
    }
    return e.message;
  }
  return "Ocurrió un error inesperado.";
}

export default function ChatContrato({
  contratoId,
  explicacionInicial,
}: {
  contratoId: string;
  explicacionInicial: string | null;
}) {
  const [estadoHistorial, setEstadoHistorial] = useState<EstadoHistorial>({
    tipo: "cargando",
  });
  const [generando, setGenerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [errorAccion, setErrorAccion] = useState<ErrorAccion | null>(null);

  useEffect(() => {
    let cancelado = false;

    getChatHistorial(contratoId)
      .then((mensajes) => {
        if (!cancelado) setEstadoHistorial({ tipo: "listo", mensajes });
      })
      .catch((e) => {
        if (!cancelado) {
          setEstadoHistorial({ tipo: "error", mensaje: mensajeDeError(e) });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [contratoId]);

  function recargarHistorial() {
    setEstadoHistorial({ tipo: "cargando" });
    getChatHistorial(contratoId)
      .then((mensajes) => setEstadoHistorial({ tipo: "listo", mensajes }))
      .catch((e) =>
        setEstadoHistorial({ tipo: "error", mensaje: mensajeDeError(e) }),
      );
  }

  const mensajesAMostrar: MensajeChat[] =
    estadoHistorial.tipo === "listo" && estadoHistorial.mensajes.length > 0
      ? estadoHistorial.mensajes
      : explicacionInicial
        ? [{ rol: "asistente", mensaje: explicacionInicial, creadoEn: "" }]
        : [];

  async function onGenerar() {
    setGenerando(true);
    setErrorAccion(null);
    try {
      const explicacion = await explicarContrato(contratoId);
      setEstadoHistorial({
        tipo: "listo",
        mensajes: [
          { rol: "asistente", mensaje: explicacion, creadoEn: new Date().toISOString() },
        ],
      });
    } catch (e) {
      setErrorAccion({ mensaje: mensajeDeError(e), reintentar: onGenerar });
    } finally {
      setGenerando(false);
    }
  }

  async function enviarPregunta(texto: string) {
    setEstadoHistorial((prev) =>
      prev.tipo === "listo"
        ? {
            tipo: "listo",
            mensajes: [
              ...prev.mensajes,
              { rol: "ciudadano", mensaje: texto, creadoEn: new Date().toISOString() },
            ],
          }
        : prev,
    );
    setEnviando(true);
    setErrorAccion(null);

    try {
      const respuesta = await enviarMensajeChat(contratoId, texto);
      setEstadoHistorial((prev) =>
        prev.tipo === "listo"
          ? { tipo: "listo", mensajes: [...prev.mensajes, respuesta] }
          : prev,
      );
    } catch (e) {
      setErrorAccion({
        mensaje: mensajeDeError(e),
        reintentar: () => enviarPregunta(texto),
      });
    } finally {
      setEnviando(false);
    }
  }

  function onEnviar(e: FormEvent) {
    e.preventDefault();
    const texto = pregunta.trim();
    if (!texto || enviando) return;
    setPregunta("");
    void enviarPregunta(texto);
  }

  function onKeyDownTextarea(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnviar(e);
    }
  }

  const mostrarBotonGenerar =
    estadoHistorial.tipo === "listo" && mensajesAMostrar.length === 0 && !generando;
  const mostrarInput = mensajesAMostrar.length > 0 && !generando;

  return (
    <section className="tarjeta mt-4 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <span aria-hidden>🤖</span> Explícame este contrato
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {estadoHistorial.tipo === "cargando" ? (
          <p className="text-sm text-muted">Cargando conversación…</p>
        ) : null}

        {mensajesAMostrar.map((m, i) => (
          <div
            key={`${i}-${m.rol}`}
            className={
              m.rol === "asistente"
                ? "rounded-lg border border-accent-500/25 bg-accent-100 p-3 text-sm text-foreground"
                : "ml-auto max-w-[85%] rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            }
          >
            {m.mensaje}
          </div>
        ))}

        {generando ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent-500/25 bg-accent-100 p-3 text-sm text-muted">
            <IconSpinner className="h-4 w-4 text-accent-500" />
            Generando explicación… esto puede tardar hasta 30 segundos.
          </div>
        ) : null}

        {enviando ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent-500/25 bg-accent-100 p-3 text-sm text-muted">
            <IconSpinner className="h-4 w-4 text-accent-500" />
            El asistente está pensando… puede tardar hasta 30 segundos.
          </div>
        ) : null}

        {estadoHistorial.tipo === "error" ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-alert-high/30 bg-alert-high-bg px-3 py-2 text-sm">
            <p className="text-foreground">
              No se pudo cargar la conversación: {estadoHistorial.mensaje}
            </p>
            <button
              type="button"
              onClick={recargarHistorial}
              className="shrink-0 text-sm font-medium text-muted hover:text-foreground"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {errorAccion ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-alert-high/30 bg-alert-high-bg px-3 py-2 text-sm">
            <p className="text-foreground">{errorAccion.mensaje}</p>
            <button
              type="button"
              onClick={errorAccion.reintentar}
              className="shrink-0 text-sm font-medium text-muted hover:text-foreground"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {mostrarBotonGenerar ? (
          <button
            type="button"
            onClick={onGenerar}
            className="self-start rounded-full border-2 border-brand-solid bg-brand-solid px-5 py-2 text-sm font-medium text-white transition-colors hover:border-brand-solid-hover hover:bg-brand-solid-hover focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface"
          >
            Generar explicación con IA
          </button>
        ) : null}

        {mostrarInput ? (
          <form onSubmit={onEnviar} className="flex items-end gap-2">
            <textarea
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={onKeyDownTextarea}
              placeholder="Escribe una pregunta sobre este contrato…"
              rows={2}
              maxLength={1000}
              disabled={enviando}
              className="entrada w-full resize-none px-3 py-2 text-sm placeholder:text-muted/70"
            />
            <button
              type="submit"
              disabled={enviando || !pregunta.trim()}
              className="shrink-0 rounded-full border-2 border-brand-solid bg-brand-solid px-5 py-2 text-sm font-medium text-white transition-colors hover:border-brand-solid-hover hover:bg-brand-solid-hover focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
