# Phase P.1 — Rapport de qualification Tool 01

> **Note historique :** ce rapport utilise la grille **C1–C13** (orientation reproduction PDF). Supersédée par la révision post-P.1 dans [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) § 0 et § 7 (critères **P1–P7**, suffisance aval). Les anomalies listées ont été réévaluées dans [`hypothesis-pipeline-impact-p1.md`](hypothesis-pipeline-impact-p1.md) — hypothèse **confirmée** ; optimisations Tool 01 **suspendues**.

**Pipeline évalué :** `lou-pdf-to-canonical` v1.0.0 (Tool 01)  
**Date :** 2026-07-28  
**Périmètre :** qualification **exclusive** de Tool 01 — aucune comparaison avec un autre pipeline  
**Corpus :** 5 chapitres proposés dans [`benchmark/corpus/README.md`](../../benchmark/corpus/README.md) (cardiologie 2022)  
**Source primaire :** `01-learning/full-edn/cardiology/edition-2022/official-college.pdf`  
**Artefact évalué :** `01-learning/full-edn/cardiology/edition-2022/official-college.md` (sections chapitre via Tool 02, byte-identiques aux tranches Tool 01)

---

## Méthode

1. **Analyse structurelle** automatisée et lecture ciblée des 5 chapitres Markdown (Tool 02 = découpe sans transformation du Markdown Tool 01).
2. **Confrontation PDF ↔ Markdown** via la couche texte du PDF (`pdfjs-dist`, même moteur que Tool 01) sur les zones sensibles : hiérarchisation, tableaux, figures.
3. **Test de reproductibilité** : regénération complète Tool 01 vers `/tmp/tool01-qual/` — comparaison SHA-256 avec l'artefact commité.
4. **Grille** : critères C1–C13 de [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md), regroupés selon les axes demandés (texte, hiérarchie, tableaux, figures, numériques, listes, ancres, reproductibilité).

**Note méthodologique :** le corpus n'est pas encore gelé (`corpus-v1.0.0` en attente) ; ce rapport est valide pour la proposition de corpus du 2026-07-28.

---

## Synthèse globale

| Critère global | Appréciation |
|---|---|
| Fidélité textuelle (C1) | **Conforme** — prose, listes et encadrés présents |
| Hiérarchie titres (C2) | **Conforme** — structure `#` / `##` / `###` cohérente |
| Tableaux (C3) | **Partiellement conforme** — anomalies localisées (330, 231) |
| Figures et légendes (C4–C5) | **Partiellement conforme** — références et légendes textuelles ; pas d'assets binaires |
| Valeurs numériques (C8) | **Conforme** sur échantillon — posologies et seuils préservés |
| Rangs A/B (C6) | **Non conforme** — colonne Rang systématiquement vide |
| Listes (C1/C7) | **Conforme** |
| Stabilité / reproductibilité (C9–C10) | **Conforme** — égalité binaire vérifiée |
| Automatisation / traçabilité / LLM (C11–C13) | **Conforme** |

---

## Évaluation par chapitre

### Item 221 — Athérome (~352 lignes)

| Critère | Note /5 | Observations | Exemple | Impact aval |
|---|---:|---|---|---|
| Fidélité textuelle | 5 | Prose continue intégrale ; listes « Situations de départ » complètes | 34 situations listées (l. 12–44) | Inventory / segmentation : base fiable |
| Hiérarchie titres | 5 | 9 sections niveau 2 (`## I Épidémiologie` …) + sous-sections | `## I Épidémiologie` → `### A Mortalité…` | Ancres de section stables |
| Tableaux | 4 | 1 tableau hiérarchisation + tableaux data rares ; 1 fusion de cellules | L. 53 : mortalité/morbidité fusionnée en une cellule « Épidémiologie » | Mineur pour l'Inventory ; gênant pour une matrice Rang |
| Figures / légendes | 4 | 1 figure référencée + légende | `cf. fig. 1.1` (l. 99) ; `*Fig. 1.1 Physiopathologie…*` (l. 117) | Renderer : pas d'asset image ; texte suffisant pour traçabilité |
| Valeurs numériques | 5 | Peu de doses ; pas d'altération détectée | — | — |
| Listes | 5 | 146 lignes de listes | Puces épidémiologie (l. 67+) | Segmentation liste OK |
| Rangs A/B (C6) | 2 | Table hiérarchisation structurée mais **colonne Rang vide** sur 10 lignes | L. 48–59 : `\|  \| Définition \| …` | **Majeur** : couche exam EDN incomplète |
| Ancres / reproductibilité | 5 | Tranche chapitre déterministe dans le collège complet | `manifest.json` chapitre index 1, l. 1–352 | CI / rebuild OK |

**PDF (page 2) :** la couche texte contient `Rang Rubrique Intitulé Descriptif` puis les rubriques, **sans lettres A/B/C/D/E** extractibles. Les pastilles de rang sont graphiques hors couche texte.

---

### Item 231 — Électrocardiogramme (~883 lignes)

| Critère | Note /5 | Observations | Exemple | Impact aval |
|---|---:|---|---|---|
| Fidélité textuelle | 5 | Chapitre dense ; nomenclature ECG préservée | Dérivations, axes, valeurs normales (l. 130+) | Base solide pour Item le plus « figure-heavy » |
| Hiérarchie titres | 4 | Structure globale bonne ; 1 **tableau data injecté dans le flux hiérarchique** | Voir C3 | Confusion sémantique pour parsers |
| Tableaux | 2 | **Misclassification majeure** : Tableau 15.2 reconstruit comme table hiérarchisation | L. 149–156 : `\| Tableau 15.2 \| … \| + \| + \| Entre 0 et 90° : normal \|` | **Majeur** : tableau clinique illisible en Markdown structuré |
| Figures / légendes | 4 | ~122 mentions `Fig.` ; ~60 légendes dédiées (`*Fig. …*`) | L. 161–177 : légendes multipanel 15.5–15.7 avec crédits | 231 : ~50 % refs inline sans bloc légende dédié — acceptable pour traçabilité textuelle |
| Valeurs numériques | 5 | Seuils ECG préservés | « 25 mm/s », « < 110 ms », « > 120 ms » (l. 181–186) | Grounding posologies OK |
| Listes | 5 | 185 lignes de listes | Territoires ECG (l. 137–144) | OK |
| Rangs A/B (C6) | 2 | Hiérarchisation l. 30–57 : 28 lignes, **Rang vide** ; fusion colonnes Rubrique/Intitulé sur plusieurs lignes | L. 37 : « Diagnostic positif de branche, les hémiblocs et \| Identifier les blocs… » | **Majeur** pour examens |
| Ancres / reproductibilité | 5 | — | SHA chapitre `401f662c…` | OK |

**Exemple C3 bloquant local :**

```markdown
| Rang | Rubrique | Intitulé | Descriptif |
| Tableau 15.2 |  |  | Position de l’axe en fonction de la polarité de D1 et aVF. |
| + | + | Entre 0 et 90° : normal |  |
```

Le tableau d'axe QRS (polarité D1/aVF) est interprété comme une ligne de hiérarchisation — **perte de structure tabulaire médicale**.

---

### Item 330 — Prescription médicaments (~838 lignes)

| Critère | Note /5 | Observations | Exemple | Impact aval |
|---|---:|---|---|---|
| Fidélité textuelle | 4 | Texte descriptif riche ; quelques listes absorbées dans des tableaux | L. 139 : « 3 Indications » fusionné dans un pipe table | Segmentation bruitée |
| Hiérarchie titres | 4 | Sections I–VI présentes | `## I Antiagrégants…` | OK |
| Tableaux | 2 | **14 tableaux référencés** ; plusieurs malformés ou fusionnés | Voir exemples ci-dessous | **Majeur** pour posologies / scores cliniques |
| Figures / légendes | 4 | Refs `fig. 22.x` + légendes partielles | `*Tableau 22.4…*` en italique hors pipe (l. 201) — pattern mixte | Incohérence de parsing |
| Valeurs numériques | 4 | Doses largement présentes (112 occurrences unités) ; risque d'erreur de lecture sur tableaux fusionnés | « 75 mg », « 18 UI/kg/h », « ClCr < 30 mL/min » (l. 208–213) | **Majeur** si tableau 22.1/22.2 mal lu automatiquement |
| Listes | 4 | 222 lignes ; parfois adjacentes à tableaux cassés | — | — |
| Rangs A/B (C6) | 1 | **Hiérarchisation non tabulaire** — texte aplati | L. 32–46 : pas de `\| Rang \|` ; PDF p. 546 a pourtant les en-têtes | **Bloquante locale** pour cet item |
| Ancres / reproductibilité | 5 | — | OK | OK |

**PDF p. 546 :** en-têtes `Rang | Rubrique | Intitulé` positionnés (x≈44/92/162), lignes de contenu présentes — **Tool 01 n'a pas reconstruit la grille** (échec classificateur hiérarchie).

**Exemples C3 :**

1. **Tableau 22.1** — légende absorbée comme ligne de tableau, colonnes vides :

```markdown
| Tableau 22.1 | Posologies de l’aspirine. |  |  |
| Dose de charge pour les SCA |  | Dose d’entretien… | antipyrétique |
| 250–300 mg |  | 75–160 mg/j | 500 mg à 2 g/j |
```

2. **Tableaux 22.2 + 22.3 fusionnés** (l. 128–139) — deux tableaux distincts en un seul pipe table ; ligne « 3 Indications » incluse.

3. **Tableau 22.7** — lignes fragmentées (l. 299–301) + duplication en prose (l. 303–304).

4. **Tableau 22.4** — en-tête de colonnes décalé (l. 205–209) : « Action par antithrombine rein ».

**Hiérarchisation (l. 32–46) :**

```markdown
Rang Rubrique Intitulé
Antiagrégants plaquettaires : connaître les mécanismes d’action…
Prise en secondaires, interactions médicamenteuses…
```

Contenu médical présent mais **structure EDN perdue**.

---

### Item 234 — Insuffisance cardiaque (~872 lignes)

| Critère | Note /5 | Observations | Exemple | Impact aval |
|---|---:|---|---|---|
| Fidélité textuelle | 5 | Chapitre de référence projet ; contenu clinique dense intact | Définitions IC, OAP, choc (l. 61+) | Vertical slice exploitable |
| Hiérarchie titres | 5 | ~10 sections niveau 2, ~35 sous-sections | `## V Traitement` → `### A Traitement…` | OK pour Blueprint |
| Tableaux | 3 | Tableaux data corrects ; hiérarchisation avec **fusions de colonnes** | L. 51 : « Connaître la différence entre Connaître la différence entre œdème… » (dup texte) | Mineur à majeur selon ligne |
| Figures / légendes | 4 | 7 légendes `*Fig. 18.x*` ; légendes multipanel parfois sur 2 lignes | L. 307–313 : Fig. 18.4–18.5 | Renderer : pas d'image ; texte OK |
| Valeurs numériques | 5 | FE, BNP, NYHA, posologies | Seuils FEVG, doses IEC (l. 54+) | Grounding médical OK |
| Listes | 5 | 259 lignes ; encadrés en blockquotes | 4 encadrés (l. 83, 490, 625, 657) | Distinction officiel / généré facilitée |
| Rangs A/B (C6) | 2 | 24 lignes hiérarchisation, **Rang vide** ; fusions Rubrique/Intitulé | L. 52–53 : ligne « Diagnostic positif Savoir argumenter… » cassée sur 2 rows | **Majeur** |
| Ancres / reproductibilité | 5 | — | Item de référence FIL B | OK |

---

### Item 233 — Valvulopathies (~1 500 lignes)

| Critère | Note /5 | Observations | Exemple | Impact aval |
|---|---:|---|---|---|
| Fidélité textuelle | 5 | Chapitre le plus long ; 4 valvulopathies parallèles preserved | Sections IM / RA / IA / RM | Stress test structurel OK |
| Hiérarchie titres | 5 | ~52 sections niveau 2 — profondeur maximale | `## II Rétrécissement aortique` | Navigation complexe mais ordonnée |
| Tableaux | 4 | 34 lignes pipe ; modérés vs 330 | Tableaux sévérité / indications présents | OK |
| Figures / légendes | 4 | ~65 refs ; 23 légendes dédiées ; légendes longues multipanel | L. 257–258 : Fig. 8.5 A/B transœsophagienne | Idem 231 : pas d'asset |
| Valeurs numériques | 5 | Grades, surfaces valvulaires, seuils | Vitesses Vmax, gradients | OK |
| Listes | 5 | 563 lignes — volume maximal | Critères diagnostic IM/RA | OK |
| Rangs A/B (C6) | 2 | 12 lignes hiérarchisation, **Rang vide** ; quelques fusions Intitulé/Descriptif | L. 55 : « Connaître la valeur primordiale… Diagnostic positif, diagnostic du diagnostic de sévérité » | **Majeur** |
| Ancres / reproductibilité | 5 | — | OK | OK |

---

## Critères transversaux (C9–C13)

| # | Critère | Résultat | Preuve |
|---|---|---|---|
| C9 | Stabilité des ancres | **Conforme** | Regénération identique ; découpage Tool 02 stable (`chapters/manifest.json`) |
| C10 | Reproductibilité | **Conforme** | SHA-256 `692396ce…` identique commit ↔ regen 2026-07-28 |
| C11 | Automatisation | **Conforme** | `node cli.js --input official-college.pdf` ; 573 pages en ~1,5 s |
| C12 | Traçabilité | **Conforme** | `manifest.json` : PDF hash, MD hash, version, stats, validation OK |
| C13 | Sans LLM | **Conforme** | Pipeline `pdfjs-dist` + reconstructeurs déterministes |

---

## Points conformes

- **Reproductibilité byte-identique** du Markdown sur le collège complet (C10).
- **Exhaustivité textuelle globale** sur le corpus : pas de section entière absente ; listes et encadrés (blockquotes) bien détectés (221, 234).
- **Hiérarchie de titres** Markdown utilisable pour navigation et segmentation (C2).
- **Valeurs numériques et unités** médicales préservées sur les chapitres à enjeu posologique (330, 234) — pas d'altération systématique du type « 75 mg → 7,5 mg » (C8).
- **Ordre de lecture** cohérent avec le PDF (C7).
- **Manifest et validation** Tool 01 sans erreur bloquante (`validation.ok: true`).
- **Figures** : références textuelles (`Fig. N`) et légendes présentes dans la majorité des cas (C5) ; conforme au contrat Tool 01 qui **n'extrait pas** les assets raster (C4 partiel, attendu).

---

## Points non conformes

| ID | Chapitre | Critère | Description |
|---|---|---|---|
| NC-1 | Tous (221, 231, 233, 234, 330) | C6 | Colonne **Rang** vide dans toutes les tables hiérarchisation reconstruites |
| NC-2 | 330 | C3, C6 | Hiérarchisation **non reconstruite** en table (texte aplati) |
| NC-3 | 231 | C3 | **Tableau 15.2** (axe QRS) classé comme hiérarchisation |
| NC-4 | 330 | C3 | **Tableaux 22.1, 22.2/22.3, 22.7** malformés ou fusionnés |
| NC-5 | 234, 221, 233, 231 | C3 | Fusions de colonnes / duplication de texte dans certaines lignes hiérarchisation |
| NC-6 | Tous (figures) | C4 | Aucun fichier image traçable (`0` lien `![…](…)`) — limitation contractuelle Tool 01 |

---

## Anomalies par gravité

### Bloquante

| ID | Anomalie | Justification |
|---|---|---|
| **B-1** | Item **330** — hiérarchisation non tabulaire (NC-2) | Structure EDN entièrement perdue sur un chapitre du corpus ; contenu médical présent mais **non exploitable** comme matrice Rang/Rubrique/Intitulé |

*Note :* l'absence systématique des lettres de rang (NC-1) n'est **pas** classée bloquante au niveau Tool 01 seul : analyse PDF — **0 page** sur 22 hiérarchisations ne contient de lettres `A`–`E` extractibles dans la colonne Rang (pastilles graphiques hors couche texte). C'est une **limitation du format PDF source**, documentée dans [`DECISIONS.md`](../../01-learning/tools/01-pdf-to-canonical/DECISIONS.md). Elle devient bloquante pour la **Phase 0B** si aucune stratégie de récupération n'est définie.

### Majeure

| ID | Anomalie | Chapitres |
|---|---|---|
| **M-1** | Colonne Rang vide — perte information exam EDN | 221, 231, 233, 234, 330 |
| **M-2** | Misclassification tableau data → hiérarchisation | 231 (Tableau 15.2) |
| **M-3** | Fusion / malformation tableaux posologiques | 330 (22.1, 22.2/22.3, 22.7) |
| **M-4** | Fusions textuelles dans lignes hiérarchisation | 231, 234, 233 |
| **M-5** | Absence d'assets figures (C4 strict) | 221, 231, 233, 234, 330 |

### Mineure

| ID | Anomalie | Chapitres |
|---|---|---|
| **m-1** | Légendes figures parfois inline sans bloc `*Fig.*` dédié | 231 (~50 % refs) |
| **m-2** | Légendes multipanel réparties sur plusieurs lignes | 234, 233 |
| **m-3** | Tableaux avec légende en italique hors pipe table | 330 |
| **m-4** | Fusion cellule unique hiérarchisation (mortalité/morbidité) | 221 l. 53 |
| **m-5** | Typographie : « Encadre » vs « Encadré » (234 l. 490 — fil legacy avait typo similaire) | 234 |

---

## Recommandations de correction

### Priorité 1 — Tool 01 (avant gel définitif)

1. **Item 330 hiérarchisation** (B-1) : corriger le classificateur / reconstructeur pour la page PDF 546 — en-têtes `Rang/Rubrique/Intitulé` détectés en géométrie mais non émis en pipe table.
2. **Anti-faux-positif hiérarchisation** (M-2) : exclure les grilles dont la première colonne data contient `Tableau N.N` ou des symboles `+`/`-` (Tableau 15.2).
3. **Séparation tableaux contigus** (M-3) : empêcher la fusion Tableau 22.2 + 22.3 + titre de section suivante.
4. **En-têtes de tableaux** (M-3) : ne pas absorber « Tableau 22.1 | titre » comme ligne de données ; émettre légende + grille séparées.

### Priorité 2 — Phase 0B (hors Tool 01 strict, mais requis médicalement)

5. **Rangs A/B** (M-1) : stratégie explicite — extraction vision/OCR des pastilles, ou format source alternatif (DOCX/HTML), ou annotation manuelle **versionnée en entrée pipeline** (pas de retouche Markdown).
6. **Assets figures** (M-5) : pipeline d'extraction raster + manifest `figures/` (Phase 0B).

### Priorité 3 — Qualification suite

7. Re-exécuter P.1 sur corpus gelé après corrections 1–4.
8. Compléter `docs/acquisition/pipeline.md` et `benchmark.md` pour rejouabilité intégrale Phase P.

---

## Décision

### **GO avec corrections**

**Motivation.**

| Exigence | Verdict |
|---|---|
| Principe de fidélité médicale (texte, posologies, listes) | **Respecté** sur le corpus — pas d'altération systématique de doses, seuils ou paragraphes entiers |
| Violations « jamais acceptables » (NO GO immédiat) | **Aucune** altération de posologie avérée ; pas de figure **disparue** (refs présentes) ; tableaux **partiellement** dégradés mais valeurs souvent recoverables en lecture humaine |
| Reproductibilité / automatisation (C9–C11) | **Sans réserve** |
| C6 rangs A/B | **Non conforme** — limitation PDF + colonne vide ; à traiter en 0B, pas bloquant pour acter Tool 01 comme transformateur PDF→MD **sous réserve** |
| Item 330 | **Anomalies bloquantes locales** — corrections Tool 01 requises avant extension industrielle au-delà du pilote |

**Conditions du GO :**

1. Corriger **B-1** et **M-2** / **M-3** dans Tool 01, puis **requalifier** sur le même corpus.
2. Documenter **M-1** comme limite acceptée du PDF dans `qualification-report.md` final jusqu'à stratégie 0B.
3. Geler le corpus (`corpus-v1.0.0`) avant la requalification.

**Non retenu :**

- **GO** pur — anomalies majeures tableaux (330, 231) et hiérarchisation 330 non résolues.
- **NO GO** — le pipeline est **reproductible**, **automatique**, et **majoritairement fidèle** ; les écarts identifiés sont **corrigeables** sans remettre en cause l'architecture FIL B.

---

## Références

| Document | Rôle |
|---|---|
| [`benchmark/corpus/README.md`](../../benchmark/corpus/README.md) | Corpus 5 chapitres |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](../SOURCE_PIPELINE_QUALIFICATION.md) | Grille C1–C13, GO/NO GO |
| [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) | Chaîne FIL B |
| [`ADR-003-single-source-of-truth.md`](../adr/ADR-003-single-source-of-truth.md) | Décision gouvernance |
| [`01-learning/tools/01-pdf-to-canonical/CONTRACT.md`](../../01-learning/tools/01-pdf-to-canonical/CONTRACT.md) | Garanties / non-garanties Tool 01 |
| `01-learning/full-edn/cardiology/edition-2022/manifest.json` | Traçabilité regen |

---

## Annexe — Métriques corpus

| Item | Lignes MD | Titres | Lignes `\|` table | Refs Fig. | Légendes `*Fig.*` | Hiérarchisation pipe | Col. Rang remplie |
|---|---:|---:|---:|---:|---:|---|---|
| 221 | 353 | 28 | 12 | 2 | 1 | Oui | Non |
| 231 | 883 | 18 | 53 | 122 | 60 | Oui (+ faux positif) | Non |
| 330 | 838 | 38 | 69 | 10 | 4 | **Non** | Non |
| 234 | 872 | 46 | 31 | 13 | 7 | Oui | Non |
| 233 | 1 500 | 115 | 34 | 65 | 23 | Oui | Non |

**Reproductibilité (2026-07-28) :** `markdown_sha256 = 692396ceb4e7e33b990cf9d60c2e50acf1a29461150eff13bdeadd8bba336fcd` (commit = regen).
