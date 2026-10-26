# Challenger

Outil d'analyse de games League of Legends, pensé pour grimper en jungle.

- `api/` : API Symfony 7.4 (PHP 8.2+). C'est elle seule qui parle à l'API Riot, et elle met les réponses en cache sur disque.
- `web/` : front React 19 + Vite + TypeScript.

La V1 affiche le profil (rangs Solo/Duo et Flex), l'historique des games façon OP.GG et, pour chaque game, le récap complet des deux équipes.

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

Ouvre http://localhost:5173. Le joueur affiché par défaut se règle dans `web/.env` (`VITE_DEFAULT_RIOT_ID`), le serveur dans `api/.env` (`RIOT_PLATFORM`, `euw1` par défaut).

## Tests

```bash
npm run test         # tests de l'API, sans aucun appel réel à Riot
npm run lint         # ESLint et TypeScript sur le front
```

## API

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | `/api/profiles/{gameName}/{tagLine}` | Compte, niveau, icône et rangs |
| GET | `/api/players/{puuid}/matches?start=0&count=10&queue=420` | Historique, 20 games max par page |
| GET | `/api/matches/{matchId}` | Détail d'une game : les 10 joueurs et les objectifs |

Les erreurs ont la forme `{"error": "invalid_api_key", "message": "..."}`. Codes possibles : `not_found`, `invalid_api_key`, `rate_limited`, `riot_unavailable`, `bad_request`.
