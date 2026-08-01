# Lot E-C — Rapport de corrections post-audit

| | |
|---|---|
| **Lot** | E-C — Learner Snapshot (LP-05) |
| **Suite** | Corrections audit indépendant (GO APRÈS CORRECTIONS) |
| **Statut** | Corrections terminées — prêt pour contre-audit |
| **Date** | 2026-08-01 |
| **Commit** | Aucun (mission explicite) |

---

## 1. Corrections réalisées

### C1 — Aucune perte silencieuse (LP-02 / LP-05)

**Problème audit :** `buildBodyFromStoreGroups` ignorait silencieusement les enregistrements locaux invalides (`continue` sur row non objet, `release_id` absent, `schema_version` absent).

**Correction :**

- Introduction de `assertExportablePatrimonyRow()` — lève une erreur explicite préfixée `[LouLearnerSnapshot] Incomplete export:` pour tout enregistrement patrimonial non exportable.
- Suppression de tous les `continue` silencieux dans la boucle de projection.
- Contrôle de cohérence en fin de projection : le nombre d'enregistrements sources patrimoniaux doit égaler le nombre exporté — sinon échec explicite.

**Comportement :** l'export **échoue** (Promise rejetée) ; aucun snapshot « complet » n'est produit si une donnée locale patrimoniale ne peut pas être représentée.

### C2 — Diagrammes personnels

**Problème audit :** un diagramme personnel pouvait être exporté avec `binary_base64: null` sans échec.

**Correction :**

- `projectPersonalDiagram()` rejette explicitement si `row.blob` est absent.
- Rejette explicitement si `blobToBase64()` retourne `null` ou une chaîne vide.
- Messages d'erreur explicites via le même préfixe `Incomplete export:`.

**Comportement :** un diagramme personnel est soit exporté avec un binaire encodé, soit l'export **échoue** — jamais un export réussi avec contenu perdu.

**Hors périmètre respecté :** modèle snapshot, canonicalisation, digest, domaines, frontières Library/Offline, `record_id` — inchangés.

---

## 2. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `demo/renderer/learner-snapshot.js` | C1 + C2 : validation explicite, erreurs `Incomplete export`, comptage source/export |
| `demo/renderer/test/learner-snapshot.test.js` | 7 nouveaux tests C1/C2 ; adaptation LP-E02 et LP-E09 (blobs restaurés pour tests complets) |

Aucun contrat modifié. Aucun fichier D1/D2/Library/Composition touché hors tests snapshot.

---

## 3. Nouveaux tests ajoutés

| Test | Invariant démontré |
|---|---|
| **C1-E01** | `release_id` absent → échec explicite (ne peut pas être ignoré) |
| **C1-E02** | `schema_version` absent → échec explicite |
| **C1-E03** | Record invalide (`null`) → échec explicite |
| **C2-E01** | Blob non encodable (`{}`) → échec explicite |
| **C2-E02** | Blob absent → échec explicite |
| **C2-E03** | Perte blob via fake-indexeddb → `exportSnapshot` échoue (régression C2) |
| **C1-C2-E01** | Export complet réussi quand tous les prérequis sont satisfaits |

Ces tests **échouaient** sur l'implémentation pré-correction (omission silencieuse / `binary_base64: null` accepté).

**Adaptations tests existants :**

- **LP-E02**, **LP-E09** : helper `restorePersonalDiagramBlobs()` — simule le comportement navigateur réel où IndexedDB préserve les `Blob` (fake-indexeddb les perd ; sans restauration, C2 provoquerait légitimement un échec).

---

## 4. Résultat complet des tests

```
npm test
# tests 333
# pass 333
# fail 0
```

(+7 tests par rapport à la baseline E-C post-implémentation : 326 → 333)

---

## 5. Démonstration LP-02 et LP-05

| Invariant | Démonstration post-correction |
|---|---|
| **LP-02** — aucune suppression/omission silencieuse | Toute record locale patrimoniale non exportable provoque un rejet explicite (C1-E01…E03). Aucun chemin `continue` silencieux. |
| **LP-05** — snapshot couvre l'intégralité du patrimoine local | Si le patrimoine local est intégralement exportable, l'export réussit avec comptage source = export (C1-C2-E01, LP-E09). Si une donnée ne peut pas être exportée, l'export **échoue** — le snapshot n'est pas présenté comme complet. |
| **C2 contenu diagrammes** | Binaire absent ou non encodable → échec (C2-E01…E03). Succès uniquement avec `binary_base64` non nul (C1-C2-E01, LP-E12). |

---

## 6. Dettes restantes (hors périmètre E-C / audit initial)

| Dette | Statut |
|---|---|
| `record_id` couplé à la clé storage (composante `seq`) | **Non corrigé** — hors réserves audit ; préparation E-D |
| `orphan_status` limité à `legacy_unresolved` (pas `release_not_installed`) | **Non corrigé** — arbitrage A3 |
| `localeCompare` pour tri canonique | **Non corrigé** — risque résiduel faible |
| fake-indexeddb ne préserve pas les `Blob` | **Contourné en tests** via `restorePersonalDiagramBlobs` ; en navigateur réel, IndexedDB préserve les blobs |

---

*Lot E-C — Corrections audit C1/C2 — 2026-08-01 — prêt pour contre-audit indépendant avant commit.*
