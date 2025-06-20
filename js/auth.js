document.addEventListener('DOMContentLoaded', function() {
    const storage = new Storage();
    
    // Check if user is already logged in
    const currentUser = storage.getCurrentUser();
    if (currentUser && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            const user = storage.getUserByUsername(username);
            
            if (user && user.password === password) {
                // Successful login
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify({
                        username,
                        password
                    }));
                }
                
                storage.setCurrentUser(user);
                window.location.href = 'dashboard.html';
            } else {
                // Failed login
                alert('Неверный логин или пароль');
            }
        });
    }
    
    // Registration form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            
            // Validate inputs
            if (password !== confirmPassword) {
                alert('Пароли не совпадают');
                return;
            }
            
            if (storage.getUserByUsername(username)) {
                alert('Пользователь с таким логином уже существует');
                return;
            }
            
            // Create new user
            const newUser = storage.createUser(username, password);
            
            // Update stats
            const stats = storage.getStats();
            stats.totalUsers += 1;
            stats.newUsersToday += 1;
            storage.saveStats(stats);
            
            // Log in the new user
            storage.setCurrentUser(newUser);
            window.location.href = 'dashboard.html';
        });
    }
    
    // Check for remembered user
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser && window.location.pathname.endsWith('index.html')) {
        const { username, password } = JSON.parse(rememberedUser);
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = password;
        document.getElementById('rememberMe').checked = true;
    }
    
    // Create particles for background
    createParticles();
});

function createParticles() {
    const container = document.querySelector('.auth-particles');
    if (!container) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 10 + 5;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 10 + 10;
        const color = `hsl(${Math.random() * 60 + 270}, 100%, ${Math.random() * 30 + 50}%)`;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.background = color;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.boxShadow = `0 0 ${size}px ${size/2}px ${color}`;
        
        container.appendChild(particle);
    }
}