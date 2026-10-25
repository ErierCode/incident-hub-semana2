# Deuda técnica

Registro de deuda técnica real identificada en el código, con su work item en Azure Boards (etiqueta `tech-debt`).

| ID | Work item | Deuda | Impacto | Prioridad | Estado |
|---|---|---|---|---|---|
| TD-1 | AB#38 | Validación manual de entradas con `if` repetidos en `routes/incidents.js` | Código duplicado (~100 líneas), mensajes inconsistentes, fácil olvidar un campo al agregar endpoints | Alta | **Resuelta** (`refactor/AB38-validation-zod`) |
| TD-2 | AB#39 | Configuración fija en código: host, puerto, base y usuario de PostgreSQL en `db/pool.js`; puerto HTTP 3000 en `server.js` | Imposible desplegar en otro ambiente sin modificar código; bloquea DEV/QA/PROD | Alta | **Resuelta** (`refactor/AB39-config-env`) |
| TD-3 | AB#40 | `GET /api/incidents` devuelve todos los registros, sin paginación | Respuestas y consultas crecen sin límite con el volumen de incidentes | Media | Pendiente |
| TD-4 | AB#41 | Logging con `console.log`, sin niveles ni formato estructurado | No se puede filtrar ni correlacionar en producción; ruido en la salida de pruebas | Media | Pendiente |
| TD-5 | AB#42 | API sin autenticación ni autorización | Cualquier cliente puede crear, asignar o cerrar incidentes | Alta (fuera del alcance de v1.0.0) | Aceptada para v1.x |

## Cómo se identificaron

- **TD-1, TD-3, TD-4**: observaciones en las revisiones de los PR #2 y #4 del repositorio `incident-hub-semana1`.
- **TD-2**: revisión del PR #1 (semana 1). Además bloquea la estrategia de ambientes de la semana 3.
- **TD-5**: análisis de seguridad (`docs/security.md`).

## Resoluciones

### TD-1: validación con esquemas zod (AB#38)

- **Antes:** cada ruta validaba `req.body` y `req.query` con cadenas de `if`. La misma regla, por ejemplo "texto obligatorio" o "valor del catálogo", se repetía en 5 lugares.
- **Después:** `src/validation/schemas.js` define los esquemas zod reutilizando los catálogos de `domain/catalogs.js`. El middleware `src/validation/validate.js` valida `params`, `query` y `body` y deja los datos normalizados (trim, coerción de ids) en `req.valid`.
- **Verificación:** las 51 pruebas existentes pasan sin modificarse, porque el comportamiento HTTP es el mismo. `routes/incidents.js` pasó de ~150 a 54 líneas.

### TD-2: configuración por variables de entorno (AB#39)

- **Antes:** `db/pool.js` creaba el pool con `host: 'localhost'`, `port: 5432`, `database: 'incident_hub'` y `user: 'incident'` fijos, y `server.js` escuchaba siempre en el puerto 3000. Si faltaba `DB_PASSWORD`, la API arrancaba igual y fallaba recién en la primera consulta.
- **Después:** `src/config.js` valida el entorno con zod siguiendo el estilo 12-factor:
  - `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME` y `DB_USER` tienen valores por defecto para desarrollo;
  - `DB_PASSWORD` es obligatoria, y la API **no arranca** sin ella (`Configuración inválida: DB_PASSWORD es obligatoria`).
- `pool.js` pasa a ser una fábrica (`createPool(config.db)`) que usan `server.js` y `migrate.js`.
- Los scripts `start`, `dev` y `migrate` cargan `../.env` si existe (`node --env-file-if-exists`). `docker-compose.yml` y `.env.example` usan los mismos nombres de variable.
- **Verificación:** 4 pruebas nuevas en `tests/config.test.js` (55 en total). Esta resolución habilita los ambientes DEV, QA y PROD con puertos y bases distintas.
