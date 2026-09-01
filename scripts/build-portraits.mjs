// 把 yuz_char_img/<年份>/<角色名>.png 转成图鉴用的立绘资源。
//
// 源图有三个麻烦：尺寸从 225x202 到 957x966 不等、纵横比在 0.52~1.80 之间、
// 且 161/166 张四周带大片透明留白。这里先 trim 掉留白让主体贴边，再压成
// 两档 webp——卡片视图用 card（长边 400），表格视图用 thumb（长边 128）。
//
// 输出按角色 id 命名而非角色名，避免中文文件名在 URL 里要 encode。
// 生成的 client/public/portraits/ 与 client/src/portraitIds.json 都会提交，
// 所以日常开发不需要跑这个脚本，只在替换源图后重跑。
import sharp from 'sharp';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS } from '../shared/dist/characters.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'yuz_char_img');
const outRoot = path.join(root, 'client', 'public', 'portraits');
const manifestPath = path.join(root, 'client', 'src', 'portraitIds.json');

const VARIANTS = [
  { dir: 'card', size: 400, quality: 82 },
  { dir: 'thumb', size: 128, quality: 78 },
];

async function collectSources() {
  const found = [];
  for (const year of await readdir(srcRoot)) {
    const dir = path.join(srcRoot, year);
    if (!(await stat(dir)).isDirectory()) continue;
    for (const file of await readdir(dir)) {
      if (!file.toLowerCase().endsWith('.png')) continue;
      found.push({ year, name: path.basename(file, path.extname(file)), file: path.join(dir, file) });
    }
  }
  return found;
}

/** 角色名在 CHARACTERS 里全局唯一，所以直接按名字对齐，不依赖目录年份 */
function indexCharacters() {
  const byName = new Map();
  for (const c of CHARACTERS) {
    const hit = byName.get(c.name);
    if (hit) throw new Error(`角色名重复，无法按名字匹配立绘：${c.name}`);
    byName.set(c.name, c);
  }
  return byName;
}

/** 去掉四周透明留白，让主体在卡片里贴边；个别图 trim 会失败或整张被判为空，退回原图 */
async function trimTransparent(file) {
  const original = sharp(file);
  try {
    const { data, info } = await original.clone().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    if (info.width < 16 || info.height < 16) return sharp(file);
    return sharp(data);
  } catch {
    return sharp(file);
  }
}

const sources = await collectSources();
const byName = indexCharacters();

const missingCharacter = [];
const jobs = [];
for (const src of sources) {
  const character = byName.get(src.name);
  if (!character) {
    missingCharacter.push(`${src.year}/${src.name}.png`);
    continue;
  }
  jobs.push({ ...src, id: character.id });
}

if (missingCharacter.length > 0) {
  console.error('以下立绘在角色数据里找不到同名角色，请先对齐名字：');
  for (const m of missingCharacter) console.error(`  ${m}`);
  process.exit(1);
}

await rm(outRoot, { recursive: true, force: true });
for (const variant of VARIANTS) {
  await mkdir(path.join(outRoot, variant.dir), { recursive: true });
}

let bytes = 0;
for (const job of jobs) {
  const trimmed = await trimTransparent(job.file);
  for (const variant of VARIANTS) {
    const out = path.join(outRoot, variant.dir, `${job.id}.webp`);
    const info = await trimmed
      .clone()
      .resize({ width: variant.size, height: variant.size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: variant.quality, effort: 6 })
      .toFile(out);
    bytes += info.size;
  }
}

const ids = jobs.map((j) => j.id).sort((a, b) => a - b);
await writeFile(manifestPath, `${JSON.stringify(ids)}\n`, 'utf8');

const noPortrait = CHARACTERS.filter((c) => !ids.includes(c.id));
console.log(`立绘 ${jobs.length} 张 -> ${jobs.length * VARIANTS.length} 个 webp，共 ${(bytes / 1024 / 1024).toFixed(2)} MB`);
if (noPortrait.length > 0) {
  console.log(`缺立绘的角色 ${noPortrait.length} 位：${noPortrait.map((c) => c.name).join('、')}`);
}
