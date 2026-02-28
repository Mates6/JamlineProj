export function loginSchema(req) {
    const { username, password } = req.body;

    if (!username) return 'Username must be specified';
    if (typeof username !== 'string' || username.length < 3) return 'Username must be a string with at least 3 characters.';
    if (!password) return 'Password must be specified';
    if (typeof password !== 'string' || password.length < 6) return 'Password must be a string with at least 6 characters.';

    return null;
}

export function registerSchema(req) {
    const {username, password, email} = req.body;

    if (!username) return 'Username must be specified';
    if (typeof username !== 'string' || username.length < 3) return 'Username must be a string with at least 3 characters.';
    if (!password) return 'Password must be specified';
    if (typeof password !== 'string' || password.length < 6) return 'Password must be a string with at least 6 characters.';
    if (!email) return 'Email must be specified';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) return 'Email must be a valid email address.';

    return null;
}