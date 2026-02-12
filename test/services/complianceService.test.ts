import { describe, it, expect } from 'vitest';
import { ComplianceService } from '../../services/complianceService';
import { PassportStatus, PCCStatus } from '../../types';

describe('ComplianceService', () => {
    describe('evaluatePassport', () => {
        it('should mark passport as VALID when expiry is more than 180 days away', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 365);
            const expiryDate = futureDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePassport(
                expiryDate,
                'P123456',
                'USA',
                '2020-01-01'
            );

            expect(result.status).toBe(PassportStatus.VALID);
            expect(result.validityDays).toBeGreaterThan(180);
        });

        it('should mark passport as EXPIRING when expiry is less than 180 days away', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 100);
            const expiryDate = futureDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePassport(
                expiryDate,
                'P123456',
                'USA',
                '2020-01-01'
            );

            expect(result.status).toBe(PassportStatus.EXPIRING);
            expect(result.validityDays).toBeLessThan(180);
            expect(result.validityDays).toBeGreaterThan(0);
        });

        it('should mark passport as EXPIRED when expiry date has passed', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);
            const expiryDate = pastDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePassport(
                expiryDate,
                'P123456',
                'USA',
                '2020-01-01'
            );

            expect(result.status).toBe(PassportStatus.EXPIRED);
            expect(result.validityDays).toBeLessThan(0);
        });

        it('should include passport details in result', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 365);
            const expiryDate = futureDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePassport(
                expiryDate,
                'P123456',
                'USA',
                '2020-01-01'
            );

            expect(result.passportNumber).toBe('P123456');
            expect(result.country).toBe('USA');
            expect(result.issuedDate).toBe('2020-01-01');
            expect(result.expiryDate).toBe(expiryDate);
        });
    });

    describe('evaluatePCC', () => {
        it('should mark PCC as VALID when issued less than 150 days ago', () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 100);
            const issuedDate = recentDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePCC(issuedDate, issuedDate);

            expect(result.status).toBe(PCCStatus.VALID);
            expect(result.ageDays).toBeLessThan(150);
        });

        it('should mark PCC as EXPIRING when issued between 150-180 days ago', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 160);
            const issuedDate = oldDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePCC(issuedDate, issuedDate);

            expect(result.status).toBe(PCCStatus.EXPIRING);
            expect(result.ageDays).toBeGreaterThan(150);
            expect(result.ageDays).toBeLessThan(180);
        });

        it('should mark PCC as EXPIRED when issued more than 180 days ago', () => {
            const veryOldDate = new Date();
            veryOldDate.setDate(veryOldDate.getDate() - 200);
            const issuedDate = veryOldDate.toISOString().split('T')[0];

            const result = ComplianceService.evaluatePCC(issuedDate, issuedDate);

            expect(result.status).toBe(PCCStatus.EXPIRED);
            expect(result.ageDays).toBeGreaterThan(180);
        });

        it('should calculate expiry date correctly', () => {
            const issuedDate = '2024-01-01';
            const result = ComplianceService.evaluatePCC(issuedDate, issuedDate);

            const expectedExpiry = new Date('2024-01-01');
            expectedExpiry.setDate(expectedExpiry.getDate() + 180);

            expect(result.expiryDate).toBe(expectedExpiry.toISOString().split('T')[0]);
        });
    });
});
