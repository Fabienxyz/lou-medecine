# Audit — Relation éditoriale Modèle mental ↔ Notions

| | |
|---|---|
| **Date** | 2026-08-03 |
| **Type** | Audit documentaire — aucune modification code |
| **Décision produit auditée** | Le Modèle mental est la carte cognitive **minimale** ; les blocs MM **ne déterminent plus automatiquement** les notions ; liens MM → Notion **optionnels** ; notions **sans lien entrant MM** légitimes |
| **Périmètre** | Composition V1, Reader, Fabrique (lecture seule), contrats, tests, docs Freeze |

---

## 1. Synthèse

| Question | Réponse |
|---|---|
| L'hypothèse « 1 bloc MM = 1 notion » existe-t-elle encore **dans le code** ? | **Non** — Composition assemble `story` et `mechanisms` indépendamment ; aucune règle runtime 1:1 |
| Existe-t-elle encore **dans la documentation normative** ? | **Oui (avant correction)** — 6 documents Reader/RPC figeaient une correspondance implicite ou explicite |
| Le package 234 contredit-il déjà la nouvelle règle ? | **Non** — `story.md` : 2 blocs (`ANA-*`, `MM-*`) ; `mechanisms.md` : 11+ éléments `MEC-*` / `CONF-*` |
| Développement supplémentaire requis ? | **Non** pour cette décision — clarification éditoriale uniquement |

---

## 2. Constats runtime (lecture seule — hors périmètre modification)

| Couche | Comportement observé | Hypothèse 1:1 ? |
|---|---|---|
| **Composition V1** | `mental-model` ← `story` ; `notions` ← `mechanisms` — sources disjointes | **Non** |
| **Composition Engine** | `blocksFromProjection` par projection ; pas de jointure MM→MEC | **Non** |
| **Renderer** | Rend les blocs listés dans le RVM par vue | **Non** |
| **Navigation MM → Notions** | Spec Reader §3 prévoit clic schéma → Notions ; **non implémenté** à ce jour (`rpc-234-execution-audit` G-gap zoom/navigation) | Spec **présupposait** lien ; pas de garde 1:1 en code |
| **Session CE-02** | `onNotionChanged` déclenché sur clic bloc en vue **Notions** uniquement | **Non** |
| **Lou Build / Blueprint** | Notions = séquence Blueprint ; MM = éléments `mental_model` / `MM-*` distincts | **Découplé structurellement** |

**Conclusion runtime :** l'architecture V1 **n'impose pas** la correspondance 1:1. Seule la **documentation éditoriale** et certaines **specs UX futures** l'affirmaient encore.

---

## 3. Cartographie documentaire

| Fichier | Règle / passage | Compatible ? | Action |
|---|---|---|---|
| `docs/renderer/21-CONTENT-CONSUMPTION-FREEZE.md` §2.2 | « blocs structurants (une ligne par notion), navigation vers Notions » | **Non** | Corrigé |
| `docs/renderer/00-READER-V1-PRODUCT-MODEL.md` §2.2 | idem | **Non** | Corrigé |
| `docs/renderer/15-READER-FUNCTIONAL-SPECIFICATION.md` §3, §4.4 | « une ligne par notion » ; clic bloc → Notions **sans condition** | **Non** | Corrigé |
| `docs/renderer/14-LOU-READER-ARCHITECTURE.md` glossaire | « Notion = bloc structurant du chapitre » | **Non** | Corrigé |
| `docs/rpc/10-BOUCLE-1-COMPREHENSION.md` | Ordre de production linéaire MM → notions ; livrable « Blocs structurants MM = Séquence Blueprint (notions Boucle 1) » | **Non** | Corrigé — passes 1 et 2 |
| `docs/renderer/20-READER-V1-SHELL-ARCHITECTURE.md` §4.3 | « Clic schéma → Notion » sans condition | **Partiel** | Corrigé — lien optionnel |
| `docs/renderer/READER-COMPOSITION-V1-FREEZE.md` | Mapping 1 artefact / vue — **pas** de lien MM↔Notion | **Oui** | Note explicite ajoutée |
| `docs/testing/TEST_ARCHITECTURE_V1.md` | PAS-MM / PAS-NOTIONS — rendu par vue, pas de cardinalité | **Oui** | Aucune modification |
| `docs/contracts/04-CHAPTER-PACKAGE.md` | Blueprint = sélection ; MM = vue d'ensemble | **Oui** | Aucune modification |
| `docs/contracts/06-RENDERER-AND-LEARNER-LAYER.md` | Séparation Composition / Renderer | **Oui** | Aucune modification |
| `demo/renderer/test/*` | Tests par projection / vue ; pas d'assert count MM === count MEC | **Oui** | Hors périmètre (non modifié) |
| `docs/analysis/rpc-234-execution-audit.md` | Gap navigation MM→Notions non implémentée | **Neutre** | Référence historique |

---

## 4. Règle éditoriale formalisée (normative)

### Passe 1 — Depuis le Modèle mental

1. Produire la **carte cognitive minimale** : figure MM + walkthrough court.
2. Pour **chaque bloc / nœud** du schéma MM : décision éditoriale Fabrique.
3. **Si** le nœud mérite une notion dédiée → créer notion (schéma + walkthrough) + **lien explicite** MM → Notion.
4. **Sinon** → aucune notion ; **aucun lien** ; situation **normale**.

### Passe 2 — Notions complémentaires

1. La Fabrique peut découvrir des notions importantes **sans origine** dans un bloc MM.
2. Ces notions sont **légitimes** ; elles apparaissent dans la TOC Notions **sans** lien entrant depuis le MM.

### Invariants produit

- Le Modèle mental **n'a pas vocation** à couvrir toutes les notions du chapitre.
- Une notion **peut être indépendante** du schéma principal.
- L'**absence de notion** associée à un bloc MM est **normale**.
- La navigation Reader MM → Notion (quand implémentée) ne s'applique **qu'aux liens déclarés** — jamais par inférence automatique 1:1.

---

## 5. Cohérence avec les gels existants

| Gel / chantier | Impact de la décision |
|---|---|
| **Composition V1** | Aucun — vues et projections déjà indépendantes |
| **MM Cleanup** | Aucun — consommation `story` seule inchangée |
| **Content Consumption Freeze** | Renforcement — frontière MM / Notions clarifiée éditorialement |
| **PAS-MM / PAS-NOTIONS** | Aucun — invariants AAI portent sur l'alimentation par vue, pas sur la cardinalité éditoriale |
| **AAI-COMP-V1-01** (1 artefact / vue) | Compatible — règle par **vue**, pas par bloc inter-vues |

---

## 6. Impacts futurs (hors scope — aucun dev requis maintenant)

| Domaine | Impact potentiel | Quand |
|---|---|---|
| **Fabrique / Blueprint** | Modéliser liens MM→Notion optionnels ; passe 2 explicite | Production éditoriale Phase 3 |
| **Reader navigation** | Implémenter clic schéma → Notion **conditionnel** au lien déclaré | PAS-SHELL S3 / Shell |
| **SVG MM** | Zones cliquables par nœud **avec** ou **sans** cible Notion | Production figures |
| **Search** | Index séparé par vue — inchangé | — |

---

## 7. Conclusion

L'hypothèse « 1 bloc MM = 1 notion » était une **dette documentaire**, pas un invariant d'architecture. Le runtime V1 et le chapitre 234 **étaient déjà compatibles** avec la décision produit. **Aucun développement supplémentaire n'est requis** pour acter cette règle — seule la documentation normative a été alignée.
