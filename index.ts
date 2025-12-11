import { DateRange, login, getTransactions, askCredentials } from './scraper';

(async () => {
    // Ask for username + password + date range
    const { username, password, startDate, endDate, showBrowser } = await DateRange();

    // Attempt login; if credentials are invalid prompt user to re-enter them and retry.
    let context;
    let curUser = username;
    let curPass = password;
    while (true) {
        try {
            context = await login(curUser, curPass, showBrowser);
            break; // success
        } catch (err: any) {
            const msg = err && err.message ? err.message : String(err);
            if (msg === 'InvalidCredentials') {
                console.error('Invalid username or password. Please re-enter your credentials.');
                const creds = await askCredentials();
                curUser = creds.username;
                curPass = creds.password;
                continue; // retry
            }
            // Non-credentials error — rethrow or exit
            console.error('Login error:', msg);
            process.exit(1);
        }
    }
    // Scrape transactions
    const transactions = await getTransactions(context, startDate, endDate);

    // Automatically close browser when it was shown to the user.
    if (showBrowser) {
        try {
            const browser = context.browser();
            if (browser) await browser.close();
            else await context.close();
        } catch (err) {
            console.warn('Failed to close browser or context:', err);
            try { await context.close(); } catch (e) {}
        }
    } else {
        // When running headless, just close the context to free resources.
        try { await context.close(); } catch (e) {}
        // Ensure the Node process exits when running in headless mode
        try { process.exit(0); } catch (e) {}
    }
})();
