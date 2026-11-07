require('dotenv').config();

const fs = require('fs');
const path = require('path');
const app = require('./app');
const db = require('./config/db');
const { PORT } = require('./config/env');
const { siapkanDatabase } = require('./config/migrate');

const schemaPath = path.join(__dirname, '../database/schema.sql');
siapkanDatabase(db, fs.readFileSync(schemaPath, 'utf8'));

app.listen(PORT, () => {
  console.log(`FiNote backend jalan di http://localhost:${PORT}`);
});
