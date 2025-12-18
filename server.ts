import express from 'express';
import path from 'path';
import * as fs from 'fs';
import { login, getTransactions, validateSydneyDate, getAccounts } from './scraper';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

app.use(express.json({ limit: '10mb' }));
app.use('/', express.static(path.join(__dirname, 'my-app', 'public')));

let transactionStore: any[] = [];

/**
 * Read transactions function
 */
function readTransactions(): any[] {
    try {
        const dir = process.cwd();
        const files = fs.readdirSync(dir).filter(f => f.startsWith('transactions_') && f.endsWith('.json'));
        if (files.length === 0) return [];
        // Sort by file modified time descending
        const withStats = files.map(f => ({ f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }));
        withStats.sort((a, b) => b.mtime - a.mtime);
        const latestPath = path.join(dir, withStats[0].f);
        const raw = fs.readFileSync(latestPath, 'utf8');
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error('Failed to read transactions from disk:', e);
        return [];
    }
}

function fmtDateForName(d: Date | null) {
    if (!d) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dt = new Date(d);
    return `${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}-${dt.getFullYear()}`;
}

/**
 * GET /api/transactions Method
 */
app.get('/api/transactions', (req, res) => {

    let result = readTransactions();
    if (!result || result.length === 0) {
        result = transactionStore || [];
    }

    const { accountId, mode, startDate, endDate } = req.query as Record<string, string | undefined>;
    // Validate dates 
    let sDate: Date | null = null;
    let eDate: Date | null = null;
    if (startDate && startDate.trim()) {
        const { date, error } = validateSydneyDate(String(startDate), { allowFuture: true });
        if (!date) {
            return res.status(400).json({ error: `Invalid startDate: ${error}` });
        }
        sDate = date;
    }
    if (endDate && endDate.trim()) {
        const { date, error } = validateSydneyDate(String(endDate), { allowFuture: true });
        if (!date) {
            return res.status(400).json({ error: `Invalid endDate: ${error}` });
        }
        eDate = date;
    }
    if (sDate && eDate && sDate > eDate) {
        return res.status(400).json({ error: 'startDate must be before or equal to endDate' });
    }

    if (accountId) {
        result = result.filter((t: any) => String(t.accountId) === String(accountId));
    }

    if (mode) {
        result = result.filter((t: any) => String(t.mode) === String(mode));
    }

    if (sDate) {
        result = result.filter((t: any) => new Date(String(t.time_utc)) >= sDate!);
    }

    if (eDate) {
        result = result.filter((t: any) => new Date(String(t.time_utc)) <= eDate!);
    }
    res
        .type('application/json')
        .send(JSON.stringify(result, null, 2));

});

app.get('/api/scrape/stream', async (req, res) => {
    const { username, password, startDate, endDate, showBrowser } = req.query;
    if (!username || !password) {
        res.status(400).end();
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const send = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const context = await login(
            String(username),
            String(password),
            showBrowser === 'true'
        );

        const transactions = await getTransactions(
            context,
            startDate ? new Date(String(startDate)) : null,
            endDate ? new Date(String(endDate)) : null,
            (p) => send({ type: 'progress', ...p }) 
        );

        send({ type: 'done', transactions });
        res.end();

        const browser = context.browser();
        if (browser) await browser.close();
        else await context.close();
    } catch (err: any) {
        send({ type: 'error', message: err.message || String(err) });
        res.end();
    }
});

/**
 * POST /user/:userId/auth
 */
app.post('/user/:userId/auth', async (req, res) => {
    const { userId } = req.params as { userId: string };
    const { password, showBrowser } = req.body ?? {};
    if (!userId || !password) {
        return res.status(400).json({ error: 'userId (in path) and password (in body) are required' });
    }

    try {
        const context = await login(String(userId), String(password), !!showBrowser);
        try {
            const browser = context.browser();
            await (browser ? browser.close() : context.close());
        } catch {
            try { await context.close(); } catch {}
        }
        return res.status(200).json({ userId, authenticated: true });
    } catch (err: any) {
        const msg = err?.message ?? String(err);
        if (msg === 'InvalidCredentials') return res.status(401).json({ error: 'Invalid credentials' });
        console.error('Auth check failed:', err);
        return res.status(500).json({ error: msg });
    }
});

/**
 * GET /user/:userId/accounts
 */
app.get('/user/:userId/accounts', async (req, res) => {
    const { userId } = req.params as { userId: string };
    const { password, showBrowser } = req.query;

    if (!userId || !password) {
        return res.status(400).json({
            error: 'userId and password are required'
        });
    }

    let context: any = null;

    try {
        context = await login(
            String(userId),
            String(password),
            showBrowser === 'true'
        );

        const accounts = await getAccounts(context);
        res.status(200).type('application/json').send(JSON.stringify(accounts, null, 2));

    } catch (err: any) {
        const msg = err?.message ?? String(err);
        if (msg === 'InvalidCredentials') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.error('Get accounts failed:', err);
        return res.status(500).json({ error: msg });
    } finally {
        try {
            if (context) {
                const browser = context.browser();
                await (browser ? browser.close() : context.close());
            }
        } catch {}
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/scraper.html`);
});
