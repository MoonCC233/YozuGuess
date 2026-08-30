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

      <div className="card">
        <h2>联机对战</h2>
        <p>
          在大厅建房拿到 <strong>5 位房间号</strong>分享给朋友，或直接输入房间号加入，也可以勾选旁观只看不猜。
          房主在两人就位后开局，全房同一个答案，每小局默认 <strong>2 分钟</strong>，结算 8 秒后自动进入下一小局。
          赛制可选 BO1 / BO3 / BO5 / BO7，先拿到过半小局胜利即赢下整场；打满全部小局则按总比分判定。
        </p>
        <dl className="dims">
          <dt>有人猜中</dt>
          <dd>最早猜中的人拿下这一小局</dd>
          <dt>无人猜中</dt>
          <dd>
            按接近程度判定：取单次猜测的最高得分（绿色每个 2 分、黄色每个 1 分），
            得分相同则猜测次数少者胜
          </dd>
          <dt>判平局</dt>
          <dd>接近程度与次数完全持平、双方都没蒙对任何属性、或一次都没猜，双方均不得分</dd>
          <dt>对手离开</dt>
          <dd>留下的人直接赢下整场</dd>
        </dl>
        <p>
          小局进行中你<strong>只能看到对手每次猜测的颜色</strong>，角色名与属性值显示为「？？？」，
          结算后才互相揭示完整反馈。挂机不参与接近程度比较，所以不猜不会白捡胜利。
          断线后回到同一房间会自动认领原座位，比分和本小局已提交的猜测都能恢复。
        </p>
      </div>

      <div className="card">
        <h2>账号与战绩</h2>
        <p>
          账号是可选的，不登录也能玩全部模式，只是不留记录。
          <strong>登录后单人对局与联机对战会自动记录</strong>，在个人主页能看到胜率、平均猜测次数、连胜和猜中次数分布。
        </p>
        <dl className="dims">
          <dt>匿名局</dt>
          <dd>未登录时开的局不写入任何战绩</dd>
          <dt>每日一柚</dt>
          <dd>每天只记第一次的结果，重开不会刷数据</dd>
          <dt>自由练习</dt>
          <dd>每局都记，放弃看答案也算一局但不计胜</dd>
          <dt>联机对战</dt>
          <dd>整场结束时记一条；房主重置比分后的重赛单独算一场</dd>
          <dt>中途退出</dt>
          <dd>逃跑者记败绩，留下的人记胜绩</dd>
          <dt>排行榜</dt>
          <dd>按单人猜中局数排序，同分时平均猜测次数少的靠前</dd>
        </dl>
      </div>

      <div className="actions">
        <Link className="btn btn-primary" to="/">
          去玩一局
        </Link>
        <Link className="btn" to="/multi">
          联机对战
        </Link>
        <Link className="btn" to="/codex">
          查看图鉴
        </Link>
      </div>
    </section>
  );
}
