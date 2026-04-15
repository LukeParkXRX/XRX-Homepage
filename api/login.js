export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { user, pass } = req.body || {};

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
        return res.status(500).json({ error: 'Server not configured. Missing ADMIN_USER/ADMIN_PASS env vars.' });
    }

    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({ ok: true });
}
