window.LouConfig = {
    ASSETS_ROOT: "../../01-learning/generated-assets",

    /** Filename for chapter metadata (manifest.json or chapter.json). */
    MANIFEST_FILENAME: "manifest.json",

    PLACEHOLDER_MESSAGE: "Content not yet implemented.",

    ERROR_MESSAGES: {
        noChapter: "No chapter specified.",
        chapterNotFound: "Chapter not found.",
        loadFailed: "Failed to load content.",
        emptyContent: "Content is empty.",
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

    sanitizeChapter(chapter) {
        if (!chapter || typeof chapter !== "string") {
            return null;
        }
        const trimmed = chapter.trim();
        if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) {
            return null;
        }
        return trimmed;
    },

    resolveAssetPath(chapter, filename) {
        const parts = [this.ASSETS_ROOT, chapter, filename].join("/");
        return new URL(parts, window.location.href).href;
    },

    resolveManifestPath(chapter) {
        return this.resolveAssetPath(chapter, this.MANIFEST_FILENAME);
    },
};
