#!/usr/bin/env node
import { splitCollege } from "./lib/pipeline.js";
import { TOOL_VERSION } from "./lib/manifest.js";

function printHelp() {
  console.log(`lou-chapter-splitter v${TOOL_VERSION}

Split Tool 01 canonical Markdown into one file per chapter.

USAGE
  node cli.js --specialty <name> --edition <year>
  node cli.js --input <path/to/official-college.md>

OPTIONS
  --specialty <name>   Specialty folder under full-edn/
  --edition <year>     Edition year or label (e.g. 2022)
  --input <md>         Explicit official-college.md path
  --outdir <dir>       Chapters output directory (default: <edition>/chapters)
  --root <dir>         Path to 01-learning/
  --dry-run            Validate without writing files
  --verbose            Progress to stderr
  --help               Show this help

OUTPUT
  chapters/
    manifest.json
    item-<n>-<slug>.md
    ...

EXAMPLES
  node cli.js --specialty cardiology --edition 2022
  node cli.js --input ../../full-edn/cardiology/edition-2022/official-college.md
`);
}

function parseArgs(argv) {
  const opts = { verbose: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v == null) throw new Error(`Missing value after ${a}`);
      return v;
    };
    switch (a) {
      case "--help":
      case "-h":
        opts.help = true;
        break;
      case "--specialty":
        opts.specialty = next();
        break;
      case "--edition":
        opts.edition = next();
        break;
      case "--input":
        opts.input = next();
        break;
      case "--outdir":
        opts.outdir = next();
        break;
      case "--root":
        opts.root = next();
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--verbose":
        opts.verbose = true;
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 2;
    return;
  }

  if (opts.help || process.argv.length <= 2) {
    printHelp();
    return;
  }

  try {
    const result = splitCollege(opts);
    if (opts.verbose || opts.dryRun) {
      console.error(
        `OK — ${result.files.length} chapters` +
          (opts.dryRun ? " (dry-run)" : ` → ${result.paths.chaptersDir}`)
      );
    } else {
      console.log(
        `SPLIT PASS — ${result.files.length} chapters → ${result.paths.chaptersDir}`
      );
      console.log(`MANIFEST    — ${result.paths.manifestPath}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

main();
