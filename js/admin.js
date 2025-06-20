document.addEventListener('DOMContentLoaded', function() {
    const storage = new Storage();
    
    // Check if admin is logged in
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isAdminLoggedIn && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.admin-nav li');
    const contentSections = document.querySelectorAll('.admin-content-section');
    
    navItems.forEach(item => {
        if (item.id === 'adminLogout') return;
        
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === `${section}Section`) {
                    sec.classList.add('active');
                    document.getElementById('adminSectionTitle').textContent = this.querySelector('i').nextSibling.textContent.trim();
                }
            });
            
            // Load section content
            switch(section) {
                case 'admin-dashboard':
                    loadAdminDashboard();
                    break;
                case 'admin-users':
                    loadAdminUsers();
                    break;
                case 'admin-chat':
                    loadAdminChat();
                    break;
                case 'admin-transactions':
                    loadAdminTransactions();
                    break;
            }
        });
    });
    
    // Logout button
    document.getElementById('adminLogout').addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'index.html';
    });
    
    // Send money modal
    const sendMoneyModal = document.getElementById('sendMoneyModal');
    const sendMoneyBtn = document.getElementById('sendMoneyBtn');
    const closeSendMoneyModal = document.querySelector('.close-admin-modal');
    const confirmSendMoney = document.getElementById('confirmSendMoney');
    
    sendMoneyBtn.addEventListener('click', function() {
        sendMoneyModal.style.display = 'flex';
    });
    
    closeSendMoneyModal.addEventListener('click', function() {
        sendMoneyModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === sendMoneyModal) {
            sendMoneyModal.style.display = 'none';
        }
    });
    
    confirmSendMoney.addEventListener('click', function() {
        const userId = document.getElementById('sendMoneyUserId').value;
        const amount = parseFloat(document.getElementById('sendMoneyAmount').value);
        
        if (!userId || isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, укажите ID пользователя и корректную сумму');
            return;
        }
        
        const user = storage.getUserById(userId);
        if (!user) {
            alert('Пользователь с таким ID не найден');
            return;
        }
        
        // Update user balance
        user.balance += amount;
        storage.updateUser(user);
        
        // Create transaction
        storage.createTransaction(user.id, 'admin_add', amount, 'completed');
        
        // Close modal and reset
        sendMoneyModal.style.display = 'none';
        document.getElementById('sendMoneyUserId').value = '';
        document.getElementById('sendMoneyAmount').value = '';
        
        alert(`На баланс пользователя ${user.username} (ID: ${user.id}) успешно зачислено ${amount.toFixed(2)} ₽`);
        
        // Reload users if on that page
        if (document.getElementById('adminUsersSection').classList.contains('active')) {
            loadAdminUsers();
        }
    });
    
    // Load dashboard by default
    loadAdminDashboard();
});

function loadAdminDashboard() {
    const stats = storage.getStats();
    
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('newUsersToday').textContent = stats.newUsersToday;
    document.getElementById('activeInvestments').textContent = stats.activeInvestments;
    document.getElementById('completedInvestments').textContent = stats.completedInvestments;
    document.getElementById('totalTurnover').textContent = stats.totalTurnover.toFixed(2) + ' ₽';
    document.getElementById('totalWithdrawn').textContent = stats.totalWithdrawn.toFixed(2) + ' ₽';
}

function loadAdminUsers() {
    const usersList = document.querySelector('.admin-users-list');
    const users = storage.getUsers();
    
    usersList.innerHTML = users.map(user => {
        const regDate = new Date(user.registrationDate);
        const activeInvestments = user.investments.length;
        
        return `
            <div class="user-item">
                <div class="user-item-info">
                    <h4>${user.username} <small>(ID: ${user.id})</small></h4>
                    <p>Зарегистрирован: ${regDate.toLocaleDateString()}</p>
                    <p>Баланс: ${user.balance.toFixed(2)} ₽ | Вкладов: ${activeInvestments}</p>
                </div>
                <div class="user-item-actions">
                    <button class="edit-user" data-id="${user.id}">Редактировать</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const user = storage.getUserById(userId);
            
            if (user) {
                const newBalance = prompt('Новый баланс:', user.balance);
                if (newBalance !== null) {
                    const amount = parseFloat(newBalance);
                    if (!isNaN(amount)) {
                        user.balance = amount;
                        storage.updateUser(user);
                        loadAdminUsers();
                    } else {
                        alert('Введите корректную сумму');
                    }
                }
            }
        });
    });
}

function loadAdminChat() {
    const chatContainer = document.getElementById('adminChatMessages');
    const messages = storage.getChatMessages();
    const users = storage.getUsers();
    
    chatContainer.innerHTML = messages.map(msg => {
        const user = users.find(u => u.id === msg.userId);
        const date = new Date(msg.timestamp);
        const isAdmin = msg.isAdmin;
        
        return `
            <div class="message ${isAdmin ? 'admin' : 'user'}">
                <div class="message-header">
                    <span class="message-sender">${isAdmin ? 'Вы' : (user ? user.username : 'Пользователь')}</span>
                    <span class="message-time">${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="message-text">${msg.message}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Send message handler
    document.getElementById('adminSendMessage').addEventListener('click', function() {
        const message = document.getElementById('adminChatInput').value.trim();
        if (message) {
            storage.addChatMessage('admin', message, true);
            document.getElementById('adminChatInput').value = '';
            loadAdminChat();
        }
    });
}

function loadAdminTransactions() {
    const transactionsList = document.querySelector('.admin-transactions-list');
    const transactions = storage.getTransactions();
    const users = storage.getUsers();
    
    transactionsList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Тип</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(trx => {
                    const user = users.find(u => u.id === trx.userId);
                    const date = new Date(trx.date);
                    
                    return `
                        <tr>
                            <td>${trx.id.substr(4, 6)}</td>
                            <td>${user ? user.username : 'Unknown'} (${trx.userId})</td>
                            <td>${getTransactionType(trx.type)}</td>
                            <td>${trx.amount.toFixed(2)} ₽</td>
                            <td class="status-${trx.status}">${getTransactionStatus(trx.status)}</td>
                            <td>${date.toLocaleDateString()}</td>
                            <td>
                                ${trx.type === 'withdraw' && trx.status === 'pending' ? `
                                    <button class="approve-withdraw" data-id="${trx.id}">Одобрить</button>
                                ` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // Approve withdraw buttons
    document.querySelectorAll('.approve-withdraw').forEach(btn => {
        btn.addEventListener('click', function() {
            const trxId = this.getAttribute('data-id');
            const transactions = storage.getTransactions();
            const trxIndex = transactions.findIndex(t => t.id === trxId);
            
            if (trxIndex !== -1) {
                transactions[trxIndex].status = 'completed';
                storage.saveTransactions(transactions);
                loadAdminTransactions();
            }
        });
    });
}

function getTransactionType(type) {
    const types = {
        'deposit': 'Пополнение',
        'withdraw': 'Вывод',
        'admin_add': 'Админ. зачисление'
    };
    return types[type] || type;
}

function getTransactionStatus(status) {
    const statuses = {
        'pending': 'Ожидание',
        'completed': 'Завершено',
        'rejected': 'Отклонено'
    };
    return statuses[status] || status;
}