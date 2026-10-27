import type { JungleStats, WinRecord, Zone } from "../../api/types";
import { formatDuration } from "../../lib/format";
import { ZoneIcon } from "../MomentFeed";
import { WinRate } from "./WinRate";
import styles from "./JunglePanel.module.css";
import common from "./stats.module.css";

const CAMPS: Record<string, { label: string; short: string }> = {
  blue: { label: "Buff bleu", short: "Bleu" },
  gromp: { label: "Gromp", short: "Gromp" },
  wolves: { label: "Loups", short: "Loups" },
  raptors: { label: "Corbins", short: "Corb." },
  red: { label: "Buff rouge", short: "Rouge" },
  krugs: { label: "Krugs", short: "Krugs" },
  scuttle: { label: "Carapateur", short: "Crabe" },
};

/** Nombre de premiers clears affichés : au-delà, ce sont des routes jouées une fois. */
const ROUTES_SHOWN = 5;

export function JunglePanel({ jungle }: { jungle: JungleStats }) {
  if (jungle.games === 0) {
    return (
      <section className={common.panel}>
        <h2 className={common.title}>Jungle</h2>
        <p className={common.empty}>Aucune game en jungle avec timeline.</p>
      </section>
    );
  }

  return (
    <section className={common.panel}>
      <h2 className={common.title}>
        Premier clear <small>{jungle.games} games</small>
      </h2>

      <div className={styles.block}>
        <span className={common.label}>Départ</span>
        <ul className={styles.list}>
          {jungle.starts.map((record) => (
            <li key={record.key} className={styles.line}>
              <Camp camp={record.key} />
              <WinRate games={record.games} wins={record.wins} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <span className={common.label}>Routes</span>
        <ul className={styles.list}>
          {jungle.routes.slice(0, ROUTES_SHOWN).map((record) => (
            <li key={record.key} className={styles.route}>
              <ol className={styles.camps}>
                {record.key.split(">").map((camp, index) => (
                  <li key={index}>
                    <Camp camp={camp} />
                  </li>
                ))}
              </ol>
              <WinRate games={record.games} wins={record.wins} />
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.block}>
        <span className={common.label}>
          1er gank{" "}
          {jungle.firstGankAt !== null && (
            <b className={styles.time}>~{formatDuration(jungle.firstGankAt)}</b>
          )}
        </span>
        <ul className={styles.list}>
          {jungle.firstGanks.map((record: WinRecord) => (
            <li key={record.key} className={styles.line}>
              <span className={styles.lane}>
                <ZoneIcon zone={record.key as Zone} />
                {record.key}
              </span>
              <WinRate games={record.games} wins={record.wins} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Camp({ camp }: { camp: string }) {
  const known = CAMPS[camp];
  return (
    <span className={styles.camp} data-camp={camp} title={known?.label ?? camp}>
      {known?.short ?? camp}
    </span>
  );
}
