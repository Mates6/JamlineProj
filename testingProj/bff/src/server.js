console.log('Bff server is starting...');

import express, { json } from "express";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import testRoutes from './routes/test.routes.js';
import groupRoutes from './routes/groups.routes.js';
import authRoutes from './routes/auth.routes.js';
import rooms from './routes/rooms.routes.js'
import morgan from 'morgan';
import session from 'express-session'

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
    origin: [
        'http://localhost:5173',
        "https://jamline.ssnd-project.sk"
    ],
    credentials: true,
}));

app.use(express.json());


//cookies
app.use(session({
    secret: 'extreme-secret-password',
    resave: false,
    saveUninitialized: false,
    cookie:{
        httpOnly: true,
        secure: false, // ked uz pojde reverse proxy, tak uz aj toto na true
        sameSite: 'lax'
    }
}));

// logger 
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60,
    max: 100,
});

// limiter, ktory limituje vsetky /api/* routy
app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
    res.send('Bff is running!');
});

//nase routy
app.use('/api', testRoutes);
app.use('/bff/api', groupRoutes);
app.use('/bff/api', authRoutes);
app.use('/bff/api', rooms);

// 404 handler, ak routa neexistuje alebo je tam preklep
app.use((req, res, next ) =>{
    res.status(404).json({ message: 'Route not Found' });
});

//error handler, ak v tom next() posleme error
app.use((err, req, res, next) => {
    console.error('Unhandled error: ', err);

    const status = err.status || 500;
    res.status(status).json({
        message: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`BFF server is listening on port ${PORT}`);
})