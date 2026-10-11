# Ajaia Docs — Internship Assignment Submission

**Candidate**: Senior Full-Stack Engineer / AI-Native Developer  
**Organization**: Ajaia LLC  
**Assignment**: "AI-Native Full Stack Developer Assignment"  
**Submission Date**: October 11, 2026  

---

## 1. Exact Deliverables Summary

| Deliverable | Location | Status |
| :--- | :--- | :--- |
| **Complete Source Code** | `backend/`, `frontend/`, `samples/` | ✅ Complete & Verified |
| **README.md** | [README.md](file:///d:/Ajaia%20LLC/README.md) | ✅ Complete |
| **ARCHITECTURE.md** | [ARCHITECTURE.md](file:///d:/Ajaia%20LLC/ARCHITECTURE.md) | ✅ Complete |
| **AI_WORKFLOW.md** | [AI_WORKFLOW.md](file:///d:/Ajaia%20LLC/AI_WORKFLOW.md) | ✅ Complete |
| **SUBMISSION.md** | [SUBMISSION.md](file:///d:/Ajaia%20LLC/SUBMISSION.md) | ✅ Complete |
| **VIDEO_LINK.txt** | [VIDEO_LINK.txt](file:///d:/Ajaia%20LLC/VIDEO_LINK.txt) | ✅ Placeholder Ready |
| **Automated Test Suite** | [backend/tests/test_api.py](file:///d:/Ajaia%20LLC/backend/tests/test_api.py) | ✅ 6/6 Tests Passing |
| **Sample Test Files** | `samples/sample_roadmap.md`, `samples/sample_meeting_notes.txt` | ✅ Complete |

---

## 2. Live & Local Application Access

- **Public Production Deployment URL**: [https://ajaia-docs-qwnj.onrender.com](https://ajaia-docs-qwnj.onrender.com)
- **Public API Health Check**: [https://ajaia-docs-qwnj.onrender.com/api/health](https://ajaia-docs-qwnj.onrender.com/api/health)
- **GitHub Repository**: [https://github.com/faizankhatib-ctrl/ajaia-docs](https://github.com/faizankhatib-ctrl/ajaia-docs)
- **Local Single-Port Production URL**: `http://localhost:5000` (Flask serving backend + built frontend)
- **Local Development URL**: `http://localhost:5173` (Vite dev server)

> [!NOTE]
> **Hosting & Storage Persistence Disclosure:**
> The current production deployment is hosted on Render's Free tier using SQLite. While all document edits, autosave, permissions, and file imports persist across user sessions and browser reloads during active container operation, Render Free tier instances use an **ephemeral disk**. Data does not persist across container redeployments or cold spin-downs unless backed by a persistent Render Disk or migrated to managed cloud PostgreSQL.

---

## 3. Demo Credentials

The platform includes three pre-seeded demo users. Switch between them instantly using the user profile menu at the bottom-left of the sidebar:

1. **Alice Morgan** (Default Owner)
   - User ID: `user_alice`
   - Email: `alice@ajaia.com`
   - Avatar: Indigo (`#6366f1`)
2. **Bob Chen** (Collaborator)
   - User ID: `user_bob`
   - Email: `bob@ajaia.com`
   - Avatar: Teal (`#0d9488`)
3. **Charlie Davis** (Third Party / Unshared User)
   - User ID: `user_charlie`
   - Email: `charlie@ajaia.com`
   - Avatar: Orange (`#ea580c`)

---

## 4. Working Features Matrix

| Feature Area | Implemented Capabilities | Verification Status |
| :--- | :--- | :--- |
| **Document Management** | Create, rename inline, edit, delete, reopen, formatting persistence after page reload. | ✅ Verified |
| **Autosave Engine** | 750ms debounced autosave with real-time UI indicator (*Saved to cloud*, *Saving...*, *Save failed*). | ✅ Verified |
| **Rich-Text Editor** | TipTap engine with Bold, Italic, Underline, Strikethrough, Code, Headings (H1/H2/H3), Bullet/Numbered Lists, Blockquote, Divider, Undo/Redo. | ✅ Verified |
| **File Import** | Drag-and-drop & file picker for `.md` and `.txt`. Validates file size (max 2MB) and extensions. Converts to rich-text HTML document. | ✅ Verified |
| **Access Control (RBAC)** | Owner, Editor, Viewer roles. Enforced strictly on backend. Unshared users receive 403 Forbidden on read/write/rename/share/delete. | ✅ Verified |
| **Sharing Modal** | Document owner can grant edit or view permission to other demo users, see existing collaborators, and revoke access. | ✅ Verified |
| **User Switching** | Single-click switching between demo accounts in sidebar with automatic workspace reloading. | ✅ Verified |
| **My Docs vs Shared** | Sidebar clearly separates owned documents from documents shared by teammates. | ✅ Verified |
| **Export** | Instant HTML download of the active document. | ✅ Verified |
| **Persistence** | SQLite persistent database with relational foreign keys and cascading deletes. | ✅ Verified |
| **Quality & Tests** | Automated pytest suite (6 tests covering persistence, RBAC, sharing, and import validation). | ✅ Verified (100% Pass) |
| **Health Check** | `/api/health` JSON status endpoint for uptime checks. | ✅ Verified |

---

## 5. Incomplete Features & Deliberate Scope Exclusions

In accordance with execution rules prioritizing working, robust deliverables within the 3-hour deadline:
1. **Real-Time WebSockets / Live Multiple Cursors**:
   - Deliberately excluded to eliminate merge-conflict and operational risks within the deadline. Implemented robust debounced autosave instead.
2. **Inline Comments & Document Version History**:
   - Stated as future extensions in `ARCHITECTURE.md`.
3. **Production OAuth / JWT Auth**:
   - Simulated via transparent user switcher with `X-User-Id` header so evaluators can test multi-user sharing without signing up or managing passwords.

---

## 6. Next Steps for Production Readiness

1. **Deploy to Render / Railway / Fly.io** with a mounted persistent volume for the SQLite database.
2. **Add Yjs / WebSockets** for live multi-user cursor presence.
3. **Upgrade Auth** to Supabase Auth or Auth0 with JWT verification middleware.
