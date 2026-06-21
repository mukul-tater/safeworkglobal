import { supabase } from '@/integrations/supabase/client';
import {
  buildAllJobSeeds,
  buildCategoryJobSeeds,
  getSeedableCategories,
  MIN_JOBS_PER_CATEGORY,
} from '@/data/jobSeedCatalog';
import { normalizeSalaryForJob } from '@/lib/jobSalaryUtils';

export interface DemoAccount {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'employer' | 'worker';
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@safeworkglobal.demo',
    password: 'Admin@2024!',
    full_name: 'System Administrator',
    phone: '+1234567890',
    role: 'admin'
  },
  {
    email: 'employer@safeworkglobal.demo',
    password: 'Employer@2024!',
    full_name: 'James Wilson',
    phone: '+1234567891',
    role: 'employer'
  },
  {
    email: 'worker@safeworkglobal.demo',
    password: 'Worker@2024!',
    full_name: 'Maria Garcia',
    phone: '+1234567892',
    role: 'worker'
  },
  {
    email: 'worker2@safeworkglobal.demo',
    password: 'Worker@2024!',
    full_name: 'Ahmed Hassan',
    phone: '+1234567893',
    role: 'worker'
  },
  {
    email: 'worker3@safeworkglobal.demo',
    password: 'Worker@2024!',
    full_name: 'Li Wei',
    phone: '+1234567894',
    role: 'worker'
  },
  {
    email: 'employer2@safeworkglobal.demo',
    password: 'Employer@2024!',
    full_name: 'Sarah Johnson',
    phone: '+1234567895',
    role: 'employer'
  }
];

interface SeedResult {
  success: boolean;
  message: string;
  errors?: string[];
}

class SeedService {
  private async checkIfSeeded(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', 'admin@safeworkglobal.demo')
        .maybeSingle();
      
      return !!data && !error;
    } catch {
      return false;
    }
  }

  async seedDemoAccounts(): Promise<SeedResult> {
    const errors: string[] = [];
    
    // Check if already seeded
    const alreadySeeded = await this.checkIfSeeded();
    if (alreadySeeded) {
      return {
        success: false,
        message: 'Demo accounts already exist. Please clear data first.',
      };
    }

    console.log('Starting demo account creation...');

    for (const account of DEMO_ACCOUNTS) {
      try {
        const { error } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: account.full_name,
              phone: account.phone,
              role: account.role,
            }
          }
        });

        if (error) {
          errors.push(`${account.email}: ${error.message}`);
        } else {
          console.log(`✓ Created account: ${account.email}`);
        }
      } catch (error) {
        errors.push(`${account.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Some accounts failed to create`,
        errors
      };
    }

    return {
      success: true,
      message: 'All demo accounts created successfully!'
    };
  }

  async seedJobsData(
    employerId: string,
    minJobsPerCategory: number = MIN_JOBS_PER_CATEGORY
  ): Promise<SeedResult> {
    try {
      const { data: existingProfile } = await supabase
        .from('employer_profiles')
        .select('user_id')
        .eq('user_id', employerId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('employer_profiles')
          .insert({
            user_id: employerId,
            company_name: 'Gulf Workforce Partners',
            industry: 'Construction & Infrastructure',
            company_size: '100-500',
          });

        if (profileError) {
          return {
            success: false,
            message: 'Failed to create employer profile for job creation',
            errors: [profileError.message],
          };
        }
      }

      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('title')
        .eq('status', 'ACTIVE');

      const categoryCounts = new Map<string, number>();
      for (const cat of getSeedableCategories()) {
        categoryCounts.set(
          cat,
          (existingJobs ?? []).filter((j) => j.title?.endsWith(` - ${cat}`)).length
        );
      }

      const categories = getSeedableCategories();
      const jobsToInsert: ReturnType<typeof buildAllJobSeeds>['jobs'] = [];
      const skillsPerJob: string[][] = [];

      categories.forEach((category, index) => {
        const existing = categoryCounts.get(category) ?? 0;
        if (existing >= minJobsPerCategory) return;

        const needed = minJobsPerCategory - existing;
        const { jobs, skills } = buildCategoryJobSeeds(category, employerId, index, needed, existing);
        jobs.forEach((job, jobIdx) => {
          jobsToInsert.push(job);
          skillsPerJob.push(
            skills.filter((s) => s.jobIndex === jobIdx).map((s) => s.skill_name)
          );
        });
      });

      if (jobsToInsert.length === 0) {
        return {
          success: true,
          message: `All ${categories.length} categories already have at least ${minJobsPerCategory} jobs`,
        };
      }

      const batchSize = 25;
      const insertedJobs: Array<{ id: string; title: string }> = [];

      for (let i = 0; i < jobsToInsert.length; i += batchSize) {
        const batch = jobsToInsert.slice(i, i + batchSize).map(({ category: _c, ...row }) => row);
        const { data, error: jobsError } = await supabase.from('jobs').insert(batch).select('id, title');

        if (jobsError) {
          return {
            success: false,
            message: 'Failed to create demo jobs',
            errors: [jobsError.message],
          };
        }

        if (data) {
          insertedJobs.push(...data);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (insertedJobs.length > 0) {
        const jobSkills = insertedJobs.flatMap((job, idx) =>
          (skillsPerJob[idx] ?? []).map((skill_name) => ({ job_id: job.id, skill_name }))
        );

        for (let i = 0; i < jobSkills.length; i += 100) {
          const batch = jobSkills.slice(i, i + 100);
          const { error: skillsError } = await supabase.from('job_skills').insert(batch);
          if (skillsError) console.error('Error inserting job skills batch:', skillsError);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      return {
        success: true,
        message: `Created ${insertedJobs.length} jobs (${minJobsPerCategory}+ per category across ${categories.length} categories)`,
      };
    } catch (error) {
      console.error('Error seeding jobs:', error);
      return {
        success: false,
        message: 'Failed to seed jobs',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async seedWorkerData(workerId: string): Promise<SeedResult> {
    try {
      // Check if worker profile exists first
      const { data: existingProfile } = await supabase
        .from('worker_profiles')
        .select('user_id')
        .eq('user_id', workerId)
        .maybeSingle();

      if (!existingProfile) {
        // Create worker profile only if it doesn't exist
        const { error: profileError } = await supabase
          .from('worker_profiles')
          .insert({
            user_id: workerId,
            bio: 'Experienced blue-collar worker with expertise in various industrial and construction roles.',
            years_of_experience: 8,
            current_location: 'Mumbai, India',
            nationality: 'Indian',
            expected_salary_min: 2500,
            expected_salary_max: 4000,
            currency: 'USD',
            availability: 'IMMEDIATE',
            has_passport: true,
            passport_number: 'A12345678',
            has_visa: false,
            languages: ['English', 'Hindi', 'Arabic'],
            ecr_status: 'ECNR',
            ecr_category: 'ECNR'
          });

        if (profileError) {
          return {
            success: false,
            message: 'Failed to create worker profile',
            errors: [profileError.message]
          };
        }
      } else {
        console.log('Worker profile already exists, skipping creation...');
      }

      // Add skills (only if not already added)
      const { data: existingSkills } = await supabase
        .from('worker_skills')
        .select('id')
        .eq('worker_id', workerId)
        .limit(1);

      if (!existingSkills || existingSkills.length === 0) {
        const skills = [
          { skill_name: 'Welding', proficiency_level: 'EXPERT', years_of_experience: 6 },
          { skill_name: 'Electrical Work', proficiency_level: 'INTERMEDIATE', years_of_experience: 3 },
          { skill_name: 'Construction', proficiency_level: 'ADVANCED', years_of_experience: 5 }
        ];

        const { error: skillsError } = await supabase
          .from('worker_skills')
          .insert(skills.map(s => ({ ...s, worker_id: workerId })));

        if (skillsError) {
          console.error('Error creating skills:', skillsError);
        }
      }

      // Add certifications (only if not already added)
      const { data: existingCerts } = await supabase
        .from('worker_certifications')
        .select('id')
        .eq('worker_id', workerId)
        .limit(1);

      if (!existingCerts || existingCerts.length === 0) {
        const certifications = [
          {
            certification_name: 'AWS D1.1 Welding Certification',
            issuing_organization: 'American Welding Society',
            issue_date: '2020-06-15',
            verified: true
          },
          {
            certification_name: 'OSHA Safety Training',
            issuing_organization: 'OSHA',
            issue_date: '2021-03-20',
            verified: true
          }
        ];

        const { error: certError } = await supabase
          .from('worker_certifications')
          .insert(certifications.map(c => ({ ...c, worker_id: workerId })));

        if (certError) {
          console.error('Error creating certifications:', certError);
        }
      }

      // Add work experience (only if not already added)
      const { data: existingExp } = await supabase
        .from('work_experience')
        .select('id')
        .eq('worker_id', workerId)
        .limit(1);

      if (!existingExp || existingExp.length === 0) {
        const experiences = [
          {
            company_name: 'Dubai Construction LLC',
            job_title: 'Senior Welder',
            location: 'Dubai, UAE',
            start_date: '2019-01-15',
            end_date: '2022-12-31',
            is_current: false,
            description: 'Performed structural welding on high-rise construction projects.'
          },
          {
            company_name: 'Saudi Steel Industries',
            job_title: 'Fabrication Welder',
            location: 'Riyadh, Saudi Arabia',
            start_date: '2023-02-01',
            is_current: true,
            description: 'Currently working on industrial fabrication projects.'
          }
        ];

        const { error: expError } = await supabase
          .from('work_experience')
          .insert(experiences.map(e => ({ ...e, worker_id: workerId })));

        if (expError) {
          console.error('Error creating work experience:', expError);
        }
      }

      return {
        success: true,
        message: 'Worker profile created successfully with skills, certifications, and experience'
      };
    } catch (error) {
      console.error('Error seeding worker data:', error);
      return {
        success: false,
        message: 'Failed to seed worker data',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async seedJobApplications(): Promise<SeedResult> {
    try {
      // Get all worker IDs
      const workerEmails = ['worker@safeworkglobal.demo', 'worker2@safeworkglobal.demo', 'worker3@safeworkglobal.demo'];
      const workerIds: string[] = [];

      for (const email of workerEmails) {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (data) workerIds.push(data.id);
      }

      if (workerIds.length === 0) {
        return { success: false, message: 'No worker accounts found for applications' };
      }

      // Get active jobs with their employer IDs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, employer_id, title')
        .eq('status', 'ACTIVE')
        .limit(30);

      if (jobsError || !jobs || jobs.length === 0) {
        return { success: false, message: 'No active jobs found for applications' };
      }

      // Check if applications already exist
      const { data: existingApps } = await supabase
        .from('job_applications')
        .select('id')
        .in('worker_id', workerIds)
        .limit(1);

      if (existingApps && existingApps.length > 0) {
        return { success: true, message: 'Job applications already exist' };
      }

      const statuses = ['PENDING', 'REVIEWING', 'SHORTLISTED', 'APPROVED', 'REJECTED'];
      const applications = [];

      // Create applications for each worker
      for (let w = 0; w < workerIds.length; w++) {
        const workerId = workerIds[w];
        // Each worker applies to different jobs (5-8 applications each)
        const numApps = 5 + Math.floor(Math.random() * 4);
        const startIndex = w * 10;

        for (let i = 0; i < numApps && (startIndex + i) < jobs.length; i++) {
          const job = jobs[startIndex + i];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const appliedDaysAgo = Math.floor(Math.random() * 30) + 1;

          applications.push({
            job_id: job.id,
            worker_id: workerId,
            employer_id: job.employer_id,
            status,
            cover_letter: `I am excited to apply for the ${job.title} position. With my extensive experience and skills, I believe I would be a valuable addition to your team. I am passionate about this field and eager to contribute to your organization's success.`,
            applied_at: new Date(Date.now() - appliedDaysAgo * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      // Insert applications
      const { data: insertedApps, error: insertError } = await supabase
        .from('job_applications')
        .insert(applications)
        .select();

      if (insertError) {
        return { success: false, message: 'Failed to create applications', errors: [insertError.message] };
      }

      // Create status history for each application
      if (insertedApps && insertedApps.length > 0) {
        const statusHistory = insertedApps.map(app => ({
          application_id: app.id,
          status: app.status,
          changed_by: app.employer_id,
          notes: app.status === 'PENDING' ? 'Application submitted' : `Status updated to ${app.status}`
        }));

        await supabase.from('application_status_history').insert(statusHistory);
      }

      return {
        success: true,
        message: `Created ${applications.length} job applications for ${workerIds.length} workers`
      };
    } catch (error) {
      console.error('Error seeding job applications:', error);
      return {
        success: false,
        message: 'Failed to seed job applications',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async getEmployerUserIds(): Promise<string[]> {
    try {
      // Try to get employer IDs from profiles table using known demo emails
      const employerEmails = ['employer@safeworkglobal.demo', 'employer2@safeworkglobal.demo'];
      const employerIds: string[] = [];

      for (const email of employerEmails) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (data && !error) {
          employerIds.push(data.id);
        }
      }

      // If no demo accounts found, try to get from employer_profiles table
      if (employerIds.length === 0) {
        const { data: epData, error: epError } = await supabase
          .from('employer_profiles')
          .select('user_id')
          .limit(5);

        if (epData && !epError) {
          employerIds.push(...epData.map(ep => ep.user_id));
        }
      }

      // If still none, try user_roles (might work if user is admin)
      if (employerIds.length === 0) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'employer');

        if (roleData && !roleError) {
          employerIds.push(...roleData.map(r => r.user_id));
        }
      }

      console.log(`Found ${employerIds.length} employer accounts`);
      return employerIds;
    } catch (error) {
      console.error('Error getting employer user IDs:', error);
      return [];
    }
  }

  async getWorkerUserId(): Promise<string | null> {
    try {
      // Try known demo worker email first
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'worker@globalgigs.demo')
        .maybeSingle();

      if (data && !error) {
        return data.id;
      }

      // Try to find any worker from worker_profiles
      const { data: wpData, error: wpError } = await supabase
        .from('worker_profiles')
        .select('user_id')
        .limit(1)
        .maybeSingle();

      if (wpData && !wpError) {
        return wpData.user_id;
      }

      console.error('Error getting worker user ID:', error);
      return null;
    } catch (error) {
      console.error('Error getting worker user ID:', error);
      return null;
    }
  }

  async seedNotifications(): Promise<SeedResult> {
    try {
      // Get all demo user IDs
      const workerEmails = ['worker@safeworkglobal.demo', 'worker2@safeworkglobal.demo', 'worker3@safeworkglobal.demo'];
      const employerEmails = ['employer@safeworkglobal.demo', 'employer2@safeworkglobal.demo'];
      const adminEmails = ['admin@safeworkglobal.demo'];

      const notifications: Array<{
        user_id: string;
        type: string;
        title: string;
        message: string;
        is_read: boolean;
        data: Record<string, string | number | boolean | null>;
        created_at: string;
      }> = [];

      // Helper to get user ID by email
      const getUserIdByEmail = async (email: string): Promise<string | null> => {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        return data?.id || null;
      };

      // Worker notification templates
      const workerNotificationTemplates = [
        { type: 'application_update', title: 'Application Status Updated', message: 'Your application for Senior Welder position has been reviewed. Check the status now!' },
        { type: 'interview_scheduled', title: 'Interview Scheduled', message: 'Congratulations! An interview has been scheduled for your application to TIG Welder - Welding in Dubai.' },
        { type: 'offer_received', title: 'New Job Offer!', message: 'You have received a job offer for the Industrial Electrician position. Review the offer details.' },
        { type: 'document_verified', title: 'Document Verified', message: 'Your passport document has been verified successfully.' },
        { type: 'job_alert', title: 'New Job Match Found', message: '5 new jobs matching your skills have been posted in Oman. Check them out!' },
        { type: 'message', title: 'New Message', message: 'You have a new message from Demo Company regarding your application.' },
        { type: 'profile_reminder', title: 'Complete Your Profile', message: 'Add your certifications to improve your profile visibility by 30%.' },
        { type: 'visa_update', title: 'Visa Processing Update', message: 'Your visa application for UAE has been submitted for processing.' },
      ];

      // Employer notification templates
      const employerNotificationTemplates = [
        { type: 'new_application', title: 'New Application Received', message: 'A new candidate has applied for your Senior Welder position. Review their profile now.' },
        { type: 'interview_reminder', title: 'Interview Tomorrow', message: 'Reminder: You have an interview scheduled tomorrow with Maria Garcia for the Electrician role.' },
        { type: 'application_update', title: 'Candidate Accepted Offer', message: 'Great news! Ahmed Hassan has accepted your job offer for the Pipeline Welder position.' },
        { type: 'job_expiring', title: 'Job Posting Expiring Soon', message: 'Your job posting for Construction Manager will expire in 3 days. Renew now to keep receiving applications.' },
        { type: 'verification_complete', title: 'Background Verification Complete', message: 'Background verification for Li Wei has been completed successfully.' },
        { type: 'shortlist_update', title: 'Shortlist Updated', message: 'You have 3 new candidates matching your criteria for the Welding positions.' },
        { type: 'payment_reminder', title: 'Payment Pending', message: 'Your escrow payment of $2,500 for the upcoming contract is pending confirmation.' },
        { type: 'message', title: 'New Message from Candidate', message: 'Maria Garcia has sent you a message regarding the interview schedule.' },
      ];

      // Admin notification templates
      const adminNotificationTemplates = [
        { type: 'document_review', title: 'Document Pending Review', message: '15 worker documents are pending verification. Review them to maintain compliance.' },
        { type: 'dispute_filed', title: 'New Dispute Filed', message: 'A new payment dispute has been filed and requires your attention.' },
        { type: 'compliance_alert', title: 'Compliance Alert', message: 'Monthly compliance report is ready for review. 2 employers require re-verification.' },
        { type: 'user_report', title: 'User Reported', message: 'A user has been reported for suspicious activity. Investigation required.' },
        { type: 'system_alert', title: 'System Health Check', message: 'Weekly system health check completed. All services are running smoothly.' },
        { type: 'job_verification', title: 'Jobs Pending Verification', message: '8 new job postings are pending verification before going live.' },
        { type: 'kyc_pending', title: 'KYC Verification Pending', message: '5 employers have pending KYC verification. Complete review within 48 hours.' },
        { type: 'flagged_content', title: 'Content Flagged', message: 'A message has been flagged for review due to potential policy violation.' },
      ];

      // Generate notifications for workers
      for (const email of workerEmails) {
        const userId = await getUserIdByEmail(email);
        if (userId) {
          const numNotifications = 5 + Math.floor(Math.random() * 4); // 5-8 notifications
          for (let i = 0; i < numNotifications; i++) {
            const template = workerNotificationTemplates[i % workerNotificationTemplates.length];
            const daysAgo = Math.floor(Math.random() * 14); // Within last 2 weeks
            const hoursAgo = Math.floor(Math.random() * 24);
            notifications.push({
              user_id: userId,
              type: template.type,
              title: template.title,
              message: template.message,
              is_read: Math.random() > 0.6, // 40% unread
              data: {},
              created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }

      // Generate notifications for employers
      for (const email of employerEmails) {
        const userId = await getUserIdByEmail(email);
        if (userId) {
          const numNotifications = 6 + Math.floor(Math.random() * 4); // 6-9 notifications
          for (let i = 0; i < numNotifications; i++) {
            const template = employerNotificationTemplates[i % employerNotificationTemplates.length];
            const daysAgo = Math.floor(Math.random() * 14);
            const hoursAgo = Math.floor(Math.random() * 24);
            notifications.push({
              user_id: userId,
              type: template.type,
              title: template.title,
              message: template.message,
              is_read: Math.random() > 0.5, // 50% unread
              data: {},
              created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }

      // Generate notifications for admins
      for (const email of adminEmails) {
        const userId = await getUserIdByEmail(email);
        if (userId) {
          const numNotifications = 8 + Math.floor(Math.random() * 4); // 8-11 notifications
          for (let i = 0; i < numNotifications; i++) {
            const template = adminNotificationTemplates[i % adminNotificationTemplates.length];
            const daysAgo = Math.floor(Math.random() * 7); // Within last week
            const hoursAgo = Math.floor(Math.random() * 24);
            notifications.push({
              user_id: userId,
              type: template.type,
              title: template.title,
              message: template.message,
              is_read: Math.random() > 0.7, // 30% unread
              data: {},
              created_at: new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000).toISOString()
            });
          }
        }
      }

      if (notifications.length === 0) {
        return {
          success: false,
          message: 'No users found to create notifications for'
        };
      }

      console.log(`Inserting ${notifications.length} notifications...`);

      // Insert notifications in batches
      const batchSize = 20;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error } = await supabase
          .from('notifications')
          .insert(batch);

        if (error) {
          console.error('Error inserting notifications batch:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        message: `Created ${notifications.length} demo notifications`
      };
    } catch (error) {
      console.error('Error seeding notifications:', error);
      return {
        success: false,
        message: 'Failed to seed notifications',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async normalizeAllJobSalaries(): Promise<SeedResult> {
    try {
      const { data: jobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, experience_level')
        .eq('status', 'ACTIVE');

      if (fetchError) {
        return { success: false, message: 'Failed to fetch jobs', errors: [fetchError.message] };
      }

      if (!jobs || jobs.length === 0) {
        return { success: false, message: 'No active jobs found to update' };
      }

      let updated = 0;
      const errors: string[] = [];

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const salary = normalizeSalaryForJob(
          job.experience_level,
          job.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        );

        const { error } = await supabase
          .from('jobs')
          .update({
            salary_min: salary.salary_min,
            salary_max: salary.salary_max,
            salary_display: salary.salary_display,
            currency: salary.currency,
          })
          .eq('id', job.id);

        if (error) {
          errors.push(`${job.id}: ${error.message}`);
        } else {
          updated++;
        }
      }

      if (errors.length > 0 && updated === 0) {
        return {
          success: false,
          message: 'Failed to update job salaries',
          errors,
        };
      }

      return {
        success: true,
        message: `Updated ${updated} of ${jobs.length} active jobs to ₹50K–₹1L/month`,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to normalize job salaries',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async seedAllData(): Promise<SeedResult> {
    const errors: string[] = [];
    const messages: string[] = [];

    // Step 1: Check if accounts already exist, if not create them
    console.log('Step 1: Checking/creating demo accounts...');
    const alreadySeeded = await this.checkIfSeeded();
    
    if (alreadySeeded) {
      console.log('Demo accounts already exist, skipping account creation...');
      messages.push('Using existing demo accounts');
    } else {
      const accountsResult = await this.seedDemoAccounts();
      if (accountsResult.success) {
        messages.push('Demo accounts created');
        // Wait for accounts to be fully created
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // Even if some accounts fail, try to proceed with existing ones
        console.log('Some accounts may have failed, proceeding with existing accounts...');
      }
    }

    // Step 2: Get employer IDs and seed jobs
    console.log('Step 2: Getting employer IDs and seeding jobs...');
    let employerIds = await this.getEmployerUserIds();
    
    // If no employers found, try to get current user if they are an employer
    if (employerIds.length === 0) {
      console.log('No employers found via queries, checking current user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if current user has employer profile
        const { data: empProfile } = await supabase
          .from('employer_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (empProfile) {
          employerIds = [user.id];
          console.log('Using current logged-in employer for seeding');
        }
      }
    }
    
    if (employerIds.length === 0) {
      errors.push('Could not find any employer accounts. Please log in as an employer to seed jobs, or create demo accounts first.');
    } else {
      console.log(`Found ${employerIds.length} employer accounts`);
      const jobsResult = await this.seedJobsData(employerIds[0]);
      if (jobsResult.success) {
        messages.push(jobsResult.message);
      } else {
        errors.push(`Jobs: ${jobsResult.message}`);
      }
    }

    // Step 3: Get worker ID and seed worker data (skip if profile already exists)
    console.log('Step 3: Getting worker ID and seeding worker profile...');
    const workerId = await this.getWorkerUserId();
    if (!workerId) {
      errors.push('Could not find worker account');
    } else {
      // Check if worker profile already exists
      const { data: existingProfile } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', workerId)
        .maybeSingle();
      
      if (existingProfile) {
        messages.push('Worker profile already exists');
      } else {
        const workerResult = await this.seedWorkerData(workerId);
        if (workerResult.success) {
          messages.push('Worker profile created');
        } else {
          errors.push(`Worker: ${workerResult.message}`);
        }
      }
    }

    // Step 4: Seed job applications for workers
    console.log('Step 4: Seeding job applications...');
    const applicationsResult = await this.seedJobApplications();
    if (applicationsResult.success) {
      messages.push(applicationsResult.message);
    } else if (applicationsResult.errors) {
      errors.push(`Applications: ${applicationsResult.message}`);
    }

    // Step 5: Seed notifications for all users
    console.log('Step 5: Seeding notifications...');
    const notificationsResult = await this.seedNotifications();
    if (notificationsResult.success) {
      messages.push(notificationsResult.message);
    } else if (notificationsResult.errors) {
      errors.push(`Notifications: ${notificationsResult.message}`);
    }

    const finalMessage = messages.join('. ') + (messages.length > 0 ? '.' : '');

    if (errors.length > 0) {
      return {
        success: false,
        message: finalMessage || 'Some data failed to seed',
        errors
      };
    }

    return {
      success: true,
      message: finalMessage || 'All demo data seeded successfully!'
    };
  }
}

export const seedService = new SeedService();
