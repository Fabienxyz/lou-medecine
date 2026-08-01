# Display Preferences Component Contract

| | |
|---|---|
| **Type** | Contrat composant normatif |
| **Statut** | **En vigueur** — clôture D7-G (2026-08-01) |
| **Composant** | Préférences d'affichage Reader (Display Preferences) |
| **Décision produit** | [PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md) |
| **ADR associé** | — |
| **Index** | [`../00-INDEX.md`](../00-INDEX.md) · [`00-INDEX.md`](00-INDEX.md) |

Ce document définit les **obligations durables** des **préférences d'affichage** de Lou Médecine dans le Reader. Il spécialise [PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md) et le [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §5.2 et §11.7. Il ne redéfinit pas le contenu médical d'une Release, ne spécifie pas de technologie CSS particulière et n'introduit aucune décision médicale nouvelle.

---

## 1. Objectif

Le composant Display Preferences **DOIT** permettre à l'apprenant de **personnaliser l'apparence** du Reader — thème, taille de police et largeur de lecture — **sans modifier** le contenu pédagogique officiel.

| Règle | Énoncé |
|---|---|
| **Consommation pure** | Display Preferences **CONSOMME** et **PERSISTE** des réglages utilisateur locaux ; il **NE PRODUIT JAMAIS** de contenu médical, pédagogique ou éditorial. |
| **Immutabilité du publié** | Display Preferences **NE MODIFIE JAMAIS** le Chapter Package, le manifest, les artefacts déclarés ni le catalogue. |
| **Portée globale** | Les préférences V1 **DOIVENT** être **globales à l'application** — indépendantes de la `release_id` ouverte ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §5.2). |
| **Autonomie locale** | Display Preferences **DOIT** fonctionner sans serveur distant, sans service cloud et sans connexion réseau pour lire ou écrire les réglages persistés. |

En mode produit, les critères de conformité **DOIVENT** être évalués sur le Reader en conditions d'usage réelles — bibliothèque installée ou mode produit équivalent.

---

## 2. Périmètre

### 2.1 Inclus (V1)

| Domaine | Couverture |
|---|---|
| **Préférences normatives V1** | Thème clair/sombre ; taille de police ; largeur de lecture |
| **Modèle logique** | `DisplayPreferences` versionné, valeurs énumérées, défauts |
| **Persistance** | Magasin patrimonial global `display_preferences` |
| **Export / import** | Domaine `display_preferences` du Learner Snapshot |
| **Application Reader** | Application au boot et à chaque changement utilisateur |
| **Frontières** | Patrimoine, Offline, Session, Local Search, Composition |
| **Comportements interdits** | Altération du contenu officiel, préférences Release-scoped V1 |

### 2.2 Exclus

| Domaine | Autorité |
|---|---|
| Contenu médical, manifest, artefacts | [Contrat 04](../04-CHAPTER-PACKAGE.md) |
| Composition des vues | [`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) |
| Reprise de session | [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md), [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §11.5 |
| Recherche locale | [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](LOCAL-SEARCH-COMPONENT-CONTRACT.md) |
| Mode hors ligne Release | [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) |
| Sync multi-appareils | [PDR-D3](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Préférences avancées | Animations, polices custom, densité ligne, contraste élevé — hors V1 |

### 2.3 Mode développement

Un mode de développement **PEUT** ignorer la persistance patrimoniale. Ce mode **NE DOIT PAS** être invoqué pour valider les critères produit V1.

---

## 3. Modèle DisplayPreferences V1

### 3.1 Nature

`DisplayPreferences` est l'**enregistrement normatif unique** des réglages d'affichage V1. Il **EST** une donnée patrimoniale **globale** — pas une autorité de contenu.

### 3.2 Champs obligatoires V1

| Champ | Type logique | Valeurs autorisées V1 | Défaut V1 |
|---|---|---|---|
| `schema_version` | entier positif | **`1`** (figé V1) | `1` |
| `theme` | énumération | `"light"` \| `"dark"` | `"light"` |
| `fontSize` | énumération | `"small"` \| `"medium"` \| `"large"` | `"medium"` |
| `readingWidth` | énumération | `"narrow"` \| `"standard"` \| `"wide"` | `"standard"` |

| Règle | Énoncé |
|---|---|
| **Enregistrement unique** | V1 **DOIT** porter **un seul** enregistrement actif par installation — pas de profils multiples. |
| **Complétude** | Toute lecture produit un objet **complet** — valeurs manquantes complétées par défaut avant application. |
| **Validation V1** | Toute valeur hors énumération **DOIT** être **remplacée par la valeur par défaut du domaine** concerné ; un diagnostic **PEUT** être émis ; **aucune erreur bloquante** ne **DOIT** empêcher le chargement ni l'application des préférences. Comportement **unique et déterministe**. |

### 3.3 Évolution

| Règle | Énoncé |
|---|---|
| **Versionnement** | Toute évolution de schéma **DOIT** incrémenter `schema_version` et préserver la migration des valeurs compatibles ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §6.3). |
| **Hors V1** | Thème « système » (`prefers-color-scheme`), polices additionnelles, espacement — évolutions ultérieures explicites. |

---

## 4. Sémantique des préférences V1

### 4.1 Thème (`theme`)

| Valeur | Obligation Reader |
|---|---|
| `"light"` | Palette claire par défaut du Reader |
| `"dark"` | Palette sombre **équivalente fonctionnellement** — même structure, contrastes adaptés |

| Règle | Énoncé |
|---|---|
| **Contenu officiel** | Le thème **NE DOIT** altérer le texte, les figures publiées ni les métadonnées déclarées — présentation uniquement. |
| **Couche apprenante** | Les overlays apprenant **DOIVENT** rester lisibles dans les deux thèmes. |
| **Indépendance Release** | Le thème **NE DOIT PAS** varier selon la Release ouverte. |

### 4.2 Taille de police (`fontSize`)

| Valeur | Obligation |
|---|---|
| `"small"` | Corps de lecture réduit — hiérarchie typographique conservée |
| `"medium"` | Taille de référence Reader V1 |
| `"large"` | Corps de lecture agrandi — hiérarchie conservée |

| Règle | Énoncé |
|---|---|
| **Proportionnalité** | Titres, labels et corps **DOIVENT** conserver leurs rapports relatifs. |
| **Non-réécriture** | Aucun changement de contenu textuel **N'EST** autorisé. |

### 4.3 Largeur de lecture (`readingWidth`)

| Valeur | Obligation |
|---|---|
| `"narrow"` | Colonne de lecture resserrée — confort lecture longue |
| `"standard"` | Largeur par défaut Reader V1 |
| `"wide"` | Colonne élargie dans les limites du viewport |

| Règle | Énoncé |
|---|---|
| **Responsive** | Sur viewport étroit, `"wide"` **PEUT** se rapprocher de `"standard"` — sans perte de lisibilité. |
| **Figures** | Les figures officielles **DOIVENT** rester intégralement visibles — pas de rognage implicite. |

---

## 5. Architecture

### 5.1 Composants conceptuels

```
Display Preferences Service (pur)
        ↕
Display Preferences Runtime / Store (I/O patrimonial)
        ↕
LouLearnerStore — store display_preferences (application scope)
        ↕
Reader — application CSS / attributs / variables
```

| Composant | Rôle |
|---|---|
| **Display Preferences Service** | Validation, normalisation, défauts, fusion partielle — **sans I/O** |
| **Display Preferences Runtime** | Lecture / écriture patrimoniale, orchestration boot |
| **Reader** | Application visuelle, UI de réglage, **seul** consommateur des effets d'affichage |

### 5.2 Pureté du Service

Le Display Preferences Service **DOIT** être **pur** :

| Interdit | Précision |
|---|---|
| DOM | Aucune manipulation document |
| IndexedDB | Aucun accès direct |
| Horloge | Aucune dépendance temporelle pour la logique de validation |
| Release courante | Aucune lecture de `release_id` pour la sémantique des préférences V1 |

---

## 6. Persistance et patrimoine

### 6.1 Magasin

| Règle | Énoncé |
|---|---|
| **Store** | `display_preferences` — **application-scoped** ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §5.2). |
| **Autorité** | [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §11.7 — persistance globale obligatoire. |
| **record_id** | Stable pour l'enregistrement singleton V1 — ex. `"display-preferences-v1"`. |

### 6.2 Cycle de vie

| Événement | Action obligatoire |
|---|---|
| **Premier boot produit** | Si aucun enregistrement `display_preferences` n'existe : appliquer les **défauts V1** ; la **création persistante n'est pas obligatoire** tant que l'utilisateur n'a pas modifié une préférence ([`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) §8 — domaine vide admis). |
| **Lecture au boot** | Charger si enregistrement présent ; normaliser ; compléter par défauts ; appliquer **avant** rendu interactif principal |
| **Changement utilisateur** | Valider via Service ; **persister** (création ou mise à jour de l'enregistrement) ; réappliquer immédiatement |
| **Import snapshot** | Fusionner domaine `display_preferences` selon règles patrimoniales §9 |
| **Export snapshot** | Inclure domaine `display_preferences` — **non vide uniquement si enregistrement présent** localement ; domaine vide explicite sinon |
| **Changement Release** | **Aucun effet** sur les préférences |
| **Certification offline Release** | **Aucun effet** sur la disponibilité des préférences |

### 6.3 Indépendance offline

Les préférences persistées **DOIVENT** rester lisibles et applicables **sans connexion réseau**, indépendamment du `offline_status` de toute Release ([`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) §11.3 via Patrimoine §5.2).

---

## 7. Application Reader

### 7.1 Moment d'application

| Règle | Énoncé |
|---|---|
| **Boot** | Les préférences **DOIVENT** être appliquées au démarrage Reader — idéalement avant le premier paint significatif du contenu. |
| **Changement live** | Toute modification utilisateur **DOIT** être reflétée sans rechargement complet de page. |
| **Ordre boot** | Application des préférences **NE DOIT PAS** bloquer le RestoreContext ni la reprise session ([PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md)) — ordre compatible IA-10. |

### 7.2 Mécanisme d'application

| Règle | Énoncé |
|---|---|
| **Présentation seule** | Application via classes CSS, attributs `data-*` ou variables CSS sur le shell Reader — **pas** de réécriture DOM du contenu officiel. |
| **Composition** | Les vues composées **DOIT** hériter des réglages globaux sans logique dupliquée par onglet. |
| **Accessibilité** | Les changements **DOIVENT** préserver la navigabilité clavier et les annonces existantes. |

### 7.3 UI de réglage V1

| Règle | Énoncé |
|---|---|
| **Accès** | Un point d'entrée utilisateur **DOIT** exister — panneau, menu ou équivalent — pour modifier les trois préférences V1. |
| **Feedback** | Chaque changement **DOIT** produire un effet visible immédiat. |
| **Non-persistance UI** | État ouvert/fermé du panneau de réglages **NE DOIT PAS** être patrimonial. |

---

## 8. Interfaces conceptuelles

### 8.1 Reader

| Interface | Obligation |
|---|---|
| **Application** | Appliquer `DisplayPreferences` normalisées au shell et au contenu rendu. |
| **UI** | Exposer les contrôles V1 ; déléguer validation au Service. |
| **Non-autorité** | Le Reader **NE DOIT PAS** inventer de valeurs hors contrat. |

### 8.2 Display Preferences Service

| Interface | Obligation |
|---|---|
| **Entrée** | Objet partiel ou complet + `schema_version` cible. |
| **Sortie** | `DisplayPreferences` normalisées ; diagnostics optionnels de remplacement vers défaut. |
| **Pureté** | Conforme §5.2. |

### 8.3 Learner Patrimony

| Interface | Obligation |
|---|---|
| **Persistance** | Porter le store `display_preferences` ; export / import domaine §11.7. |
| **Séparation** | Patrimoine Release-scoped **NE DOIT PAS** mélanger annotations et préférences. |

### 8.4 Session Service (PDR-D4)

| Interface | Obligation |
|---|---|
| **Orthogonalité** | Reprise session et préférences **DOIVENT** coexister — reprise **NE DOIT PAS** réinitialiser les préférences. |
| **Non-ingérence** | Session Service **NE DOIT PAS** lire ni écrire `display_preferences`. |

### 8.5 Local Search (PDR-D6)

| Interface | Obligation |
|---|---|
| **Orthogonalité** | Recherche et préférences **DOIVENT** coexister — surbrillance recherche **DOIT** rester visible dans les deux thèmes. |
| **Non-ingérence** | Local Search **NE DOIT PAS** persister ni lire les préférences. |

### 8.6 Offline

| Interface | Obligation |
|---|---|
| **Disponibilité préférences** | Offline Release **NE DOIT PAS** conditionner la lecture des préférences. |
| **Non-ingérence** | Offline Manager **NE DOIT PAS** posséder ni certifier les préférences. |

### 8.7 Composition

| Interface | Obligation |
|---|---|
| **Consommation** | Display Preferences **DOIT** s'appliquer au Reader **déjà composé** — sur le contenu rendu à partir du Reading View Model. |
| **Reading View Model** | Display Preferences **NE DOIT JAMAIS** modifier le Reading View Model — contenu, structure, disponibilité ou ordonnancement des vues. |
| **Disponibilité des vues** | Display Preferences **NE DOIT JAMAIS** modifier la disponibilité des vues (`published`, `planned`, `known_absent`). |
| **Non-ingérence** | La Composition **NE DOIT PAS** lire ni consommer `display_preferences` pour produire le View Model ([`COMPOSITION-COMPONENT-CONTRACT.md`](COMPOSITION-COMPONENT-CONTRACT.md) §9). |

---

## 9. Comportements interdits

| Interdit | Précision |
|---|---|
| **Préférences Release-scoped V1** | Interdit d'ancrer thème ou police à une `release_id` en V1. |
| **Altération contenu officiel** | Interdit de modifier texte, figures ou manifest via préférences. |
| **Patrimoine dérivé** | Interdit de traiter les préférences comme reconstructibles depuis une Release. |
| **Sync implicite** | Interdit de synchroniser automatiquement les préférences entre appareils en V1. |
| **Préférences dans SearchHit / ResumePlan** | Interdit d'inclure des réglages d'affichage dans les modèles D4 ou D6. |
| **Modification SearchHit** | Interdit de produire, altérer ou filtrer des SearchHit selon les préférences d'affichage — contenu, ordre et ancres des résultats **DOIVENT** rester identiques quelle que soit la préférence active. |
| **Modification snippets** | Interdit de modifier le texte, les plages ou le contenu des snippets fournis par Local Search selon les préférences. |
| **Modification ancres** | Interdit de modifier les ancres de navigation — identifiants, kinds, offsets ou résolution — selon les préférences. |
| **Modification ResumePoint** | Interdit de modifier la structure, les kinds ou la sémantique des ResumePoint selon les préférences. |
| **Influence Local Search** | Interdit que les préférences modifient l'index searchable, les requêtes, l'ordonnancement des résultats ou tout autre comportement observable de Local Search. |
| **Suppression silencieuse** | Interdit d'effacer les préférences sans action utilisateur ou import explicite. |
| **Double autorité** | Interdit de dupliquer la persistance hors `display_preferences` patrimonial. |

---

## 10. Considérations futures (hors V1)

| Évolution | Statut |
|---|---|
| Thème « système » (`prefers-color-scheme`) | Candidate post-V1 |
| Contraste élevé / accessibilité avancée | Candidate post-V1 |
| Sync multi-appareils | [PDR-D3](../../governance/PRODUCT-DECISION-REGISTRY.md) — hors V1 |
| Profils multiples | Hors V1 |

---

## 11. Place dans la hiérarchie

### 11.1 Documents qui priment

En cas de conflit, priment dans cet ordre :

1. les ADR applicables ;
2. les contrats fondamentaux [01](../01-TRUST-AND-FIDELITY.md) à [09](../09-CLINICAL-SCENARIO.md), en particulier [06](../06-RENDERER-AND-LEARNER-LAYER.md) §9 ;
3. [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) pour persistance et export ;
4. [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md).

Ce contrat **NE DOIT PAS** contredire un document supérieur.

### 11.2 Documents sur lesquels il prime

Ce contrat **prime** sur :

- la documentation technique Reader (`docs/renderer/`) pour les obligations Display Preferences ;
- le code et les tests du composant Display Preferences ;
- toute roadmap ou rapport d'implémentation relative aux préférences V1.

---

## 12. Invariants

| Id | Invariant |
|---|---|
| DP-01 | Les préférences V1 sont globales à l'application — jamais Release-scoped. |
| DP-02 | Aucune préférence ne modifie le contenu pédagogique officiel persisté. |
| DP-03 | `schema_version = 1` fige les énumérations §3.2 pour V1. |
| DP-04 | Un enregistrement normalisé produit toujours les trois champs `theme`, `fontSize`, `readingWidth`. |
| DP-05 | Les préférences sont disponibles offline indépendamment du statut offline d'une Release. |
| DP-06 | Export et import snapshot incluent le domaine `display_preferences` lorsque présent. |
| DP-07 | Le Display Preferences Service reste pur — sans I/O. |
| DP-08 | Session, Search et Offline restent orthogonaux aux préférences. |
| DP-09 | Display Preferences ne modifie jamais le Reading View Model, les ancres de navigation ni la Composition. |

---

## 13. Critères de conformité V1

| Id | Critère |
|---|---|
| C-DP-01 | Boot produit applique défauts ou valeurs persistées avant interaction principale. |
| C-DP-02 | Utilisateur peut basculer thème clair / sombre avec effet immédiat. |
| C-DP-03 | Utilisateur peut choisir trois tailles de police avec effet immédiat. |
| C-DP-04 | Utilisateur peut choisir trois largeurs de lecture avec effet immédiat. |
| C-DP-05 | Rechargement restaure les dernières valeurs persistées. |
| C-DP-06 | Export snapshot inclut le domaine `display_preferences` — non vide si enregistrement présent localement, vide explicite sinon. |
| C-DP-07 | Import snapshot restaure les préférences conformément au Patrimoine §9. |
| C-DP-08 | Mode offline Release `offline_ready` : préférences restent applicables. |
| C-DP-09 | Reprise session (D4) et recherche (D6) fonctionnent avec préférences actives. |
| C-DP-10 | Aucune écriture patrimoniale Release-scoped depuis Display Preferences. |

---

## 14. Hors périmètre documentaire

Ce contrat **NE SPÉCIFIE PAS** : sélecteurs CSS, noms de classes, structure DOM du panneau de réglages, implémentation IndexedDB, séquencement exact du boot — réservés à la documentation technique et au code subordonnés.

---

## 15. Documents connexes

| Document | Usage |
|---|---|
| [PDR-D7](../../governance/PRODUCT-DECISION-REGISTRY.md) | Décision produit — préférences d'affichage V1 |
| [`LEARNER-PATRIMONY-COMPONENT-CONTRACT.md`](LEARNER-PATRIMONY-COMPONENT-CONTRACT.md) | Persistance §5.2, export §8, import §9, interface §11.7 |
| [`RENDERER-COMPONENT-CONTRACT.md`](RENDERER-COMPONENT-CONTRACT.md) | Application visuelle Reader |
| [`OFFLINE-COMPONENT-CONTRACT.md`](OFFLINE-COMPONENT-CONTRACT.md) | Indépendance offline §11.3 |
| [`LOCAL-SEARCH-COMPONENT-CONTRACT.md`](LOCAL-SEARCH-COMPONENT-CONTRACT.md) | Orthogonalité recherche |
| [PDR-D4](../../governance/PRODUCT-DECISION-REGISTRY.md) | Reprise session — compatibilité boot |
| [`15-READER-FUNCTIONAL-SPECIFICATION.md`](../../renderer/15-READER-FUNCTIONAL-SPECIFICATION.md) | Spécification fonctionnelle — préférences d'affichage V1 |

---

*Contrat composant Display Preferences — en vigueur depuis D7-G (2026-08-01).*
