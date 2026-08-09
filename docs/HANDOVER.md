# Lou Médecine — Handover agent IA

| | |
|---|---|
| **Type** | Point d'entrée opérationnel — **informatif** |
| **Statut** | 2026-08-09 — **Architecture Foundations V1 terminée** ; architecture graphique **gelée** ; prochain chantier **Golden Corpus V1** |
| **Autorité** | **Aucune** — renvoie vers les sources ; ADR et contrats font foi en cas de conflit |
| **Transition** | Reprise avec **ChatGPT / Codex** (pilotage produit) + **Cursor** (implémentation sur autorisation) |

---

## 1. Lire en premier

| Ordre | Document | Pourquoi |
|---|---|---|
| **1** | **Ce fichier** (`HANDOVER.md`) | État le plus à jour pour la reprise (2026-08-09) |
| **2** | [`PROJECT_STATE.md`](PROJECT_STATE.md) | État observé — synchronisé 2026-08-09 |
| **3** | [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Intention globale — séquence post-Architecture Foundations |
| **4** | [`governance/EXECUTION_MODE_V1.md`](governance/EXECUTION_MODE_V1.md) | Comportement agent en Execution Mode V1 |

**Architecture graphique — gelée (ne pas rouvrir sans instruction explicite) :**

| Document | Rôle |
|---|---|
| [Graphical Architecture](architecture/GRAPHICAL-ARCHITECTURE.md) | Frontières de la chaîne graphique complète |
| [Visual Grammar v0.1](architecture/VISUAL-GRAMMAR-V0.1.md) | Langage graphique prescriptif |
| [Visual Grammar Runtime](architecture/VISUAL-GRAMMAR-RUNTIME.md) | Runtime minimal gelé |
| [Projection Foundation](architecture/PROJECTION-FOUNDATION.md) | Vérification report-only de projection |
| [SVG Graphic Language V1](contracts/components/SVG-GRAPHIC-LANGUAGE-V1.md) | Contrat Theme |
| Theme officiel | [`tools/lou-build/config/svg-graphic-language-v1.yaml`](../tools/lou-build/config/svg-graphic-language-v1.yaml) |
| [ADR-008](adr/ADR-008-vcck-industrial-composition-pipeline.md) | Autorité de composition VCCK |
| [Contrat 05](contracts/05-VISUAL-GRAMMAR.md) | Autorité sémantique visualSpec |

**Normes (si tâche technique) :** [`contracts/00-INDEX.md`](contracts/00-INDEX.md) · [`renderer/00-READER-V1-PRODUCT-MODEL.md`](renderer/00-READER-V1-PRODUCT-MODEL.md).

---

## 2. Situation actuelle

### Architecture Foundations V1 — terminée (2026-08-09)

| Couche | Statut |
|---|---|
| Visual Grammar v0.1 | **Gelé** |
| Visual Grammar Runtime | **Gelé** |
| Theme V1 (`svg-graphic-language-v1.yaml`) | **Gelé** |
| Projection Foundation | **Terminée** — report-only, jamais bloquant |
| VisualSpec normalization (phase 1) | **Livré** — `threshold_fragment` / branch labels |
| `fact_dispositions` (familles qualifiées) | **Alignés** |
| CI `projection:report` | **Actif** — exit 0, gate non bloquant |

**Aucun chantier d'architecture ouvert.** Ne pas modifier Visual Grammar, Runtime, Theme, Projection Foundation, ni rouvrir ADR-008 sans instruction explicite.

### Prochain chantier — séquence produit

```
Architecture Foundations V1 ✅
        ↓
Golden Corpus V1          ← PROCHAIN
        ↓
Walkthroughs
        ↓
Product Review Lou V1
```

| Étape | Owner typique | Nature |
|---|---|---|
| **Golden Corpus V1** | Codex / Cursor | Consolidation corpus figures 234 normalisées |
| **Walkthroughs** | Codex | Parcours apprenant Word mobile-first |
| **Product Review Lou V1** | Codex / Lou | Validation usage réel |

---

## 3. Validation du freeze Architecture Foundations V1

**Suite minimale de validation** (périmètre Architecture Foundations — **pas** `test:ci` complet) :

```bash
cd tools/lou-build && node --test \
  test/visual-grammar-runtime.test.js \
  test/svg-graphic-language.test.js \
  test/projection-verification.test.js \
  test/visual-spec-projection-normalize.test.js \
  test/kind-vocabulary.test.js \
  test/threshold-band-validate.test.js \
  test/visual-centrality.test.js \
  test/capability-coverage.test.js

cd tools/lou-build && npm run projection:report   # exit 0 — report-only
```

**Attendu :** 74+ tests PASS · `projection:report` exit 0 · `dispositionMismatches` documentés (non bloquants).

---

## 4. Contenu du commit de freeze (référence)

Voir [`PROJECT_STATE.md`](PROJECT_STATE.md) § « Freeze Architecture Foundations V1 » pour la liste **IN / OUT / À ARBITRER** et la commande `git add` exacte.

**Tag proposé :** `architecture-foundations-v1`

**Baseline Git tags utiles :** `baseline-phase-0-2026-08-04` · `svg-highlight-bridge-v1` · `reader-acceptance-v1` · `architecture-foundations-v1` (à créer).

---

## 5. Autorisé / interdit

| Autorisé | Interdit |
|---|---|
| Golden Corpus V1 — consolidation figures et specs 234 | Modifier Visual Grammar, Runtime, Theme, Projection Foundation |
| Walkthroughs et Product Review Lou V1 (sur instruction) | Nouvelle architecture · nouveau renderer · correction graphique |
| Commit / tag / push **sur instruction explicite** du propriétaire | Commit / push sans accord |
| Lecture des rapports Projection Foundation dans `01-learning/chapters/cardio/234/build/` | Mélanger travaux Phase B (CMM, W2A, editorial-industrialization) dans le commit Architecture Foundations |

---

## 6. Fichiers clés Architecture Foundations

| Rôle | Chemin |
|---|---|
| Chaîne graphique | `docs/architecture/GRAPHICAL-ARCHITECTURE.md` |
| Projection Foundation | `docs/architecture/PROJECTION-FOUNDATION.md` |
| Runtime | `tools/lou-build/lib/visual-grammar-runtime.js` |
| Theme | `tools/lou-build/config/svg-graphic-language-v1.yaml` |
| Vérification projection | `tools/lou-build/lib/projection-verification.js` |
| Normalisation VisualSpec | `tools/lou-build/lib/visual-spec-projection-normalize.js` |
| CI report-only | `tools/lou-build/scripts/run-projection-report.mjs` |
| Rapport foundation | `01-learning/chapters/cardio/234/build/projection-foundation-report.md` |
| Audit dispositions | `docs/architecture/FACT-DISPOSITIONS-AUDIT.md` |
| État projet | `docs/PROJECT_STATE.md` |

---

## 7. Acquis historiques (ne pas rouvrir sans instruction)

Reader Acceptance V1 · Composition V1 · D1–D7 · Annotation UI Freeze · SVG Highlight Bridge V1 · ADR-008 · contrat 05 · CMM-R3 / E1 · **Architecture Foundations V1** (Visual Grammar · Runtime · Theme · Projection Foundation).

**Travail local hors freeze :** `editorial-industrialization/v0/`, pile CMM, W2A, analyses `docs/analysis/` — **ne pas inclure** dans le commit Architecture Foundations V1.

---

## 8. Reprendre le projet

**ChatGPT / Codex :** lire §1–§2 ; architecture **gelée** ; enchaîner sur **Golden Corpus V1** ; ne pas rouvrir chantiers architecture.

**Cursor :** exécuter Golden Corpus V1 sur instruction ; pas de modification Runtime/Theme/Projection ; pas de commit sans accord.

*« On reprend le lot en cours »* → **Golden Corpus V1** est le lot actif.

---

*Handover — 2026-08-09 — Architecture Foundations V1 terminée · architecture graphique gelée · Golden Corpus V1 prochain. Non normatif.*
