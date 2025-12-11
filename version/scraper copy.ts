import { chromium, BrowserContext } from 'playwright';
import * as readline from 'readline';

/**
 * Helper function to prompt user input in the console
 */
async function ask(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve =>
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        })
    );
}

/**
 * Log in to the Opal website using provided credentials
 */
export async function login(username: string, password: string): Promise<BrowserContext> {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://transportnsw.info/tickets-fares/opal-login#/login');
    await page.waitForSelector('iframe[src*="opal"]', { state: 'attached', timeout: 6000 });

    const frame = page.frame({ url: /opal/ });
    if (!frame) {
        const frames = page.frames().map(f => f.url());
        throw new Error(`Opal iframe not found. Available frames: ${frames.join(', ')}`);
    }

    await frame.waitForSelector('input[name="username"]', { timeout: 6000 });
    await frame.fill('input[name="username"]', username);
    await frame.fill('input[name="password"]', password);

    await Promise.all([
        frame.click('button.opal-username-login'),
        page.waitForURL('**/opal-view/#/account/cards', { timeout: 6000 })
    ]);

    return context;
}

/**
 * Ask for username, password, start date and end date
 */
export async function DateRange(): Promise<{
    username: string;
    password: string;
    startDate: Date | null;
    endDate: Date | null;
}> {
    const username = await ask("Enter username (email): ");
    const password = await ask("Enter password: ");

    function parseDate(dateStr: string): Date | null {
        const parts = dateStr.trim().split('-');
        if (parts.length !== 3) return null;

        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

        return new Date(Date.UTC(year, month - 1, day));
    }

    const startInput = await ask("Enter start date (MM-DD-YYYY) or press Enter for all: ");
    const endInput = await ask("Enter end date (MM-DD-YYYY) or press Enter for all: ");

    const startDate = startInput.trim() ? parseDate(startInput) : null;
    const endDate = endInput.trim() ? parseDate(endInput) : null;

    if ((startInput.trim() && !startDate) || (endInput.trim() && !endDate)) {
        throw new Error("Invalid date format. Please use MM-DD-YYYY or leave empty.");
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error("Start date must be before end date.");
    }

    return { username, password, startDate, endDate };
}


