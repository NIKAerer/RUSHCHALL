import type { PlayerStats } from "../../api/types";
import { formatDecimal, formatPercent, formatSigned } from "../../lib/format";
import { csPerMinute, objectiveShare } from "./visual";
import styles from "./StatCards.module.css";

interface Card {
  label: string;
  value: string;
  sub: string;
  /** Positif : bon signe (vert), négatif : mauvais (rouge), null : neutre. */
  tone: number | null;
  /** Remplissage de la jauge, entre 0 et 1. */
  gauge: number;
  icon: string;
}

const ICONS = {
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v10M9.5 9.5C10 8.5 14 8 14 10s-4 2-4 4 4 1.5 4.5.5",
  scythe: "M4 20 14 10M14 10c0-4 3-6 7-6-1 4-3 6-7 6Z",
  dragon:
    "M4 18c2-1 3-3 3-6 2 2 4 2 6 1-1-2-1-4 1-6l1 3 4-4-1 6c2 1 3 3 2 6l-3-2c-1 2-3 3-6 3l1 3-4-2-2 1z",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z",
};

const unit = (value: number, low: number, high: number) =>
  Math.max(0, Math.min(1, (value - low) / (high - low)));

/** Les chiffres clés en grand, chacun avec sa jauge, comme les cartes de dpm.lol. */
export function StatCards({ stats }: { stats: PlayerStats }) {
  const at15 = stats.diffs.find((d) => d.minute === 15);
  const cs = csPerMinute(stats);
  const share = objectiveShare(stats);
  const firstBloods = stats.games
    ? stats.grind.totals.firstBloods / stats.games
    : 0;

  const cards: Card[] = [
    {
      label: "Gold @15",
      value: at15 ? formatSigned(at15.gold) : "—",
      sub: at15 ? `devant ${formatPercent(at15.aheadRate)}` : "pas de timeline",
      tone: at15?.gold ?? null,
      gauge: unit(at15?.gold ?? 0, -1500, 1500),
      icon: ICONS.coin,
    },
    {
      label: "CS / min",
      value: formatDecimal(cs),
      sub: "toutes games",
      tone: null,
      gauge: unit(cs, 4, 8),
      icon: ICONS.scythe,
    },
    {
      label: "Objectifs pris",
      value: share === null ? "—" : formatPercent(share),
      sub: "objectifs neutres",
      tone: share === null ? null : share - 0.5,
      gauge: share ?? 0,
      icon: ICONS.dragon,
    },
    {
      label: "First blood",
      value: formatPercent(firstBloods),
      sub: `${stats.grind.totals.firstBloods} sur ${stats.games} games`,
      tone: null,
      gauge: firstBloods,
      icon: ICONS.drop,
    },
  ];

  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <div
          key={card.label}
          className={styles.card}
          data-tone={
            card.tone === null || card.tone === 0
              ? "neutral"
              : card.tone > 0
                ? "good"
                : "bad"
          }
        >
          <div className={styles.head}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={card.icon} />
            </svg>
            <span>{card.label}</span>
          </div>
          <b className={styles.value}>{card.value}</b>
          <div className={styles.gauge}>
            <span style={{ width: `${Math.max(card.gauge, 0.03) * 100}%` }} />
          </div>
          <small>{card.sub}</small>
        </div>
      ))}
    </div>
  );
}
