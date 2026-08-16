export type NivelAlerta = "bajo" | "medio" | "alto";

export type ContratoResumen = {
  id: string;
  numeroContrato: string;
  entidad: string | null;
  contratista: string | null;
  objeto: string;
  valor: number;
  tipoContratacion: string;
  estado: string | null;
  fechaFirma: string | null;
  nivelAlerta: NivelAlerta | null;
  score: number | null;
};

export type AnalisisContrato = {
  score: number;
  nivelAlerta: NivelAlerta;
  senales: string[];
  precioPromedioComparable: number | null;
  precioMedianaComparable: number | null;
  explicacionIa: string | null;
};

export type ContratoDetalle = {
  id: string;
  secopId: string;
  numeroContrato: string;
  entidad: string | null;
  contratista: string | null;
  objeto: string;
  valor: number;
  valorInicial: number | null;
  fechaFirma: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  duracionDias: number | null;
  tipoContratacion: string;
  modalidad: string | null;
  estado: string | null;
  numModificaciones: number;
  valorAdiciones: number;
  analisis: AnalisisContrato | null;
};

export type BuscarContratosParams = {
  entidad?: string;
  contratista?: string;
  numero?: string;
  tipo?: string;
  limit?: number;
  offset?: number;
};

export type BuscarContratosResultado = {
  total: number;
  limit: number;
  offset: number;
  resultados: ContratoResumen[];
};
