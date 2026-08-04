# Prototypage éditorial et migration — Plan d'exécution

| | |
|---|---|
| **Type** | Plan d'exécution de domaine — **pilotage chantier** |
| **Statut** | **Actif** — 2026-08-04 |
| **Autorité** | Pilotage du chantier **uniquement** — ne remplace ni ADR, ni contrats, ni specs |
| **Objectif actif** | **Phase 1A** — prototypage éditorial avec Lou (hors Reader) |
| **Dépendances** | [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) · [`PROJECT_STATE.md`](../PROJECT_STATE.md) · [`phase-0-baseline-gate-2026-08-04.md`](../analysis/phase-0-baseline-gate-2026-08-04.md) |
| **Exclusion** | Ce plan **ne crée aucun invariant** technique ou éditorial normatif |
| **Export Word** | Support de consultation et Product Review mobile — **non autoritaire** ; voir §14 |

**Décision directrice :** la migration doit rendre possible le **contrat éditorial natif des sept vues** — pas seulement supprimer les dépendances legacy. Le contrat éditorial cible **guide** le modèle technique ; l'existant ne dicte pas le produit futur.

**Chapitre de référence :** Item **234** (laboratoire produit). Item **330** : tranche understanding partielle — cf. §13.

**Baseline :** commit `5734832d907e6274fd54ba1756e8231c3a6d78e2` · tag `baseline-phase-0-2026-08-04`.

---

## 1. Principes non négociables

1. Le **contrat éditorial cible** guide le modèle technique — l'existant ne dicte pas le produit futur.
2. La migration est **additive et réversible** jusqu'à la certification RELEASE finale.
3. Migration structurelle, refonte éditoriale et nettoyage définitif = **lots distincts**.
4. Knowledge Points, ancres, traçabilité et grounding sont **préservés**.
5. Les identifiants d'éléments restent **stables** lorsque leur sens ne change pas.
6. Le patrimoine apprenant est **copié et vérifié** avant toute suppression d'un ancien format.
7. Aucune ancienne catégorie (projection legacy) ne peut **limiter** le MM, les Notions ou les Cas cliniques cibles.
8. **Aucune intégration Reader**, publication package ni modification de contrat normatif **avant validation Lou** (gate Phase 1A).
9. Les **sept vues Reader** ([`00-READER-V1-PRODUCT-MODEL.md`](../renderer/00-READER-V1-PRODUCT-MODEL.md)) sont la grille produit — les projections Fabrique (`story`, `overview`, `mechanisms`, `clinical-reasoning`, etc.) **ne sont pas** des vues produit.

---

## 2. Phase 0 — Baseline (clôturée avec réserves)

**Décision :** clôturée 2026-08-04 — détail et preuves dans [`phase-0-baseline-gate-2026-08-04.md`](../analysis/phase-0-baseline-gate-2026-08-04.md).

| Gate | Décision |
|---|---|
| Phase 0 | Close avec réserves |
| Phase 1A | **Autorisée** |
| Phase 1B | Autorisée (conception seulement) |
| Phase 2 migration technique | **Bloquée** |

**Réserves baseline** (non exhaustif — voir gate doc) : six smokes rouges connus ; Product Review humaine non exécutée ; SW auto-enregistré non validé en parcours réel ; rollback documenté non testé ; fixture bibliothèque impropre ; patrimoine apprenant dépendant d'identifiants legacy ; chapitre 330 incomplet comme release.

---

## 3. Phase 1A — Prototypage éditorial avec Lou

**Objectif :** finaliser le **contrat éditorial cible** par l'évaluation de contenus réels — **sans** modifier Reader, packages publiés, contrats d'autorité ni identités de release.

### 3.1 Ordre opérationnel (234)

1. Modélisation globale du chapitre 234.
2. Cartographie conjointe **MM → Notions → Cas cliniques**.
3. Variantes du Modèle mental (1 à 3 SVG).
4. Notions pilotes.
5. Cas cliniques pilotes.
6. Product Review Lou (Word mobile-first).
7. Consolidation du contrat éditorial (décisions validées → ce plan, puis promotion normative ultérieure).

### 3.2 Canal Word mobile-first

- Lou consulte les prototypes sur **iPhone** — documents Word simples et linéaires.
- Revue sur le **fond** : structure cognitive, SVG, walkthroughs, wording, degré de détail.
- **Ne valide pas** le style final ni l'interface Reader.
- Chaque SVG : source SVG + PNG haute résolution intégré au Word.
- Éviter tableaux larges, colonnes multiples, contenus nécessitant un zoom permanent.
- Repères courts : `MM-1`, `MM-2`, `N01`, `N02`, `CC01`, etc.

### 3.3 Modélisation globale du chapitre

- Identifier tous les **territoires** du chapitre et le raisonnement global.
- Vérifier la couverture des grandes parties (source + Inventory).
- Liste exhaustive des **Notions candidates** et leurs relations.
- Connaissances mobilisées dans les **Cas cliniques**.
- Produire la **cartographie MM → Notions → Cas** avant toute génération visuelle.

### 3.4 Prototypes Modèle mental (1 à 3 SVG)

Expérimenter selon la valeur cognitive :

| Variante | Description |
|---|---|
| **A** | Un seul SVG global |
| **B** | SVG maître + un complément |
| **C** | SVG maître + deux compléments |

Pour chaque variante, documenter : objectif cognitif par SVG ; blocs ; visual spec / SVG / walkthrough ; Notions accessibles ; avantages, limites, charge cognitive.

**Baseline historique :** la RPC Phase 1 a produit une figure MM (`MM-pump-decompensation`) et un walkthrough — **acquis technique clôturé**, **non** assimilé au contrat éditorial cible validé par Lou.

### 3.5 Notions pilotes

- TOC complète, ordre pédagogique, regroupements.
- Fiche par Notion : question, figure si utile, walkthrough, développement traçable, points d'attention.
- Liens prérequis / associés.
- Couverture : physiopathologie, phénotypes, sémiologie, diagnostic, étiologies, formes aiguës, traitement, suivi, pronostic.

### 3.6 Cas cliniques pilotes

| Cas | Rôle |
|---|---|
| Typique | Application standard |
| Piège | Erreur diagnostique ou thérapeutique |
| Décompensation aiguë | Urgence |
| Synthèse | Mobilise plusieurs Notions |

Chaque étape du raisonnement **référence les Notions mobilisées**.

### 3.7 Production par lots

| Lot | Objet | Gate |
|---|---|---|
| **Lot 1 — MM** | Carte globale, variantes SVG, walkthroughs, liste Notions | Validation Lou avant approfondissement |
| **Lot 2 — Notions pilotes** | 4 Notions représentatives (physiopath., diagnostic, traitement, suivi/pronostic) | Format validé |
| **Lot 3 — Cas pilotes** | Typique, piège, synthèse | Les cas **appliquent** les Notions |
| **Lot 4 — Chapitre complet** | Reste du contenu | Uniquement après validation des formats pilotes |

### 3.8 Product Review avec Lou

| Vue | Points à valider |
|---|---|
| **Modèle mental** | Clarté globale, couverture chapitre, mémorisabilité, nombre/objectif des SVG, walkthroughs |
| **Notions** | Complétude, granularité, ordre, détail, figures, compréhension avant mémorisation |
| **Cas cliniques** | Application authentique des Notions, réalisme, progression, pas de cours théorique déguisé |

### 3.9 Classification des retours Lou

| Catégorie | Traitement |
|---|---|
| Règle générale validée | Candidate promotion normative (post Phase 1A) |
| Préférence éditoriale de Lou | Consignée ; distingue 234 vs généralisable |
| Décision propre au 234 | Documentée dans le plan |
| Hypothèse à retester (autre chapitre) | Marquée « à retester » |
| Problème médical / grounding | Escalade — pas d'intégration |
| Problème visuel | Itération prototype |
| Problème navigation / articulation | Cartographie MM→Notions→Cas |

### 3.10 Gate de sortie Phase 1A

Phase 1A terminée lorsque Lou valide :

- le MM représente clairement **l'ensemble du chapitre** ;
- le nombre et l'objectif des SVG sont justifiés ;
- walkthroughs précis et adaptés ;
- liste et granularité des Notions satisfaisantes ;
- passage MM → Notions naturel ;
- Cas cliniques **appliquent** réellement les Notions ;
- niveau de détail distinct et cohérent par vue ;
- wording aligné avec sa manière d'apprendre.

**Sortie :** consolidation du contrat éditorial dans ce plan → ouverture Phase 1B (modèle technique cible).

---

## 4. Phase 1B — Conception du modèle technique cible

**Autorisée** — **conception uniquement**, sans intégration ni chaîne parallèle.

Concevoir **après** Product Review Phase 1A les structures rendant le contrat exécutable. Chaque champ répond à une exigence éditoriale — aucun champ ne reproduit une projection legacy par commodité.

| Domaine | Contenu cible |
|---|---|
| Modèle mental | SVG maître, ≤2 compléments, ordre, questions, walkthroughs, territoires |
| Notions | Registre conceptuel, KP, relations, figures, walkthroughs, points d'attention |
| Cas cliniques | Scénarios référant explicitement les Notions |
| Navigation | Cartographie nœud/territoire MM → Notions → Cas |
| Identités | Continuité éléments ; règles de succession si changement sémantique |

---

## 5. Phase 2 — Compatibilité temporaire et chaîne parallèle

**Bloquée** jusqu'à levée des réserves ([gate](../analysis/phase-0-baseline-gate-2026-08-04.md) §3).

```
Ancienne chaîne → package actuel → Reader actuel
Nouvelle chaîne → package candidat → validations et comparaison
```

- Adaptateur temporaire : anciens packages → modèle natif sept vues.
- Préserve chapitres non migrés ; versionné ; date/condition de retrait.
- **Ne devient jamais** une architecture permanente.

---

## 6. Patrimoine apprenant

**Cible d'ancrage :** chapitre + vue Reader + élément stable.

| Étape | Action |
|---|---|
| 1 | Lire ancienne donnée |
| 2 | Résoudre destination via **table explicite** (projection legacy → artefact natif) |
| 3 | Écrire copie au nouveau format ; vérifier accessibilité |
| 4 | Conserver original pendant compatibilité |
| 5 | Orphelins = **visibles**, jamais supprimés silencieusement |
| 6 | Retrait ancien format **après** certification RELEASE |

**Exigences baseline :** table couvre surlignages, notes walkthrough, formatages SVG, diagrammes personnels, reprise de session. Ancres SVG non résolues : signalées, quantifiées, récupérables. Parité vérifiée sur jeux représentatifs avant suppression.

---

## 7. Phases 3 à 5 — Pilotes, bascule, suppression

| Phase | Résultat attendu |
|---|---|
| **3 — 234 natif** | MM global, 1–3 SVG, Notions complètes, Cas applicatifs, liens inter-vues ; aucune projection legacy dans le package cible |
| **4 — Contre-épreuve** | Compléter/recertifier **330** **ou** autre package complet — démontrer généricité du modèle natif |
| **5 — Bascule** | Passage contrôlé après parité, Product Review, tests offline/recherche/patrimoine, rollback prouvé |
| **Nettoyage RELEASE** | Suppression identifiants/chemins/alias/fixtures legacy — **après** certification |

---

## 8. Gates DEV / PAS / RELEASE

| Niveau | Périmètre |
|---|---|
| **DEV** | Baseline, structures candidates, adaptateur, validations ciblées |
| **PAS** | Validation produit complète 234 ; puis contre-épreuve ; navigation et patrimoine inclus |
| **RELEASE** | Bascule finale, rollback prouvé, suppression dépendances legacy, certification exhaustive |

Référence : [`TEST_ARCHITECTURE_V1.md`](../testing/TEST_ARCHITECTURE_V1.md).

---

## 9. Règles d'arrêt

Arrêt immédiat si :

- un KP ou une ancre disparaît ;
- un contenu n'a pas de destination claire ;
- une donnée apprenante devient introuvable ;
- une vue perd une capacité existante ;
- packages actuel et candidat divergent sans justification ;
- le rollback n'est pas démontré ;
- le 330 est utilisé comme contre-épreuve **complète** avant complétion/recertification.

---

## 10. Critères de réussite finaux

- Chapitre neuf produisable **sans projection legacy**.
- MM : 1 à 3 SVG selon décision pédagogique explicite.
- Carte cognitive et Notions **conçues conjointement**.
- Toutes les grandes parties du chapitre positionnées.
- Notions **non** limitées à la physiopathologie.
- Cas cliniques référencent et appliquent des Notions existantes.
- Liens MM → Notions générés et validés.
- Reader : navigation prévue entre contenus (post migration).
- 234 : couverture, traçabilité, patrimoine préservés ; contre-épreuve complète démontre les mêmes garanties.
- Aucune structure héritée ne limite les choix éditoriaux.

---

## 11. Relation avec la roadmap RPC 234

| Séquence | Statut | Remarque |
|---|---|---|
| **RPC Phases 0–0.1** (Fabrique → Reader) | Clôturées | Acquis technique — [`MASTER_ROADMAP.md`](../MASTER_ROADMAP.md) |
| **RPC Phase 1** (MM intégré Reader) | Clôturée | **Baseline historique** — non contrat cible validé |
| **RPC Phase 2** (Amorçage cognitif) | **Suspendue** comme prochain chantier autonome | Reprise après contrat global vues prioritaires validé |
| **RPC Phases 3–4** (Notions, Cas) | **Suspendues** en séquence linéaire | Remplacées par conception conjointe Phase 1A |
| **RPC Phases 5–9** | Inchangées en intention | Après Product Freeze — voir roadmap globale |

Ce plan **ne supprime pas** l'historique RPC — il **réordonne** le travail éditorial avant toute nouvelle intégration Reader.

---

## 12. Distinction des « Phase 2 »

| Nom | Périmètre | Statut |
|---|---|---|
| **Phase 2 RPC** — Amorçage cognitif | Intégration vue Amorçage dans Reader/package | **Suspendue** |
| **Phase 2 migration** — intégration technique | Chaîne parallèle, adaptateur, bascule | **Bloquée** |

---

## 13. Statut du chapitre 330

| Attribut | Valeur |
|---|---|
| Rôle | Tranche understanding / archétype tableaux-posologies |
| Exploitation Phase 1A | Matériau partiel MM, Notions, Collège — **pas** contre-épreuve complète |
| Publication | **Non publiable** — pas d'identité release |
| Phase 4 migration | Compléter/recertifier **ou** autre chapitre complet — **décision différée** |

---

## 14. Synchronisation Markdown ↔ Word

| Règle | Application |
|---|---|
| **Source autoritaire** | Ce fichier Markdown (`docs/plans/editorial-prototyping-and-migration-plan.md`) |
| **Word** | Export daté de consultation ; retours bruts Lou recueillis possiblement dans le Word |
| **Décisions validées** | Réintégrées **uniquement** dans ce Markdown |
| **Règles stabilisées** | Promues ensuite dans l'autorité normative appropriée (contrat, ADR) — **pas** avant validation Lou |
| **Export de référence** | `Lou Médecine — Plan de prototypage éditorial et de migration — post-audit Opus.docx` — **non autoritaire** |

---

## Annexe A — Ancien contrat éditorial (historique)

> **VERSION OBSOLÈTE — NE PAS EXÉCUTER — SOURCE HISTORIQUE DES DÉCISIONS PRODUIT**

Le texte ci-dessous est conservé comme trace des arbitrages produit ayant motivé la Phase 1A. Il **ne constitue ni un plan d'action, ni un prompt d'exécution, ni une autorité normative**.

### Contexte (historique)

Le Reader est structuré en sept vues (Modèle mental, Notions, Cas cliniques, …). Une revue du chapitre 234 a montré que le MM actuel est essentiellement une cascade physiopathologique — insuffisant pour la promesse produit (carte cognitive de l'ensemble du chapitre).

### Arbitrages produit validés (source des décisions Phase 1A)

- Le Modèle mental représente l'**organisation cognitive de l'ensemble du chapitre**.
- **Notions** = couche complète d'explication conceptuelle.
- **Cas cliniques** = application des Notions — pas remplacement de leur explication.
- Conception par raisonnement global exhaustif → carte MM + cartographie Notions **simultanément**.
- Génération SVG/walkthroughs **après** validation de la modélisation.
- MM : **1 à 3 SVG** ; si plusieurs, un SVG maître global obligatoire.
- Navigation vers Notions **après** le MM — liens par identifiants stables, pas liens manuels dans le walkthrough.

### Objectif historique (non exécuté tel quel)

Formaliser ces décisions dans les documents d'autorité — **sans** modifier projections, Blueprint, SVG, walkthroughs, Composition runtime ou contenu 234. Ce objectif est **remplacé** par la Phase 1A (prototypage Word + validation Lou) définie en §3.

---

*Plan actif — Phase 1A — 2026-08-04. Mise à jour : synchroniser avec PROJECT_STATE à chaque jalon.*
