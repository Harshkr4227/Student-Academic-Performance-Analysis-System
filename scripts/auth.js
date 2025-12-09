// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sample data if not exists
    initializeSampleData();
    
    // Set up role-based form display
    setupRoleBasedForms();
    
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function initializeSampleData() {
    // Check if sample data already exists
    if (!localStorage.getItem('users')) {
        const sampleUsers = [
            {
                id: 'teacher1',
                email: 'teacher@demo.com',
                password: 'demo123',
                role: 'teacher',
                firstName: 'John',
                lastName: 'Smith',
                department: 'mathematics'
            },
            {
                id: 'student1',
                email: 'student@demo.com',
                password: 'demo123',
                role: 'student',
                firstName: 'Alice',
                lastName: 'Johnson',
                studentId: 'STU001'
            },
            {
                id: 'student2',
                email: 'bob@demo.com',
                password: 'demo123',
                role: 'student',
                firstName: 'Bob',
                lastName: 'Wilson',
                studentId: 'STU002'
            }
        ];
        
        localStorage.setItem('users', JSON.stringify(sampleUsers));
    }
}

function setupRoleBasedForms() {
    const roleInputs = document.querySelectorAll('input[name="role"]');
    roleInputs.forEach(input => {
        input.addEventListener('change', function() {
            const selectedRole = this.value;
            const studentIdGroup = document.getElementById('studentIdGroup');
            const studentDepartmentGroup = document.getElementById('studentDepartmentGroup');
            const departmentGroup = document.getElementById('departmentGroup');
            
            if (studentIdGroup && studentDepartmentGroup && departmentGroup) {
                if (selectedRole === 'student') {
                    studentIdGroup.style.display = 'block';
                    studentDepartmentGroup.style.display = 'block';
                    departmentGroup.style.display = 'none';
                    document.getElementById('studentId').required = true;
                    document.getElementById('studentDepartment').required = true;
                    document.getElementById('department').required = false;
                } else {
                    studentIdGroup.style.display = 'none';
                    studentDepartmentGroup.style.display = 'none';
                    departmentGroup.style.display = 'block';
                    document.getElementById('studentId').required = false;
                    document.getElementById('studentDepartment').required = false;
                    document.getElementById('department').required = true;
                }
            }
        });
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Find user
    const user = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        // Store current user session
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Show success message
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (role === 'teacher') {
                window.location.href = 'teacher-dashboard.html';
            } else {
                window.location.href = 'student-dashboard.html';
            }
        }, 1500);
    } else {
        showMessage('Invalid credentials. Please try again.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate password match
    if (password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error');
        return;
    }
    
    // Create new user object
    const newUser = {
        id: 'user_' + Date.now(),
        email: formData.get('email'),
        password: password,
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName')
    };
    
    if (newUser.role === 'student') {
        newUser.studentId = formData.get('studentId');
        newUser.department = formData.get('studentDepartment');
    } else {
        newUser.department = formData.get('department');
    }
    
    // Get existing users and add new user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === newUser.email)) {
        showMessage('Email already exists. Please use a different email.', 'error');
        return;
    }
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage('Registration successful! Please login with your credentials.', 'success');
    
    // Redirect to login page after delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

function togglePassword(inputId = 'password') {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existing = document.querySelector('.auth-message');
    if (existing) {
        existing.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `auth-message auth-message-${type}`;
    messageEl.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .message-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageEl);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentElement) {
            messageEl.remove();
        }
    }, 5000);
}