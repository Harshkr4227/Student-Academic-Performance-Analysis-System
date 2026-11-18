import { supabase } from './supabase.js';

export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((field) => {
          const val = row[field] === null || row[field] === undefined ? '' : String(row[field]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const db = {
  // ---- ANALYTICAL VIEWS ----
  async getAllStudentSummaries() {
    const { data, error } = await supabase
      .from('v_student_academic_summary')
      .select('*')
      .order('roll_no');
    if (error) throw error;
    return data || [];
  },

  async getStudentSummary(studentId) {
    const { data, error } = await supabase
      .from('v_student_academic_summary')
      .select('*')
      .eq('student_id', studentId)
      .single();
    if (error) throw error;
    return data;
  },

  async getStudentSubjectAttendance(studentId) {
    const { data, error } = await supabase
      .from('v_subject_attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('subject_code');
    if (error) throw error;
    return data || [];
  },

  // ---- SUBJECTS & BATCH ENROLLMENT (3A) ----
  async getFacultySubjects(facultyId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('faculty_id', facultyId)
      .order('code');
    if (error) throw error;
    return data || [];
  },

  async createSubject({ code, name, department, semester, credits, facultyId, room }) {
    const { error } = await supabase.from('subjects').insert({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      department,
      semester: Number(semester || 5),
      credits: Number(credits || 4),
      faculty_id: facultyId,
      room: room.trim()
    });
    if (error) throw error;
  },

  async getAllStudentsRoster() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, roll_no, email, department, current_semester')
      .eq('role', 'student')
      .order('roll_no');
    if (error) throw error;
    return data || [];
  },

  async getSubjectEnrollmentIds(subjectCode) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('subject_code', subjectCode);
    if (error) throw error;
    return new Set((data || []).map((r) => r.student_id));
  },

  async enrollStudentsBatch(subjectCode, studentIds) {
    if (!studentIds.length) return;
    const rows = studentIds.map((student_id) => ({
      student_id,
      subject_code: subjectCode
    }));
    const { error } = await supabase
      .from('enrollments')
      .upsert(rows, { onConflict: 'student_id,subject_code' });
    if (error) throw error;
  },

  async getStudentEnrollments(studentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('subject_code, subjects(code, name, semester, credits, room, schedule)')
      .eq('student_id', studentId);
    if (error) throw error;
    return (data || []).map((r) => r.subjects);
  },

  async getEnrolledStudentsBySubject(subjectCode) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student_id, profiles(id, first_name, last_name, roll_no, email, current_semester)')
      .eq('subject_code', subjectCode);
    if (error) throw error;
    return (data || [])
      .map((r) => r.profiles)
      .filter(Boolean)
      .sort((a, b) => (a.roll_no || '').localeCompare(b.roll_no || ''));
  },

  // ---- UNIVERSITY MARKS (CA1 + CA2 + END-SEM) ----
  async getSubjectMarks(subjectCode) {
    const { data, error } = await supabase
      .from('subject_marks')
      .select('*')
      .eq('subject_code', subjectCode);
    if (error) throw error;
    return data || [];
  },

  async getStudentMarksheet(studentId) {
    const { data, error } = await supabase
      .from('subject_marks')
      .select('*, subjects(code, name, semester, credits)')
      .eq('student_id', studentId)
      .order('subject_code');
    if (error) throw error;
    return data || [];
  },

  async upsertSubjectMark({ studentId, subjectCode, ca1, ca2, endSem, remarks, updatedBy }) {
    const { error } = await supabase.from('subject_marks').upsert(
      {
        student_id: studentId,
        subject_code: subjectCode,
        ca1_marks: ca1,
        ca2_marks: ca2,
        end_sem_marks: endSem,
        remarks: remarks || null,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'student_id,subject_code' }
    );
    if (error) throw error;
  },

  // ---- ATTENDANCE ----
  async getAttendanceForSubjectDate(subjectCode, date) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('subject_code', subjectCode)
      .eq('attendance_date', date);
    if (error) throw error;
    return data || [];
  },

  async upsertAttendanceBatch(rows) {
    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,subject_code,attendance_date' });
    if (error) throw error;
  },

  // ---- GOALS & INTERVENTIONS ----
  async getStudentGoals(studentId) {
    const { data, error } = await supabase
      .from('student_goals')
      .select('*')
      .eq('student_id', studentId)
      .order('deadline');
    if (error) throw error;
    return data || [];
  },

  async addStudentGoal(goal) {
    const { error } = await supabase.from('student_goals').insert(goal);
    if (error) throw error;
  },

  async deleteStudentGoal(goalId) {
    const { error } = await supabase.from('student_goals').delete().eq('id', goalId);
    if (error) throw error;
  },

  async getInterventions(studentId = null) {
    let query = supabase
      .from('interventions')
      .select('*, student:profiles!student_id(first_name, last_name, roll_no)')
      .order('created_at', { ascending: false })
      .limit(15);
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async logIntervention({ studentId, facultyId, category, actionTaken }) {
    const { error } = await supabase.from('interventions').insert({
      student_id: studentId,
      faculty_id: facultyId,
      category,
      action_taken: actionTaken
    });
    if (error) throw error;
  }
};
