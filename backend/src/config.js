const { z } = require('zod');

// Configuración por variables de entorno (12-factor). Los valores no sensibles tienen
// valores por defecto para desarrollo local; la contraseña es obligatoria.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1).default('incident_hub'),
  DB_USER: z.string().min(1).default('incident'),
  DB_PASSWORD: z.string({ error: 'es obligatoria' }).min(1, 'es obligatoria'),
});

function loadConfig(env = process.env) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ');
    throw new Error(`Configuración inválida: ${detail}`);
  }
  const vars = result.data;
  return {
    port: vars.PORT,
    db: {
      host: vars.DB_HOST,
      port: vars.DB_PORT,
      database: vars.DB_NAME,
      user: vars.DB_USER,
      password: vars.DB_PASSWORD,
    },
  };
}

module.exports = { loadConfig };
