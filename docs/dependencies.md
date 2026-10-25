# Análisis de dependencias

## Herramientas

| Herramienta | Dónde corre | Qué hace | Bloquea |
|---|---|---|---|
| `npm audit --omit=dev --audit-level=high` | Azure Pipelines (paso *Revisión de dependencias*) y GitHub Actions (job *Revisión de dependencias*) | Busca CVE conocidos en dependencias de producción | Sí, si hay severidad alta o crítica |
| `npm audit --json` | Azure Pipelines | Reporte completo (prod + dev) adjunto al artefacto como `npm-audit.json` | No (evidencia) |
| `actions/dependency-review-action` | GitHub Actions, solo en PR | Compara dependencias nuevas o cambiadas del PR contra GitHub Advisory Database | Sí, severidad alta |
| Dependabot (`.github/dependabot.yml`) | GitHub, semanal | Abre PRs de actualización de npm y GitHub Actions; las alertas de seguridad están activadas | No; cada PR pasa por los mismos checks |

## Resultado del análisis (2026-10-24, v0.2.0)

```
npm audit: 0 vulnerabilidades (info 0, low 0, moderate 0, high 0, critical 0)
Dependencias: 82 de producción, 432 de desarrollo, 42 opcionales (514 en total)
```

### Dependencias directas de producción

| Paquete | Versión | Licencia | Uso | Vulnerabilidades | Decisión |
|---|---|---|---|---|---|
| `express` | 5.3.0 | MIT | Servidor HTTP / API REST | 0 | Mantener. Express 5 maneja errores `async` de forma nativa |
| `pg` | 8.23.1 | MIT | Driver PostgreSQL | 0 | Mantener; consultas siempre parametrizadas |
| `zod` | 4.6.7 | MIT | Validación de entrada y de configuración (TD-1, TD-2) | 0 | Mantener; no tiene dependencias transitivas |

### Dependencias de desarrollo relevantes

| Paquete | Versión | Uso | Observación | Decisión |
|---|---|---|---|---|
| `jest` 30 | 30.5.2 | Pruebas | Trae `@parcel/watcher` y `unrs-resolver`, que tienen *install scripts* que npm no ejecuta por defecto | **No aprobar** los scripts: son binarios nativos opcionales para el modo watch y la resolución rápida, y las pruebas en CI no los necesitan. Se reduce la superficie de ataque de la cadena de suministro |
| `pg-mem` | 3.0.x | PostgreSQL en memoria para pruebas | Solo se usa en pruebas; nunca llega al artefacto | Mantener |
| `eslint` / `@eslint/js` / `globals` | 10.13 / 10.0.1 / 17.x (antes 9.39.5 / 9.39.5 / 16.5.0) | Lint | Actualizados por Dependabot (PR #4) | Aceptado; ver evaluación abajo |
| `jest-junit` | 17.0.0 | Reporte JUnit para Azure Pipelines | Sin observaciones | Mantener |

## Evaluación de actualizaciones (Dependabot)

| PR | Cambio | Tipo | Riesgo | Evaluación | Decisión |
|---|---|---|---|---|---|
| [#4](https://github.com/ErierCode/incident-hub-semana2/pull/4) | `@eslint/js` 9.39.5 → 10.0.1, `eslint` → 10.x, `globals` 16 → 17 | **Mayor**, solo desarrollo | Bajo: no llega a producción. ESLint 10 elimina `.eslintrc`, pero el proyecto ya usa *flat config* (`eslint.config.js`). Las notas de la versión incluyen la actualización de `minimatch` por seguridad | Los 5 checks obligatorios en verde tras el rebase sobre `main` ([build #24](https://dev.azure.com/epur/proyectoFinal/_build/results?buildId=24)) | **Aceptado y mergeado** |

## Política

1. **Producción:** no se mergea ningún PR con vulnerabilidades altas o críticas. Si no hay versión corregida, se documenta la excepción aquí con una fecha de revisión.
2. **Desarrollo:** las vulnerabilidades se evalúan caso por caso, porque no llegan al artefacto (`devops/package.js` solo incluye `backend/src` y `database`, y en el despliegue se usa `npm ci --omit=dev`).
3. **Actualizaciones mayores:** se aceptan cuando todos los checks pasan y las notas de la versión no rompen la configuración actual.
4. **Licencias:** solo licencias permisivas (MIT, ISC, BSD, Apache-2.0).
