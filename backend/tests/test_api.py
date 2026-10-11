import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app import app, init_db


@pytest.fixture
def client():
    # Create a temporary database for test isolation
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    app.config["TESTING"] = True

    # Initialize isolated database
    init_db(db_path)

    # Patch DATABASE_PATH in app module
    import app as app_module
    old_db_path = app_module.DATABASE_PATH
    app_module.DATABASE_PATH = db_path

    with app.test_client() as test_client:
        yield test_client

    # Cleanup
    app_module.DATABASE_PATH = old_db_path
    os.close(db_fd)
    if os.path.exists(db_path):
        os.unlink(db_path)


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "Ajaia Docs API" in data["service"]


def test_users_list(client):
    response = client.get("/api/users")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data["users"]) >= 3
    user_ids = [u["id"] for u in data["users"]]
    assert "user_alice" in user_ids
    assert "user_bob" in user_ids


def test_create_and_fetch_document(client):
    # Test unauthenticated access returns 401
    unauth_resp = client.post("/api/documents", json={"title": "Test Doc", "content": "<p>Hello</p>"})
    assert unauth_resp.status_code == 401

    # Authenticated as Alice
    create_resp = client.post(
        "/api/documents",
        headers={"X-User-Id": "user_alice"},
        json={"title": "Q3 Strategy", "content": "<p>Key initiatives</p>"}
    )
    assert create_resp.status_code == 201
    doc = create_resp.get_json()
    assert doc["title"] == "Q3 Strategy"
    assert doc["owner_id"] == "user_alice"
    doc_id = doc["id"]

    # Fetch document as Alice (owner)
    get_resp = client.get(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_alice"})
    assert get_resp.status_code == 200
    fetched_doc = get_resp.get_json()
    assert fetched_doc["title"] == "Q3 Strategy"
    assert fetched_doc["permission"] == "owner"


def test_access_control_unauthorized_user(client):
    # Create document as Alice
    create_resp = client.post(
        "/api/documents",
        headers={"X-User-Id": "user_alice"},
        json={"title": "Confidential Specs", "content": "<p>Secret code</p>"}
    )
    doc_id = create_resp.get_json()["id"]

    # Charlie (unshared user) tries to read -> 403 Forbidden
    charlie_get = client.get(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_charlie"})
    assert charlie_get.status_code == 403

    # Charlie tries to edit -> 403 Forbidden
    charlie_edit = client.put(
        f"/api/documents/{doc_id}",
        headers={"X-User-Id": "user_charlie"},
        json={"title": "Hacked", "content": "<p>Modified</p>"}
    )
    assert charlie_edit.status_code == 403

    # Charlie tries to delete -> 403 Forbidden
    charlie_delete = client.delete(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_charlie"})
    assert charlie_delete.status_code == 403


def test_sharing_and_collaboration(client):
    # Alice creates doc
    create_resp = client.post(
        "/api/documents",
        headers={"X-User-Id": "user_alice"},
        json={"title": "Shared Roadmap", "content": "<p>Version 1</p>"}
    )
    doc_id = create_resp.get_json()["id"]

    # Bob cannot read yet
    bob_check = client.get(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_bob"})
    assert bob_check.status_code == 403

    # Alice shares doc with Bob
    share_resp = client.post(
        f"/api/documents/{doc_id}/share",
        headers={"X-User-Id": "user_alice"},
        json={"user_id": "user_bob", "permission": "edit"}
    )
    assert share_resp.status_code == 200

    # Bob can now read the document
    bob_get = client.get(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_bob"})
    assert bob_get.status_code == 200
    assert bob_get.get_json()["permission"] == "edit"

    # Bob edits the document (autosave / update)
    bob_update = client.put(
        f"/api/documents/{doc_id}",
        headers={"X-User-Id": "user_bob"},
        json={"title": "Shared Roadmap - Updated by Bob", "content": "<p>Version 2 with Bob's edits</p>"}
    )
    assert bob_update.status_code == 200
    updated_doc = bob_update.get_json()
    assert updated_doc["title"] == "Shared Roadmap - Updated by Bob"
    assert updated_doc["content"] == "<p>Version 2 with Bob's edits</p>"

    # Bob cannot delete the document (only owner can delete)
    bob_delete = client.delete(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_bob"})
    assert bob_delete.status_code == 403

    # Bob cannot re-share document (only owner can share)
    bob_reshare = client.post(
        f"/api/documents/{doc_id}/share",
        headers={"X-User-Id": "user_bob"},
        json={"user_id": "user_charlie", "permission": "edit"}
    )
    assert bob_reshare.status_code == 403

    # Alice revokes Bob's share
    revoke_resp = client.delete(f"/api/documents/{doc_id}/share/user_bob", headers={"X-User-Id": "user_alice"})
    assert revoke_resp.status_code == 200

    # Bob is now denied access again
    bob_denied = client.get(f"/api/documents/{doc_id}", headers={"X-User-Id": "user_bob"})
    assert bob_denied.status_code == 403


def test_file_import_txt_and_md(client):
    # Import Markdown text
    md_content = "# Project Proposal\n\nThis is a **bold proposal** with items:\n- Alpha\n- Beta"
    md_resp = client.post(
        "/api/documents/import",
        headers={"X-User-Id": "user_alice"},
        json={"text": md_content, "filename": "proposal.md"}
    )
    assert md_resp.status_code == 201
    doc = md_resp.get_json()
    assert doc["title"] == "proposal"
    assert "<h1>Project Proposal</h1>" in doc["content"]
    assert "<strong>bold proposal</strong>" in doc["content"]

    # Import plain text
    txt_content = "Line one\nLine two\n\nParagraph two"
    txt_resp = client.post(
        "/api/documents/import",
        headers={"X-User-Id": "user_alice"},
        json={"text": txt_content, "filename": "notes.txt"}
    )
    assert txt_resp.status_code == 201
    txt_doc = txt_resp.get_json()
    assert txt_doc["title"] == "notes"
    assert "<p>Line one<br/>Line two</p>" in txt_doc["content"]

    # Reject unsupported file extensions (e.g. .pdf or .exe)
    invalid_resp = client.post(
        "/api/documents/import",
        headers={"X-User-Id": "user_alice"},
        json={"text": "evil binary", "filename": "script.exe"}
    )
    assert invalid_resp.status_code == 400
    assert "Unsupported file" in invalid_resp.get_json()["error"]
