import type { NivelAlerta } from "@/types/contrato";

export const NIVEL_ALERTA_LABEL: Record<NivelAlerta, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
};

export const NIVEL_ALERTA_EMOJI: Record<NivelAlerta, string> = {
  bajo: "🟢",
  medio: "🟡",
  alto: "🔴",
};

// El color nunca va en el texto: carga el significado un punto/barra sólida
// (NIVEL_ALERTA_SOLIDO) junto a una etiqueta de texto siempre visible. Estas
// son cadenas de clase literales (no interpoladas) porque Tailwind necesita
// verlas completas en el código fuente para generarlas.
export const NIVEL_ALERTA_SOLIDO: Record<NivelAlerta, string> = {
  bajo: "bg-alert-low",
  medio: "bg-alert-medium",
  alto: "bg-alert-high",
};

export const NIVEL_ALERTA_SUAVE: Record<NivelAlerta, string> = {
  bajo: "bg-alert-low-bg",
  medio: "bg-alert-medium-bg",
  alto: "bg-alert-high-bg",
};

export const NIVEL_ALERTA_BORDE: Record<NivelAlerta, string> = {
  bajo: "border-alert-low/30",
  medio: "border-alert-medium/30",
  alto: "border-alert-high/30",
};
