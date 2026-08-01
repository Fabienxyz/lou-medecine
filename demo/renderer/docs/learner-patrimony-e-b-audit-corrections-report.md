# Lot E-B — Rapport de corrections post-audit

| | |
|---|---|
| **Lot** | E-B — Persistance Release-scoped |
| **Suite** | Corrections audit indépendant (GO APRÈS CORRECTIONS) |
| **Statut** | Corrections terminées — prêt pour nouvel audit |
| **Date** | 2026-08-01 |
| **Commit** | Aucun (mission explicite) |

---

## 1. Corrections par écart

### E1 — Régression Offline (bloquant)

**Problème :** `learner-patrimony.js` chargé par `index.html` mais absent de `SHELL_URLS` — boot offline potentiellement cassé.

**Correction :**
- Ajout de `/demo/renderer/learner-patrimony.js` dans `SHELL_URLS` (`offline-runtime-shared.js`), immédiatement avant `learner-store.js`.

**Test anti-régression :**
- `learner-patrimony-store.test.js` → `E1 shell precache includes learner-patrimony.js` vérifie :
  - présence dans `SHELL_URLS` ;
  - présence et ordre de chargement dans `index.html` (avant `learner-store.js`).

---

### E2 — Résolution Release non conforme (bloquant)

**Problème :** `productReleaseId` appliqué sans lien chapitre ; attribution Release possible hors contexte catalogue.

**Correction :**
- Suppression de `productReleaseId` de la résolution.
- En mode produit (`LouConfig.isProductMode()`), toute écriture patrimoniale exige un `releaseContext` dont le `chapter` correspond — sinon rejet explicite.
- La `release_id` provient exclusivement de `setReleaseContext`, lui-même alimenté par le manifeste (dev) ou Package Access / catalogue (produit) via `app.js`.

**Tests :**
- `E2 product mode rejects write without catalog release context`
- `E2 product mode rejects write when chapter does not match context`
- `E2 product mode accepts write with matching catalog context`

---

### E3 — Table `KNOWN_CHAPTER_RELEASE_IDS` (majeur)

**Problème :** Table hardcodée inventant une identité catalogue (`cardio/234` → `cardio__234__2022__1`).

**Correction :**
- Suppression intégrale de `KNOWN_CHAPTER_RELEASE_IDS`.
- Chemin nominal : contexte catalogue explicite uniquement.
- Mode dev (§2.3) : namespace `__legacy__<chapter>` via `deriveLegacyReleaseId` — jamais une fausse Release catalogue.

**Test :**
- `E3 patrimony never invents catalog release_id without context`

---

### E4 — Intégrité de l'appartenance

**Problème :** `updateSvgTextFormat` pouvait écraser `release_id` / `chapter` via merge.

**Correction :**
- Ajout de `preservePatrimonyIdentity(existing, merged)` dans `learner-patrimony.js`.
- Application systématique dans `updateSvgTextFormat` après merge.

**Test :**
- `E4 updateSvgTextFormat cannot change release_id or chapter`

---

### E5 — Renforcement des tests

**Ajouts / mises à jour :**

| Cas | Test |
|---|---|
| Contexte produit | E2 (3 tests) |
| Mauvais chapitre | E2 rejects wrong chapter |
| Migration base vide | E5 migration on empty database |
| Migration déjà effectuée | E5 migration already completed skips row rewrites |
| Données incomplètes | E5 incomplete legacy rows → `__legacy__unknown` |
| Formats SVG (migration) | E6 migration without context (inclut `svg_text_formats`) |
| Immutabilité `release_id` | E4 |
| Shell offline | E1 |

**Adaptations :**
- `svg-text-formats-store.test.js` : `setReleaseContext` en `beforeEach` ; migration v3→v4 testée sans contexte catalogue (legacy).

---

### E6 — Données legacy

**Problème :** Migration assignait une Release catalogue inventée ou devinable sans contexte.

**Correction :**
- Migration utilise `_migrationPatrimonyOptions()` (`requireCatalogRelease: false`).
- Sans contexte catalogue au moment de la migration → `__legacy__*` (conservation, hors domaine actif).
- Avec `setReleaseContext` avant `open()` → promotion vers la `release_id` manifeste/catalogue (non inventée).
- Lectures actives : `matchesPatrimonyScope` exige égalité stricte avec la Release active ; plus de fallback `chapter`-seul.

**Tests :**
- `E6 migration without context preserves legacy rows outside active domain`
- `E6 migration with catalog context assigns manifest release_id`

---

## 2. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `demo/renderer/learner-patrimony.js` | Réécriture résolution / scope / immutabilité |
| `demo/renderer/learner-store.js` | Options produit, migration, immutabilité updates, `RELEASE_SCOPED_STORES` local |
| `demo/renderer/library/offline-runtime-shared.js` | E1 — shell precache |
| `demo/renderer/test/learner-patrimony-store.test.js` | Suite E-B étendue (16 tests) |
| `demo/renderer/test/svg-text-formats-store.test.js` | Contexte catalogue + migration legacy |

**Non modifiés :** contrats, Composition, Library Catalog, Offline (hors ligne shell URL list), `app.js` (câblage contexte déjà conforme).

---

## 3. Nouveaux / renforcés tests

Fichier principal : `demo/renderer/test/learner-patrimony-store.test.js`

- E1, E2 (×3), E3, E4, E5 (×3), E6 (×2)
- LP-E01, LP-E03, LP-E04, LP-E05, LP-E06 (conservés/adaptés)

---

## 4. Résultat des tests

```
313 tests PASS
0 fail
```

Commande : `npm test` dans `demo/renderer/`.

---

## 5. Conformité LP-01 à LP-10 (socle E-B)

| Invariant | Statut post-correction |
|---|---|
| **LP-01** | **Conforme** (socle) — écritures actives ancrées ; legacy hors domaine actif |
| **LP-02** | **Conforme** — pas de suppression silencieuse |
| **LP-03** | **Conforme** |
| **LP-04** | **Conforme** |
| **LP-05** | **Hors E-B** — export E-C non implémenté |
| **LP-06** | **Hors E-B** — import E-D non implémenté |
| **LP-07** | **Partiel** — conservation OK ; signalisation UI/diagnostic absente (hors périmètre) |
| **LP-08** | **Conforme** — indépendance offline modèle ; shell E1 corrigé |
| **LP-09** | **Conforme** |
| **LP-10** | **Conforme** — logique pure séparée ; noms stores dans adaptateur uniquement |

### Critères §15 (composant entier)

Conformes pour le **socle persistance E-B** sur les critères 1, 2 (mode produit), 8, 9, 10.  
Non satisfaits (lots futurs) : 3 complet, 4, 5, 6 signalisation, 7 D4/D7.

---

## 6. Dettes restantes (strictement hors E-B)

| Dette | Lot |
|---|---|
| Export Learner Snapshot | E-C |
| Import / restauration | E-D |
| Reprise de session | D4 |
| Recherche locale | D6 |
| Préférences | D7 |
| Signalisation UI des orphelins | Post E-B |
| Promotion résolue des enregistrements `__legacy__*` | Lot futur (import / résolution catalogue) |
| Schéma d’accueil QCM / scénarios / maîtrise | E6 futur |

---

## 7. Synthèse

Les six écarts E1–E6 identifiés par l’audit ont été traités. Le composant ne fabrique plus de `release_id` catalogue ; le shell offline inclut le script patrimonial ; l’intégrité d’appartenance est protégée en mise à jour ; la couverture de tests démontre les invariants et les régressions auditées.

Le lot est **candidate pour un nouvel audit indépendant** avant toute opération Git.

---

*Corrections E-B post-audit — 2026-08-01 — aucun commit.*
