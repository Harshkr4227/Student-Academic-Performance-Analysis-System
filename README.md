## 🗄️ Database Design & Entity-Relationship (ER) Diagram

**Role:** Database Architect & Schema Designer (PostgreSQL / Supabase)

The backend data layer is normalized to **Third Normal Form (3NF)** and enforces data integrity, automated 10-point credit grading, and academic risk classification directly inside PostgreSQL using `CHECK` constraints, `GENERATED ALWAYS AS ... STORED` columns, triggers, analytical views, and Row-Level Security (RLS).

### Entity-Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ SUBJECTS : "teaches (faculty_id)"
    PROFILES ||--o{ ENROLLMENTS : "enrolls in (student_id)"
    SUBJECTS ||--o{ ENROLLMENTS : "has roster (subject_code)"

    PROFILES ||--o{ SUBJECT_MARKS : "receives (student_id)"
    SUBJECTS ||--o{ SUBJECT_MARKS : "evaluated in (subject_code)"
    PROFILES ||--o{ SUBJECT_MARKS : "graded by (updated_by)"

    PROFILES ||--o{ ATTENDANCE : "recorded for (student_id)"
    SUBJECTS ||--o{ ATTENDANCE : "tracked in (subject_code)"

    PROFILES ||--o{ STUDENT_GOALS : "sets (student_id)"
    PROFILES ||--o{ INTERVENTIONS : "flagged in (student_id)"
    PROFILES ||--o{ INTERVENTIONS : "logs action (faculty_id)"

    PROFILES {
        uuid id PK "Default gen_random_uuid()"
        text email UK "Unique university email"
        text role "CHECK ('student', 'teacher')"
        text first_name
        text last_name
        text roll_no UK "UnvRollNo (NULL for faculty)"
        text department "Default 'CSE (Data Science)'"
        int current_semester "CHECK (1 to 8)"
        timestamptz created_at
    }

    SUBJECTS {
        text code PK "e.g., PCC-CS501"
        text name
        text department
        int semester "CHECK (1 to 8)"
        int credits "CHECK (1 to 6)"
        uuid faculty_id FK "References profiles(id)"
        text room
        jsonb schedule "Weekly lecture slots"
        timestamptz created_at
    }

    ENROLLMENTS {
        uuid id PK
        uuid student_id FK "References profiles(id)"
        text subject_code FK "References subjects(code)"
        text academic_year "Default '2025-26'"
        date enrolled_at
    }

    SUBJECT_MARKS {
        uuid id PK
        uuid student_id FK "References profiles(id)"
        text subject_code FK "References subjects(code)"
        numeric ca1_marks "CHECK (0 to 15)"
        numeric ca2_marks "CHECK (0 to 15)"
        numeric end_sem_marks "CHECK (0 to 70)"
        numeric internal_total "GENERATED: ca1 + ca2 (30)"
        numeric total_marks "GENERATED: internal + end_sem (100)"
        text letter_grade "GENERATED: O, E, A, B, C, D, F"
        int grade_point "GENERATED: 10 down to 0"
        boolean is_backlog "GENERATED: internal < 12 OR total < 40"
        text remarks
        uuid updated_by FK "References profiles(id)"
        timestamptz updated_at
    }

    ATTENDANCE {
        uuid id PK
        uuid student_id FK "References profiles(id)"
        text subject_code FK "References subjects(code)"
        date attendance_date
        text status "CHECK ('present', 'absent', 'late')"
        text notes
    }

    STUDENT_GOALS {
        uuid id PK
        uuid student_id FK "References profiles(id)"
        text title
        text category "CGPA | Attendance | Backlog | Skill"
        text target_value
        int progress "CHECK (0 to 100)"
        date deadline
        timestamptz created_at
    }

    INTERVENTIONS {
        uuid id PK
        uuid student_id FK "References profiles(id)"
        uuid faculty_id FK "References profiles(id)"
        text category "Shortage | Backlog | Internals | Counseling"
        text action_taken
        timestamptz created_at
    }
