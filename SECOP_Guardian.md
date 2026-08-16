# SECOP Guardian — Detector de anomalías en contratación pública

## 1. Resumen

**SECOP Guardian** es una herramienta de inteligencia ciudadana que analiza datos abiertos de contratación pública de SECOP para identificar contratos que presentan **señales de alerta o comportamientos atípicos**.

La plataforma no acusa de corrupción. En cambio, utiliza datos y análisis estadístico para señalar casos que **merecen una revisión ciudadana o institucional**.

> **SECOP → análisis → detección de anomalías → explicación con IA → ciudadano**

---

## 2. Problema

La información de contratación pública existe, pero para un ciudadano común puede ser difícil:

- Encontrar contratos relevantes.
- Comparar precios.
- Entender modificaciones y adiciones.
- Identificar comportamientos atípicos.
- Interpretar grandes cantidades de datos.

SECOP Guardian busca convertir esos datos en información comprensible y accionable.

---

## 3. Solución

El usuario puede buscar una entidad, contratista o contrato y obtener un análisis automático.

### Ejemplo

**Compra de computadores**

- Contratos analizados: 127
- Precio promedio: `$2.450.000`
- Precio mediano: `$2.300.000`
- Precio del contrato analizado: `$4.850.000`
- Diferencia: `+110%`
- Nivel de alerta: 🔴 **Alto**

### Explicación generada por IA

> El precio unitario registrado es significativamente superior al observado en contratos comparables dentro del conjunto analizado.

La plataforma también puede detectar otras señales:

- Valores considerablemente superiores al promedio.
- Alta cantidad de modificaciones.
- Adiciones importantes.
- Concentración de contratos en un proveedor.
- Comportamientos atípicos frente a contratos similares.

---

## 4. Funcionalidades del MVP

### 🔎 Búsqueda

Buscar por:

- Entidad.
- Contratista.
- Número de contrato.
- Tipo de contratación.

### 📊 Dashboard

Mostrar:

- Total de contratos analizados.
- Contratos de bajo riesgo.
- Contratos para revisar.
- Contratos con alta alerta.
- Valor total contratado.
- Promedios y medianas.

### 🚨 Sistema de alertas

Cada contrato recibe un nivel:

- 🟢 Bajo
- 🟡 Medio
- 🔴 Alto

El puntaje puede calcularse inicialmente mediante reglas estadísticas simples.

### 🤖 Explicación con IA

La IA convierte los resultados técnicos en lenguaje sencillo.

Ejemplo:

> Este contrato presenta una señal de alerta porque su precio unitario es 67% superior a la mediana encontrada en contratos comparables.

### 📄 Ficha del contrato

Mostrar:

- Entidad.
- Contratista.
- Objeto.
- Valor.
- Fecha.
- Duración.
- Adiciones.
- Modificaciones.
- Indicadores encontrados.

---

## 5. Arquitectura propuesta

```text
                 SECOP / Datos Abiertos
                         │
                         ▼
                  Limpieza de datos
                         │
                         ▼
                  PostgreSQL
                         │
                         ▼
                  API / Backend
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
      Motor de anomalías       Servicio de IA
              │                     │
              └──────────┬──────────┘
                         ▼
                    Frontend Web
                         │
                         ▼
                     Ciudadano
```

---

## 6. Tecnologías

### Frontend

- React
- Next.js
- TypeScript
- Tailwind CSS
- Recharts o una librería similar para gráficas

### Backend

- Node.js
- API REST

### Datos

- PostgreSQL
- SECOP / Datos Abiertos

### Análisis

- Python
- Pandas
- NumPy
- Estadística descriptiva

### IA

Un LLM para:

- Explicar anomalías.
- Resumir contratos.
- Generar lenguaje ciudadano.
- Responder preguntas sobre los resultados.

---

## 7. Cómo calcular el riesgo en el MVP

No es necesario entrenar un modelo de Machine Learning durante el hackathon.

Se puede utilizar un sistema de puntuación basado en reglas.

### Ejemplo

**Precio anormal**
- +30 puntos

**Adiciones superiores al 20%**
- +20 puntos

**Varias modificaciones**
- +15 puntos

**Alta concentración del proveedor**
- +20 puntos

**Comportamiento muy diferente a contratos similares**
- +15 puntos

### Resultado

```text
0 - 29     🟢 Bajo
30 - 59    🟡 Medio
60 - 100   🔴 Alto
```

Estos valores son una propuesta inicial y deben presentarse como un **indicador experimental**, no como una prueba de irregularidad.

---

## 8. Ejemplo de experiencia del usuario

### Paso 1

El ciudadano entra a la plataforma.

### Paso 2

Busca:

> Alcaldía de X

### Paso 3

El sistema muestra:

```text
Contratos encontrados: 1.284

🟢 892 bajo
🟡 317 medio
🔴 75 alto
```

### Paso 4

El usuario selecciona un contrato.

### Paso 5

La plataforma muestra:

```text
CONTRATO #123456

Valor:
$2.400.000.000

Contratista:
Empresa XYZ SAS

Índice de alerta:
82/100 🔴

Señales:
✓ Precio superior al promedio
✓ 3 modificaciones
✓ Adición del 27%
```

### Paso 6

El usuario pulsa:

> **🤖 Explícame este contrato**

La IA genera una explicación sencilla.

---

## 9. Alcance para un hackathon de 24 horas

Es importante limitar el MVP.

### Sí hacer

- Un subconjunto de datos SECOP.
- Una o varias entidades.
- Análisis estadístico.
- Dashboard.
- Sistema de alertas.
- Explicación mediante IA.
- Una demo completamente funcional.

### No hacer inicialmente

- Analizar todo SECOP.
- Machine Learning complejo.
- Grafo completo de empresas.
- Aplicación móvil.
- Sistema de notificaciones avanzado.
- Integraciones múltiples.
- Automatización de procesos legales.

El objetivo es tener **pocas funcionalidades, pero funcionando muy bien**.

---

## 10. División del equipo

### Persona 1 — Datos / Backend

- Obtener datos SECOP.
- Limpiarlos.
- Crear la base de datos.
- Crear endpoints.

### Persona 2 — Frontend

- Dashboard.
- Buscador.
- Ficha del contrato.
- Gráficas.
- Diseño.

### Persona 3 — IA / análisis

- Algoritmo de puntuación.
- Detección de anomalías.
- Prompts.
- Explicación de resultados.

### Persona 4 — Integración / Pitch

- Integrar frontend y backend.
- Pruebas.
- Preparar demo.
- Presentación.

---

## 11. Diferenciador

SECOP Guardian no busca simplemente mostrar datos públicos.

Busca responder:

> **“¿Qué debería mirar un ciudadano dentro de todos estos datos?”**

La IA funciona como una capa de interpretación sobre los datos abiertos.

---

## 12. Mensaje principal

### Antes

> Miles de contratos públicos difíciles de interpretar.

### Después

> Señales de alerta explicadas en segundos.

### Propuesta de valor

**“Convertimos datos públicos complejos en señales que cualquier ciudadano puede entender.”**

---

## 13. Consideración importante

El sistema debe evitar afirmar que un contrato es corrupto únicamente porque presenta una anomalía.

El lenguaje recomendado es:

- “Señal de alerta”
- “Comportamiento atípico”
- “Requiere revisión”
- “Diferencia significativa”
- “Posible anomalía”

Esto permite que la herramienta sea responsable y evita confundir una anomalía estadística con una acusación.

---

## 14. Evolución futura

Después del MVP se podrían agregar:

1. 🕸️ Grafo de relaciones entre entidades y contratistas.
2. 🗺️ Mapa de contratación por municipio.
3. 🔔 Alertas sobre nuevos contratos.
4. 🤖 Chat con SECOP.
5. 📈 Modelos de Machine Learning para detección de anomalías.
6. 📄 Análisis automático de documentos.
7. 🔍 Comparación avanzada entre contratos similares.

---

## 15. Pitch de 30 segundos

> **SECOP Guardian convierte los datos abiertos de contratación pública en información que cualquier ciudadano puede entender. Analizamos contratos, comparamos precios y detectamos comportamientos atípicos para generar señales de alerta. Después, nuestra IA explica en lenguaje sencillo por qué un contrato merece ser revisado. No acusamos: damos herramientas para que la ciudadanía pueda investigar.**
