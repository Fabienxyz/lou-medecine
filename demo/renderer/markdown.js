window.LouMarkdown = {
    parse(text) {
        if (typeof marked === "undefined") {
            throw new Error("marked library is not loaded");
        }
        return marked.parse(text);
    },
};

if (typeof marked !== "undefined") {
    marked.setOptions({
        gfm: true,
        breaks: false,
    });
}
