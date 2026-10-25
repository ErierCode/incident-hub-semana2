// Middleware de validación: valida params, query y body contra esquemas zod
// y deja los valores ya normalizados en req.valid.
function formatIssues(issues) {
  return issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; ');
}

function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};
    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source] ?? {});
      if (!result.success) {
        return res.status(400).json({ error: formatIssues(result.error.issues) });
      }
      req.valid[source] = result.data;
    }
    next();
  };
}

module.exports = { validate };
