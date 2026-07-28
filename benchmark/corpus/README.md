# Corpus de référence — Qualification des pipelines d'acquisition

**Statut :** proposition — en attente de validation  
**Collège :** Cardiologie, édition 2022  
**Chaîne officielle :** FIL B — [`docs/SOURCE_OF_TRUTH.md`](../../docs/SOURCE_OF_TRUTH.md)  
**Dernière mise à jour :** 2026-07-28

---

## Rôle du corpus

Ce corpus est l'**échantillon officiel et immuable** sur lequel la chaîne d'acquisition **FIL B** (Tool 01, Tool 02) et tout pipeline candidat futur (DOCX, HTML, XML…) sont qualifiés en Phase P.

Il sert à :

1. **Comparer** les formats source et les pipelines candidats sur un périmètre identique ;
2. **Mesurer** la suffisance pipeline du Markdown source (critères **P1–P7** de [`docs/SOURCE_PIPELINE_QUALIFICATION.md`](../../docs/SOURCE_PIPELINE_QUALIFICATION.md)) ;
3. **Décider** GO / NO GO sans re-analyser l'intégralité des 22 chapitres du collège ;
4. **Rejouer** une qualification ultérieure (nouveau format, nouvelle version de pipeline) dans des conditions identiques.

Le corpus ne remplace pas la source officielle. Il en extrait un **sous-ensemble représentatif** des cas structurels que tout pipeline d'acquisition doit traiter correctement.

Chaque entrée du corpus est identifiée par son **numéro d'item EDN** et son titre officiel, tels que publiés dans le Collège de cardiologie 2022.

---

## Gel du corpus

Une fois le corpus **validé** par le propriétaire du projet :

1. La liste des items et leurs numéros sont **figés** ;
2. Toute modification (ajout, retrait, remplacement d'un item) exige une **décision écrite** et une **incrémentation de version** du corpus (ex. `corpus-v1.0.0` → `corpus-v1.1.0`) ;
3. Les résultats de qualification antérieurs restent attachés à la version du corpus sous laquelle ils ont été produits ;
4. Un pipeline requalifié sur un corpus modifié **ne peut pas** être comparé directement à une qualification antérieure.

Le gel intervient **avant** le premier benchmark. Cette itération propose le corpus ; elle ne le fige pas.

---

## Règle d'évaluation

> **Tous les futurs pipelines d'acquisition sont évalués exactement sur ce corpus — ni plus, ni moins.**

- Même liste d'items ;
- Même source officielle (Collège cardio 2022, même édition) ;
- Mêmes critères de qualification ;
- Aucun pipeline n'est qualifié sur un sous-ensemble différent ou sur l'intégralité du collège sans passer par une décision explicite de changement de corpus.

---

## Corpus proposé (5 chapitres)

Sélection minimale couvrant les cinq cas structurels exigés par la Phase P. Lorsqu'un chapitre couvre plusieurs cas, cela est indiqué pour justifier sa sélection unique.

| Item | Titre | Cas couverts | Lignes (approx.) |
|---|---|---|---|
| **221** | Athérome : épidémiologie et physiopathologie. Le malade polyathéromateux | Textuel · Rang A/B | ~350 |
| **231** | Électrocardiogramme : indications et interprétations | Figures · Tableaux · Rang A/B · Structure complexe | ~880 |
| **330** | Prescription et surveillance des classes de médicaments… | Tableaux · Rang A/B (dégradé) | ~840 |
| **234** | Insuffisance cardiaque de l'adulte | Structure complexe · Rang A/B · Textuel (partiel) | ~870 |
| **233** | Valvulopathies | Structure complexe · Figures · Rang A/B · Tableaux (partiel) | ~1 500 |

**Total :** 5 items sur 22 (~23 % du collège), ~4 440 lignes sur ~13 700 (~32 % du volume textuel).

---

## Détail et justification par chapitre

### Item 221 — Athérome

**Raison du choix.** Chapitre le plus **textuel** du collège : prose continue, peu de tableaux (12 lignes), une seule figure, structure hiérarchique classique (9 sections de niveau 2). Sert de **baseline** : un pipeline qui échoue ici sur du texte simple échouera partout.

**Cas couvert :** chapitre principalement textuel.

**Hiérarchisation :** table « Hiérarchisation des connaissances » présente — test des pastilles Rang A/B/C/D/E dans la source PDF.

---

### Item 231 — Électrocardiogramme

**Raison du choix.** Chapitre **multi-cas** à privilégier pour densifier le corpus sans l'alourdir :

- **Figures** : ~62 références (`Fig. 15.x`) — densité maximale du collège ; ECG, schémas de conduction, illustrations multimédia ;
- **Tableaux** : ~53 lignes de tableaux (morphologies, critères diagnostiques, indications) ;
- **Structure complexe** : alternance interprétation / indications, nomenclature ECG dense, légendes longues et multipanel (ex. figures A/B/C) ;
- **Hiérarchisation** : table de ~30 lignes avec rubriques diagnostiques fines.

**Cas couverts :** figures · tableaux · structure complexe · rangs A/B (via hiérarchisation).

---

### Item 330 — Prescription et surveillance des médicaments

**Raison du choix.** Chapitre **riche en tableaux** (~69 lignes, 14 références « Tableau 22.x ») : posologies, durées de traitement, interactions, surveillance biologique, comparaisons anticoagulants. C'est le test critique pour la **fidélité numérique médicale** (doses en mg, INR cibles, clairance seuil, durées en mois).

**Cas particulier — hiérarchisation dégradée.** Dans la conversion PDF actuelle, la section « Hiérarchisation des connaissances » n'est **pas** un tableau Markdown structuré (texte fusionné, colonnes perdues). Ce chapitre teste la capacité du pipeline à **reconstruire ou préserver** une structure tabulaire difficile — cas limite indispensable.

**Cas couverts :** tableaux · rangs A/B (structure de hiérarchisation, y compris cas dégradé).

---

### Item 234 — Insuffisance cardiaque de l'adulte

**Raison du choix.** Chapitre de **référence du projet** (Inventory, Blueprint, Projections). Structure clinique complète : définitions, diagnostic, étiologies, formes cliniques, traitement chronique et aigu. ~10 sections de niveau 2, ~35 sous-sections, ~8 encadrés, figures avec légendes radiologiques, posologies et seuils (FE, BNP, NYHA).

**Cas couvert :** structure complexe (narratif clinique multi-niveaux, encadrés, listes imbriquées).

**Cas partiel :** textuel (sections I–VII denses), rangs A/B (hiérarchisation ~25 lignes), figures et tableaux (densité modérée — complétée par 231 et 330).

---

### Item 233 — Valvulopathies

**Raison du choix.** Chapitre le **plus long** du collège (~1 500 lignes) et le plus **structurellement complexe** : ~52 sections de niveau 2, ~62 sous-sections, quatre valvulopathies traitées en parallèle (IM, RA, IA, RM) avec schémas répétitifs. Test de stress pour l'ordre de lecture, la profondeur hiérarchique et la non-confusion entre sections homologues.

**Cas couverts :** structure complexe (extrême) · figures (~23) · rangs A/B (hiérarchisation) · tableaux (modérés — complétés par 330).

**Complémentarité avec 234.** Même complexité globale, mais organisation **parallèle** (4 pathologies) vs **narrative linéaire** (234) — deux archétypes structurels distincts.

---

## Matrice de couverture

| Cas requis | Item 221 | Item 231 | Item 330 | Item 234 | Item 233 |
|---|:---:|:---:|:---:|:---:|:---:|
| Principalement textuel | ● | ○ | | ○ | |
| Riche en tableaux | | ● | ● | ○ | ○ |
| Riche en figures | | ● | ○ | ○ | ● |
| Rangs A/B (hiérarchisation) | ● | ● | ● | ● | ● |
| Structure complexe | | ● | | ● | ● |

● = cas principal · ○ = cas partiel (couvert par un autre item principal)

**Tous les cas requis sont couverts** par au moins un chapitre principal.

---

## Référence source

| Champ | Valeur |
|---|---|
| Collège | Cardiologie |
| Édition | 2022 |
| Source officielle (primaire) | `01-learning/full-edn/cardiology/edition-2022/official-college.pdf` |
| Markdown source (Tool 01) | `01-learning/full-edn/cardiology/edition-2022/official-college.md` |
| Chapitres (Tool 02) | `01-learning/full-edn/cardiology/edition-2022/chapters/` |

Le corpus est défini par **item EDN + titre**, ancré sur la **source primaire PDF** (FIL B). Les fichiers Markdown du FIL B servent de repère pour la préparation du benchmark ; ils ne remplacent pas le PDF comme source de vérité.

**Hors périmètre :** le FIL A legacy (`01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md`) n'est **pas** une source pour ce corpus — voir [`docs/SOURCE_OF_TRUTH.md`](../../docs/SOURCE_OF_TRUTH.md).

---

## Validation

| Étape | Statut |
|---|---|
| Analyse du collège et proposition | ✅ 2026-07-28 |
| Revue propriétaire | ⬜ En attente |
| Gel `corpus-v1.0.0` | ⬜ En attente |
| Premier benchmark | ⬜ Hors périmètre de cette itération |

---

## Documents connexes

| Document | Rôle |
|---|---|
| [`docs/SOURCE_OF_TRUTH.md`](../../docs/SOURCE_OF_TRUTH.md) | Chaîne officielle FIL B, SSOT |
| [`docs/SOURCE_PIPELINE_QUALIFICATION.md`](../../docs/SOURCE_PIPELINE_QUALIFICATION.md) | Critères P1–P7 (suffisance aval) |
| [`docs/acquisition/hypothesis-pipeline-impact-p1.md`](../../docs/acquisition/hypothesis-pipeline-impact-p1.md) | Analyse impact aval post-P.1 |
| [`docs/SOURCE_FORMAT_COMPARATIVE.md`](../../docs/SOURCE_FORMAT_COMPARATIVE.md) | Choix du format source |
| [`docs/acquisition/`](../../docs/acquisition/) | Dossier de qualification (pipeline, benchmark, rapport) — à produire |
