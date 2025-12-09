// Student Dashboard JavaScript
let currentUser = null;
let currentSection = 'overview';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    // Set student name
    document.getElementById('studentName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;

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
            case 'grades':
                loadGradesData();
                break;
            case 'attendance':
                loadAttendanceData();
                break;
            case 'progress':
                loadProgressData();
                break;
            case 'goals':
                loadGoalsData();
                break;
            case 'schedule':
                loadScheduleData();
                break;
        }
    }
}

function updateSectionHeader(sectionId) {
    const titles = {
        overview: { title: 'Dashboard Overview', subtitle: 'Track your academic progress and achievements' },
        grades: { title: 'My Grades', subtitle: 'View your grades and academic performance across all courses' },
        attendance: { title: 'Attendance Record', subtitle: 'Monitor your attendance and identify patterns' },
        progress: { title: 'Academic Progress', subtitle: 'Track your improvement and achievements over time' },
        goals: { title: 'Academic Goals', subtitle: 'Set and monitor your personal academic objectives' },
        schedule: { title: 'Class Schedule', subtitle: 'View your weekly class schedule and upcoming sessions' }
    };
    
    const sectionInfo = titles[sectionId];
    if (sectionInfo) {
        document.getElementById('sectionTitle').textContent = sectionInfo.title;
        document.getElementById('sectionSubtitle').textContent = sectionInfo.subtitle;
    }
}

function getCurrentStudentData() {
    // Find current student's data
    const students = window.dataManager.getStudents();
    return students.find(s => s.id === currentUser.studentId) || 
           students.find(s => s.email === currentUser.email) ||
           students[0]; // Fallback to first student for demo
}

function loadOverviewData() {
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    // Update stats cards
    document.getElementById('overallGPA').textContent = studentData.gpa.toFixed(1);
    document.getElementById('attendancePercentage').textContent = studentData.attendance + '%';
    
    // Calculate total courses and assignments
    const assignments = Object.keys(studentData.grades);
    document.getElementById('totalCourses').textContent = '3'; // Simplified for demo
    document.getElementById('completedAssignments').textContent = assignments.length;
    
    // Load grade trends chart
    loadGradeTrendsChart();
    
    // Load course performance
    loadCoursePerformance();
    
    // Load upcoming assignments
    loadUpcomingAssignments();
    
    // Load recent grades
    loadRecentGrades();
}

function loadGradeTrendsChart() {
    const ctx = document.getElementById('gradeTrendsChart');
    if (!ctx) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    // Generate trend data based on grades
    const assignments = Object.keys(studentData.grades);
    const grades = Object.values(studentData.grades);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: assignments.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
            datasets: [{
                label: 'Grade',
                data: grades,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
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
                        text: 'Grade'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadCoursePerformance() {
    const container = document.getElementById('coursePerformance');
    if (!container) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    // Get class information
    const classes = window.dataManager.getClasses();
    const studentClass = classes.find(c => c.id === studentData.class);
    
    // Calculate performance for each course (simplified)
    const courses = [
        { name: 'Mathematics 101', grade: studentData.gpa * 25, progress: 85 },
        { name: 'Science 102', grade: (studentData.gpa * 25) + 5, progress: 78 },
        { name: 'English 103', grade: (studentData.gpa * 25) - 3, progress: 92 }
    ];
    
    container.innerHTML = courses.map(course => `
        <div class="course-item">
            <div class="course-header">
                <h4>${course.name}</h4>
                <div class="course-grade">${course.grade.toFixed(1)}%</div>
            </div>
            <div class="course-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
                <span class="progress-text">${course.progress}% Complete</span>
            </div>
        </div>
    `).join('');
}

function loadUpcomingAssignments() {
    const container = document.getElementById('upcomingAssignments');
    if (!container) return;
    
    // Sample upcoming assignments
    const assignments = [
        { name: 'Math Quiz 2', course: 'Mathematics 101', dueDate: '2025-02-05', type: 'quiz' },
        { name: 'Science Project', course: 'Science 102', dueDate: '2025-02-10', type: 'project' },
        { name: 'English Essay', course: 'English 103', dueDate: '2025-02-12', type: 'assignment' }
    ];
    
    container.innerHTML = assignments.map(assignment => `
        <div class="assignment-item">
            <div class="assignment-icon">
                <i class="fas ${getAssignmentIcon(assignment.type)}"></i>
            </div>
            <div class="assignment-details">
                <h5>${assignment.name}</h5>
                <p>${assignment.course}</p>
                <div class="assignment-due">Due: ${formatDate(assignment.dueDate)}</div>
            </div>
        </div>
    `).join('');
}

function loadRecentGrades() {
    const container = document.getElementById('recentGrades');
    if (!container) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    const recentGrades = Object.entries(studentData.grades).slice(-3).reverse();
    
    container.innerHTML = recentGrades.map(([assignment, grade]) => `
        <div class="grade-item">
            <div class="grade-details">
                <h5>${assignment.charAt(0).toUpperCase() + assignment.slice(1)}</h5>
                <p>Mathematics 101</p>
            </div>
            <div class="grade-score ${getGradeClass(grade)}">${grade}%</div>
        </div>
    `).join('');
}

function loadGradesData() {
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    loadGradesGrid();
    loadGradeDistributionChart();
}

function loadGradesGrid() {
    const container = document.getElementById('gradesGrid');
    if (!container) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    const courses = [
        { id: 'math101', name: 'Mathematics 101', grades: studentData.grades },
        { id: 'science102', name: 'Science 102', grades: { quiz1: 95, midterm: 93, project1: 96 } },
        { id: 'english103', name: 'English 103', grades: { quiz1: 88, midterm: 85, essay1: 90 } }
    ];
    
    container.innerHTML = courses.map(course => `
        <div class="grade-card">
            <div class="grade-card-header">
                <h3>${course.name}</h3>
                <div class="course-average">
                    ${calculateAverage(Object.values(course.grades)).toFixed(1)}%
                </div>
            </div>
            <div class="grade-list">
                ${Object.entries(course.grades).map(([assignment, grade]) => `
                    <div class="grade-row">
                        <div class="assignment-name">${formatAssignmentName(assignment)}</div>
                        <div class="grade-value ${getGradeClass(grade)}">${grade}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function loadGradeDistributionChart() {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    // Count grades by letter grade
    const allGrades = [
        ...Object.values(studentData.grades),
        95, 93, 96, // Science grades
        88, 85, 90  // English grades
    ];
    
    const gradeRanges = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    
    allGrades.forEach(grade => {
        if (grade >= 90) gradeRanges['A']++;
        else if (grade >= 80) gradeRanges['B']++;
        else if (grade >= 70) gradeRanges['C']++;
        else if (grade >= 60) gradeRanges['D']++;
        else gradeRanges['F']++;
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

function loadAttendanceData() {
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    updateAttendanceStats();
    loadAttendanceCalendar();
    loadAttendanceChart();
}

function updateAttendanceStats() {
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    const records = studentData.attendance_record;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    
    document.getElementById('presentDays').textContent = presentDays;
    document.getElementById('absentDays').textContent = absentDays;
    document.getElementById('lateDays').textContent = lateDays;
}

function loadAttendanceCalendar() {
    const container = document.getElementById('attendanceCalendar');
    if (!container) return;
    
    const studentData = getCurrentStudentData();
    if (!studentData) return;
    
    // Generate calendar for current month
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    let calendarHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        calendarHTML += `<div class="calendar-header">${day}</div>`;
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = studentData.attendance_record.find(r => r.date === dateStr);
        const status = record ? record.status : '';
        
        calendarHTML += `<div class="calendar-day ${status}">${day}</div>`;
    }
    
    container.innerHTML = calendarHTML;
}

function loadAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    // Sample data for attendance by course
    const courses = ['Mathematics 101', 'Science 102', 'English 103'];
    const attendanceData = [92, 95, 88];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: courses,
            datasets: [{
                label: 'Attendance %',
                data: attendanceData,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 1
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
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadProgressData() {
    loadProgressTimeline();
    loadAchievements();
}

function loadProgressTimeline() {
    const ctx = document.getElementById('progressTimelineChart');
    if (!ctx) return;
    
    // Generate progress timeline data
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const gpaData = [3.2, 3.4, 3.6, 3.7, 3.8];
    const attendanceData = [85, 88, 90, 91, 92];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'GPA',
                data: gpaData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Attendance %',
                data: attendanceData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
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
            }
        }
    });
}

function loadAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    const achievements = [
        { icon: 'fa-trophy', title: 'Honor Roll', description: 'Achieved GPA above 3.5', date: '2025-01-15' },
        { icon: 'fa-calendar-check', title: 'Perfect Attendance', description: '30 consecutive days present', date: '2025-01-10' },
        { icon: 'fa-star', title: 'Top Performer', description: 'Highest score in Math Quiz 1', date: '2025-01-05' },
        { icon: 'fa-medal', title: 'Improvement Award', description: 'Most improved student this semester', date: '2024-12-20' }
    ];
    
    container.innerHTML = achievements.map(achievement => `
        <div class="achievement-item">
            <div class="achievement-icon">
                <i class="fas ${achievement.icon}"></i>
            </div>
            <div class="achievement-details">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                <div class="achievement-date">${formatDate(achievement.date)}</div>
            </div>
        </div>
    `).join('');
}

function loadGoalsData() {
    const goals = getStudentGoals();
    const container = document.getElementById('goalsList');
    
    if (!container) return;
    
    container.innerHTML = goals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <h4>${goal.title}</h4>
                <div class="goal-progress">
                    <div class="progress-circle">
                        <span>${goal.progress}%</span>
                    </div>
                </div>
            </div>
            <div class="goal-details">
                <p>${goal.description}</p>
                <div class="goal-meta">
                    <span class="goal-type">${goal.type}</span>
                    <span class="goal-deadline">Due: ${formatDate(goal.deadline)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="goal-actions">
                <button class="btn btn-sm btn-secondary" onclick="editGoal('${goal.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGoal('${goal.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function loadScheduleData() {
    const container = document.getElementById('scheduleGrid');
    if (!container) return;
    
    // Sample schedule data
    const schedule = {
        Monday: [
            { time: '09:00-10:30', subject: 'Mathematics 101', room: 'Room 201' },
            { time: '14:00-15:30', subject: 'English 103', room: 'Room 105' }
        ],
        Tuesday: [
            { time: '11:00-12:30', subject: 'Science 102', room: 'Lab 301' }
        ],
        Wednesday: [
            { time: '09:00-10:30', subject: 'Mathematics 101', room: 'Room 201' },
            { time: '14:00-15:30', subject: 'English 103', room: 'Room 105' }
        ],
        Thursday: [
            { time: '11:00-12:30', subject: 'Science 102', room: 'Lab 301' }
        ],
        Friday: [
            { time: '09:00-10:30', subject: 'Mathematics 101', room: 'Room 201' }
        ]
    };
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    container.innerHTML = days.map(day => `
        <div class="schedule-day">
            <h3>${day}</h3>
            <div class="day-classes">
                ${schedule[day] ? schedule[day].map(cls => `
                    <div class="class-item">
                        <div class="class-time">${cls.time}</div>
                        <div class="class-subject">${cls.subject}</div>
                        <div class="class-room">${cls.room}</div>
                    </div>
                `).join('') : '<div class="no-classes">No classes scheduled</div>'}
            </div>
        </div>
    `).join('');
}

// Goal Management Functions
function getStudentGoals() {
    const savedGoals = JSON.parse(localStorage.getItem('studentGoals') || '[]');
    
    // Add sample goals if none exist
    if (savedGoals.length === 0) {
        const sampleGoals = [
            {
                id: 'goal1',
                title: 'Improve Math GPA',
                type: 'Academic',
                target: '3.8',
                progress: 75,
                deadline: '2025-05-15',
                description: 'Achieve a GPA of 3.8 or higher in Mathematics'
            },
            {
                id: 'goal2',
                title: 'Perfect Attendance',
                type: 'Attendance',
                target: '100%',
                progress: 92,
                deadline: '2025-03-30',
                description: 'Maintain 100% attendance for the semester'
            }
        ];
        localStorage.setItem('studentGoals', JSON.stringify(sampleGoals));
        return sampleGoals;
    }
    
    return savedGoals;
}

function openGoalModal() {
    const modal = document.getElementById('goalModal');
    modal.classList.add('active');
}

function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    modal.classList.remove('active');
    document.getElementById('goalForm').reset();
}

function saveGoal() {
    const title = document.getElementById('goalTitle').value;
    const type = document.getElementById('goalType').value;
    const target = document.getElementById('goalTarget').value;
    const deadline = document.getElementById('goalDeadline').value;
    const description = document.getElementById('goalDescription').value;
    
    if (!title || !type || !target || !deadline) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newGoal = {
        id: 'goal_' + Date.now(),
        title,
        type,
        target,
        deadline,
        description,
        progress: 0
    };
    
    const goals = getStudentGoals();
    goals.push(newGoal);
    localStorage.setItem('studentGoals', JSON.stringify(goals));
    
    closeGoalModal();
    loadGoalsData();
    showNotification('Goal saved successfully!', 'success');
}

function editGoal(goalId) {
    // In a full implementation, this would open the modal with pre-filled data
    showNotification('Edit goal functionality would be implemented here', 'info');
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        const goals = getStudentGoals();
        const updatedGoals = goals.filter(g => g.id !== goalId);
        localStorage.setItem('studentGoals', JSON.stringify(updatedGoals));
        loadGoalsData();
        showNotification('Goal deleted successfully!', 'success');
    }
}

// Calendar Navigation
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function previousMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    updateCalendarDisplay();
    loadAttendanceCalendar();
}

function nextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    updateCalendarDisplay();
    loadAttendanceCalendar();
}

function updateCalendarDisplay() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
}

// Schedule Navigation
let currentWeekOffset = 0;

function previousWeek() {
    currentWeekOffset--;
    updateWeekDisplay();
}

function nextWeek() {
    currentWeekOffset++;
    updateWeekDisplay();
}

function updateWeekDisplay() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + (currentWeekOffset * 7) - today.getDay() + 1);
    
    document.getElementById('currentWeek').textContent = 
        `Week of ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

// Utility Functions
function getAssignmentIcon(type) {
    const icons = {
        quiz: 'fa-question-circle',
        exam: 'fa-file-alt',
        project: 'fa-folder-open',
        assignment: 'fa-edit'
    };
    return icons[type] || 'fa-file';
}

function getGradeClass(grade) {
    if (grade >= 90) return 'grade-a';
    if (grade >= 80) return 'grade-b';
    if (grade >= 70) return 'grade-c';
    if (grade >= 60) return 'grade-d';
    return 'grade-f';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatAssignmentName(assignment) {
    return assignment.charAt(0).toUpperCase() + assignment.slice(1).replace(/([A-Z])/g, ' $1');
}

function calculateAverage(grades) {
    return grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
}

function updateGradeTrends() {
    // Reload the grade trends chart with new period
    loadGradeTrendsChart();
}

function filterGrades() {
    // In a full implementation, this would filter the grades display
    loadGradesGrid();
}

function exportReport() {
    showNotification('Report export functionality would be implemented here', 'info');
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

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}