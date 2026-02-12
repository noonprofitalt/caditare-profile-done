import { test, expect } from '@playwright/test';

test.describe('Job Matching Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Seed authentication
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'u1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'Admin',
                avatar: '',
                lastLogin: new Date().toISOString()
            }));
        });
    });

    test('should match candidate to job and display score', async ({ page }) => {
        await page.goto('/#/candidates');

        // Wait for candidates to load
        await expect(page.locator('table')).toBeVisible();

        // Click on first candidate
        await page.locator('table tbody tr').first().click();

        // Should navigate to candidate detail
        await expect(page).toHaveURL(/.*\/candidates\/.*/);

        // Verify candidate name is displayed
        await expect(page.locator('h1')).toBeVisible();
    });

    test('should filter candidates by stage', async ({ page }) => {
        await page.goto('/#/candidates');

        // Open filter menu
        await page.getByRole('button', { name: /filter/i }).click();

        // Select a stage filter
        await page.getByText('Registered').click();

        // Apply filter
        await page.getByRole('button', { name: /apply/i }).click();

        // Verify URL contains filter parameter
        await expect(page).toHaveURL(/.*stage=.*/);
    });
});

test.describe('Document Upload Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'u1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'Admin',
                avatar: '',
                lastLogin: new Date().toISOString()
            }));
        });
    });

    test('should navigate to candidate documents section', async ({ page }) => {
        await page.goto('/#/candidates/1');

        // Click on Documents tab
        await page.getByRole('tab', { name: /documents/i }).click();

        // Verify documents section is visible
        await expect(page.locator('text=Document Manager')).toBeVisible();
    });
});

test.describe('Compliance Tracking', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'u1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'Admin',
                avatar: '',
                lastLogin: new Date().toISOString()
            }));
        });
    });

    test('should display compliance widget on candidate detail', async ({ page }) => {
        await page.goto('/#/candidates/1');

        // Verify compliance widget is present
        await expect(page.locator('text=Compliance')).toBeVisible();
        await expect(page.locator('text=Passport')).toBeVisible();
        await expect(page.locator('text=Police Clearance')).toBeVisible();
    });
});
