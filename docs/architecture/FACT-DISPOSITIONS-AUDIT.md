# Fact Dispositions — Audit registre VCCK

| | |
|---|---|
| **Type** | Audit architecture — Phase A clôture Opus |
| **Date** | 2026-08-09 |
| **Statut** | Report-only — aucun gate bloquant |

**Références :** [Projection Foundation](./PROJECTION-FOUNDATION.md) · `tools/lou-build/vcck/registry/families.json`

---

## 1. Synthèse

| Métrique | Valeur |
|---|---|
| Familles registre | 18 |
| Familles avec `fact_dispositions` | 6 |
| Familles sans (EXPERIMENTAL) | 12 |
| Alignement post-normalisation | `threshold-cutoff` retiré de `embedded-fragment` |

### Familles déclarées (QUALIFIED / corpus Phase A)

- **chain** (3 types)
- **dependent-sequence** (6 types)
- **skip-level-branch** (6 types)
- **embedded-fragment** (10 types)
- **two-pole** (5 types)
- **flat-concurrent** (2 types)

### Écarts signalés (vrais)

| Écart | Sévérité | Action |
|---|---|---|
| 12 familles EXPERIMENTAL sans `fact_dispositions` | Info | Déclarer au moment de la qualification — pas avant freeze Phase A |
| `threshold-cutoff` absent du modèle normalisé | Résolu | Retiré du registre `embedded-fragment` |
| N09 context « hors urgence » duplicated (substring) | Connu | Verification substring — hors registre |

---

## 2. Matrice complète (familles déclarées)

| Famille | Fact type | Disposition | Justification | État |
|---|---|---|---|---|
| chain | question | MATERIALIZED | MATERIALIZED | OK |
| chain | node | MATERIALIZED | MATERIALIZED | OK |
| chain | edge | DISCARDED | DISCARDED (NON_LEARNER_VISIBLE) | OK |
| dependent-sequence | question | MATERIALIZED | MATERIALIZED | OK |
| dependent-sequence | node | MATERIALIZED | MATERIALIZED | OK |
| dependent-sequence | subitem | MATERIALIZED | MATERIALIZED | OK |
| dependent-sequence | branch | MATERIALIZED | MATERIALIZED | OK |
| dependent-sequence | annotation | MATERIALIZED | MATERIALIZED | OK |
| dependent-sequence | edge | DISCARDED | DISCARDED (NON_LEARNER_VISIBLE) | OK |
| skip-level-branch | question | MATERIALIZED | MATERIALIZED | OK |
| skip-level-branch | node | MATERIALIZED | MATERIALIZED | OK |
| skip-level-branch | subitem | MATERIALIZED | MATERIALIZED | OK |
| skip-level-branch | branch | MATERIALIZED | MATERIALIZED | OK |
| skip-level-branch | annotation | MATERIALIZED | MATERIALIZED | OK |
| skip-level-branch | edge | DISCARDED | DISCARDED (NON_LEARNER_VISIBLE) | OK |
| embedded-fragment | question | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | node | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | subitem | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | branch | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | annotation | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | threshold-fragment-context | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | threshold-fragment-scale-line | MATERIALIZED | MATERIALIZED | OK |
| embedded-fragment | threshold-fragment-low-band-meaning | DERIVED | DERIVED ← node | OK |
| embedded-fragment | threshold-fragment-interpretation | DISCARDED | DISCARDED (OUT_OF_SCOPE_FOR_CAPABILITY) | OK |
| embedded-fragment | edge | DISCARDED | DISCARDED (NON_LEARNER_VISIBLE) | OK |
| two-pole | question | MATERIALIZED | MATERIALIZED | OK |
| two-pole | pole | MATERIALIZED | MATERIALIZED | OK |
| two-pole | dimension | MATERIALIZED | MATERIALIZED | OK |
| two-pole | matrix-cell | MATERIALIZED | MATERIALIZED | OK |
| two-pole | relation-label | DISCARDED | DISCARDED (NON_LEARNER_VISIBLE) | OK |
| flat-concurrent | question | MATERIALIZED | MATERIALIZED | OK |
| flat-concurrent | matrix-cell | MATERIALIZED | MATERIALIZED | OK |

---

## 3. Vocabulaire officiel (P3)

| Concept | Nom officiel | Alias | Décision |
|---|---|---|---|
| Fait learner-visible | **fact** (Fact Spine) | claim unit | Nom officiel |
| Type de fait | **fact type** / `unit` | — | `unit` dans le code |
| Déclaration capability | **fact_dispositions** | Total Disposition | Registre VCCK |
| Seuil en callout | **threshold-fragment-scale-line** | — | Canonique post-normalisation |
| Substrat auteur seuil | **cutoff_label** | threshold-cutoff (retiré) | Non fait learner |
| Condition branche | **branch.condition** | — | Qualitative si fragment |
| Vérification | **Projection Verification** | — | Report-only |
| Comparaison déclaration/réalité | **Total Disposition** | disposition mismatch | Report-only |

---

## 4. Exceptions restantes (P4)

| Emplacement | Mot-clé | Justification | Décision |
|---|---|---|---|
| `monitoring-loop` known_limitations | heuristic | Routage boucle non finalisé | **Conserver** — qualification EXPERIMENTAL |
| `projection-verification.js` | heuristic (comment) | Disposition inférée localement avant comparaison registre | **Conserver** — couche observation |
| `classifyFactDisposition` | KNOWN_NON_PROJECTED | Catalogue champs non rendus | **Conserver** — aligné DISCARDED |
| `KIND-VOCABULARY-MIGRATION.md` | G1/G3 sections | Archive historique vocabulaire | **Conserver** — doc clôturée |
| Familles EXPERIMENTAL sans dispositions | — | Non qualifiées | **Conserver** — déclarer à la qualification |

---

*Audit généré — Phase A Architecture Foundations V1.*
