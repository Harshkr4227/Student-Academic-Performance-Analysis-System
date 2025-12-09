// Teacher Dashboard JavaScript
let currentUser = null;
let currentSection = 'overview';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }

    // Set teacher name
    document.getElementById('teacherName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;

    // Initialize dashboard
    initializeDashboard();
    loadOverviewData();
    
    // Set up chart defaults
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#525252';
});

function initializeDashboard() {
    // Load initial section
    showSection('overview');
    
    // Set up navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Update header
        updateSectionHeader(sectionId);
        
        // Load section-specific data
        switch(sectionId) {
            case 'overview':
                loadOverviewData();
                break;
            case 'students':
                loadStudentsData();
                break;
            case 'grades':
                loadGradesData();
                break;
            case 'attendance':
                loadAttendanceData();
                break;
            case 'analytics':
                loadAnalyticsData();
                break;
            case 'interventions':
                loadInterventionsData();
                break;
        }
    }
}

function updateSectionHeader(sectionId) {
    const titles = {
        overview: { title: 'Dashboard Overview', subtitle: 'Welcome back! Here\'s what\'s happening in your classes.' },
        students: { title: 'Student Management', subtitle: 'View and manage your students\' information and performance.' },
        grades: { title: 'Grade Entry', subtitle: 'Enter and manage student grades for assignments and exams.' },
        attendance: { title: 'Attendance Management', subtitle: 'Track and manage student attendance records.' },
        analytics: { title: 'Performance Analytics', subtitle: 'Analyze student performance with detailed charts and insights.' },
        interventions: { title: 'Student Interventions', subtitle: 'Review recommended interventions for at-risk students.' }
    };
    
    const sectionInfo = titles[sectionId];
    if (sectionInfo) {
        document.getElementById('sectionTitle').textContent = sectionInfo.title;
        document.getElementById('sectionSubtitle').textContent = sectionInfo.subtitle;
    }
}

function loadOverviewData() {
    const stats = window.dataManager.getOverallStatistics();
    
    // Update stats cards
    document.getElementById('totalStudents').textContent = stats.totalStudents;
    document.getElementById('averageGrade').textContent = stats.averageGPA;
    document.getElementById('attendanceRate').textContent = stats.averageAttendance + '%';
    document.getElementById('atRiskStudents').textContent = stats.atRiskCount;
    
    // Load performance chart
    loadPerformanceChart();
    
    // Load recent activity
    loadRecentActivity();
    
    // Load at-risk alerts
    loadAtRiskAlerts();
}

function loadPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    const students = window.dataManager.getStudents();
    const labels = students.map(s => s.name);
    const gpas = students.map(s => s.gpa);
    const attendances = students.map(s => s.attendance);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'GPA',
                data: gpas,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                yAxisID: 'y'
            }, {
                label: 'Attendance %',
                data: attendances,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    max: 4.0,
                    title: {
                        display: true,
                        text: 'GPA'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Attendance %'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function loadRecentActivity() {
    const activities = window.dataManager.getActivities();
    const container = document.getElementById('recentActivity');
    
    if (!container) return;
    
    container.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.description}</div>
                <div class="activity-time">${formatTime(activity.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function loadAtRiskAlerts() {
    const atRiskStudents = window.dataManager.getAtRiskStudents();
    const container = document.getElementById('atRiskList');
    
    if (!container) return;
    
    container.innerHTML = atRiskStudents.map(student => `
        <div class="alert-item">
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">${student.name} - ${student.riskLevel.toUpperCase()} Risk</div>
                <div class="alert-description">
                    GPA: ${student.gpa} | Attendance: ${student.attendance}% | 
                    ${student.riskLevel === 'high' ? 'Immediate attention required' : 'Monitor closely'}
                </div>
            </div>
        </div>
    `).join('');
}

function loadStudentsData() {
    const students = window.dataManager.getStudents();
    const container = document.getElementById('studentsGrid');
    
    if (!container) return;
    
    container.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="student-header">
                <div class="student-avatar">
                    ${student.name.charAt(0)}
                </div>
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <div class="student-id">${student.id}</div>
                </div>
                <div class="risk-indicator risk-${student.riskLevel}">
                    <i class="fas ${getRiskIcon(student.riskLevel)}"></i>
                    ${student.riskLevel}
                </div>
            </div>
            <div class="student-stats">
                <div class="student-stat">
                    <div class="student-stat-value">${student.gpa}</div>
                    <div class="student-stat-label">GPA</div>
                </div>
                <div class="student-stat">
                    <div class="student-stat-value">${student.attendance}%</div>
                    <div class="student-stat-label">Attendance</div>
                </div>
                <div class="student-stat">
                    <div class="student-stat-value">${student.behavior_score}</div>
                    <div class="student-stat-label">Behavior</div>
                </div>
            </div>
        </div>
    `).join('');
}

function loadGradesData() {
    // Initialize grade entry interface
    loadStudentsForGrading();
}

function loadStudentsForGrading() {
    const classSelect = document.getElementById('gradeClassSelect');
    const assignmentSelect = document.getElementById('assignmentSelect');
    const tableBody = document.getElementById('gradeTableBody');
    
    if (!classSelect || !assignmentSelect || !tableBody) return;
    
    const selectedClass = classSelect.value;
    const selectedAssignment = assignmentSelect.value;
    
    if (!selectedClass || !selectedAssignment) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280;">Select a class and assignment to begin grading</td></tr>';
        return;
    }
    
    const students = window.dataManager.getStudents().filter(s => s.class === selectedClass);
    
    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.id}</td>
            <td>${student.grades[selectedAssignment] || 'N/A'}</td>
            <td>
                <input type="number" min="0" max="100" value="${student.grades[selectedAssignment] || ''}" 
                       data-student="${student.id}" data-assignment="${selectedAssignment}" 
                       class="grade-input" style="width: 80px; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
            </td>
            <td>
                <input type="text" placeholder="Optional comments..." 
                       data-student="${student.id}" data-assignment="${selectedAssignment}"
                       class="comment-input" style="width: 200px; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
            </td>
            <td>
                <button class="btn-small btn-primary" onclick="saveIndividualGrade('${student.id}', '${selectedAssignment}')">
                    <i class="fas fa-save"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function saveIndividualGrade(studentId, assignment) {
    const gradeInput = document.querySelector(`input.grade-input[data-student="${studentId}"][data-assignment="${assignment}"]`);
    const grade = parseInt(gradeInput.value);
    
    if (isNaN(grade) || grade < 0 || grade > 100) {
        alert('Please enter a valid grade between 0 and 100');
        return;
    }
    
    window.dataManager.updateStudentGrade(studentId, assignment, grade);
    showNotification('Grade saved successfully!', 'success');
    
    // Refresh the overview if we're coming from there
    if (currentSection === 'overview') {
        setTimeout(() => loadOverviewData(), 500);
    }
}

function saveAllGrades() {
    const gradeInputs = document.querySelectorAll('.grade-input');
    let saved = 0;
    
    gradeInputs.forEach(input => {
        const grade = parseInt(input.value);
        if (!isNaN(grade) && grade >= 0 && grade <= 100) {
            const studentId = input.dataset.student;
            const assignment = input.dataset.assignment;
            window.dataManager.updateStudentGrade(studentId, assignment, grade);
            saved++;
        }
    });
    
    showNotification(`${saved} grades saved successfully!`, 'success');
}

function submitGrades() {
    saveAllGrades();
    showNotification('All grades have been submitted!', 'success');
}

function loadAttendanceData() {
    // Set today's date as default
    const dateInput = document.getElementById('attendanceDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    loadAttendance();
}

function loadAttendance() {
    const classSelect = document.getElementById('attendanceClass');
    const dateInput = document.getElementById('attendanceDate');
    const tableBody = document.getElementById('attendanceTableBody');
    
    if (!classSelect || !dateInput || !tableBody) return;
    
    const selectedClass = classSelect.value;
    const selectedDate = dateInput.value;
    
    if (!selectedClass || !selectedDate) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280;">Select a class and date to view attendance</td></tr>';
        return;
    }
    
    const students = window.dataManager.getStudents().filter(s => s.class === selectedClass);
    
    tableBody.innerHTML = students.map(student => {
        const attendanceRecord = student.attendance_record.find(r => r.date === selectedDate);
        const currentStatus = attendanceRecord ? attendanceRecord.status : 'present';
        
        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.id}</td>
                <td>
                    <select data-student="${student.id}" data-date="${selectedDate}" class="attendance-select" 
                            style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                        <option value="present" ${currentStatus === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${currentStatus === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="late" ${currentStatus === 'late' ? 'selected' : ''}>Late</option>
                    </select>
                </td>
                <td>
                    <input type="text" placeholder="Optional notes..." 
                           style="width: 200px; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;">
                </td>
            </tr>
        `;
    }).join('');
}

function markAllPresent() {
    const selects = document.querySelectorAll('.attendance-select');
    selects.forEach(select => {
        select.value = 'present';
    });
}

function saveAttendance() {
    const selects = document.querySelectorAll('.attendance-select');
    let saved = 0;
    
    selects.forEach(select => {
        const studentId = select.dataset.student;
        const date = select.dataset.date;
        const status = select.value;
        
        window.dataManager.updateAttendance(studentId, date, status);
        saved++;
    });
    
    showNotification(`Attendance saved for ${saved} students!`, 'success');
    
    // Refresh overview data
    if (currentSection === 'overview') {
        setTimeout(() => loadOverviewData(), 500);
    }
}

function loadAnalyticsData() {
    // Load various analytics charts
    loadGradeDistributionChart();
    loadAttendanceTrendChart();
    loadPerformanceComparisonChart();
    loadProgressChart();
}

function loadGradeDistributionChart() {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;
    
    const students = window.dataManager.getStudents();
    const gradeRanges = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (0-59)': 0 };
    
    students.forEach(student => {
        const avgGrade = student.gpa * 25; // Convert GPA to percentage approximation
        if (avgGrade >= 90) gradeRanges['A (90-100)']++;
        else if (avgGrade >= 80) gradeRanges['B (80-89)']++;
        else if (avgGrade >= 70) gradeRanges['C (70-79)']++;
        else if (avgGrade >= 60) gradeRanges['D (60-69)']++;
        else gradeRanges['F (0-59)']++;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(gradeRanges),
            datasets: [{
                data: Object.values(gradeRanges),
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#f97316',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function loadAttendanceTrendChart() {
    const ctx = document.getElementById('attendanceTrendChart');
    if (!ctx) return;
    
    // Generate last 7 days attendance data
    const days = [];
    const attendanceData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Calculate attendance for this day (simulated)
        const attendance = 85 + Math.random() * 15;
        attendanceData.push(Math.round(attendance));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Attendance %',
                data: attendanceData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Attendance %'
                    }
                }
            }
        }
    });
}

function loadPerformanceComparisonChart() {
    const ctx = document.getElementById('performanceComparisonChart');
    if (!ctx) return;
    
    const classes = window.dataManager.getClasses();
    const labels = classes.map(c => c.name);
    const avgGPAs = classes.map(classObj => {
        const students = window.dataManager.getStudents().filter(s => s.class === classObj.id);
        if (students.length === 0) return 0;
        return students.reduce((sum, s) => sum + s.gpa, 0) / students.length;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average GPA',
                data: avgGPAs,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4.0,
                    title: {
                        display: true,
                        text: 'GPA'
                    }
                }
            }
        }
    });
}

function loadProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    // Generate progress data over time (simulated)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const progressData = [3.2, 3.4, 3.3, 3.6, 3.5];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Class Average GPA',
                data: progressData,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4.0,
                    title: {
                        display: true,
                        text: 'GPA'
                    }
                }
            }
        }
    });
}

function loadInterventionsData() {
    const interventions = window.dataManager.generateInterventions();
    const container = document.getElementById('interventionsList');
    
    if (!container) return;
    
    container.innerHTML = interventions.map(intervention => `
        <div class="intervention-card">
            <div class="intervention-header">
                <div>
                    <div class="intervention-student">${intervention.studentName}</div>
                </div>
                <div class="intervention-priority priority-${intervention.priority}">
                    ${intervention.priority.toUpperCase()} PRIORITY
                </div>
            </div>
            <div class="intervention-recommendations">
                ${intervention.recommendations.map(rec => `
                    <div class="intervention-item">
                        <h5>${rec.title}</h5>
                        <p class="intervention-description">${rec.description}</p>
                        <div class="intervention-actions">
                            <button class="btn btn-sm btn-primary" onclick="implementIntervention('${intervention.studentId}', '${rec.type}')">
                                ${rec.action}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function generateInterventions() {
    loadInterventionsData();
    showNotification('Intervention recommendations generated!', 'success');
}

function implementIntervention(studentId, type) {
    // In a real application, this would trigger actual intervention processes
    showNotification(`Intervention implemented for student ${studentId}`, 'success');
    
    // Add activity
    window.dataManager.addActivity({
        type: 'intervention',
        description: `Intervention implemented for student - ${type}`,
        timestamp: new Date().toISOString(),
        student: studentId
    });
}

// Quick Grade Modal Functions
function openQuickGradeModal() {
    const modal = document.getElementById('quickGradeModal');
    const studentSelect = document.getElementById('quickStudent');
    
    // Load students into select
    const students = window.dataManager.getStudents();
    studentSelect.innerHTML = '<option value="">Select Student</option>' + 
        students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    modal.classList.add('active');
}

function closeQuickGradeModal() {
    const modal = document.getElementById('quickGradeModal');
    modal.classList.remove('active');
    
    // Reset form
    document.getElementById('quickGradeForm').reset();
}

function submitQuickGrade() {
    const studentId = document.getElementById('quickStudent').value;
    const assignment = document.getElementById('quickAssignment').value;
    const grade = parseInt(document.getElementById('quickGrade').value);
    const comments = document.getElementById('quickComments').value;
    
    if (!studentId || !assignment || isNaN(grade)) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (grade < 0 || grade > 100) {
        alert('Grade must be between 0 and 100');
        return;
    }
    
    window.dataManager.updateStudentGrade(studentId, assignment, grade);
    
    if (comments) {
        // In a real app, we'd save comments too
        console.log('Comments:', comments);
    }
    
    showNotification('Quick grade saved successfully!', 'success');
    closeQuickGradeModal();
    
    // Refresh current view if needed
    if (currentSection === 'overview') {
        setTimeout(() => loadOverviewData(), 500);
    }
}

// Utility Functions
function getActivityIcon(type) {
    const icons = {
        grade_entry: 'fa-chart-line',
        attendance: 'fa-calendar-check',
        alert: 'fa-exclamation-triangle',
        intervention: 'fa-user-md'
    };
    return icons[type] || 'fa-info-circle';
}

function getRiskIcon(level) {
    const icons = {
        low: 'fa-check-circle',
        medium: 'fa-exclamation-triangle',
        high: 'fa-exclamation-circle'
    };
    return icons[level] || 'fa-question-circle';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const performanceFilter = document.getElementById('performanceFilter').value;
    
    let students = window.dataManager.getStudents();
    
    // Apply filters
    if (searchTerm) {
        students = students.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            s.id.toLowerCase().includes(searchTerm)
        );
    }
    
    if (classFilter !== 'all') {
        students = students.filter(s => s.class === classFilter);
    }
    
    if (performanceFilter !== 'all') {
        students = students.filter(s => {
            const gpa = s.gpa;
            switch(performanceFilter) {
                case 'excellent': return gpa >= 3.5;
                case 'good': return gpa >= 3.0 && gpa < 3.5;
                case 'average': return gpa >= 2.5 && gpa < 3.0;
                case 'poor': return gpa < 2.5;
                default: return true;
            }
        });
    }
    
    // Update display
    const container = document.getElementById('studentsGrid');
    container.innerHTML = students.map(student => `
        <div class="student-card">
            <div class="student-header">
                <div class="student-avatar">
                    ${student.name.charAt(0)}
                </div>
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <div class="student-id">${student.id}</div>
                </div>
                <div class="risk-indicator risk-${student.riskLevel}">
                    <i class="fas ${getRiskIcon(student.riskLevel)}"></i>
                    ${student.riskLevel}
                </div>
            </div>
            <div class="student-stats">
                <div class="student-stat">
                    <div class="student-stat-value">${student.gpa}</div>
                    <div class="student-stat-label">GPA</div>
                </div>
                <div class="student-stat">
                    <div class="student-stat-value">${student.attendance}%</div>
                    <div class="student-stat-label">Attendance</div>
                </div>
                <div class="student-stat">
                    <div class="student-stat-value">${student.behavior_score}</div>
                    <div class="student-stat-label">Behavior</div>
                </div>
            </div>
        </div>
    `).join('');
}

function updateOverview() {
    // Reload overview data when class selection changes
    loadOverviewData();
}

function exportData() {
    // In a real application, this would generate and download a report
    showNotification('Data export feature would be implemented here', 'info');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}