import { CandidateService } from './services/candidateService.ts';
import { WorkflowStage, StageStatus } from './types.ts';

async function testCreateCandidate() {
    console.log('Starting candidate creation test...');
    try {
        const testCandidate = await CandidateService.createQuickCandidate({
            firstName: 'Test',
            name: 'Test Candidate ' + Date.now(),
            nic: '991234567V',
            phone: '771234567',
            role: 'Verification Specialist',
            dob: '1999-01-01',
            gender: 'Male',
            address: '123 Test St, Colombo'
        });

        if (testCandidate) {
            console.log('Success! Candidate created with ID:', testCandidate.id);
            console.log('Candidate Data from DB:', JSON.stringify({
                nic: testCandidate.nic,
                dob: testCandidate.dob,
                gender: testCandidate.gender
            }, null, 2));
        } else {
            console.error('Failed: Candidate creation returned null.');
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
}

testCreateCandidate();
