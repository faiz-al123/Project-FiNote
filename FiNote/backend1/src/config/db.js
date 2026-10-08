// Koneksi ke database SQLite FiNote.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { DB_PATH } = require('./env');

const resolvedPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(__dirname, '../../', DB_PATH);

const db = new DatabaseSync(resolvedPath);
db.exec('PRAGMA foreign_keys = ON');

module.exports = db;
