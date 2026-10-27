import { formatPercent } from "../../lib/format";
import { winrateTone } from "./tone";
import styles from "./stats.module.css";

/** Barre victoires / défaites et winrate, comme sur OP.GG. */
export function WinRate({ games, wins }: { games: number; wins: number }) {
  const losses = games - wins;
  const ratio = games === 0 ? 0 : wins / games;

  return (
    <div className={styles.wr} title={`${wins} victoires, ${losses} défaites`}>
      <div className={styles.wrBar}>
        {wins > 0 && (
          <span className={styles.wins} style={{ flexGrow: wins }}>
            {wins}V
          </span>
        )}
        {losses > 0 && (
          <span className={styles.losses} style={{ flexGrow: losses }}>
            {losses}D
          </span>
        )}
      </div>
      <span className={`${styles.wrValue} ${winrateTone(ratio) ?? ""}`}>
        {formatPercent(ratio)}
      </span>
    </div>
  );
}
