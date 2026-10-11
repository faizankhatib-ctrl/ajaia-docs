import os
import sqlite3
import uuid
import datetime
import html
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
import markdown

DATABASE_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "ajaia_docs.db"))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, expose_headers=["Content-Type", "X-User-Id"])

# Max upload size: 2MB
MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024
ALLOWED_EXTENSIONS = {".txt", ".md"}


def get_db(db_path=None):
    target_path = db_path or DATABASE_PATH
    if "db" not in g or getattr(g, "db_path", None) != target_path:
        conn = sqlite3.connect(target_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = conn
        g.db_path = target_path
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(db_path=None):
    """Initializes tables and seeds demo users."""
    target_path = db_path or DATABASE_PATH
    conn = sqlite3.connect(target_path)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            avatar_color TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_shares (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            permission TEXT NOT NULL DEFAULT 'edit',
            created_at TEXT NOT NULL,
            UNIQUE(document_id, user_id),
            FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Seed demo users if not present
    seed_users = [
        ("user_alice", "Alice Morgan", "alice@ajaia.com", "#6366f1"),
        ("user_bob", "Bob Chen", "bob@ajaia.com", "#0d9488"),
        ("user_charlie", "Charlie Davis", "charlie@ajaia.com", "#ea580c")
    ]
    for uid, name, email, color in seed_users:
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, name, email, avatar_color)
            VALUES (?, ?, ?, ?)
        """, (uid, name, email, color))

    # Seed welcome sample document if database is brand new
    cursor.execute("SELECT COUNT(*) as cnt FROM documents")
    count = cursor.fetchone()[0]
    if count == 0:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        welcome_doc_id = str(uuid.uuid4())
        welcome_title = "Welcome to Ajaia Docs"
        welcome_content = """<h2>Welcome to Ajaia Docs! 🚀</h2>
<p>This is a modern, lightweight collaborative document editor built for speed and clarity.</p>
<p><strong>Key Features:</strong></p>
<ul>
<li><strong>Rich Text Formatting:</strong> Headings, bold, italic, underline, lists, and more.</li>
<li><strong>Autosave:</strong> Every keystroke is safely persisted with status indicators.</li>
<li><strong>Instant Sharing:</strong> Share documents seamlessly between demo accounts with full backend permission enforcement.</li>
<li><strong>File Import:</strong> Import existing <code>.md</code> and <code>.txt</code> documents instantly.</li>
</ul>
<p>Switch users in the top bar to explore document ownership and collaborative permissions.</p>"""
        cursor.execute("""
            INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (welcome_doc_id, welcome_title, welcome_content, "user_alice", now, now))

        # Share with Bob by default so Bob sees a document in 'Shared with Me' right away!
        share_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO document_shares (id, document_id, user_id, permission, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (share_id, welcome_doc_id, "user_bob", "edit", now))

    conn.commit()
    conn.close()


def get_current_user_id():
    """Extracts user ID from request headers or query params."""
    user_id = request.headers.get("X-User-Id") or request.args.get("user_id")
    if not user_id:
        return None
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    return row["id"] if row else None


def get_document_permission(doc_id, user_id, db):
    """
    Returns permission level: 'owner', 'edit', 'view', or None.
    Also returns the document row.
    """
    cursor = db.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()
    if not doc:
        return None, None

    if doc["owner_id"] == user_id:
        return "owner", doc

    cursor.execute("SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?", (doc_id, user_id))
    share = cursor.fetchone()
    if share:
        return share["permission"], doc

    return None, doc


# ================= ROUTES =================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Ajaia Docs API",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200


@app.route("/api/users", methods=["GET"])
def list_users():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, name, email, avatar_color FROM users ORDER BY name")
    users = [dict(row) for row in cursor.fetchall()]
    return jsonify({"users": users}), 200


@app.route("/api/documents", methods=["GET"])
def get_documents():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    cursor = db.cursor()

    # Owned documents
    cursor.execute("""
        SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
               u.name as owner_name, u.email as owner_email,
               (SELECT COUNT(*) FROM document_shares WHERE document_id = d.id) as shared_count
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE d.owner_id = ?
        ORDER BY d.updated_at DESC
    """, (user_id,))
    my_docs = [dict(row) for row in cursor.fetchall()]

    # Shared with me documents
    cursor.execute("""
        SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
               u.name as owner_name, u.email as owner_email,
               ds.permission, ds.created_at as shared_at
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        JOIN document_shares ds ON d.id = ds.document_id
        WHERE ds.user_id = ?
        ORDER BY d.updated_at DESC
    """, (user_id,))
    shared_docs = [dict(row) for row in cursor.fetchall()]

    return jsonify({
        "my_documents": my_docs,
        "shared_with_me": shared_docs
    }), 200


@app.route("/api/documents", methods=["POST"])
def create_document():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "Untitled Document").strip()
    content = data.get("content", "<p></p>")

    if not title:
        title = "Untitled Document"

    doc_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (doc_id, title, content, user_id, now, now))
    db.commit()

    return jsonify({
        "id": doc_id,
        "title": title,
        "content": content,
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
        "permission": "owner"
    }), 201


@app.route("/api/documents/<doc_id>", methods=["GET"])
def get_document(doc_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    permission, doc = get_document_permission(doc_id, user_id, db)

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    if not permission:
        return jsonify({"error": "Access denied. You do not have permission to view this document."}), 403

    # Fetch owner info
    cursor = db.cursor()
    cursor.execute("SELECT id, name, email FROM users WHERE id = ?", (doc["owner_id"],))
    owner = dict(cursor.fetchone())

    # Fetch sharing list if user is owner or collaborator
    cursor.execute("""
        SELECT ds.user_id, ds.permission, ds.created_at, u.name, u.email
        FROM document_shares ds
        JOIN users u ON ds.user_id = u.id
        WHERE ds.document_id = ?
    """, (doc_id,))
    shares = [dict(row) for row in cursor.fetchall()]

    doc_dict = dict(doc)
    doc_dict["owner"] = owner
    doc_dict["permission"] = permission
    doc_dict["shares"] = shares

    return jsonify(doc_dict), 200


@app.route("/api/documents/<doc_id>", methods=["PUT"])
def update_document(doc_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    permission, doc = get_document_permission(doc_id, user_id, db)

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    if permission not in ["owner", "edit"]:
        return jsonify({"error": "Forbidden. You do not have edit permission for this document."}), 403

    data = request.get_json(silent=True) or {}
    new_title = data.get("title")
    new_content = data.get("content")

    # If title is provided, ensure it's not completely blank
    updated_title = doc["title"]
    if new_title is not None:
        stripped = str(new_title).strip()
        if stripped:
            updated_title = stripped

    updated_content = doc["content"] if new_content is None else str(new_content)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    cursor = db.cursor()
    cursor.execute("""
        UPDATE documents
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ?
    """, (updated_title, updated_content, now, doc_id))
    db.commit()

    return jsonify({
        "id": doc_id,
        "title": updated_title,
        "content": updated_content,
        "updated_at": now,
        "permission": permission
    }), 200


@app.route("/api/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    if doc["owner_id"] != user_id:
        return jsonify({"error": "Forbidden. Only the document owner can delete this document."}), 403

    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    db.commit()

    return jsonify({"message": "Document deleted successfully", "id": doc_id}), 200


@app.route("/api/documents/<doc_id>/share", methods=["POST"])
def share_document(doc_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    # Enforce owner-only sharing rule
    if doc["owner_id"] != user_id:
        return jsonify({"error": "Forbidden. Only the document owner can manage sharing permissions."}), 403

    data = request.get_json(silent=True) or {}
    target_user_id = data.get("user_id")
    permission = data.get("permission", "edit")

    if not target_user_id:
        return jsonify({"error": "Missing user_id to share with."}), 400

    if target_user_id == user_id:
        return jsonify({"error": "Cannot share document with yourself (you are the owner)."}), 400

    if permission not in ["edit", "view"]:
        return jsonify({"error": "Invalid permission level. Must be 'edit' or 'view'."}), 400

    # Ensure target user exists
    cursor.execute("SELECT id, name, email FROM users WHERE id = ?", (target_user_id,))
    target_user = cursor.fetchone()
    if not target_user:
        return jsonify({"error": "Target user not found."}), 404

    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    share_id = str(uuid.uuid4())

    cursor.execute("""
        INSERT INTO document_shares (id, document_id, user_id, permission, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission
    """, (share_id, doc_id, target_user_id, permission, now))
    db.commit()

    return jsonify({
        "message": "Document shared successfully",
        "document_id": doc_id,
        "shared_with": dict(target_user),
        "permission": permission
    }), 200


@app.route("/api/documents/<doc_id>/share/<target_user_id>", methods=["DELETE"])
def revoke_share(doc_id, target_user_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()

    if not doc:
        return jsonify({"error": "Document not found"}), 404

    if doc["owner_id"] != user_id:
        return jsonify({"error": "Forbidden. Only owner can revoke document access."}), 403

    cursor.execute("DELETE FROM document_shares WHERE document_id = ? AND user_id = ?", (doc_id, target_user_id))
    db.commit()

    return jsonify({"message": "Access revoked successfully", "user_id": target_user_id}), 200


@app.route("/api/documents/import", methods=["POST"])
def import_document():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Unauthorized. Missing or invalid X-User-Id header."}), 401

    # Check for file in multipart form or json
    file_content = None
    filename = "Imported Document"

    if "file" in request.files:
        uploaded_file = request.files["file"]
        if not uploaded_file or uploaded_file.filename == "":
            return jsonify({"error": "No file selected for upload."}), 400

        filename = uploaded_file.filename
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": f"Unsupported file extension '{ext}'. Only .txt and .md files are allowed."
            }), 400

        raw_bytes = uploaded_file.read()
        if len(raw_bytes) > MAX_IMPORT_SIZE_BYTES:
            return jsonify({"error": f"File exceeds maximum allowed size of 2MB."}), 400

        try:
            file_content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                file_content = raw_bytes.decode("latin-1")
            except Exception:
                return jsonify({"error": "File encoding not supported. Please use UTF-8 plain text."}), 400
    else:
        # Check JSON fallback
        data = request.get_json(silent=True) or {}
        raw_text = data.get("text")
        filename = data.get("filename", "Imported Document.txt")
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({
                "error": f"Unsupported file type. Only .txt and .md files are supported."
            }), 400

        if raw_text is None:
            return jsonify({"error": "No file or text payload provided."}), 400

        if len(raw_text.encode("utf-8")) > MAX_IMPORT_SIZE_BYTES:
            return jsonify({"error": "Content exceeds 2MB limit."}), 400

        file_content = raw_text

    # Convert to HTML based on file extension
    base_title = os.path.splitext(filename)[0] or "Imported Document"

    if ext == ".md":
        try:
            html_content = markdown.markdown(file_content, extensions=["extra", "nl2br", "sane_lists"])
        except Exception:
            # Fallback safe converter
            escaped = html.escape(file_content)
            paragraphs = [f"<p>{p.strip()}</p>" for p in escaped.split("\n\n") if p.strip()]
            html_content = "".join(paragraphs) if paragraphs else "<p></p>"
    else:  # .txt
        escaped = html.escape(file_content)
        lines = escaped.split("\n")
        paragraphs = []
        current_p = []
        for line in lines:
            if line.strip() == "":
                if current_p:
                    paragraphs.append(f"<p>{'<br/>'.join(current_p)}</p>")
                    current_p = []
            else:
                current_p.append(line)
        if current_p:
            paragraphs.append(f"<p>{'<br/>'.join(current_p)}</p>")
        html_content = "".join(paragraphs) if paragraphs else "<p></p>"

    doc_id = str(uuid.uuid4())
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO documents (id, title, content, owner_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (doc_id, base_title, html_content, user_id, now, now))
    db.commit()

    return jsonify({
        "id": doc_id,
        "title": base_title,
        "content": html_content,
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
        "permission": "owner",
        "message": f"Successfully imported '{filename}' as a new document."
    }), 201


FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api"):
        return jsonify({"error": "API route not found"}), 404
    file_path = os.path.join(FRONTEND_DIST, path)
    if path != "" and os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIST, path)
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"message": "Ajaia Docs API is running. Frontend dist not found."}), 200

# Ensure tables are created when app starts
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Ajaia Docs Flask Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
