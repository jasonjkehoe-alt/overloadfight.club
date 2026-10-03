import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import session from 'express-session';

// Default admin password hash for "admin123"
const DEFAULT_PASSWORD_HASH = '$2a$10$RpCsab3ZG70ek99XK1VpLu.qDji/XfQ0dr4So2v/dJ3NtJdh6EwyC';

// Session configuration
export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'overload-tracker-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

// Verify admin password
export async function verifyPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    // If env var is set, use timing-safe comparison
    if (adminPassword) {
        const passwordBuf = Buffer.from(password);
        const adminBuf = Buffer.from(adminPassword);
        if (passwordBuf.length !== adminBuf.length) {
            return false;
        }
        return crypto.timingSafeEqual(passwordBuf, adminBuf);
    }

    // Default to bcrypt comparison against DEFAULT_PASSWORD_HASH ("admin123")
    return bcrypt.compare(password, DEFAULT_PASSWORD_HASH);
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
