# Architecture de validation — Reader V1

| | |
|---|---|
| **Type** | Document de référence — **pilotage produit** |
| **Statut** | En vigueur — 2026-08-03 (Phase T0) |
| **Périmètre** | Reader V1 = produit complet (Fabrique → consommation → expérience) |
| **Autorité** | Hiérarchie des validations et critères de jalons ; ne remplace ni contrats, ni ADR |
| **Chapitre de référence** | Item **234** — Insuffisance cardiaque — édition Collège 2022 |

**À lire en cinq minutes :** ce document répond à trois questions — *qu'est-ce qui valide quoi ?*, *qu'est-ce qui fait foi pour prononcer un jalon ?*, *qu'est-ce qui reste volontairement humain ?*

**Documents connexes :**

- Product Review : [`docs/renderer/PRODUCT-REVIEW.md`](../renderer/PRODUCT-REVIEW.md)
- État opérationnel : [`docs/PROJECT_STATE.md`](../PROJECT_STATE.md)
- Shell Reader V1 : [`docs/renderer/20-READER-V1-SHELL-ARCHITECTURE.md`](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md)
- Gate local : [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh)

---

## 1. Pyramide de validation

Du socle industriel au jugement humain — chaque niveau a un **rôle distinct**. Monter la pyramide ne remplace pas les niveaux inférieurs ; prononcer un jalon produit exige d'atteindre le niveau adapté.

```
                    ┌─────────────────────────────┐
                    │  Validation pédagogique     │  ← Future phase
                    │  (Lou — qualité d'apprentissage) │
                    └─────────────────────────────┘
                              ▲
                    ┌─────────────────────────────┐
                    │      Product Review         │  ← Humain, navigateur réel
                    │  (observation produit publié) │
                    └─────────────────────────────┘
                              ▲
                    ┌─────────────────────────────┐
                    │    Product Smoke Tests        │  ← Chemin produit autoritaire
                    │  (bibliothèque + product=1)   │
                    └─────────────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │   Development / Engineering Tests       │  ← Non-régression moteur
         │   (mode dev, annotations, bootstrap)    │
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │         Contract Tests                  │  ← Obligations composants
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │           Unit Tests                    │  ← Modules isolés
         └────────────────────┬────────────────────┘
                              ▲
         ┌────────────────────┴────────────────────┐
         │       Lou Build Validation              │  ← Package publié conforme
         └─────────────────────────────────────────┘
```

| Niveau | Question posée | Mode d'exécution |
|---|---|---|
| **Lou Build Validation** | Le package est-il valide, installable, cohérent ? | CLI `validate` / `build`, tests pipeline |
| **Unit Tests** | Chaque module fonctionne-t-il isolément ? | Node (`npm test`, `test:ci`) |
| **Contract Tests** | Les composants respectent-ils leurs contrats ? | Unit tests ciblés contrats |
| **Development / Engineering Tests** | Le moteur régresse-t-il en mode ingénierie ? | Browser smoke dev (`test:smoke:engineering`) |
| **Product Smoke Tests** | Le produit publié est-il consommable de bout en bout ? | Browser smoke produit (`test:smoke:product`) |
| **Product Review** | Le produit est-il acceptable pour Lou ? | Humain via `product-review-234.sh` |
| **Validation pédagogique** *(réservé)* | La méthode Lou produit-elle un apprentissage efficace ? | Future phase — voir §6 |

**Décision T0 conservée :** Product Smoke et Engineering Smoke sont **séparés**. Seul le chemin produit (`&product=1`, bibliothèque installée) représente le produit livré.

---

## 2. Philosophie de validation

### 2.1 Deux chemins, deux vérités

Le Reader s'exécute selon deux bootstraps :

| Chemin | Entrée | Valide |
|---|---|---|
| **Produit** | `?chapter=…&product=1` — bibliothèque installée | Ce que Lou consomme après publication |
| **Ingénierie** | `?chapter=…` — accès direct au dépôt | Le moteur, plus rapidement, hors cycle publication |

**Une CI verte en mode ingénierie ne prouve pas un produit fonctionnel.** C'est la leçon centrale de la Phase T0.

### 2.2 Rôle de chaque niveau

**Lou Build Validation** — Socle de confiance matérielle. Sans package valide, aucune validation aval n'a de sens. Couvre le pipeline éditorial (stages B→K), l'identité de release (`release_id`, `content_digest`) et l'installabilité en bibliothèque.

**Unit Tests** — Preuve locale de comportement. Rapides, déterministes, indispensables au développement quotidien. **Ne suffisent pas** à prononcer le produit : ils n'exercient ni le Service Worker réel, ni le cycle publication → consommation.

**Contract Tests** — Pont entre gouvernance normative (`docs/contracts/components/`) et code. Chaque lot Reader (D1, D2, D4, D6, D7, AP…) possède des tests de conformité contractuelle. Autoritaires pour *l'obligation technique* du composant, pas pour l'expérience produit globale.

**Development / Engineering Tests** — Filet de non-régression du moteur. Annotations, sélection, intégrité DOM, navigation Composition en bootstrap dev. **Informatifs pour le prononcé d'un jalon produit** ; bloquants pour le merge `main` (non-régression continue).

**Product Smoke Tests** — **Batterie autoritaire du produit automatisé.** Simule le parcours Fabrique → bibliothèque → bootstrap → 7 vues → offline → modules transverses (recherche, préférences, amorçage, session). C'est le gate de confiance avant toute Product Review.

**Product Review** — Jugement humain dans un navigateur réel (hors webdriver). Seule entrée valide : [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh). Autoritaire pour les jalons éditoriaux (Phases 7–8 RPC 234).

**Validation pédagogique** *(future)* — Au-delà du « ça marche » : « est-ce que Lou apprend mieux ? ». Conditionnée par Validation Corpus V1 et Reference Production Chapter 224 ([PDR-C8](../governance/PRODUCT-DECISION-REGISTRY.md), [PDR-B4](../governance/PRODUCT-DECISION-REGISTRY.md)). Emplacement réservé — aucun test créé en T0.

### 2.3 Règle d'autorité

> **Une exigence fonctionnelle possède une seule batterie autoritaire.  
> Les autres tests qui la couvrent sont des non-régressions.**

| Type | Rôle | Exemple |
|---|---|---|
| **Autoritaire** | Seule preuve recevable pour prononcer le jalon sur cette exigence | Offline intégral → Product Smoke `12-offline-d2g` |
| **Non-régression** | Détecte une régression plus tôt ou plus finement, sans faire foi seul | Offline → unit `browser-offline-manager.test.js` |
| **Hors chemin nominal** | Documente un comportement legacy ou de repli — ne pas confondre avec le produit | Fallback prototype 5 onglets → `compliance-nc` NC-3 |

En cas de conflit entre batteries (l'une passe, l'autre échoue), **c'est la batterie autoritaire qui tranche**.

### 2.4 Relation Product Review ↔ automatisé

```
Lou Build + Unit + Contrats + Product Smoke  →  gate automatisé vert
                        ↓
              Product Review (humain)
                        ↓
           Jalon éditorial / Product Freeze
```

Le pré-vol automatisé (`validate-reader-v1.sh`) exécute le gate. La Product Review **ne remplace pas** ce gate — elle le **complète**.

---

## 3. Batteries autoritaires par domaine

Cartographie conceptuelle — une exigence, une autorité. Les tests unitaires et engineering listés implicitement sont des non-régressions.

| Domaine / exigence | Batterie autoritaire | Niveau pyramide |
|---|---|---|
| Package publié conforme (PDR-B2) | `lou-build validate` | Lou Build |
| Pipeline build reproductible | `lou-build test:ci` | Lou Build |
| Identité release (`release_id`, digest) | Tests release-identity + composition-runtime-identity | Contrats |
| Installation bibliothèque atomique | Tests library-install + sync fixture | Contrats |
| Obligation composant (D1, D2, D4, D6, D7, AP…) | Tests *-validation du lot concerné | Contrats |
| Composition 7 vues (navigation) | Product Smoke `17-product-composition-navigation` | Product Smoke |
| Certification offline intégrale | Product Smoke `12-offline-d2g` | Product Smoke |
| Ouverture package publié / consommation | Product Smoke `16-product-consumption` | Product Smoke |
| Auto-repair digest (republication) | Unit `product-consumption.test.js` | Contrats |
| Recherche locale | Product Smoke `13-local-search-d6f` | Product Smoke |
| Préférences d'affichage | Product Smoke `14-display-preferences-d7f` | Product Smoke |
| Amorçage cognitif | Product Smoke `15-cognitive-priming-apf` | Product Smoke |
| Reprise de session (vue Amorçage) | Product Smoke AP-F-08 | Product Smoke |
| Annotations / surlignage | Engineering Smoke `01`…`08` | Engineering *(non-régression)* |
| Patrimoine export / import | Unit learner-snapshot* | Contrats |
| Diagnostics bootstrap produit | Unit `product-bootstrap-errors` | Contrats |
| Acceptabilité produit pour Lou | Product Review (`product-review-234.sh`) | Product Review |
| Qualité pédagogique Lou | *(réservé — §6)* | Validation pédagogique |

**Cas particulier — vue « planned » sans artefact :** autoritaire en mode ingénierie (`10-composition-navigation` CN-07), car le cache offline produit empêche la mutation de manifest en smoke produit.

**Shell Reader V1 :** les Product Smokes valident le chemin produit incluant le chrome actuel. Les critères d'acceptation Shell formalisés ([`20-READER-V1-SHELL-ARCHITECTURE.md` §9](../renderer/20-READER-V1-SHELL-ARCHITECTURE.md)) seront prononcés lors de l'implémentation Shell — hors périmètre T0.

---

## 4. Ce qui n'est volontairement pas automatisé

| Élément | Raison | Mitigation |
|---|---|---|
| **Product Review visuelle / UX Lou** | Le jugement d'usage réel ne se délègue pas à Playwright | Script canonique + Phases 7–8 |
| **Validation pédagogique Lou** | Métrique d'apprentissage, pas de conformité technique | Future phase — §6 |
| **Multi-chapitres en bibliothèque** | Un seul chapitre complet (234) en V1 | Extension post-224 |
| **Build SVG byte-identique** | Dette reproductibilité — hors périmètre produit Reader | Suivi PROJECT_STATE |
| **Slice pipeline complet** | Coût ; couverture partielle suffisante pour le gate | `test:integration` hors gate CI |
| **Outils acquisition PDF** | Maintenance parallèle, hors chemin Reader | Tests locaux outils |
| **Sélection souris réelle (toolbar)** | Fragile en CI ; couverture partielle par API interne | Vérification manuelle si besoin |
| **Service Worker sous webdriver historique** | Limitation connue corrigée T0 pour Product Smoke ; Engineering Smoke reste sans SW | Product Smoke = autorité offline |

---

## 5. Validation pédagogique — Future phase

**Statut :** emplacement réservé. Aucun test créé en T0.

**Intention :** mesurer si la méthode Lou produit un apprentissage efficace — au-delà de « le Reader affiche correctement le contenu ».

**Séquencement projet :**

1. Reference Product Chapter 234 — Phases 2–8 (produit)
2. Reference Production Chapter 224 — Phase 9 (industrialisation)
3. Validation Corpus V1 ([PDR-C8](../governance/PRODUCT-DECISION-REGISTRY.md))
4. **Validation pédagogique Lou** ([PDR-B4](../governance/PRODUCT-DECISION-REGISTRY.md))

**Relation avec cette architecture :** la validation pédagogique **s'ajoutera au sommet de la pyramide**. Elle ne remplacera ni Product Smoke ni Product Review — elle portera sur une question différente : *est-ce que Lou apprend mieux avec ce contenu et cette méthode ?*

**Prérequis identifiés :** corpus qualifié, chapitres de référence validés en production (224), critères pédagogiques Lou formalisés.

---

## 6. Prononcé des jalons

Trois types de jalons — trois niveaux de preuve.

### 6.1 Jalon technique

**Question :** *le moteur et le chemin produit automatisé sont-ils sains ?*

**Conditions (toutes requises) :**

1. Lou Build Validation — `validate` PASS sur le chapitre concerné
2. Unit Tests + Contract Tests — gate CI vert
3. Product Smoke Tests — `test:smoke:product` PASS

**Exemples :** clôture d'un lot Reader (Dn), merge `main`, livraison d'une capacité transverse.

**Non suffisant pour :** Product Freeze, validation éditoriale avec Lou.

### 6.2 Publication

**Question :** *le package est-il publiable et consommable ?*

**Conditions (toutes requises) :**

1. Jalon technique (§6.1)
2. `lou-build build` PASS — package matérialisé
3. Installation bibliothèque vérifiée (sync fixture ou `library:install`)
4. Product Smoke PASS sur le digest publié

**Exemples :** publication intermédiaire 234, republication même `release_id` avec nouveau `content_digest`.

### 6.3 Product Review

**Question :** *le produit est-il acceptable pour Lou dans un usage réel ?*

**Conditions (toutes requises) :**

1. Publication (§6.2)
2. Gate automatisé complet (`validate-reader-v1.sh`) vert
3. Product Review manuelle via [`product-review-234.sh`](../../scripts/product-review-234.sh) — observation OK dans navigateur réel
4. Sept vues utilisables ; republication sans intervention manuelle cache

**Exemples :** Phase 7 RPC 234 (Product Review avec Lou), Phase 8 (Product Freeze).

**Autorité :** suprême pour les décisions éditoriales et le gel produit.

---

## 7. Orchestration CI et scripts

La CI ([`.github/workflows/ci-234.yml`](../../.github/workflows/ci-234.yml)) exécute la pyramide du bas vers le Product Smoke. Engineering Smoke est inclus pour non-régression merge, pas pour le prononcé jalon produit.

| Script | Usage |
|---|---|
| [`scripts/validate-reader-v1.sh`](../../scripts/validate-reader-v1.sh) | Gate local — parcours complet automatisé |
| [`scripts/ci-234.sh`](../../scripts/ci-234.sh) | Parité locale ↔ CI |
| [`scripts/product-review-234.sh`](../../scripts/product-review-234.sh) | Product Review manuelle |
| [`scripts/sync-reader-fixture.mjs`](../../scripts/sync-reader-fixture.mjs) | Sync package → fixture bibliothèque |

**Commandes clés :**

```bash
./scripts/validate-reader-v1.sh              # gate automatisé complet
cd demo/renderer && npm run test:smoke:product   # Product Smoke seul (authoritative)
./scripts/product-review-234.sh              # Product Review (humain)
```

---

## 8. Maintenance et évolution

1. **Nouvelle exigence fonctionnelle** → identifier ou créer **une** batterie autoritaire ; documenter ici.
2. **Nouveau test** → classer : autoritaire ou non-régression. En cas de doute, favoriser Product Smoke pour les exigences produit.
3. **Nouvelle suite dev** → justifier pourquoi elle n'est pas en Product Smoke.
4. **Second chapitre complet** → étendre les Product Smokes ; conserver la règle d'autorité unique.
5. **Compteurs de tests** → ne pas figer dans ce document ni dans PROJECT_STATE ; la pyramide et les commandes gate suffisent.

---

## 9. Acquis Phase T0 (historique)

La Phase T0 a réaligné la validation sur le produit complet :

- Séparation **Product Smoke** / **Engineering Smoke** (Playwright projects)
- Smokes produit autoritaires : consommation (`16`), navigation (`17`), lots D2/D6/D7/AP-F
- Suppression des doublons offline dev (`11-offline` → `11-offline-dev`)
- Script gate unifié `validate-reader-v1.sh`
- Product Review documentée comme niveau distinct et supérieur

Détail des fichiers touchés : commits `e4f733c`, `69310e8`.

---

*Architecture de validation Reader V1 — Phase T0 — document de pilotage. Non normatif sur le plan technique ; autoritaire sur la hiérarchie des validations.*
