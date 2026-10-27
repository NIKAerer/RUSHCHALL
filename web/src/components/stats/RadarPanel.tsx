import type { PlayerStats } from "../../api/types";
import { axes, tier } from "./visual";
import styles from "./RadarPanel.module.css";
import common from "./stats.module.css";

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 92;

/** Profil de jeu sur six axes, chacun noté sur 100 par rapport à un jungler haut elo. */
export function RadarPanel({ stats }: { stats: PlayerStats }) {
  const list = axes(stats);
  const point = (index: number, score: number) => {
    const angle = (Math.PI * 2 * index) / list.length - Math.PI / 2;
    const r = (RADIUS * score) / 100;
    return [
      CENTER + r * Math.cos(angle),
      CENTER + r * Math.sin(angle),
    ] as const;
  };
  const polygon = (score: (index: number) => number) =>
    list.map((_, i) => point(i, score(i)).join(",")).join(" ");
  const overall = Math.round(
    list.reduce((total, a) => total + a.score, 0) / list.length,
  );

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Profil de jeu <small>score sur 100</small>
      </h2>
      <div className={styles.body}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.radar}
          role="img"
          aria-label={`Profil de jeu, score global ${overall} sur 100`}
        >
          {[25, 50, 75, 100].map((ring) => (
            <polygon
              key={ring}
              points={polygon(() => ring)}
              className={styles.ring}
            />
          ))}
          {list.map((_, i) => {
            const [x, y] = point(i, 100);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                className={styles.spoke}
              />
            );
          })}
          <polygon
            points={polygon((i) => Math.max(list[i].score, 4))}
            className={styles.shape}
          />
          {list.map((a, i) => {
            const [x, y] = point(i, Math.max(a.score, 4));
            return (
              <circle key={a.key} cx={x} cy={y} r={4} className={styles.dot} />
            );
          })}
          {list.map((a, i) => {
            const [x, y] = point(i, 124);
            return (
              <text
                key={a.key}
                x={x}
                y={y}
                className={styles.axis}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {a.label}
              </text>
            );
          })}
          <text
            x={CENTER}
            y={CENTER}
            className={styles.overall}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {overall}
          </text>
        </svg>
        <ul className={styles.scores}>
          {list.map((a) => (
            <li key={a.key} data-tier={tier(a.score)}>
              <span className={styles.name}>{a.label}</span>
              <span className={styles.bar}>
                <span style={{ width: `${Math.max(a.score, 3)}%` }} />
              </span>
              <b>{Math.round(a.score)}</b>
              <small>{a.display}</small>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
