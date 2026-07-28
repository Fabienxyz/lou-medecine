# Plan d'industrialisation — Chaîne d'acquisition Lou Médecine

**Statut :** feuille de route post-qualification GO  
**Prérequis :** [`qualification-report-acquisition-final.md`](qualification-report-acquisition-final.md) · [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md)

> **Cadre normatif.** L'architecture d'acquisition est gelée (ADR-004). Ce plan couvre l'**industrialisation des artefacts métier aval** — travaux **post Phase 3.5** (après cutover lou-build). Voir [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md).

---

## 1. Objectif

Passer de **2 vertical slices validés** (Items 234, 330) à une chaîne capable de produire l'ensemble des chapitres EDN du Collège de cardiologie 2022, puis d'autres collèges.

---

## 2. Composants stables (gelés — ne pas modifier sans version bump)

| Composant | Version | Rôle | Preuve |
|---|---|---|---|
| **Tool 01** | `lou-pdf-to-canonical` v1.0.0 | PDF → `official-college.md` | P.1 GO, SHA reproductible |
| **Tool 02** | `lou-chapter-splitter` v1.0.0 | Découpage 22 chapitres | manifest Tool 02 |
| **lou-build** | `lou-build-pipeline-v1` | validate / build / stages A–K | 188 tests, 234+330 PASS ; Phase 3.5 = legacy removal |
| **Grille P1–P7** | 2026-07-28 | Critères qualification | Rapport final GO |
| **Modèle d'ancre** | quote + section_path + edition | Traçabilité | 286 ancres validées (234+330) |
| **Structure package chapitre** | source.meta + inventory + blueprint + projections + reconciliation | Contrat package | 234, 330 |
| **demo/renderer** | V2.3 | Lecteur projections | Sans dépendance PDF |

---

## 3. Composants expérimentaux (industrialisation requise)

| Composant | État actuel | Cible industrialisation |
|---|---|---|
| **Extraction Inventory** | Curation manuelle / assistée par chapitre | Scripts Phase 2 automatisés + validateurs |
| **Réconciliation indépendante** | YAML bootstrap manuel par slice | Pass automatisé section-by-section |
| **Blueprint** | Rédaction manuelle phase 4 | Génération assistée + validate-blueprint |
| **Projections** | Rédaction manuelle phase 5 | Génération + grounding check automatisé |
| **Pipeline sémantique global** | 2/22 chapitres packagés (~9 %) | 22 chapitres cardio → multi-collèges |
| **library.json / Lecteur multi-chapitres** | Non déployé | Renderer Production (Phase 1) |
| **Rang A/B extraction** | Colonne vide (V2) | Enrichissement canonique — hors acquisition gelée |
| **Figures raster Collège** | Refs textuelles seulement (V3) | Enrichissement canonique — hors acquisition gelée |

---

## 4. Étapes d'industrialisation

### Phase A — Collège cardio complet (22 chapitres)

**Objectif :** tout chapitre FIL B consommable par le Lecteur (Phase 1).

| Étape | Action | Parallélisable | Validation ponctuelle |
|---|---|:---:|---|
| A.1 | Geler corpus `corpus-v1.0.0` (5 items + extension 17 restants) | — | Revue propriétaire |
| A.2 | Package `source.meta.yaml` pour chaque item 221–342 | ✅ par chapitre | Anchor smoke test |
| A.3 | Inventory + réconciliation par chapitre | ✅ par chapitre | P4 par chapitre |
| A.4 | Blueprint + projections chapitres « simples » (221, 222, 223…) | ✅ par archétype | P5 par chapitre |
| A.5 | Chapitres complexes (231 figures, 233 parallèle, 233 valvulopathies) | Séquentiel priorisé | P.1 cas V1/V3 |
| A.6 | `library.json` + manifests par chapitre | — | Phase 1 critères |
| A.7 | Suppression FIL A legacy | Après A.3 234 ✅ | Migration checklist |

**Ordre recommandé (par archétype) :**

1. Textuel simple : 221, 222, 223, 230, 235
2. Tableaux / posologies : 330 ✅, 224, 339
3. Narratif clinique : 234 ✅, 232, 226, 203
4. Figures denses : 231, 233
5. Restants : 152, 153, 236, 237, 238, 331, 342

### Phase B — Automatisation pipeline sémantique (Phase 2 roadmap)

| Étape | Livrable |
|---|---|
| B.1 | Extracteur Inventory déterministe + validateur ancres |
| B.2 | Réconciliation indépendante automatisée (section-by-section) |
| B.3 | CI : `lou-build validate` sur corpus gelé |
| B.4 | Métriques : minutes humaines / chapitre, taux `missed` |

### Phase C — Multi-collèges (Phase 5 roadmap)

| Étape | Livrable |
|---|---|
| C.1 | Qualification pipeline par type source (PDF éditeur X) |
| C.2 | Schéma Inventory transversal gelé (après 2ᵉ collège) |
| C.3 | Edition diff + stable identity |

---

## 5. Parallélisation

```
                    ┌─ Chapitre 221 ─┐
                    ├─ Chapitre 222 ─┤
Tool 01/02 (gelé) ──┼─ Chapitre …  ──┼── lou-build validate ── Lecteur
                    ├─ Chapitre 330 ✅│
                    └─ Chapitre 234 ✅┘
                           ↑
              Parallélisation maximale par chapitre
              (équipes / agents indépendants)
```

**Contraintes de séquencement :**

- Tool 01/02 : **séquentiel global** (1 run collège entier) — déjà fait
- Package chapitre : **parallèle** — aucune dépendance inter-chapitres
- `library.json` : **après** A.2 minimum viable
- Suppression FIL A : **après** migration 234 ✅ et tests CI mis à jour

---

## 6. Validations ponctuelles restantes

| Sujet | Déclencheur | Action |
|---|---|---|
| Item 231 Tableau 15.2 | Inventory 231 signale `missed` sur axes QRS | Activer V1 si impact démontré |
| Item 330 hiérarchisation | Filtres Rang requis | Phase 0B — V2 |
| Figures raster | Feature Lecteur pixel Collège | Phase 0B — V3 |
| Formats structurés EDN | DOCX/HTML disponible | Nouveau pipeline qualifié |
| Rebuild SVG byte-identique | CI fiable exigée | Phase 0A |

Aucune de ces validations **ne bloque** le démarrage Phase A.

---

## 7. Indicateurs de succès industrialisation

| Indicateur | Baseline (2026-07-28) | Cible Phase A |
|---|---|---|
| Chapitres packagés FIL B | 2 / 22 (9 %) | 22 / 22 |
| `lou-build validate` PASS | 234, 330 | 22 chapitres |
| Références FIL A opérationnelles | 0 (234 migré) | 0 |
| Minutes humaines / chapitre | Non mesuré | Baseline établie |
| Corpus gelé | Non | `corpus-v1.0.0` |

---

## 8. Ce qu'il ne faut pas faire

- Optimiser Tool 01/02 sans bug bloquant démontré ;
- Retoucher le Markdown source à la main ;
- Introduire une seconde source d'autorité (FIL A) ;
- Reprendre la R&D acquisition (grille P, hypothèses PDF-centric).

---

## 9. Clôture

La R&D acquisition est **terminée**. L'industrialisation suit ce plan, orchestrée par [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) Phases 0A, 0B, 1, 2.
