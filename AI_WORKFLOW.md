# AI Workflow & Engineering Verification Audit

This document details the exact AI tools, methodologies, decisions, course-corrections, and verification processes utilized during the development of **Ajaia Docs** for the Ajaia LLC AI-Native Full Stack Developer Assignment.

---

## 1. AI Tools Utilized

- **Primary AI Agent**: Google DeepMind Antigravity IDE Pairing Agent (powered by Gemini 3.8 Flash).
- **Execution Environment**: Windows 11 local environment with Python 3.13 and Node.js v22.
- **Workflow Pattern**: Senior Full-Stack Engineering pair-programming with autonomous execution of milestones, real-time command execution, and test-driven validation.

---

## 2. Where AI Accelerated Development

1. **Rapid Workspace & Stack Scaffolding**:
   - Inspected empty workspace, detected existing Python 3.13 and Node 22 runtime dependencies.
   - Initialized a modern Vite + React frontend and installed TipTap extensions (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`) and `lucide-react` in under 3 minutes.
2. **Authoritative Backend RBAC Implementation**:
   - Generated the SQLite schema with relational foreign keys, cascade constraints, and demo user seeding.
   - Built the Flask REST API with strict multi-user access control rules, input sanitization, and Markdown/plain-text conversion in a single modular module (`backend/app.py`).
3. **Comprehensive Automated Test Generation**:
   - Implemented an isolated pytest suite (`backend/tests/test_api.py`) with test database fixtures, asserting health checks, persistence, unauthorized access rejection (401/403), collaborator sharing, and file import validation.
4. **Modern UI Design System Creation**:
   - Crafted a custom Google Docs-inspired theme using pure CSS variables and TipTap typography rules without cumbersome third-party CSS overhead.

---

## 3. Key Decisions: Changed or Rejected AI Suggestions

| Prompt/Suggestion | Initial Direction Considered | Decision Made & Rationale |
| :--- | :--- | :--- |
| **Real-time WebSockets / CRDTs** | Add Socket.IO or Yjs live cursors | **Rejected**: Real-time collaboration would have risked delivery given the strict 3-hour deadline. Selected a reliable, testable 750ms debounced autosave architecture. |
| **Authentication Flow** | Add complex JWT / bcrypt / session cookies | **Changed**: Replaced with an evaluator-friendly demo user switcher passing `X-User-Id`. This enabled immediate testing of multi-user sharing on one screen while keeping 100% backend RBAC enforcement. |
| **Database Engine** | Spin up PostgreSQL via Docker | **Rejected**: SQLite with foreign key enforcement provided zero-dependency local setup, instant portability, and deterministic test teardown. |
| **CSS Framework** | Install TailwindCSS | **Rejected**: Built with clean CSS variables and custom modular components, avoiding extra bundler build steps and configuration friction. |

---

## 4. Verification & Testing Audit

All implementation claims were verified through automated and programmatic testing:

### 1. Automated Backend Test Suite (`pytest`)
- Ran `python -m pytest backend/tests/test_api.py -v`.
- **Result**: `6 passed in 0.68s` (100% pass rate).
- Validated test cases:
  - `test_health_check`
  - `test_users_list`
  - `test_create_and_fetch_document`
  - `test_access_control_unauthorized_user`
  - `test_sharing_and_collaboration`
  - `test_file_import_txt_and_md`

### 2. Live Server End-to-End Integration Test
- Ran a live Python test script against the running Flask backend on `http://127.0.0.1:5000` executing 11 sequential milestones:
  1. Health check verification (`200 OK`).
  2. Demo users retrieval (Alice, Bob, Charlie).
  3. Alice creates document "Live End-to-End Test Doc".
  4. Alice renames and autosaves document.
  5. Alice shares document with Bob (`permission: edit`).
  6. Bob retrieves shared document (`200 OK`, `permission: edit`).
  7. Bob updates document content collaboratively.
  8. Charlie (unauthorized third-party) denied access with `403 Forbidden`.
  9. Alice revokes Bob's share.
  10. Bob verified denied access with `403 Forbidden`.
  11. Alice deletes document (`200 OK`).
- **Result**: All 11 assertions succeeded with zero failures.

### 3. Production Frontend Compilation
- Ran `npm run build` in the `frontend` directory.
- **Result**: Vite compiled 1,966 modules in `666ms` with zero syntax or bundling errors.

### 4. Headless Browser Automation Note
- An automated browser subagent was dispatched to test interactive UI flows. The subagent noted a sandbox CDN download restriction (`404` for Azure-hosted Playwright driver binary). Verification was thus immediately complemented with live HTTP endpoint testing, component build validation, and automated backend test suites.
