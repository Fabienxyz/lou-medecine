// Runtime SVG highlight debugger — enable with ?debugSvgHighlights=1
// or localStorage.setItem("lou-debug-svg-highlights", "1") then reload.
(function (global) {
    if (
        new URLSearchParams(global.location.search).get("debugSvgHighlights") !==
            "1" &&
        global.localStorage.getItem("lou-debug-svg-highlights") !== "1"
    ) {
        return;
    }

    global.__LOU_SVG_DEBUG__ = true;
    global.__LOU_SVG_TRACE__ = global.__LOU_SVG_TRACE__ || [];

    global.louSvgDebugStep = function (step, detail) {
        const entry = Object.assign(
            { t: Date.now(), step: step },
            detail || {}
        );
        global.__LOU_SVG_TRACE__.push(entry);
        console.log("[LouSvgHighlight]", step, detail || {});
    };

    global.louSvgDebugPause = function (step, detail) {
        global.louSvgDebugStep(step, detail);
        debugger;
    };

    console.info(
        "[LouSvgHighlight] Debug enabled — trace in window.__LOU_SVG_TRACE__"
    );
})();
