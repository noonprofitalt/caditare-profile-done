import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import { FinanceService } from '../services/financeService';

async function run() {
    try {
        const candidates = await CandidateService.getCandidates() || [];
        const employers = await PartnerService.getEmployers() || [];
        const val = FinanceService.getProjectedRevenue(candidates, employers);
        console.log('\n--- SYSTEM AUDIT ---');
        console.log('Total Active Candidates Processed:', candidates.length);
        console.log('Total Employers Available:', employers.length);
        console.log('\n➜ CALCULATED PROJECTED REVENUE: $' + val.toLocaleString());
        console.log('--------------------\n');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
run();
