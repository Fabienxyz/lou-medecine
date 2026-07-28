# ADR-005 — Learner-layer annotation anchoring

## Statut

**Accepted**

## Date

2026-07-28

## Titre

Modèle architectural d'ancrage des annotations de la couche apprenant

---

## Contexte

ADR-002 a établi l'architecture Renderer V2 : contenu officiel immuable, couche apprenant en overlays, mécanismes apprenant **distincts** et non fusionnés en un éditeur générique.

Dans ADR-002 §4, les notes inline de la couche apprenant étaient définies comme des **Inline Notes ancrées à la frontière d'un bloc de claim** (obligation héritée de `IMPLEMENTATION_CONTRACT.md` C.9), aux côtés des diagrammes personnels (C.8) et des annotations par sélection textuelle (V2).

Cette composition a ensuite divergé dans l'évolution produit du lecteur :

- la lecture sur papier exige des notes **au fil du texte**, pas seulement aux frontières de claim ;
- le lecteur a retenu des **walkthrough notes** ancrées par position de caret dans le flux textuel officiel du walkthrough ;
- la documentation technique Renderer V2.2 a acté l'abandon du pipeline claim-block pour ces notes, sans nouvel ADR.

Les contrats fondamentaux 02 et 06, consolidés en Phase 0A, ont repris l'ancrage claim-block pour les notes inline. Il en résulte un conflit ouvert entre :

- la décision ADR-002 §4 et les contrats 02 / 06 ;
- l'architecture effectivement retenue pour le Lecteur.

ADR-002 ne suffit plus : il fige encore un modèle d'ancrage que le projet a volontairement quitté pour les notes de lecture.

---

## Problème

Quelle est, désormais, la **décision d'architecture durable** pour ancrer les annotations apprenant dans le walkthrough officiel — sans rouvrir l'immutabilité, sans inventer d'identifiants médicaux, et sans unifier les mécanismes apprenant ?

---

## Décision

À compter du **2026-07-28**, le modèle d'ancrage suivant est **acté** pour les annotations de la couche apprenant :

### 1. Notes de walkthrough — ancrage par caret dans le texte officiel

Les notes personnelles portées **dans** le walkthrough officiel s'ancrent par une **position de caret** dans le flux textuel officiel de ce walkthrough (**modèle CaretAnchor**).

Elles restent **structurellement rattachées** à un **identifiant d'élément pédagogique déjà défini** — aucun nouvel espace d'identifiants médicaux n'est créé.

Ce modèle **remplace** l'obligation architecturale d'ancrer ces notes à une paire `(élément pédagogique, bloc de claim)`.

### 2. Annotations par sélection textuelle — ancrage distinct

Les surlignages et annotations issus d'une **sélection textuelle** dans le walkthrough officiel conservent un ancrage **par sélection** dans ce texte. Ils demeurent un **mécanisme distinct** des notes de walkthrough (caret). Les deux coexistent ; l'un ne remplace pas l'autre.

### 3. Diagrammes personnels — inchangés

Les diagrammes personnels restent ancrés exclusivement à l'**identifiant d'élément pédagogique**, jamais au visuel officiel. Cette décision ne les modifie pas.

### 4. Invariants préservés

Cette décision **ne change pas** :

- l'**immutabilité** du contenu officiel publié ;
- la **séparation** contenu officiel / couche apprenant (overlays à l'affichage ; jamais d'écriture dans le Chapter Package) ;
- l'interdiction d'introduire de **nouveaux identifiants médicaux** pour la couche apprenant ;
- la **séparation** des mécanismes apprenant (pas de système générique d'édition) ;
- l'**indépendance** du renderer lecteur vis-à-vis du pipeline métier (consommation du package publié uniquement).

### 5. Portée unique

Cet ADR décide **uniquement** le modèle d'ancrage des annotations apprenant. Il ne spécifie ni formats de persistance, ni APIs, ni UX, ni inventaire exhaustif de tous les mécanismes apprenant futurs.

---

## Conséquences

### Positives

- Alignement de la gouvernance ADR sur l'architecture réellement retenue pour les notes de lecture.
- Ancrage des notes au comportement observé (noter *dans* le texte), distinct des frontières de claim réservées à la traçabilité médicale.
- Clarification : le bloc de claim reste une unité de **traçabilité officielle**, pas l'ancre obligatoire des notes apprenant.

### Coûts / contraintes

- Les contrats fondamentaux **02** et **06** (et toute reprise de C.9 comme obligation d'ancrage claim-block pour les notes) doivent être **amendés** pour refléter cette décision — hors rédaction du présent ADR.
- La durabilité des notes caret n'est **pas** garantie au même titre qu'un identifiant de claim-block : une régénération majeure du walkthrough peut empêcher la restauration. La dégradation doit rester **honnête** (signalement, jamais suppression silencieuse des données apprenant hors package) — détail normatif à porter dans les contrats amendés / documentation technique, non ici.
- ADR-002 §4 n'est plus la référence pour l'ancrage des notes inline claim-block.

### Neutres

- Le reste d'ADR-002 (immutabilité, `docs/renderer/`, anti-framework rewrite, séparation browser/build, legacy programmé, non-goals) **demeure en vigueur**.
- La traçabilité médicale par bloc de claim (contrats 01 / 02) **n'est pas affectée**.

---

## Alternatives rejetées

### Maintenir l'ancrage claim-block (C.9) comme seul modèle de notes

**Rejetée.** Compatible avec la traçabilité, mais insuffisante pour le geste de lecture (noter au fil du texte). Le projet l'a déjà quittée volontairement ; la reconduire figerait une incohérence gouvernance / Lecteur.

### Unifier notes caret, surlignages et diagrammes en un seul système d'annotation

**Rejetée.** Contredit ADR-002 (mécanismes distincts) et diluerait la frontière apprenant en un éditeur générique — explicitement hors objectifs du renderer.

### Ancrer les notes uniquement sur l'élément pédagogique, sans position dans le texte

**Rejetée.** Trop grossier pour des notes de lecture ; perdrait le lien au passage lu.

### Traiter l'écart comme une dette d'implémentation sans ADR

**Rejetée.** L'ancrage est un invariant d'architecture déjà décidé en ADR-002 §4 et consolidé dans les contrats 02 / 06. Seul un ADR ultérieur peut le réviser ([`PHASE_0A_COMPLETION.md`](../governance/PHASE_0A_COMPLETION.md)).

---

## ADR supersedés / amendés

| Document | Effet |
|---|---|
| [ADR-002](ADR-002-renderer-v2-architecture.md) **§4** | **Supersedé** en ce qu'il exige des *claim-block Inline Notes (C.9)* comme mécanisme d'ancrage des notes dans le walkthrough. |
| ADR-002 §1–§3, §5–§7 | **Inchangés** |
| ADR-001, ADR-003, ADR-004 | **Aucun effet** |

ADR-002 demeure **Accepted** pour le reste de ses décisions. Pour l'ancrage des notes de walkthrough, **ADR-005 prime**.

---

## Contrats impactés

Amendement **requis** (non réalisé par cet ADR) :

| Contrat | Nature de l'impact |
|---|---|
| [02 — Identity & Anchors](../contracts/02-IDENTITY-AND-ANCHORS.md) §11 | Remplacer l'ancrage note inline `(élément, bloc de claim)` par le modèle caret + élément pédagogique |
| [06 — Renderer & Learner Layer](../contracts/06-RENDERER-AND-LEARNER-LAYER.md) §8.2 | Aligner la définition des notes de walkthrough sur le modèle CaretAnchor ; clarifier la distinction avec §8.3 |

Les contrats 01, 03, 04 et 05 ne sont pas impactés par cette décision d'ancrage.

---

## Notes de transition

- Jusqu'à l'amendement des contrats 02 et 06, **ADR-005 prime** sur toute formulation claim-block relative aux notes apprenant dans le walkthrough.
- La documentation technique Renderer V2.2 reste une description d'implémentation ; elle **ne remplace pas** cet ADR.
- Aucune migration de données claim-block n'est exigée par cette décision (aucune obligation de conserver un double modèle).
- Les sujets hors périmètre (persistance, UX, `known_absent`, formatage SVG, contrat composant Renderer, etc.) ne sont **pas** tranchés ici.
