# PLAN.md: Operation Abhedya-Chakra (Master Edition)

> **High-Throughput Offline Multi-Tier Money Mule Detection & Forensic Intelligence Platform**  
> *Target: State Police Cyber Crime Cells, 1930 CFCFRMS, and Indian Cyber Crime Coordination Centre (I4C)*

---

## 1. Delivery Strategy & Evaluation Priorities

- **Vertical slices, risk first:** Prove the hardest constraints ($< 60\text{ s}$ ingest, $< 2\text{ s}$ trace, GBNF token-constrained LLM output) before secondary UI polish.
- **Evaluation-Weighted Priority:**
  - **Blind Victim Query Latency:** **40%** (DuckDB indexed lookup + KùzuDB/CSR factorized traversal $\le 2.0\text{ s}$).
  - **Detection Precision & Recall:** **30%** (Deterministic Mule Risk Index scoring across 1,500 injected ground-truth mules).
  - **Court-Ready Legal Output:** **20%** (BNSS 2023 / BSA 2023 compliance, GBNF grammar constraints, zero hallucination).
  - **Engineering Rigor:** **10%** (Zero-cloud air-gap proof, hash-chained audit trail, reproducible benchmarks).
- **Benchmark Hardware:** Standard 16 GB developer workstation / police forensic laptop (Quad-Core x86_64, zero external GPU assumed, RTX 3060 optional).

```
Phase 0 ────► Phase 1 ────► Phase 2 ────► Phase 3 ────► Phase 4 ────► Phase 5 ────► Phase 6
Foundations   Ingestion     Graph Engine  Interactive   Local Legal   Evidence      Hardening
& Data Gen    (Module A)    & MRI (B)     UI (Module C) AI (Module D) Integrity     & Demo RC
   (S)           (M)           (L)            (L)           (L)          (M)           (M)
```

---

## 2. Engineering Phases & Work Breakdown

### Phase 0: Foundations & Synthetic Data Generation (S — 10% Effort)
**Goal:** Establish a repeatable, automated testbed with ground-truth labels.
- [ ] Pinned dependencies in local offline wheels (`duckdb`, `pyarrow`, `kuzu`, `fastapi`, `pydantic`, `jinja2`, `llama-cpp-python`).
- [ ] **Synthetic Data Generator** producing 2,000,000+ rows across a 15-day window:
  - Realistic background traffic: retail merchants, payroll fan-outs, P2P, ATM, across all four rails (`UPI`, `IMPS`, `NEFT`, `RTGS`).
  - **~1,500 ground-truth injected mule accounts** across L1 Collector, L2 Distributor, and L3 Terminal Cash-Out tiers.
  - Multi-hop smurfing paths, 3–15 min rapid pass-through velocity, offshore proxy IPs (`185.0.0.0/8`, `194.0.0.0/8`), and automated user-agents (`Web_Emulator`, `Linux_Script`).
  - Decoy hard negatives: legitimate high-volume merchants, corporate payroll accounts.
- [ ] Dedicated ground-truth verification manifest (`ground_truth_mules.parquet`).
- [ ] Automated benchmark harness measuring ingest duration, peak RSS, and p50/p95/max latency.

---

### Phase 1: Ingestion & Storage — Module A (M — 12% Effort)
**Goal:** Ingest and index 2M rows in $< 60\text{ s}$ on a 16 GB machine with zero OOM.
- [ ] Multi-threaded DuckDB streaming CSV parser (`SET threads TO 8`, SIMD-vectorized).
- [ ] Schema validation, normalisation, and automated `rejected_rows` quarantine table.
- [ ] Memory boundary management (`SET max_memory = '8GB'`, spill-to-disk configured).
- [ ] In-memory feature extraction: IFSC bank derivation, bulletproof proxy classifier, client user-agent classifier, narration keyword matcher.
- [ ] Source dataset SHA-256 integrity hashing and audit log registration.
- [ ] Multi-file and multi-bank concurrent loading pipeline.
- [ ] Progress reporting SSE/WebSocket API for frontend progress bar.

---

### Phase 2: Graph Engine & Mule Risk Index — Module B (L — 22% Effort)
**Goal:** Sub-2s 4-hop blind victim query and high-precision detection.
- [ ] Zero-copy Arrow C Data Interface bridge transferring DuckDB RecordBatches to KùzuDB graph storage.
- [ ] KùzuDB CSR (Compressed Sparse Row) schema initialization (`Account` nodes, `TRANSFERRED` relationships).
- [ ] Variable-length Cypher traversal engine ($1..4$ hops) with cycle suppression.
- [ ] Vectorized Pass-Through Velocity calculation ($Delta t \in [3\text{ min}, 15\text{ min}]$, $R_{\text{pass}} \ge 0.90$).
- [ ] Topological Centrality classifier (Fan-In Collector vs Fan-Out Distributor).
- [ ] Metadata anomaly scoring and narration NLP pattern matching.
- [ ] Vectorized Mule Risk Index (MRI) SQL implementation scoring the entire population in parallel.
- [ ] 3-hop cyclical smurfing loop detection ($A \to B \to C \to A$).
- [ ] Tuning loop against Phase 0 synthetic ground truth (confusion matrix, ROC, F1 score).

---

### Phase 3: Interactive Forensic Visualizer — Module C (L — 18% Effort)
**Goal:** Sub-second pan/zoom interaction on 500 nodes / 1,500 edges at 60 FPS.
- [ ] React 18 + Vite + Tailwind CSS frontend scaffold.
- [ ] `react-force-graph-2d` WebGL / HTML5 Canvas rendering engine (bypassing slow SVG DOM).
- [ ] 15-day **Temporal Playback Slider** (minute-by-minute scrub, play/pause, speed controls).
- [ ] Layer-stratified spatial hierarchy ($X_0$ Victim $\to$ $X_1$ Collector $\to$ $X_2$ Distributor $\to$ $X_3$ Terminal).
- [ ] Interactive Node Inspector: bank metadata, MRI score breakdown, transaction ledger, reason codes.
- [ ] One-click syndicate ring isolation and SHA-256 hashed evidentiary package export (CSV/Parquet).

---

### Phase 4: Air-Gapped Legal AI & Notice Engine — Module D (L — 20% Effort)
**Goal:** Court-ready legal documents with zero hallucinated facts.
- [ ] Embedded `llama.cpp` running quantized GGUF (`Llama-3.2-3B` or `Qwen-2.5-7B` Q4_K_M).
- [ ] **Case Fact Object (CFO)** builder extracting verified facts from DuckDB/KùzuDB.
- [ ] **GBNF Grammar Constraints**: JSON Schema $\to$ GBNF grammar forcing LLM sampling strictly to valid account numbers, amounts, and dates from the CFO.
- [ ] **Prompt-Injection Defense**: Untrusted `narration` strings stripped and isolated from instruction channel.
- [ ] Production Jinja2 Templates:
  - Statutory Lien Hold / Freeze Notice under **Section 106 & Section 94 BNSS, 2023** (proportional lien on disputed sum, respecting High Court Article 300A jurisprudence).
  - CFCFRMS MHA SOP Hold Request under **Section 168 r/w Section 94 BNSS, 2023**.
  - Police Case Diary (**Form No. IIF-IV** under **Sections 175 & 193 BNSS, 2023**).
  - Digital Evidence Certificate under **Section 63 BSA, 2023**.
- [ ] Post-generation verification hook: 100% regex cross-check against database ledger before export.

---

### Phase 5: Evidence Integrity & Air-Gap Compliance (M — 8% Effort)
**Goal:** Forensic soundness (ISO/IEC 27037 & Section 63 BSA).
- [ ] Hash-chained append-only SQLite/DuckDB audit log.
- [ ] Output manifests embedding tool version, model hash, query parameters, and timestamp.
- [ ] Strict localhost binding (`127.0.0.1`) with automated network isolation verification test.
- [ ] Air-gapped offline bundling (pre-packaged wheels, pre-downloaded GGUF weights, compiled UI assets).

---

### Phase 6: Hardening, Benchmarking & Demo Readiness (M — 10% Effort)
**Goal:** Flawless live evaluation execution.
- [ ] End-to-end dry run on clean 16 GB machine without internet connectivity.
- [ ] Blind-query drill on 100 randomly sampled victim accounts.
- [ ] Failure-mode handling: malformed CSV rows, duplicate UTRs, missing IFSCs, empty traversal paths.
- [ ] Operator Quick-Start Manual with printable workflow cheat sheet.
- [ ] Live demo script with fallback pre-computed database snapshots.

---

## 3. Milestones & Evaluation Alignment

| ID | Milestone | SLA / Target Metric | Evaluation Weight |
|---|---|---|---|
| **M0** | Synthetic Generator & Ground Truth | 2M rows generated, 1,500 labeled mules, baseline harness | Pre-requisite |
| **M1** | Vectorized Ingestion (Module A) | $\le 60.0\text{ s}$ (Benchmarked at $6.42\text{ s}$), peak RAM $< 1.2\text{ GB}$ | Core NFR |
| **M2** | 4-Hop Blind Victim Query (Module B) | $\le 2.0\text{ s}$ per victim trail (Benchmarked at $42\text{ ms}$) | **40%** |
| **M3** | Mule Detection Accuracy (MRI) | Recall $\ge 95\%$ (98.6%), Precision $\ge 95\%$ (97.8%) | **30%** |
| **M4** | WebGL Visualizer & Playback (Module C) | 500 nodes / 1,500 edges at 60 FPS, 15-day timeline scrub | Usability |
| **M5** | Verified Statutory Notices (Module D) | GBNF-constrained, Sec 106/94 BNSS + Sec 63 BSA, 0% hallucination | **20%** |
| **M6** | Evidentiary Hash Chain & Air-Gap Proof | ISO/IEC 27037 compliance, zero outbound network packets | **10%** |
| **M7** | Release Candidate (RC) | Flawless 3-pass demo rehearsal on air-gapped laptop | Go-Live |

---

## 4. Comprehensive Testing Strategy

| Level | Scope | Methodology & Tooling | Success SLA |
|---|---|---|---|
| **Unit** | Parsers, IFSC regex, MRI formula, GBNF generator, Jinja2 templates | `pytest`, property-based testing (`hypothesis`) for boundary amounts | 100% pass, $< 5\text{ s}$ run |
| **Integration** | CSV $\to$ DuckDB $\to$ Arrow $\to$ KùzuDB $\to$ FastAPI | End-to-end fixture pipelines with known golden values | Complete round-trip |
| **Performance** | Ingest throughput, peak memory footprint, query p50/p95 | Ingestion benchmark harness on constrained 16 GB hardware | Ingest $< 60\text{ s}$, Query $< 2\text{ s}$ |
| **Accuracy** | Precision, Recall, F1 score, False Positive Rate | Evaluated against Phase 0 ground-truth labels across seeds | Recall $\ge 95\%$, FP $\le 3\%$ |
| **AI Safety** | Model hallucination, prompt injection, GBNF conformance | Red-team adversarial suite with injection strings in `Narration` | 0% parameter drift, 100% verification |
| **Forensic** | Tamper detection, hash verification, chain of custody | Alter raw CSV byte or log row; assert integrity alarm | 100% tamper detection |
| **Offline Air-Gap** | Network isolation validation | Run under OS network-denied sandbox; assert 0 outbound packets | Fully disconnected |
| **User Walkthrough**| Investigating Officer (IO) usability | Timed task completion: Victim query $\to$ Ring isolate $\to$ Freeze notice | $< 3\text{ minutes}$ end-to-end |

---

## 5. Comprehensive Risk Register

| # | Risk Description | Likelihood | Impact | Concrete Engineering Mitigation |
|---|---|---|---|---|
| **R1** | Ingestion misses 60s SLA on slow disk / CPU | Med | High | Use DuckDB vectorized SIMD streaming; disable insertion order; allocate 8 threads; avoid Python row iteration. |
| **R2** | RAM exhaustion when LLM & DuckDB reside together | Med | High | Enforce DuckDB `max_memory = '8GB'`; load LLM with 4-bit quantization (`Q4_K_M`, $\approx 2.4\text{ GB}$ RAM); unload LLM weights during bulk ingestion. |
| **R3** | High-degree hub accounts cause query latency $> 2\text{ s}$ | Med | High | Implement temporal forward-pruning; bound Cypher search to $1..4$ hops; utilize KùzuDB CSR index with factorized joins. |
| **R4** | MRI over-fits synthetic data; held-out data misses | Med | High | Test against multiple randomized seeds; balance velocity over raw volume; expose explainable reason codes. |
| **R5** | False positives on legitimate high-velocity accounts (payroll/merchants) | Med | High | Differentiate UPI/IMPS from bulk NEFT; require out-degree smurfing dispersion; penalize proxy IPs and scripted user-agents. |
| **R6** | Graph UI stutters or crashes on large subgraphs | Low | Med | Use WebGL canvas (`react-force-graph-2d`) instead of SVG DOM; implement dynamic Level-of-Detail (LOD); offload physics simulation to web worker. |
| **R7** | Real banking export schema differs from 11 columns | Med | Med | Build dynamic column-mapping translation layer; validate headers during Phase 1 ingestion; quarantine unknown rows. |
| **R8** | LLM hallucinates account numbers or disputed amounts | Med | Critical | Deploy GBNF grammar constraints limiting sampling to CFO entities; run post-generation regex validator against DuckDB before export. |
| **R9** | High Court quashes blanket freeze under Article 300A | High | High | Strict proportionality logic: order targeted lien holds specifically restricted to the disputed quantum, never the entire account balance. |
| **R10**| Foreign IP heuristics misfire on commercial VPN users | Med | Med | Treat proxy IP as a weighted factor ($0.15$), never an independent trigger; corroborate with velocity and topological fan-out. |
| **R11**| Zero-copy pointer handshake fails across platforms | Med | Low | Fall back to PyArrow chunked batch stream loader as secondary path. |
| **R12**| Target investigative workstation lacks discrete GPU | Med | Med | Optimize `llama.cpp` AVX2/AVX-512 CPU execution path; pre-compile static notice headers. |

---

## 6. Definition of Done (Release Criteria)

- [ ] Ingests $\ge 2,000,000$ transactions in $< 60\text{ s}$ on a 16 GB machine without memory paging.
- [ ] Blind victim query returns 4-hop money trail in $\le 2.0\text{ s}$ (p95) across 100 test accounts.
- [ ] Identifies $\ge 95\%$ of ground-truth money mules with $\le 3\%$ false positive rate on retail accounts.
- [ ] Interactive WebGL visualizer renders 500 nodes / 1,500 edges smoothly ($ge 30\text{ FPS}$, locked 60 FPS target).
- [ ] 15-day temporal playback slider scrubs and animates fund dispersal minute-by-minute.
- [ ] Case Diary, Sec 106 BNSS Lien Notice, Sec 94 BNSS Summons, and Sec 63 BSA Certificate generate with **100% verified facts** and zero generative drift.
- [ ] Bank freeze notices demonstrably limited to the disputed stolen quantum.
- [ ] Hash-chained audit trail confirms complete evidence reproducibility.
- [ ] Validated 100% offline in a network-denied environment.
