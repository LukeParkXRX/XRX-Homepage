const REPO_OWNER = 'LukeParkXRX';
const REPO_NAME = 'XRX-Homepage';
const FILE_PATH = 'data/projects.json';
const BRANCH = 'main';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { user, pass, projects } = req.body || {};

    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS || !process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: 'Server not configured. Missing ADMIN_USER/ADMIN_PASS/GITHUB_TOKEN env vars.' });
    }

    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!Array.isArray(projects)) {
        return res.status(400).json({ error: 'projects must be an array' });
    }

    const ghHeaders = {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'xrx-admin'
    };

    try {
        const getRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
            { headers: ghHeaders }
        );
        if (!getRes.ok) {
            const text = await getRes.text();
            return res.status(502).json({ error: `Fetch current file failed: ${getRes.status} ${text}` });
        }
        const current = await getRes.json();

        const pretty = JSON.stringify(projects, null, 2);
        const b64 = Buffer.from(pretty, 'utf8').toString('base64');

        const putRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
            {
                method: 'PUT',
                headers: { ...ghHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Admin: update projects.json (${projects.length} projects)`,
                    content: b64,
                    sha: current.sha,
                    branch: BRANCH
                })
            }
        );

        if (!putRes.ok) {
            const text = await putRes.text();
            return res.status(502).json({ error: `GitHub commit failed: ${putRes.status} ${text}` });
        }

        const result = await putRes.json();
        return res.status(200).json({
            ok: true,
            commitSha: result.commit?.sha,
            contentSha: result.content?.sha
        });
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || err) });
    }
}
