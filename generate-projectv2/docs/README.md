# PRD — Master Orchestrator (LangGraph)

**Doc owner:** Luka Eric
**Version:** 0.1 (draft)
**Last updated:** Today
**Status:** For build

---

## 1) Purpose & Problem

Educators need classroom-ready, standards-aligned, project experiences that feel real and are easy to run. Today this requires manual authoring across theme, roles, steps, and data—slow, inconsistent, and hard to validate.
**Goal:** A deterministic orchestration flow that transforms a small academic “seed” into a complete, validated project bundle (world, teacher objective, student roles, steps, shared/individual data) with full observability.

---

## 2) Objectives & Non-Goals

**Objectives**

* Convert an academic seed into a **Final Bundle** that passes schema, consistency, and objective-fit validation.
* Support **node-by-node development** with the ability to run, inspect, and test any node in isolation.
* Provide **observability** of inputs/outputs, token usage, latency, and intermediate state per node/run.
* Ensure **curriculum alignment** to explicit standards and easy evidence tracing.

**Non-Goals**

* Authoring UI for teachers (future phase).
* Auto-grading or rubric generation (future phase).
* Multi-language generation (future phase).
* Real-time classroom facilitation tools (out of scope for MVP).

---

## 3) Users & Use Cases

**Primary user:** Internal content engineer / PM building and testing projects.
**Secondary user:** Instructional designer reviewing outputs for quality.
**Tertiary user:** Teacher consuming the final bundle via another surface (LMS/print/app).

**Core use cases**

1. Run the full pipeline from a new seed and download the Final Bundle.
2. Iterate on a single node (e.g., Shared Data Maker), using frozen upstream inputs.
3. Inspect node I/O and state diffs to debug quality issues.
4. Validate, fix small issues automatically, and surface larger inquiries for user decision.

---

## 4) Success Metrics (MVP)

* ≥ 95% of end-to-end runs produce a schema-valid Final Bundle without manual edits.
* ≤ 3 minutes median end-to-end latency for default seeds.
* 100% of bundles include at least one explicit standards mapping and evidence notes.
* Observability coverage: 100% nodes emit start/end events, inputs (keys), outputs (keys), durations, token counts, and truncation flags.
* Reviewer satisfaction ≥ 4/5 on realism, clarity, and instructional fit (internal rubric).

---

## 5) System Overview

Workflow is a directed graph of nodes with a validator–fixer loop at the end.

**Nodes (MVP):**

1. **Spec Builder**
2. **Standards Mapper**
3. **Objective Composer** (world + teacher objective + roles)
4. **Step Planner** (global steps)
5. **Shared Data Maker**
6. **Role Expanders** (individual steps & private data)
7. **Merge** (assemble to canonical schema)
8. **Validators** (schema → consistency → objective-fit)
9. **Fixer** (small, safe edits) → back to Validators

**Key invariant:** Final payload order is World → Teacher Objective → Student Roles → Global Steps → Shared Data → Individual Briefs → Standards.

---

## 6) Data Contracts (v0.1 — canonical objects)

*(No code; field lists only)*

**Seed**: topic, grade\_band, constraints{}
**Spec**: subject, grade\_band, skills\[], time\_minutes, guards{}, schema\_version
**StandardTarget**: code, description, evidence\_note
**World**: theme (2–4 lines), context, constraints\[]
**TeacherObjective**: statement
**Role**: name, objective, constraints\[], win\_condition
**GlobalSteps**: steps\[] (imperatives + expected artifacts)
**SharedData**: knobs{}, tables{name → rows\[]}
**IndividualBrief**: role\_name, private\_data{}, individualized\_steps\[]
**FinalBundle**: world, teacher\_objective, roles\[], global\_steps, shared\_data, individuals\[], standards\[], schema\_version

**Versioning**

* Schema version required on Spec and FinalBundle.
* Any breaking change increments minor version; deprecations documented.

---

## 7) Detailed Requirements by Node

### 7.1 Spec Builder

**Purpose:** Turn Seed into a concrete, constrained spec all nodes can trust.
**Inputs:** Seed from frontend Application or bash command. 
**Outputs:** Spec.
**Rules/Acceptance:**

* Must include subject, grade\_band, target skills, time\_minutes, guards, schema\_version.
* Guards include vocabulary bans, safety notes, cultural constraints if provided.
* Deterministic with the same Seed and Guards.

### 7.2 Standards Mapper

**Purpose:** Bind spec/seed to curriculum codes. Turns vague request (e.g., “Grade 6 Geometry, 3 students”) into clear learning targets tied to an official standard set.
**Inputs:** Seed, Spec.
**Outputs:** standards\[].
**Rules/Acceptance:**

 "targets": [
      {
        "code": "6.G.A.1",
        "can_do": "Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing/decomposing."
      },
      {
        "code": "6.G.A.2",
        "can_do": "Find the volume of right rectangular prisms with fractional edge lengths."
      },
      {
        "code": "6.G.A.4",
        "can_do": "Represent 3D figures using nets and compute surface area."
      }]

* At least one standard required; multiple allowed.

### 7.3 Objective Composer

**Purpose:** Create theme/world, teacher objective, and base roles.
**Inputs:** Spec, standards.
**Outputs:** world, teacher\_objective, roles\[].
**Rules/Acceptance:**

* World is 2–4 lines + constraints list; no setting contradictions with standards.
* Teacher objective is a single sentence placed **between** world and roles.
* Roles contain private objectives, constraints, and explicit win\_condition.
* Tone: age-appropriate; respect guards; no sensitive (restricted) content.

### 7.4 Step Planner (Global)

**Purpose:** Define short, universal steps any role follows.
**Inputs:** world, teacher\_objective, roles, standards.
**Outputs:** global\_steps.
**Rules/Acceptance:**

* 5–7 steps, each naming the mathematical behavior.
* Steps are tool-agnostic and runnable in ≤ time\_minutes.

### 7.5 Shared Data Maker

**Purpose:** Create the common variables and tables.
**Inputs:** global\_steps, roles, standards, spec.
**Outputs:** shared\_data.
**Rules/Acceptance:**

* Provide at least one **knob** to scale difficulty (e.g., “roundness”, “range”).
* No junk values; units consistent and declared; provide min/max and notes for randomness.
* Support multiple correct solution paths.

### 7.6 Role Expanders

**Purpose:** Personalize steps and data per role.
**Inputs:** roles, shared\_data, global\_steps.
**Outputs:** individuals\[].
**Rules/Acceptance:**

* Individualized steps must reference global steps where relevant.
* Private data is a **slice/annotation** of shared\_data; no contradictions.
* Each brief contains at least one asymmetric information element to encourage negotiation.

### 7.7 Merge

**Purpose:** Assemble all parts into the canonical schema.
**Inputs:** all previous outputs.
**Outputs:** final\_bundle (draft).
**Rules/Acceptance:**

* Enforce ordering and required fields.
* Normalize units, labels, and naming conventions.

### 7.8 Validators

**Purpose:** Gate quality.
**Inputs:** final\_bundle (draft).
**Outputs:** errors\[] (empty if pass).
**Checks:**

1. **Schema**: required fields, types, enums, ordering.
2. **Consistency**: references resolve; units align; numbers coherent; difficulty within grade band; time fit.
3. **Objective-fit**: artifacts/steps provide evidence for each StandardTarget’s evidence\_note.

### 7.9 Fixer

**Purpose:** Auto-repair small issues; escalate big ones.
**Inputs:** final\_bundle (draft), errors\[].
**Outputs:** patched fields and/or annotated errors\[].
**Rules/Acceptance:**

* Allowed repairs: minor renames, unit normalization, off-by-one numeric ranges, missing labels, typos.
* **Must not** alter world/roles/standards intent.
* If structural conflict remains, produce a single high-level “needs user input” message with suggested knobs (e.g., “reduce difficulty knob”, “swap dataset”).

---

## 8) Observability & QA

**Tracing & Telemetry**

* Every node emits start/end events with: node name, run id, thread id, wall time, token counts (if LLM), and latency.
* Capture **input keys** and **output keys** + payload sizes; redact secrets and PII.
* Store state checkpoints per run/thread; allow rewind and replay.

**Run Surfaces**

* Local streaming view showing node-by-node progress and patches.
* Hosted tracing workspace for searchable runs, diffs, errors, and durations.

**Quality Workflows**

* Golden seeds for each grade band/skill cluster.
* Snapshot tests for schema invariants and reference integrity.
* Human review queue for 10% of runs (random sampling) with a rubric (Realism, Clarity, Fit, Safety).

---

## 9) Performance, Reliability, Cost

* End-to-end P50 ≤ 120s; P90 ≤ 180s (default models and seeds).
* Node timeouts and retries with backoff; idempotent merges.
* Caching for repeated deterministic prompts.
* Cost budget per run logged; soft cap with warning, hard cap kills run gracefully with partial artifacts.

---

## 10) Security & Compliance

* No storage of raw student PII; seeds and outputs are generic.
* Redact secrets in logs; encrypted env for provider keys.
* Content safety guardrails: banned topic list respected by Objective Composer and Step Planner.
* Audit trail: immutable record of run inputs (hash), outputs (hash), and validator results.

---

## 11) Configuration & Flags

* **Model profile**: creative (for Objective Composer) vs. analytical (for Data/Validators).
* **Difficulty knob** exposed at Shared Data Maker.
* **Grade band policy**: restrict vocabulary and numerical ranges by band.
* **Fixer strictness**: permissive | conservative.
* **Tracing level**: minimal | standard | verbose.

---

## 12) Rollout Plan

**Phase 1 (Weeks 1–2):** Spec Builder, Standards Mapper, Merge, Schema Validator; observability baseline; golden seeds.
**Phase 2 (Weeks 3–4):** Objective Composer, Step Planner; consistency validator; first Fixer rules.
**Phase 3 (Weeks 5–6):** Shared Data Maker, Role Expanders; objective-fit validator; QA rubric; difficulty knobs.
**Phase 4 (Week 7):** Stabilization, latency/cost tuning, documentation, internal demo.

---

## 13) Acceptance Criteria (MVP)

* Given a valid Seed, the system returns a Final Bundle that:

  * Contains World → **Teacher Objective** → Roles in that order.
  * Includes ≥1 StandardTarget with evidence notes.
  * Provides 5–7 Global Steps with artifacts.
  * Provides Shared Data with at least one difficulty knob and explicit units.
  * Provides ≥3 IndividualBriefs with asymmetric information.
  * Passes all three validators with `errors=[]`.
  * Emits complete observability traces for every node.

---

## 14) Risks & Mitigations

* **Creative drift** in Objective Composer → Use guardrails, examples, and acceptance tests; fallback to stricter model profile.
* **Incoherent data** across nodes → Enforce that Role Expanders only slice/annotate shared data; add cross-reference checks.
* **Validator brittleness** → Keep validators pure, deterministic, and well-logged; add targeted unit tests.
* **Latency/cost spikes** → Caching, model tiering, and early-exit on validator hard fails.

---

## 15) Open Questions

1. Do we require multi-role parity (e.g., balance) or allow asymmetric difficulty by design?
2. How many roles per bundle do we target for MVP (3 fixed vs. N scalable)?
3. What’s the minimum artifact set teachers need for quick assessment (table only vs. table+reflection)?
4. Should Fixer be allowed to slightly rewrite objectives for clarity (currently: no)?

---

## 16) Deliverables

* Executable graph with nine nodes and validator–fixer loop.
* Canonical schema (v0.1) and documentation.
* Golden seed set and a reviewer rubric.
* Observability dashboard with searchable traces and downloadable Final Bundles.
