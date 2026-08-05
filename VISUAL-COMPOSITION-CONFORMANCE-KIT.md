# Visual Composition Conformance Kit

## 1. Statut et objectif

**Identifiant :** `VCCK-V0-DRAFT`  
**Statut :** contrat d’industrialisation en cours de qualification — non normatif tant que le gate de gel n’est pas passé.  
**Périmètre :** compositions visuelles génériques issues des primitives gelées de la grammaire.

Le kit doit permettre de produire les visuels de plusieurs centaines de chapitres sans redévelopper les renderers pendant la production éditoriale.

> Une primitive n’est industrialisée que lorsque les structures qu’elle accepte disposent de compositions canoniques bornées, testées et gelées. Toute autre structure est refusée avant rendu.

Le kit ne modifie ni le contenu médical, ni la grammaire sémantique, ni les contrats Reader. Il qualifie la transformation :

```text
visualSpec sémantique
→ signature structurelle calculée
→ composition canonique supportée
→ rendu déterministe
```

## 2. Décision d’architecture

### 2.1 Fin du layout arbitraire

Le pipeline ne doit plus promettre qu’un moteur de layout général rendra proprement tout graphe admis par un schéma.

Chaque primitive possède une liste fermée de **familles de compositions garanties**. Une visualSpec est :

- acceptée si sa signature structurelle correspond à une famille qualifiée ;
- refusée avec `UNSUPPORTED_TOPOLOGY` dans les autres cas ;
- jamais corrigée par une branche propre au chapitre.

### 2.2 Topologie calculée, jamais auto-déclarée

La visualSpec reste sémantique et sans géométrie.

Le nom de famille de composition n’est pas une permission fournie par l’auteur. Le validateur calcule une signature depuis :

- cardinalités ;
- degrés entrants et sortants ;
- profondeur ;
- convergence et divergence ;
- cycles et relations de rétroaction déclarées ;
- branches sautant un niveau ;
- fragments imbriqués autorisés ;
- contraintes propres à la primitive.

Une valeur déclarative éventuelle peut exprimer une intention, mais elle ne peut jamais remplacer la reconnaissance structurelle.

### 2.3 Frontière production / évolution

Pendant la production d’un chapitre :

- version du kit et renderers sont immuables ;
- aucune modification de renderer n’est autorisée ;
- aucune nouvelle famille n’est ajoutée ;
- un visuel incompatible est simplifié éditorialement, maintenu en HTML/prose ou classé `WITHHELD_UNSUPPORTED_TOPOLOGY`.

Toute évolution de renderer devient une mission de bibliothèque séparée, non médicale, justifiée par plusieurs besoins ou par une irréductibilité démontrée.

## 3. Familles garanties à qualifier

| Primitive | Famille calculée | Structure acceptée |
|---|---|---|
| `causal-graph` | `chain` | chaîne causale simple |
| `causal-graph` | `fan-out` | une origine diverge vers plusieurs conséquences |
| `causal-graph` | `fan-in` | plusieurs origines convergent vers une conséquence |
| `causal-graph` | `diamond` | divergence puis convergence, sans croisement imposé |
| `causal-graph` | `lateral-feedback` | une rétroaction déclarée routée en gouttière extérieure |
| `decision-algorithm` | `dependent-sequence` | étapes réellement dépendantes sans branche |
| `decision-algorithm` | `binary-rule-out` | décision binaire avec dead-end explicite |
| `decision-algorithm` | `skip-level-branch` | branche latérale sautant un ou plusieurs niveaux |
| `decision-algorithm` | `monitoring-loop` | surveillance, alerte, action puis reprise déclarée |
| `threshold-scale` | `single-context` | une quantité, un contexte, une ou plusieurs coupures |
| `threshold-scale` | `dual-context` | mêmes analytes séparés dans deux contextes |
| `threshold-scale` | `embedded-fragment` | fragment de seuil dans une branche autorisée |
| `comparison-matrix` | `two-pole` | deux pôles et dimensions complètes |
| `comparison-matrix` | `three-pole-reflow` | trois pôles, tableau large et reflow mobile |
| `enumeration-set` | `flat-concurrent` | ensemble exhaustif non ordonné |
| `enumeration-set` | `grouped-concurrent` | groupes de finalité avec cardinalités déclarées |
| `quantity-model` | `identity` | identité mathématique et déterminants |
| `quantity-model` | `two-state` | deux états alignés avec unités et insight sourcé |

Ces 18 familles constituent le **lot initial de qualification**. Elles ne deviennent pas automatiquement normatives : chacune doit passer le gate de gel.

## 4. Refus structurels obligatoires

Le validateur doit reconnaître avant rendu au minimum :

| Code | Condition |
|---|---|
| `UNSUPPORTED_TOPOLOGY` | aucune famille qualifiée ne correspond |
| `NON_PLANAR_REQUIRED_CROSSING` | la structure impose des croisements incompatibles avec la famille |
| `BUDGET_EXCEEDED` | cardinalité ou profondeur au-delà du contrat |
| `AMBIGUOUS_EDGE_ORIGIN` | segments partagés ou routage rendant la source indécidable |
| `UNSUPPORTED_NESTING` | fragment ou primitive imbriquée non autorisée |
| `TEMPORAL_AS_CAUSAL` | succession encodée comme causalité ou feedback |
| `UNLABELLED_DECISION_BRANCH` | branche décisionnelle sans condition |
| `MISSING_TERMINAL` | issue obligatoire absente |
| `UNSUPPORTED_TEXT_LOAD` | texte impossible à rendre dans les budgets garantis |

Un refus est un résultat valide du système. Il ne doit pas déclencher une tentative de layout de secours.

## 5. Matrice de qualification par famille

Chaque famille doit être testée avec :

### 5.1 Contenu non médical

- fixture nominale courte ;
- fixture nominale aux libellés maximaux ;
- accents, apostrophes, comparateurs, unités et symboles autorisés ;
- fixture négative topologique ;
- fixture négative de texte ;
- aucune chaîne Cardio-234.

### 5.2 Surfaces

- SVG ou HTML canonique selon la primitive ;
- 375 px ;
- 530 px ;
- 768 px ;
- 1280 px ;
- 2400 px ;
- PNG rendu à chaque largeur ;
- crop Word à 530 px.

### 5.3 Invariants techniques

- dimensions finies ;
- sortie déterministe et byte-identique ;
- aucun rognage ;
- aucune troncature ;
- aucune intersection arête/nœud non terminal ;
- aucune collision texte/texte, texte/nœud ou label/nœud ;
- origine et destination de chaque relation perceptibles ;
- tailles minimales réellement rendues ;
- SVG sérialisé relu indépendamment du layout interne ;
- contrôle PNG indépendant ;
- fixture cassée démontrant que chaque validateur sait échouer.

### 5.4 Invariants perceptuels

- question visible et non tronquée ;
- hiérarchie comprise sans walkthrough ;
- lecture principale possible en moins de cinq secondes ;
- aucun symbole technique sans signification apprenante explicite ;
- densité compatible avec mobile et Word ;
- aucune zone vide ou compacte signalant un canvas mal calculé ;
- relation inhabituelle portée par un libellé lisible, pas seulement par un glyphe.

## 6. Niveaux de maturité

| Niveau | Signification |
|---|---|
| `EXPERIMENTAL` | famille en construction ; interdite en production chapitre |
| `QUALIFIED` | toutes les fixtures et surfaces passent ; revue humaine générique obtenue |
| `FROZEN` | version, signature, renderer, snapshots et diagnostics gelés |
| `DEPRECATED` | maintenue pour compatibilité mais interdite aux nouvelles specs |
| `RETIRED` | retirée après migration explicite |

Seules les familles `FROZEN` sont utilisables lors de la production industrielle des chapitres.

## 7. Gate de gel du kit

Le kit initial peut être gelé seulement si :

1. les 18 familles possèdent leurs fixtures génériques ;
2. toutes les fixtures positives passent aux cinq largeurs ;
3. toutes les fixtures négatives échouent avec le code attendu ;
4. les tests pixels et bounds sont indépendants du renderer ;
5. le rendu est déterministe ;
6. aucune branche de code ne contient un identifiant de chapitre ou de prototype ;
7. une galerie unique permet la revue des 18 familles ;
8. Codex valide la lisibilité mobile, Word et desktop ;
9. un audit indépendant Grok ou Opus challenge les faux PASS ;
10. le chapitre 234 peut être rejoué sans modification de renderer.

## 8. Règles après gel

Pour chaque nouveau chapitre :

1. Codex sélectionne la primitive depuis la structure médicale.
2. Le pipeline calcule la famille de composition.
3. Une famille `FROZEN` rend le visuel.
4. Une structure non supportée produit un refus explicite.
5. Cursor n’édite aucun renderer.
6. Le gate humain porte sur un échantillon défini par risque :
   - toutes les nouvelles familles ;
   - tous les seuils médicaux ;
   - toutes les boucles ;
   - un échantillon des familles déjà gelées.
7. Les autres rendus sont couverts par la conformité du kit et les contrôles automatiques.

## 9. Utilisation du chapitre 234

Les Lots A et B et les essais C1 deviennent un corpus de qualification, pas une suite à terminer par retouches.

- Lot A éprouve les familles HTML.
- Lot B éprouve `binary-rule-out`, `skip-level-branch` et `dual-context`.
- C1 fournit des cas de refus et de simplification, notamment le `K3,2` N02.
- N22 devient le cas de qualification `monitoring-loop`.
- Aucun de ces éléments n’autorise une exception Cardio-234 dans les renderers.

## 10. Livrables attendus de l’industrialisation

- registre machine-readable des familles et statuts ;
- 18 fixtures positives génériques ;
- fixtures négatives correspondantes ;
- renderers génériques ;
- validateurs de signature structurelle ;
- galerie de revue multi-viewport ;
- snapshots SVG/HTML et PNG ;
- rapport de déterminisme ;
- rapport anti-spécialisation par chapitre ;
- rapport d’audit indépendant ;
- version gelée du kit avec identifiant et hash.

