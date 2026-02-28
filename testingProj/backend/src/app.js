import express from 'express';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.json());
app.use(logger);

app.use(routes);


app.use((req, res, next) => {
    res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
    console.error("Backend error:", err);

    const status = err.status || 500;

    res.status(status).json({
        message: err.message || "Internal server error"
    });
});

export default app;