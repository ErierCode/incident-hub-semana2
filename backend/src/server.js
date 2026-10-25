const { createApp } = require('./app');
const { loadConfig } = require('./config');
const { createPool } = require('./db/pool');

const config = loadConfig();
const app = createApp({ db: createPool(config.db) });

app.listen(config.port, () => {
  console.log(`IT Incident Hub API escuchando en http://localhost:${config.port}`);
});
