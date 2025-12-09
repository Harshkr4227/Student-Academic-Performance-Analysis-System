// Sample data and data management functions
class DataManager {
    constructor() {
        this.initializeSampleData();
    }

    initializeSampleData() {
        // Initialize students data
        if (!localStorage.getItem('students')) {
            const sampleStudents = [
                {
                    id: 'STU001',
                    name: 'Alice Johnson',
                    email: 'alice@school.edu',
                    class: 'math101',
                    gpa: 3.8,
                    attendance: 92,
                    riskLevel: 'low',
                    grades: {
                        quiz1: 85,
                        midterm: 88,
                        project1: 92,
                        final: 90
                    },
                    attendance_record: this.generateAttendanceRecord(),
                    behavior_score: 8.5
                },
                {
                    id: 'STU002',
                    name: 'Bob Wilson',
                    email: 'bob@school.edu',
                    class: 'math101',
                    gpa: 2.9,
                    attendance: 78,
                    riskLevel: 'medium',
                    grades: {
                        quiz1: 75,
                        midterm: 72,
                        project1: 68,
                        final: 70
                    },
                    attendance_record: this.generateAttendanceRecord(0.78),
                    behavior_score: 6.2
                },
                {
                    id: 'STU003',
                    name: 'Carol Davis',
                    email: 'carol@school.edu',
                    class: 'science102',
                    gpa: 3.9,
                    attendance: 95,
                    riskLevel: 'low',
                    grades: {
                        quiz1: 95,
                        midterm: 93,
                        project1: 96,
                        final: 94
                    },
                    attendance_record: this.generateAttendanceRecord(0.95),
                    behavior_score: 9.1
                },
                {
                    id: 'STU004',
                    name: 'David Brown',
                    email: 'david@school.edu',
                    class: 'english103',
                    gpa: 2.3,
                    attendance: 65,
                    riskLevel: 'high',
                    grades: {
                        quiz1: 60,
                        midterm: 55,
                        project1: 62,
                        final: 58
                    },
                    attendance_record: this.generateAttendanceRecord(0.65),
                    behavior_score: 5.8
                },
                {
                    id: 'STU005',
                    name: 'Emma Taylor',
                    email: 'emma@school.edu',
                    class: 'math101',
                    gpa: 3.6,
                    attendance: 88,
                    riskLevel: 'low',
                    grades: {
                        quiz1: 82,
                        midterm: 85,
                        project1: 89,
                        final: 87
                    },
                    attendance_record: this.generateAttendanceRecord(0.88),
                    behavior_score: 8.0
                }
            ];
            localStorage.setItem('students', JSON.stringify(sampleStudents));
        }

        // Initialize classes data
        if (!localStorage.getItem('classes')) {
            const sampleClasses = [
                {
                    id: 'math101',
                    name: 'Mathematics 101',
                    teacher: 'John Smith',
                    students: ['STU001', 'STU002', 'STU005'],
                    schedule: {
                        monday: '09:00-10:30',
                        wednesday: '09:00-10:30',
                        friday: '09:00-10:30'
                    }
                },
                {
                    id: 'science102',
                    name: 'Science 102',
                    teacher: 'John Smith',
                    students: ['STU003'],
                    schedule: {
                        tuesday: '11:00-12:30',
                        thursday: '11:00-12:30'
                    }
                },
                {
                    id: 'english103',
                    name: 'English 103',
                    teacher: 'John Smith',
                    students: ['STU004'],
                    schedule: {
                        monday: '14:00-15:30',
                        wednesday: '14:00-15:30'
                    }
                }
            ];
            localStorage.setItem('classes', JSON.stringify(sampleClasses));
        }

        // Initialize assignments data
        if (!localStorage.getItem('assignments')) {
            const sampleAssignments = [
                {
                    id: 'quiz1',
                    name: 'Quiz 1',
                    class: 'math101',
                    dueDate: '2025-02-15',
                    type: 'quiz',
                    maxScore: 100
                },
                {
                    id: 'midterm',
                    name: 'Midterm Exam',
                    class: 'math101',
                    dueDate: '2025-03-15',
                    type: 'exam',
                    maxScore: 100
                },
                {
                    id: 'project1',
                    name: 'Project 1',
                    class: 'math101',
                    dueDate: '2025-04-01',
                    type: 'project',
                    maxScore: 100
                },
                {
                    id: 'final',
                    name: 'Final Exam',
                    class: 'math101',
                    dueDate: '2025-05-15',
                    type: 'exam',
                    maxScore: 100
                }
            ];
            localStorage.setItem('assignments', JSON.stringify(sampleAssignments));
        }

        // Initialize activities data
        if (!localStorage.getItem('activities')) {
            const sampleActivities = [
                {
                    id: 'act1',
                    type: 'grade_entry',
                    description: 'Grades entered for Quiz 1',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    class: 'math101'
                },
                {
                    id: 'act2',
                    type: 'attendance',
                    description: 'Attendance marked for today',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    class: 'science102'
                },
                {
                    id: 'act3',
                    type: 'alert',
                    description: 'Student flagged as at-risk',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    student: 'David Brown'
                }
            ];
            localStorage.setItem('activities', JSON.stringify(sampleActivities));
        }
    }

    generateAttendanceRecord(rate = 0.9) {
        const record = [];
        const startDate = new Date('2025-01-01');
        const endDate = new Date();
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            // Skip weekends
            if (d.getDay() === 0 || d.getDay() === 6) continue;
            
            const status = Math.random() < rate ? 'present' : 
                          Math.random() < 0.7 ? 'absent' : 'late';
            
            record.push({
                date: d.toISOString().split('T')[0],
                status: status
            });
        }
        
        return record;
    }

    // Getter methods
    getStudents() {
        return JSON.parse(localStorage.getItem('students') || '[]');
    }

    getStudent(id) {
        const students = this.getStudents();
        return students.find(s => s.id === id);
    }

    getClasses() {
        return JSON.parse(localStorage.getItem('classes') || '[]');
    }

    getClass(id) {
        const classes = this.getClasses();
        return classes.find(c => c.id === id);
    }

    getAssignments() {
        return JSON.parse(localStorage.getItem('assignments') || '[]');
    }

    getActivities() {
        return JSON.parse(localStorage.getItem('activities') || '[]');
    }

    // Update methods
    updateStudent(student) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === student.id);
        if (index !== -1) {
            students[index] = student;
            localStorage.setItem('students', JSON.stringify(students));
        }
    }

    updateStudentGrade(studentId, assignment, grade) {
        const student = this.getStudent(studentId);
        if (student) {
            student.grades[assignment] = grade;
            this.updateStudent(student);
            this.addActivity({
                type: 'grade_entry',
                description: `Grade updated for ${student.name} - ${assignment}: ${grade}`,
                timestamp: new Date().toISOString(),
                student: student.name
            });
        }
    }

    updateAttendance(studentId, date, status) {
        const student = this.getStudent(studentId);
        if (student) {
            const record = student.attendance_record.find(r => r.date === date);
            if (record) {
                record.status = status;
            } else {
                student.attendance_record.push({ date, status });
            }
            
            // Recalculate attendance percentage
            const totalDays = student.attendance_record.length;
            const presentDays = student.attendance_record.filter(r => r.status === 'present').length;
            student.attendance = Math.round((presentDays / totalDays) * 100);
            
            this.updateStudent(student);
        }
    }

    addActivity(activity) {
        const activities = this.getActivities();
        activities.unshift({
            id: 'act_' + Date.now(),
            ...activity
        });
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.splice(50);
        }
        
        localStorage.setItem('activities', JSON.stringify(activities));
    }

    // Analytics methods
    getClassStatistics(classId) {
        const students = this.getStudents().filter(s => s.class === classId);
        
        if (students.length === 0) {
            return {
                totalStudents: 0,
                averageGPA: 0,
                averageAttendance: 0,
                atRiskCount: 0
            };
        }
        
        const totalGPA = students.reduce((sum, s) => sum + s.gpa, 0);
        const totalAttendance = students.reduce((sum, s) => sum + s.attendance, 0);
        const atRiskCount = students.filter(s => s.riskLevel === 'high').length;
        
        return {
            totalStudents: students.length,
            averageGPA: (totalGPA / students.length).toFixed(2),
            averageAttendance: Math.round(totalAttendance / students.length),
            atRiskCount
        };
    }

    getOverallStatistics() {
        const students = this.getStudents();
        
        if (students.length === 0) {
            return {
                totalStudents: 0,
                averageGPA: 0,
                averageAttendance: 0,
                atRiskCount: 0
            };
        }
        
        const totalGPA = students.reduce((sum, s) => sum + s.gpa, 0);
        const totalAttendance = students.reduce((sum, s) => sum + s.attendance, 0);
        const atRiskCount = students.filter(s => s.riskLevel === 'high').length;
        
        return {
            totalStudents: students.length,
            averageGPA: (totalGPA / students.length).toFixed(2),
            averageAttendance: Math.round(totalAttendance / students.length),
            atRiskCount
        };
    }

    getAtRiskStudents() {
        return this.getStudents().filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium');
    }

    generateInterventions() {
        const atRiskStudents = this.getAtRiskStudents();
        const interventions = [];

        atRiskStudents.forEach(student => {
            const intervention = {
                studentId: student.id,
                studentName: student.name,
                priority: student.riskLevel,
                recommendations: []
            };

            // Attendance-based interventions
            if (student.attendance < 80) {
                intervention.recommendations.push({
                    type: 'attendance',
                    title: 'Improve Attendance',
                    description: `${student.name} has ${student.attendance}% attendance. Consider meeting with student and parents to address attendance issues.`,
                    action: 'Schedule parent conference'
                });
            }

            // Grade-based interventions
            const averageGrade = Object.values(student.grades).reduce((sum, grade) => sum + grade, 0) / Object.values(student.grades).length;
            if (averageGrade < 70) {
                intervention.recommendations.push({
                    type: 'academic',
                    title: 'Academic Support',
                    description: `${student.name} has an average grade of ${averageGrade.toFixed(1)}%. Consider additional tutoring or study support.`,
                    action: 'Arrange tutoring sessions'
                });
            }

            // Behavior-based interventions
            if (student.behavior_score < 7) {
                intervention.recommendations.push({
                    type: 'behavior',
                    title: 'Behavioral Support',
                    description: `${student.name} has a behavior score of ${student.behavior_score}/10. Consider behavioral intervention strategies.`,
                    action: 'Implement behavior plan'
                });
            }

            if (intervention.recommendations.length > 0) {
                interventions.push(intervention);
            }
        });

        return interventions;
    }
}

// Create global instance
window.dataManager = new DataManager();