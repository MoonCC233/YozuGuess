// tsc 不会把 .json 资源复制到 outDir，这里在构建后同步 src 下的 JSON 到 dist，
// 保证 dist/cvGroups.js 运行时能解析 ./divide.json。
import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'dist');

await mkdir(outDir, { recursive: true });
const entries = await readdir(srcDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
  await cp(path.join(srcDir, entry.name), path.join(outDir, entry.name));
}
