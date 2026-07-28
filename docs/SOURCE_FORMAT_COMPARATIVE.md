# Lou Médecine — Analyse comparative des formats source EDN

**Statut :** analyse technique — alimente la Phase P  
**Dernière mise à jour :** 2026-07-28

Ce document compare les formats susceptibles d'être disponibles pour les Collèges EDN officiels. L'objectif n'est **pas** de déterminer quel format produit le Markdown source le plus « joli », mais **quel format constitue la meilleure source primaire** pour un pipeline industriel, déterministe, maintenable et généralisable.

Pour la gouvernance de qualification et la chaîne officielle FIL B, voir [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) et [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md).

---

## 1. Méthode d'évaluation

Chaque format est noté sur **15 critères**, échelle **1 (faible) à 5 (excellent)** :

| Critère | Question posée |
|---|---|
| Fidélité potentielle | Le format encode-t-il le contenu sans perte sémantique ? |
| Richesse structurelle | Titres, listes, encadrés, notes, métadonnées sont-ils natifs ? |
| Extraction déterministe | Peut-on extraire sans heuristique fragile ni OCR ? |
| Conservation des tableaux | Cellules, fusion, en-têtes multi-lignes ? |
| Conservation des figures | Images embarquées + résolution traçable ? |
| Gestion des légendes | Association figure/table ↔ légende fiable ? |
| Hiérarchie documentaire | Niveaux de titre explicites ou inférables ? |
| Stabilité des ancres | Identifiants stables entre éditions/exécutions ? |
| Reproductibilité | Même entrée → mêmes octets de sortie ? |
| Facilité d'automatisation | Pipeline scriptable, testable en CI ? |
| Dépendance LLM | LLM nécessaire pour la production (pas la validation) ? |
| Coût de traitement | CPU, maintenance, complexité par collège ? |
| Robustesse long terme | Résistance à l'obsolescence technique des outils d'extraction ? |
| **Pérennité du format** | Standard ouvert, documentation publique, maturité de l'écosystème, indépendance vis-à-vis d'un éditeur, probabilité d'exploitabilité dans plusieurs années ? |
| Compatibilité philosophie Lou | Alignement avec déterminisme, traçabilité, généralisation ? |

**Légende des scores agrégés :** ★★★★★ excellent · ★★★★☆ bon · ★★★☆☆ moyen · ★★☆☆☆ faible · ★☆☆☆☆ mauvais

---

## 2. Synthèse comparative

| Critère | XML | HTML | DOCX | EPUB | PDF | LaTeX | MD natif |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Fidélité potentielle | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★☆☆ |
| Richesse structurelle | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ |
| Extraction déterministe | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★★★ | ★★★★★ |
| Conservation tableaux | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ |
| Conservation figures | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★☆☆☆ |
| Gestion légendes | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ |
| Hiérarchie documentaire | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★★★ | ★★★☆☆ |
| Stabilité ancres | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★☆☆☆☆ | ★★★★☆ | ★★★☆☆ |
| Reproductibilité | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| Automatisation | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | ★★★★★ |
| Dépendance LLM (prod.) | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| Coût traitement | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| Robustesse long terme | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ |
| **Pérennité du format** | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Compatibilité Lou | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ |
| **Score moyen** | **4,9** | **4,3** | **3,8** | **3,7** | **2,3** | **4,4** | **3,3** |

*LaTeX et Markdown natif : pertinents si disponibles, peu probables pour les EDN.*

### Pérennité du format — détail

Ce critère évalue la **durabilité du format en tant que standard**, indépendamment de la qualité d'extraction immédiate :

| Format | Standard | Documentation | Écosystème | Dépendance éditeur | Exploitabilité future |
|---|---|---|---|---|---|
| **XML** | JATS, TEI, DocBook — standards ouverts | Spécifications publiques, XSD | Mature (édition scientifique) | Faible si schéma ouvert | ★★★★★ |
| **HTML** | W3C, vivant | Spécifications W3C, MDN | Très mature | Faible | ★★★★★ |
| **DOCX** | ISO/IEC 29500 (OOXML) | ECMA-376, ISO publiés | Mature mais centré Microsoft | **Élevée** (Word, mises à jour propriétaires) | ★★★☆☆ |
| **EPUB** | W3C (EPUB 3) | Spécification publique | Mature (édition numérique) | Faible | ★★★★★ |
| **PDF** | ISO 32000 | Spécification ISO publique | Très mature | Modérée (Adobe, variantes éditeur) | ★★★★☆ |
| **LaTeX** | Open source (LaTeX2e) | Documentation exhaustive | Mature (académique) | Faible | ★★★★★ |
| **MD natif** | CommonMark (partiel) | Spécification CommonMark | Mature mais non normatif pour l'édition | Faible | ★★★☆☆ — risque de variantes non autoritaires |

**Impact sur la recommandation.** La pérennité pénalise DOCX malgré sa bonne structure : dépendance à Microsoft Word et réexport variable. HTML et XML restent en tête. Le PDF, bien qu'ISO et durable, reste pénalisé sur l'extraction, pas sur la pérennité du format lui-même.

---

## 3. Analyse par format

### 3.1 XML (schémas éditoriaux — JATS, TEI, XML maison EDN)

**Description.** Markup sémantique explicite : sections, paragraphes, tableaux, figures, légendes, références croisées, souvent avec `@id` stables.

**Forces.**

- Structure **native** : pas d'inférence à partir de la géométrie.
- Tableaux en `<table>` avec `<thead>`, `<tbody>`, `rowspan`/`colspan`.
- Figures avec `<fig>`, `<graphic>`, `<caption>`.
- Ancres stables via attributs `id` — compatibles directement avec le modèle d'ancre Lou.
- Pipeline 100 % déterministe (XPath, XSLT, transform custom).
- Reproductibilité et testabilité maximales.

**Faiblesses.**

- Peu probable que les EDN publient en XML aujourd'hui ; dépend de la politique éditoriale.
- Schémas variés (JATS vs custom) → un adaptateur par schéma, mais une fois écrit, généralisable.

**Verdict.** **Meilleure source primaire théorique.** Si l'éditeur EDN fournit un XML structuré (ou un export DocBook/JATS), il doit être **privilégié sans hésitation**.

---

### 3.2 HTML (publication web sémantique)

**Description.** XHTML/HTML5 publié sur un portail, avec balises sémantiques (`<h1>`–`<h6>`, `<table>`, `<figure>`, `<figcaption>`).

**Forces.**

- Structure lisible directement ; parsing DOM standard (BeautifulSoup, lxml, Playwright pour rendu).
- Tableaux et figures bien supportés si le HTML est sémantique (pas uniquement des `<div>` positionnés).
- Automatisation et CI faciles.
- Format ouvert, outillage abondant.

**Faiblesses.**

- Qualité **très variable** : HTML généré depuis InDesign ou PDF2HTML est souvent du layout, pas de la sémantique.
- Pastilles Rang EDN (graphiques en marge) souvent absentes ou converties en images inline sans sémantique.
- Ancres stables si `@id` présents ; sinon, génération de hash sur le chemin DOM — moins stable entre éditions.

**Verdict.** **Excellent choix si le HTML est sémantique** (titres réels, tableaux natifs). À **éviter** si c'est un export visuel d'un PDF. La Phase P doit inspecter le DOM, pas le rendu visuel.

---

### 3.3 DOCX (Office Open XML)

**Description.** Archive ZIP contenant XML WordprocessingML : paragraphes stylés, tableaux, images embarquées, styles de titre.

**Forces.**

- Structure **supérieure au PDF** : paragraphes, styles, listes numérotées, tableaux OOXML.
- Extraction déterministe mature (python-docx, Pandoc, LibreOffice headless).
- Figures embarquées avec relation explicite dans `document.xml.rels`.
- Probable format de travail interne des maisons d'édition médicales.

**Faiblesses.**

- Styles de titre dépendent de la discipline éditoriale (Heading 1 vs texte en gras 14 pt).
- Encadrés et text boxes flottants : structure variable, parfois hors flux principal.
- Pastilles Rang : souvent absentes ou en images inline sans label sémantique.
- Légendes de figures : parfois dans un paragraphe séparé sans lien formel.
- Réexport Word peut modifier légèrement le OOXML (reproductibilité du **fichier source**, pas du pipeline).

**Verdict.** **Meilleur compromis réaliste** si pas de XML/HTML sémantique. Format à **privilégier sur le PDF** dès qu'il est disponible auprès de l'éditeur.

---

### 3.4 EPUB

**Description.** Archive ZIP de chapitres XHTML + CSS + images ; conçu pour le reflow, pas la mise en page fixe.

**Forces.**

- Contenu en XHTML : extraction DOM similaire au HTML.
- Figures et légendes souvent en `<figure>`/`<figcaption>`.
- Standard ouvert, outillage (Calibre, epubcheck, Pandoc).

**Faiblesses.**

- **Reflow** : perte de la mise en page print (colonnes, marges, pastilles Rang).
- Découpage en chapitres EPUB ≠ découpage chapitres EDN — mapping à établir.
- Tableaux complexes parfois convertis en images.
- Métadonnées limitées pour la hiérarchisation EDN.

**Verdict.** **Acceptable pour le texte et les figures**, insuffisant seul si les pastilles Rang ou les tableaux complexes sont critiques. Utile en **complément**, pas en source primaire si DOCX ou HTML sémantique existent.

---

### 3.5 PDF

**Description.** Format de **rendu visuel** ; texte, structure et images sont des instructions de dessin, pas un modèle documentaire.

**Forces.**

- **Disponibilité actuelle** : c'est le format publié aujourd'hui par les EDN.
- Texte extractible si couche texte native (pas scan).
- Référence immuable pour audit et provenance.

**Faiblesses.**

- **Pas de structure sémantique** : titres inférés par taille de police ; tableaux reconstruits par heuristiques géométriques.
- **Ordre de lecture** : colonnes multiples, encadrés flottants → erreurs fréquentes.
- **Pastilles Rang** : graphiques raster, pas de label textuel → extraction par vision ou OCR, fragile.
- **Figures** : extraction par région + association heuristique à la légende.
- **Instabilité des ancres** : basées sur numéros de page + position, pas sur identifiants sémantiques.
- **Coût de maintenance élevé** : chaque mise en page éditoriale différente peut casser les heuristiques (Phase 5).
- Le pipeline actuel (`lou-pdf-to-canonical`) a gelé v1.0.0 avec des **limites acceptées** — preuve que le PDF est une source de compromis, pas d'optimum.

**Verdict.** **Source de repli**, pas source primaire. À utiliser **uniquement** lorsqu'aucun format structuré n'est disponible. La Phase P doit documenter explicitement les limites héritées du PDF.

---

### 3.6 Autres formats pertinents

| Format | Pertinence | Commentaire |
|---|---|---|
| **LaTeX source** | Faible disponibilité, haute qualité | Si l'éditeur fournit les sources LaTeX : structure excellente, ancres `\label`, tableaux `tabular`. Priorité équivalente à XML. |
| **Markdown natif** | Rare | Idéal comme entrée Tool 01, mais les EDN ne publient pas en MD officiel ; risque de version non autoritaire. |
| **JSON / API structurée** | Hypothétique | Meilleure source possible si un jour l'éditeur expose une API ; traitement trivial. |
| **DOC (legacy)** | Obsolescent | Convertir en DOCX via LibreOffice avant qualification ; ne pas qualifier sur .doc natif. |
| **Scanned PDF (image)** | Pire cas | OCR obligatoire → non déterministe, hors philosophie Lou sauf dernier recours. |

---

## 4. Éléments EDN spécifiques

Certains éléments des Collèges EDN pèsent différemment selon le format :

| Élément EDN | Format le plus favorable | Format le plus défavorable |
|---|---|---|
| Pastilles Rang A/B/C/D/E | XML/HTML avec classe sémantique ; DOCX avec style nommé | PDF (raster) ; EPUB reflow |
| Tableaux décisionnels | XML, HTML `<table>`, DOCX table | PDF (reconstruction) ; EPUB (image) |
| Figures `Fig. N` | XML `<fig>`, HTML `<figure>` | PDF (extraction région) |
| Encadrés « Attention / Retenir » | XML `<boxed-text>`, DOCX style Encadré | PDF (inférence position) |
| Hiérarchie chapitre / item | XML `<sec>`, HTML headings, DOCX Heading N | PDF (font size heuristic) |
| Références croisées | XML `@xref`, HTML `@id` | PDF (texte plain) |

---

## 5. Recommandation

### Règle de priorité (si plusieurs formats disponibles)

```
1. XML sémantique (JATS, TEI, XML maison EDN)
2. HTML sémantique (titres, tableaux et figures natifs — pas export PDF→HTML)
3. DOCX (Office Open XML)
4. LaTeX source (si disponible)
5. EPUB (si DOCX/HTML absents)
6. PDF avec couche texte native
7. PDF scanné (OCR) — dernier recours, NO GO probable
```

### Recommandation pour Lou Médecine aujourd'hui

**Constat.** Le collège pilote (cardiologie 2022) n'est disponible qu'en **PDF**. Tool 01 (`lou-pdf-to-canonical` v1.0.0) constitue aujourd'hui la **chaîne officielle** (FIL B) — voir [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). L'analyse comparative reste nécessaire pour détecter un format source supérieur éventuel.

**Action Phase P.**

1. **Demander à l'éditeur EDN** (ou interroger les métadonnées de publication) les formats disponibles : DOCX, EPUB, HTML, XML.
2. **Si DOCX ou HTML sémantique disponible** : concevoir un pipeline d'acquisition dédié, le qualifier sur le collège cardio, **ne pas étendre** le pipeline PDF au-delà du nécessaire.
3. **Si seul le PDF est disponible** : qualifier le pipeline PDF existant, documenter les limites source (Rang graphique, tableaux) comme **contraintes du format** ; ne les transformer en exigences Tool 01 que si un critère **V1–V4** est activé par impact aval démontré ([`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) § 7).
4. **Préparer l'architecture** pour accueillir plusieurs pipelines d'acquisition (un par type de source), convergents vers le **même Markdown source officiel** (contrat Tool 01), puis découpage Tool 02.

**Format source primaire recommandé : DOCX**, dans l'hypothèse réaliste où les éditeurs médicaux disposent du fichier Word source mais ne publient publiquement qu'un PDF. DOCX offre le meilleur rapport **structure / disponibilité / déterminisme** sans exiger un engagement éditorial vers XML. **Attention :** sa pérennité est inférieure à HTML/XML/EPUB (dépendance Microsoft) — si l'éditeur peut fournir un export HTML sémantique ou XML, ceux-ci priment malgré la disponibilité probable du DOCX.

**Si l'éditeur EDN confirme un export XML ou HTML sémantique** : DOCX cède la priorité immédiatement — meilleure pérennité et indépendance éditoriale.

**Le PDF ne doit pas être enrichi** (OCR, vision, heuristiques par collège) tant qu'un format structuré n'a pas été formellement écarté.

---

## 6. Impact sur le pipeline cible

```
                    ┌─ acquisition-xml-v1 ──────┐
                    ├─ acquisition-html-v1 ─────┤
Source primaire ────┼─ acquisition-docx-v1 ───────┼→ Markdown source (Tool 01 ou équivalent)
                    ├─ acquisition-epub-v1 ──────┤        ↓
                    └─ acquisition-pdf-v1 ────────┘   Tool 02 → Chapitres → Pipeline Lou
                              (FIL B actuel)
```

Chaque branche d'acquisition est qualifiée et gelée indépendamment (Phase P). Tool 02 et le pipeline Lou restent **agnostiques** du format d'origine. **Une seule branche active par collège/édition** — règle SSOT ([`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md)).

---

## 7. Documents connexes

| Document | Rôle |
|---|---|
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Chaîne officielle FIL B, SSOT |
| [`SOURCE_PIPELINE_QUALIFICATION.md`](SOURCE_PIPELINE_QUALIFICATION.md) | Gouvernance Phase P — critères P1–P7, GO/NO GO |
| [`acquisition/`](acquisition/) | Dossier de qualification — produit en Phase P |
| [`MASTER_ROADMAP.md`](MASTER_ROADMAP.md) | Séquencement |
| `01-learning/tools/01-pdf-to-canonical/DECISIONS.md` | État actuel du pipeline PDF |
