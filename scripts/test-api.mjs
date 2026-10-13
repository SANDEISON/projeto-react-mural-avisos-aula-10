// Teste real da API, em uma porta separada e com banco temporário.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as esperar } from 'node:timers/promises';

const pasta = await mkdtemp(join(tmpdir(), 'mural-api-'));
const banco = join(pasta, 'db.json');
await writeFile(banco, JSON.stringify({ avisos: [] }));
const cli = fileURLToPath(new URL('../node_modules/json-server/lib/bin.js', import.meta.url));
const servidor = spawn(process.execPath, [cli, banco, '--port', '3099'], { stdio: 'pipe' });
let saida = '';
servidor.stdout.on('data', dados => { saida += dados; });
servidor.stderr.on('data', dados => { saida += dados; });
servidor.on('error', erro => { saida += erro.message; });
const url = 'http://localhost:3099/avisos';

async function requisitar(metodo, rota = '', dados) {
  return fetch(`${url}${rota}`, {
    method: metodo,
    headers: dados ? { 'Content-Type': 'application/json' } : undefined,
    body: dados ? JSON.stringify(dados) : undefined,
    signal: AbortSignal.timeout(3000)
  });
}

try {
  let pronto = false;
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    if (servidor.exitCode !== null) throw new Error(saida);
    try {
      const resposta = await requisitar('GET');
      if (resposta.ok) { pronto = true; break; }
    } catch { /* Aguardar o servidor iniciar. */ }
    await esperar(250);
  }
  assert.ok(pronto, `API não iniciou. Confira se a porta 3099 está livre. ${saida}`);
  assert.deepEqual(await (await requisitar('GET')).json(), []);
  const criacao = await requisitar('POST', '', { titulo: 'Teste do laboratório' });
  assert.equal(criacao.status, 201);
  const novo = await criacao.json();
  assert.equal(typeof novo.id, 'string');
  assert.equal(novo.titulo, 'Teste do laboratório');
  const edicao = await requisitar('PATCH', `/${novo.id}`, { titulo: 'Título atualizado' });
  assert.ok(edicao.ok);
  assert.equal((await edicao.json()).titulo, 'Título atualizado');
  // O arquivo deve refletir a alteração, além da resposta em memória.
  await esperar(300);
  const persistido = JSON.parse(await readFile(banco, 'utf8'));
  assert.equal(persistido.avisos[0].titulo, 'Título atualizado');
  assert.equal((await requisitar('GET', '/registro-inexistente')).status, 404);
  assert.ok((await requisitar('DELETE', `/${novo.id}`)).ok);
  assert.deepEqual(await (await requisitar('GET')).json(), []);
  console.log('OK: lista vazia, POST, ID string, PATCH, persistência, 404 e DELETE.');
} finally {
  if (servidor.exitCode === null) {
    const encerrado = new Promise(resolve => servidor.once('exit', resolve));
    servidor.kill();
    await encerrado;
  }
  await rm(pasta, { recursive: true, force: true });
}
