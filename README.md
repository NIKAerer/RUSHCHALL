# Challenger

Outil d'analyse des games classées Solo/Duo de KGB#Мажор, pensé pour grimper en jungle.

- `api/` : API Symfony 7.4 (PHP 8.2+). C'est elle seule qui parle à l'API Riot, et elle met les réponses en cache sur disque.
- `web/` : front React 19 + Vite + TypeScript.

L'application suit un seul joueur (`TRACKED_RIOT_ID` dans `api/.env`). Elle affiche son profil (rangs Solo/Duo et Flex), son historique Solo/Duo façon OP.GG et, pour chaque game, le récap complet des deux équipes.

## Prérequis

- PHP 8.2 ou plus, avec Composer
- Node.js 20 ou plus
- Une clé de développement Riot : https://developer.riotgames.com (elle expire toutes les 24 h)

## Installation

```bash
npm install          # outils du dépôt (lance l'API et le front en une commande)
npm run setup        # dépendances de l'API et du front
```

Crée ensuite le fichier `api/.env.local`. Il n'est jamais versionné :

```dotenv
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APP_SECRET=une-chaine-aleatoire
```

Quand la clé expire, régénère-la sur le portail Riot et remplace la ligne `RIOT_API_KEY`. Pas besoin de relancer.

## Lancer

```bash
npm run dev
```

Ouvre http://localhost:5173. À l'ouverture et avec le bouton « Mettre à jour », le site récupère les 10 games les plus récentes qui manquent en base.

## Base des games classées

Les games classées Solo/Duo (file 420) du joueur suivi sont gardées dans une base SQLite, `api/var/challenger.db`, créée toute seule. Chaque game garde la réponse complète de Riot, avec les stats des 10 joueurs de la partie : les stats se calculeront à partir de la base, sans redemander à Riot. On ne télécharge jamais l'historique d'un autre joueur.

```bash
npm run sync                              # première fois : toutes les games depuis SYNC_SINCE (04/10/2026)
npm run sync                              # ensuite : seulement les games jouées depuis la dernière en base
npm run sync -- --since=2026-09-01        # repartir d'une autre date
```

Une game déjà en base ne coûte plus aucune requête. Les appels sont espacés pour rester sous les limites de la clé de développement (20 requêtes par seconde, 100 toutes les 2 minutes, réglables avec `RIOT_RATE_LIMITS` dans `api/.env.local`).

## Tests

```bash
npm run test         # tests de l'API, sans aucun appel réel à Riot
npm run lint         # ESLint et TypeScript sur le front
```

## API

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | `/api/profile` | Compte, niveau, icône et rangs du joueur suivi |
| GET | `/api/games?start=0&count=10` | Historique Solo/Duo lu en base (50 games max par page) |
| GET | `/api/games/{matchId}` | Détail d'une game : les 10 joueurs et les objectifs |
| POST | `/api/games/sync` | Récupère jusqu'à 10 nouvelles games chez Riot |

Les erreurs ont la forme `{"error": "invalid_api_key", "message": "..."}`. Codes possibles : `not_found`, `invalid_api_key`, `rate_limited`, `riot_unavailable`, `bad_request`.
