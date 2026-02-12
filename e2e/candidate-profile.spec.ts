import { test, expect } from '@playwright/test';

test('Candidate Profile loads successfully', async ({ page }) => {
    // Mock Data & Auth
    await page.addInitScript(() => {
        // Auth
        window.localStorage.setItem('globalworkforce_auth_user', JSON.stringify({
            id: 'u-admin',
            name: 'Admin User',
            email: 'admin@globalworkforce.com',
            role: 'Admin',
            avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0F172A&color=fff',
            lastLogin: new Date().toISOString()
        }));

        // Candidate Data
        window.localStorage.setItem('globalworkforce_candidates', JSON.stringify([
            {
                id: '101',
                name: 'Ahmed Hassan',
                email: 'ahmed.h@example.com',
                phone: '+20 123 456 7890',
                role: 'Civil Engineer',
                stage: 'Applied',
                location: 'Cairo, Egypt',
                avatarUrl: 'https://ui-avatars.com/api/?name=Ahmed+Hassan',
                timelineEvents: [],
                documents: [],
                skills: ['AutoCAD'],
                jobRoles: [],
                education: []
            }
        ]));
    });

    // Navigate to candidate profile 101
    await page.goto('/#/candidates/101');

    // Assertions

    // 1. Heading
    await expect(page.getByRole('heading', { name: 'Ahmed Hassan' })).toBeVisible({ timeout: 10000 });

    // 2. Status Badge (using class selector for robustness)
    const statusBadge = page.locator('.bg-blue-100.text-blue-700');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText(/Applied/i);

    // 3. Role
    await expect(page.getByText('Civil Engineer', { exact: false })).toBeVisible();

    // 4. Location
    await expect(page.getByText('Cairo, Egypt', { exact: false })).toBeVisible();

    // 5. Check tabs exist
    await expect(page.getByRole('button', { name: /Timeline/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documents/i })).toBeVisible();

    // Use a more specific locator for Profile tab to avoid conflict with hidden header items
    await expect(page.locator('button').filter({ hasText: 'Profile' }).first()).toBeVisible();
});
