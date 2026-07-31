# Audit éditorial — corpus évaluation Item 234

Date: 2026-07-31  
Lot: capitalisation tranche 2 — couverture understanding complète + introduction mastery

## Synthèse

| Indicateur | Valeur |
|---|---|
| Questions publiées | **81** |
| Scénarios publiés | **3** (standard, trap, synthesis) |
| Niveau Release déclaré | `complete` |
| Couverture KP understanding par QCM | **91/91 (100 %)** |
| KP deferred-to-mastery couverts par QCM | **9/16** (progressif) |
| validate / build | **PASS** |
| Issues Q structurelles | **0** |
| Issues S structurelles | **0** |

## Conformité contrats

| Contrôle | Résultat |
|---|---|
| 07 score_model edn_v1 | PASS |
| 07 tier 1 présent sur chaque Q | PASS |
| 07 ≥2 options + explications | PASS |
| 07 couverture chapitre complémentaire | PASS (91 KP understanding) |
| 07 priorité deferred-to-mastery (progressive) | PASS (9 Q mastery taguées) |
| 09 kinds complémentaires | PASS (standard, trap, synthesis) |
| 09 ≥2 KP / scénario | PASS |
| 09 trap explicite | PASS |
| 08 disjointure Q⊥S | PASS |
| 08 absences honnêtes | PASS (`known_absent=['actors', 'readiness']`) |
| 08 volumes PDR-A3 | PASS (81 QCM dense ~70 ; 3 cas dans cible 3–5) |

## Équilibre éditorial (81 QCM)

| Catégorie | Nombre | Commentaire |
|---|---:|---|
| Définitions | 3 | KP-001, 002, 004, 005 |
| Physiopathologie | 10 | Mécanismes, compensations, transmission congestive |
| Diagnostic | 12 | Symptômes, signes, formes cliniques, HFpEF |
| Examens | 6 | ECG, radio, NP, ETT, algo chronique, coros |
| Thérapeutique | 15 | Classes HFrEF, mesures générales, OAP, parcours |
| Complications / pronostic | 3 | Histoire naturelle, mortalité, complications |
| Pièges | 7 | Confounders NP, CI médicamenteuses, règles BB OAP vs VI.C |
| Raisonnement clinique | 25 | Étiologies, formes aiguës, étiologie, CHAMPIT (via scénarios + Q) |

Répartition volontairement dense en **raisonnement clinique** et **diagnostic**, cohérente avec la densité du chapitre IC (109 KP).

## Redondances

- **Aucune redondance massive** détectée : pas de paire de questions testant le même fait sous la même forme.
- **Complémentarité QCM / Scénarios** : 17 KP partagés (angle atomique vs intégré) — validé tranche 1, inchangé.
- **Angles distincts sur KP proches** :
  - OAP : q-234-11 (domicile/KP-099), q-234-70 (hôpital/KP-100), sc-234-synthesis-01
  - BB : q-234-12 (CI/VII.A), sc-234-trap-01 (VI.C vs VII.A)
  - NP : q-234-06 (rule-out aigu), q-234-40 (algo chronique), q-234-73 (seuils positifs mastery)

## Couverture KP

### Understanding — 91/91 couverts

Voir `build/evaluation-kp-coverage-qcm.txt` pour le détail question par KP.

### Deferred-to-mastery — 9/16 couverts (progressif)

| KP | Question(s) | Niveau |
|---|---|---|
| KP-031 | q-234-75 | mastery |
| KP-037 | q-234-73 | mastery |
| KP-044 | q-234-74 | mastery |
| KP-049 | q-234-79 | mastery |
| KP-058 | q-234-81 | mastery |
| KP-070 | q-234-76 | mastery |
| KP-086 | q-234-77 | mastery |
| KP-088 | q-234-78 | mastery |
| KP-101 | q-234-80 | mastery |

### Deferred restants sans QCM (écart documenté, maîtrise spécialisée)

| KP | Motif d'écart |
|---|---|
| KP-046 | IRM cardiaque — bilan étiologique spécialisé |
| KP-047 | Holter / VO2 — explorations pronostiques avancées |
| KP-048 | Scintigraphie isotopique — niche technique |
| KP-093 | Clip mitral percutané — indication rare |
| KP-094 | Transplantation — filière terminale |
| KP-095 | Assistances ventriculaires — filière terminale |
| KP-102 | Nicardipine IV OAP hypertensif — détail posologique |

Ces 7 KP restent couverts par la **projection understanding** ; l'écart porte uniquement sur la **vérification QCM mastery**, conformément à l'introduction progressive demandée.

## Traçabilité

- Chaîne **source → KP (inventory.yaml) → question (kp_refs + claim_facets)** maintenue sur l'ensemble du corpus.
- Génération tranche 2 : `build/generate-questions-tranche2.mjs` + `build/questions-tranche2-spec.json`.
- Registre : `questions/registry.yaml` (81 entrées `published`).

## Gates

```
npm run validate -- ../../01-learning/chapters/cardio/234  → PASS
npm run build    -- ../../01-learning/chapters/cardio/234  → PASS
```

## Prochaines évolutions possibles (hors périmètre lot)

- Compléter les 7 KP mastery restants (+2 scénarios variant/station si intérêt pédagogique).
- Sidecar grounding évaluation dédié dans lou-build (aujourd'hui : ancres inventory via claim_facets).
