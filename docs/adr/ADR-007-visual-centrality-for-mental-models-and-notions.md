# ADR-007 — Centralité visuelle des Modèles mentaux et des Notions

## Statut

**Accepted**

## Date

2026-08-05

---

## Contexte

Le régime documentaire antérieur définissait le walkthrough comme artefact explicatif canonique et le visuel officiel comme support pédagogique optionnel. Il autorisait ainsi un bloc pédagogique complet, et parfois une publication, sans visuel construit.

La Phase 1A de prototypage éditorial a établi une doctrine produit plus précise : Lou Médecine organise la compréhension des **Modèles mentaux** et des **Notions** autour de représentations visuelles. Le walkthrough conserve la totalité du contenu médical et de sa traçabilité, mais il accompagne et guide la lecture du visuel central.

Le chapitre 234 a révélé la conséquence du régime antérieur : un walkthrough intitulé « Carte complète du chapitre » a pu être associé à un visuel réduit au mécanisme physiopathologique central. Chaque artefact était individuellement fidèle et techniquement valide, mais le bloc était éditorialement incongruent.

Cette décision transforme en règle normative la doctrine Phase 1A déjà consignée dans le plan de prototypage et son analyse du chapitre 234.

---

## Décision

### 1. Deux responsabilités complémentaires

| Responsabilité | Artefact |
|---|---|
| **Canonicalité médicale** | Le walkthrough porte l'explication médicale canonique, les KP et la traçabilité. |
| **Centralité pédagogique** | Le visuel structure la compréhension, répond à la question canonique et constitue le cœur pédagogique du Modèle mental ou de la Notion. |

Un visuel ne porte jamais seul un savoir médical absent du walkthrough. Réciproquement, un walkthrough sans visuel central conforme ne suffit pas à qualifier un Modèle mental ou une Notion comme bloc pédagogique complet.

### 2. Obligation visuelle par type éditorial

- Tout **Modèle mental** publié possède un visuel. Si plusieurs visuels MM existent, un **visuel maître global** représentant l'organisation cognitive du chapitre est obligatoire ; les autres sont déclarés complémentaires.
- Toute **Notion autonome** publiée possède un **visuel central** apportant une compréhension graphique réelle.
- Lorsqu'aucune intention graphique légitime n'existe, le contenu est fusionné ou reclassé — walkthrough, développement, point d'attention, Cas clinique, Maîtrise, différé ou exclu avec justification. Il ne reste pas une Notion autonome.
- Tout visuel supplémentaire est déclaré `principal` ou `complementary`, avec sa contribution et son rattachement au walkthrough.

### 3. Congruence obligatoire

Un bloc MM ou Notion n'est complet que si les éléments suivants sont congruents :

```text
rôle cognitif
↔ question canonique
↔ périmètre KP et territoires
↔ visuel central
↔ walkthrough canonique
```

Une décision technique de primitive, de famille, de technologie ou de renderer ne peut ni réduire ni élargir ce périmètre. Toute modification de rôle ou de portée retourne au gate éditorial Codex avant génération.

### 4. Accès dégradé ≠ publication complète

Les états `planned-not-built` et `built-but-withheld` sont conservés afin de signaler honnêtement un défaut et de préserver l'accès au contenu médical.

| Situation | Accès au walkthrough | Bloc complet | Release qualifiable |
|---|---:|---:|---:|
| Visuel central publié et congruent | Oui | Oui | Potentiellement |
| Visuel central planifié non construit | Oui, état dégradé | Non | Non |
| Visuel central construit mais retenu | Oui, état dégradé | Non | Non |
| Visuel central non congruent | Non publié comme bloc conforme | Non | Non |
| Aucun visuel légitime pour une Notion candidate | Après fusion/reclassification seulement | Sans objet | Sans objet |

Le maintien du walkthrough accessible est une mesure de fidélité et de continuité, jamais un PASS éditorial.

### 5. Visuels complémentaires

Un visuel explicitement complémentaire peut être différé sans rendre incomplet le visuel principal, uniquement si le contrat éditorial de l'élément démontre que :

- le visuel maître ou central publié satisfait seul la question canonique ;
- aucun KP nécessaire n'est perdu ;
- le complément est déclaré comme dette et non comme absence normale ;
- le statut de la Release expose cette dette.

### 6. Qualification

Aucun statut de chapitre complet, de readiness Product Review, de qualification éditoriale ou de publication complète ne peut être obtenu si un MM ou une Notion autonome manque de son visuel obligatoire ou si la congruence du bloc échoue.

---

## Supersessions et amendements

- Cette décision **supersède**, pour les Modèles mentaux et les Notions, l'amendement du 2026-07-25 de `VISUAL_GRAMMAR_CONTRACT.md` lorsqu'il conclut qu'un visuel est optionnel ou qu'un bloc sans visuel est complet.
- Elle ne retire pas au walkthrough sa canonicalité médicale et ne diminue aucune exigence de grounding, de fidélité ou de traçabilité.
- Elle amende les contrats fondamentaux 01, 02, 04, 05, 06 et 08.
- Elle précise PDR-F3 : seuls les visuels **complémentaires** explicitement secondaires sont différables ; un visuel maître ou central ne l'est pas pour une Release complète.
- Les packages publiés antérieurement restent conservés conformément à ADR-006 ; ils ne deviennent pas rétroactivement conformes.

---

## Conséquences

### Positives

- Le produit publié correspond à sa promesse visuelle.
- Un PASS technique ne peut plus masquer une incongruence éditoriale.
- Les Modèles mentaux et Notions possèdent une structure industrielle vérifiable.
- Les mécanismes de fallback continuent de protéger l'accès au contenu médical.

### Coûts et contraintes

- Les contrats, spécifications Reader, build et tests doivent être migrés.
- Les packages existants peuvent rester accessibles mais doivent être requalifiés avant nouvelle publication complète.
- La valeur cognitive et la congruence finale restent soumises à une attestation humaine ; elles ne sont pas déduites d'un score automatique.

---

## Documents connexes

- [`docs/contracts/04-CHAPTER-PACKAGE.md`](../contracts/04-CHAPTER-PACKAGE.md)
- [`docs/contracts/05-VISUAL-GRAMMAR.md`](../contracts/05-VISUAL-GRAMMAR.md)
- [`docs/contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md`](../contracts/08-RELEASE-EDITORIAL-ARCHITECTURE.md)
- [`docs/plans/editorial-prototyping-and-migration-plan.md`](../plans/editorial-prototyping-and-migration-plan.md)
- [`docs/analysis/phase1a-234-mm-notions-design.md`](../analysis/phase1a-234-mm-notions-design.md)
