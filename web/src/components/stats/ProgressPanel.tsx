import { useState, type PointerEvent } from "react";
import type { LpPoint, ProgressPoint } from "../../api/types";
import { formatPercent, formatSigned } from "../../lib/format";
import { LpChart } from "./LpAndHours";
import styles from "./ProgressPanel.module.css";
import common from "./stats.module.css";

/** Nombre de games de la moyenne glissante. */
const WINDOW = 10;

const day = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});
const decimal = (digits: number) => (value: number) =>
  value.toFixed(digits).replace(".", ",");

/** Onglet Progression : la courbe de LP, puis l'évolution de la forme game après game. */
export function ProgressPanel({
  progress,
  lp,
}: {
  progress: ProgressPoint[];
  lp: LpPoint[];
}) {
  return (
    <>
      <section className={common.panel}>
        <h2 className={common.title}>
          LP{" "}
          <small>
            {lp.length < 10
              ? "se remplit à chaque « Mettre à jour »"
              : "relevés de rang de la période"}
          </small>
        </h2>
        <LpChart points={lp} height={200} />
      </section>
      <div className={styles.trends}>
        <Trend
          title="Winrate"
          values={rolling(progress, (p) => (p.win ? 1 : 0))}
          format={formatPercent}
          range={[0, 1]}
        />
        <Trend
          title="Note"
          values={rolling(progress, (p) => p.rating)}
          format={decimal(1)}
        />
        <Trend
          title="CS / min"
          values={rolling(progress, (p) => p.csPerMinute)}
          format={decimal(1)}
        />
      </div>
      <LpByDay progress={progress} />
    </>
  );
}

/**
 * Moyenne des WINDOW dernières games, à chaque game. Les premières games, sur une fenêtre
 * incomplète, sont laissées de côté dès qu'il y en a assez : elles feraient des pics sans sens.
 */
function rolling(
  progress: ProgressPoint[],
  pick: (p: ProgressPoint) => number,
): number[] {
  const values = progress.map((_, i) => {
    const slice = progress.slice(Math.max(0, i - WINDOW + 1), i + 1);
    return slice.reduce((sum, p) => sum + pick(p), 0) / slice.length;
  });
  return values.length > WINDOW ? values.slice(WINDOW - 1) : values;
}

const WIDTH = 300;
const HEIGHT = 90;
const PAD = 6;

/** `range` fixe l'échelle (0 à 100 % pour le winrate) ; sans lui, la courbe va du plus bas au plus haut. */
function Trend({
  title,
  values,
  format,
  range,
}: {
  title: string;
  values: number[];
  format: (value: number) => string;
  range?: [number, number];
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (values.length < 2) {
    return (
      <section className={common.panel}>
        <h2 className={common.title}>{title}</h2>
        <p className={common.empty}>Pas assez de games.</p>
      </section>
    );
  }

  const [low, high] = range ?? [Math.min(...values), Math.max(...values)];
  const x = (i: number) => PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2);
  const y = (v: number) =>
    PAD + (1 - (v - low) / (high - low || 1)) * (HEIGHT - PAD * 2);
  const line = values
    .map(
      (v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
    )
    .join(" ");
  const shown = hover ?? values.length - 1;
  const delta = values[values.length - 1] - values[0];

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setHover(
      Math.round(
        ((event.clientX - box.left) / box.width) * (values.length - 1),
      ),
    );
  };

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        {title} <small>moyenne sur {WINDOW} games</small>
      </h2>
      <div className={styles.value}>
        <b>{format(values[shown])}</b>
        {hover === null ? (
          <span className={delta >= 0 ? common.good : common.bad}>
            {signedDelta(delta, format)}
          </span>
        ) : (
          <span className={common.sub}>
            {values.length - 1 - shown === 0
              ? "dernière game"
              : `il y a ${values.length - 1 - shown} games`}
          </span>
        )}
      </div>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title} : ${format(values[values.length - 1])}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <path
          d={`${line} L${x(values.length - 1)} ${HEIGHT} L${x(0)} ${HEIGHT} Z`}
          className={styles.area}
        />
        <path
          d={line}
          className={styles.line}
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && (
          <line
            x1={x(shown)}
            x2={x(shown)}
            y1={0}
            y2={HEIGHT}
            className={styles.cross}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
    </section>
  );
}

/** « +4 % » pour un winrate, « +0,3 » pour une note : l'écart s'écrit comme la valeur. */
function signedDelta(delta: number, format: (value: number) => string): string {
  const text = format(Math.abs(delta));
  return delta > 0 ? `+${text}` : delta < 0 ? `−${text}` : text;
}

function LpByDay({ progress }: { progress: ProgressPoint[] }) {
  const days = new Map<string, { t: number; lp: number; games: number }>();
  for (const p of progress) {
    if (p.lpChange === null) continue;
    const key = new Date(p.t).toDateString();
    const entry = days.get(key) ?? { t: p.t, lp: 0, games: 0 };
    days.set(key, {
      ...entry,
      lp: entry.lp + p.lpChange,
      games: entry.games + 1,
    });
  }
  const rows = [...days.values()].slice(-14);
  const most = Math.max(1, ...rows.map((r) => Math.abs(r.lp)));

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        LP par jour{" "}
        <small>{rows.length > 0 ? "14 derniers jours joués" : ""}</small>
      </h2>
      {rows.length === 0 ? (
        <p className={common.empty}>
          Les LP s'affichent pour les games jouées après le début du suivi.
          Clique sur « Mettre à jour » après chaque game.
        </p>
      ) : (
        <div className={styles.days}>
          {rows.map((r) => (
            <div
              key={r.t}
              className={styles.day}
              title={`${day.format(r.t)} : ${formatSigned(r.lp)} LP sur ${r.games} game${r.games > 1 ? "s" : ""}`}
            >
              <span className={r.lp >= 0 ? common.good : common.bad}>
                {formatSigned(r.lp)}
              </span>
              <div className={styles.track}>
                <span
                  className={r.lp >= 0 ? styles.up : styles.down}
                  style={{ height: `${(Math.abs(r.lp) / most) * 50}%` }}
                />
              </div>
              <span className={styles.dayLabel}>{day.format(r.t)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
