# ADR-004 — Acquisition Architecture Frozen

## Statut

**Accepted**

## Date

2026-07-28

## Decision Owners

Lou Médecine Project

---

## 1. Context

Lou Médecine transforme les Collèges officiels EDN en une **représentation déterministe, traçable et reproductible** qui constitue la **Single Source of Truth (SSOT)** consommée par l'ensemble des composants aval — Inventory, Blueprint, projections pédagogiques, Renderer et outillage de build.

Cette couche d'acquisition n'est pas un objectif produit en soi. Elle est le **contrat d'entrée** du pipeline métier : tout artefact généré en aval doit pouvoir être relié, par identifiants stables, à un passage verbatim du Collège officiel — sans relecture du PDF, sans retouche manuelle du Markdown, sans production LLM dans la chaîne déterministe.

L'architecture a atteint un niveau de maturité suffisant pour être gelée après validation progressive sur plusieurs jalons indépendants :

| Jalon | Résultat acté |
|---|---|
| Qualification Tool 01 (Phase P.1) | *Fit for purpose* — reproductibilité byte-identique, information métier préservée |
| Adoption FIL B ([ADR-003](ADR-003-single-source-of-truth.md)) | Chaîne officielle unique ; FIL A reclassé legacy |
| Consolidation gouvernance | Grille **P1–P7** — suffisance aval, pas reproduction PDF |
| Phase 0B | GO avec réserves — réserves levées par intégration FIL B |
| Double validation verticale | Items **234** et **330** — `lou-build validate` PASS sur FIL B exclusif |

À compter de cette ADR, la question « comment acquérir le Collège ? » est **close**. La question ouverte devient « comment industrialiser les artefacts métier à partir de cette entrée stable ? ».

---

## 2. Decision

L'**architecture d'acquisition Lou Médecine est gelée** (*frozen*).

Les composants suivants constituent le **socle officiel immuable** — fondation de tous les artefacts métier, présents et futurs :

| Composant | Rôle normatif |
|---|---|
| **FIL B** | Unique chaîne d'acquisition officielle |
| **Tool 01** v1.0.0 (`lou-pdf-to-canonical`) | Seul pipeline autorisé : PDF → Markdown source |
| **Tool 02** v1.0.0 (`lou-chapter-splitter`) | Seul pipeline autorisé : Markdown source → chapitres |
| **`official-college.md`** | Seule représentation textuelle officielle du collège (sortie Tool 01) |
| **Chapter packaging** | Structure normative `source.meta.yaml` + `inventory.yaml` + `blueprint.md` + projections + `build/reconciliation.yaml` |
| **Manifests** | Traçabilité Tool 01, Tool 02 et packages chapitre (hash, version, date) |
| **Modèle `section_path`** | Segmentation déterministe du Collège pour ancres et réconciliation |
| **Modèle d'ancres** (*quote anchors*) | `{ edition, section_path, quote }` — citation verbatim relocatable |
| **Grille P1–P7** | Seuls critères officiels de qualification du pipeline d'acquisition |

> **Règle.** Aucun composant aval ne peut introduire une seconde autorité sur le contenu officiel du Collège. Toute consommation passe par les artefacts produits par cette chaîne gelée.

---

## 3. Scope

### Périmètre couvert par cette ADR

Pipeline normatif — interface de sortie de l'acquisition :

```
Official College PDF
        ↓
Tool 01 — lou-pdf-to-canonical v1.0.0
        ↓
official-college.md
        ↓
Tool 02 — lou-chapter-splitter v1.0.0
        ↓
chapter package (chapters/item-*.md + source.meta.yaml)
```

Le **chapter package** est l'unité d'interface entre acquisition et pipeline métier. Il expose le texte officiel segmenté, les métadonnées d'édition et les index de section nécessaires à l'ancrage.

### Consommateurs de cette interface

| Consommateur | Usage |
|---|---|
| **Inventory** | Extraction et ancrage des knowledge points |
| **Blueprint** | Organisation pédagogique ancrée |
| **Projections** | Claim blocks traçables vers le Collège |
| **Renderer** | Affichage sans dépendance PDF |
| **lou-build** | Validation, build, traceability, grounding |
| **Validators** | Contrôles déterministes P4–P7 |

Tout développement aval **doit** s'appuyer sur cette interface. Aucun consommateur ne peut lire directement le PDF ni produire une seconde découpe officielle du Collège.

---

## 4. Validation Evidence

Les éléments suivants justifient le gel — sans reconstituer l'historique complet de qualification :

| Preuve | Constat |
|---|---|
| Tool 01 qualifié *fit for purpose* | Prose, listes, seuils numériques préservés ; SHA reproductible |
| Préservation information métier (P1) | Aucune perte systématique sur corpus et vertical slices |
| Déterminisme (P7a) | Regénération byte-identique Tool 01 ; tranches chapitre stables Tool 02 |
| Traçabilité (P3, P7c) | 286 ancres validées (234 + 330) ; manifests et `traceability.json` |
| Double vertical slice | Item **234** (narratif clinique, 109 KPs) et Item **330** (tableaux/posologies, 54 KPs) — `lou-build validate` PASS |
| Grille P1–P7 | Critères satisfaits sur les deux slices ; verdict final **GO** |
| Indépendance PDF aval (P6) | Renderer et lou-build sans référence PDF |

Ces preuves établissent que l'architecture **fonctionne** — pas qu'elle reproduit le PDF. Elles suffisent à acter la stabilité.

---

## 5. Normative Principles

Les principes suivants sont **normatifs** à compter de cette ADR. Toute évolution future doit les respecter ou être couverte par un nouvel ADR remplaçant celui-ci.

### NP-1 — Préservation de l'information, pas de l'apparence

> La couche d'acquisition préserve l'**information métier examinable** du Collège. Elle n'a pas pour mission de reproduire la mise en page, les pastilles graphiques ou le rendu visuel du PDF.

### NP-2 — Imperfection admise

> Une imperfection de représentation (structure tabulaire, colonne Rang, asset figure absent) **n'est pas un défaut** tant qu'elle n'entraîne ni perte d'information métier, ni impossibilité démontrée de générer correctement un artefact aval.

### NP-3 — Suffisance aval comme critère officiel

> Le critère de succès de l'acquisition est la **suffisance pour Inventory, Blueprint, projections et Renderer** — pas la similarité visuelle ou structurelle avec le PDF source.

### NP-4 — Déterminisme sans LLM

> Les outils déterministes de la chaîne d'acquisition (Tool 01, Tool 02, lou-build, validateurs) **ne doivent pas dépendre d'un LLM** pour produire ou valider le Markdown source ou les chapitres officiels.

### NP-5 — Traçabilité obligatoire

> Chaque fait porté par un artefact métier **doit** résoudre, par identifiants stockés, vers une citation verbatim stable du Collège — `{ edition, section_path, quote }`.

### NP-6 — Primauté du contenu médical

> L'**information métier prime sur le formatage**. Un écart de mise en forme Markdown n'autorise jamais une correction manuelle du texte source ; toute amélioration passe par une nouvelle exécution versionnée du pipeline.

---

## 6. Modification Policy

L'architecture gelée **ne peut évoluer** que dans l'un des cas suivants :

| Cas | Description |
|---|---|
| **A. Bug fonctionnel démontré** | Défaut prouvé bloquant la génération ou la traçabilité d'un artefact aval — correction Tool 01/02 ou lou-build avec incrément de version |
| **B. Nouveau format officiel des Collèges** | Source primaire autre que PDF (DOCX, HTML, XML…) — **nouveau pipeline qualifié** selon P1–P7, sans modifier rétroactivement le pipeline PDF gelé |
| **C. Nouvel ADR remplaçant celui-ci** | Décision explicite de gouvernance invalidant ou étendant ADR-004 |

### Motifs explicitement insuffisants

Les motifs suivants **ne constituent jamais** une raison suffisante de modifier l'architecture gelée :

- amélioration esthétique du Markdown ;
- recherche d'une meilleure ressemblance avec le PDF ;
- extraction de pastilles Rang A/B non requise par un artefact aval ;
- extraction d'assets figures raster non requise par une feature aval ;
- optimisation Tool 01/02 sans impact P4–P6 démontré.

> **Règle de version.** Toute modification autorisée (cas A ou B) incrémente la version du composant concerné et produit une nouvelle qualification P1–P7 sur le corpus de référence.

---

## 7. Out of Scope

Cette ADR **ne gouverne pas** les composants suivants — ils évoluent selon leurs propres contrats et phases roadmap :

| Domaine | Statut |
|---|---|
| Inventory (schéma, extraction, réconciliation sémantique) | Évolution continue — Phase 2 |
| Blueprint (pédagogie, compression cognitive) | Évolution continue |
| Projections (génération, grounding sémantique) | Évolution continue |
| Renderer (UX, annotation, visuals) | Évolution continue — ADR-002 |
| UX / Lecteur | Phase 1 |
| Pédagogie / archétypes | Phase 4 |
| Algorithmes d'apprentissage / mastery | Phases ultérieures |

La frontière est explicite : **cette ADR gèle l'entrée** ; elle ne fige pas le pipeline métier aval.

---

## 8. Consequences

### Mode maintenance

L'acquisition entre en **mode maintenance** : corrections de bugs (cas A), nouveaux formats source (cas B), mises à jour de sécurité ou de dépendances — sans recherche exploratoire.

### Fin de la R&D acquisition

La **R&D sur l'acquisition est terminée**. Aucun chantier ne doit rouvrir la question du format d'entrée, de la chaîne FIL B ou des critères P1–P7 sans cas A/B/C ci-dessus.

### Orientation des futurs développements

Les efforts projet se portent désormais sur :

| Priorité | Domaine |
|---|---|
| 1 | Industrialisation Inventory — scale-out 22 chapitres cardio |
| 2 | Blueprint et projections — automatisation Phase 2 |
| 3 | Renderer — Lecteur multi-chapitres (Phase 1) |
| 4 | Production à grande échelle — multi-collèges (Phase 5) |

### Cohérence avec ADR-003

[ADR-003](ADR-003-single-source-of-truth.md) actait FIL B comme chaîne unique et prévoyait une migration technique différée. Cette ADR **clôt** cette transition : les vertical slices de référence consomment exclusivement FIL B ; le FIL A legacy n'a plus de rôle opérationnel.

---

## 9. Exit Criteria Achieved

Les critères de sortie de R&D acquisition sont **officiellement acquise** :

| Critère | État |
|---|---|
| FIL B = SSOT opérationnel | ✅ Chaîne unique ; consommateurs 234/330 migrés |
| Tool 01 qualifié | ✅ *Fit for purpose* ; v1.0.0 gelé |
| Tool 02 qualifié | ✅ 22 chapitres ; manifest stable ; v1.0.0 gelé |
| Grille P1–P7 validée | ✅ Verdict GO sur 234 et 330 |
| Item 234 migré FIL B | ✅ 232/232 ancres ; validate/build PASS |
| Item 330 validé | ✅ 54 KPs ; validate/build PASS ; archétype tableaux |
| Pipeline aval indépendant du PDF | ✅ Renderer et lou-build sans référence PDF |

> **Conclusion.** L'architecture d'acquisition est **prête pour l'industrialisation**. Le plan de scale-out est défini dans [`industrialization-plan.md`](../acquisition/industrialization-plan.md).

---

## 10. Related Documents

| Document | Rôle |
|---|---|
| [ADR-003 — Single Source of Truth](ADR-003-single-source-of-truth.md) | Acte FIL B unique ; principe SSOT |
| [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Spécification opérationnelle chemins et règles SSOT |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Grille P1–P7 et philosophie suffisance aval |
| [`qualification-report-tool01-p1.md`](../acquisition/qualification-report-tool01-p1.md) | Qualification historique Tool 01 (Phase P.1) |
| [`qualification-report-phase-0b.md`](../acquisition/qualification-report-phase-0b.md) | Qualification dérivation Collège (Phase 0B) |
| [`qualification-report-acquisition-final.md`](../acquisition/qualification-report-acquisition-final.md) | Verdict GO final — clôture R&D |
| [`industrialization-plan.md`](../acquisition/industrialization-plan.md) | Feuille de route post-gel |
| [`releases/acquisition-rd-complete.md`](../releases/acquisition-rd-complete.md) | Jalon historique sortie R&D |
| [`PROJECT_STATE.md`](../PROJECT_STATE.md) | État opérationnel et jalons |

---

## Alternatives considérées

### Maintenir l'acquisition en R&D ouverte

**Rejetée.** Prolonger l'exploration (optimisations PDF, comparaisons de formats, retouches Markdown) consomme de la capacité projet sans débloquer les artefacts métier. Les deux vertical slices démontrent que la chaîne actuelle suffit.

### Geler uniquement Tool 01/02 sans acter les principes NP-1–NP-6

**Rejetée.** Sans principes normatifs explicites, chaque imperfection PDF risque de rouvrir des chantiers Tool 01 par habitude de reproduction visuelle — exactement le cycle que la révision P1–P7 a été conçue pour éviter.

### Fusionner acquisition et pipeline métier sous un seul gel

**Rejetée.** Inventory, Blueprint et projections sont encore en industrialisation active (Phase 1). Geler l'aval figerait prématurément la pédagogie et l'automatisation sémantique.
