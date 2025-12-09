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

// Expose functions used by inline handlers (modules are not global by default)
if (typeof window !== 'undefined') {
    window.togglePassword = togglePassword;
    window.showMessage = showMessage;
}

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

    (async () => {
        try {
            // Prefer Supabase authentication if available
            let user = null;
            try {
                const mod = await import('./supabase.js');
                const supabase = await mod.getSupabaseClient();
                if (supabase) {
                    // Try signing in via Supabase (email + password)
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) {
                        console.warn('Supabase signIn error', error);
                    } else if (data && data.user) {
                        // Map to app user shape minimally
                        user = { id: data.user.id, email: data.user.email, role: role };
                    }
                }
            } catch (err) {
                // ignore and fall back to localStorage
            }

            if (!user) {
                // Get users from localStorage
                const users = JSON.parse(localStorage.getItem('users') || '[]');

                // Find user
                user = users.find(u =>
                    u.email === email &&
                    u.password === password &&
                    u.role === role
                );
            }

            if (user) {
                // Store current user session
                localStorage.setItem('currentUser', JSON.stringify(user));

                // Show success message
                showMessage('Login successful! Redirecting...', 'success');

                // Redirect based on role (short delay for UX).
                const target = (role === 'teacher') ? 'teacher-dashboard.html' : 'student-dashboard.html';
                setTimeout(() => window.location.href = target, 700);
                // Fallback navigation in case setTimeout doesn't run (very rare)
                setTimeout(() => { if (!window.location.href.endsWith(target)) window.location.assign(target); }, 1500);
            } else {
                showMessage('Invalid credentials. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Login flow error', err);
            showMessage('An unexpected error occurred during login. See console for details.', 'error');
        }
    })();
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
    
    (async () => {
        // Try to register via Supabase if available
        try {
            const mod = await import('./supabase.js');
            const supabase = await mod.getSupabaseClient();
            if (supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email: newUser.email,
                    password: newUser.password
                });
                if (error) {
                    console.warn('Supabase signUp error', error);
                } else if (data && data.user) {
                    // Optionally persist profile to 'users' table via Supabase
                    try {
                        await supabase.from('users').insert({
                            id: data.user.id,
                            email: newUser.email,
                            role: newUser.role,
                            firstName: newUser.firstName,
                            lastName: newUser.lastName,
                            studentId: newUser.studentId || null,
                            department: newUser.department || null
                        });
                    } catch (err) {
                        console.warn('Failed to persist user profile to Supabase', err);
                    }
                    showMessage('Registration successful! Please login with your credentials.', 'success');
                    setTimeout(() => window.location.href = 'login.html', 2000);
                    return;
                }
            }
        } catch (err) {
            // ignore and fall back to localStorage
        }

        // Fallback to localStorage
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
    })();
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