const express = require('express');
const cors = require('cors');

const corsOptions = require('./config/cors');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

module.exports = app;
