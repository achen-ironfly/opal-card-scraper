import { login, getAccounts, getTransactions } from '../scraper';

const sessions: Record<string, any> = {};
export const resolvers = {
    Mutation: {
        authenticate: async (_: any, { userId, password, showBrowser }: any) => {
            try {
                const context = await login(userId, password, !!showBrowser);
                const isAuthenticated = !!context;

                if (isAuthenticated) {
                  sessions[userId] = context;
              }
                return {
                    userId,
                    authenticated: isAuthenticated
              };
            } catch (err) {
                console.error(err);
                return {
                    userId,
                    authenticated: false
                };
            }
        }
    },  

    Query: {
        Account: async (_: any, { id }: any) => {
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

        Transaction: async (_: any, { id }: any) => {
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
