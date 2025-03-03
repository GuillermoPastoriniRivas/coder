import { Account } from '../models/account';

export const accountRepository = {
    async getAccountByEmail(email: string) {
        return await Account.findOne({ email });
    },
    
    async createAccount(accountData: any) {
        const account = new Account(accountData);
        return await account.save();
    },

    async updateAccountByEmail(email: string, updateData: any) {
        return await Account.findOneAndUpdate({ email }, updateData, { new: true });
    }

};