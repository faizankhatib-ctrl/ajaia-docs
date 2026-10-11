# Engineering Strategy & Q4 Roadmap

Ajaia Docs is designed as an **AI-native collaborative workspace** for agile product teams.

## Core Milestones

1. **Sprint 1: Document Core & Autosave**
   - Rich text editing canvas with typography standards.
   - Low-latency debounced autosave.
   - SQLite persistent storage with WAL mode.

2. **Sprint 2: Team Collaboration & Permissions**
   - Granular RBAC permissions (`owner`, `edit`, `view`).
   - Seamless sharing modal between authenticated team members.
   - Comprehensive backend access control verification.

3. **Sprint 3: Import & Interoperability**
   - Support for Markdown (`.md`) and Plaintext (`.txt`) file formats.
   - Automated conversion into structured HTML document trees.

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

### Key Performance Indicators
- Latency under 50ms for document updates.
- 100% test pass rate across all access control scenarios.
