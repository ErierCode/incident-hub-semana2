const { z } = require('zod');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../domain/catalogs');

const requiredText = (max) => z.string().trim().min(1, 'es obligatorio').max(max, `no puede superar ${max} caracteres`);
const optionalAuthor = z.string().trim().min(1, 'debe ser un texto no vacío').max(100).optional();
const positiveId = z.coerce.number().int().positive('debe ser un entero positivo');

const idParams = z.object({ id: positiveId });

const createIncident = z.object({
  title: requiredText(200),
  description: requiredText(5000),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  reportedBy: requiredText(100),
});

const listIncidentsQuery = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  technicianId: positiveId.optional(),
});

const assignIncident = z.object({
  technicianId: z.number().int().positive('debe ser un entero positivo'),
  changedBy: optionalAuthor,
});

const changeStatus = z.object({
  status: z.enum(STATUSES),
  changedBy: optionalAuthor,
});

const createComment = z.object({
  author: requiredText(100),
  message: requiredText(2000),
});

module.exports = {
  idParams,
  createIncident,
  listIncidentsQuery,
  assignIncident,
  changeStatus,
  createComment,
};
