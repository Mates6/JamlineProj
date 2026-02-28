import { callBackend } from '../lib/backendClient.js';

const refreshLocks = new Map();

function getUserIdFromSession(req) {
    return req.session?.user?.user_id || req.session?.user?.id;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function reloadSession(req) {
    return new Promise((resolve, reject) => {
        req.session.reload(err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export async function withAuth(req, res, next, backendPath, options = {}) {
    try {
        const accessToken = req.session.tokens?.accessToken;

        const response = await callBackend(backendPath, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${accessToken}`
            }
        });

        return res.json(response);

    } catch (err) {
        if (err.status === 401) {
            return refreshAndRetry(req, res, next, backendPath, options);
        }

        next(err);
    }
}

async function refreshAndRetry(req, res, next, backendPath, options) {
    const userId = getUserIdFromSession(req);

    if (!userId) {
        return res.status(401).json({ message: "Session expired" });
    }

    try {
        while (refreshLocks.get(userId)) {
            await wait(20);
        }

        await reloadSession(req);

        const refreshToken = req.session.tokens?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Session expired' });
        }

        refreshLocks.set(userId, true);

        const refreshData = await callBackend('auth/refreshToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        req.session.tokens = {
            accessToken: refreshData.accessToken,
            refreshToken: refreshData.refreshToken
        };

        await new Promise(resolve => req.session.save(resolve));

        refreshLocks.set(userId, false);

        const retryData = await callBackend(backendPath, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${refreshData.accessToken}`
            }
        });

        return res.json(retryData);

    } catch (err) {
        console.log("REFRESH ERROR:", err.status, err.message);

        refreshLocks.set(userId, false);

        if (err.status === 403) {
            req.session.destroy(() => {
                return res.status(401).json({ message: "Session expired" });
            });
            return;
        }

        next(err);
    }
}