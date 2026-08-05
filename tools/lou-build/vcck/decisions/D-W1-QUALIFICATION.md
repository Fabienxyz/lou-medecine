# D-W1 — Qualification des familles de composition W1

## Décision

Statut : APPROVED

Les familles suivantes passent de EXPERIMENTAL à QUALIFIED :

- chain — contrat W1-1 — SVG
- dependent-sequence — contrat W1-2 — SVG
- two-pole — contrat W1-3 — HTML
- flat-concurrent — contrat W1-4 — HTML

Aucune famille n'est FROZEN.

## Fondements

- audit indépendant final : INDEPENDENT_W1_PASS_WITH_CONDITIONS ;
- conditions finales fermées et vérifiées ;
- validation Codex : PASS_W1_6_1_CODEX_GATE ;
- validation de qualification : 215/215 tests, SKIP 0 ;
- 40/40 PNG approuvés ;
- 8/8 snapshots artefact ;
- 60/60 preuves responsive ;
- 20/20 surfaces stress ;
- budgets à 90 % et dépassements +1 authentiquement bloqués ;
- attestation perceptuelle liée au manifeste approuvé ;
- aucun finding critique ou élevé ouvert.

## Portée

QUALIFIED autorise l'utilisation de ces compositions génériques dans un replay contrôlé, à l'intérieur des contrats et budgets enregistrés.

La décision ne qualifie pas :

- un chapitre ;
- un contenu médical ;
- Word ;
- W2 ;
- les familles hors W1 ;
- le pipeline P0 global.

Toute topologie ou charge hors contrat doit être refusée avant rendu.

Toute dérive de snapshot, surface, attestation ou déterminisme bloque l'usage sans réécrire automatiquement le statut persistant.

## Dettes maintenues

- VCCK_P0_BLOCKED ;
- identity hors W1 ;
- familles W2 non qualifiées ;
- protocole de replay à définir avant production massive.

## Git

La décision est matérialisée dans le commit local de qualification W1.

Aucun push n'est inclus dans cette décision.
