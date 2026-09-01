// 把 yuz_char_img/<年份>/<角色名>.png 转成图鉴用的立绘资源。
//
// 源图有三个麻烦：尺寸从 166x183 到 1722x966 不等、trim 后纵横比在 0.38~1.46 之间、
// 且几乎每张都四周带大片透明留白。处理分三步：
//   1. trim 掉透明留白，让主体贴边；
//   2. 统一裁成 3:4 —— 比 3:4 宽的图（如 1142x966 的海道秀明）按人物头部横向位置裁掉
//      两侧多余背景，比 3:4 高的图（如 284x739 的八坂尚之）保留顶部裁掉下半身；
//   3. 压成两档 webp——卡片视图用 card（高 400），表格视图用 thumb（高 128）。
//
// 第 2 步是关键：早先只 trim 不裁，让 CSS 用 object-fit: contain 兜住，结果宽图在
// 3:4 的格位里被压成一条横带、下方留出大片空白。统一裁成 3:4 之后所有卡片的构图
// 一致（头部到胸腹），CSS 也可以直接用 cover。
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

/** 卡片格位的纵横比，脚本与 styles.css 的 .portrait-card 必须一致 */
const ASPECT = 3 / 4;

const VARIANTS = [
  { dir: 'card', height: 400, quality: 82 },
  { dir: 'thumb', height: 128, quality: 78 },
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
  try {
    const { data, info } = await sharp(file).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    if (info.width < 16 || info.height < 16) return await sharp(file).toBuffer();
    return data;
  } catch {
    return await sharp(file).toBuffer();
  }
}

/**
 * 估算人物在横向上的重心：取图像顶部 28% 的高度band，把不透明像素的 x 中位数当作头部位置。
 * 宽图（如双人构图或大量背景的 CG 裁图）直接按几何中心裁会把人物切掉一半，所以要按头部对齐。
 */
async function focusX(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const band = Math.max(1, Math.round(info.height * 0.28));
  const xs = [];
  for (let y = 0; y < band; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) xs.push(x);
    }
  }
  if (xs.length === 0) return info.width / 2;
  xs.sort((a, b) => a - b);
  return xs[Math.floor(xs.length / 2)];
}

/** 把 trim 后的图统一裁成 3:4：宽图按头部横向位置裁两侧，高图保留顶部 */
async function frameToAspect(buf) {
  const { width, height } = await sharp(buf).metadata();
  if (width / height > ASPECT) {
    const cropWidth = Math.min(width, Math.round(height * ASPECT));
    const center = await focusX(buf);
    const left = Math.max(0, Math.min(width - cropWidth, Math.round(center - cropWidth / 2)));
    return sharp(buf).extract({ left, top: 0, width: cropWidth, height });
  }
  const cropHeight = Math.min(height, Math.round(width / ASPECT));
  return sharp(buf).extract({ left: 0, top: 0, width, height: cropHeight });
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
  const framed = await frameToAspect(trimmed);
  const source = await framed.png().toBuffer();
  for (const variant of VARIANTS) {
    const out = path.join(outRoot, variant.dir, `${job.id}.webp`);
    const info = await sharp(source)
      .resize({
        width: Math.round(variant.height * ASPECT),
        height: variant.height,
        fit: 'cover',
        position: 'top',
        withoutEnlargement: true,
      })
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
