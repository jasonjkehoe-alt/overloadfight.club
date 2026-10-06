import crypto from 'crypto';
import session from 'express-session';
import rateLimit from 'express-rate-limit';

// Secrets come from the environment only. Production refuses to start without them.
const missingSecrets = ['ADMIN_PASSWORD', 'SESSION_SECRET'].filter(name => !process.env[name]);
if (missingSecrets.length > 0) {
    if (process.env.NODE_ENV === 'production') {
        console.error(`Refusing to start: ${missingSecrets.join(' and ')} must be set when NODE_ENV=production. See .env.example.`);
        process.exit(1);
    }
    console.warn(`[auth] ${missingSecrets.join(' and ')} not set; using insecure development defaults${missingSecrets.includes('ADMIN_PASSWORD') ? ' (admin password "admin123")' : ''}.`);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'overload-tracker-dev-secret';

// Compare fixed-length digests so response time does not reveal the password length
const sha256 = (value) => crypto.createHash('sha256').update(value).digest();
const ADMIN_PASSWORD_DIGEST = sha256(ADMIN_PASSWORD);

// Session configuration
export const sessionMiddleware = session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto', // Secure when the request arrived over HTTPS (needs 'trust proxy' behind the reverse proxy)
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

// Failed login attempts per window: 10 per IP, and 50 across all clients because
// anyone reaching port 3000 directly can set X-Forwarded-For and pick their own IP
const loginLimitOptions = {
    windowMs: 15 * 60 * 1000,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' }
};
export const loginRateLimit = [
    rateLimit({ ...loginLimitOptions, limit: 10 }),
    rateLimit({ ...loginLimitOptions, limit: 50, keyGenerator: () => 'all-clients' })
];

// Verify admin password with a timing-safe comparison
export function verifyPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    return crypto.timingSafeEqual(sha256(password), ADMIN_PASSWORD_DIGEST);
}

// Auth middleware to protect admin routes
export function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized - Admin access required' });
    }
}

// Login handler
export function login(req, res) {
    const { password } = req.body;

    console.log('Login attempt received');

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    const isValid = verifyPassword(password);
    console.log('Password valid:', isValid);

    if (isValid) {
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Authenticated' });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
}

// Logout handler
export function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true, message: 'Logged out' });
    });
}

// Check auth status
export function checkAuth(req, res) {
    res.json({ isAuthenticated: !!(req.session && req.session.isAdmin) });
}
