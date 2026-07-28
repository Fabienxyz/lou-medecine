# Index des contrats composants

**Type :** index documentaire — **non normatif**  
**Dernière mise à jour :** 2026-07-28  
**Index parent :** [`../00-INDEX.md`](../00-INDEX.md)

Ce dossier regroupe les **contrats composants** : spécialisations durables d’un composant du système, **subordonnées** aux ADR et aux contrats fondamentaux 01–06.

Ils ne redéfinissent pas l’architecture. Ils ne remplacent pas la documentation technique ni le code.

---

## Hiérarchie

```
ADR
  ↓
Contrats fondamentaux (01–06)
  ↓
Contrats composants   ← ce dossier
  ↓
Documentation technique
  ↓
Code et tests
```

---

## Contrats en vigueur

| Document | Composant | Statut |
|---|---|---|
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Renderer (lecteur) | En vigueur |

---

## Contrats Tool (hors dossier, gelés)

| Document | Statut |
|---|---|
| [`01-learning/tools/01-pdf-to-canonical/CONTRACT.md`](../../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md) | Gelé v1.0.0 |
| [`01-learning/tools/02-chapter-splitter/CONTRACT.md`](../../../01-learning/tools/02-chapter-splitter/CONTRACT.md) | Gelé v1.0.0 |

---

## Documents connexes

| Document | Usage |
|---|---|
| [`../00-INDEX.md`](../00-INDEX.md) | Index des contrats fondamentaux |
| [ADR-001](../../adr/ADR-001-freeze-svg-grammar-catalogue.md) · [ADR-002](../../adr/ADR-002-renderer-v2-architecture.md) · [ADR-003](../../adr/ADR-003-single-source-of-truth.md) · [ADR-004](../../adr/ADR-004-acquisition-architecture-frozen.md) · [ADR-005](../../adr/ADR-005-learner-layer-annotation-anchoring.md) | Gouvernance |
| [`../../governance/RENDERER_COMPLIANCE_COMPLETION.md`](../../governance/RENDERER_COMPLIANCE_COMPLETION.md) | Clôture conformité Renderer |
