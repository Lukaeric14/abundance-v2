
# Purpose and product shape

Phase 1 delivers a Lovable-style generation experience that feels alive and reliable. The user seeds a project through the existing chat, then watches short status lines (“thoughts”) while the system produces three artifacts in sequence: Narrative & Roles, Steps, and Data. We will run a real LangGraph orchestrator from day one, but we will ship and test each node independently so we can validate the UX and the contracts before enabling the next node. The frontend remains simple: a thought bubble, phase status pills, and three panes that render the streamed artifacts as they arrive.

# Orchestrator and state

We will compile a LangGraph app with a single state that lives across nodes and runs. The state holds the project identifier, the user seed collected from chat, a mode flag, the current bundle under construction, lightweight thought messages, and a thread identifier for the checkpointer. The graph initially includes the Narrative & Roles node, followed by the Steps node, then the Data node. Each node reads from state, produces one artifact, and appends short, human-readable status lines. From day one we support two operational controls: “stop after <node>” and “start from <node>,” so we can test a single node in isolation and re-enter the graph for targeted reruns without touching the frontend.

# Streaming and user experience

Communication to the UI happens over a single server-sent stream that carries status updates and artifacts in order. The stream emits a small set of well-defined events: phase transitions for the three phases, short thought messages suitable for the light-bulb bubble, one artifact per node, an error if something cannot be recovered, and a completion signal when the run ends. Events include a simple version tag and monotonically increasing identifiers so the client can resume after a drop. Streams should begin quickly; the first thought should appear within a couple of seconds of the user pressing “Generate.” Thoughts are status-only and never include chain-of-thought, prompts, secrets, or personal data.

# Narrative & Roles (ObjectiveOverview)

The first node produces the project’s world and constraints, the teacher objective, and a small set of student roles with clear objectives. This artifact powers the ObjectiveOverview pane and serves as the foundation for later nodes. We will initially run only this node by default so we can validate thought streaming, schema strictness, and the renderer. The node should emit a couple of concise thoughts (“Drafting the scenario…”, “Aligning role objectives…”) and a single artifact when done. Basic quality checks apply here: role identifiers must be unique, objectives must be meaningful, and the world’s duration constraint must be within a reasonable classroom window.

# Steps (behind a flag until ready)

The second node plans the classroom flow. It generates a finite list of steps with who is involved, minutes per step, and student-facing instructions. The total time must not exceed the duration established in the Narrative; the node may self-correct once before failing. When the Steps flag is off, Phase 1 ends after Narrative so the team can test in isolation. When the flag is on, the node streams its own thoughts and emits a single steps artifact, which the existing timeline component renders. Each role should participate in at least one step to ensure engagement across seats.

# Data (behind a flag until ready)

The third node produces the shared tables and values the class will use (for example, costs, constraints, or reference figures). Each table carries a title, column names, rows, and explicit units for numeric columns. Where steps reference data, those references must resolve. As with Steps, the Data node remains disabled until we are ready to exercise the full path. When enabled, it streams brief thoughts and emits one data artifact; the tables panel renders them and offers CSV export per table.

# Validation, retries, and failure behavior

Every node must satisfy a strict contract. We validate shape, required fields, and simple invariants (time budget, units present, references resolvable) before emitting the artifact. If validation fails, the node performs one automatic retry informed by the validator’s error and then stops with a clear error event. Errors do not crash the app; the run ends cleanly and the UI presents a retry affordance. All retries, timings, and token counts are recorded with the run for later inspection.

# Persistence, observability, and inspectability

Each generation creates a run record that links the project identifier, the orchestrator thread, status, start and end times, and per-node timings. We also persist the final artifacts of each completed node so we can inspect and compare. For Phase 1, in-memory checkpointing is acceptable; we still persist enough metadata to correlate a stream to a run and resume if needed. A simple run inspection endpoint should return the latest known status, the last node executed, and the most recent events for debugging during development.

# Feature flags and rollout plan

We will ship in three steps without changing the UI: first enable Narrative only; then enable Steps; then enable Data. Two feature flags control this behavior and allow product to toggle nodes on a per-environment basis. The same flags drive the phase pills so the UI can display disabled phases when a node is not active. This approach lets us test the thought streaming, artifact rendering, and recovery paths incrementally while keeping the orchestrator and contracts stable.

# Definition of done for Phase 1

A user can seed a project through chat, trigger generation, and see status thoughts within two seconds. The system streams a valid Narrative & Roles artifact and, when the corresponding flags are enabled, valid Steps and Data artifacts. The stream completes cleanly, artifacts render in their panes, and the run is inspectable by its identifier. Validation, retry, and error behaviors are consistent across nodes. No sensitive content is ever exposed in the stream. When all three nodes are enabled, the full path completes within a few minutes under normal conditions.

This gives both the developer and the LLM a clear target: one orchestrator, three discrete nodes, streaming that feels intentional, and strict contracts so later quality work can snap in without revisiting the frontend.
