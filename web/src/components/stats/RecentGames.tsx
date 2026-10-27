import { useGames } from "../../api/queries";
import type { MatchSummary } from "../../api/types";
import { useChampion } from "../../ddragon/useStaticData";
import {
  formatDuration,
  formatPercent,
  formatSigned,
  kdaRatio,
} from "../../lib/format";
import { ChampionIcon } from "../GameIcons";
import { RatingBadge } from "../RatingBadge";
import styles from "./RecentGames.module.css";
import common from "./stats.module.css";

const SHOWN = 5;

/** Les dernières games en version courte, pour l'aperçu des stats. */
export function RecentGames() {
  const { data } = useGames();
  const games = data?.pages.flat().slice(0, SHOWN) ?? [];

  return (
    <section className={common.panel}>
      <h2 className={common.title}>Dernières games</h2>
      {games.length === 0 ? (
        <p className={common.empty}>Aucune game en base.</p>
      ) : (
        <div>
          {games.map((game) => (
            <GameLine key={game.matchId} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}

function GameLine({ game }: { game: MatchSummary }) {
  const { player } = game;
  const { name } = useChampion(player.championName);
  const outcome = game.remake ? "remake" : player.win ? "win" : "loss";

  return (
    <div className={styles.line}>
      <ChampionIcon championName={player.championName} size={44} />
      <div className={styles.score}>
        <b>
          {player.kills} / <em>{player.deaths}</em> / {player.assists}
        </b>
        <small>
          {name} · {kdaRatio(player.kills, player.deaths, player.assists)} KDA
        </small>
      </div>
      <span className={`${styles.outcome} ${styles[outcome]}`}>
        {outcome === "win"
          ? "Victoire"
          : outcome === "loss"
            ? "Défaite"
            : "Remake"}{" "}
        {formatDuration(game.durationSeconds)}
      </span>
      <span className={styles.meta}>
        KP {formatPercent(player.killParticipation)}
      </span>
      <span
        className={`${styles.lp} ${game.lpChange === null ? "" : game.lpChange >= 0 ? common.good : common.bad}`}
      >
        {game.lpChange === null ? "" : `${formatSigned(game.lpChange)} LP`}
      </span>
      <div className={styles.rating}>
        {!game.remake && <RatingBadge rating={player.rating} />}
      </div>
    </div>
  );
}
