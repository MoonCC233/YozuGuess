import { Link } from 'react-router-dom';
import { useMeta } from '../MetaContext.js';

export function Rules() {
  const { meta } = useMeta();
  const max = meta?.maxGuesses ?? 8;

  return (
    <section className="page rules">
      <h1 className="title-sm">游戏规则</h1>

      <div className="card">
        <h2>目标</h2>
        <p>
          系统从柚子社作品中随机抽取一位角色，你在 <strong>{max}</strong> 次机会内输入角色名进行猜测。
          每次猜测都会逐属性给出对比反馈。
        </p>
      </div>

      <div className="card">
        <h2>反馈颜色</h2>
        <ul className="legend legend-block">
          <li>
            <span className="swatch swatch-correct" aria-hidden="true" />
            绿色：该属性与答案完全一致
          </li>
          <li>
            <span className="swatch swatch-close" aria-hidden="true" />
            黄色：接近 —— 位次相邻、年份相差 3 年内、爆闪次数相差 3 次内，或同一位声优的其他化名
          </li>
          <li>
            <span className="swatch swatch-wrong" aria-hidden="true" />
            灰色：不一致
          </li>
          <li>↑ / ↓ 箭头：数值型属性提示答案比你猜的更大或更小</li>
        </ul>
      </div>

      <div className="card">
        <h2>猜谜维度</h2>
        <dl className="dims">
          <dt>作品</dt>
          <dd>角色所属的柚子社作品，文本型</dd>
          <dt>位次</dt>
          <dd>一号位 ~ 七号位按序数比较；主角 / 次要 / 配角按文本比较</dd>
          <dt>发色 / 瞳色</dt>
          <dd>文本型，需完全一致才算对</dd>
          <dt>年份</dt>
          <dd>作品发售年份，数值型</dd>
          <dt>爆闪</dt>
          <dd>该角色的爆闪次数，数值型</dd>
          <dt>声优</dt>
          <dd>作品署名的化名；同一位声优的不同化名判为接近</dd>
        </dl>
      </div>

      <div className="card">
        <h2>模式与难度</h2>
        <p>
          <strong>自由练习</strong>每局随机抽题，<strong>每日一柚</strong>当天全网同一个答案。
          难度分<strong>简单版</strong>（只从可攻略女主角中抽取{meta ? ` ${meta.poolSizes.heroine} 位` : ''}）
          和<strong>完整版</strong>（全部{meta ? ` ${meta.poolSizes.full} ` : ''}位角色）。
          两种难度都允许猜任意角色，方便用配角试探属性。
        </p>
      </div>

      <div className="actions">
        <Link className="btn btn-primary" to="/">
          去玩一局
        </Link>
        <Link className="btn" to="/codex">
          查看图鉴
        </Link>
      </div>
    </section>
  );
}
