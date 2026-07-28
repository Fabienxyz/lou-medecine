# Lou Médecine — Index des contrats

**Type :** index documentaire — **non normatif**  
**Dernière mise à jour :** 2026-07-28  
**Audit source :** [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md)

Ce document est la **porte d'entrée** du système contractuel. Il n'énonce aucune règle métier, ne remplace aucun ADR ni aucun contrat existant.

---

## 1. Objectif

Lou Médecine transforme les Collèges EDN en supports d'étude traçables. Cette transformation repose sur des **obligations durables** — ce qui est autorisé, interdit, et garanti à chaque étape du pipeline.

Les **contrats fondamentaux** `docs/contracts/01–06` consolident ces obligations là où elles existent déjà — principalement dans [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md), [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md), les ADR et les contrats Tool — sans en inventer de nouvelles.

**Ils gouvernent :** la fidélité au Collège, l'identité des artefacts, l'acquisition, le chapter package, la grammaire visuelle, le renderer lecteur et la couche apprenant.

**Ils ne gouvernent pas :** le séquencement projet ([`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md)), l'état opérationnel ([`PROJECT_STATE.md`](../PROJECT_STATE.md)), la stratégie LLM ([`LLM_STRATEGY.md`](../LLM_STRATEGY.md)), ni les plans d'industrialisation ou rapports de qualification.

En cas de conflit de **priorités** produit, la roadmap l'emporte. En cas de conflit de **comportement** technique, la hiérarchie ci-dessous l'emporte.

---

## 2. Hiérarchie documentaire

Du plus autoritaire au moins autoritaire :

```
Décisions de gouvernance (ADR)
        ↓
Contrats fondamentaux (docs/contracts/01–06)
        ↓
Contrats composants (Tool 01/02 CONTRACT.md, futurs Tool 03–05)
        ↓
Documentation technique détaillée (IMPLEMENTATION_CONTRACT, VISUAL_GRAMMAR_CONTRACT, docs/renderer/, …)
        ↓
Code et tests (lou-build, validateurs, renderer)
        ↓
Implémentations de référence (REFERENCE_IMPLEMENTATION_DESIGN, chapitres 234/330)
        ↓
Rapports et documentation historique
```

**Contrats fondamentaux (01–06).** Référence **normative de gouvernance** Phase 0A — **en vigueur**. Chaque contrat répond à **une question unique** ; en cas de conflit sur une obligation métier, le contrat fondamental applicable prime sur toute documentation technique détaillée.

**Références détaillées** (sources de consolidation, non supprimées) :

| Document | Rôle |
|---|---|
| [`IMPLEMENTATION_CONTRACT.md`](../../IMPLEMENTATION_CONTRACT.md) | Spécification historique ratifiée ; détail des mécanismes, exemples, composants C.1–C.9 |
| [`VISUAL_GRAMMAR_CONTRACT.md`](../../VISUAL_GRAMMAR_CONTRACT.md) | Spécification visuelle détaillée (invariants I1–I12, primitives, schéma visualSpec) |
| [`docs/renderer/`](../renderer/) | Spécification produit et architecture du renderer lecteur |

Pour une **règle de gouvernance** : lire le contrat fondamental **01–06** applicable. Pour le **détail technique** ou l'historique : lire la référence détaillée correspondante.

**Règle de résolution :** le niveau supérieur prime. Un rapport ou un exemple de chapitre ne peut contredire un contrat ; un contrat ne peut contredire un ADR sans nouvel ADR.

**Acquisition gelée :** voir [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) et [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md).

---

## 3. Organisation des contrats (Phase 0A)

Statuts : **En vigueur** · **Gelé** (contrats composants Tool).

| Document | Responsabilité | Statut |
|---|---|---|
| **01-TRUST-AND-FIDELITY.md** | Fidélité source, classes de claim, réconciliation, grounding, fallback | En vigueur |
| **02-IDENTITY-AND-ANCHORS.md** | Identités chapitre/KP/éléments ; modèle d'ancres | En vigueur |
| **03-ACQUISITION-SSOT.md** | Interface acquisition : chaîne FIL B, Tools 01/02, grille P1–P7 | En vigueur |
| **04-CHAPTER-PACKAGE.md** | Inventaire, Blueprint, projections, manifest, build, publication | En vigueur |
| **05-VISUAL-GRAMMAR.md** | Visuels officiels : visualSpec, moteur de rendu graphique (build), gouvernance grammaire | En vigueur |
| **06-RENDERER-AND-LEARNER-LAYER.md** | Renderer lecteur, immutabilité, couche apprenant | En vigueur |

**Contrats composants gelés** (hors dossier `contracts/`, inchangés) :

| Document | Statut |
|---|---|
| [`01-learning/tools/01-pdf-to-canonical/CONTRACT.md`](../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md) | Gelé v1.0.0 |
| [`01-learning/tools/02-chapter-splitter/CONTRACT.md`](../../01-learning/tools/02-chapter-splitter/CONTRACT.md) | Gelé v1.0.0 |

---

## 4. Règles de lecture

| Type | Rôle |
|---|---|
| **Contrat fondamental (01–06)** | Obligation durable de gouvernance : entrées, sorties, invariants, garanties |
| **ADR** | Décision de gouvernance : contexte, choix, conséquences — pas un schéma de données |
| **Contrat Tool** | Garanties entre composants d'un outil et l'aval |
| **Documentation technique détaillée** | Profondeur d'implémentation, schémas, exemples — subordonnée aux contrats 01–06 pour les règles métier |
| **Code / tests** | Implémentation et vérification ; en cas d'écart documenté, le contrat prime |
| **Implémentation de référence** | Exemple (Item 234, 330) — illustration, pas autorité |
| **Rapport de qualification** | Preuve de conformité passée — ne modifie jamais un contrat |

Pour savoir *ce qui doit être vrai* : lire le **contrat fondamental** applicable (01–06).  
Pour savoir *pourquoi c'est ainsi* : lire l'**ADR**.  
Pour savoir *comment c'est spécifié en détail* : lire la **documentation technique** (`IMPLEMENTATION_CONTRACT`, `VISUAL_GRAMMAR_CONTRACT`, `docs/renderer/`).  
Pour savoir *si c'est implémenté* : lire le **code** et les **tests**.

---

## 5. Principes

1. **Une règle, un endroit** — chaque obligation normative vit dans un seul contrat fondamental.
2. **Renvoyer, ne pas recopier** — les autres documents pointent vers la section concernée.
3. **Pas de duplication** — SSOT documentaire autant que SSOT acquisition.
4. **Invariants, pas implémentations** — les contrats décrivent des invariants, pas des implémentations.
5. **Stabilité** — ces contrats visent plusieurs années ; les changements passent par amendement explicite ou ADR.
6. **Ce fichier reste un index** — ce document ne contient volontairement aucune règle métier ; toute nouvelle obligation normative doit être ajoutée dans un contrat numéroté ou dans un ADR, jamais dans cet index.

---

## Documents connexes

| Document | Usage |
|---|---|
| [ADR-001](../adr/ADR-001-freeze-svg-grammar-catalogue.md) · [ADR-002](../adr/ADR-002-renderer-v2-architecture.md) · [ADR-003](../adr/ADR-003-single-source-of-truth.md) · [ADR-004](../adr/ADR-004-acquisition-architecture-frozen.md) | Gouvernance |
| [`PHASE_0A_CONTRACT_AUDIT.md`](../PHASE_0A_CONTRACT_AUDIT.md) | Inventaire et cartographie ayant motivé cette structure |
