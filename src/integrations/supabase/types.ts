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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string
          notes: string | null
          program_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          marked_by: string
          notes?: string | null
          program_id: string
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string
          notes?: string | null
          program_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_courses: {
        Row: {
          certification_id: string
          id: string
          program_id: string
        }
        Insert: {
          certification_id: string
          id?: string
          program_id: string
        }
        Update: {
          certification_id?: string
          id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_courses_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          provider: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider?: string | null
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          details: Json | null
          id: string
          ran_at: string
          records_deleted: number
        }
        Insert: {
          details?: Json | null
          id?: string
          ran_at?: string
          records_deleted?: number
        }
        Update: {
          details?: Json | null
          id?: string
          ran_at?: string
          records_deleted?: number
        }
        Relationships: []
      }
      course_batches: {
        Row: {
          batch_number: number
          created_at: string
          current_count: number
          id: string
          location_id: string
          max_students: number
          program_id: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_number?: number
          created_at?: string
          current_count?: number
          id?: string
          location_id: string
          max_students?: number
          program_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_number?: number
          created_at?: string
          current_count?: number
          id?: string
          location_id?: string
          max_students?: number
          program_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_batches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          attended_sessions: number | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          program_id: string
          started_at: string | null
          status: string
          student_id: string
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          attended_sessions?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          program_id: string
          started_at?: string | null
          status?: string
          student_id: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          attended_sessions?: number | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          program_id?: string
          started_at?: string | null
          status?: string
          student_id?: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          payment_provider: string | null
          payment_reference: string | null
          registration_id: string
          status: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          registration_id: string
          status?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          registration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      geolocation_checkins: {
        Row: {
          check_in_time: string | null
          created_at: string | null
          device_info: Json | null
          distance_from_center_meters: number | null
          id: string
          ip_address: string | null
          is_within_geofence: boolean
          latitude: number
          longitude: number
          notes: string | null
          session_id: string
          student_id: string
          user_agent: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          check_in_time?: string | null
          created_at?: string | null
          device_info?: Json | null
          distance_from_center_meters?: number | null
          id?: string
          ip_address?: string | null
          is_within_geofence?: boolean
          latitude: number
          longitude: number
          notes?: string | null
          session_id: string
          student_id: string
          user_agent?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          check_in_time?: string | null
          created_at?: string | null
          device_info?: Json | null
          distance_from_center_meters?: number | null
          id?: string
          ip_address?: string | null
          is_within_geofence?: boolean
          latitude?: number
          longitude?: number
          notes?: string | null
          session_id?: string
          student_id?: string
          user_agent?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geolocation_checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geolocation_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_programs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location_id: string
          program_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id: string
          program_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_programs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          phone: string | null
          specialization: string | null
          suspended_at: string | null
          suspended_by: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean
          phone?: string | null
          specialization?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          specialization?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          category: string
          created_at: string | null
          curriculum: Json | null
          description: string | null
          duration: string
          duration_unit: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_students: number | null
          name: string
          program_code: number | null
          registration_fee: number | null
          requirements: string[] | null
          start_date: string | null
          tuition_fee: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          curriculum?: Json | null
          description?: string | null
          duration: string
          duration_unit?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_students?: number | null
          name: string
          program_code?: number | null
          registration_fee?: number | null
          requirements?: string[] | null
          start_date?: string | null
          tuition_fee?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          curriculum?: Json | null
          description?: string | null
          duration?: string
          duration_unit?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_students?: number | null
          name?: string
          program_code?: number | null
          registration_fee?: number | null
          requirements?: string[] | null
          start_date?: string | null
          tuition_fee?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      scholarship_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          employment_status: string
          granted_percentage: number | null
          household_size: number
          how_training_helps: string
          id: string
          monthly_income: string
          motivation: string
          program_id: string
          requested_percentage: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          supporting_info: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          employment_status: string
          granted_percentage?: number | null
          household_size?: number
          how_training_helps: string
          id?: string
          monthly_income: string
          motivation: string
          program_id: string
          requested_percentage?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          supporting_info?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          employment_status?: string
          granted_percentage?: number | null
          household_size?: number
          how_training_helps?: string
          id?: string
          monthly_income?: string
          motivation?: string
          program_id?: string
          requested_percentage?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          supporting_info?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarship_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scholarship_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_enrollments: {
        Row: {
          enrolled_at: string | null
          id: string
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string | null
          id?: string
          session_id: string
          status?: string
          student_id: string
        }
        Update: {
          enrolled_at?: string | null
          id?: string
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_enrollments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value?: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      student_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_reference: string | null
          payment_type: string
          program_id: string
          recorded_by: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          payment_type?: string
          program_id: string
          recorded_by?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          payment_type?: string
          program_id?: string
          recorded_by?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          account_created: boolean
          address: string | null
          alternative_phone: string | null
          batch_id: string | null
          can_attend_weekly: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_income: string | null
          date_of_birth: string | null
          education_level: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          guarantor_address: string | null
          guarantor_email: string | null
          guarantor_full_name: string | null
          guarantor_phone: string | null
          how_heard_about_us: string | null
          id: string
          is_pwd: string | null
          last_name: string
          lga: string | null
          matriculation_number: string | null
          middle_name: string | null
          notes: string | null
          payment_plan: string | null
          payment_status: string
          phone: string
          preferred_location_id: string | null
          previous_experience: string | null
          program_id: string | null
          projected_batch_number: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string | null
          terms_accepted: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_created?: boolean
          address?: string | null
          alternative_phone?: string | null
          batch_id?: string | null
          can_attend_weekly?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_income?: string | null
          date_of_birth?: string | null
          education_level?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          guarantor_address?: string | null
          guarantor_email?: string | null
          guarantor_full_name?: string | null
          guarantor_phone?: string | null
          how_heard_about_us?: string | null
          id?: string
          is_pwd?: string | null
          last_name: string
          lga?: string | null
          matriculation_number?: string | null
          middle_name?: string | null
          notes?: string | null
          payment_plan?: string | null
          payment_status?: string
          phone: string
          preferred_location_id?: string | null
          previous_experience?: string | null
          program_id?: string | null
          projected_batch_number?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_created?: boolean
          address?: string | null
          alternative_phone?: string | null
          batch_id?: string | null
          can_attend_weekly?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_income?: string | null
          date_of_birth?: string | null
          education_level?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          guarantor_address?: string | null
          guarantor_email?: string | null
          guarantor_full_name?: string | null
          guarantor_phone?: string | null
          how_heard_about_us?: string | null
          id?: string
          is_pwd?: string | null
          last_name?: string
          lga?: string | null
          matriculation_number?: string | null
          middle_name?: string | null
          notes?: string | null
          payment_plan?: string | null
          payment_status?: string
          phone?: string
          preferred_location_id?: string | null
          previous_experience?: string | null
          program_id?: string | null
          projected_batch_number?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string | null
          terms_accepted?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_preferred_location_id_fkey"
            columns: ["preferred_location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          experience_years: number | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          phone: string
          qualification: string | null
          specialization: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          experience_years?: number | null
          first_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name: string
          phone: string
          qualification?: string | null
          specialization: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          experience_years?: number | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string
          qualification?: string | null
          specialization?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_locations: {
        Row: {
          address: string
          city: string
          code: string
          created_at: string | null
          email: string | null
          geofence_radius_meters: number
          id: string
          is_active: boolean | null
          latitude: number
          location_code: number | null
          longitude: number
          name: string
          phone: string | null
          state: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city: string
          code: string
          created_at?: string | null
          email?: string | null
          geofence_radius_meters?: number
          id?: string
          is_active?: boolean | null
          latitude: number
          location_code?: number | null
          longitude: number
          name: string
          phone?: string | null
          state: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string
          code?: string
          created_at?: string | null
          email?: string | null
          geofence_radius_meters?: number
          id?: string
          is_active?: boolean | null
          latitude?: number
          location_code?: number | null
          longitude?: number
          name?: string
          phone?: string | null
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          cancellation_reason: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          id: string
          instructor_id: string | null
          is_cancelled: boolean | null
          location_id: string
          max_attendees: number
          program_id: string
          session_date: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          id?: string
          instructor_id?: string | null
          is_cancelled?: boolean | null
          location_id: string
          max_attendees?: number
          program_id: string
          session_date: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          is_cancelled?: boolean | null
          location_id?: string
          max_attendees?: number
          program_id?: string
          session_date?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "training_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_matriculation_number: {
        Args: {
          p_batch_id: string
          p_batch_number: number
          p_location_id: string
          p_program_id: string
        }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      toggle_user_suspension: {
        Args: { suspend: boolean; target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "accountant" | "teacher" | "student"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "super_admin", "accountant", "teacher", "student"],
    },
  },
} as const
