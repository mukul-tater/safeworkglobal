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
      assessment_media: {
        Row: {
          angle: string | null
          assessment_id: string
          captured_at: string
          captured_by: string | null
          captured_by_name: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          face_visible: boolean | null
          id: string
          label: string | null
          media_type: string
          metadata: Json
          storage_path: string
        }
        Insert: {
          angle?: string | null
          assessment_id: string
          captured_at?: string
          captured_by?: string | null
          captured_by_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          face_visible?: boolean | null
          id?: string
          label?: string | null
          media_type: string
          metadata?: Json
          storage_path: string
        }
        Update: {
          angle?: string | null
          assessment_id?: string
          captured_at?: string
          captured_by?: string | null
          captured_by_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          face_visible?: boolean | null
          id?: string
          label?: string | null
          media_type?: string
          metadata?: Json
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_media_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scores: {
        Row: {
          accuracy: number
          assessment_id: string
          assessor_name: string
          created_at: string
          id: string
          practical_skills: number
          productivity: number
          quality: number
          remarks: string | null
          safety_ppe: number
          submitted_at: string
          time_taken: number
          tool_identification: number
          workplace_behaviour: number
        }
        Insert: {
          accuracy?: number
          assessment_id: string
          assessor_name: string
          created_at?: string
          id?: string
          practical_skills?: number
          productivity?: number
          quality?: number
          remarks?: string | null
          safety_ppe?: number
          submitted_at?: string
          time_taken?: number
          tool_identification?: number
          workplace_behaviour?: number
        }
        Update: {
          accuracy?: number
          assessment_id?: string
          assessor_name?: string
          created_at?: string
          id?: string
          practical_skills?: number
          productivity?: number
          quality?: number
          remarks?: string | null
          safety_ppe?: number
          submitted_at?: string
          time_taken?: number
          tool_identification?: number
          workplace_behaviour?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          aadhaar_verified: boolean
          accepted_at: string | null
          appointment_date: string | null
          arrival_photo_path: string | null
          arrival_photo_taken_at: string | null
          arrival_photo_taken_by: string | null
          arrival_photo_taken_by_name: string | null
          assessor_name: string | null
          attendance_confirmed: boolean
          centre_submitted_at: string | null
          created_at: string
          created_by: string | null
          docs_experience_ok: boolean | null
          docs_notes: string | null
          docs_passport_ok: boolean | null
          docs_pre_reviewed_at: string | null
          docs_pre_reviewed_by: string | null
          employer_id: string | null
          end_time: string | null
          equipment: Json
          face_match_confirmed: boolean
          id: string
          identity_same_person: boolean
          job_id: string | null
          kyc_completed_at: string | null
          kyc_photo_path: string | null
          kyc_video_path: string | null
          location: string | null
          media: Json
          outcome: string | null
          overall_score: number | null
          pan_verified: boolean
          partner_id: string | null
          quality_notes: string | null
          quality_reviewed_at: string | null
          quality_reviewed_by: string | null
          recommendation: string | null
          reject_reason: string | null
          rejected_at: string | null
          remarks: string | null
          reported_at: string | null
          reporting_window: string | null
          scheduled_at: string | null
          scorecard_uploaded_at: string | null
          scores: Json
          start_time: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          test_evidence_completed_at: string | null
          trade_id: string | null
          trade_level: string | null
          trade_test_center_id: string | null
          updated_at: string
          video_kyc_log: Json
          video_kyc_operator_id: string | null
          video_kyc_operator_name: string | null
          worker_id: string
          worker_verification_id: string | null
        }
        Insert: {
          aadhaar_verified?: boolean
          accepted_at?: string | null
          appointment_date?: string | null
          arrival_photo_path?: string | null
          arrival_photo_taken_at?: string | null
          arrival_photo_taken_by?: string | null
          arrival_photo_taken_by_name?: string | null
          assessor_name?: string | null
          attendance_confirmed?: boolean
          centre_submitted_at?: string | null
          created_at?: string
          created_by?: string | null
          docs_experience_ok?: boolean | null
          docs_notes?: string | null
          docs_passport_ok?: boolean | null
          docs_pre_reviewed_at?: string | null
          docs_pre_reviewed_by?: string | null
          employer_id?: string | null
          end_time?: string | null
          equipment?: Json
          face_match_confirmed?: boolean
          id?: string
          identity_same_person?: boolean
          job_id?: string | null
          kyc_completed_at?: string | null
          kyc_photo_path?: string | null
          kyc_video_path?: string | null
          location?: string | null
          media?: Json
          outcome?: string | null
          overall_score?: number | null
          pan_verified?: boolean
          partner_id?: string | null
          quality_notes?: string | null
          quality_reviewed_at?: string | null
          quality_reviewed_by?: string | null
          recommendation?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
          remarks?: string | null
          reported_at?: string | null
          reporting_window?: string | null
          scheduled_at?: string | null
          scorecard_uploaded_at?: string | null
          scores?: Json
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          test_evidence_completed_at?: string | null
          trade_id?: string | null
          trade_level?: string | null
          trade_test_center_id?: string | null
          updated_at?: string
          video_kyc_log?: Json
          video_kyc_operator_id?: string | null
          video_kyc_operator_name?: string | null
          worker_id: string
          worker_verification_id?: string | null
        }
        Update: {
          aadhaar_verified?: boolean
          accepted_at?: string | null
          appointment_date?: string | null
          arrival_photo_path?: string | null
          arrival_photo_taken_at?: string | null
          arrival_photo_taken_by?: string | null
          arrival_photo_taken_by_name?: string | null
          assessor_name?: string | null
          attendance_confirmed?: boolean
          centre_submitted_at?: string | null
          created_at?: string
          created_by?: string | null
          docs_experience_ok?: boolean | null
          docs_notes?: string | null
          docs_passport_ok?: boolean | null
          docs_pre_reviewed_at?: string | null
          docs_pre_reviewed_by?: string | null
          employer_id?: string | null
          end_time?: string | null
          equipment?: Json
          face_match_confirmed?: boolean
          id?: string
          identity_same_person?: boolean
          job_id?: string | null
          kyc_completed_at?: string | null
          kyc_photo_path?: string | null
          kyc_video_path?: string | null
          location?: string | null
          media?: Json
          outcome?: string | null
          overall_score?: number | null
          pan_verified?: boolean
          partner_id?: string | null
          quality_notes?: string | null
          quality_reviewed_at?: string | null
          quality_reviewed_by?: string | null
          recommendation?: string | null
          reject_reason?: string | null
          rejected_at?: string | null
          remarks?: string | null
          reported_at?: string | null
          reporting_window?: string | null
          scheduled_at?: string | null
          scorecard_uploaded_at?: string | null
          scores?: Json
          start_time?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          test_evidence_completed_at?: string | null
          trade_id?: string | null
          trade_level?: string | null
          trade_test_center_id?: string | null
          updated_at?: string
          video_kyc_log?: Json
          video_kyc_operator_id?: string | null
          video_kyc_operator_name?: string | null
          worker_id?: string
          worker_verification_id?: string | null
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
          {
            foreignKeyName: "assessments_trade_test_center_id_fkey"
            columns: ["trade_test_center_id"]
            isOneToOne: false
            referencedRelation: "trade_test_centers"
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
      bond_templates: {
        Row: {
          active: boolean
          courier_address: string
          created_at: string
          created_by: string | null
          file_url: string
          guarantor_cheque_amount: number | null
          id: string
          instructions: string | null
          title: string
          updated_at: string
          version: string
          worker_cheque_amount: number | null
        }
        Insert: {
          active?: boolean
          courier_address?: string
          created_at?: string
          created_by?: string | null
          file_url: string
          guarantor_cheque_amount?: number | null
          id?: string
          instructions?: string | null
          title?: string
          updated_at?: string
          version: string
          worker_cheque_amount?: number | null
        }
        Update: {
          active?: boolean
          courier_address?: string
          created_at?: string
          created_by?: string | null
          file_url?: string
          guarantor_cheque_amount?: number | null
          id?: string
          instructions?: string | null
          title?: string
          updated_at?: string
          version?: string
          worker_cheque_amount?: number | null
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
      employer_field_visibility: {
        Row: {
          created_at: string
          field_key: string
          id: string
          org_id: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          field_key: string
          id?: string
          org_id: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          field_key?: string
          id?: string
          org_id?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "employer_field_visibility_field_key_fkey"
            columns: ["field_key"]
            isOneToOne: false
            referencedRelation: "employer_visible_field_catalog"
            referencedColumns: ["field_key"]
          },
          {
            foreignKeyName: "employer_field_visibility_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "employer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_manpower_requirements: {
        Row: {
          additional_requirements: string | null
          created_at: string
          employer_user_id: string
          experience: string | null
          gender: string
          id: string
          joining_date: string | null
          location: string
          number_of_workers: number
          project_duration: string | null
          project_name: string | null
          sort_order: number
          technical_skills: string[]
          trade: string
          updated_at: string
        }
        Insert: {
          additional_requirements?: string | null
          created_at?: string
          employer_user_id: string
          experience?: string | null
          gender?: string
          id?: string
          joining_date?: string | null
          location?: string
          number_of_workers: number
          project_duration?: string | null
          project_name?: string | null
          sort_order?: number
          technical_skills?: string[]
          trade: string
          updated_at?: string
        }
        Update: {
          additional_requirements?: string | null
          created_at?: string
          employer_user_id?: string
          experience?: string | null
          gender?: string
          id?: string
          joining_date?: string | null
          location?: string
          number_of_workers?: number
          project_duration?: string | null
          project_name?: string | null
          sort_order?: number
          technical_skills?: string[]
          trade?: string
          updated_at?: string
        }
        Relationships: []
      }
      employer_org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          permissions: Json
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          permissions?: Json
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          permissions?: Json
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "employer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      employer_profiles: {
        Row: {
          additional_contact_number: string | null
          billing_address: string | null
          bio: string | null
          business_email: string | null
          business_type: string | null
          cin_number: string | null
          commercial_notes: string | null
          company_logo_url: string | null
          company_name: string | null
          company_profile_path: string | null
          company_registration: string | null
          company_size: string | null
          company_type: string | null
          contact_designation: string | null
          contact_full_name: string | null
          country: string | null
          created_at: string | null
          declaration_accurate: boolean
          declaration_authorized: boolean
          declaration_contact_ok: boolean
          declaration_regulations: boolean
          emirate: string | null
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
          linkedin_url: string | null
          office_address: string | null
          office_state: string | null
          onboarding_completed: boolean | null
          partnership_model: string | null
          payment_method_preference: string | null
          preferred_communication: string | null
          preferred_countries: string[] | null
          provides_ppe: string | null
          requirement_reference_id: string | null
          requirement_submitted_at: string | null
          salary_amount: number | null
          salary_type: string | null
          site_safety_level: string | null
          tax_info_number: string | null
          trade_licence_path: string | null
          trade_name: string | null
          uae_mobile: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          whatsapp_number: string | null
          work_locations: string[] | null
          worker_type_needed: string | null
          workers_required: number | null
        }
        Insert: {
          additional_contact_number?: string | null
          billing_address?: string | null
          bio?: string | null
          business_email?: string | null
          business_type?: string | null
          cin_number?: string | null
          commercial_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_profile_path?: string | null
          company_registration?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_designation?: string | null
          contact_full_name?: string | null
          country?: string | null
          created_at?: string | null
          declaration_accurate?: boolean
          declaration_authorized?: boolean
          declaration_contact_ok?: boolean
          declaration_regulations?: boolean
          emirate?: string | null
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
          linkedin_url?: string | null
          office_address?: string | null
          office_state?: string | null
          onboarding_completed?: boolean | null
          partnership_model?: string | null
          payment_method_preference?: string | null
          preferred_communication?: string | null
          preferred_countries?: string[] | null
          provides_ppe?: string | null
          requirement_reference_id?: string | null
          requirement_submitted_at?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          site_safety_level?: string | null
          tax_info_number?: string | null
          trade_licence_path?: string | null
          trade_name?: string | null
          uae_mobile?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          whatsapp_number?: string | null
          work_locations?: string[] | null
          worker_type_needed?: string | null
          workers_required?: number | null
        }
        Update: {
          additional_contact_number?: string | null
          billing_address?: string | null
          bio?: string | null
          business_email?: string | null
          business_type?: string | null
          cin_number?: string | null
          commercial_notes?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_profile_path?: string | null
          company_registration?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_designation?: string | null
          contact_full_name?: string | null
          country?: string | null
          created_at?: string | null
          declaration_accurate?: boolean
          declaration_authorized?: boolean
          declaration_contact_ok?: boolean
          declaration_regulations?: boolean
          emirate?: string | null
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
          linkedin_url?: string | null
          office_address?: string | null
          office_state?: string | null
          onboarding_completed?: boolean | null
          partnership_model?: string | null
          payment_method_preference?: string | null
          preferred_communication?: string | null
          preferred_countries?: string[] | null
          provides_ppe?: string | null
          requirement_reference_id?: string | null
          requirement_submitted_at?: string | null
          salary_amount?: number | null
          salary_type?: string | null
          site_safety_level?: string | null
          tax_info_number?: string | null
          trade_licence_path?: string | null
          trade_name?: string | null
          uae_mobile?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          whatsapp_number?: string | null
          work_locations?: string[] | null
          worker_type_needed?: string | null
          workers_required?: number | null
        }
        Relationships: []
      }
      employer_visible_field_catalog: {
        Row: {
          default_visible: boolean
          field_group: string
          field_key: string
          label: string
          sensitive: boolean
          sort_order: number
        }
        Insert: {
          default_visible?: boolean
          field_group: string
          field_key: string
          label: string
          sensitive?: boolean
          sort_order?: number
        }
        Update: {
          default_visible?: boolean
          field_group?: string
          field_key?: string
          label?: string
          sensitive?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      employer_worker_access_rules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          rule_type: string
          rule_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          rule_type: string
          rule_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          rule_type?: string
          rule_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_worker_access_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "employer_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_worker_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          note: string | null
          org_id: string
          revoked: boolean
          updated_at: string
          worker_user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          org_id: string
          revoked?: boolean
          updated_at?: string
          worker_user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          org_id?: string
          revoked?: boolean
          updated_at?: string
          worker_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_worker_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "employer_organizations"
            referencedColumns: ["id"]
          },
        ]
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
      lsp_launch_logs: {
        Row: {
          created_at: string
          id: string
          lsp_code: string | null
          lsp_id: string | null
          reason: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          lsp_code?: string | null
          lsp_id?: string | null
          reason?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          lsp_code?: string | null
          lsp_id?: string | null
          reason?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lsp_launch_logs_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lsp_launch_logs_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lsp_launch_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lsp_id: string
          payload: Json
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          lsp_id: string
          payload?: Json
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lsp_id?: string
          payload?: Json
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lsp_launch_tokens_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lsp_launch_tokens_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lsp_partners: {
        Row: {
          allowed_origins: string[] | null
          code: string
          contact_email: string | null
          contact_mobile: string | null
          contact_name: string | null
          created_at: string
          id: string
          metadata: Json
          name: string
          state: string
          status: string
          token_secret: string
          updated_at: string
        }
        Insert: {
          allowed_origins?: string[] | null
          code: string
          contact_email?: string | null
          contact_mobile?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          state?: string
          status?: string
          token_secret: string
          updated_at?: string
        }
        Update: {
          allowed_origins?: string[] | null
          code?: string
          contact_email?: string | null
          contact_mobile?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          state?: string
          status?: string
          token_secret?: string
          updated_at?: string
        }
        Relationships: []
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
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
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
      partner_invoices: {
        Row: {
          created_at: string
          currency: string
          due_at: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          line_items: Json
          notes: string | null
          paid_at: string | null
          partner_id: string
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["partner_invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["partner_invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["partner_invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoices_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
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
      partner_payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_details: Json
          created_at: string
          currency: string
          id: string
          method: string
          partner_id: string
          processed_at: string | null
          processed_by: string | null
          reference: string | null
          rejection_reason: string | null
          requested_at: string
          status: Database["public"]["Enums"]["partner_payout_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_details?: Json
          created_at?: string
          currency?: string
          id?: string
          method?: string
          partner_id: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["partner_payout_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_details?: Json
          created_at?: string
          currency?: string
          id?: string
          method?: string
          partner_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["partner_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_requests_partner_id_fkey"
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
          aadhaar_url: string | null
          accepted_privacy: boolean | null
          accepted_terms: boolean | null
          account_holder: string | null
          account_number: string | null
          address: string | null
          address_line1: string | null
          address_line2: string | null
          address_proof_url: string | null
          agency_name: string | null
          agree_accurate_info: boolean | null
          agree_confidentiality: boolean | null
          agree_mea_guidelines: boolean | null
          agree_no_misrepresentation: boolean | null
          agree_not_sub_agent: boolean | null
          agree_platform_only: boolean | null
          agreement_accepted_at: string | null
          agreement_accepted_via_otp: boolean | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          bank_name: string | null
          bio: string | null
          cancelled_cheque_url: string | null
          center_name: string | null
          city_town: string | null
          commission_rate: number | null
          compliance_acknowledged_at: string | null
          confirmed_accuracy: boolean | null
          created_at: string | null
          csc_id: string | null
          current_step: number
          date_of_birth: string | null
          district: string | null
          email: string | null
          emitra_certificate_url: string | null
          emitra_id: string | null
          gst_number: string | null
          google_maps_url: string | null
          has_computer: boolean | null
          has_internet: boolean | null
          has_printer: boolean | null
          has_scanner: boolean | null
          has_webcam: boolean | null
          id: string
          ifsc: string | null
          info_request_message: string | null
          inside_shop_photo_url: string | null
          leaderboard_rank: number | null
          license_number: string | null
          lsp_verified_at: string | null
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
          panchayat: string | null
          partner_code: string | null
          pincode: string | null
          regions_covered: string[] | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          services_offered: string[] | null
          shop_name: string | null
          shop_photo_url: string | null
          source_lsp_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["partner_status"]
          submitted_at: string | null
          tier: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned: number | null
          total_placements: number | null
          training_declaration: boolean | null
          updated_at: string | null
          upi_id: string | null
          user_id: string
          village: string | null
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
          aadhaar_url?: string | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_proof_url?: string | null
          agency_name?: string | null
          agree_accurate_info?: boolean | null
          agree_confidentiality?: boolean | null
          agree_mea_guidelines?: boolean | null
          agree_no_misrepresentation?: boolean | null
          agree_not_sub_agent?: boolean | null
          agree_platform_only?: boolean | null
          agreement_accepted_at?: string | null
          agreement_accepted_via_otp?: boolean | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          bio?: string | null
          cancelled_cheque_url?: string | null
          center_name?: string | null
          city_town?: string | null
          commission_rate?: number | null
          compliance_acknowledged_at?: string | null
          confirmed_accuracy?: boolean | null
          created_at?: string | null
          csc_id?: string | null
          current_step?: number
          date_of_birth?: string | null
          district?: string | null
          email?: string | null
          emitra_certificate_url?: string | null
          emitra_id?: string | null
          gst_number?: string | null
          google_maps_url?: string | null
          has_computer?: boolean | null
          has_internet?: boolean | null
          has_printer?: boolean | null
          has_scanner?: boolean | null
          has_webcam?: boolean | null
          id?: string
          ifsc?: string | null
          info_request_message?: string | null
          inside_shop_photo_url?: string | null
          leaderboard_rank?: number | null
          license_number?: string | null
          lsp_verified_at?: string | null
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
          panchayat?: string | null
          partner_code?: string | null
          pincode?: string | null
          regions_covered?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          shop_name?: string | null
          shop_photo_url?: string | null
          source_lsp_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned?: number | null
          total_placements?: number | null
          training_declaration?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          user_id: string
          village?: string | null
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
          aadhaar_url?: string | null
          accepted_privacy?: boolean | null
          accepted_terms?: boolean | null
          account_holder?: string | null
          account_number?: string | null
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          address_proof_url?: string | null
          agency_name?: string | null
          agree_accurate_info?: boolean | null
          agree_confidentiality?: boolean | null
          agree_mea_guidelines?: boolean | null
          agree_no_misrepresentation?: boolean | null
          agree_not_sub_agent?: boolean | null
          agree_platform_only?: boolean | null
          agreement_accepted_at?: string | null
          agreement_accepted_via_otp?: boolean | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          bio?: string | null
          cancelled_cheque_url?: string | null
          center_name?: string | null
          city_town?: string | null
          commission_rate?: number | null
          compliance_acknowledged_at?: string | null
          confirmed_accuracy?: boolean | null
          created_at?: string | null
          csc_id?: string | null
          current_step?: number
          date_of_birth?: string | null
          district?: string | null
          email?: string | null
          emitra_certificate_url?: string | null
          emitra_id?: string | null
          gst_number?: string | null
          google_maps_url?: string | null
          has_computer?: boolean | null
          has_internet?: boolean | null
          has_printer?: boolean | null
          has_scanner?: boolean | null
          has_webcam?: boolean | null
          id?: string
          ifsc?: string | null
          info_request_message?: string | null
          inside_shop_photo_url?: string | null
          leaderboard_rank?: number | null
          license_number?: string | null
          lsp_verified_at?: string | null
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
          panchayat?: string | null
          partner_code?: string | null
          pincode?: string | null
          regions_covered?: string[] | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          services_offered?: string[] | null
          shop_name?: string | null
          shop_photo_url?: string | null
          source_lsp_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["partner_tier"] | null
          total_incentives_earned?: number | null
          total_placements?: number | null
          training_declaration?: boolean | null
          updated_at?: string | null
          upi_id?: string | null
          user_id?: string
          village?: string | null
          village_city?: string | null
          whatsapp?: string | null
          worker_categories?: string[] | null
          workers_placed?: number | null
          workers_registered?: number | null
          years_in_operation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_source_lsp_id_fkey"
            columns: ["source_lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_profiles_source_lsp_id_fkey"
            columns: ["source_lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners_public"
            referencedColumns: ["id"]
          },
        ]
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
      partner_support_messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
          ticket_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "partner_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_support_tickets: {
        Row: {
          assigned_admin: string | null
          category: string | null
          created_at: string
          id: string
          last_reply_at: string | null
          partner_id: string
          priority: Database["public"]["Enums"]["support_ticket_priority"]
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_admin?: string | null
          category?: string | null
          created_at?: string
          id?: string
          last_reply_at?: string | null
          partner_id: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_admin?: string | null
          category?: string | null
          created_at?: string
          id?: string
          last_reply_at?: string | null
          partner_id?: string
          priority?: Database["public"]["Enums"]["support_ticket_priority"]
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_support_tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
          source_lsp_id: string | null
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
          source_lsp_id?: string | null
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
          source_lsp_id?: string | null
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
          {
            foreignKeyName: "partner_workers_source_lsp_id_fkey"
            columns: ["source_lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workers_source_lsp_id_fkey"
            columns: ["source_lsp_id"]
            isOneToOne: false
            referencedRelation: "lsp_partners_public"
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
      sen_global_commissions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          earned_at: string | null
          employer_id: string | null
          id: string
          job_id: string | null
          lead_id: string | null
          metadata: Json
          paid_at: string | null
          partner_id: string
          reference: string | null
          status: Database["public"]["Enums"]["sen_commission_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          earned_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          lead_id?: string | null
          metadata?: Json
          paid_at?: string | null
          partner_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["sen_commission_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          earned_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          lead_id?: string | null
          metadata?: Json
          paid_at?: string | null
          partner_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["sen_commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sen_global_commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sen_global_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sen_global_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      sen_global_leads: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_employer_id: string | null
          country: string | null
          created_at: string
          estimated_hires: number | null
          id: string
          industry: string | null
          metadata: Json
          notes: string | null
          partner_id: string
          status: Database["public"]["Enums"]["sen_lead_status"]
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_employer_id?: string | null
          country?: string | null
          created_at?: string
          estimated_hires?: number | null
          id?: string
          industry?: string | null
          metadata?: Json
          notes?: string | null
          partner_id: string
          status?: Database["public"]["Enums"]["sen_lead_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_employer_id?: string | null
          country?: string | null
          created_at?: string
          estimated_hires?: number | null
          id?: string
          industry?: string | null
          metadata?: Json
          notes?: string | null
          partner_id?: string
          status?: Database["public"]["Enums"]["sen_lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sen_global_leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
      skill_quiz_configs: {
        Row: {
          active: boolean
          created_at: string
          id: string
          pass_score: number
          questions_to_show: number
          region: string | null
          selected_ids: string[]
          selection_mode: string
          skill_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          pass_score?: number
          questions_to_show?: number
          region?: string | null
          selected_ids?: string[]
          selection_mode?: string
          skill_code: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          pass_score?: number
          questions_to_show?: number
          region?: string | null
          selected_ids?: string[]
          selection_mode?: string
          skill_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      srn_stage_documents: {
        Row: {
          doc_type: string
          file_url: string
          id: string
          notes: string | null
          partner_id: string
          stage_id: string
          status: string
          uploaded_at: string
        }
        Insert: {
          doc_type: string
          file_url: string
          id?: string
          notes?: string | null
          partner_id: string
          stage_id: string
          status?: string
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          partner_id?: string
          stage_id?: string
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "srn_stage_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "srn_stage_documents_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "srn_worker_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      srn_worker_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          job_id: string | null
          metadata: Json
          notes: string | null
          partner_id: string
          scheduled_at: string | null
          stage: Database["public"]["Enums"]["srn_stage_code"]
          status: Database["public"]["Enums"]["srn_stage_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json
          notes?: string | null
          partner_id: string
          scheduled_at?: string | null
          stage: Database["public"]["Enums"]["srn_stage_code"]
          status?: Database["public"]["Enums"]["srn_stage_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json
          notes?: string | null
          partner_id?: string
          scheduled_at?: string | null
          stage?: Database["public"]["Enums"]["srn_stage_code"]
          status?: Database["public"]["Enums"]["srn_stage_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srn_worker_stages_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      state_stamp_paper_values: {
        Row: {
          active: boolean
          aliases: string[]
          created_at: string
          currency: string
          id: string
          minimum_stamp_value: number
          name_hi: string | null
          state_id: string
          state_name: string
          state_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          created_at?: string
          currency?: string
          id?: string
          minimum_stamp_value: number
          name_hi?: string | null
          state_id: string
          state_name: string
          state_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          aliases?: string[]
          created_at?: string
          currency?: string
          id?: string
          minimum_stamp_value?: number
          name_hi?: string | null
          state_id?: string
          state_name?: string
          state_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_test_centers: {
        Row: {
          address: string | null
          city: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          maps_url: string | null
          name: string
          partner_id: string | null
          pincode: string | null
          reporting_window: string
          state: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id: string
          instructions?: string | null
          is_active?: boolean
          maps_url?: string | null
          name: string
          partner_id?: string | null
          pincode?: string | null
          reporting_window?: string
          state: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          maps_url?: string | null
          name?: string
          partner_id?: string | null
          pincode?: string | null
          reporting_window?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_test_centers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
      worker_assessment_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          provider: string | null
          provider_ref: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      worker_bond_security: {
        Row: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        Insert: {
          applicable_stamp_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          authenticity_declared_at?: string | null
          bond_doc_status?: string
          bond_file_name?: string | null
          bond_file_path?: string | null
          bond_uploaded_at?: string | null
          confirmed_state?: string | null
          courier_company?: string | null
          courier_date?: string | null
          courier_receipt_name?: string | null
          courier_receipt_path?: string | null
          courier_status?: string
          created_at?: string
          guarantor_address?: string | null
          guarantor_bank_name?: string | null
          guarantor_cheque_amount?: number | null
          guarantor_cheque_date?: string | null
          guarantor_cheque_holder_name?: string | null
          guarantor_cheque_name?: string | null
          guarantor_cheque_number?: string | null
          guarantor_cheque_path?: string | null
          guarantor_declaration_accepted_at?: string | null
          guarantor_full_name?: string | null
          guarantor_mobile?: string | null
          guarantor_otp_verified?: boolean
          guarantor_otp_verified_at?: string | null
          guarantor_relationship?: string | null
          id?: string
          no_guarantee_declared_at?: string | null
          rejection_reason?: string | null
          stamp_currency?: string
          state_confirmed?: boolean
          state_confirmed_at?: string | null
          state_id?: string | null
          status?: string
          submitted_at?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
          version?: number
          worker_cheque_amount?: number | null
          worker_cheque_bank_name?: string | null
          worker_cheque_date?: string | null
          worker_cheque_holder_name?: string | null
          worker_cheque_name?: string | null
          worker_cheque_number?: string | null
          worker_cheque_path?: string | null
        }
        Update: {
          applicable_stamp_value?: number | null
          approved_at?: string | null
          approved_by?: string | null
          authenticity_declared_at?: string | null
          bond_doc_status?: string
          bond_file_name?: string | null
          bond_file_path?: string | null
          bond_uploaded_at?: string | null
          confirmed_state?: string | null
          courier_company?: string | null
          courier_date?: string | null
          courier_receipt_name?: string | null
          courier_receipt_path?: string | null
          courier_status?: string
          created_at?: string
          guarantor_address?: string | null
          guarantor_bank_name?: string | null
          guarantor_cheque_amount?: number | null
          guarantor_cheque_date?: string | null
          guarantor_cheque_holder_name?: string | null
          guarantor_cheque_name?: string | null
          guarantor_cheque_number?: string | null
          guarantor_cheque_path?: string | null
          guarantor_declaration_accepted_at?: string | null
          guarantor_full_name?: string | null
          guarantor_mobile?: string | null
          guarantor_otp_verified?: boolean
          guarantor_otp_verified_at?: string | null
          guarantor_relationship?: string | null
          id?: string
          no_guarantee_declared_at?: string | null
          rejection_reason?: string | null
          stamp_currency?: string
          state_confirmed?: boolean
          state_confirmed_at?: string | null
          state_id?: string | null
          status?: string
          submitted_at?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
          version?: number
          worker_cheque_amount?: number | null
          worker_cheque_bank_name?: string | null
          worker_cheque_date?: string | null
          worker_cheque_holder_name?: string | null
          worker_cheque_name?: string | null
          worker_cheque_number?: string | null
          worker_cheque_path?: string | null
        }
        Relationships: []
      }
      worker_bond_security_files: {
        Row: {
          deleted_at: string | null
          file_name: string
          file_size: number | null
          id: string
          kind: string
          replaced_at: string | null
          storage_path: string
          submission_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          kind: string
          replaced_at?: string | null
          storage_path: string
          submission_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          kind?: string
          replaced_at?: string | null
          storage_path?: string
          submission_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_bond_security_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "worker_bond_security"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_bonds: {
        Row: {
          created_at: string
          id: string
          method: string
          notes: string | null
          stamp_doc_url: string | null
          status: string
          updated_at: string
          user_id: string
          video_proof_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          notes?: string | null
          stamp_doc_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_proof_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          stamp_doc_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_proof_url?: string | null
        }
        Relationships: []
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
      worker_pre_journey_declarations: {
        Row: {
          acknowledgements: Json
          completed_at: string
          created_at: string
          id: string
          medical: Json
          overseas: Json
          recruitment: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledgements?: Json
          completed_at?: string
          created_at?: string
          id?: string
          medical?: Json
          overseas?: Json
          recruitment?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledgements?: Json
          completed_at?: string
          created_at?: string
          id?: string
          medical?: Json
          overseas?: Json
          recruitment?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          aadhaar_last4: string | null
          aadhaar_number: string | null
          added_by_org_id: string | null
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
          kyc_consent_at: string | null
          kyc_status: string
          kyc_submitted_at: string | null
          languages: string[] | null
          nationality: string | null
          onboarded_at: string | null
          onboarding_completed: boolean | null
          open_to_relocation: boolean | null
          pan_number: string | null
          passport_expiry: string | null
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
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          added_by_org_id?: string | null
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
          kyc_consent_at?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          languages?: string[] | null
          nationality?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          pan_number?: string | null
          passport_expiry?: string | null
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
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          added_by_org_id?: string | null
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
          kyc_consent_at?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          languages?: string[] | null
          nationality?: string | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          open_to_relocation?: boolean | null
          pan_number?: string | null
          passport_expiry?: string | null
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
            foreignKeyName: "worker_profiles_added_by_org_id_fkey"
            columns: ["added_by_org_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
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
      worker_skill_quiz_items: {
        Row: {
          active: boolean
          created_at: string
          expected_answer: boolean
          id: string
          image_url: string | null
          options: Json | null
          question: string
          question_hi: string | null
          region: string | null
          skill_code: string
          sort_order: number
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          expected_answer?: boolean
          id?: string
          image_url?: string | null
          options?: Json | null
          question: string
          question_hi?: string | null
          region?: string | null
          skill_code: string
          sort_order?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          expected_answer?: boolean
          id?: string
          image_url?: string | null
          options?: Json | null
          question?: string
          question_hi?: string | null
          region?: string | null
          skill_code?: string
          sort_order?: number
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      worker_skill_quiz_responses: {
        Row: {
          answer: boolean
          created_at: string
          id: string
          is_correct: boolean
          quiz_item_id: string
          user_id: string
        }
        Insert: {
          answer: boolean
          created_at?: string
          id?: string
          is_correct: boolean
          quiz_item_id: string
          user_id: string
        }
        Update: {
          answer?: boolean
          created_at?: string
          id?: string
          is_correct?: boolean
          quiz_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_skill_quiz_responses_quiz_item_id_fkey"
            columns: ["quiz_item_id"]
            isOneToOne: false
            referencedRelation: "worker_skill_quiz_items"
            referencedColumns: ["id"]
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
      worker_verification: {
        Row: {
          assessment_id: string | null
          bond_courier_tracking: string | null
          bond_couriered_at: string | null
          bond_received_at: string | null
          bond_rejection_reason: string | null
          bond_status: string | null
          bond_template_id: string | null
          city: string | null
          created_at: string
          deploy_contract_status: string
          deploy_emigration_status: string
          deploy_insurance_status: string
          deploy_offer_status: string
          deploy_ticket_status: string
          deploy_visa_status: string
          deployed_at: string | null
          deployment_notes: string | null
          education_level: string | null
          email: string | null
          essentials_completed_at: string | null
          gcc_ready_at: string | null
          id: string
          interview_attempts: number
          interview_meeting_url: string | null
          interview_notes: string | null
          interview_rated_at: string | null
          interview_scheduled_at: string | null
          interview_score: number | null
          interview_status: string
          interviewer_name: string | null
          interviewer_user_id: string | null
          journey_job_id: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          media_submitted_at: string | null
          medical_instructions: string | null
          medical_place: string | null
          medical_result_url: string | null
          medical_scheduled_at: string | null
          medical_status: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_status: string | null
          pdot_batch: string | null
          pdot_completed_at: string | null
          pdot_proof_url: string | null
          pdot_provider: string | null
          pdot_scheduled_at: string | null
          pdot_status: string
          pdot_training_url: string | null
          primary_skill: string | null
          quiz_completed_at: string | null
          quiz_score: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          state: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          trade_test_booked_at: string | null
          trade_test_center_id: string | null
          trade_test_center_name: string | null
          trade_test_instructions: string | null
          trade_test_place: string | null
          trade_test_reporting_window: string | null
          trade_test_required: boolean | null
          trade_test_result_url: string | null
          trade_test_scheduled_at: string | null
          trade_test_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id?: string | null
          bond_courier_tracking?: string | null
          bond_couriered_at?: string | null
          bond_received_at?: string | null
          bond_rejection_reason?: string | null
          bond_status?: string | null
          bond_template_id?: string | null
          city?: string | null
          created_at?: string
          deploy_contract_status?: string
          deploy_emigration_status?: string
          deploy_insurance_status?: string
          deploy_offer_status?: string
          deploy_ticket_status?: string
          deploy_visa_status?: string
          deployed_at?: string | null
          deployment_notes?: string | null
          education_level?: string | null
          email?: string | null
          essentials_completed_at?: string | null
          gcc_ready_at?: string | null
          id?: string
          interview_attempts?: number
          interview_meeting_url?: string | null
          interview_notes?: string | null
          interview_rated_at?: string | null
          interview_scheduled_at?: string | null
          interview_score?: number | null
          interview_status?: string
          interviewer_name?: string | null
          interviewer_user_id?: string | null
          journey_job_id?: string | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          media_submitted_at?: string | null
          medical_instructions?: string | null
          medical_place?: string | null
          medical_result_url?: string | null
          medical_scheduled_at?: string | null
          medical_status?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          pdot_batch?: string | null
          pdot_completed_at?: string | null
          pdot_proof_url?: string | null
          pdot_provider?: string | null
          pdot_scheduled_at?: string | null
          pdot_status?: string
          pdot_training_url?: string | null
          primary_skill?: string | null
          quiz_completed_at?: string | null
          quiz_score?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          stage?: string
          state?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          trade_test_booked_at?: string | null
          trade_test_center_id?: string | null
          trade_test_center_name?: string | null
          trade_test_instructions?: string | null
          trade_test_place?: string | null
          trade_test_reporting_window?: string | null
          trade_test_required?: boolean | null
          trade_test_result_url?: string | null
          trade_test_scheduled_at?: string | null
          trade_test_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string | null
          bond_courier_tracking?: string | null
          bond_couriered_at?: string | null
          bond_received_at?: string | null
          bond_rejection_reason?: string | null
          bond_status?: string | null
          bond_template_id?: string | null
          city?: string | null
          created_at?: string
          deploy_contract_status?: string
          deploy_emigration_status?: string
          deploy_insurance_status?: string
          deploy_offer_status?: string
          deploy_ticket_status?: string
          deploy_visa_status?: string
          deployed_at?: string | null
          deployment_notes?: string | null
          education_level?: string | null
          email?: string | null
          essentials_completed_at?: string | null
          gcc_ready_at?: string | null
          id?: string
          interview_attempts?: number
          interview_meeting_url?: string | null
          interview_notes?: string | null
          interview_rated_at?: string | null
          interview_scheduled_at?: string | null
          interview_score?: number | null
          interview_status?: string
          interviewer_name?: string | null
          interviewer_user_id?: string | null
          journey_job_id?: string | null
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          media_submitted_at?: string | null
          medical_instructions?: string | null
          medical_place?: string | null
          medical_result_url?: string | null
          medical_scheduled_at?: string | null
          medical_status?: string | null
          paid_at?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          pdot_batch?: string | null
          pdot_completed_at?: string | null
          pdot_proof_url?: string | null
          pdot_provider?: string | null
          pdot_scheduled_at?: string | null
          pdot_status?: string
          pdot_training_url?: string | null
          primary_skill?: string | null
          quiz_completed_at?: string | null
          quiz_score?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          stage?: string
          state?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          trade_test_booked_at?: string | null
          trade_test_center_id?: string | null
          trade_test_center_name?: string | null
          trade_test_instructions?: string | null
          trade_test_place?: string | null
          trade_test_reporting_window?: string | null
          trade_test_required?: boolean | null
          trade_test_result_url?: string | null
          trade_test_scheduled_at?: string | null
          trade_test_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_verification_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_verification_bond_template_id_fkey"
            columns: ["bond_template_id"]
            isOneToOne: false
            referencedRelation: "bond_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_verification_journey_job_id_fkey"
            columns: ["journey_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_verification_interviews: {
        Row: {
          attempt_no: number
          created_at: string
          decided_at: string | null
          decision: string | null
          decision_reason: string | null
          id: string
          interviewer_user_id: string | null
          meeting_link: string | null
          meeting_url: string | null
          notes: string | null
          rated_by: string | null
          scheduled_at: string | null
          score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_no?: number
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          interviewer_user_id?: string | null
          meeting_link?: string | null
          meeting_url?: string | null
          notes?: string | null
          rated_by?: string | null
          scheduled_at?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_no?: number
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          interviewer_user_id?: string | null
          meeting_link?: string | null
          meeting_url?: string | null
          notes?: string | null
          rated_by?: string | null
          scheduled_at?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      lsp_partners_public: {
        Row: {
          code: string | null
          created_at: string | null
          id: string | null
          name: string | null
          state: string | null
          status: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          state?: string | null
          status?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string | null
          name?: string | null
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_workers: {
        Args: { p_note?: string; p_org: string; p_worker_ids: string[] }
        Returns: number
      }
      admin_create_lsp: {
        Args: {
          p_code: string
          p_contact_email?: string
          p_contact_mobile?: string
          p_contact_name?: string
          p_name: string
          p_state?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_delete_job: { Args: { p_job_id: string }; Returns: undefined }
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_employer_org_workers: {
        Args: { p_org: string }
        Returns: {
          full_name: string
          mobile: string
          source: string
          state: string
          trade: string
          worker_user_id: string
        }[]
      }
      admin_list_employer_orgs: {
        Args: never
        Returns: {
          assigned_workers: number
          name: string
          org_id: string
          owner_email: string
          owner_user_id: string
          rules: number
        }[]
      }
      admin_mark_bond_received: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      admin_mark_pdot_completed: {
        Args: { p_proof_url?: string; p_user_id: string }
        Returns: undefined
      }
      admin_mark_withdrawal_paid: {
        Args: { p_payment_reference?: string; p_withdrawal_id: string }
        Returns: undefined
      }
      admin_process_payout: {
        Args: {
          p_notes?: string
          p_payout_id: string
          p_reference?: string
          p_rejection_reason?: string
          p_status: Database["public"]["Enums"]["partner_payout_status"]
        }
        Returns: undefined
      }
      admin_review_bond_security: {
        Args: { p_action: string; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      admin_revoke_worker_assignment: {
        Args: { p_org: string; p_worker_user_id: string }
        Returns: undefined
      }
      admin_rotate_lsp_secret: { Args: { p_lsp_id: string }; Returns: Json }
      admin_schedule_worker_assessment: {
        Args: {
          p_instructions?: string
          p_kind: string
          p_place?: string
          p_scheduled_at: string
          p_user_id: string
        }
        Returns: undefined
      }
      admin_schedule_worker_interview: {
        Args: {
          p_interviewer_user_id: string
          p_meeting_url: string
          p_scheduled_at: string
          p_user_id: string
        }
        Returns: string
      }
      admin_set_field_visibility: {
        Args: { p_field_key: string; p_org: string; p_visible: boolean }
        Returns: undefined
      }
      admin_set_lsp_status: {
        Args: { p_lsp_id: string; p_status: string }
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
      admin_set_pdot_plan: {
        Args: {
          p_batch?: string
          p_provider?: string
          p_scheduled_at?: string
          p_training_url?: string
          p_user_id: string
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
      admin_update_deployment_checklist: {
        Args: {
          p_contract?: string
          p_deployed?: boolean
          p_emigration?: string
          p_insurance?: string
          p_notes?: string
          p_offer?: string
          p_ticket?: string
          p_user_id: string
          p_visa?: string
        }
        Returns: undefined
      }
      admin_verify_worker_kyc: {
        Args: { p_approved: boolean; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      apply_to_job_for_journey: {
        Args: { p_job_id: string; p_user_id?: string }
        Returns: string
      }
      assign_employer_requirement_ref: {
        Args: { p_user_id: string }
        Returns: string
      }
      assign_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      bind_partner_to_lsp: {
        Args: { p_emitra_id?: string; p_lsp_id: string }
        Returns: Json
      }
      complete_assessment_payment_razorpay: {
        Args: {
          p_amount?: number
          p_order_id: string
          p_payment_id: string
          p_user_id: string
        }
        Returns: {
          assessment_id: string | null
          bond_courier_tracking: string | null
          bond_couriered_at: string | null
          bond_received_at: string | null
          bond_rejection_reason: string | null
          bond_status: string | null
          bond_template_id: string | null
          city: string | null
          created_at: string
          deploy_contract_status: string
          deploy_emigration_status: string
          deploy_insurance_status: string
          deploy_offer_status: string
          deploy_ticket_status: string
          deploy_visa_status: string
          deployed_at: string | null
          deployment_notes: string | null
          education_level: string | null
          email: string | null
          essentials_completed_at: string | null
          gcc_ready_at: string | null
          id: string
          interview_attempts: number
          interview_meeting_url: string | null
          interview_notes: string | null
          interview_rated_at: string | null
          interview_scheduled_at: string | null
          interview_score: number | null
          interview_status: string
          interviewer_name: string | null
          interviewer_user_id: string | null
          journey_job_id: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          media_submitted_at: string | null
          medical_instructions: string | null
          medical_place: string | null
          medical_result_url: string | null
          medical_scheduled_at: string | null
          medical_status: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_status: string | null
          pdot_batch: string | null
          pdot_completed_at: string | null
          pdot_proof_url: string | null
          pdot_provider: string | null
          pdot_scheduled_at: string | null
          pdot_status: string
          pdot_training_url: string | null
          primary_skill: string | null
          quiz_completed_at: string | null
          quiz_score: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          state: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          trade_test_booked_at: string | null
          trade_test_center_id: string | null
          trade_test_center_name: string | null
          trade_test_instructions: string | null
          trade_test_place: string | null
          trade_test_reporting_window: string | null
          trade_test_required: boolean | null
          trade_test_result_url: string | null
          trade_test_scheduled_at: string | null
          trade_test_status: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "worker_verification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_assessment_payment_test: {
        Args: never
        Returns: {
          assessment_id: string | null
          bond_courier_tracking: string | null
          bond_couriered_at: string | null
          bond_received_at: string | null
          bond_rejection_reason: string | null
          bond_status: string | null
          bond_template_id: string | null
          city: string | null
          created_at: string
          deploy_contract_status: string
          deploy_emigration_status: string
          deploy_insurance_status: string
          deploy_offer_status: string
          deploy_ticket_status: string
          deploy_visa_status: string
          deployed_at: string | null
          deployment_notes: string | null
          education_level: string | null
          email: string | null
          essentials_completed_at: string | null
          gcc_ready_at: string | null
          id: string
          interview_attempts: number
          interview_meeting_url: string | null
          interview_notes: string | null
          interview_rated_at: string | null
          interview_scheduled_at: string | null
          interview_score: number | null
          interview_status: string
          interviewer_name: string | null
          interviewer_user_id: string | null
          journey_job_id: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          media_submitted_at: string | null
          medical_instructions: string | null
          medical_place: string | null
          medical_result_url: string | null
          medical_scheduled_at: string | null
          medical_status: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_status: string | null
          pdot_batch: string | null
          pdot_completed_at: string | null
          pdot_proof_url: string | null
          pdot_provider: string | null
          pdot_scheduled_at: string | null
          pdot_status: string
          pdot_training_url: string | null
          primary_skill: string | null
          quiz_completed_at: string | null
          quiz_score: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          state: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          trade_test_booked_at: string | null
          trade_test_center_id: string | null
          trade_test_center_name: string | null
          trade_test_instructions: string | null
          trade_test_place: string | null
          trade_test_reporting_window: string | null
          trade_test_required: boolean | null
          trade_test_result_url: string | null
          trade_test_scheduled_at: string | null
          trade_test_status: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "worker_verification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_partner_tier: {
        Args: { p_placements: number }
        Returns: Database["public"]["Enums"]["partner_tier"]
      }
      confirm_emitra_placement_reward: {
        Args: { p_reward_id: string }
        Returns: undefined
      }
      consume_lsp_launch_token: { Args: { p_token: string }; Returns: Json }
      current_employer_org: { Args: never; Returns: string }
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
      employer_field_map: {
        Args: { p_org: string }
        Returns: {
          field_key: string
          visible: boolean
        }[]
      }
      employer_get_worker: {
        Args: { p_worker_user_id: string }
        Returns: {
          aadhaar_last4: string
          availability: string
          avatar_url: string
          bio: string
          currency: string
          current_city: string
          current_location: string
          ecr_status: string
          email: string
          expected_salary_max: number
          expected_salary_min: number
          full_name: string
          has_passport: boolean
          kyc_status: string
          languages: string[]
          medical_status: string
          mobile: string
          nationality: string
          open_to_relocation: boolean
          pan_number: string
          passport_expiry: string
          passport_number: string
          skill_level: string
          skills: string[]
          trade: string
          worker_user_id: string
          years_of_experience: number
        }[]
      }
      employer_list_workers: {
        Args: {
          p_availability?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_trade?: string
        }
        Returns: {
          aadhaar_last4: string
          availability: string
          avatar_url: string
          currency: string
          current_city: string
          current_location: string
          ecr_status: string
          email: string
          expected_salary_max: number
          expected_salary_min: number
          full_name: string
          has_passport: boolean
          kyc_status: string
          languages: string[]
          medical_status: string
          mobile: string
          nationality: string
          open_to_relocation: boolean
          pan_number: string
          passport_expiry: string
          passport_number: string
          skill_level: string
          skills: string[]
          total_count: number
          trade: string
          worker_user_id: string
          years_of_experience: number
        }[]
      }
      employer_visible_fields: {
        Args: never
        Returns: {
          field_group: string
          field_key: string
          label: string
          visible: boolean
        }[]
      }
      employer_visible_worker_ids: {
        Args: { p_org: string }
        Returns: {
          worker_user_id: string
        }[]
      }
      ensure_worker_bond_security: {
        Args: { p_user_id: string }
        Returns: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        SetofOptions: {
          from: "*"
          to: "worker_bond_security"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_employer_requirement_ref: { Args: never; Returns: string }
      generate_partner_code: { Args: never; Returns: string }
      get_employer_company_names: {
        Args: { p_employer_ids: string[] }
        Returns: {
          company_name: string
          user_id: string
        }[]
      }
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
      get_worker_quiz_items: {
        Args: { p_skill: string }
        Returns: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          options: Json
          question: string
          question_hi: string
          region: string
          skill_code: string
          sort_order: number
          youtube_url: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      interviewer_list_assignments: {
        Args: never
        Returns: {
          attempt_no: number
          decision: string
          full_name: string
          interview_id: string
          meeting_url: string
          primary_skill: string
          quiz_score: number
          scheduled_at: string
          state: string
          status: string
          worker_user_id: string
        }[]
      }
      interviewer_record_decision: {
        Args: {
          p_approved: boolean
          p_interview_id: string
          p_reason?: string
          p_score?: number
        }
        Returns: undefined
      }
      issue_lsp_launch_params: {
        Args: {
          p_emitra_id?: string
          p_lsp_id: string
          p_mobile?: string
          p_ttl_seconds?: number
        }
        Returns: Json
      }
      issue_lsp_one_time_token: {
        Args: {
          p_emitra_id?: string
          p_lsp_id: string
          p_mobile?: string
          p_ttl_seconds?: number
        }
        Returns: Json
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
      lookup_stamp_paper: {
        Args: { p_state: string }
        Returns: {
          currency: string
          minimum_stamp_value: number
          name_hi: string
          state_id: string
          state_name: string
          state_type: string
        }[]
      }
      lsp_hmac_hex: {
        Args: { p_message: string; p_secret: string }
        Returns: string
      }
      lsp_log_launch: {
        Args: {
          p_lsp_code: string
          p_lsp_id: string
          p_reason: string
          p_success: boolean
        }
        Returns: undefined
      }
      partner_attach_registered_worker: {
        Args: {
          p_email?: string
          p_full_name: string
          p_mobile: string
          p_worker_user_id: string
        }
        Returns: undefined
      }
      partner_list_my_workers: {
        Args: never
        Returns: {
          added_by_org_id: string
          created_at: string
          current_city: string
          current_location: string
          email: string
          full_name: string
          phone: string
          primary_work_type: string
          review_notes: string
          review_rejection_reason: string
          review_status: string
          source_partner_id: string
          updated_at: string
          user_id: string
        }[]
      }
      partner_manages_worker: {
        Args: { _worker_user_id: string }
        Returns: boolean
      }
      partner_profile_self_update_allowed: {
        Args: { _new: Database["public"]["Tables"]["partner_profiles"]["Row"] }
        Returns: boolean
      }
      partners_self_update_allowed: {
        Args: { _new: Database["public"]["Tables"]["partners"]["Row"] }
        Returns: boolean
      }
      resolve_active_lsp_id: { Args: { p_code: string }; Returns: string }
      seed_demo_users: { Args: { p_users: Json }; Returns: number }
      seed_officials_demo: { Args: never; Returns: Json }
      submit_worker_quiz: {
        Args: { p_answers: Json; p_user_id?: string }
        Returns: {
          correct_count: number
          score: number
          total_count: number
        }[]
      }
      toggle_saved_job: {
        Args: { p_job_id: string; p_user_id?: string }
        Returns: boolean
      }
      verify_lsp_launch: {
        Args: {
          p_emitra_id?: string
          p_exp: number
          p_lsp: string
          p_mobile?: string
          p_nonce: string
          p_sig: string
        }
        Returns: Json
      }
      waive_assessment_interview_pilot: {
        Args: never
        Returns: {
          assessment_id: string | null
          bond_courier_tracking: string | null
          bond_couriered_at: string | null
          bond_received_at: string | null
          bond_rejection_reason: string | null
          bond_status: string | null
          bond_template_id: string | null
          city: string | null
          created_at: string
          deploy_contract_status: string
          deploy_emigration_status: string
          deploy_insurance_status: string
          deploy_offer_status: string
          deploy_ticket_status: string
          deploy_visa_status: string
          deployed_at: string | null
          deployment_notes: string | null
          education_level: string | null
          email: string | null
          essentials_completed_at: string | null
          gcc_ready_at: string | null
          id: string
          interview_attempts: number
          interview_meeting_url: string | null
          interview_notes: string | null
          interview_rated_at: string | null
          interview_scheduled_at: string | null
          interview_score: number | null
          interview_status: string
          interviewer_name: string | null
          interviewer_user_id: string | null
          journey_job_id: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          media_submitted_at: string | null
          medical_instructions: string | null
          medical_place: string | null
          medical_result_url: string | null
          medical_scheduled_at: string | null
          medical_status: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_status: string | null
          pdot_batch: string | null
          pdot_completed_at: string | null
          pdot_proof_url: string | null
          pdot_provider: string | null
          pdot_scheduled_at: string | null
          pdot_status: string
          pdot_training_url: string | null
          primary_skill: string | null
          quiz_completed_at: string | null
          quiz_score: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          state: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          trade_test_booked_at: string | null
          trade_test_center_id: string | null
          trade_test_center_name: string | null
          trade_test_instructions: string | null
          trade_test_place: string | null
          trade_test_reporting_window: string | null
          trade_test_required: boolean | null
          trade_test_result_url: string | null
          trade_test_scheduled_at: string | null
          trade_test_status: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "worker_verification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      waive_assessment_payment_pilot: {
        Args: never
        Returns: {
          assessment_id: string | null
          bond_courier_tracking: string | null
          bond_couriered_at: string | null
          bond_received_at: string | null
          bond_rejection_reason: string | null
          bond_status: string | null
          bond_template_id: string | null
          city: string | null
          created_at: string
          deploy_contract_status: string
          deploy_emigration_status: string
          deploy_insurance_status: string
          deploy_offer_status: string
          deploy_ticket_status: string
          deploy_visa_status: string
          deployed_at: string | null
          deployment_notes: string | null
          education_level: string | null
          email: string | null
          essentials_completed_at: string | null
          gcc_ready_at: string | null
          id: string
          interview_attempts: number
          interview_meeting_url: string | null
          interview_notes: string | null
          interview_rated_at: string | null
          interview_scheduled_at: string | null
          interview_score: number | null
          interview_status: string
          interviewer_name: string | null
          interviewer_user_id: string | null
          journey_job_id: string | null
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_verified_at: string | null
          media_submitted_at: string | null
          medical_instructions: string | null
          medical_place: string | null
          medical_result_url: string | null
          medical_scheduled_at: string | null
          medical_status: string | null
          paid_at: string | null
          payment_amount: number | null
          payment_status: string | null
          pdot_batch: string | null
          pdot_completed_at: string | null
          pdot_proof_url: string | null
          pdot_provider: string | null
          pdot_scheduled_at: string | null
          pdot_status: string
          pdot_training_url: string | null
          primary_skill: string | null
          quiz_completed_at: string | null
          quiz_score: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          stage: string
          state: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          trade_test_booked_at: string | null
          trade_test_center_id: string | null
          trade_test_center_name: string | null
          trade_test_instructions: string | null
          trade_test_place: string | null
          trade_test_reporting_window: string | null
          trade_test_required: boolean | null
          trade_test_result_url: string | null
          trade_test_scheduled_at: string | null
          trade_test_status: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "worker_verification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      worker_attach_bond_security_file: {
        Args: {
          p_file_name: string
          p_file_size?: number
          p_kind: string
          p_path: string
        }
        Returns: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        SetofOptions: {
          from: "*"
          to: "worker_bond_security"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      worker_can_apply_to_jobs: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      worker_confirm_guarantor_otp: {
        Args: { p_mobile: string }
        Returns: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        SetofOptions: {
          from: "*"
          to: "worker_bond_security"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      worker_on_bond_stage: { Args: { p_user_id: string }; Returns: boolean }
      worker_submit_bond_security: {
        Args: never
        Returns: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        SetofOptions: {
          from: "*"
          to: "worker_bond_security"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      worker_submit_bond_tracking: {
        Args: { p_tracking: string }
        Returns: undefined
      }
      worker_upsert_bond_security: {
        Args: { p_payload: Json }
        Returns: {
          applicable_stamp_value: number | null
          approved_at: string | null
          approved_by: string | null
          authenticity_declared_at: string | null
          bond_doc_status: string
          bond_file_name: string | null
          bond_file_path: string | null
          bond_uploaded_at: string | null
          confirmed_state: string | null
          courier_company: string | null
          courier_date: string | null
          courier_receipt_name: string | null
          courier_receipt_path: string | null
          courier_status: string
          created_at: string
          guarantor_address: string | null
          guarantor_bank_name: string | null
          guarantor_cheque_amount: number | null
          guarantor_cheque_date: string | null
          guarantor_cheque_holder_name: string | null
          guarantor_cheque_name: string | null
          guarantor_cheque_number: string | null
          guarantor_cheque_path: string | null
          guarantor_declaration_accepted_at: string | null
          guarantor_full_name: string | null
          guarantor_mobile: string | null
          guarantor_otp_verified: boolean
          guarantor_otp_verified_at: string | null
          guarantor_relationship: string | null
          id: string
          no_guarantee_declared_at: string | null
          rejection_reason: string | null
          stamp_currency: string
          state_confirmed: boolean
          state_confirmed_at: string | null
          state_id: string | null
          status: string
          submitted_at: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
          version: number
          worker_cheque_amount: number | null
          worker_cheque_bank_name: string | null
          worker_cheque_date: string | null
          worker_cheque_holder_name: string | null
          worker_cheque_name: string | null
          worker_cheque_number: string | null
          worker_cheque_path: string | null
        }
        SetofOptions: {
          from: "*"
          to: "worker_bond_security"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "employer"
        | "worker"
        | "agent"
        | "partner"
        | "interviewer"
      assessment_status:
        | "scheduled"
        | "checked_in"
        | "running"
        | "completed"
        | "employer_review"
        | "approved"
        | "rejected"
        | "retest"
        | "allocated"
        | "accepted"
        | "centre_rejected"
        | "kyc_done"
        | "centre_submitted"
        | "under_review"
      migration_readiness_category:
        | "placement_ready"
        | "needs_preparation"
        | "not_ready"
      partner_incentive_type: "verified" | "interview_qualified" | "placement"
      partner_invoice_status:
        | "draft"
        | "issued"
        | "paid"
        | "overdue"
        | "cancelled"
      partner_org_status: "pending" | "approved" | "rejected" | "suspended"
      partner_payout_status:
        | "requested"
        | "approved"
        | "processing"
        | "paid"
        | "rejected"
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
      sen_commission_status:
        | "pending"
        | "earned"
        | "invoiced"
        | "paid"
        | "cancelled"
      sen_lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      srn_stage_code:
        | "medical"
        | "visa"
        | "offer_letter"
        | "poe"
        | "travel"
        | "deployment"
      srn_stage_status:
        | "pending"
        | "in_progress"
        | "submitted"
        | "approved"
        | "rejected"
        | "completed"
      support_ticket_priority: "low" | "normal" | "high" | "urgent"
      support_ticket_status:
        | "open"
        | "in_progress"
        | "waiting"
        | "resolved"
        | "closed"
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
      app_role: [
        "admin",
        "employer",
        "worker",
        "agent",
        "partner",
        "interviewer",
      ],
      assessment_status: [
        "scheduled",
        "checked_in",
        "running",
        "completed",
        "employer_review",
        "approved",
        "rejected",
        "retest",
        "allocated",
        "accepted",
        "centre_rejected",
        "kyc_done",
        "centre_submitted",
        "under_review",
      ],
      migration_readiness_category: [
        "placement_ready",
        "needs_preparation",
        "not_ready",
      ],
      partner_incentive_type: ["verified", "interview_qualified", "placement"],
      partner_invoice_status: [
        "draft",
        "issued",
        "paid",
        "overdue",
        "cancelled",
      ],
      partner_org_status: ["pending", "approved", "rejected", "suspended"],
      partner_payout_status: [
        "requested",
        "approved",
        "processing",
        "paid",
        "rejected",
      ],
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
      sen_commission_status: [
        "pending",
        "earned",
        "invoiced",
        "paid",
        "cancelled",
      ],
      sen_lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      srn_stage_code: [
        "medical",
        "visa",
        "offer_letter",
        "poe",
        "travel",
        "deployment",
      ],
      srn_stage_status: [
        "pending",
        "in_progress",
        "submitted",
        "approved",
        "rejected",
        "completed",
      ],
      support_ticket_priority: ["low", "normal", "high", "urgent"],
      support_ticket_status: [
        "open",
        "in_progress",
        "waiting",
        "resolved",
        "closed",
      ],
    },
  },
} as const
