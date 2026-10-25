const request = require('supertest');
const { createApp } = require('../src/app');
const { createTestDb } = require('./helpers/testDb');
const { canTransition } = require('../src/domain/status');
const { createIncidentService } = require('../src/services/incidentService');
const { createTechnicianService } = require('../src/services/technicianService');

describe('Casos límite y manejo de errores', () => {
  let app;
  let incidentId;

  beforeEach(async () => {
    app = createApp({ db: createTestDb() });
    const res = await request(app).post('/api/incidents').send({
      title: 'Monitor parpadea',
      description: 'El monitor se apaga cada pocos minutos',
      category: 'HARDWARE',
      priority: 'BAJA',
      reportedBy: 'Laura Pérez',
    });
    incidentId = res.body.id;
  });

  it('responde 500 genérico cuando falla la base de datos', async () => {
    const failingDb = { query: () => Promise.reject(new Error('conexión rechazada')) };
    const brokenApp = createApp({ db: failingDb });

    const res = await request(brokenApp).get('/health');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  it('no permite transiciones desde estados desconocidos', () => {
    expect(canTransition('DESCONOCIDO', 'NUEVO')).toBe(false);
  });

  it.each([
    ['POST', '/api/incidents'],
    ['PATCH', '/assign'],
    ['PATCH', '/status'],
    ['POST', '/comments'],
  ])('%s %s sin cuerpo responde 400', async (method, path) => {
    const url = path.startsWith('/api') ? path : `/api/incidents/${incidentId}${path}`;

    const res = await request(app)[method.toLowerCase()](url);

    expect(res.status).toBe(400);
  });

  it('rechaza changedBy vacío al asignar', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${incidentId}/assign`)
      .send({ technicianId: 1, changedBy: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('changedBy');
  });

  it('rechaza changedBy no textual al cambiar estado', async () => {
    const res = await request(app)
      .patch(`/api/incidents/${incidentId}/status`)
      .send({ status: 'EN_PROCESO', changedBy: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('changedBy');
  });

  it('el servicio lista sin filtros cuando no se envían', async () => {
    const db = createTestDb();
    const incidents = createIncidentService(db, { technicians: createTechnicianService(db) });

    await expect(incidents.list()).resolves.toEqual([]);
  });
});
