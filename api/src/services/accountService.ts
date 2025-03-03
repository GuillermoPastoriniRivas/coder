import { accountRepository } from '../repositories/accountRepository';

export const accountService = {
    // Account
    async getAccount(email: string) {
        const account = await accountRepository.getAccountByEmail(email);
        if (!account) throw new Error('Account not found');
        return account;
    },

    async updateAccount(email: string, updateData: any) {
        const updatedAccount = await accountRepository.updateAccountByEmail(email, updateData);
        if (!updatedAccount) throw new Error('Failed to update account');
        return updatedAccount;
    }
};