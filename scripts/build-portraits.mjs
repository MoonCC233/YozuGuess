// 把 yuz_char_img/<年份>/<角色名>.png 转成图鉴用的立绘资源。
//
// 源图有几个麻烦：尺寸从 166x183 到 1722x966 不等、trim 后纵横比在 0.38~1.46 之间、
// 大多四周带大片透明留白，而少数几张是从 CG 上抠下来的、带一层不透明的黑色衬底。
// 处理分四步：
//   1. 抹掉黑色衬底 —— 边框整圈不透明且基本全黑的图（如朝雾春奈、海老原水濑）从边框
//      泛洪把连通的黑色区域改成透明，否则卡片里会显示成一块黑底；
//   2. trim 掉透明留白，让主体贴边；
//   3. 统一裁成 3:4 —— 比 3:4 宽的图（如 1142x966 的海道秀明）按人物头部横向位置裁掉
//      两侧多余背景，比 3:4 高的图（如 284x739 的八坂尚之）保留顶部裁掉下半身；
//   4. 压成两档 webp——卡片视图用 card（高 400），表格视图用 thumb（高 128）。
//
// 第 3 步是关键：早先只 trim 不裁，让 CSS 用 object-fit: contain 兜住，结果宽图在
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

/** 判定为纯黑衬底的亮度上限（max 通道），到此为止完全透明 */
const MATTE_HARD = 12;
/** 衬底与人物边缘的过渡上限，HARD~SOFT 之间按亮度线性给 alpha，避免抠出硬锯齿 */
const MATTE_SOFT = 64;

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

/**
 * 抹掉从 CG 上抠图留下的黑色衬底。
 *
 * 只对「边框整圈都不透明、且这圈基本全是黑」的图动手——绝大多数源图本来就带透明留白，
 * 边框环的不透明占比很低，会被这个前置判定挡掉，不会误伤深色头发或深色背景的立绘。
 * 命中后从边框向内泛洪，把与边框连通的暗色像素改成透明；人物身上被头发圈住的暗色区域
 * 与边框不连通，所以不会被掏空。边缘用 HARD~SOFT 的线性 alpha 过渡消除锯齿。
 */
async function dropDarkMatte(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const maxChannel = (k) => Math.max(data[k * 4], data[k * 4 + 1], data[k * 4 + 2]);

  let ring = 0;
  let ringOpaque = 0;
  let ringDark = 0;
  const survey = (x, y) => {
    const k = y * width + x;
    ring += 1;
    if (data[k * 4 + 3] <= 250) return;
    ringOpaque += 1;
    if (maxChannel(k) <= MATTE_SOFT) ringDark += 1;
  };
  for (let x = 0; x < width; x += 1) {
    survey(x, 0);
    survey(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    survey(0, y);
    survey(width - 1, y);
  }
  if (ringOpaque / ring < 0.5 || ringDark / Math.max(1, ringOpaque) < 0.7) return null;

  const matte = new Uint8Array(width * height);
  const stack = [];
  const seed = (x, y) => {
    const k = y * width + x;
    if (matte[k] || maxChannel(k) > MATTE_SOFT) return;
    matte[k] = 1;
    stack.push(k);
  };
  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }
  while (stack.length > 0) {
    const k = stack.pop();
    const x = k % width;
    const y = (k - x) / width;
    if (x > 0) seed(x - 1, y);
    if (x < width - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < height - 1) seed(x, y + 1);
  }

  for (let k = 0; k < matte.length; k += 1) {
    if (!matte[k]) continue;
    const mx = maxChannel(k);
    const alpha = mx <= MATTE_HARD ? 0 : Math.round((255 * (mx - MATTE_HARD)) / (MATTE_SOFT - MATTE_HARD));
    if (alpha < data[k * 4 + 3]) data[k * 4 + 3] = alpha;
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** 去掉四周透明留白，让主体在卡片里贴边；个别图 trim 会失败或整张被判为空，退回原图 */
async function trimTransparent(input) {
  try {
    const { data, info } = await sharp(input).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    if (info.width < 16 || info.height < 16) return await sharp(input).toBuffer();
    return data;
  } catch {
    return await sharp(input).toBuffer();
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
const dematted = [];
for (const job of jobs) {
  const matteFree = await dropDarkMatte(job.file);
  if (matteFree) dematted.push(job.name);
  const trimmed = await trimTransparent(matteFree ?? job.file);
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
if (dematted.length > 0) {
  console.log(`抹掉黑色衬底 ${dematted.length} 张：${dematted.join('、')}`);
}
if (noPortrait.length > 0) {
  console.log(`缺立绘的角色 ${noPortrait.length} 位：${noPortrait.map((c) => c.name).join('、')}`);
}
