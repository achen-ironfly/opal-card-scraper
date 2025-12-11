import { DateRange, login } from './scraper';

(async () => {
    const { username, password, startDate, endDate } = await DateRange();
    const context = await login(username, password);

    // startDate and endDate are ready to be used for transactions scraping
})();
