class Storage {
    constructor() {
        this.usersKey = 'investProUsers';
        this.currentUserKey = 'investProCurrentUser';
        this.investmentsKey = 'investProInvestments';
        this.transactionsKey = 'investProTransactions';
        this.chatMessagesKey = 'investProChatMessages';
        this.adminKey = 'investProAdmin';
        this.statsKey = 'investProStats';
    }

    // Users methods
    getUsers() {
        const users = localStorage.getItem(this.usersKey);
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    }

    createUser(username, password) {
        const users = this.getUsers();
        const id = this.generateId(users.length + 1);
        const newUser = {
            id,
            username,
            password,
            balance: 0,
            totalWithdrawn: 0,
            avatar: null,
            registrationDate: new Date().toISOString(),
            referralCode: this.generateReferralCode(username),
            referredBy: null,
            investments: [],
            completedInvestments: 0
        };
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    updateUser(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            users[index] = updatedUser;
            this.saveUsers(users);
            return true;
        }
        return false;
    }

    // Current user methods
    getCurrentUser() {
        const user = localStorage.getItem(this.currentUserKey);
        return user ? JSON.parse(user) : null;
    }

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.currentUserKey);
        }
    }

    // Investments methods
    getInvestments() {
        const investments = localStorage.getItem(this.investmentsKey);
        return investments ? JSON.parse(investments) : [];
    }

    saveInvestments(investments) {
        localStorage.setItem(this.investmentsKey, JSON.stringify(investments));
    }

    createInvestment(userId, amount, days, interestRate) {
        const investments = this.getInvestments();
        const id = `inv_${Date.now()}`;
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);
        
        const newInvestment = {
            id,
            userId,
            amount,
            days,
            interestRate,
            startDate,
            endDate: endDate.toISOString(),
            status: 'active',
            profit: amount * (interestRate / 100)
        };
        
        investments.push(newInvestment);
        this.saveInvestments(investments);
        
        // Update user's investments
        const user = this.getUserById(userId);
        if (user) {
            user.investments.push(id);
            this.updateUser(user);
        }
        
        return newInvestment;
    }

    completeInvestment(investmentId) {
        const investments = this.getInvestments();
        const index = investments.findIndex(inv => inv.id === investmentId);
        
        if (index !== -1 && investments[index].status === 'active') {
            const investment = investments[index];
            investment.status = 'completed';
            
            const user = this.getUserById(investment.userId);
            if (user) {
                user.balance += investment.amount + investment.profit;
                user.completedInvestments += 1;
                
                // Remove from active investments
                user.investments = user.investments.filter(id => id !== investmentId);
                
                this.updateUser(user);
            }
            
            investments[index] = investment;
            this.saveInvestments(investments);
            
            // Update stats
            this.updateStats({
                completedInvestments: 1,
                totalTurnover: investment.amount + investment.profit
            });
            
            return true;
        }
        return false;
    }

    // Transactions methods
    getTransactions() {
        const transactions = localStorage.getItem(this.transactionsKey);
        return transactions ? JSON.parse(transactions) : [];
    }

    saveTransactions(transactions) {
        localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));
    }

    createTransaction(userId, type, amount, status = 'pending') {
        const transactions = this.getTransactions();
        const id = `trx_${Date.now()}`;
        
        const newTransaction = {
            id,
            userId,
            type,
            amount,
            status,
            date: new Date().toISOString(),
            wallet: type === 'withdraw' ? '' : null
        };
        
        transactions.push(newTransaction);
        this.saveTransactions(transactions);
        return newTransaction;
    }

    // Chat methods
    getChatMessages() {
        const messages = localStorage.getItem(this.chatMessagesKey);
        return messages ? JSON.parse(messages) : [];
    }

    saveChatMessages(messages) {
        localStorage.setItem(this.chatMessagesKey, JSON.stringify(messages));
    }

    addChatMessage(userId, message, isAdmin = false) {
        const messages = this.getChatMessages();
        const newMessage = {
            id: `msg_${Date.now()}`,
            userId,
            isAdmin,
            message,
            timestamp: new Date().toISOString(),
            read: false
        };
        messages.push(newMessage);
        this.saveChatMessages(messages);
        return newMessage;
    }

    // Admin methods
    getAdmin() {
        const admin = localStorage.getItem(this.adminKey);
        return admin ? JSON.parse(admin) : {
            username: 'AdminDrewzUio.Se.Investr.Ru',
            password: 'AdminDrewzUio.Se.Investr.Ru'
        };
    }

    // Stats methods
    getStats() {
        const stats = localStorage.getItem(this.statsKey);
        if (!stats) {
            const defaultStats = {
                totalUsers: 0,
                newUsersToday: 0,
                activeInvestments: 0,
                completedInvestments: 0,
                totalTurnover: 0,
                totalWithdrawn: 0,
                lastUpdated: new Date().toISOString(),
                startDate: new Date('2025-06-20').toISOString()
            };
            this.saveStats(defaultStats);
            return defaultStats;
        }
        return JSON.parse(stats);
    }

    saveStats(stats) {
        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    updateStats(updates) {
        const stats = this.getStats();
        const newStats = { ...stats, ...updates, lastUpdated: new Date().toISOString() };
        this.saveStats(newStats);
        return newStats;
    }

    // Helper methods
    generateId(count) {
        return String(count).padStart(10, '0');
    }

    generateReferralCode(username) {
        return `${username}_${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    }

    checkCompletedInvestments() {
        const investments = this.getInvestments();
        const now = new Date();
        
        investments.forEach(inv => {
            if (inv.status === 'active' && new Date(inv.endDate) <= now) {
                this.completeInvestment(inv.id);
            }
        });
    }

    initialize() {
        // Create admin if not exists
        const admin = this.getAdmin();
        if (!localStorage.getItem(this.adminKey)) {
            localStorage.setItem(this.adminKey, JSON.stringify(admin));
        }
        
        // Check for completed investments
        this.checkCompletedInvestments();
    }
}

const storage = new Storage();
storage.initialize();

// Make storage available globally for debugging
window.storage = storage;