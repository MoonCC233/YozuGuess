// 从 client/public/logos/logo-1.png 生成 favicon 资源。
//
// 站点 Logo 有四张、每次刷新随机轮换，但浏览器标签页图标需要固定，所以固定取 logo-1。
// 产出三样：
//   - favicon.ico：内嵌 16/32/48 三帧 PNG，兼容旧浏览器与 Windows 的 /favicon.ico 默认请求；
//   - favicon-32.png / favicon-192.png：现代浏览器与 Android 主屏；
//   - apple-touch-icon.png：iOS 添加到主屏幕，180x180 且必须不透明（iOS 会把透明区渲染成黑色）。
//
// 产物都会提交，日常开发不需要跑这个脚本，只在换 Logo 后重跑。
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'client', 'public', 'logos', 'logo-1.png');
const outDir = path.join(root, 'client', 'public');

/** ICO 里内嵌的帧尺寸；48 以上交给 PNG favicon，不再塞进 ico 以免体积膨胀 */
const ICO_SIZES = [16, 32, 48];

function renderPng(size, { flatten = false } = {}) {
  let pipeline = sharp(source).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (flatten) pipeline = pipeline.flatten({ background: '#fff8ec' });
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * 手写 ICO 容器：6 字节文件头 + 每帧 16 字节目录项 + 各帧 PNG 数据。
 * ICO 允许直接内嵌 PNG（Vista 起支持），比生成 BMP 帧简单得多，也省体积。
 */
function buildIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(frames.length, 4);

  let offset = header.length + frames.length * 16;
  const entries = [];
  for (const frame of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 0); // 256 用 0 表示
    entry.writeUInt8(frame.size >= 256 ? 0 : frame.size, 1);
    entry.writeUInt8(0, 2); // 调色板数量，PNG 帧填 0
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(frame.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += frame.data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

const icoFrames = [];
for (const size of ICO_SIZES) {
  icoFrames.push({ size, data: await renderPng(size) });
}
const ico = buildIco(icoFrames);
await writeFile(path.join(outDir, 'favicon.ico'), ico);

const png32 = await renderPng(32);
await writeFile(path.join(outDir, 'favicon-32.png'), png32);

const png192 = await renderPng(192);
await writeFile(path.join(outDir, 'favicon-192.png'), png192);

const appleTouch = await renderPng(180, { flatten: true });
await writeFile(path.join(outDir, 'apple-touch-icon.png'), appleTouch);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`favicon.ico（${ICO_SIZES.join('/')}）${kb(ico.length)}`);
console.log(`favicon-32.png ${kb(png32.length)}、favicon-192.png ${kb(png192.length)}、apple-touch-icon.png ${kb(appleTouch.length)}`);
