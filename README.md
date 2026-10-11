# Ajaia Docs — Collaborative Document Editor

## Live Demo

**Live Application:** [Ajaia Docs](https://ajaia-docs-qwnj.onrender.com/)

**API Health Check:** [Check API Status](https://ajaia-docs-qwnj.onrender.com/api/health)

Ajaia Docs is a document management application with rich-text editing, autosave, document sharing, and permission-based access.

> **AI-Native Full Stack Developer Assignment** for **Ajaia LLC**  
> A polished, lightweight collaborative document editor inspired by Google Docs, built with React, TipTap, Python Flask, and SQLite.

---

## 🌟 Key Features

1. **Document Management**
   - Create, rename, edit, autosave, and delete documents.
   - Preserves rich-text formatting across browser sessions and refreshes.
   - Visible autosave indicator: *Saved to cloud*, *Saving...*, and *Save failed*.
   - Responsive loading, empty, and error feedback states.

2. **Rich-Text Editor**
   - Clean, focused writing canvas with standard paper dimensions and readable typography.
   - Comprehensive toolbar controls:
     - Headings (H1, H2, H3, Paragraph)
     - Styling (Bold, Italic, Underline, Strikethrough, Inline Code)
     - Lists (Bullet lists, Numbered lists)
     - Blockquotes and horizontal dividers
     - Undo and Redo

3. **File Import**
   - Drag-and-drop or file picker import for `.md` (Markdown) and `.txt` (Plain text) files.
   - Automatic conversion into structured, editable rich-text documents.
   - Strict client and server-side file extension and size validation (max 2MB).
   - Sample files included in `/samples/`.

4. **Multi-User Collaboration & Access Control**
   - Seeded demo users with single-click user switching in the sidebar.
   - Role-Based Access Control (**Owner**, **Editor**, **Viewer**) strictly enforced on the Flask backend.
   - Document sharing modal allowing owners to grant edit or read-only permissions and revoke access at any time.
   - Clear distinction between **My Documents** and **Shared with Me** in the workspace.
   - Backend verification ensures unauthorized users receive `403 Forbidden` for read, write, rename, share, or delete operations.

5. **Production Persistence & Automated Quality**
   - Persistent SQLite database with foreign keys and cascade rules.
   - Fully automated pytest suite covering persistence, RBAC permissions, and file imports.
   - `/api/health` system monitoring endpoint.

---

## 👥 Demo Accounts

The database comes pre-seeded with three demo accounts. You can switch between them at any time using the user profile menu at the bottom-left of the sidebar:

| Name | User ID | Email | Avatar Color |
| :--- | :--- | :--- | :--- |
| **Alice Morgan** (Default) | `user_alice` | `alice@ajaia.com` | `#6366f1` (Indigo) |
| **Bob Chen** | `user_bob` | `bob@ajaia.com` | `#0d9488` (Teal) |
| **Charlie Davis** | `user_charlie` | `charlie@ajaia.com` | `#ea580c` (Orange) |

*By default, a welcome guide document is seeded for Alice and shared with Bob.*

---

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.10 or higher (v3.13 tested)
- **pip** and **npm**

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Workspace Setup
```bash
git clone <repository-url>
cd "Ajaia LLC"
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The backend API will start on **`http://localhost:5000`**.*

### 3. Frontend Setup (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will start on **`http://localhost:5173`**.*

Open **`http://localhost:5173`** in your browser to start writing!

---

## 📦 Single-Port Production Mode (Flask + Built Frontend)

You can also run both the frontend and backend together from a single port without Vite:

```bash
# 1. Build the React frontend
cd frontend
npm run build

# 2. Run the Flask backend
cd ../backend
python app.py
```
Open **`http://localhost:5000`** to access the application.

---

## 🧪 Automated Testing

Run the automated backend test suite using `pytest`:

```bash
python -m pytest backend/tests/test_api.py -v
```

### What is tested:
- `test_health_check`: Validates `/api/health` monitoring status.
- `test_users_list`: Confirms all seeded demo accounts are available.
- `test_create_and_fetch_document`: Tests document creation, persistence, and unauthenticated rejection (`401`).
- `test_access_control_unauthorized_user`: Verifies unshared users receive `403 Forbidden` for read, write, and delete attempts.
- `test_sharing_and_collaboration`: Validates owner sharing, collaborator editing, role validation, and share revocation.
- `test_file_import_txt_and_md`: Verifies Markdown parsing, plain text paragraph splitting, and extension whitelist enforcement (`.exe`, `.pdf` rejection).

---

## ⚙️ Environment Variables

The backend supports the following optional environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Flask backend to listen on. |
| `DATABASE_PATH` | `backend/ajaia_docs.db` | Path to the SQLite database file. |

---

## 📂 Supported Import Formats

| Format | Extension | Max Size | Conversion Details |
| :--- | :--- | :--- | :--- |
| **Markdown** | `.md` | 2 MB | Parsed into HTML headers, bold/italic, lists, blockquotes, and code blocks. |
| **Plain Text** | `.txt` | 2 MB | Sanitized, HTML-escaped, with double linebreaks converted to `<p>` paragraphs. |

*Sample files to test are available in the [`samples/`](file:///d:/Ajaia%20LLC/samples) directory.*

---

## 🚢 Deployment Instructions

### Live Production Deployment
- **Live URL**: [https://ajaia-docs-qwnj.onrender.com](https://ajaia-docs-qwnj.onrender.com)
- **API Health**: [https://ajaia-docs-qwnj.onrender.com/api/health](https://ajaia-docs-qwnj.onrender.com/api/health)

### Render Configuration
1. **Build Command**:
   ```bash
   cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
   ```
2. **Start Command**:
   ```bash
   gunicorn --bind 0.0.0.0:$PORT backend.app:app
   ```
   *(or `python backend/app.py`)*
3. **Environment Variables**:
   - `PORT=10000` (assigned automatically by Render)
   - `FLASK_DEBUG=0` (disables debug mode and auto-reloader in production)

> [!NOTE]
> **Data Persistence on Render Free Tier:**  
> Render Free web services operate on ephemeral container disks. SQLite changes persist throughout active usage and across browser sessions while the container is running. However, container redeploys or spin-downs reset the local SQLite file unless backed by a paid Render Persistent Disk or migrated to a managed cloud database (e.g., Neon / Supabase PostgreSQL).

### Option 2: Docker Container
```dockerfile
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 5000
CMD ["python", "backend/app.py"]
```
Run with:
```bash
docker build -t ajaia-docs .
docker run -p 5000:5000 ajaia-docs
```

---

## 📁 Project Structure

```
Ajaia LLC/
├── backend/
│   ├── app.py                # Flask application, REST endpoints, RBAC, DB logic
│   ├── ajaia_docs.db         # SQLite persistent database (auto-created)
│   ├── requirements.txt      # Python dependencies (Flask, Flask-Cors, markdown, pytest)
│   └── tests/
│       └── test_api.py       # Automated unit and integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditorCanvas.jsx   # Centered document sheet with TipTap editor
│   │   │   ├── EditorToolbar.jsx  # Formatting controls (H1-H3, Bold, Lists, etc.)
│   │   │   ├── TopBar.jsx         # Title input, autosave status, export & share buttons
│   │   │   ├── Sidebar.jsx        # Navigation, My Docs vs Shared, user switcher
│   │   │   ├── ShareModal.jsx     # Collaborator management & permission controls
│   │   │   └── ImportModal.jsx    # File upload (.md, .txt) with validation
│   │   ├── api.js                 # API client wrapper
│   │   ├── App.jsx                # Main application coordinator
│   │   └── index.css              # Design tokens and TipTap styling
│   ├── package.json
│   └── vite.config.js
├── samples/
│   ├── sample_roadmap.md          # Sample Markdown file for import testing
│   └── sample_meeting_notes.txt   # Sample Plain text file for import testing
├── README.md                      # Documentation & setup guide
├── ARCHITECTURE.md                # System design, data model, & tradeoffs
├── AI_WORKFLOW.md                 # AI tooling & verification audit
├── SUBMISSION.md                  # Project submission summary
└── VIDEO_LINK.txt                 # Video walkthrough link placeholder
```
