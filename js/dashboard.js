document.addEventListener('DOMContentLoaded', function() {
    const storage = new Storage();
    
    // Check if user is logged in
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update UI with user data
    updateUserInfo(currentUser);
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-active');
    });
    
    // Navigation
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        if (item.id === 'logoutBtn') return;
        
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
                }
            });
            
            // Load section content if needed
            switch(section) {
                case 'profile':
                    loadProfileSection(currentUser);
                    break;
                case 'partner':
                    loadPartnerSection(currentUser);
                    break;
                case 'investments':
                    loadInvestmentsSection(currentUser);
                    break;
                case 'new-investment':
                    loadNewInvestmentSection(currentUser);
                    break;
                case 'info':
                    loadInfoSection();
                    break;
            }
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        storage.setCurrentUser(null);
        window.location.href = 'index.html';
    });
    
    // Quick actions
    document.getElementById('quickDeposit').addEventListener('click', function() {
        showModal('depositModal');
    });
    
    document.getElementById('quickWithdraw').addEventListener('click', function() {
        showModal('withdrawModal');
    });
    
    document.getElementById('quickInvest').addEventListener('click', function() {
        // Switch to new investment section
        navItems.forEach(navItem => navItem.classList.remove('active'));
        document.querySelector('.sidebar-nav li[data-section="new-investment"]').classList.add('active');
        
        contentSections.forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === 'newInvestmentSection') {
                sec.classList.add('active');
            }
        });
        
        loadNewInvestmentSection(currentUser);
    });
    
    // Modal handling
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Close modal when clicking X
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Deposit form
    document.getElementById('confirmDeposit').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('depositAmount').value);
        
        if (isNaN(amount) || amount < 100) {
            alert('Минимальная сумма пополнения - 100 ₽');
            return;
        }
        
        // Update user balance
        currentUser.balance += amount;
        storage.updateUser(currentUser);
        storage.setCurrentUser(currentUser);
        
        // Create transaction
        storage.createTransaction(currentUser.id, 'deposit', amount, 'completed');
        
        // Update UI
        updateUserInfo(currentUser);
        document.getElementById('depositModal').style.display = 'none';
        document.getElementById('depositAmount').value = '';
        
        alert(`Баланс успешно пополнен на ${amount} ₽`);
    });
    
    // Withdraw form
    document.getElementById('confirmWithdraw').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const wallet = document.getElementById('walletNumber').value;
        
        if (isNaN(amount) || amount < 20) {
            alert('Минимальная сумма вывода - 20 ₽');
            return;
        }
        
        if (amount > currentUser.balance) {
            alert('Недостаточно средств на балансе');
            return;
        }
        
        if (!wallet) {
            alert('Укажите номер кошелька');
            return;
        }
        
        // Update user balance
        currentUser.balance -= amount;
        currentUser.totalWithdrawn += amount;
        storage.updateUser(currentUser);
        storage.setCurrentUser(currentUser);
        
        // Create transaction
        const transaction = storage.createTransaction(currentUser.id, 'withdraw', amount, 'pending');
        transaction.wallet = wallet;
        
        // Update stats
        storage.updateStats({
            totalWithdrawn: amount
        });
        
        // Update UI
        updateUserInfo(currentUser);
        document.getElementById('withdrawModal').style.display = 'none';
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('walletNumber').value = '';
        
        alert(`Заявка на вывод ${amount} ₽ успешно создана. Ожидайте поступления средств.`);
    });
    
    // Load dashboard by default
    loadDashboardSection(currentUser);
});

function updateUserInfo(user) {
    document.getElementById('sidebarUsername').textContent = user.username;
    document.getElementById('sidebarBalance').textContent = `${user.balance.toFixed(2)} ₽`;
    document.getElementById('headerBalance').textContent = `${user.balance.toFixed(2)} ₽`;
    document.getElementById('welcomeUsername').textContent = user.username;
    
    // Update avatar if exists
    if (user.avatar) {
        document.getElementById('userAvatar').innerHTML = `<img src="${user.avatar}" alt="${user.username}">`;
    }
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function loadDashboardSection(user) {
    // Already loaded in HTML
}

function loadProfileSection(user) {
    const section = document.getElementById('profileSection');
    
    // Calculate days since registration
    const regDate = new Date(user.registrationDate);
    const today = new Date();
    const daysSinceReg = Math.floor((today - regDate) / (1000 * 60 * 60 * 24));
    
    // Get active investments count
    const activeInvestments = user.investments.length;
    
    section.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar" id="profileAvatar">
                ${user.avatar ? `<img src="${user.avatar}" alt="${user.username}">` : `<i class="fas fa-user"></i>`}
                <button id="changeAvatarBtn">Изменить</button>
            </div>
            <div class="profile-info">
                <h3>${user.username}</h3>
                <p>ID: ${user.id}</p>
                <p>На проекте: ${daysSinceReg} дней</p>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="stat-card">
                <h4>Активных вкладов</h4>
                <p>${activeInvestments}</p>
            </div>
            <div class="stat-card">
                <h4>Завершенных вкладов</h4>
                <p>${user.completedInvestments || 0}</p>
            </div>
            <div class="stat-card">
                <h4>Всего выведено</h4>
                <p>${user.totalWithdrawn ? user.totalWithdrawn.toFixed(2) : '0'} ₽</p>
            </div>
        </div>
        
        <div class="profile-balance">
            <h3>Баланс: ${user.balance.toFixed(2)} ₽</h3>
            <div class="balance-actions">
                <button class="btn-action" id="profileDepositBtn">
                    <i class="fas fa-plus-circle"></i> Пополнить
                </button>
                <button class="btn-action" id="profileWithdrawBtn">
                    <i class="fas fa-money-bill-wave"></i> Вывести
                </button>
            </div>
        </div>
        
        <div class="profile-referral">
            <h3>Партнёрская программа</h3>
            <p>Ваша реферальная ссылка:</p>
            <div class="referral-link">
                <input type="text" id="referralLink" value="${window.location.origin}/index.html?ref=${user.referralCode}" readonly>
                <button id="copyReferralBtn"><i class="fas fa-copy"></i></button>
            </div>
            <p>Приглашайте друзей и получайте бонусы!</p>
        </div>
    `;
    
    // Add event listeners for profile buttons
    document.getElementById('profileDepositBtn').addEventListener('click', function() {
        showModal('depositModal');
    });
    
    document.getElementById('profileWithdrawBtn').addEventListener('click', function() {
        showModal('withdrawModal');
    });
    
    document.getElementById('copyReferralBtn').addEventListener('click', function() {
        const linkInput = document.getElementById('referralLink');
        linkInput.select();
        document.execCommand('copy');
        alert('Ссылка скопирована в буфер обмена!');
    });
    
    document.getElementById('changeAvatarBtn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                    user.avatar = event.target.result;
                    storage.updateUser(user);
                    storage.setCurrentUser(user);
                    updateUserInfo(user);
                    loadProfileSection(user);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });
}

function loadPartnerSection(user) {
    const section = document.getElementById('partnerSection');
    
    // Get referred users
    const allUsers = storage.getUsers();
    const referredUsers = allUsers.filter(u => u.referredBy === user.referralCode);
    
    section.innerHTML = `
        <h2>Партнёрская программа</h2>
        
        <div class="partner-stats">
            <div class="stat-card">
                <h4>Приглашено пользователей</h4>
                <p>${referredUsers.length}</p>
            </div>
            <div class="stat-card">
                <h4>Заработано с партнёрки</h4>
                <p>${(referredUsers.length * 5).toFixed(2)} ₽</p>
            </div>
        </div>
        
        <div class="referral-info">
            <h3>Как это работает?</h3>
            <ul>
                <li>Вы получаете <strong>5 ₽</strong> за каждого приглашённого пользователя</li>
                <li>Дополнительно вы получаете <strong>150 ₽</strong>, если приглашённый пользователь пополнит баланс на 500 ₽ или более</li>
                <li>Ваша реферальная ссылка: <code>${window.location.origin}/index.html?ref=${user.referralCode}</code></li>
            </ul>
        </div>
        
        <div class="referral-users">
            <h3>Ваши рефералы</h3>
            ${referredUsers.length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Логин</th>
                            <th>Дата регистрации</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${referredUsers.map(u => `
                            <tr>
                                <td>${u.id}</td>
                                <td>${u.username}</td>
                                <td>${new Date(u.registrationDate).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>У вас пока нет рефералов</p>'}
        </div>
    `;
}

function loadInvestmentsSection(user) {
    const section = document.getElementById('investmentsSection');
    const allInvestments = storage.getInvestments();
    
    // Get user's investments
    const activeInvestments = allInvestments.filter(inv => 
        inv.userId === user.id && inv.status === 'active'
    );
    
    const completedInvestments = allInvestments.filter(inv => 
        inv.userId === user.id && inv.status === 'completed'
    );
    
    section.innerHTML = `
        <h2>Мои вклады</h2>
        
        <div class="investments-tabs">
            <button class="invest-tab active" data-tab="active">Активные</button>
            <button class="invest-tab" data-tab="completed">Завершенные</button>
        </div>
        
        <div class="investments-content">
            <div class="investments-list active" id="activeInvestmentsList">
                ${activeInvestments.length > 0 ? 
                    activeInvestments.map(inv => renderInvestment(inv)).join('') :
                    '<p>У вас нет активных вкладов</p>'
                }
            </div>
            
            <div class="investments-list" id="completedInvestmentsList">
                ${completedInvestments.length > 0 ? 
                    completedInvestments.map(inv => renderInvestment(inv)).join('') :
                    '<p>У вас нет завершенных вкладов</p>'
                }
            </div>
        </div>
    `;
    
    // Tab switching
    const investTabs = document.querySelectorAll('.invest-tab');
    const investLists = document.querySelectorAll('.investments-list');
    
    investTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            investTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding list
            investLists.forEach(list => {
                list.classList.remove('active');
                if (list.id === `${tabName}InvestmentsList`) {
                    list.classList.add('active');
                }
            });
        });
    });
}

function renderInvestment(investment) {
    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const now = new Date();
    const isActive = investment.status === 'active';
    const progress = isActive ? 
        Math.min(100, ((now - startDate) / (endDate - startDate)) * 100) : 
        100;
    
    return `
        <div class="investment-card ${isActive ? 'active' : 'completed'}">
            <div class="investment-header">
                <h4>Вклад #${investment.id.substr(4, 6)}</h4>
                <span class="investment-status">${isActive ? 'Активный' : 'Завершен'}</span>
            </div>
            
            <div class="investment-details">
                <div class="detail">
                    <span>Сумма:</span>
                    <span>${investment.amount.toFixed(2)} ₽</span>
                </div>
                <div class="detail">
                    <span>Срок:</span>
                    <span>${investment.days} дней</span>
                </div>
                <div class="detail">
                    <span>Процентная ставка:</span>
                    <span>${investment.interestRate}%</span>
                </div>
                <div class="detail">
                    <span>Прибыль:</span>
                    <span>+${investment.profit.toFixed(2)} ₽</span>
                </div>
                <div class="detail">
                    <span>${isActive ? 'Завершится:' : 'Завершен:'}</span>
                    <span>${endDate.toLocaleDateString()}</span>
                </div>
            </div>
            
            ${isActive ? `
                <div class="investment-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <span>${Math.round(progress)}%</span>
                </div>
            ` : ''}
        </div>
    `;
}

function loadNewInvestmentSection(user) {
    const section = document.getElementById('newInvestmentSection');
    
    section.innerHTML = `
        <h2>Открыть новый вклад</h2>
        
        <div class="investment-options">
            <div class="option-card" data-days="3" data-rate="4" data-min="50">
                <h3>3 дня</h3>
                <div class="option-rate">
                    <span>4%</span>
                    <small>от суммы вклада</small>
                </div>
                <div class="option-min">
                    <span>Мин. сумма: 50 ₽</span>
                </div>
                <button class="btn-select">Выбрать</button>
            </div>
            
            <div class="option-card" data-days="7" data-rate="8" data-min="100">
                <h3>7 дней</h3>
                <div class="option-rate">
                    <span>8%</span>
                    <small>от суммы вклада</small>
                </div>
                <div class="option-min">
                    <span>Мин. сумма: 100 ₽</span>
                </div>
                <button class="btn-select">Выбрать</button>
            </div>
            
            <div class="option-card" data-days="15" data-rate="16" data-min="200">
                <h3>15 дней</h3>
                <div class="option-rate">
                    <span>16%</span>
                    <small>от суммы вклада</small>
                </div>
                <div class="option-min">
                    <span>Мин. сумма: 200 ₽</span>
                </div>
                <button class="btn-select">Выбрать</button>
            </div>
        </div>
        
        <div class="investment-form" id="investmentForm" style="display: none;">
            <h3 id="formTitle">Открыть вклад на <span id="formDays">3</span> дней</h3>
            <p>Процентная ставка: <span id="formRate">4</span>%</p>
            <p>Минимальная сумма: <span id="formMin">50</span> ₽</p>
            
            <div class="form-group">
                <input type="number" id="investmentAmount" min="50" step="1">
                <label for="investmentAmount">Сумма вклада (₽)</label>
            </div>
            
            <div class="form-summary">
                <p>Через <span id="summaryDays">3</span> дней вы получите: <span id="summaryTotal">0.00</span> ₽</p>
                <p>Ваша прибыль: <span id="summaryProfit">0.00</span> ₽</p>
            </div>
            
            <button class="btn-submit" id="confirmInvestment">Открыть вклад</button>
        </div>
    `;
    
    // Option selection
    const optionCards = document.querySelectorAll('.option-card');
    const investmentForm = document.getElementById('investmentForm');
    
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const days = this.getAttribute('data-days');
            const rate = this.getAttribute('data-rate');
            const min = this.getAttribute('data-min');
            
            // Update form
            document.getElementById('formDays').textContent = days;
            document.getElementById('formRate').textContent = rate;
            document.getElementById('formMin').textContent = min;
            document.getElementById('summaryDays').textContent = days;
            
            // Update input min
            document.getElementById('investmentAmount').min = min;
            document.getElementById('investmentAmount').value = '';
            
            // Show form
            investmentForm.style.display = 'block';
            
            // Scroll to form
            investmentForm.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Calculate profit on input change
    document.getElementById('investmentAmount').addEventListener('input', function() {
        const amount = parseFloat(this.value) || 0;
        const rate = parseFloat(document.getElementById('formRate').textContent);
        const min = parseFloat(document.getElementById('formMin').textContent);
        
        if (amount < min) {
            document.getElementById('summaryTotal').textContent = '0.00';
            document.getElementById('summaryProfit').textContent = '0.00';
            return;
        }
        
        const profit = amount * (rate / 100);
        const total = amount + profit;
        
        document.getElementById('summaryTotal').textContent = total.toFixed(2);
        document.getElementById('summaryProfit').textContent = profit.toFixed(2);
    });
    
    // Confirm investment
    document.getElementById('confirmInvestment').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('investmentAmount').value);
        const days = parseInt(document.getElementById('formDays').textContent);
        const rate = parseInt(document.getElementById('formRate').textContent);
        const min = parseInt(document.getElementById('formMin').textContent);
        
        if (isNaN(amount) || amount < min) {
            alert(`Минимальная сумма вклада - ${min} ₽`);
            return;
        }
        
        if (amount > user.balance) {
            alert('Недостаточно средств на балансе');
            return;
        }
        
        // Deduct from balance
        user.balance -= amount;
        storage.updateUser(user);
        storage.setCurrentUser(user);
        
        // Create investment
        storage.createInvestment(user.id, amount, days, rate);
        
        // Update stats
        storage.updateStats({
            activeInvestments: 1
        });
        
        // Update UI
        updateUserInfo(user);
        
        // Show success message
        alert(`Вклад на ${amount} ₽ успешно открыт! Через ${days} дней вы получите ${(amount + (amount * (rate / 100))).toFixed(2)} ₽`);
        
        // Reset form
        investmentForm.style.display = 'none';
        document.getElementById('investmentAmount').value = '';
        
        // Reload investments section
        loadInvestmentsSection(user);
    });
}

function loadInfoSection() {
    const section = document.getElementById('infoSection');
    const stats = storage.getStats();
    
    section.innerHTML = `
        <h2>Информация о проекте</h2>
        
        <div class="project-stats">
            <div class="stat-card">
                <h4>Дата запуска</h4>
                <p>${new Date(stats.startDate).toLocaleDateString()}</p>
            </div>
            <div class="stat-card">
                <h4>Всего пользователей</h4>
                <p>${stats.totalUsers}</p>
            </div>
            <div class="stat-card">
                <h4>Новых сегодня</h4>
                <p>${stats.newUsersToday}</p>
            </div>
            <div class="stat-card">
                <h4>Активных вкладов</h4>
                <p>${stats.activeInvestments}</p>
            </div>
            <div class="stat-card">
                <h4>Завершенных вкладов</h4>
                <p>${stats.completedInvestments}</p>
            </div>
            <div class="stat-card">
                <h4>Всего выплачено</h4>
                <p>${stats.totalWithdrawn.toFixed(2)} ₽</p>
            </div>
        </div>
        
        <div class="rules-section">
            <h3>Правила проекта</h3>
            <div class="rules-content">
                <ol>
                    <li>Запрещено пересылать сообщения от бота администрации с текстом заявки о выплате раньше чем через 24 часа с момента подачи заявки</li>
                    <li>Запрещено использовать ошибки (если они есть) с целью накрутки баланса.</li>
                    <li>Запрещено накручивать рефералов.</li>
                    <li>Используя данный бот, вы автоматически соглашаетесь с правилами; любые ваши операции и действия на проекте расцениваются администрацией как ваше согласие на их проведение.</li>
                    <li>Администрация бота не несет ответственности за любые финансовые убытки, произошедшие по вине участника системы, а также в случае непредвиденных, форс-мажорных обстоятельств, и не обязана возмещать ваши возможные убытки.</li>
                    <li>В случае банкротства бота пополнения перестают приниматься, вклады аннулируются, все средства медленно, но верно возвращаются пользователям.</li>
                    <li>В случае грубых нарушений администратор вправе заблокировать пользователя в боте или обнулить баланс</li>
                </ol>
            </div>
        </div>
        
        <div class="faq-section">
            <h3>Как это работает?</h3>
            <div class="faq-content">
                <p>1. Пользователь пополняет баланс.</p>
                <p>4. По истечению срока вклада Администратор выплачивает вклад + процент пользователю от заработанных денег и оставляет часть себе.</p>
                <p>5. Пользователь выводит деньги</p>
            </div>
        </div>
        
        <div class="support-section">
            <h3>Чат поддержки</h3>
            <div class="chat-container" id="supportChat">
                <!-- Сообщения чата будут здесь -->
            </div>
            <div class="chat-input">
                <input type="text" id="supportMessage" placeholder="Введите ваше сообщение...">
                <button id="sendSupportMessage"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    
    // Load chat messages
    loadChatMessages();
    
    // Send message handler
    document.getElementById('sendSupportMessage').addEventListener('click', function() {
        const message = document.getElementById('supportMessage').value.trim();
        if (message) {
            const currentUser = storage.getCurrentUser();
            storage.addChatMessage(currentUser.id, message);
            document.getElementById('supportMessage').value = '';
            loadChatMessages();
        }
    });
}

function loadChatMessages() {
    const chatContainer = document.getElementById('supportChat');
    if (!chatContainer) return;
    
    const messages = storage.getChatMessages();
    const currentUser = storage.getCurrentUser();
    
    chatContainer.innerHTML = messages.map(msg => {
        const isCurrentUser = msg.userId === currentUser.id;
        const date = new Date(msg.timestamp);
        
        return `
            <div class="message ${isCurrentUser ? 'user' : 'admin'}">
                <div class="message-header">
                    <span class="message-sender">${isCurrentUser ? 'Вы' : 'Администратор'}</span>
                    <span class="message-time">${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="message-text">${msg.message}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}