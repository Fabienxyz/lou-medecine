# D-VCCK-STACK-EXTENSION — Stratégie d'extension des piles et d'extraction progressive

## Statut

Statut : **APPROVED**  
Date : 2026-08-06  
Identifiant : `D-VCCK-STACK-EXTENSION`  
Autorité : architecture VCCK — industrialisation chapitre 234 et familles suivantes  
Remplace : la recommandation Opus d'extraction immédiate d'un grand noyau VCCK commun (Design Review, contre-analyse code réel)

## Décision

La stratégie d'industrialisation VCCK repose sur **l'extension des piles existantes par primitive**, avec **extraction progressive des couches communes uniquement après convergence observée**. Aucun grand refactoring immédiat n'est autorisé.

### 1. Pas d'extraction immédiate d'un noyau global

Les modules `w1-*` et `cmm-*` partagent des noms de concepts mais **peu d'implémentation réellement commune**. Seule la couche `surface` présente une duplication forte et probablement mécanique. Les autres couches divergent selon les primitives et ne doivent pas être généralisées prématurément.

### 2. Pas de nouvelle pile complète par famille sœur

Lorsqu'une primitive dispose déjà d'une **famille ancre qualifiée**, les familles suivantes **étendent la pile existante** — avec toute la rigueur de qualification — sans créer de nouvelle pile autonome (aucun préfixe `w2-*`, `w3-*` ou équivalent pour une famille sœur).

Extensions autorisées par primitive :

| Famille cible | Famille ancre | Pile |
|---|---|---|
| `grouped-concurrent` | `flat-concurrent` | W1 (semantic-html) |
| `three-pole-reflow` | `two-pole` | W1 (semantic-html) |
| `fan-out` | `chain` | W1 (svg) |
| `lateral-feedback` | `chain` | W1 (svg) |
| `diamond` | `chain` | W1 (svg) |

### 3. Rigueur des preuves inchangée

Chaque qualification de famille — extension ou nouvelle — exige la même rigueur :

- contrat de composition perceptuelle préalable ;
- fixtures génériques positives et négatives ;
- budgets mesurés et bloquants ;
- preuves responsive ;
- déterminisme inter-processus ;
- mutants probants ;
- audit perceptuel indépendant.

La réutilisation d'une pile existante **ne réduit pas** le niveau de preuve ; elle réduit le **coût de socle** lorsque des couches convergent réellement.

### 4. Règle d'extraction progressive

Une couche commune n'est extraite que lorsqu'**au moins deux implémentations indépendantes convergent réellement** sur le même comportement. Une similitude de nom ou de responsabilité ne suffit pas.

Calendrier indicatif par couche :

| Couche | Action | Moment |
|---|---|---|
| `surface` | extraction mécanique possible | **maintenant**, après audit technique ciblé pré-W2 |
| interfaces gates / verdict / rapport | standardisation possible, sans fusion des implémentations | **maintenant**, avant W2 |
| `pipeline` | réévaluation | après **W2** |
| `plan` / `serialize` / `validate` | réévaluation | après **W3** |
| gates / verdict internes par famille | peuvent rester distincts | durablement |

### 5. Statut de la pile CMM

La famille `chapter-master-map` (CMM-R3 / CMM-0.3) est :

- **qualifiée V1** et **gelée** ;
- portée par une **pile exceptionnelle autorisée**, car issue d'une primitive réellement nouvelle ;
- **non utilisée comme précédent** pour créer de nouveaux silos de preuve ;
- **non migrée** vers un futur noyau sans bénéfice démontré.

CMM ne fait pas jurisprudence pour les familles sœurs des primitives W1.

### 6. Signatures et E3

La signature est **calculée et vérifiée comme critère de sortie de chaque visualSpec pendant E2**. E3 n'est plus une phase autonome bloquante : elle consolide la matrice d'admission 30/30 à partir des signatures déjà produites en E2.

### 7. Ordre de qualification recommandé

| Vague | Familles | Primitive ancre | Visuels 234 (indicatif) |
|---|---|---|---|
| **W2** | `grouped-concurrent`, `three-pole-reflow` | `flat-concurrent`, `two-pole` | 9 |
| **W3** | `fan-out`, `lateral-feedback`, `diamond` | `chain` | 6 |
| **W4** | familles décisionnelles (`skip-level-branch`, `binary-rule-out`, `monitoring-loop`, …) | `dependent-sequence` | 5 |
| **W5** | primitives sans ancre (`two-state`, `dual-context`, `ordered-state-scale`, …) | — | 3 — après arbitrage |

Aucune nouvelle famille ne doit être implémentée avant l'ouverture explicite de sa vague.

### 8. Jalon d'architecture pré-W2

Avant toute implémentation de qualification W2 :

1. **audit technique ciblé** de la couche `surface` (duplication `w1-*` / `cmm-*`) ;
2. **standardisation des interfaces** de preuve (gates, verdict, rapport) sans fusion des implémentations internes.

Ce jalon est un prérequis d'architecture, distinct de la qualification des familles W2.

## Hors périmètre

- modification du renderer CMM-R3 (famille gelée) ;
- génération réelle du chapitre 234 ;
- création de nouvelles familles dans la mission E2 courante ;
- migration rétroactive de CMM vers un noyau futur ;
- réduction du niveau de preuve pour accélérer une vague.

## Distinctions opératoires

| Concept | Signification |
|---|---|
| **Rigueur des preuves** | Niveau VCCK complet — inchangé pour toute famille |
| **Réutilisation de pile** | Extension depuis une famille ancre qualifiée sur la même primitive |
| **Extraction de couche commune** | Refactoring partagé — uniquement après convergence observée |
| **Nouvelle pile** | Autorisée uniquement pour une **primitive réellement nouvelle** (ex. CMM) |

## Références

- [`D-W1-QUALIFICATION.md`](D-W1-QUALIFICATION.md) — familles ancre W1 qualifiées
- [`D-VCCK-CHAPTER-MASTER-MAP-CONTRACT.md`](D-VCCK-CHAPTER-MASTER-MAP-CONTRACT.md) — contrat CMM
- [`../../../../docs/PROJECT_STATE.md`](../../../../docs/PROJECT_STATE.md) — état observé
- [`../../../../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml`](../../../../editorial-industrialization/v0/chapters/234/execution-roadmap.yaml) — séquence industrielle
