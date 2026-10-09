export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          id: string
          name: string
          required_xp: number
        }
        Insert: {
          description: string
          id: string
          name: string
          required_xp: number
        }
        Update: {
          description?: string
          id?: string
          name?: string
          required_xp?: number
        }
        Relationships: []
      }
      activity_attempts: {
        Row: {
          activity_id: string
          confidence: string
          correct: boolean
          created_at: string
          response: Json
          user_id: string
        }
        Insert: {
          activity_id: string
          confidence: string
          correct: boolean
          created_at?: string
          response: Json
          user_id: string
        }
        Update: {
          activity_id?: string
          confidence?: string
          correct?: boolean
          created_at?: string
          response?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attempts_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "learning_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_threads: {
        Row: {
          created_at: string
          id: string
          question_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_threads_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          status: string
          tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: string
          tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_annotations: {
        Row: {
          question_id: string
          reason: string
          resolved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          question_id: string
          reason: string
          resolved?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          question_id?: string
          reason?: string
          resolved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_annotations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          front: string
          id: string
          interval_days: number
          last_reviewed: string | null
          next_review: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          front: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string
          topic_id?: string | null
          user_id?: string
        }
        Update: {
          back?: string
          created_at?: string
          front?: string
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          next_review?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_activities: {
        Row: {
          difficulty: number
          id: string
          kind: string
          lesson_id: string
          payload: Json
          position: number
          prompt: string
          status: string
        }
        Insert: {
          difficulty: number
          id?: string
          kind: string
          lesson_id: string
          payload?: Json
          position?: number
          prompt: string
          status?: string
        }
        Update: {
          difficulty?: number
          id?: string
          kind?: string
          lesson_id?: string
          payload?: Json
          position?: number
          prompt?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_reflections: {
        Row: {
          explanation: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          explanation: string
          lesson_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          explanation?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_reflections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          answered: number
          correct: number
          current_question_id: string | null
          expires_at: string | null
          finished_at: string | null
          hint_used: boolean
          id: string
          mode: string
          question_served_at: string | null
          review_source: string | null
          started_at: string
          subject_id: string | null
          target: number
          topic_id: string | null
          user_id: string
        }
        Insert: {
          answered?: number
          correct?: number
          current_question_id?: string | null
          expires_at?: string | null
          finished_at?: string | null
          hint_used?: boolean
          id?: string
          mode: string
          question_served_at?: string | null
          review_source?: string | null
          started_at?: string
          subject_id?: string | null
          target: number
          topic_id?: string | null
          user_id: string
        }
        Update: {
          answered?: number
          correct?: number
          current_question_id?: string | null
          expires_at?: string | null
          finished_at?: string | null
          hint_used?: boolean
          id?: string
          mode?: string
          question_served_at?: string | null
          review_source?: string | null
          started_at?: string
          subject_id?: string | null
          target?: number
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_review_source_fkey"
            columns: ["review_source"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          example: string
          explanation: string
          id: string
          status: string
          title: string
          topic_id: string
        }
        Insert: {
          example: string
          explanation: string
          id?: string
          status?: string
          title: string
          topic_id: string
        }
        Update: {
          example?: string
          explanation?: string
          id?: string
          status?: string
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          achievements: boolean
          news: boolean
          study: boolean
          user_id: string
        }
        Insert: {
          achievements?: boolean
          news?: boolean
          study?: boolean
          user_id: string
        }
        Update: {
          achievements?: boolean
          news?: boolean
          study?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          dismissed_at: string | null
          href: string
          id: string
          kind: string
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key: string
          dismissed_at?: string | null
          href: string
          id?: string
          kind: string
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          dismissed_at?: string | null
          href?: string
          id?: string
          kind?: string
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          daily_ai: number
          daily_questions: number
          id: string
          max_simulation: number
          name: string
        }
        Insert: {
          daily_ai: number
          daily_questions: number
          id: string
          max_simulation: number
          name: string
        }
        Update: {
          daily_ai?: number
          daily_questions?: number
          id?: string
          max_simulation?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          content_locale: string
          created_at: string
          daily_goal: number
          date_format: string
          goal: string
          id: string
          last_study_day: string | null
          level: string
          name: string
          onboarding_complete: boolean
          region: string
          streak: number
          time_zone: string
          ui_locale: string | null
          xp: number
        }
        Insert: {
          content_locale?: string
          created_at?: string
          daily_goal?: number
          date_format?: string
          goal?: string
          id: string
          last_study_day?: string | null
          level?: string
          name?: string
          onboarding_complete?: boolean
          region?: string
          streak?: number
          time_zone?: string
          ui_locale?: string | null
          xp?: number
        }
        Update: {
          content_locale?: string
          created_at?: string
          daily_goal?: number
          date_format?: string
          goal?: string
          id?: string
          last_study_day?: string | null
          level?: string
          name?: string
          onboarding_complete?: boolean
          region?: string
          streak?: number
          time_zone?: string
          ui_locale?: string | null
          xp?: number
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          correct: boolean
          created_at: string
          hint_used: boolean
          id: string
          question_id: string
          seconds: number
          selected: number
          session_id: string
          user_id: string
          xp: number
        }
        Insert: {
          correct: boolean
          created_at?: string
          hint_used: boolean
          id?: string
          question_id: string
          seconds: number
          selected: number
          session_id: string
          user_id: string
          xp: number
        }
        Update: {
          correct?: boolean
          created_at?: string
          hint_used?: boolean
          id?: string
          question_id?: string
          seconds?: number
          selected?: number
          session_id?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_reports: {
        Row: {
          created_at: string
          detail: string
          id: string
          question_id: string
          reason: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          question_id: string
          reason: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          question_id?: string
          reason?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: number
          exam: string
          fingerprint: string
          id: string
          locale: string
          options: Json
          question_type: string
          review_status: string
          skills: string[]
          source: string
          source_language: string
          source_year: number | null
          statement: string
          status: string
          subject_id: string
          subtopic_id: string | null
          tags: string[]
          topic_id: string
          translation_of: string | null
          translation_source: string | null
          translation_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          exam?: string
          fingerprint: string
          id?: string
          locale?: string
          options: Json
          question_type?: string
          review_status?: string
          skills?: string[]
          source?: string
          source_language?: string
          source_year?: number | null
          statement: string
          status?: string
          subject_id: string
          subtopic_id?: string | null
          tags?: string[]
          topic_id: string
          translation_of?: string | null
          translation_source?: string | null
          translation_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          exam?: string
          fingerprint?: string
          id?: string
          locale?: string
          options?: Json
          question_type?: string
          review_status?: string
          skills?: string[]
          source?: string
          source_language?: string
          source_year?: number | null
          statement?: string
          status?: string
          subject_id?: string
          subtopic_id?: string | null
          tags?: string[]
          topic_id?: string
          translation_of?: string | null
          translation_source?: string | null
          translation_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subtopic_id_topic_id_fkey"
            columns: ["subtopic_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "subtopics"
            referencedColumns: ["id", "topic_id"]
          },
          {
            foreignKeyName: "questions_topic_id_subject_id_fkey"
            columns: ["topic_id", "subject_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "subject_id"]
          },
          {
            foreignKeyName: "questions_translation_of_fkey"
            columns: ["translation_of"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          interval_days: number
          last_reviewed: string
          next_review: string
          question_id: string
          user_id: string
        }
        Insert: {
          interval_days?: number
          last_reviewed?: string
          next_review: string
          question_id: string
          user_id: string
        }
        Update: {
          interval_days?: number
          last_reviewed?: string
          next_review?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan_items: {
        Row: {
          created_at: string
          day: string
          kind: string
          target: number
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          kind: string
          target: number
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          kind?: string
          target?: number
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_items_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plan_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          name: string
          position: number
          slug: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          slug: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          last_event_at: string
          period_end: string
          plan_id: string
          provider_reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_event_at?: string
          period_end: string
          plan_id: string
          provider_reference?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_event_at?: string
          period_end?: string
          plan_id?: string
          provider_reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subtopics: {
        Row: {
          id: string
          name: string
          topic_id: string
        }
        Insert: {
          id?: string
          name: string
          topic_id: string
        }
        Update: {
          id?: string
          name?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_mastery: {
        Row: {
          attempts: number
          score: number
          streak: number
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          score?: number
          streak?: number
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          score?: number
          streak?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_mastery_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_mastery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_prerequisites: {
        Row: {
          prerequisite_id: string
          topic_id: string
        }
        Insert: {
          prerequisite_id: string
          topic_id: string
        }
        Update: {
          prerequisite_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_prerequisites_prerequisite_id_fkey"
            columns: ["prerequisite_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_prerequisites_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          ai: number
          day: string
          questions: number
          user_id: string
        }
        Insert: {
          ai?: number
          day: string
          questions?: number
          user_id: string
        }
        Update: {
          ai?: number
          day?: string
          questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subjects: {
        Row: {
          subject_id: string
          user_id: string
        }
        Insert: {
          subject_id: string
          user_id: string
        }
        Update: {
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subjects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activity_feedback: { Args: { p_lesson: string }; Returns: Json }
      admin_catalog: {
        Args: {
          p_id?: string
          p_kind: string
          p_name: string
          p_parent?: string
        }
        Returns: string
      }
      admin_finance: { Args: never; Returns: Json }
      admin_health: { Args: never; Returns: Json }
      admin_quality: { Args: never; Returns: Json }
      admin_questions: { Args: never; Returns: Json }
      admin_questions_page: {
        Args: { p_page?: number; p_search?: string }
        Returns: Json
      }
      admin_record_cost: {
        Args: {
          p_amount: number
          p_category: string
          p_currency: string
          p_period: string
        }
        Returns: string
      }
      admin_reports: { Args: never; Returns: Json }
      admin_resolve_report: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_role: { Args: never; Returns: string }
      admin_upsert_question: {
        Args: { p_id?: string; p_question: Json }
        Returns: string
      }
      ai_context: {
        Args: { p_question: string; p_session: string }
        Returns: Json
      }
      apply_billing_event: {
        Args: {
          p_created_at: string
          p_hash: string
          p_id: string
          p_period_end: string
          p_plan: string
          p_status: string
          p_user: string
        }
        Returns: string
      }
      delete_account: { Args: never; Returns: undefined }
      finish_ai: {
        Args: {
          p_answer: string
          p_prompt: string
          p_question: string
          p_success: boolean
          p_tokens: number
          p_usage: string
          p_user: string
        }
        Returns: undefined
      }
      generate_study_plan: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      next_question: { Args: { p_session: string }; Returns: Json }
      report_question: {
        Args: { p_detail: string; p_question: string; p_reason: string }
        Returns: undefined
      }
      reserve_ai: { Args: never; Returns: string }
      review_flashcard: {
        Args: { p_id: string; p_remembered: boolean }
        Returns: undefined
      }
      review_session: { Args: { p_source: string }; Returns: string }
      save_preferences: {
        Args: {
          p_daily_goal: number
          p_goal: string
          p_level: string
          p_name: string
          p_subjects: string[]
        }
        Returns: undefined
      }
      session_feedback: { Args: { p_session: string }; Returns: Json }
      session_question_view: {
        Args: { p_question: string; p_session: string }
        Returns: Json
      }
      start_session: {
        Args: {
          p_minutes?: number
          p_mode: string
          p_subject?: string
          p_target?: number
          p_topic?: string
        }
        Returns: string
      }
      submit_activity: {
        Args: { p_activity: string; p_confidence: string; p_response: Json }
        Returns: Json
      }
      submit_answer: {
        Args: { p_question: string; p_selected: number; p_session: string }
        Returns: Json
      }
      sync_notifications: { Args: never; Returns: undefined }
      valid_time_zone: { Args: { p_zone: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

