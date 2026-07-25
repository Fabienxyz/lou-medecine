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
    },

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
        const parts = [this.resolveContentRoot(chapter), filename].join("/");
        return new URL(parts, window.location.href).href;
    },

    resolveManifestPath(chapter) {
        return this.resolveAssetPath(chapter, this.MANIFEST_FILENAME);
    },

    projectionTabLabel(projection) {
        if (projection.label) return projection.label;
        if (projection.id === "story") return "📖 Histoire";
        if (projection.id === "overview") return "🗺️ Vue d'ensemble";
        if (projection.id === "mechanisms") return "❓ Pourquoi ?";
        if (projection.id === "clinical-reasoning") return "🩺 Raisonnement clinique";
        return projection.id;
    },
};
