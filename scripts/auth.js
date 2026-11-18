import { supabase } from './supabase.js';
import { initTheme } from './theme.js';

export function showToast(message, type = 'info') {
  const old = document.querySelector('.toast-banner');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = `toast-banner toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export async function requireAuth(expectedRole = null) {
  if (!supabase) {
    showToast('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env', 'error');
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/pages/login.html';
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    await supabase.auth.signOut();
    window.location.href = '/pages/login.html';
    return null;
  }

  if (expectedRole && profile.role !== expectedRole) {
    window.location.href =
      profile.role === 'teacher' ? '/pages/teacher-dashboard.html' : '/pages/student-dashboard.html';
    return null;
  }

  return profile;
}

export async function logout() {
  if (supabase) await supabase.auth.signOut();
  window.location.href = '/pages/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  document.querySelectorAll('input[name="role"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const isStudent = e.target.value === 'student';
      const studentFields = document.getElementById('studentOnlyFields');
      if (studentFields) {
        studentFields.style.display = isStudent ? 'block' : 'none';
        document.getElementById('rollNo').required = isStudent;
        document.getElementById('currentSemester').required = isStudent;
      }
    });
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabase) return showToast('Configure .env first.', 'error');

      const fd = new FormData(loginForm);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fd.get('email').trim(),
        password: fd.get('password')
      });
      if (error) return showToast(error.message, 'error');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      window.location.href =
        profile?.role === 'teacher' ? '/pages/teacher-dashboard.html' : '/pages/student-dashboard.html';
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabase) return showToast('Configure .env first.', 'error');

      const fd = new FormData(registerForm);
      if (fd.get('password') !== fd.get('confirmPassword')) {
        return showToast('Passwords do not match.', 'error');
      }

      const role = fd.get('role');
      const { data, error } = await supabase.auth.signUp({
        email: fd.get('email').trim(),
        password: fd.get('password'),
        options: {
          data: {
            role,
            first_name: fd.get('firstName').trim(),
            last_name: fd.get('lastName').trim(),
            roll_no: role === 'student' ? fd.get('rollNo').trim().toUpperCase() : null,
            department: fd.get('department').trim(),
            current_semester: role === 'student' ? Number(fd.get('currentSemester')) : null
          }
        }
      });

      if (error) return showToast(error.message, 'error');
      if (!data.session) {
        showToast('Account created! Confirm email or sign in.', 'success');
        setTimeout(() => (window.location.href = '/pages/login.html'), 1800);
        return;
      }

      window.location.href =
        role === 'teacher' ? '/pages/teacher-dashboard.html' : '/pages/student-dashboard.html';
    });
  }
});
