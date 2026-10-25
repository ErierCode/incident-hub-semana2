const { loadConfig } = require('../src/config');

describe('loadConfig', () => {
  it('usa valores por defecto para desarrollo cuando solo hay contraseña', () => {
    const config = loadConfig({ DB_PASSWORD: 'secreta' });

    expect(config).toEqual({
      port: 3000,
      db: { host: 'localhost', port: 5432, database: 'incident_hub', user: 'incident', password: 'secreta' },
    });
  });

  it('lee puerto y conexión desde el entorno', () => {
    const config = loadConfig({
      PORT: '8081',
      DB_HOST: 'db.qa.local',
      DB_PORT: '6543',
      DB_NAME: 'incident_qa',
      DB_USER: 'app_qa',
      DB_PASSWORD: 'secreta',
    });

    expect(config.port).toBe(8081);
    expect(config.db).toMatchObject({ host: 'db.qa.local', port: 6543, database: 'incident_qa', user: 'app_qa' });
  });

  it('falla si falta DB_PASSWORD', () => {
    expect(() => loadConfig({})).toThrow(/DB_PASSWORD/);
  });

  it('falla si el puerto no es numérico', () => {
    expect(() => loadConfig({ DB_PASSWORD: 'x', PORT: 'ochenta' })).toThrow(/PORT/);
  });
});
