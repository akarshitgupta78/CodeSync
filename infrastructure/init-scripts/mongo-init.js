// MongoDB initialization script for CodeSync documents
db = db.getSiblingDB('codesync_docs');

db.createCollection('documents');
db.documents.createIndex({ "workspace_id": 1, "document_name": 1 }, { unique: true });

db.createCollection('document_snapshots');
db.document_snapshots.createIndex({ "workspace_id": 1, "created_at": -1 });

db.createCollection('yjs_update_logs');
db.yjs_update_logs.createIndex({ "workspace_id": 1, "timestamp": 1 });
