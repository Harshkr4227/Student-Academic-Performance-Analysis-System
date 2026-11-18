import { requireAuth, logout, showToast } from './auth.js';
import { db, exportToCSV } from './data.js';
import { initTheme, getChartThemeColors } from './theme.js';

let profile = null;
let cachedMarksheet = [];
let marksChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  profile = await requireAuth('student');
  if (!profile) return;

  const initials = `${profile.first_name?.[0] || 'S'}${profile.last_name?.[0] || 'U'}`.toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = `${profile.first_name} ${profile.last_name}`;
  document.getElementById('sidebarRoll').textContent = profile.roll_no;
  document.getElementById('studentBannerAvatar').textContent = initials;
  document.getElementById('studentBannerName').textContent = `${profile.first_name} ${profile.last_name}`;
  document.getElementById('studentBannerRoll').textContent = profile.roll_no;
  document.getElementById('studentBannerDept').textContent = profile.department;
  document.getElementById('studentBannerSem').textContent = `Semester ${profile.current_semester}`;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.querySelectorAll('.nav-item').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.dashboard-section').forEach((s) => s.classList.remove('active'));
      document.getElementById(link.dataset.section).classList.add('active');
    });
  });

  window.addEventListener('themechange', () => renderStudentMarksChart());

  document.getElementById('exportMarksheetBtn').addEventListener('click', () => {
    if (!cachedMarksheet.length) return showToast('No marks available to export.', 'error');
    exportToCSV(
      `${profile.roll_no}_Grade_Card.csv`,
      cachedMarksheet.map((m) => ({
        Roll_No: profile.roll_no,
        Subject_Code: m.subject_code,
        Subject_Name: m.subjects?.name || '',
        Credits: m.subjects?.credits || 0,
        CA1_15: m.ca1_marks,
        CA2_15: m.ca2_marks,
        Internal_30: m.internal_total,
        End_Sem_70: m.end_sem_marks,
        Total_100: m.total_marks,
        Letter_Grade: m.letter_grade,
        Grade_Point: m.grade_point,
        Backlog: m.is_backlog ? 'YES' : 'NO'
      }))
    );
  });

  document.getElementById('goalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await db.addStudentGoal({
        student_id: profile.id,
        title: fd.get('title'),
        category: fd.get('category'),
        target_value: fd.get('targetValue'),
        progress: Number(fd.get('progress') || 0),
        deadline: fd.get('deadline')
      });
      e.target.reset();
      showToast('Goal saved!', 'success');
      await loadGoals();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  await loadStudentPortal();
});

async function loadStudentPortal() {
  try {
    const [summary, subjects, marksheet, subAttendance, interventions] = await Promise.all([
      db.getStudentSummary(profile.id),
      db.getStudentEnrollments(profile.id),
      db.getStudentMarksheet(profile.id),
      db.getStudentSubjectAttendance(profile.id),
      db.getInterventions(profile.id)
    ]);

    cachedMarksheet = marksheet;

    document.getElementById('kpiCGPA').textContent = Number(summary.cgpa).toFixed(2);
    document.getElementById('kpiAttendance').textContent = `${summary.attendance_pct}%`;
    document.getElementById('kpiBacklogs').textContent = summary.active_backlogs;
    document.getElementById('kpiRisk').innerHTML =
      `<span class="badge badge-${summary.risk_level}">${summary.risk_level.toUpperCase()} (${summary.risk_score})</span>`;

    const flags = summary.risk_flags || [];
    document.getElementById('studentRiskAlerts').innerHTML = flags.length
      ? flags.map((f) => `<div class="list-row"><span>University Rule Alert</span><span class="badge badge-high">${f}</span></div>`).join('')
      : '<p class="muted">No active academic or attendance warnings.</p>';

    document.getElementById('studentInterventions').innerHTML = interventions.length
      ? interventions
          .map(
            (i) => `<div class="list-row">
              <div><strong>${i.category}</strong><div class="muted">${i.action_taken}</div></div>
              <span class="badge">${new Date(i.created_at).toLocaleDateString()}</span>
            </div>`
          )
          .join('')
      : '<p class="muted">No faculty interventions logged.</p>';

    renderStudentMarksChart();

    document.getElementById('marksheetBody').innerHTML = marksheet.length
      ? marksheet
          .map(
            (m) => `<tr>
              <td><strong>${m.subject_code}</strong> — ${m.subjects?.name || ''}</td>
              <td><span class="badge badge-info">${m.subjects?.credits || '-'} Cr</span></td>
              <td>${m.ca1_marks}</td>
              <td>${m.ca2_marks}</td>
              <td><strong>${m.internal_total}/30</strong></td>
              <td>${m.end_sem_marks}/70</td>
              <td><strong>${m.total_marks}/100</strong></td>
              <td><span class="badge ${m.is_backlog ? 'badge-high' : 'badge-low'}">${m.letter_grade} (${m.grade_point} GP)</span></td>
              <td>${m.remarks || '-'}</td>
            </tr>`
          )
          .join('')
      : '<tr><td colspan="9" class="muted">No subject marks published yet.</td></tr>';

    document.getElementById('attendanceTableBody').innerHTML = subAttendance.length
      ? subAttendance
          .map(
            (a) => `<tr>
              <td><strong>${a.subject_code}</strong> — ${a.subject_name}</td>
              <td><span class="badge badge-present">${a.present_classes}</span></td>
              <td><span class="badge badge-late">${a.late_classes}</span></td>
              <td><span class="badge badge-absent">${a.absent_classes}</span></td>
              <td>${a.total_classes}</td>
              <td><span class="badge ${a.attendance_pct < 75 ? 'badge-high' : 'badge-low'}">${a.attendance_pct}%</span></td>
            </tr>`
          )
          .join('')
      : '<tr><td colspan="6" class="muted">Not enrolled in any subjects yet.</td></tr>';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    document.getElementById('timetableGrid').innerHTML = days
      .map((day) => {
        const slots = subjects.filter((s) => s.schedule && s.schedule[day]);
        return `<div class="card">
          <h4>${day}</h4>
          ${
            slots.length
              ? slots
                  .map(
                    (s) =>
                      `<div class="list-row">
                        <div><strong>${s.code}: ${s.name}</strong><div class="muted">${s.room}</div></div>
                        <span class="badge badge-info">${s.schedule[day]}</span>
                      </div>`
                  )
                  .join('')
              : '<p class="muted" style="margin-top:0.5rem;">No classes scheduled</p>'
          }
        </div>`;
      })
      .join('');

    await loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStudentMarksChart() {
  const ctx = document.getElementById('marksChart');
  if (!ctx) return;
  const chartColors = getChartThemeColors();
  if (marksChartInstance) marksChartInstance.destroy();

  marksChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cachedMarksheet.map((m) => m.subject_code),
      datasets: [
        {
          label: 'Internal Marks (30)',
          data: cachedMarksheet.map((m) => m.internal_total),
          backgroundColor: chartColors.accent,
          borderRadius: 6
        },
        {
          label: 'End-Sem Marks (70)',
          data: cachedMarksheet.map((m) => m.end_sem_marks),
          backgroundColor: chartColors.secondary,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: chartColors.text } } },
      scales: {
        x: { stacked: true, ticks: { color: chartColors.text }, grid: { color: chartColors.border } },
        y: { stacked: true, min: 0, max: 100, ticks: { color: chartColors.text }, grid: { color: chartColors.border } }
      }
    }
  });
}

async function loadGoals() {
  const goals = await db.getStudentGoals(profile.id);
  const el = document.getElementById('goalsGrid');
  el.innerHTML = goals.length
    ? goals
        .map(
          (g) => `<div class="card">
            <div class="row-between">
              <h4>${g.title}</h4>
              <button class="btn btn-danger btn-sm" data-del="${g.id}">Delete</button>
            </div>
            <p class="muted">${g.category} • Target: ${g.target_value} • Due: ${g.deadline}</p>
            <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
          </div>`
        )
        .join('')
    : '<p class="muted">No academic goals set yet.</p>';

  el.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await db.deleteStudentGoal(btn.dataset.del);
      await loadGoals();
    });
  });
}
