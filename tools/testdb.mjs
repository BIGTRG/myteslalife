// Shared embedded-postgres harness for tests.
import EmbeddedPostgres from 'embedded-postgres';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function startTestDb() {
  const dir = mkdtempSync(join(tmpdir(), 'mtlpg-'));
  const port = 54000 + Math.floor(Math.random() * 1000);
  const pgInst = new EmbeddedPostgres({
    databaseDir: dir, user: 'mtl', password: 'mtl', port, persistent: false,
  });
  await pgInst.initialise();
  await pgInst.start();
  await pgInst.createDatabase('mtl_test');
  const url = `postgres://mtl:mtl@127.0.0.1:${port}/mtl_test`;
  return { url, stop: () => pgInst.stop() };
}
