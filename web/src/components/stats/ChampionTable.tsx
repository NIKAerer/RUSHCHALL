import { Fragment, useState } from "react";
import type { ChampionStats } from "../../api/types";
import { useChampion } from "../../ddragon/useStaticData";
import { formatDecimal, formatNumber, kdaRatio } from "../../lib/format";
import { ChampionIcon } from "../GameIcons";
import { FullMatchups } from "./MatchupsPanel";
import { kdaTone } from "./tone";
import { WinRate } from "./WinRate";
import styles from "./ChampionTable.module.css";
import common from "./stats.module.css";

/** Stats par champion ; un clic ouvre ses matchups contre l'adversaire au même poste. */
/** Champions affichés avant « Voir tout ». */
const CHAMPIONS_SHOWN = 8;

export function ChampionTable({ champions }: { champions: ChampionStats[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);

  return (
    <section className={common.panel}>
      <h2 className={common.title}>Champions</h2>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.left}>
                Champion
              </th>
              <th scope="col" className={styles.left}>
                Winrate
              </th>
              <th scope="col">KDA</th>
              <th scope="col">CS/min</th>
              <th scope="col">Gold@15</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {(all ? champions : champions.slice(0, CHAMPIONS_SHOWN)).map(
              (champion) => (
                <Fragment key={champion.championName}>
                  <ChampionRow
                    champion={champion}
                    open={open === champion.championName}
                    onToggle={() =>
                      setOpen((o) =>
                        o === champion.championName
                          ? null
                          : champion.championName,
                      )
                    }
                  />
                  {open === champion.championName && (
                    <tr className={styles.matchupsRow}>
                      <td colSpan={6}>
                        <FullMatchups matchups={champion.matchups} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ),
            )}
          </tbody>
        </table>
      </div>
      <MoreButton
        hidden={champions.length - CHAMPIONS_SHOWN}
        all={all}
        onToggle={() => setAll((a) => !a)}
      />
    </section>
  );
}

function ChampionRow({
  champion,
  open,
  onToggle,
}: {
  champion: ChampionStats;
  open: boolean;
  onToggle: () => void;
}) {
  const { name } = useChampion(champion.championName);

  return (
    <tr className={styles.row}>
      <td className={styles.left}>
        <button
          type="button"
          className={styles.champion}
          aria-expanded={open}
          onClick={onToggle}
        >
          <ChampionIcon championName={champion.championName} size={32} />
          <span>{name}</span>
        </button>
      </td>
      <td className={styles.left}>
        <WinRate games={champion.games} wins={champion.wins} />
      </td>
      <td>
        <div
          className={`${styles.main} ${kdaTone((champion.kills + champion.assists) / Math.max(1, champion.deaths)) ?? ""}`}
        >
          {kdaRatio(champion.kills, champion.deaths, champion.assists)}
        </div>
        <div className={common.sub}>
          {formatDecimal(champion.kills)}/{formatDecimal(champion.deaths)}/
          {formatDecimal(champion.assists)}
        </div>
      </td>
      <td className={styles.main}>{formatDecimal(champion.csPerMinute)}</td>
      <td className={styles.main}>
        {champion.goldAt15 === null ? "—" : formatNumber(champion.goldAt15)}
      </td>
      <td className={styles.main}>{formatDecimal(champion.rating)}</td>
    </tr>
  );
}

function MoreButton({
  hidden,
  all,
  onToggle,
}: {
  hidden: number;
  all: boolean;
  onToggle: () => void;
}) {
  if (hidden <= 0) return null;
  return (
    <button type="button" className={styles.more} onClick={onToggle}>
      {all ? "Réduire" : `Voir tout (+${hidden})`}
    </button>
  );
}
