#!/usr/bin/env python3
"""Fix inventory anchor quotes to match FIL B source verbatim (Unicode apostrophes, exact text)."""
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("pip install pyyaml")

ROOT = Path(__file__).resolve().parents[4]
CHAPTER = ROOT / "01-learning/chapters/cardio/330"
SOURCE = CHAPTER / "01-learning/full-edn/cardiology/edition-2022/chapters/item-330-prescription-et-surveillance-des-classes-de-medicaments-les-plus-courantes-chez-ladulte-et-chez-lenfant-hors-anti-infectieux-connaitre-les-grands-principes-therapeutiques.md"
SOURCE = ROOT / "01-learning/full-edn/cardiology/edition-2022/chapters/item-330-prescription-et-surveillance-des-classes-de-medicaments-les-plus-courantes-chez-ladulte-et-chez-lenfant-hors-anti-infectieux-connaitre-les-grands-principes-therapeutiques.md"
INV = CHAPTER / "inventory.yaml"


def normalize(text: str) -> str:
    text = re.sub(r"^>\s?", "", text, flags=re.MULTILINE)
    return re.sub(r"\s+", " ", text).strip()


def section_scope(source: str, section_path: str, meta: dict) -> str:
    sections = meta.get("sections", [])
    sec = next((s for s in sections if s["path"] == section_path), None)
    if not sec:
        return source
    markers = sec.get("heading_markers", [])
    if not markers:
        return source
    start = source.find(markers[0])
    if start == -1:
        return source
    ordered = sorted(
        sections,
        key=lambda s: source.find(s["heading_markers"][0]) if s.get("heading_markers") else -1,
    )
    idx = next(i for i, s in enumerate(ordered) if s["path"] == section_path)
    end = len(source)
    if idx + 1 < len(ordered):
        nxt = ordered[idx + 1]["heading_markers"][0]
        pos = source.find(nxt, start + 1)
        if pos != -1:
            end = pos
    return source[start:end]


def find_unique_quote(source: str, needle: str) -> str | None:
    norm_needle = normalize(needle)
    if not norm_needle:
        return None
    norm_source = normalize(source)
    if norm_source.count(norm_needle) == 1:
        return extract_original(source, norm_needle)
    # try lengthening with words from source around first fuzzy match
    words = norm_needle.split()
    while len(words) > 3:
        words.pop()
        sub = " ".join(words)
        if norm_source.count(sub) == 1:
            return extract_original(source, sub)
    return None


def extract_original(source: str, norm_needle: str) -> str:
    words = norm_needle.split()
    pattern = r"\s+".join(re.escape(w) for w in words)
    m = re.search(pattern, source, re.IGNORECASE | re.DOTALL)
    if not m:
        raise ValueError(f"cannot extract: {norm_needle[:50]}")
    return re.sub(r"\s+", " ", m.group(0)).strip()


def main():
    source = SOURCE.read_text(encoding="utf-8")
    meta = yaml.safe_load((CHAPTER / "source.meta.yaml").read_text(encoding="utf-8"))
    inv = yaml.safe_load(INV.read_text(encoding="utf-8"))

    failed = []
    fixed = 0
    for kp in inv["kps"]:
        for anchor in kp.get("anchors", []):
            scoped = section_scope(source, anchor.get("section_path", ""), meta)
            norm_q = normalize(anchor["quote"])
            norm_scoped = normalize(scoped)
            count = norm_scoped.count(norm_q)
            if count == 1:
                exact = extract_original(scoped, norm_q)
                if exact != anchor["quote"]:
                    anchor["quote"] = exact
                    fixed += 1
                continue
            exact = find_unique_quote(scoped, anchor["quote"])
            if exact:
                anchor["quote"] = exact
                fixed += 1
            else:
                failed.append((kp["id"], anchor["quote"][:70], count))

    print(f"Fixed {fixed} anchors")
    if failed:
        print(f"Still failing {len(failed)}:")
        for f in failed:
            print(f"  {f[0]}: count={f[2]} | {f[1]}…")

    # Round-trip validate counts
    still_bad = []
    for kp in inv["kps"]:
        for anchor in kp.get("anchors", []):
            scoped = section_scope(source, anchor.get("section_path", ""), meta)
            nq = normalize(anchor["quote"])
            ns = normalize(scoped)
            c = ns.count(nq)
            if c != 1:
                still_bad.append((kp["id"], c, anchor["quote"][:60]))

    if still_bad:
        print(f"\nValidation: {len(still_bad)} anchors still bad")
        for b in still_bad[:20]:
            print(f"  {b[0]}: {b[1]}x | {b[2]}")
        sys.exit(1)

    print("All anchors unique in scope")

    # Write back preserving structure — use yaml dump with wide lines
    def represent_str(dumper, data):
        if "\n" in data or ":" in data or "'" in data or "\u2019" in data:
            return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
        return dumper.represent_scalar("tag:yaml.org,2002:str", data)

    yaml.add_representer(str, represent_str)
    out = yaml.dump(inv, allow_unicode=True, sort_keys=False, width=1000, default_flow_style=False)
    INV.write_text(out, encoding="utf-8")
    print(f"Wrote {INV}")


if __name__ == "__main__":
    main()
