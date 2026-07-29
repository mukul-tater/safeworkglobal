# Demo Credentials

## How to Seed Demo Data

1. **Navigate to the seed page**: Visit `/seed-data` in your browser
2. **Click "Seed Demo Data"** button to populate the database
3. **Wait for completion**: The process takes about 10-15 seconds

Alternatively, in development mode, you'll see a floating "Seed Demo Data" button in the bottom-right corner of the homepage.

## Demo Accounts

### Admin Account
- **Email**: `admin@safeworkglobal.demo`
- **Password**: `Admin@2024!`
- **Role**: Administrator
- **Access**: Full system access, user management, reports

> **If login says “Invalid login credentials”:** the Auth user was never created (seed not run).  
> Fix (pick one):
> 1. Open `/admin/register` → create with the email above + password `Admin@2024!`, then sign in; **or**
> 2. Run `scripts/ensure-demo-admin.sql` in Supabase SQL Editor, then sign in at `/admin/login`.

### Employer Accounts

#### Primary Employer
- **Email**: `employer@safeworkglobal.demo`
- **Password**: `Employer@2024!`
- **Role**: Employer
- **Access**: Post jobs, search workers, manage applications

#### Secondary Employer
- **Email**: `employer2@safeworkglobal.demo`
- **Password**: `Employer@2024!`
- **Role**: Employer

### Worker Accounts

#### Worker 1 (Full Profile)
- **Email**: `worker@safeworkglobal.demo`
- **Password**: `Worker@2024!`
- **Role**: Worker
- **Access**: Browse jobs, apply, manage profile
- **Profile**: Complete with skills, certifications, and work experience

#### Worker 2
- **Email**: `worker2@safeworkglobal.demo`
- **Password**: `Worker@2024!`
- **Role**: Worker

#### Worker 3
- **Email**: `worker3@safeworkglobal.demo`
- **Password**: `Worker@2024!`
- **Role**: Worker

## Sample Data Included

### Jobs (6 positions)
1. **Senior Welder** - Automotive Plant (Detroit, MI)
   - Salary: $55,000 - $75,000
   - 3 openings, Visa sponsorship available

2. **Electrician** - Commercial Construction (Multiple locations)
   - Salary: $45,000 - $65,000
   - 5 openings

3. **Carpenter** - Luxury Home Builder (Aspen, CO)
   - Salary: $50,000 - $70,000
   - 2 openings

4. **Plumber** - Industrial Facility (Houston, TX)
   - Salary: $60,000 - $85,000
   - 4 openings, Visa sponsorship available

5. **Painter** - Residential & Commercial (Phoenix, AZ)
   - Salary: $35,000 - $50,000
   - 6 openings

6. **HVAC Technician** - Service & Installation (Atlanta, GA)
   - Salary: $48,000 - $68,000
   - 3 openings

### Worker Profile Data
- Multiple skills with proficiency levels
- Professional certifications (AWS Certified Welder)
- Work experience history
- Education details

### Job Skills
Each job includes relevant skills:
- MIG/TIG Welding
- Electrical Installation
- Finish Carpentry
- Industrial Plumbing
- HVAC Installation
- And more...

## Important Notes

⚠️ **Before Seeding**
- Make sure email confirmation is disabled in Lovable Cloud settings for faster testing
- The seeding process will fail if accounts already exist
- Clear existing data before re-seeding

🔒 **Security**
- These are demo credentials only
- Never use these passwords in production
- Always change default credentials in production environments

🚀 **Development Mode**
- The seed button only appears when `NODE_ENV=development`
- In production builds, the `/seed-data` route is still accessible but not promoted via UI

## Troubleshooting

**"Demo accounts already exist" error**
- Log out of all accounts
- Delete existing users from the database
- Try seeding again

**"Rate limiting" errors**
- Wait 1-2 minutes between seeding attempts
- The service includes automatic delays to prevent rate limiting

**Accounts created but no data**
- Check backend logs for errors
- Ensure user IDs are correctly retrieved
- Verify database permissions for all tables
