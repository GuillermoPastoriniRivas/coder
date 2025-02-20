import { Account } from '../models/account';

export const accountRepository = {
    async getAccountByEmail(email: string) {
        return await Account.findOne({ email });
    },
    
    async createAccount(accountData: any) {
        const account = new Account(accountData);
        return await account.save();
    },

    // Add other account-related repository methods if needed
};