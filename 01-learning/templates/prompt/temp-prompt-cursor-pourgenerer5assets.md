# Generate all learning assets

## Mission

Generate the complete set of learner-facing assets for one chapter.

The learning pipeline has already been designed and approved.

Your job is **only** to generate the final assets.

You are **not** redesigning the pipeline.

---

# IMPORTANT

Do NOT modify:

- repository structure
- directory layout
- prompts
- templates
- renderer
- storyboard
- coverage
- official-college
- README files
- architecture
- validation files

Do NOT rename files.

Do NOT move files.

Do NOT create new folders.

Do NOT suggest architectural improvements.

Generate the assets only.

---

# Repository structure

The current repository structure is the source of truth and must remain unchanged.

Chapter analysis:

01-learning/
└── chapter-analysis/
    └── <specialty>/
        └── <chapter>/
            ├── official-college.md
            ├── coverage.md
            └── storyboard.md

Generated assets:

01-learning/
└── generated-assets/
    └── <specialty>/
        └── <chapter>/
            ├── histoire.md
            ├── vue-ensemble.md
            ├── mecanismes.md
            ├── acteurs.md
            └── pret.md

Templates:

01-learning/templates/

- histoire-template.md
- vue-ensemble-template.md
- mecanismes-template.md
- acteurs-template.md
- pret-template.md

Generation prompts:

01-learning/templates/prompt/

- generate-histoire.md
- generate-vue-ensemble.md
- generate-mecanismes.md
- generate-acteurs.md
- generate-pret.md

This architecture is approved.

Do not modify it.

---

# Chapter to generate

Generate all assets for:

cardio/234-insuffisance-cardiaque

---

# Inputs

Use ONLY:

- official-college.md
- coverage.md
- storyboard.md

together with their corresponding prompt/template pair.

Each asset must be generated independently using its own prompt and template.

---

# Outputs

Generate or overwrite ONLY:

01-learning/generated-assets/cardio/234-insuffisance-cardiaque/

- histoire.md
- vue-ensemble.md
- mecanismes.md
- acteurs.md
- pret.md

Do not modify any other file.

---

# Generation rules

Each asset must:

- strictly follow its template;
- follow the pedagogical decisions defined in storyboard.md;
- remain medically faithful to official-college.md;
- collectively cover every knowledge unit from coverage.md;
- avoid unnecessary duplication with the other assets;
- be final learner-facing content intended to be displayed directly by the renderer.

Generated assets are **final content**, not design documents.

Do not reproduce sections from storyboard.md such as:

- Learning objective
- Purpose
- Knowledge covered
- Suggested assets
- Central metaphor
- Narrative structure

These belong only to the storyboard.

---

# Validation

Before writing the files, verify that:

- official-college.md exists
- coverage.md exists
- storyboard.md exists
- all five templates exist
- all five generation prompts exist

If any required file is missing, stop and explain why.

After generation, perform a final review and verify:

- all five assets were generated;
- only the five assets were modified;
- every asset follows its template;
- the storyboard has been respected;
- no medical knowledge has been invented;
- every knowledge unit from coverage.md is covered somewhere across the five assets.

Finally produce a short generation report listing:

- generated files
- warnings (if any)
- manual review points (if any)

Do not perform any other task.