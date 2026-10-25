const express = require('express');
const { validate } = require('../validation/validate');
const schemas = require('../validation/schemas');

function createIncidentsRouter({ incidents }) {
  const router = express.Router();
  const withId = { params: schemas.idParams };

  router.get('/', validate({ query: schemas.listIncidentsQuery }), async (req, res) => {
    res.json(await incidents.list(req.valid.query));
  });

  router.get('/:id', validate(withId), async (req, res) => {
    res.json(await incidents.getById(req.valid.params.id));
  });

  router.post('/', validate({ body: schemas.createIncident }), async (req, res) => {
    const incident = await incidents.create(req.valid.body);
    console.log(`Incidente ${incident.id} creado por ${incident.reported_by}`);
    res.status(201).json(incident);
  });

  router.patch('/:id/assign', validate({ ...withId, body: schemas.assignIncident }), async (req, res) => {
    const { id } = req.valid.params;
    const { technicianId, changedBy = 'coordinador' } = req.valid.body;
    const incident = await incidents.assign(id, technicianId, changedBy);
    console.log(`Incidente ${id} asignado al técnico ${technicianId}`);
    res.json(incident);
  });

  router.patch('/:id/status', validate({ ...withId, body: schemas.changeStatus }), async (req, res) => {
    const { id } = req.valid.params;
    const { status, changedBy = 'técnico' } = req.valid.body;
    const incident = await incidents.changeStatus(id, status, changedBy);
    console.log(`Incidente ${id} pasó a ${status}`);
    res.json(incident);
  });

  router.get('/:id/comments', validate(withId), async (req, res) => {
    res.json(await incidents.listComments(req.valid.params.id));
  });

  router.post('/:id/comments', validate({ ...withId, body: schemas.createComment }), async (req, res) => {
    const { id } = req.valid.params;
    const { author, message } = req.valid.body;
    const comment = await incidents.addComment(id, author, message);
    console.log(`Comentario agregado al incidente ${id}`);
    res.status(201).json(comment);
  });

  return router;
}

module.exports = { createIncidentsRouter };
