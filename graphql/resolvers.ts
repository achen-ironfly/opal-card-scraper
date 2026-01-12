import { login, getAccounts, getTransactions } from '../scraper';

const sessions: Record<string, any> = {};
export const resolvers = {
    Mutation: {
        authenticate: async (_: any, { id, password }: any) => {
            const context = await login(id, password, false);
            const isAuthenticated = !!context;

            if (isAuthenticated) {
                sessions[id] = context;
                const page = context.pages()[0];
                const currentUrl = page.url();
                return {
                    message: "authenticated true",
                    url: currentUrl
                };
              }
            return {
                message: "authenticated false",
                url: null
            };
        } 
    },
    Query: {
        account: async (_: any, { id }: any) => {
            const context = sessions[id];
            if (!context) {
                throw new Error('User not authenticated.');
            }
            try {
                const accounts = await getAccounts(context);
                return accounts;
            } catch (err) {
                console.error(err);
                return [];
            }
        },

        transaction: async (_: any, { id }: any) => {
            const context = sessions[id];
            if (!context) {
                throw new Error('User not authenticated.');
            }
            try {
                const transactions = await getTransactions(context, null, null);
                return (transactions || []).map((t: any) => ({
                    transactionId: t.transactionId,
                    transactionTime: t.transactionTime,
                    amount: t.amount,
                    currency: t.currency,
                    description: t.description,
                    status: t.status,
                    balance: t.balance
                }));
              } catch (err) {
                    console.error(err);
                    return [];
              }
        },
    }
};
