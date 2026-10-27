import { useState } from "react";
import { useProfile } from "../../api/queries";
import type { PlayerStats } from "../../api/types";
import { rankEmblem } from "../../ddragon/ddragon";
import {
  formatDecimal,
  formatPercent,
  formatSigned,
  kdaRatio,
} from "../../lib/format";
import { tierLabel } from "../../lib/riot";
import { LpChart } from "./LpAndHours";
import { kdaTone, winrateTone } from "./tone";
import { axes } from "./visual";
import styles from "./StatsHero.module.css";
import common from "./stats.module.css";

/** En-tête de la page Stats : le rang sur une carte foncée, puis le bilan de la sélection en cartes. */
export function StatsHero({ stats }: { stats: PlayerStats }) {
  const { data: profile } = useProfile();
  const [emblemFailed, setEmblemFailed] = useState(false);
  const solo = profile?.ranked.find((r) => r.queue === "solo");
  const { form } = stats;
  const ratio = stats.games ? stats.wins / stats.games : 0;
  const lpDelta =
    form.lp.length > 1
      ? form.lp[form.lp.length - 1].ladder - form.lp[0].ladder
      : null;
  // Les ex aequo sont affichés ensemble plutôt que départagés au hasard.
  const scored = axes(stats).map((axis) => ({
    ...axis,
    score: Math.round(axis.score),
  }));
  const [top, bottom] = [
    Math.max(...scored.map((a) => a.score)),
    Math.min(...scored.map((a) => a.score)),
  ];
  const best = scored.filter((a) => a.score === top);
  const worst = scored.filter((a) => a.score === bottom);

  return (
    <section className={styles.hero}>
      <div className={styles.rank}>
        <div className={styles.rankHead}>
          {solo && !emblemFailed && (
            <img
              src={rankEmblem(solo.tier)}
              alt=""
              onError={() => setEmblemFailed(true)}
            />
          )}
          <span>
            {solo
              ? `${tierLabel(solo.tier, solo.division)} · Solo/Duo`
              : "Solo/Duo"}
          </span>
        </div>
        {solo && (
          <b className={styles.lp}>
            {solo.leaguePoints} <small>LP</small>
          </b>
        )}
        <LpChart points={form.lp} />
        {lpDelta !== null && (
          <span className={styles.delta}>
            {formatSigned(lpDelta)} LP sur la période
          </span>
        )}
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.label}>Winrate</span>
          <b className={`${styles.value} ${winrateTone(ratio) ?? ""}`}>
            {formatPercent(ratio)}
          </b>
          <span className={styles.sub}>
            {stats.wins} V · {stats.games - stats.wins} D
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>KDA</span>
          <b
            className={`${styles.value} ${kdaTone((stats.kills + stats.assists) / Math.max(1, stats.deaths)) ?? ""}`}
          >
            {kdaRatio(stats.kills, stats.deaths, stats.assists)}
          </b>
          <span className={styles.sub}>sur {stats.games} games</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>Note moyenne</span>
          <b className={styles.value}>{formatDecimal(stats.rating)}</b>
          <span className={styles.sub}>
            {stats.mvp} MVP · {stats.ace} ACE
          </span>
        </div>
        <div className={`${styles.card} ${styles.profile}`}>
          <span className={styles.label}>Ton profil</span>
          <span className={common.good}>
            ↑ {best.map((a) => a.label).join(" · ")} {top}
          </span>
          <span className={common.bad}>
            ↓ {worst.map((a) => a.label).join(" · ")} {bottom}
          </span>
        </div>
      </div>
    </section>
  );
}
