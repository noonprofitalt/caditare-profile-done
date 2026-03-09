import { describe, it, expect } from 'vitest';
import { generateMRZ } from '../mrzGenerator';

describe('mrzGenerator', () => {
    describe('generateMRZ', () => {
        it('should generate a valid 2-line MRZ for a typical Sri Lankan passport', () => {
            const candidate = {
                personalInfo: {
                    surname: 'HITIHAMILLAGE',
                    otherNames: 'DILHANI MENAKA JAYASINGHE',
                    nic: '197162410030',
                    gender: 'Female',
                    dob: '1971-05-03'
                }
            };
            const passport = {
                passportNumber: 'N9121618',
                expiryDate: '2031-11-03'
            };

            const [line1, line2] = generateMRZ(candidate as any, passport as any);

            expect(line1).toHaveLength(44);
            expect(line2).toHaveLength(44);

            // Line 1: P<LKA<HITIHAMILLAGE<<DILHANI<MENAKA<JAYASINGHE<
            expect(line1.startsWith('PB')).toBe(true); // Sri Lankan passports use PB type now in our impl
            expect(line1).toContain('HITIHAMILLAGE');
            expect(line1).toContain('DILHANI');

            // Line 2: Passport No (9) + Check (1) + Nationality (3) + DOB (6) + Check (1) + Sex (1) + Expiry (6) + Check (1) + Optional (14) + Check (1) + Composite Check (1)
            // N9121618 (8 chars) + < + Check
            expect(line2.startsWith('N9121618')).toBe(true);
            // Gender Female -> F
            expect(line2[20]).toBe('F');
            // DOB 1971-05-03 -> 710503
            expect(line2.substring(13, 19)).toBe('710503');
            // Expiry 2031-11-03 -> 311103
            expect(line2.substring(21, 27)).toBe('311103');
        });

        it('should handle missing fields gracefully with placeholders', () => {
            const candidate = {};
            const passport = {};

            const [line1, line2] = generateMRZ(candidate as any, passport as any);

            expect(line1).toHaveLength(44);
            expect(line2).toHaveLength(44);
        });

        it('should format names correctly according to ICAO standards', () => {
            const candidate = {
                personalInfo: {
                    surname: 'STEVENS',
                    otherNames: 'JOHN ALBERT'
                }
            };
            const passport = { passportNumber: 'N1234567', expiryDate: '2030-01-01' };
            const [line1, line2] = generateMRZ(candidate as any, passport as any);

            // PBLKA STEVENS<<JOHN<ALBERT<<<<...
            expect(line1.startsWith('PBLKASTEVENS<<JOHN<ALBERT')).toBe(true);
        });
    });
});
