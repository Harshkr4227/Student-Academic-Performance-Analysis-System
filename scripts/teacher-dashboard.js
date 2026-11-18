import { requireAuth, logout, showToast } from './auth.js';
import { db, exportToCSV } from './data.js';
import { initTheme, getChartThemeColors } from './theme.js';

let profile = null;
let allSummaries = [];
let allStudentsRoster = [];
let enrolledSet = new Set();
let activeRiskFilter = 'all';
let overviewChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  profile = await requireAuth('teacher');
  if (!profile) return;

  const initials = `${profile.first_name?.[0] || 'P'}${profile.last_name?.[0] || 'F'}`.toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = `Prof. ${profile.first_name} ${profile.last_name}`;
  document.getElementById('sidebarDept').textContent = profile.department;
  document.getElementById('facultyBannerAvatar').textContent = initials;
  document.getElementById('facultyBannerName').textContent = `Prof. ${profile.first_name} ${profile.last_name}`;
  document.getElementById('facultyBannerDept').textContent = profile.department;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Sidebar section switching
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.dashboard-section').forEach((s) => s.classList.remove('active'));
      document.getElementById(item.dataset.section).classList.add('active');
    });
  });

  // Segmented Risk Filter Pills + Search Input in Command Bar
  document.querySelectorAll('[data-risk-filter]').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-risk-filter]').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeRiskFilter = pill.dataset.riskFilter;
      renderStudentDirectoryTable();
    });
  });

  document.getElementById('globalStudentSearch').addEventListener('input', () => {
    renderStudentDirectoryTable();
    renderMultiSelectRoster();
  });

  // Re-render chart on Light/Dark theme change
  window.addEventListener('themechange', () => renderFacultyChart());

  // Export CSV (Package 3)
  document.getElementById('exportClassCSVBtn').addEventListener('click', () => {
    if (!allSummaries.length) return showToast('No student data to export.', 'error');
    exportToCSV(
      'CSE_DS_Academic_Performance_Report.csv',
      allSummaries.map((s) => ({
        Roll_No: s.roll_no,
        Name: s.full_name,
        Semester: s.current_semester,
        CGPA_10: s.cgpa,
        Avg_Internal_30: s.avg_internal_30,
        Avg_Total_100: s.avg_total_100,
        Attendance_Pct: s.attendance_pct,
        Active_Backlogs: s.active_backlogs,
        Risk_Score_100: s.risk_score,
        Risk_Level: s.risk_level.toUpperCase(),
        Rule_Flags: (s.risk_flags || []).join(' | ')
      }))
    );
  });

  // Create Subject Form
  document.getElementById('createSubjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await db.createSubject({
        code: document.getElementById('newSubCode').value,
        name: document.getElementById('newSubName').value,
        department: profile.department,
        semester: 5,
        credits: document.getElementById('newSubCredits').value,
        facultyId: profile.id,
        room: document.getElementById('newSubRoom').value
      });
      showToast('Subject added! Select it below to enroll batch students.', 'success');
      e.target.reset();
      await refreshFacultyDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Interactive Multi-Select Batch Enrollment (3A)
  document.getElementById('enrollSubjectSelect').addEventListener('change', loadSubjectEnrollmentState);

  document.getElementById('selectAllUnenrolledBtn').addEventListener('click', () => {
    document.querySelectorAll('.enroll-check:not(:disabled)').forEach((cb) => {
      cb.checked = true;
    });
  });

  document.getElementById('enrollSelectedBtn').addEventListener('click', async () => {
    const subjectCode = document.getElementById('enrollSubjectSelect').value;
    if (!subjectCode) return showToast('Select a subject first.', 'error');

    const selectedIds = Array.from(document.querySelectorAll('.enroll-check:checked:not(:disabled)')).map(
      (cb) => cb.value
    );
    if (!selectedIds.length) return showToast('Select at least one unenrolled student.', 'error');

    try {
      await db.enrollStudentsBatch(subjectCode, selectedIds);
      showToast(`Enrolled ${selectedIds.length} student(s) into ${subjectCode}!`, 'success');
      await loadSubjectEnrollmentState();
      await refreshFacultyDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // University Marks Entry (CA1 + CA2 + End-Sem)
  document.getElementById('marksSubjectSelect').addEventListener('change', loadSubjectGradingTable);
  document.getElementById('saveMarksBtn').addEventListener('click', saveAllSubjectMarks);

  // Subject Attendance Entry
  const attDate = document.getElementById('attendanceDate');
  attDate.value = new Date().toISOString().split('T')[0];
  document.getElementById('attendanceSubjectSelect').addEventListener('change', loadSubjectAttendanceTable);
  attDate.addEventListener('change', loadSubjectAttendanceTable);
  document.getElementById('markAllPresentBtn').addEventListener('click', () => {
    document.querySelectorAll('.att-status').forEach((sel) => (sel.value = 'present'));
  });
  document.getElementById('saveAttendanceBtn').addEventListener('click', saveSubjectAttendance);

  await refreshFacultyDashboard();
});

async function refreshFacultyDashboard() {
  try {
    const [summaries, subjects, roster, interventions] = await Promise.all([
      db.getAllStudentSummaries(),
      db.getFacultySubjects(profile.id),
      db.getAllStudentsRoster(),
      db.getInterventions()
    ]);

    allSummaries = summaries;
    allStudentsRoster = roster;

    document.getElementById('facultySubjectCount').textContent = subjects.length;
    document.getElementById('facultyBatchCount').textContent = summaries.length;

    const subjectOpts =
      '<option value="">Select Subject</option>' +
      subjects.map((s) => `<option value="${s.code}">${s.code} — ${s.name} (${s.credits} Cr)</option>`).join('');

    ['enrollSubjectSelect', 'marksSubjectSelect', 'attendanceSubjectSelect'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const prev = el.value;
      el.innerHTML = subjectOpts;
      if (prev) el.value = prev;
    });

    // KPI Cards
    const total = summaries.length;
    const avgCGPA = total
      ? (summaries.reduce((acc, s) => acc + Number(s.cgpa), 0) / total).toFixed(2)
      : '0.00';
    const avgAtt = total
      ? (summaries.reduce((acc, s) => acc + Number(s.attendance_pct), 0) / total).toFixed(1)
      : '100.0';
    const highRiskCount = summaries.filter((s) => s.risk_level === 'high').length;

    document.getElementById('kpiTotalStudents').textContent = total;
    document.getElementById('kpiAvgCGPA').textContent = avgCGPA;
    document.getElementById('kpiAvgAttendance').textContent = `${avgAtt}%`;
    document.getElementById('kpiHighRisk').textContent = highRiskCount;

    renderFacultyChart();
    renderStudentDirectoryTable();
    await loadSubjectEnrollmentState();
    renderRiskInterventions(interventions);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderFacultyChart() {
  const ctx = document.getElementById('facultyPerformanceChart');
  if (!ctx) return;
  const chartColors = getChartThemeColors();
  if (overviewChart) overviewChart.destroy();

  const slice = allSummaries.slice(0, 20);
  overviewChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: slice.map((s) => s.roll_no),
      datasets: [
        {
          label: 'CGPA (10-Pt Scale)',
          data: slice.map((s) => s.cgpa),
          backgroundColor: chartColors.accent,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Risk Index (0–100)',
          data: slice.map((s) => s.risk_score),
          backgroundColor: chartColors.secondary,
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: chartColors.text } } },
      scales: {
        x: { ticks: { color: chartColors.text }, grid: { color: chartColors.border } },
        y: { min: 0, max: 10, position: 'left', ticks: { color: chartColors.text }, grid: { color: chartColors.border } },
        y1: { min: 0, max: 100, position: 'right', ticks: { color: chartColors.text }, grid: { drawOnChartArea: false } }
      }
    }
  });
}

function renderStudentDirectoryTable() {
  const query = (document.getElementById('globalStudentSearch')?.value || '').toLowerCase().trim();
  const filtered = allSummaries.filter((s) => {
    const matchesRisk = activeRiskFilter === 'all' || s.risk_level === activeRiskFilter;
    const matchesQuery =
      !query ||
      (s.roll_no || '').toLowerCase().includes(query) ||
      (s.full_name || '').toLowerCase().includes(query);
    return matchesRisk && matchesQuery;
  });

  document.getElementById('studentDirectoryBody').innerHTML = filtered.length
    ? filtered
        .map(
          (s) => `<tr>
            <td><strong>${s.roll_no}</strong></td>
            <td>${s.full_name}</td>
            <td><span class="badge badge-info">Sem ${s.current_semester}</span></td>
            <td><strong>${Number(s.cgpa).toFixed(2)}</strong></td>
            <td>${s.avg_internal_30}/30</td>
            <td><span class="badge ${s.attendance_pct < 75 ? 'badge-high' : 'badge-low'}">${s.attendance_pct}%</span></td>
            <td><span class="badge ${s.active_backlogs > 0 ? 'badge-high' : 'badge-low'}">${s.active_backlogs}</span></td>
            <td><span class="badge badge-${s.risk_level}">${s.risk_level.toUpperCase()} (${s.risk_score})</span></td>
            <td>${
              (s.risk_flags || []).length
                ? s.risk_flags.map((f) => `<span class="badge badge-high" style="margin-right:4px;">${f}</span>`).join('')
                : '<span class="badge badge-low">On Track</span>'
            }</td>
          </tr>`
        )
        .join('')
    : '<tr><td colspan="9" class="muted">No matching students found.</td></tr>';
}

async function loadSubjectEnrollmentState() {
  const subjectCode = document.getElementById('enrollSubjectSelect')?.value;
  if (!subjectCode) {
    enrolledSet = new Set();
    renderMultiSelectRoster();
    return;
  }
  enrolledSet = await db.getSubjectEnrollmentIds(subjectCode);
  renderMultiSelectRoster();
}

function renderMultiSelectRoster() {
  const tbody = document.getElementById('batchEnrollmentBody');
  if (!tbody) return;
  const subjectCode = document.getElementById('enrollSubjectSelect')?.value;
  const query = (document.getElementById('globalStudentSearch')?.value || '').toLowerCase().trim();

  const rows = allStudentsRoster.filter(
    (s) =>
      !query ||
      (s.roll_no || '').toLowerCase().includes(query) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(query)
  );

  tbody.innerHTML = rows
    .map((s) => {
      const isEnrolled = subjectCode && enrolledSet.has(s.id);
      return `<tr>
        <td>
          <input type="checkbox" class="enroll-check" value="${s.id}" ${isEnrolled ? 'checked disabled' : ''} />
        </td>
        <td><strong>${s.roll_no}</strong></td>
        <td>${s.first_name} ${s.last_name}</td>
        <td>${s.department}</td>
        <td>
          ${
            !subjectCode
              ? '<span class="badge">Select Subject Above</span>'
              : isEnrolled
              ? `<span class="badge badge-low">Enrolled in ${subjectCode}</span>`
              : '<span class="badge badge-warning">Not Enrolled</span>'
          }
        </td>
      </tr>`;
    })
    .join('');
}

async function loadSubjectGradingTable() {
  const subjectCode = document.getElementById('marksSubjectSelect').value;
  const tbody = document.getElementById('marksEntryBody');
  if (!subjectCode) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Select a subject above to enter marks.</td></tr>';
    return;
  }

  const [students, marks] = await Promise.all([
    db.getEnrolledStudentsBySubject(subjectCode),
    db.getSubjectMarks(subjectCode)
  ]);

  if (!students.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="muted">No students enrolled in this subject yet. Use the Enrollment tab first.</td></tr>';
    return;
  }

  const markMap = new Map(marks.map((m) => [m.student_id, m]));
  tbody.innerHTML = students
    .map((s) => {
      const m = markMap.get(s.id);
      return `<tr data-student-row="${s.id}">
        <td><strong>${s.roll_no}</strong></td>
        <td>${s.first_name} ${s.last_name}</td>
        <td><input type="number" min="0" max="15" step="0.5" class="input ca1-in" value="${m ? m.ca1_marks : 0}" style="width:82px;"></td>
        <td><input type="number" min="0" max="15" step="0.5" class="input ca2-in" value="${m ? m.ca2_marks : 0}" style="width:82px;"></td>
        <td><input type="number" min="0" max="70" step="0.5" class="input end-in" value="${m ? m.end_sem_marks : 0}" style="width:88px;"></td>
        <td>
          ${
            m
              ? `<span class="badge ${m.is_backlog ? 'badge-high' : 'badge-low'}">${m.total_marks}/100 • Grade ${m.letter_grade} (${m.grade_point} GP)</span>`
              : '<span class="badge">Pending</span>'
          }
        </td>
        <td><input type="text" class="input rem-in" value="${m?.remarks || ''}" placeholder="Faculty feedback"></td>
      </tr>`;
    })
    .join('');
}

async function saveAllSubjectMarks() {
  const subjectCode = document.getElementById('marksSubjectSelect').value;
  if (!subjectCode) return showToast('Select a subject first.', 'error');

  const rows = document.querySelectorAll('[data-student-row]');
  let saved = 0;
  for (const row of rows) {
    const studentId = row.dataset.studentRow;
    const ca1 = Number(row.querySelector('.ca1-in').value || 0);
    const ca2 = Number(row.querySelector('.ca2-in').value || 0);
    const endSem = Number(row.querySelector('.end-in').value || 0);
    const remarks = row.querySelector('.rem-in').value.trim();

    if (ca1 < 0 || ca1 > 15 || ca2 < 0 || ca2 > 15 || endSem < 0 || endSem > 70) {
      return showToast('Invalid marks range: CA1/CA2 (0–15), End-Sem (0–70).', 'error');
    }

    await db.upsertSubjectMark({
      studentId,
      subjectCode,
      ca1,
      ca2,
      endSem,
      remarks,
      updatedBy: profile.id
    });
    saved++;
  }

  showToast(`Saved & auto-graded ${saved} student mark record(s)!`, 'success');
  await loadSubjectGradingTable();
  await refreshFacultyDashboard();
}

async function loadSubjectAttendanceTable() {
  const subjectCode = document.getElementById('attendanceSubjectSelect').value;
  const date = document.getElementById('attendanceDate').value;
  const tbody = document.getElementById('attendanceEntryBody');
  if (!subjectCode || !date) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Select a subject and date above.</td></tr>';
    return;
  }

  const [students, existing] = await Promise.all([
    db.getEnrolledStudentsBySubject(subjectCode),
    db.getAttendanceForSubjectDate(subjectCode, date)
  ]);

  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">No students enrolled in this subject yet.</td></tr>';
    return;
  }

  const attMap = new Map(existing.map((a) => [a.student_id, a]));
  tbody.innerHTML = students
    .map((s) => {
      const rec = attMap.get(s.id);
      const st = rec ? rec.status : 'present';
      return `<tr data-att-student="${s.id}">
        <td><strong>${s.roll_no}</strong></td>
        <td>${s.first_name} ${s.last_name}</td>
        <td>
          <select class="input att-status" style="max-width:150px;">
            <option value="present" ${st === 'present' ? 'selected' : ''}>Present</option>
            <option value="absent" ${st === 'absent' ? 'selected' : ''}>Absent</option>
            <option value="late" ${st === 'late' ? 'selected' : ''}>Late</option>
          </select>
        </td>
        <td><input type="text" class="input att-note" value="${rec?.notes || ''}" placeholder="Lecture note"></td>
      </tr>`;
    })
    .join('');
}

async function saveSubjectAttendance() {
  const subjectCode = document.getElementById('attendanceSubjectSelect').value;
  const date = document.getElementById('attendanceDate').value;
  if (!subjectCode || !date) return showToast('Select subject and date.', 'error');

  const payload = [];
  document.querySelectorAll('[data-att-student]').forEach((row) => {
    payload.push({
      student_id: row.dataset.attStudent,
      subject_code: subjectCode,
      attendance_date: date,
      status: row.querySelector('.att-status').value,
      notes: row.querySelector('.att-note').value.trim() || null
    });
  });

  if (!payload.length) return showToast('No enrolled students to mark.', 'error');
  await db.upsertAttendanceBatch(payload);
  showToast(`Saved attendance for ${payload.length} student(s)!`, 'success');
  await refreshFacultyDashboard();
}

function renderRiskInterventions(interventions) {
  const atRisk = allSummaries.filter((s) => s.risk_level !== 'low');
  const riskContainer = document.getElementById('riskEngineCards');

  riskContainer.innerHTML = atRisk.length
    ? atRisk
        .map(
          (s) => `<div class="card">
            <div class="row-between">
              <strong>${s.roll_no} — ${s.full_name}</strong>
              <span class="badge badge-${s.risk_level}">${s.risk_level.toUpperCase()} (${s.risk_score}/100)</span>
            </div>
            <p class="muted" style="margin:0.45rem 0;">
              CGPA: ${s.cgpa} • Internal Avg: ${s.avg_internal_30}/30 • Attendance: ${s.attendance_pct}% • Backlogs: ${s.active_backlogs}
            </p>
            <div style="margin-bottom:0.65rem;">
              ${(s.risk_flags || []).map((f) => `<span class="badge badge-high" style="margin-right:4px;">${f}</span>`).join('')}
            </div>
            <div class="toolbar" style="margin-bottom:0;">
              <select class="input int-cat" data-stu="${s.student_id}">
                <option value="Attendance Shortage">Attendance Shortage</option>
                <option value="Backlog Remediation">Backlog Remediation</option>
                <option value="Internal Marks Warning">Internal Marks Warning</option>
                <option value="General Counseling">General Counseling</option>
              </select>
              <input type="text" class="input int-note" data-stu="${s.student_id}" placeholder="Action note" />
              <button class="btn btn-primary btn-sm" data-log-int="${s.student_id}">Log Action</button>
            </div>
          </div>`
        )
        .join('')
    : '<p class="muted">No High or Medium risk students currently flagged.</p>';

  riskContainer.querySelectorAll('[data-log-int]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const studentId = btn.dataset.logInt;
      const category = document.querySelector(`.int-cat[data-stu="${studentId}"]`).value;
      const actionTaken =
        document.querySelector(`.int-note[data-stu="${studentId}"]`).value.trim() ||
        `Faculty intervention initiated for ${category}`;
      await db.logIntervention({ studentId, facultyId: profile.id, category, actionTaken });
      showToast('Intervention logged!', 'success');
      await refreshFacultyDashboard();
    });
  });

  document.getElementById('interventionHistory').innerHTML = interventions.length
    ? interventions
        .map(
          (i) => `<div class="list-row">
            <div>
              <strong>${i.student?.roll_no || ''} ${i.student?.first_name || ''} — ${i.category}</strong>
              <div class="muted">${i.action_taken}</div>
            </div>
            <span class="badge">${new Date(i.created_at).toLocaleDateString()}</span>
          </div>`
        )
        .join('')
    : '<p class="muted">No interventions logged yet.</p>';
}
