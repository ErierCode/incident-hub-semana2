# Seguridad

## Gestión de secretos

**Regla:** ninguna credencial, token o clave se almacena en el repositorio, en capturas ni en la documentación.

| Secreto | Dónde vive | Quién lo usa | Cómo se protege |
|---|---|---|---|
| `DB_PASSWORD` (desarrollo local) | `.env`, ignorado por `.gitignore` | `docker-compose.yml`, `npm run migrate`, `npm run dev:api` | `.env.example` solo contiene un marcador (`cambia-esto`). `docker-compose` falla si falta (`${DB_PASSWORD:?…}`) |
| `CI_DB_PASSWORD` | **GitHub Secrets** del repo (Actions y, por separado, Dependabot) | Job *Integración con PostgreSQL real* | Se generó al azar (`crypto.randomBytes`) directamente hacia `gh secret set`, sin mostrarse nunca. GitHub lo enmascara en los logs |
| `DB_PASSWORD` por ambiente (DEV/QA/PROD) | **Azure Pipelines → Library → variable group `incident-hub-secrets`**, con las variables marcadas como secretas | Stages de despliegue (semana 3) | Se inyecta como variable de entorno solo en el paso que la necesita. Azure la enmascara en los logs |
| PAT del agente self-hosted | Solo en memoria durante `config.cmd` | Registro del agente `agente-pc-erick` | Se ingresó por consola y no se guardó en archivos ni en el historial. Alcance mínimo: *Agent Pools (Read & manage)* |
| Token de GitHub de los workflows | `GITHUB_TOKEN` automático | gitleaks y dependency-review | `permissions: contents: read` (privilegio mínimo) |

## Controles automáticos

| Control | Herramienta | Momento |
|---|---|---|
| Escaneo de secretos en todo el historial | gitleaks (job *Escaneo de secretos*) | Cada PR y cada push a `main` |
| Vulnerabilidades en dependencias | `npm audit`, dependency-review, alertas de Dependabot | Cada PR, cada build y semanalmente |
| Rama `main` protegida | GitHub branch protection | Sin push directo (incluye administradores) ni force push; exige PR con conversaciones resueltas y los 5 checks en verde |
| Configuración segura | `src/config.js` | La API no arranca sin `DB_PASSWORD`; el error no expone valores |

## Seguridad de la aplicación

| Riesgo | Mitigación |
|---|---|
| Inyección SQL | Todas las consultas usan parámetros posicionales (`$1`, `$2`, …). Los filtros dinámicos se arman sobre una lista blanca de columnas (`incidentService.list`) |
| Entrada maliciosa o malformada | Validación con esquemas zod: tipos, catálogos cerrados, longitudes máximas y `trim` (TD-1) |
| Filtración de detalles internos | El manejador de errores devuelve `Error interno del servidor` en los 500; el detalle solo va al log |
| Acceso no autorizado | **Riesgo aceptado para v1.0.0**: la API no tiene autenticación (TD-5, AB#42). Mitigación planificada para v1.x: autenticación con Entra ID / JWT y roles (usuario, técnico, coordinador) |

## Si se filtra un secreto

1. Revocar o rotar el secreto de inmediato: regenerar el PAT, cambiar la contraseña y actualizar el secreto en GitHub o Azure.
2. Si llegó a un commit, el commit no se borra: se rota el secreto y se documenta el incidente. La protección de `main` impide reescribir el historial.
3. Registrar un work item `fix/*` con el análisis de la causa.
