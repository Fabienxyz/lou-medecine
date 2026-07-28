# Phase 0B — Rapport de qualification de la dérivation du Collège

**Date :** 2026-07-28  
**Statut :** qualification — grille **P1–P7**  
**Périmètre :** chaîne complète de dérivation métier, du Markdown source officiel au Renderer  
**Verdict :** **GO avec réserves**

**Références :** [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) · [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) · [`hypothesis-pipeline-impact-p1.md`](hypothesis-pipeline-impact-p1.md) · [`qualification-report-tool01-p1.md`](qualification-report-tool01-p1.md) · ADR-003 · `IMPLEMENTATION_CONTRACT.md` · `FINAL_ARCHITECTURE.md`

**Prérequis actés (hors périmètre de ce rapport) :**

- FIL B = chaîne d'acquisition officielle unique ;
- Tool 01 qualifié *fit for purpose* (Phase P.1) ;
- optimisations Tool 01 suspendues sans impact aval démontré ;
- critère de succès = suffisance artefacts métier, pas reproduction PDF.

Ce rapport **ne réévalue pas Tool 01 isolément**. Il qualifie la capacité de la chaîne à produire des artefacts métier fiables, traçables et complets.

---

## 1. Méthode

### 1.1 Corpus et preuves

| Source | Rôle |
|---|---|
| **Corpus de référence** (5 items : 221, 231, 330, 234, 233) | Échantillon Phase P — [`benchmark/corpus/README.md`](../../benchmark/corpus/README.md) |
| **FIL B** — `01-learning/full-edn/cardiology/edition-2022/` | Source officielle (Markdown + chapitres Tool 02) |
| **Vertical slice Item 234** — `01-learning/chapters/cardio/234/` | Seul chapitre avec Inventory → Renderer complet |
| **Rapports Phase 2–5 Item 234** | Preuves P4–P6 sur slice de référence |

### 1.2 Procédure

1. **Inventaire** des artefacts existants à chaque étage de la chaîne et de leur source (FIL A vs FIL B).
2. **Évaluation P1–P7** par étage : `official-college.md` → `chapters/` → Inventory → Blueprint → Projections → Renderer.
3. **Vérifications empiriques** complémentaires (2026-07-28) :
   - résolution des ancres Inventory (232 quotes) contre FIL A et FIL B ;
   - présence de faits médicaux sensibles dans les chapitres FIL B (330 posologies, 234 SEG-061b/c) ;
   - `lou-build validate` sur le package Item 234 ;
   - inspection des manifests Tool 01 / Tool 02.
4. **Classification des anomalies** : impact métier réel uniquement ; imperfections sans conséquence aval exclues du registre des défauts.

### 1.3 Limites méthodologiques

| Limite | Impact sur le verdict |
|---|---|
| Corpus non gelé (`corpus-v1.0.0` en attente) | Réserves — reproductibilité inter-versions |
| Item 234 encore câblé sur **FIL A legacy** (`2024-SFC`) | Réserves — chaîne officielle FIL B non entièrement démontrée |
| Aucun pilote Inventory/Blueprint sur 221, 231, 330, 233 (FIL B) | Réserves — P4–P5 non généralisés |
| Réconciliation indépendante exécutée sur FIL A uniquement | Réserves — P4 non revalidé sur FIL B |

---

## 2. Vue d'ensemble de la chaîne

```
PDF officiel (FIL B)
        ↓  Tool 01 v1.0.0          ✅ qualifié (P.1)
official-college.md
        ↓  Tool 02 v1.0.0          ✅ 22 chapitres, manifest
chapters/item-*.md
        ↓  Pipeline Lou            ⚠️  démontré sur Item 234 seul (FIL A)
Inventory
        ↓
Blueprint
        ↓
Projections pédagogiques
        ↓
Renderer (lou-build + demo/renderer)
```

| Étape | Statut global | Preuve principale |
|---|---|---|
| PDF → `official-college.md` | **Qualifié** (Phase P.1) | SHA `692396ce…`, manifest Tool 01 |
| → `chapters/` | **Qualifié** | 22 chapitres, SHA stables, manifest Tool 02 |
| → Inventory | **Démontré (234)** | 109 KPs, réconciliation Phase 3C → GO Blueprint |
| → Blueprint | **Démontré (234)** | 22 éléments, 91/91 KPs, validate GO |
| → Projections | **Démontré (234)** | 4 projections, 89 claims, grounding PASS |
| → Renderer | **Démontré (234)** | `VALIDATE PASS`, aucune dépendance PDF |

---

## 3. Évaluation P1–P7 par étage

### 3.1 `official-college.md` (FIL B)

#### P1 — Préservation de l'information métier

| Appréciation | **Conforme** |
|---|---|

**Preuves :**

- Prose, listes, encadrés, posologies et seuils numériques présents sur l'échantillon corpus (P.1 : C1/C8 conformes).
- Item 330 : doses critiques présentes en prose et tableaux (`75 mg`, `18 UI/kg/h`, `ClCr < 30 mL/min` — grep FIL B chapitre 330).
- Item 234 FIL B : faits identifiés comme *missed* en réconciliation v2 (régime hyposodé SEG-061b/c) **présents** dans le chapitre FIL B (l. 598).
- **Pastilles Rang A/B** : colonne vide sur les 5 items corpus — **non bloquant** (métadonnée curriculum ; corps du chapitre porte le contenu ; critère V2 non activé).

**Pertes identifiées avec impact métier :** aucune perte **systématique** de fait examinable détectée sur le corpus.

**Imperfections sans impact métier (non comptées comme défauts) :**

- Absence d'assets figures raster (refs textuelles + légendes conservées) ;
- Item 231 Tableau 15.2 mal classé (V1 — voir § 5) ;
- Item 330 hiérarchisation aplati (V1/V2 — voir § 5).

#### P2 — Segmentabilité

| Appréciation | **Conforme** |
|---|---|

- 680 titres (`#`…`####`) dans le collège complet (manifest Tool 01).
- Chapitres Tool 02 : tranches déterministes, SHA par item (`chapters/manifest.json`).
- Item 221 : structure `## I Épidémiologie` → `### A …` exploitable pour `section_path`.
- Item 330 : segmentation des sections I–VI OK ; **bruit local** sur la zone hiérarchisation (l. 32–46, texte aplati) — n'empêche pas la segmentation du corps clinique.

#### P3 — Ancrabilité

| Appréciation | **Conforme sur corpus** ; **réserve migration 234** |
|---|---|

- Modèle d'ancre opérationnel : `{ edition, section_path, quote }` — 232 ancres Item 234, 0 non résolues sur FIL A.
- Test migration FIL B (232 quotes, normalisation whitespace) : **224/232 résolues**, **8 échecs** — texte **présent** mais quotes calibrées sur format FIL A (encadrés sans préfixe `>` vs blockquotes Tool 01). Ex. KP-063, KP-078, KP-081, KP-089.
- **Impact :** re-calibrage d'ancres à la migration FIL B, pas perte de contenu.

#### P4 — Suffisance Inventory

| Appréciation | **Non démontré sur FIL B** ; **démontré sur slice 234 (FIL A)** |
|---|---|

- Pilote complet Item 234 : extraction 99 → intégration 109 KPs ; réconciliation v2 initiale FAIL (2 `missed`) → Phase 3C enrichit KP-074 → **GO Blueprint** ([`inventory-phase3c-report.md`](../../01-learning/chapters/cardio/234/build/inventory-phase3c-report.md)).
- Dispositions respectées : represented / deferred / excluded-with-justification ; conflit FE/CCB explicitement non résolu (safely preserved).
- **Aucune** extraction Inventory exécutée sur les chapitres FIL B 221, 231, 330, 233.

#### P5 — Suffisance Blueprint et projections

| Appréciation | **Démontré (234)** ; **non généralisé** |
|---|---|

- Blueprint : 22 éléments, 91/91 KPs understanding mappés — [`blueprint-phase4-validation.json`](../../01-learning/chapters/cardio/234/build/blueprint-phase4-validation.json) `ok: true`.
- Projections : 89 claim blocks, grounding déterministe PASS, OAP regression PASS — [`projection-phase5-validation.json`](../../01-learning/chapters/cardio/234/build/projection-phase5-validation.json).
- Aucun enrichissement médical détecté ; conflits source (FE/CCB) explicitement traités comme `CONF-ccb-fe-source`.

#### P6 — Suffisance Renderer

| Appréciation | **Conforme (234)** |
|---|---|

- `demo/renderer/` et `tools/lou-build/` : **aucune référence PDF** ; entrée = `manifest.json` + projections + traceability.
- Package 234 : 4 projections publiées, 2 SVG (`mec-oap.svg`, `mm-pump-decompensation.svg`), lecteur fonctionnel sur slice.
- Texte officiel accessible via ancres Inventory — pas d'extraction PDF au rendu.

#### P7 — Invariants techniques

| Sous-critère | Appréciation | Preuve |
|---|---|---|
| P7a Reproductibilité | **Conforme** (acquisition) | Tool 01 SHA byte-identique regénération P.1 |
| P7b Automatisation | **Conforme** (acquisition) | Pipeline PDF → MD → chapitres en une commande |
| P7c Manifest | **Conforme** | `manifest.json` Tool 01 + Tool 02 + package 234 |
| P7d Sans LLM (étages déterministes) | **Conforme** | Tool 01/02, lou-build validate, validators Phase 3–5 |
| P7e Stabilité chapitres | **Conforme** | SHA chapitres figés dans manifest Tool 02 |

**Réserve connue (hors acquisition) :** rebuild SVG `mec-oap.svg` non byte-identique ([`PROJECT_STATE.md`](../PROJECT_STATE.md)) — n'affecte pas la suffisance textuelle P6.

---

### 3.2 `chapters/` (Tool 02, FIL B)

Les chapitres sont des **tranches byte-identiques** du Markdown Tool 01 — aucune transformation sémantique.

| Item | Lignes | SHA (extrait) | P1 | P2 | P3 |
|---|--:|---|:---:|:---:|:---:|
| 221 | 352 | `f00beae7…` | ✅ | ✅ | ✅ (structure) |
| 231 | 882 | `401f662c…` | ✅ | ⚠️ table 15.2 | ✅ (texte) |
| 330 | 837 | `081233d9…` | ✅ prose/doses | ⚠️ hiérarch. | ✅ (texte) |
| 234 | 871 | `f4ea7b11…` | ✅ | ✅ | ⚠️ 8/232 quotes |
| 233 | 1 499 | `bae4ebc7…` | ✅ | ✅ | non testé |

**Conclusion étage chapitres :** suffisants comme entrée pipeline Lou ; anomalies localisées sans perte systématique de contenu médical.

---

### 3.3 Inventory → Renderer (Item 234 — preuve verticale)

| Critère | Verdict | Preuve |
|---|---|---|
| **P1** | ✅ | 109 KPs couvrant définitions, mécanismes, posologies, seuils, exceptions ; conflits source préservés |
| **P2** | ✅ | `section_path` sur chaque KP ; index sections dans `source.meta.yaml` |
| **P3** | ✅ (FIL A) / ⚠️ (FIL B) | 232/232 ancres FIL A ; 224/232 FIL B (format encadrés) |
| **P4** | ✅ (post-3C) | Réconciliation v2 → 2 misses → Phase 3C → 0 misses bloquants ; FE/CCB ambiguïté safely preserved |
| **P5** | ✅ | Blueprint 91/91 ; projections 89 claims ; pas d'enrichissement médical |
| **P6** | ✅ | Renderer autonome ; `lou-build validate` → **VALIDATE PASS** |
| **P7** | ✅ | Traceability 95 blocks ; manifest ; validators automatisés |

**Attention SSOT :** le package 234 pointe encore vers FIL A (`source.meta.yaml` → `chapter-analysis/…/official-college.md`, édition `2024-SFC`). Les preuves P4–P6 sont **valides pour la chaîne de dérivation métier** mais **pas encore ancrées sur la source officielle FIL B**.

---

## 4. Synthèse P1–P7 (chaîne complète)

| # | Critère | Verdict | Commentaire |
|---|---|:---:|---|
| **P1** | Préservation information métier | ✅ | Aucune perte systématique sur corpus FIL B |
| **P2** | Segmentabilité | ✅ | Titres/listes/encadrés suffisants ; bruit local 330/231 |
| **P3** | Ancrabilité | ⚠️ | Modèle opérationnel ; 8 ancres à recalibrer migration 234 FIL B |
| **P4** | Suffisance Inventory | ⚠️ | Démontré 234 ; pilote 330 recommandé ; 4 items sans extraction |
| **P5** | Suffisance Blueprint & projections | ⚠️ | Démontré 234 ; non généralisé |
| **P6** | Suffisance Renderer | ✅ | Aucune dépendance PDF ; slice 234 fonctionnelle |
| **P7** | Invariants techniques | ✅ | Acquisition reproductible ; build automatisé ; manifests |

---

## 5. Anomalies à impact métier

Seules les anomalies avec impact réel sur le pipeline sont listées.

| ID | Localisation | Impact métier | Artefact | Critère | Sévérité |
|---|---|---|---|---|---|
| **A-01** | Package 234 → `source.meta.yaml`, 8 scripts build | Traçabilité officielle non conforme SSOT ; édition `2024-SFC` vs `2022` | Inventory, reconciliation, traceability | P3, P4, P7 | **Majeur** — migration requise |
| **A-02** | Item 234 — 8 ancres (encadrés) | Quotes calibrées FIL A ; échec résolution sur FIL B malgré texte présent | Inventory, traceability | P3 | **Modéré** — recalibrage, pas perte |
| **A-03** | Corpus 221, 231, 330, 233 | P4–P5 non démontrés sur FIL B | Inventory, Blueprint | P4, P5 | **Majeur** — pilotes requis |
| **A-04** | Item 330 — hiérarchisation l. 32–46 | Risque `missed` posologies en tableaux fusionnés si extracteur tabulaire strict | Inventory (330) | P4 (V1) | **Incertain** — pilote 330 décisif |
| **A-05** | Item 231 — Tableau 15.2 l. 149–156 | Tableau clinique (axes QRS) illisible en structure pipe | Inventory (231) | P4 (V1) | **Modéré local** — contenu textuel préservé en prose adjacente |
| **A-06** | Tous items — colonne Rang vide | Filtres mastery par rang indisponibles | Inventory (rang) | V2 | **Non bloquant** — `rank: unknown` acté |
| **A-07** | Item 234 — conflit FE/CCB | Pas de règle unique inventée ; doit rester explicitement non résolu | Projections, mastery future | P5 | **Safely preserved** — pas un défaut pipeline |

**Anomalies P.1 reclassées non bloquantes** (hypothèse confirmée) : NC-1 Rang, NC-2 hiérarchie 330, NC-3 tableau 15.2 (partiel), NC-5 fusions, NC-6 pas d'images — voir [`hypothesis-pipeline-impact-p1.md`](hypothesis-pipeline-impact-p1.md).

---

## 6. Preuves par critère (index)

| Critère | Fichiers / commandes |
|---|---|
| P1 | [`qualification-report-tool01-p1.md`](qualification-report-tool01-p1.md) ; grep posologies chapitre 330 FIL B ; chapitre 234 FIL B l. 598 |
| P2 | `full-edn/…/manifest.json` (`heading_count: 680`) ; `chapters/manifest.json` |
| P3 | [`inventory-extraction-report.md`](../../01-learning/chapters/cardio/234/build/inventory-extraction-report.md) (0 unresolved FIL A) ; test quotes 224/232 FIL B |
| P4 | [`reconciliation-full-v2-report.md`](../../01-learning/chapters/cardio/234/build/reconciliation-full-v2-report.md) ; [`inventory-phase3c-report.md`](../../01-learning/chapters/cardio/234/build/inventory-phase3c-report.md) |
| P5 | [`blueprint-phase4-report.md`](../../01-learning/chapters/cardio/234/build/blueprint-phase4-report.md) ; [`projection-phase5-audit.md`](../../01-learning/chapters/cardio/234/build/projection-phase5-audit.md) |
| P6 | `tools/lou-build/` (no PDF) ; `demo/renderer/config.js` ; `node tools/lou-build/cli.js validate --chapter 01-learning/chapters/cardio/234` → PASS |
| P7 | Tool 01 SHA `692396ce…` ; manifests ; [`traceability.json`](../../01-learning/chapters/cardio/234/build/traceability.json) |

---

## 7. Risques résiduels

| Risque | Probabilité | Mitigation |
|---|---|---|
| Extracteur Inventory échoue sur tableaux Item 330 | Moyenne | Pilote 330 + réconciliation avant industrialisation |
| Migration FIL B casse ancres au-delà des 8 encadrés connus | Faible | Re-run `validateAllAnchors` + réconciliation complète post-migration |
| Confiance excessive dans slice 234 seul | Moyenne | Étendre pilotes à 330 (tableaux) et 221 (baseline textuel) |
| Corpus non gelé | Faible | Valider et figer `corpus-v1.0.0` |
| Composants legacy FIL A non migrés | Élevée (actif) | Plan migration [`PROJECT_STATE.md`](../PROJECT_STATE.md) § Migration FIL A |

---

## 8. Recommandations

### Bloquantes avant clôture Phase 0B (réserves levées)

1. **Migrer Item 234 vers FIL B** — repointer `source.meta.yaml`, scripts build, reconciliation ; harmoniser édition `2022` ; recalibrer les 8 ancres encadrés.
2. **Re-exécuter** réconciliation indépendante + `lou-build validate` sur chapitre FIL B Item 234.
3. **Pilote Inventory Item 330** (FIL B) — seul item où NC-4 reste incertain pour P4.

### Souhaitables (non bloquantes)

4. Pilotes Inventory sur 221 (baseline textuel) et 231 (figures denses).
5. Geler corpus `corpus-v1.0.0`.
6. Compléter `docs/acquisition/qualification-report.md` (clôture Phase P globale).

### Ne pas faire

- Reprendre optimisations Tool 01 sans impact P4–P6 démontré ;
- Retoucher le Markdown source à la main ;
- Inventer des rangs A/B ou résoudre artificiellement le conflit FE/CCB.

---

## 9. Décision

### **GO avec réserves**

**Justification :**

La chaîne de dérivation du Collège **fonctionne** pour produire des artefacts métier fiables — démonstration complète sur Item 234 (Inventory 109 KPs → Blueprint 22 éléments → 4 projections → Renderer, sans dépendance PDF, avec réconciliation et traçabilité).

Sur le corpus FIL B, **l'information médicale nécessaire est préservée** (P1), le document est **segmentable et ancrable** (P2–P3), et les **invariants techniques d'acquisition** sont respectés (P7). Les imperfections P.1 (Rang, tableaux, hiérarchisation) **ne bloquent pas** la génération d'artefacts aval — hypothèse confirmée empiriquement sur 234.

**Les réserves** portent exclusivement sur :

1. **Conformité SSOT** — le vertical slice de référence consomme encore FIL A legacy (A-01) ;
2. **Généralisation** — P4–P5 non démontrés hors Item 234, pilote 330 requis (A-03, A-04) ;
3. **Migration ancres** — 8 quotes encadrés à recalibrer sur FIL B (A-02).

Ces réserves sont **techniques et cadrées** ; elles ne remettent pas en cause le principe que le pipeline Lou Médecine dérive intégralement du Collège sans perte métier systématique ni enrichissement non fondé.

**Ce verdict n'est pas un NO GO** car aucune violation des critères « jamais acceptables » ([`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) § 8) n'est constatée : pas de perte systématique de faits examinables, pas d'impossibilité démontrée de générer Inventory/Blueprint/Renderer sur la source qualifiée, pas de production Markdown LLM-dépendante.

**Ce verdict n'est pas un GO sans réserve** car la chaîne officielle FIL B n'est pas encore le pivot opérationnel du slice de référence et le corpus n'a pas fait l'objet de pilotes Inventory suffisants pour clore P4–P5.

---

## 10. Documents connexes

| Document | Rôle |
|---|---|
| [`qualification-report-tool01-p1.md`](qualification-report-tool01-p1.md) | Phase P.1 historique (Tool 01) |
| [`hypothesis-pipeline-impact-p1.md`](hypothesis-pipeline-impact-p1.md) | Analyse impact aval |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Grille P1–P7 normative |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État opérationnel et migration FIL A |
| [`benchmark/corpus/README.md`](../../benchmark/corpus/README.md) | Corpus de référence |
