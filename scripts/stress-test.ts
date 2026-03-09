import { supabase } from '../services/supabase.ts';
import { WorkflowStage, StageStatus, ProfileCompletionStatus } from '../types.ts';
import crypto from 'crypto';

async function run() {
    console.log('Generating 1000 candidates for stress-testing...');
    const candidates = [];

    // Arrays for random generation
    const stages = Object.values(WorkflowStage);
    const statuses = Object.values(ProfileCompletionStatus);
    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Hannah', 'Ivan', 'Judy'];
    const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const countries = ['Romania', 'Croatia', 'Malta', 'Poland', 'Cyprus', 'Turkey', 'Serbia', 'United Arab Emirates', 'Israel', 'Saudi Arabia'];
    const roles = ['Caregiver', 'Forklift Operator', 'Excavator Operator', 'Nurse', 'Cleaner', 'Driver', 'Mechanic', 'Electrician', 'Mason', 'Welder'];

    for (let i = 0; i < 1000; i++) {
        const id = crypto.randomUUID();
        const year = new Date().getFullYear();
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const code = `GW-ST${year}-${randomNum}-${i}`;

        const stage = stages[Math.floor(Math.random() * stages.length)];
        const completionStatus = Math.random() > 0.3 ? ProfileCompletionStatus.PARTIAL : ProfileCompletionStatus.COMPLETE;

        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = surnames[Math.floor(Math.random() * surnames.length)];
        const fullName = `${firstName} ${lastName}`;

        const prefCountries = [countries[Math.floor(Math.random() * countries.length)]];
        if (Math.random() > 0.5) prefCountries.push(countries[Math.floor(Math.random() * countries.length)]);

        const jobRoles = [roles[Math.floor(Math.random() * roles.length)]];
        if (Math.random() > 0.7) jobRoles.push(roles[Math.floor(Math.random() * roles.length)]);

        const candidateData = {
            id,
            candidateCode: code,
            name: fullName,
            email: `stresstest.${i}@example.com`,
            phone: `+9470${Math.floor(1000000 + Math.random() * 9000000)}`,
            stage: stage,
            stageStatus: StageStatus.PENDING,
            profileCompletionStatus: completionStatus,
            preferredCountries: prefCountries,
            jobRoles: jobRoles,
            regDate: new Date().toISOString(),
        };

        const row = {
            id,
            candidate_code: code,
            name: candidateData.name,
            email: candidateData.email,
            phone: candidateData.phone,
            stage: candidateData.stage,
            stage_status: candidateData.stageStatus,
            nic: null,
            dob: null,
            gender: null,
            data: candidateData,
            updated_at: new Date().toISOString()
        };
        candidates.push(row);
    }

    console.log('Inserting 1000 candidates in batches of 100...');
    for (let i = 0; i < candidates.length; i += 100) {
        const batch = candidates.slice(i, i + 100);
        const { error } = await supabase.from('candidates').insert(batch);
        if (error) {
            console.error('Error inserting batch at index', i, error);
        } else {
            console.log(`Inserted batch ${Math.floor(i / 100) + 1} of 10...`);
        }
    }
    console.log('--- Stress Test Generation Complete! ---');
}

run();
