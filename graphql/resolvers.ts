import { login, getAccounts, getTransactions } from '../scraper';

function generateTransactionID(t: any) {
  return {
    ...t,
    transactionId: Math.floor(
      new Date(String(t.time_utc)).getTime() / 1000
    ).toString(),
    date: t.time_utc
  };
}

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
    accounts: async (_: any, { userId }: any) => {
      const context = sessions[userId];
      if (!context) {
        throw new Error('User not authenticated.');
      }
      try {
        return await getAccounts(context);
      } catch (err) {
        console.error(err);
        return [];
      }
    },

    account: async (_: any, { userId, accountId }: any) => {
      const context = sessions[userId];
      if (!context) {
        throw new Error('User not authenticated.');
      }
      try {
        const accounts = await getAccounts(context);
        if (!accounts || accounts.length === 0) {
          return null;
        }
        return accounts.find((a: any) => String(a.accountId) === String(accountId)) || null;
      } catch (err) {
        console.error(err);
        return null;
      }
    },

    transactions: async (
      _: any,
      { userId, startDate, endDate, accountId }: any
    ) => {
      const context = sessions[userId];
      if (!context) {
        throw new Error('User not authenticated.');
      }
      try {
        let tx = await getTransactions(
          context,
          startDate ? new Date(startDate) : null,
          endDate ? new Date(endDate) : null
        );

        if (accountId) {
          tx = tx.filter((t: any) =>
            String(t.accountId) === String(accountId)
          );
        }

        return (tx || []).map(generateTransactionID);
      } catch (err) {
        console.error(err);
        return [];
      }
    },

    transaction: async (
      _: any,
      { userId, transactionId }: any
    ) => {
      const context = sessions[userId];
      if (!context) {
        throw new Error('User not authenticated.');
      }
      try {
        const tx = await getTransactions(context, null, null);
        const found = (tx || []).find(
          t =>
            Math.floor(
              new Date(String(t.time_utc)).getTime() / 1000
            ).toString() === transactionId
        );
        return found ? generateTransactionID(found) : null;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
  }
};
