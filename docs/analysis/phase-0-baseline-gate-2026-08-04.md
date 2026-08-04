# Phase 0 — Baseline gate (prototypage éditorial et migration)

| | |
|---|---|
| **Type** | Analyse de gate — **preuve de décision** |
| **Statut** | Acté — 2026-08-04 |
| **Autorité** | Observation opérationnelle — complète [`PROJECT_STATE.md`](../PROJECT_STATE.md) ; ne remplace ni ADR, ni contrats |
| **Périmètre** | Plan de prototypage éditorial et migration (post-audit Opus) — **distinct** des Phases RPC 234 (roadmap opérationnelle Reader) |

Ce document enregistre la clôture formelle de la **Phase 0 migration** avec réserves, la baseline Git de référence et les conditions de réouverture de la Phase 2.

---

## 1. Baseline Git

| Élément | Valeur |
|---|---|
| **Commit** | `5734832d907e6274fd54ba1756e8231c3a6d78e2` |
| **Message** | `feat(reader): complete SVG Highlight Bridge V1` |
| **Tag technique produit** | `svg-highlight-bridge-v1` |
| **Tag baseline Phase 0** | `baseline-phase-0-2026-08-04` |
| **Message tag baseline** | `Phase 0 baseline — editorial prototyping authorized, technical migration blocked pending reserves` |

Le tag `baseline-phase-0-2026-08-04` pointe sur le **commit**, indépendamment des modifications documentaires locales postérieures.

---

## 2. Validations observées (DEV — 2026-08-04)

| Validation | Résultat | Remarque |
|---|---|---|
| Reader unit tests | **760/760 PASS** | `demo/renderer` — `npm test` |
| lou-build tests | **198/198 PASS** | Audit initial Phase 0 (non re-exécuté dans cette clôture) |
| Chapitre 234 — `lou-build validate` | **PASS** | Package produit complet ; Release `complete` |
| Engineering smokes | **51/54 PASS** | 3 anomalies connues de baseline (cf. §4) |
| Product smokes | **77/80 PASS** | 3 anomalies connues de baseline (cf. §4) |
| Product Review humaine | **Non exécutée** | Procédure `./scripts/product-review-234.sh` — réservée |
| Rollback | **Documenté, non testé** | Procédure dans le rapport baseline DEV du 2026-08-04 |
| Gate PAS / RELEASE | **Non exécutés** | Hors périmètre clôture documentaire |

Les six échecs navigateur sont des **anomalies connues de baseline** — pas des régressions par rapport à l’audit initial (smokes non exécutés par l’auditeur).

---

## 3. Décision de gate par phase

| Phase | Intitulé | Décision |
|---|---|---|
| **0** | Baseline et audit migration | **Clôturée avec réserves** |
| **1A** | Éditoriale hors Reader | **Autorisée** |
| **1B** | Conception | **Autorisée** — conception et analyse uniquement ; pas d’engagement d’intégration technique |
| **2** | Intégration et migration technique | **Bloquée** |

### Phase 1A — périmètre autorisé

- Travail éditorial sur corpus source, matrices de couverture, analyses cardio.
- Préparation contenu **sans** modification Reader, packages publiés ni identité de release.

### Phase 1B — périmètre autorisé

- Conception migration, architecture documentaire, choix méthodologiques.
- **Sans** build mutant, publication package, ni correction des smokes rouges de baseline.

### Phase 2 — conditions de réouverture

La Phase 2 d’intégration/migration technique ne s’ouvre que lorsque **toutes** les réserves bloquantes ci-dessous sont levées ou explicitement arbitrées par le propriétaire :

1. Product smokes Product **verts** sur baseline (gate RELEASE) ou dérogation documentée test par test.
2. Product Review humaine **exécutée** et consignée (parcours offline réel, SW auto-enregistré).
3. Rollback **testé** au moins une fois sur un scénario documenté.
4. Fixture `demo/renderer/test/fixtures/product-library/` **assainie** ou remplacée par bibliothèque d’exécution gitignored (`.local/product-review-library/`).
5. Décision tranchée sur le **330** : compléter la release ou choisir un autre package complet post-validation du prototype 234.
6. Chapitre cible de migration disposant de `publication_version`, `release_id` et `content_digest`.

---

## 4. Réserves restantes

| # | Réserve | Statut |
|---|---|---|
| R1 | **Six smokes rouges** — SF-01, SF-02, OF-DEV-01 (Engineering) ; OF-D2-10, DP-F-17, AP-F-EDN-CROSS (Product) | Connu baseline — non corrigé |
| R2 | **Product Review humaine** non exécutée | Ouverte |
| R3 | **Service Worker auto-enregistré** (`app.js`, hors `navigator.webdriver`) non validé en parcours utilisateur réel | Ouverte |
| R4 | **Rollback** documenté mais non testé | Ouverte |
| R5 | **Fixture bibliothèque** (`library.json` avec `offline_ready` hors HEAD) — impropre comme bibliothèque d’exécution fiable | Ouverte |
| R6 | **Patrimoine apprenant** — dépendance résiduelle aux identifiants legacy (projection slugs) | Ouverte |
| R7 | **Chapitre 330** — tranche éditoriale incomplète comme release produit (cf. §5) | Ouverte — bloquant Phase 2 |

---

## 5. Statut du chapitre 330

| Attribut | Valeur |
|---|---|
| **Rôle actuel** | Tranche éditoriale / **understanding slice** (archétype tableaux-posologies) |
| **Contenu partiel exploitable** | Matériau pour vues **Modèle mental**, **Notions**, **Collège officiel** uniquement |
| **Non publiable** | Absence de `publication_version`, `release_id`, `content_digest` dans `01-learning/chapters/cardio/330/manifest.json` |
| **Non contre-épreuve 7 vues** | Pas de QCM, scénarios cliniques, Amorçage cognitif ni release `complete` — **ne remplace pas** le 234 |
| **Décision différée** | Compléter le 330 en package produit **ou** choisir un autre chapitre complet après validation du prototype 234 |

**Correction d’interprétation :** les documents historiques (Phase 3.5, ADR-004 au moment du gel acquisition) peuvent mentionner un `validate PASS` antérieur sur la **tranche understanding** ; l’état **observé au 2026-08-04** est un **échec de validation release** et une **absence d’identité de publication**. Le 330 **n’est pas** le second package produit complet FIL B aux côtés du 234.

---

## 6. Anomalies navigateur connues (baseline — non régressions)

| Test | Projet | Classification |
|---|---|---|
| SF-01, SF-02 | Engineering | Timeout binding `LouInlineFormatting` — fixture SVG formatting |
| OF-DEV-01 | Engineering | `pageerror` `location` — dégradation dev (informatif) |
| OF-D2-10 | Product | `pageerror` `location` — SW actif mais erreur JS |
| DP-F-17 | Product | Timeout clavier thème — probable limite headless |
| AP-F-EDN-CROSS | Product | Fixture cross-chapter EDN — `.cp-edn-ref--navigable` absent |

---

## 7. Service Worker — couverture réelle

- Playwright : `serviceWorkers: "allow"` ; **`app.js` n’enregistre pas** le SW si `navigator.webdriver` (automation).
- Product smokes : enregistrement SW **manuel** via helpers — couvre offline/certification/repair, **pas** le parcours Product Review réel.
- **Limite :** les smokes **ne prononcent pas** le comportement offline utilisateur final.

---

## 8. Rollback (documenté — non testé)

Point de référence : commit `5734832…`, tags `svg-highlight-bridge-v1` et `baseline-phase-0-2026-08-04`.

| Type | Action (lecture / procédure) |
|---|---|
| **Applicatif** | `git checkout 5734832… -- <chemins>` — préserver worktree local via stash |
| **Packages** | Comparer `content_digest` manifest vs catalogue ; `sync-reader-fixture.mjs` vers `.local/product-review-library/` |
| **Données apprenantes** | Export patrimoine (E-C) avant rollback ; IndexedDB / caches SW indépendants du code Git |

**Aucun rollback n’a été exécuté ni testé** lors de cette clôture.

---

## 9. Vocabulaire produit (vérification documentaire)

Les **sept vues Reader** sont définies dans [`00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md).

Les projections de production (`story`, `overview`, `mechanisms`, `clinical-reasoning`, etc.) **ne sont pas** des onglets produit — ce document et [`PROJECT_STATE.md`](../PROJECT_STATE.md) les traitent comme artefacts Fabrique uniquement.

---

## 10. Références

- État opérationnel : [`PROJECT_STATE.md`](../PROJECT_STATE.md)
- **Plan chantier Phase 1A :** [`plans/editorial-prototyping-and-migration-plan.md`](../plans/editorial-prototyping-and-migration-plan.md)
- Gate Phase 0 : [`phase-0-baseline-gate-2026-08-04.md`](../analysis/phase-0-baseline-gate-2026-08-04.md)
- Architecture validation : [`TEST_ARCHITECTURE_V1.md`](../testing/TEST_ARCHITECTURE_V1.md)
- Product Review : [`PRODUCT-REVIEW.md`](../renderer/PRODUCT-REVIEW.md)
- Audit chaîne Fabrique→Reader : [`reader-fabrique-chain-architecture-audit.md`](reader-fabrique-chain-architecture-audit.md)

---

*Gate Phase 0 — 2026-08-04 — clôture avec réserves ; tag `baseline-phase-0-2026-08-04`.*
