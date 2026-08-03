window.LouConfig = {
    // The canonical output location of the build: `lou-build` writes a chapter here, and its
    // manifest.json is the renderer's entry point (REFERENCE_IMPLEMENTATION_DESIGN.md §2).
    CHAPTERS_ROOT: "../../01-learning/chapters",

    // The superseded pre-architecture prototype, kept for history only: every artifact under it is
    // classified REGENERATE / TRANSFORM / ARCHIVE (§14). It is a fallback for chapters that have not
    // been rebuilt yet, never a destination for anything generated.
    LEGACY_ASSETS_ROOT: "../../01-learning/generated-assets",

    // Legacy URLs named a chapter by its prose slug; the built chapter is keyed by item number.
    // Aliasing keeps old links working without copying artifacts between the two locations.
    LEGACY_CHAPTER_ALIASES: {
        "cardio/234-insuffisance-cardiaque": "cardio/234",
    },

    /** Filename for chapter metadata (manifest.json or chapter.json). */
    MANIFEST_FILENAME: "manifest.json",

    PLACEHOLDER_MESSAGE: "Content not yet implemented.",

    ERROR_MESSAGES: {
        noChapter: "No chapter specified.",
        chapterNotFound: "Chapter not found.",
        loadFailed: "Failed to load content.",
        emptyContent: "Content is empty.",
        legacyContent:
            "Contenu de prototype (avant architecture) : ce chapitre n’a pas encore de sortie de build. Rien ici n’est tracé ni vérifié.",
        knownAbsent:
            "Projection absente connue (déclarée par le package). Ce n’est pas une erreur de chargement.",
        projectionMissing:
            "Artefact de projection manquant : le package le déclare publié, mais le fichier est introuvable.",
        projectionInvalid:
            "Artefact de projection invalide ou inutilisable.",
        manifestInvalid:
            "Manifeste invalide : le fichier existe mais ne peut pas être interprété.",
        manifestNetwork:
            "Erreur réseau lors du chargement du manifeste.",
        manifestServer:
            "Erreur serveur lors du chargement du manifeste.",
        viewPlanned:
            "Cette vue est prévue — le contenu n'est pas encore disponible.",
        notesShell:
            "Espace Notes — tes fiches et annotations de consolidation apparaîtront ici.",
        cognitivePrimingArtifactMissing:
            "Artefact d'amorçage cognitif introuvable : le package le déclare publié, mais le fichier est absent.",
        cognitivePrimingLoadFailed:
            "Échec du chargement de l'artefact d'amorçage cognitif.",
        cognitivePrimingParse:
            "Artefact d'amorçage cognitif invalide ou inutilisable.",
        cognitivePrimingSchema:
            "Version de schéma d'amorçage cognitif non supportée.",
        cognitivePrimingBadge:
            "Badge de complément IA invalide dans l'artefact d'amorçage cognitif.",
        productBootstrap: {
            UNKNOWN_RELEASE:
                "Release introuvable dans la bibliothèque installée.",
            INVALID_CATALOG:
                "Catalogue bibliothèque invalide ou illisible.",
            MANIFEST_INCOHERENT:
                "Manifeste incohérent ou artefact déclaré manquant.",
            ASSET_MISSING:
                "Artefact du package introuvable dans la bibliothèque.",
            DIGEST_DIVERGENT:
                "Le contenu publié a changé (content_digest) — la réparation automatique a échoué.",
            RUNTIME_PREPARATION_FAILED:
                "Préparation hors ligne du package impossible.",
            CERTIFICATION_FAILED:
                "Certification hors ligne du package impossible.",
            UNKNOWN:
                "Échec du démarrage en mode produit (Product Review).",
        },
    },

    /** Legacy prototype tabs — manifest 404 only (ADR-002). */
    TABS: [
        {
            id: "histoire",
            label: "📖 Histoire",
            file: "histoire.md",
            implemented: true,
        },
        {
            id: "pourquoi",
            label: "❓ Pourquoi ?",
            file: null,
            implemented: false,
        },
        {
            id: "vue-ensemble",
            label: "🗺️ Vue d'ensemble",
            file: "vue-ensemble.md",
            implemented: false,
        },
        {
            id: "acteurs",
            label: "🔬 Les acteurs",
            file: "acteurs.md",
            implemented: false,
        },
        {
            id: "pret",
            label: "🎯 Suis-je prêt ?",
            file: "pret.md",
            implemented: false,
        },
    ],

    // Resolution is canonical-first and evidence-based: a chapter is served from the build output
    // whenever that output exists. There is deliberately no per-chapter allowlist here — the
    // renderer must not carry a list of which chapters have been built.
    contentRoot: null,

    /** Product mode (D2-G): Browser Package Access instead of CHAPTERS_ROOT. */
    productMode: false,
    libraryBaseUrl: null,
    _releaseId: null,
    _packageAccess: null,
    _buildReleaseScopedUrl: null,

    /**
     * @param {{
     *   libraryBaseUrl: string,
     *   releaseId: string,
     *   packageAccess: object,
     *   buildReleaseScopedUrl: (base: string, releaseId: string, path: string) => string,
     * }} opts
     */
    enableProductMode(opts) {
        this.productMode = true;
        this.libraryBaseUrl = opts.libraryBaseUrl.replace(/\/+$/, "");
        this._releaseId = opts.releaseId;
        this._packageAccess = opts.packageAccess;
        this._buildReleaseScopedUrl = opts.buildReleaseScopedUrl;
    },

    isProductMode() {
        return this.productMode === true;
    },

    resolveContentRoot(chapter) {
        return (this.contentRoot || this.CHAPTERS_ROOT) + "/" + chapter;
    },

    useLegacyContentRoot() {
        this.contentRoot = this.LEGACY_ASSETS_ROOT;
    },

    isLegacyContentRoot() {
        return this.contentRoot === this.LEGACY_ASSETS_ROOT;
    },

    sanitizeChapter(chapter) {
        if (!chapter || typeof chapter !== "string") {
            return null;
        }
        const trimmed = chapter.trim();
        if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
            return null;
        }
        return this.LEGACY_CHAPTER_ALIASES[trimmed] || trimmed;
    },

    resolveAssetPath(chapter, filename) {
        if (this.productMode && this._releaseId && this._buildReleaseScopedUrl) {
            return this._buildReleaseScopedUrl(
                this.libraryBaseUrl,
                this._releaseId,
                filename.replace(/\\/g, "/")
            );
        }
        const parts = [this.resolveContentRoot(chapter), filename].join("/");
        return new URL(parts, window.location.href).href;
    },

    resolveManifestPath(chapter) {
        return this.resolveAssetPath(chapter, this.MANIFEST_FILENAME);
    },
};
