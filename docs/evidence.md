# Evidencias DevOps

Registro de evidencias verificables del flujo de trabajo. Cada entrada enlaza al artefacto original en GitHub o Azure DevOps.

## Fallo controlado del pipeline (semana 2)

| Campo | Detalle |
|---|---|
| Pipeline | `incident-hub-ci` (Azure Pipelines, agente self-hosted `agente-pc-erick`, pool `Default`) |
| Ejecución fallida | [Build #11 (`20261025.1`)](https://dev.azure.com/epur/proyectoFinal/_build/results?buildId=11) |
| Disparador | PR [incident-hub-semana2#1](https://github.com/ErierCode/incident-hub-semana2/pull/1) (`feature/AB33-azure-pipeline`) |
| Paso que falló | `Pruebas unitarias e integración (Jest)` |
| Work items | AB#33 (pipeline), AB#34 (corrección) |

### Síntoma

Las 42 pruebas pasaron, pero el paso terminó con código 1:

```
Branches     : 86.66% ( 104/120 )
Jest: Coverage for branches (86.66%) does not meet "global" threshold (90%)
Tests:       42 passed, 42 total
npm error Lifecycle script `test:ci` failed with error:
##[error]Cmd.exe exited with code '1'.
```

### Diagnóstico

El PR introdujo un **umbral de calidad** (`coverageThreshold` del 90 % en `backend/package.json`). El código existente cumplía en statements (95 %), functions (100 %) y lines (97 %), pero no en **branches**. Con `jest --coverage --coverageReporters=text` se identificaron las ramas sin probar:

| Archivo | Rama sin cubrir |
|---|---|
| `src/app.js:29` | Manejador de errores con respuesta 500 genérica (errores sin `status`) |
| `src/domain/status.js:15` | Estado de origen desconocido (`TRANSITIONS[from] \|\| []`) |
| `src/routes/incidents.js:93,109` | `changedBy` presente pero inválido en `/assign` y `/status` |
| `src/routes/incidents.js` | Peticiones sin cuerpo (`req.body \|\| {}`) |
| `src/services/incidentService.js:41` | `list()` invocado sin filtros |

**Causa raíz**: las pruebas de la semana 1 cubrían los caminos felices y la validación principal, pero no los casos límite ni el manejo de fallos de infraestructura.

**Decisión**: no se bajó el umbral, se agregaron las pruebas faltantes. Así se conserva la exigencia de calidad.

### Corrección

- Rama `fix/AB34-coverage-tests`, PR [incident-hub-semana2#2](https://github.com/ErierCode/incident-hub-semana2/pull/2).
- Nuevo archivo `backend/tests/edge-cases.test.js` con 9 casos: fallo de base de datos (500), estado desconocido, peticiones sin cuerpo, `changedBy` inválido y `list()` sin filtros.
- Resultado local: `Branches 95.83% (115/120)`, 51 pruebas en verde.

### Ejecución exitosa

| Campo | Detalle |
|---|---|
| Ejecución | [Build #12](https://dev.azure.com/epur/proyectoFinal/_build/results?buildId=12): **succeeded** en 2 min |
| Commit | `122d6b3`, merge de la corrección en `feature/AB33-azure-pipeline` |
| Pruebas | 51 en verde, publicadas en la pestaña *Tests* |
| Cobertura | Branches 95.83 %, publicada en la pestaña *Code Coverage* |
| Artefactos | `incident-hub` (zip `incident-hub-0.2.0.zip` + `npm-audit.json`, 71 KB) y `Code Coverage Report_12` |

Secuencia completa: **build #11 fallido → diagnóstico → `fix/AB34-coverage-tests` (PR #2) → build #12 exitoso → merge del PR #1 a `main`**.

## Agente self-hosted

| Campo | Detalle |
|---|---|
| Nombre | `agente-pc-erick` |
| Pool | `Default` (organización `epur`) |
| Versión | 5.280.0 (win-x64) |
| Ubicación | `C:\agent`, modo interactivo (`run.cmd`) |
| Registro | PAT con alcance *Agent Pools (Read & manage)* ingresado por consola; no se almacena en el repositorio |
| Evidencia | Los builds #11 y #12 muestran `Agent: agente-pc-erick` y rutas `C:\agent\_work\1\s` en el log |
