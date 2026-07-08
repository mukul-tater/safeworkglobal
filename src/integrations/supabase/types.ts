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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessor_name: string | null
          created_at: string
          created_by: string | null
          employer_id: string | null
          end_time: string | null
          equipment: Json
          id: string
          job_id: string | null
          location: string | null
          media: Json
          overall_score: number | null
          partner_id: string | null
          recommendation: string | null
          remarks: string | null
          scheduled_at: string | null
          scores: Json
          start_time: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          trade_id: string | null
          trade_level: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          assessor_name?: string | null
          created_at?: string
          created_by?: string | null
          employer_id?: string | null
          end_time?: string | null
          equipment?: Json
          id?: string
          job_id?: string | null
          location?: string | null
          media?: Json
          overall_score?: number | null
          partner_id?: string | null
          recommendation?: string | null
          remarks?: string | null
          scheduled_at?: string | null
          scores?: Json
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          trade_id?: string | null
          trade_level?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          assessor_name?: string | null
          created_at?: string
          created_by?: string | null
          employer_id?: string | null
          end_time?: string | null
          equipment?: Json
          id?: string
          job_id?: string | null
          location?: string | null
          media?: Json
          overall_score?: number | null
          partner_id?: string | null
          recommendation?: string | null
          remarks?: string | null
          scheduled_at?: string | null
          scores?: Json
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          trade_id?: string | null
          trade_level?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      background_verifications: {
        Row: {
          completed_at: string | null
          created_at: string | null
          documents_verified: Json | null
          employer_id: string
          id: string
          notes: string | null
          requested_at: string | null
          result: string | null
          status: string
          updated_at: string | null
          verification_type: string
          verified_by: string | null
          worker_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          documents_verified?: Json | null
          employer_id: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          result?: string | null
          status?: string
          updated_at?: string | null
          verification_type: string
          verified_by?: string | null
          worker_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          documents_verified?: Json | null
          employer_id?: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          result?: string | null
          status?: string
          updated_at?: string | null
          verification_type?: string
          verified_by?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      compliance_checks: {
        Row: {
          check_type: string
          created_at: string | null
          entity_id: string
          entity_type: string
          findings: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          status: string
        }
        Insert: {
          check_type: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          findings?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          status?: string
        }
        Update: {
          check_type?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          findings?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          action_taken: string | null
          content_id: string
          content_type: string
          created_at: string | null
          description: string | null
          flag_reason: string
          flagged_by: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          description?: string | null
          flag_reason: string
          flagged_by?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          description?: string | null
          flag_reason?: string
          flagged_by?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          change_summary: string | null
          contract_url: string
          created_at: string
          formality_id: string
          id: string
          is_current: boolean | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          contract_url: string
          created_at?: string
          formality_id: string
          id?: string
          is_current?: boolean | null
          uploaded_by: string
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          contract_url?: string
          created_at?: string
          formality_id?: string
          id?: string
          is_current?: boolean | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_formality_id_fkey"
            columns: ["formality_id"]
            isOneToOne: false
            referencedRelation: "job_formalities"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string
          dispute_type: string
          evidence: Json | null
          filed_against: string
          filed_by: string
          id: string
          job_id: string | null
          priority: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description: string
          dispute_type: string
          evidence?: Json | null
          filed_against: string
          filed_by: string
          id?: string
          job_id?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string
          dispute_type?: string
          evidence?: Json | null
          filed_against?: string
          filed_by?: string
          id?: string
          job_id?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_company_info: {
        Row: {
          bio: string | null
          business_type: string | null
          company_logo_url: string | null
          company_name: string | null
          company_size: string | null
          country: string | null
          created_at: string | null
          follows_safety_standards: boolean | null
          industry: string | null
          office_state: string | null
          provides_ppe: string | null
          site_safety_level: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_type?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          follows_safety_standards?: boolean | null
          industry?: string | null
          office_state?: string | null
          provides_ppe?: string | null
          site_safety_level?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_type?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          follows_safety_standards?: boolean | null
          industry?: string | null
          office_state?: string | null
          provides_ppe?: string | null
          site_safety_level?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          billing_address: string | null
          bio: string | null
          business_type: string | null
          cin_number: string | null
          company_logo_url: string | null
          company_name: string | null
          company_registration: string | null
          company_size: string | null
          country: string | null
          created_at: string | null
          employer_role: string | null
          expected_start_date: string | null
          follows_safety_standards: boolean | null
          gst_number: string | null
          hiring_roles: string[] | null
          id: string
          id_number: string | null
          id_type: string | null
          industry: string | null
          job_type: string | null
          office_address: string | null
          office_state: string | null
          onboarding_completed: boolean | null
          payment_method_preference: string | null
          preferred_countries: string[] | null
          provides_ppe: string | null
          salary_amount: number | null
          salary_type: string | null
          site_safety_level: string | null
          tax_info_number: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          work_locations: string[] | null
          worker_type_needed: string | null
          workers_required: number | null
        }
        Insert: {
          billing_address?: string | null
          bio?: string | null
          business_type?: string | null
          cin_number?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_registration?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          employer_role?: string | null
          expected_start_date?: string | null
          follows_safety_standards?: boolean | null
          gst_number?: string | null
          hiring_roles?: string[] | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          industry?: string | null
          job_type?: string | null
          office_address?: string | null
          office_state?: string | null
          onboarding_completed?: boolean | null
          payment_method_preference?: string | null
          preferred_countries?: string[] | null
          provides_ppe?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          site_safety_level?: string | null
          tax_info_number?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          work_locations?: string[] | null
          worker_type_needed?: string | null
          workers_required?: number | null
        }
        Update: {
          billing_address?: string | null
          bio?: string | null
          business_type?: string | null
          cin_number?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_registration?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string | null
          employer_role?: string | null
          expected_start_date?: string | null
          follows_safety_standards?: boolean | null
          gst_number?: string | null
          hiring_roles?: string[] | null
          id?: string
          id_number?: string | null
          id_type?: string | null
          industry?: string | null
          job_type?: string | null
          office_address?: string | null
          office_state?: string | null
          onboarding_completed?: boolean | null
          payment_method_preference?: string | null
          preferred_countries?: string[] | null
          provides_ppe?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          site_safety_level?: string | null
          tax_info_number?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          work_locations?: string[] | null
          worker_type_needed?: string | null
          workers_required?: number | null
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          currency_code: string
          id: string
          inr_per_unit: number
          source: string | null
          updated_at: string
        }
        Insert: {
          currency_code: string
          id?: string
          inr_per_unit: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          currency_code?: string
          id?: string
          inr_per_unit?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string | null
          duration_minutes: number
          employer_id: string
          feedback: string | null
          id: string
          interview_mode: string
          job_id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          duration_minutes?: number
          employer_id: string
          feedback?: string | null
          id?: string
          interview_mode?: string
          job_id: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          duration_minutes?: number
          employer_id?: string
          feedback?: string | null
          id?: string
          interview_mode?: string
          job_id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          cover_letter: string | null
          employer_id: string
          id: string
          job_id: string
          notes: string | null
          resume_url: string | null
          status: string
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          applied_at?: string | null
          cover_letter?: string | null
          employer_id: string
          id?: string
          job_id: string
          notes?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          applied_at?: string | null
          cover_letter?: string | null
          employer_id?: string
          id?: string
          job_id?: string
          notes?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_formalities: {
        Row: {
          actual_joining_date: string | null
          application_id: string
          arrival_date: string | null
          completion_percentage: number | null
          contract_expiry_date: string | null
          contract_reminder_sent: boolean | null
          contract_sent: boolean | null
          contract_signed: boolean | null
          contract_signed_date: string | null
          contract_url: string | null
          created_at: string | null
          departure_date: string | null
          ecr_certificate_url: string | null
          ecr_check_required: boolean | null
          ecr_check_status: string | null
          ecr_clearance_date: string | null
          expected_joining_date: string | null
          flight_booking_status: string | null
          id: string
          job_id: string
          medical_certificate_url: string | null
          medical_exam_date: string | null
          medical_exam_required: boolean | null
          medical_exam_status: string | null
          notes: string | null
          overall_status: string | null
          police_certificate_url: string | null
          police_verification_date: string | null
          police_verification_required: boolean | null
          police_verification_status: string | null
          travel_details: Json | null
          updated_at: string | null
          visa_application_date: string | null
          visa_approval_date: string | null
          visa_expiry_date: string | null
          visa_required: boolean | null
          visa_status: string | null
          visa_type: string | null
          worker_id: string
        }
        Insert: {
          actual_joining_date?: string | null
          application_id: string
          arrival_date?: string | null
          completion_percentage?: number | null
          contract_expiry_date?: string | null
          contract_reminder_sent?: boolean | null
          contract_sent?: boolean | null
          contract_signed?: boolean | null
          contract_signed_date?: string | null
          contract_url?: string | null
          created_at?: string | null
          departure_date?: string | null
          ecr_certificate_url?: string | null
          ecr_check_required?: boolean | null
          ecr_check_status?: string | null
          ecr_clearance_date?: string | null
          expected_joining_date?: string | null
          flight_booking_status?: string | null
          id?: string
          job_id: string
          medical_certificate_url?: string | null
          medical_exam_date?: string | null
          medical_exam_required?: boolean | null
          medical_exam_status?: string | null
          notes?: string | null
          overall_status?: string | null
          police_certificate_url?: string | null
          police_verification_date?: string | null
          police_verification_required?: boolean | null
          police_verification_status?: string | null
          travel_details?: Json | null
          updated_at?: string | null
          visa_application_date?: string | null
          visa_approval_date?: string | null
          visa_expiry_date?: string | null
          visa_required?: boolean | null
          visa_status?: string | null
          visa_type?: string | null
          worker_id: string
        }
        Update: {
          actual_joining_date?: string | null
          application_id?: string
          arrival_date?: string | null
          completion_percentage?: number | null
          contract_expiry_date?: string | null
          contract_reminder_sent?: boolean | null
          contract_sent?: boolean | null
          contract_signed?: boolean | null
          contract_signed_date?: string | null
          contract_url?: string | null
          created_at?: string | null
          departure_date?: string | null
          ecr_certificate_url?: string | null
          ecr_check_required?: boolean | null
          ecr_check_status?: string | null
          ecr_clearance_date?: string | null
          expected_joining_date?: string | null
          flight_booking_status?: string | null
          id?: string
          job_id?: string
          medical_certificate_url?: string | null
          medical_exam_date?: string | null
          medical_exam_required?: boolean | null
          medical_exam_status?: string | null
          notes?: string | null
          overall_status?: string | null
          police_certificate_url?: string | null
          police_verification_date?: string | null
          police_verification_required?: boolean | null
          police_verification_status?: string | null
          travel_details?: Json | null
          updated_at?: string | null
          visa_application_date?: string | null
          visa_approval_date?: string | null
          visa_expiry_date?: string | null
          visa_required?: boolean | null
          visa_status?: string | null
          visa_type?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_formalities_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_formalities_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          skill_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          skill_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          benefits: string | null
          country: string
          created_at: string | null
          currency: string
          description: string
          employer_id: string
          experience_level: string
          expires_at: string | null
          id: string
          job_type: string
          location: string
          openings: number
          posted_at: string | null
          remote_allowed: boolean | null
          requirements: string | null
          responsibilities: string | null
          salary_display: string | null
          salary_max: number | null
          salary_min: number | null
          slug: string | null
          status: string
          title: string
          updated_at: string | null
          visa_sponsorship: boolean | null
        }
        Insert: {
          benefits?: string | null
          country: string
          created_at?: string | null
          currency?: string
          description: string
          employer_id: string
          experience_level: string
          expires_at?: string | null
          id?: string
          job_type: string
          location: string
          openings?: number
          posted_at?: string | null
          remote_allowed?: boolean | null
          requirements?: string | null
          responsibilities?: string | null
          salary_display?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string | null
          visa_sponsorship?: boolean | null
        }
        Update: {
          benefits?: string | null
          country?: string
          created_at?: string | null
          currency?: string
          description?: string
          employer_id?: string
          experience_level?: string
          expires_at?: string | null
          id?: string
          job_type?: string
          location?: string
          openings?: number
          posted_at?: string | null
          remote_allowed?: boolean | null
          requirements?: string | null
          responsibilities?: string | null
          salary_display?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          visa_sponsorship?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          flagged_reason: string | null
          id: string
          is_flagged: boolean | null
          is_read: boolean | null
          job_id: string | null
          parent_message_id: string | null
          receiver_id: string
          sender_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          job_id?: string | null
          parent_message_id?: string | null
          receiver_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          flagged_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_read?: boolean | null
          job_id?: string | null
          parent_message_id?: string | null
          receiver_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          application_id: string
          benefits: string[] | null
          created_at: string | null
          employer_id: string
          expiry_date: string | null
          id: string
          job_id: string
          notes: string | null
          responded_at: string | null
          salary_amount: number
          salary_currency: string
          sent_at: string | null
          start_date: string
          status: string
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          application_id: string
          benefits?: string[] | null
          created_at?: string | null
          employer_id: string
          expiry_date?: string | null
          id?: string
          job_id: string
          notes?: string | null
          responded_at?: string | null
          salary_amount: number
          salary_currency?: string
          sent_at?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          application_id?: string
          benefits?: string[] | null
          created_at?: string | null
          employer_id?: string
          expiry_date?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          responded_at?: string | null
          salary_amount?: number
          salary_currency?: string
          sent_at?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          partner_profile_id: string
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          partner_profile_id: string
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          partner_profile_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_activities_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          completed_at: string | null
          id: string
          metadata: Json
          partner_id: string
          status: string
          subject_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type: string
          completed_at?: string | null
          id?: string
          metadata?: Json
          partner_id: string
          status?: string
          subject_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          completed_at?: string | null
          id?: string
          metadata?: Json
          partner_id?: string
          status?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_url: string
          id: string
          notes: string | null
          partner_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_url: string
          id?: string
          notes?: string | null
          partner_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          partner_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_incentives: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          incentive_type: Database["public"]["Enums"]["partner_incentive_type"]
          partner_profile_id: string
          worker_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          incentive_type: Database["public"]["Enums"]["partner_incentive_type"]
          partner_profile_id: string
          worker_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          incentive_type?: Database["public"]["Enums"]["partner_incentive_type"]
          partner_profile_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_incentives_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_incentives_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "partner_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          partner_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          partner_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          partner_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_notifications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_permissions: {
        Row: {
          id: string
          partner_id: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          partner_id?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_permissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          aadhaar_back_url: string | null
          aadhaar_front_url: string | null
          aadhaar_number: string | null
          accepted_privacy: boolean | null
          accepted_terms: boolean | null
          account_holder: string | null
          account_number: string | null
          address: string | null
          address_proof_url: string | null
          agency_name: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          center_name: string | null
          commission_rate: number | null
          compliance_acknowledged_at: string | null
          confirmed_accuracy: boolean | null
          created_at: string | null
          current_step: number
          district: string | null
          email: string | null
          emitra_certificate_url: string | null
          emitra_id: string | null
          has_computer: boolean | null
          has_internet: boolean | null
          has_printer: boolean | null
          has_scanner: boolean | null
          id: string
          ifsc: string | null
          info_request_message: string | null
          leaderboard_rank: number | null
          license_number: string | null
          mobile: string | null
          mobile_verified: boolean | null
          monthly_footfall: number | null
          no_jobs_promise: boolean | null
          no_unauthorized_fees: boolean | null
          offers_doc_scanning: boolean | null
          offers_passport_service: boolean | null
          offers_worker_registration: boolean | null
          owner_name: string | null
          owner_photo_url: string | null
          pan_card_url: string | null
          pan_number: string | null
          partner_code: string | null
          pincode: string | null
          regions_covered: string[] | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          services_offered: string[] | null
          shop_photo_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["partner_status"]
          submitted_at: string | null
          tier: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned: number | null
          total_placements: number | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
          village_city: string | null
          whatsapp: string | null
          worker_categories: string[] | null
          workers_placed: number | null
          workers_registered: number | null
          years_in_operation: number | null
        }
        Insert: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          address_proof_url?: string | null
          agency_name?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          center_name?: string | null
          commission_rate?: number | null
          compliance_acknowledged_at?: string | null
          confirmed_accuracy?: boolean | null
          created_at?: string | null
          current_step?: number
          district?: string | null
          email?: string | null
          emitra_certificate_url?: string | null
          emitra_id?: string | null
          has_computer?: boolean | null
          has_internet?: boolean | null
          has_printer?: boolean | null
          has_scanner?: boolean | null
          id?: string
          ifsc?: string | null
          info_request_message?: string | null
          leaderboard_rank?: number | null
          license_number?: string | null
          mobile?: string | null
          mobile_verified?: boolean | null
          monthly_footfall?: number | null
          no_jobs_promise?: boolean | null
          no_unauthorized_fees?: boolean | null
          offers_doc_scanning?: boolean | null
          offers_passport_service?: boolean | null
          offers_worker_registration?: boolean | null
          owner_name?: string | null
          owner_photo_url?: string | null
          pan_card_url?: string | null
          pan_number?: string | null
          partner_code?: string | null
          pincode?: string | null
          regions_covered?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          shop_photo_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned?: number | null
          total_placements?: number | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
          village_city?: string | null
          whatsapp?: string | null
          worker_categories?: string[] | null
          workers_placed?: number | null
          workers_registered?: number | null
          years_in_operation?: number | null
        }
        Update: {
          aadhaar_back_url?: string | null
          aadhaar_front_url?: string | null
          aadhaar_number?: string | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          address_proof_url?: string | null
          agency_name?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          center_name?: string | null
          commission_rate?: number | null
          compliance_acknowledged_at?: string | null
          confirmed_accuracy?: boolean | null
          created_at?: string | null
          current_step?: number
          district?: string | null
          email?: string | null
          emitra_certificate_url?: string | null
          emitra_id?: string | null
          has_computer?: boolean | null
          has_internet?: boolean | null
          has_printer?: boolean | null
          has_scanner?: boolean | null
          id?: string
          ifsc?: string | null
          info_request_message?: string | null
          leaderboard_rank?: number | null
          license_number?: string | null
          mobile?: string | null
          mobile_verified?: boolean | null
          monthly_footfall?: number | null
          no_jobs_promise?: boolean | null
          no_unauthorized_fees?: boolean | null
          offers_doc_scanning?: boolean | null
          offers_passport_service?: boolean | null
          offers_worker_registration?: boolean | null
          owner_name?: string | null
          owner_photo_url?: string | null
          pan_card_url?: string | null
          pan_number?: string | null
          partner_code?: string | null
          pincode?: string | null
          regions_covered?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          shop_photo_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned?: number | null
          total_placements?: number | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
          village_city?: string | null
          whatsapp?: string | null
          worker_categories?: string[] | null
          workers_placed?: number | null
          workers_registered?: number | null
          years_in_operation?: number | null
        }
        Relationships: []
      }
      partner_profiles_ext: {
        Row: {
          address: string | null
          bank: Json
          company_name: string
          created_at: string
          email: string | null
          gst: string | null
          id: string
          metadata: Json
          mobile: string | null
          owner_name: string | null
          pan: string | null
          partner_id: string
          pincode: string | null
          updated_at: string
          upi: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bank?: Json
          company_name: string
          created_at?: string
          email?: string | null
          gst?: string | null
          id?: string
          metadata?: Json
          mobile?: string | null
          owner_name?: string | null
          pan?: string | null
          partner_id: string
          pincode?: string | null
          updated_at?: string
          upi?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bank?: Json
          company_name?: string
          created_at?: string
          email?: string | null
          gst?: string | null
          id?: string
          metadata?: Json
          mobile?: string | null
          owner_name?: string | null
          pan?: string | null
          partner_id?: string
          pincode?: string | null
          updated_at?: string
          upi?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_ext_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_reward_config: {
        Row: {
          id: boolean
          placement_reward_amount: number
          updated_at: string
          updated_by: string | null
          worker_fee_amount: number
        }
        Insert: {
          id?: boolean
          placement_reward_amount?: number
          updated_at?: string
          updated_by?: string | null
          worker_fee_amount?: number
        }
        Update: {
          id?: boolean
          placement_reward_amount?: number
          updated_at?: string
          updated_by?: string | null
          worker_fee_amount?: number
        }
        Relationships: []
      }
      partner_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          partner_id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          txn_type: Database["public"]["Enums"]["partner_txn_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          partner_id: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          txn_type: Database["public"]["Enums"]["partner_txn_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          partner_id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          txn_type?: Database["public"]["Enums"]["partner_txn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          default_permissions: Json
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          default_permissions?: Json
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          default_permissions?: Json
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      partner_wallets: {
        Row: {
          available_balance: number
          currency: string
          id: string
          partner_id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          available_balance?: number
          currency?: string
          id?: string
          partner_id: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          available_balance?: number
          currency?: string
          id?: string
          partner_id?: string
          pending_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_wallets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_worker_drafts: {
        Row: {
          created_at: string
          current_step: number
          draft_data: Json
          id: string
          partner_profile_id: string
          photo_url: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          partner_profile_id: string
          photo_url?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          partner_profile_id?: string
          photo_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_worker_drafts_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_worker_skill_tests: {
        Row: {
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          fee_received: boolean
          id: string
          notes: string | null
          partner_profile_id: string
          partner_worker_id: string
          stage: Database["public"]["Enums"]["partner_skill_test_stage"]
          status: Database["public"]["Enums"]["partner_skill_test_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          fee_received?: boolean
          id?: string
          notes?: string | null
          partner_profile_id: string
          partner_worker_id: string
          stage: Database["public"]["Enums"]["partner_skill_test_stage"]
          status?: Database["public"]["Enums"]["partner_skill_test_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          fee_received?: boolean
          id?: string
          notes?: string | null
          partner_profile_id?: string
          partner_worker_id?: string
          stage?: Database["public"]["Enums"]["partner_skill_test_stage"]
          status?: Database["public"]["Enums"]["partner_skill_test_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_worker_skill_tests_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_worker_skill_tests_partner_worker_id_fkey"
            columns: ["partner_worker_id"]
            isOneToOne: false
            referencedRelation: "partner_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_worker_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["partner_worker_status"]
          worker_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["partner_worker_status"]
          worker_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["partner_worker_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_worker_status_history_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "partner_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workers: {
        Row: {
          created_at: string
          district: string | null
          expected_salary: number | null
          experience_level: string
          family_consent: boolean | null
          full_name: string
          id: string
          migration_category:
            | Database["public"]["Enums"]["migration_readiness_category"]
            | null
          migration_readiness_score: number | null
          mobile: string
          operator_notes: string | null
          partner_profile_id: string
          passport_available: boolean | null
          phase1_worker_id: number | null
          photo_url: string | null
          preferred_country: string | null
          previous_gcc_experience: boolean | null
          ready_to_relocate: boolean | null
          registration_source: string
          skill: string
          skill_level: string | null
          state: string | null
          status: Database["public"]["Enums"]["partner_worker_status"]
          updated_at: string
          video_url: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          expected_salary?: number | null
          experience_level: string
          family_consent?: boolean | null
          full_name: string
          id?: string
          migration_category?:
            | Database["public"]["Enums"]["migration_readiness_category"]
            | null
          migration_readiness_score?: number | null
          mobile: string
          operator_notes?: string | null
          partner_profile_id: string
          passport_available?: boolean | null
          phase1_worker_id?: number | null
          photo_url?: string | null
          preferred_country?: string | null
          previous_gcc_experience?: boolean | null
          ready_to_relocate?: boolean | null
          registration_source?: string
          skill: string
          skill_level?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_worker_status"]
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          expected_salary?: number | null
          experience_level?: string
          family_consent?: boolean | null
          full_name?: string
          id?: string
          migration_category?:
            | Database["public"]["Enums"]["migration_readiness_category"]
            | null
          migration_readiness_score?: number | null
          mobile?: string
          operator_notes?: string | null
          partner_profile_id?: string
          passport_available?: boolean | null
          phase1_worker_id?: number | null
          photo_url?: string | null
          preferred_country?: string | null
          previous_gcc_experience?: boolean | null
          ready_to_relocate?: boolean | null
          registration_source?: string
          skill?: string
          skill_level?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_worker_status"]
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_workers_partner_profile_id_fkey"
            columns: ["partner_profile_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string | null
          created_at: string
          district: string | null
          id: string
          metadata: Json
          partner_code: string | null
          partner_type_id: string
          rating: number | null
          rejection_reason: string | null
          state: string | null
          status: Database["public"]["Enums"]["partner_org_status"]
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["partner_verification_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          metadata?: Json
          partner_code?: string | null
          partner_type_id: string
          rating?: number | null
          rejection_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_org_status"]
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["partner_verification_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          metadata?: Json
          partner_code?: string | null
          partner_type_id?: string
          rating?: number | null
          rejection_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_org_status"]
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["partner_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partners_partner_type_id_fkey"
            columns: ["partner_type_id"]
            isOneToOne: false
            referencedRelation: "partner_types"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          employer_id: string
          escrow_status: string | null
          gross_amount: number | null
          id: string
          job_id: string | null
          metadata: Json | null
          net_amount: number | null
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          platform_fee: number | null
          platform_fee_percentage: number | null
          released_at: string | null
          released_by: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employer_id: string
          escrow_status?: string | null
          gross_amount?: number | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type: string
          platform_fee?: number | null
          platform_fee_percentage?: number | null
          released_at?: string | null
          released_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employer_id?: string
          escrow_status?: string | null
          gross_amount?: number | null
          id?: string
          job_id?: string | null
          metadata?: Json | null
          net_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          platform_fee?: number | null
          platform_fee_percentage?: number | null
          released_at?: string | null
          released_by?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          mobile_verified: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          mobile_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          mobile_verified?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reward_transactions: {
        Row: {
          amount: number
          application_id: string | null
          created_at: string
          id: string
          job_id: string | null
          partner_id: string
          status: string
          updated_at: string
          withdrawal_id: string | null
          worker_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          partner_id: string
          status?: string
          updated_at?: string
          withdrawal_id?: string | null
          worker_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          partner_id?: string
          status?: string
          updated_at?: string
          withdrawal_id?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_transactions_withdrawal_fk"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_frequency: string | null
          alerts_enabled: boolean | null
          created_at: string | null
          filters: Json
          id: string
          last_alerted_at: string | null
          name: string
          search_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          created_at?: string | null
          filters: Json
          id?: string
          last_alerted_at?: string | null
          name: string
          search_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_frequency?: string | null
          alerts_enabled?: boolean | null
          created_at?: string | null
          filters?: Json
          id?: string
          last_alerted_at?: string | null
          name?: string
          search_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shortlisted_workers: {
        Row: {
          created_at: string | null
          employer_id: string
          id: string
          list_name: string | null
          notes: string | null
          rating: number | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          employer_id: string
          id?: string
          list_name?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          employer_id?: string
          id?: string
          list_name?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_moderation: {
        Row: {
          action: string
          actioned_by: string
          created_at: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          reason: string
          user_id: string
        }
        Insert: {
          action: string
          actioned_by: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason: string
          user_id: string
        }
        Update: {
          action?: string
          actioned_by?: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
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
      withdrawal_requests: {
        Row: {
          account_holder: string | null
          account_number: string | null
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          ifsc: string | null
          paid_at: string | null
          partner_id: string
          payment_reference: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          ifsc?: string | null
          paid_at?: string | null
          partner_id: string
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          ifsc?: string | null
          paid_at?: string | null
          partner_id?: string
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experience: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string
          location: string | null
          start_date: string
          worker_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title: string
          location?: string | null
          start_date: string
          worker_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          start_date?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experience_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      worker_certifications: {
        Row: {
          certification_name: string
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          verified: boolean | null
          worker_id: string
        }
        Insert: {
          certification_name: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          verified?: boolean | null
          worker_id: string
        }
        Update: {
          certification_name?: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          verified?: boolean | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_certifications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      worker_documents: {
        Row: {
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          worker_id: string
        }
        Insert: {
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id: string
        }
        Update: {
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_documents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      worker_profile_employer_info: {
        Row: {
          availability: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          current_city: string | null
          current_location: string | null
          ecr_category: string | null
          ecr_status: string | null
          expected_salary_max: number | null
          expected_salary_min: number | null
          expected_wage_amount: number | null
          expected_wage_type: string | null
          experience_range: string | null
          has_passport: boolean | null
          has_visa: boolean | null
          languages: string[] | null
          nationality: string | null
          onboarding_completed: boolean | null
          open_to_relocation: boolean | null
          preferred_shift: string | null
          primary_work_type: string | null
          project_types_worked: string[] | null
          secondary_skills: string[] | null
          skill_level: string | null
          updated_at: string | null
          user_id: string
          visa_countries: string[] | null
          work_preference: string | null
          years_of_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_city?: string | null
          current_location?: string | null
          ecr_category?: string | null
          ecr_status?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          expected_wage_amount?: number | null
          expected_wage_type?: string | null
          experience_range?: string | null
          has_passport?: boolean | null
          has_visa?: boolean | null
          languages?: string[] | null
          nationality?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          preferred_shift?: string | null
          primary_work_type?: string | null
          project_types_worked?: string[] | null
          secondary_skills?: string[] | null
          skill_level?: string | null
          updated_at?: string | null
          user_id: string
          visa_countries?: string[] | null
          work_preference?: string | null
          years_of_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_city?: string | null
          current_location?: string | null
          ecr_category?: string | null
          ecr_status?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          expected_wage_amount?: number | null
          expected_wage_type?: string | null
          experience_range?: string | null
          has_passport?: boolean | null
          has_visa?: boolean | null
          languages?: string[] | null
          nationality?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          preferred_shift?: string | null
          primary_work_type?: string | null
          project_types_worked?: string[] | null
          secondary_skills?: string[] | null
          skill_level?: string | null
          updated_at?: string | null
          user_id?: string
          visa_countries?: string[] | null
          work_preference?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          current_city: string | null
          current_location: string | null
          ecr_category: string | null
          ecr_status: string | null
          expected_salary_max: number | null
          expected_salary_min: number | null
          expected_wage_amount: number | null
          expected_wage_type: string | null
          experience_range: string | null
          has_passport: boolean | null
          has_visa: boolean | null
          id: string
          languages: string[] | null
          nationality: string | null
          onboarded_at: string | null
          onboarding_completed: boolean | null
          open_to_relocation: boolean | null
          passport_number: string | null
          preferred_shift: string | null
          preferred_work_city: string | null
          primary_skill: string | null
          primary_work_type: string | null
          project_types_worked: string[] | null
          review_notes: string | null
          review_rejection_reason: string | null
          review_status: string
          secondary_skills: string[] | null
          skill_level: string | null
          source_partner_id: string | null
          source_type: string
          tenth_pass_confirmed: boolean
          updated_at: string | null
          user_id: string
          visa_countries: string[] | null
          work_preference: string | null
          years_of_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_city?: string | null
          current_location?: string | null
          ecr_category?: string | null
          ecr_status?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          expected_wage_amount?: number | null
          expected_wage_type?: string | null
          experience_range?: string | null
          has_passport?: boolean | null
          has_visa?: boolean | null
          id?: string
          languages?: string[] | null
          nationality?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          passport_number?: string | null
          preferred_shift?: string | null
          preferred_work_city?: string | null
          primary_skill?: string | null
          primary_work_type?: string | null
          project_types_worked?: string[] | null
          review_notes?: string | null
          review_rejection_reason?: string | null
          review_status?: string
          secondary_skills?: string[] | null
          skill_level?: string | null
          source_partner_id?: string | null
          source_type?: string
          tenth_pass_confirmed?: boolean
          updated_at?: string | null
          user_id: string
          visa_countries?: string[] | null
          work_preference?: string | null
          years_of_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_city?: string | null
          current_location?: string | null
          ecr_category?: string | null
          ecr_status?: string | null
          expected_salary_max?: number | null
          expected_salary_min?: number | null
          expected_wage_amount?: number | null
          expected_wage_type?: string | null
          experience_range?: string | null
          has_passport?: boolean | null
          has_visa?: boolean | null
          id?: string
          languages?: string[] | null
          nationality?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          passport_number?: string | null
          preferred_shift?: string | null
          preferred_work_city?: string | null
          primary_skill?: string | null
          primary_work_type?: string | null
          project_types_worked?: string[] | null
          review_notes?: string | null
          review_rejection_reason?: string | null
          review_status?: string
          secondary_skills?: string[] | null
          skill_level?: string | null
          source_partner_id?: string | null
          source_type?: string
          tenth_pass_confirmed?: boolean
          updated_at?: string | null
          user_id?: string
          visa_countries?: string[] | null
          work_preference?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_source_partner_id_fkey"
            columns: ["source_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_skill_media: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          media_type: string
          skill_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          media_type: string
          skill_id: string
          worker_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          media_type?: string
          skill_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skill_media_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "worker_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skill_media_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency_level: string | null
          skill_name: string
          worker_id: string
          years_of_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_name: string
          worker_id: string
          years_of_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency_level?: string | null
          skill_name?: string
          worker_id?: string
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      worker_training_enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress: number
          started_at: string | null
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          skills_demonstrated: string[] | null
          thumbnail_url: string | null
          title: string
          video_url: string
          views_count: number | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          skills_demonstrated?: string[] | null
          thumbnail_url?: string | null
          title: string
          video_url: string
          views_count?: number | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          skills_demonstrated?: string[] | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
          views_count?: number | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_videos_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_job: { Args: { p_job_id: string }; Returns: undefined }
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_mark_withdrawal_paid: {
        Args: { p_payment_reference?: string; p_withdrawal_id: string }
        Returns: undefined
      }
      admin_set_partner_status: {
        Args: {
          p_partner_id: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["partner_org_status"]
        }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      assign_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      compute_partner_tier: {
        Args: { p_placements: number }
        Returns: Database["public"]["Enums"]["partner_tier"]
      }
      current_partner: {
        Args: never
        Returns: {
          city: string
          company_name: string
          district: string
          id: string
          partner_code: string
          partner_type_code: string
          partner_type_id: string
          partner_type_name: string
          rating: number
          state: string
          status: Database["public"]["Enums"]["partner_org_status"]
          verification_status: Database["public"]["Enums"]["partner_verification_status"]
          wallet_available: number
          wallet_pending: number
        }[]
      }
      ensure_whitelisted_admin: { Args: never; Returns: boolean }
      generate_partner_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_worker_profile_for_employer: {
        Args: { p_worker_id: string }
        Returns: {
          availability: string
          bio: string
          created_at: string
          currency: string
          current_location: string
          ecr_category: string
          ecr_status: string
          expected_salary_max: number
          expected_salary_min: number
          has_passport: boolean
          has_visa: boolean
          id: string
          languages: string[]
          nationality: string
          updated_at: string
          user_id: string
          visa_countries: string[]
          years_of_experience: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_whitelisted_admin_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      list_public_workers: {
        Args: { p_limit?: number }
        Returns: {
          availability: string
          avatar_url: string
          certifications_count: number
          current_location: string
          display_name: string
          ecr_status: string
          has_passport: boolean
          has_visa: boolean
          languages: string[]
          last_active_at: string
          nationality: string
          open_to_relocation: boolean
          preferred_shift: string
          primary_work_type: string
          skill_level: string
          top_skills: string[]
          user_id: string
          verified_documents: string[]
          video_url: string
          years_of_experience: number
        }[]
      }
      partner_list_my_workers: {
        Args: never
        Returns: {
          created_at: string
          current_city: string
          current_location: string
          primary_work_type: string
          review_notes: string
          review_rejection_reason: string
          review_status: string
          source_partner_id: string
          updated_at: string
          user_id: string
        }[]
      }
      seed_demo_users: { Args: { p_users: Json }; Returns: number }
      seed_officials_demo: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "employer" | "worker" | "agent" | "partner"
      assessment_status:
        | "scheduled"
        | "checked_in"
        | "running"
        | "completed"
        | "employer_review"
        | "approved"
        | "rejected"
        | "retest"
      migration_readiness_category:
        | "placement_ready"
        | "needs_preparation"
        | "not_ready"
      partner_incentive_type: "verified" | "interview_qualified" | "placement"
      partner_org_status: "pending" | "approved" | "rejected" | "suspended"
      partner_skill_test_stage: "partner" | "phone" | "physical"
      partner_skill_test_status: "pending" | "passed" | "failed"
      partner_status:
        | "applied"
        | "under_review"
        | "approved"
        | "active"
        | "suspended"
        | "rejected"
      partner_tier: "bronze" | "silver" | "gold" | "platinum"
      partner_txn_type: "credit" | "debit" | "withdrawal" | "fee" | "adjustment"
      partner_verification_status:
        | "unverified"
        | "in_review"
        | "verified"
        | "rejected"
      partner_worker_status:
        | "registered"
        | "verified"
        | "shortlisted"
        | "interview_scheduled"
        | "interviewed"
        | "selected"
        | "placed"
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
      app_role: ["admin", "employer", "worker", "agent", "partner"],
      assessment_status: [
        "scheduled",
        "checked_in",
        "running",
        "completed",
        "employer_review",
        "approved",
        "rejected",
        "retest",
      ],
      migration_readiness_category: [
        "placement_ready",
        "needs_preparation",
        "not_ready",
      ],
      partner_incentive_type: ["verified", "interview_qualified", "placement"],
      partner_org_status: ["pending", "approved", "rejected", "suspended"],
      partner_skill_test_stage: ["partner", "phone", "physical"],
      partner_skill_test_status: ["pending", "passed", "failed"],
      partner_status: [
        "applied",
        "under_review",
        "approved",
        "active",
        "suspended",
        "rejected",
      ],
      partner_tier: ["bronze", "silver", "gold", "platinum"],
      partner_txn_type: ["credit", "debit", "withdrawal", "fee", "adjustment"],
      partner_verification_status: [
        "unverified",
        "in_review",
        "verified",
        "rejected",
      ],
      partner_worker_status: [
        "registered",
        "verified",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "selected",
        "placed",
      ],
    },
  },
} as const
