// "Build" del backend: compila (node --check) cada archivo fuente para detectar errores de sintaxis.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SRC = path.resolve(__dirname, '../src');

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

const files = listJsFiles(SRC);
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(result.stderr);
  }
}

console.log(`Backend: ${files.length} archivos verificados, ${failed} con errores`);
process.exit(failed ? 1 : 0);
