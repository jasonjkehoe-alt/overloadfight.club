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
    console.warn(`[auth] ${missingSecrets.join(' and ')} not set; using insecure development defaults (admin password "admin123").`);
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'overload-tracker-dev-secret';

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

// Failed login attempts allowed per IP per window
export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

// Verify admin password with a timing-safe comparison
export async function verifyPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    const passwordBuf = Buffer.from(password);
    const adminBuf = Buffer.from(ADMIN_PASSWORD);
    if (passwordBuf.length !== adminBuf.length) {
        return false;
    }
    return crypto.timingSafeEqual(passwordBuf, adminBuf);
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
export async function login(req, res) {
    const { password } = req.body;

    console.log('Login attempt received');

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    const isValid = await verifyPassword(password);
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
