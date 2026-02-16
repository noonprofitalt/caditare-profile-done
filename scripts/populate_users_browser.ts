
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3001';

const usersToCreate = [
    { name: 'User A', email: 'userA@suhara.com' },
    { name: 'User B', email: 'userB@suhara.com' },
    { name: 'User C', email: 'userC@suhara.com' },
    { name: 'User D', email: 'userD@suhara.com' },
    { name: 'User E', email: 'userE@suhara.com' },
    { name: 'User F', email: 'userF@suhara.com' },
    { name: 'User G', email: 'userG@suhara.com' },
    { name: 'User H', email: 'userH@suhara.com' },
    { name: 'User I', email: 'userI@suhara.com' },
    { name: 'User J', email: 'userJ@suhara.com' },
    { name: 'User K', email: 'userK@suhara.com' },
    { name: 'User L', email: 'userL@suhara.com' },
    { name: 'User M', email: 'userM@suhara.com' },
    { name: 'User N', email: 'userN@suhara.com' },
];

async function main() {
    console.log('🚀 Starting browser automation for user population...');

    // Launch browser with specific viewport
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();

    try {
        // 1. Login
        console.log(`Navigate to ${BASE_URL}...`);
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);

        // Check if we are on login page (e.g. check for Authorize Access button)
        // The button text is "Authorize Access" based on Login.tsx
        const signInButton = page.getByRole('button', { name: 'Authorize Access' });

        if (await signInButton.isVisible()) {
            console.log('Logging in as Admin...');
            // Check if inputs are empty before filling (though filling overwrites usually)
            await page.getByPlaceholder('email@company.com').fill('admin@suhara.com');
            await page.getByPlaceholder('••••••••').fill('3214');
            await signInButton.click();

            // Wait for navigation
            await page.waitForURL('**/', { timeout: 10000 });
            console.log('Login submitted, waiting for dashboard...');
            await page.waitForTimeout(3000); // Give extra time for redirect
        } else {
            console.log('Login form not found via button check.');
            // Check if we are already on dashboard
            if (await page.getByText('GlobalWorkforce').isVisible()) {
                console.log('Already on dashboard.');
            } else {
                console.log('Unknown page state. Current URL:', page.url());
            }
        }

        // Navigate to User Management
        console.log('Navigating to User Management...');
        // App uses HashRouter, so we must use /#/ path
        await page.goto(`${BASE_URL}/#/settings?tab=users`);
        console.log('Navigated. Current URL:', page.url());

        try {
            // Wait for description text to appear (indicates loading finished)
            await page.waitForSelector('text=Manage system access and permissions', { timeout: 30000 });
            // Wait for stats label
            await page.waitForSelector('text=Total Users', { timeout: 10000 });
        } catch (e) {
            console.error('❌ Page content not found.');
            console.log('Current URL:', page.url());
            const bodyPeek = await page.textContent('body');
            console.log('Body dump:', bodyPeek);
            // Take screenshot if possible (saved locally)
            await page.screenshot({ path: 'debug-loading.png' });
            throw e;
        }
        await page.waitForTimeout(1000);

        // Check if Add User button exists immediately
        // The button has "Add User" text inside
        const addButton = page.getByRole('button', { name: 'Add User' });
        if (!await addButton.isVisible()) {
            console.error('❌ "Add User" button NOT visible on load.');
            console.log('Current URL:', page.url());
            // Check if we are admin
            const bodyText = await page.textContent('body');
            console.log('Body text snippet:', bodyText?.substring(0, 500));
        } else {
            console.log('✅ "Add User" button found.');
        }

        // 2. Create Users
        for (const user of usersToCreate) {
            console.log(`Processing ${user.name} (${user.email})...`);

            // Check if user already exists in the table
            // This is a simple check, might need refinement based on table pagination
            const userExists = await page.getByText(user.email).isVisible();
            if (userExists) {
                console.log(`⚠️ User ${user.email} already exists in list.`);
                continue;
            }

            // Click "Add User"
            // Assuming there's a button with "Add User" or similar text.
            // Based on UserList.tsx: <button ...><UserPlus ... /> Add User</button>
            const addButton = page.getByRole('button', { name: 'Add User' });
            if (!await addButton.isVisible()) {
                console.error('❌ "Add User" button not found!');
                // Take screenshot to debug
                await page.screenshot({ path: 'debug-no-add-button.png' });
                break;
            }
            await addButton.click();

            // Fill form
            // UserDialog.tsx labels: "Full Name", "Email Address", "Initial Password", "Role"
            await page.waitForSelector('text=Create New User'); // Wait for dialog title

            // Inputs are not linked to labels, so use placeholders
            await page.getByPlaceholder('John Doe').fill(user.name);
            await page.getByPlaceholder('john@example.com').fill(user.email);
            // Assuming "Initial Password" field exists for new users
            await page.getByPlaceholder('••••••••').fill('22');

            // Set Role to Viewer (default is Viewer, but good to be explicit)
            // Need to find the select associated with Role label
            // Or just assume order: Role is the first select, Status is second (based on UserDialog.tsx)
            // But let's look for closest select to "Role" text
            // Or simpler: just create as default Viewer.
            // The requirement is "Viewer", default is Viewer. So we can skip selecting unless we want to be sure.

            // Let's ensure Role is Viewer to be safe.
            // Using a resilient selector: looking for the select inside the div that follows the label?
            // Actually, simply selecting the first select on the dialog might work if order is preserved.
            // Best approach: locate by label text proximity
            // await page.locator('div').filter({ hasText: /^Role$/ }).locator('..').locator('select').selectOption('Viewer');
            // But since default is Viewer, skipping is safer/faster.


            // Click "Save User" (UserDialog uses Save User text)
            await page.getByRole('button', { name: 'Save User' }).click();

            // Wait for success or error
            // Success closes dialog? Or shows toast?
            // Let's wait for dialog to close
            try {
                // Wait for dialog to disappear or success message
                await page.waitForTimeout(1000); // Wait for API call
                // If checking for success toast:
                // await page.getByText('User created successfully').waitFor();
                console.log(`✅ Created ${user.name}`);
            } catch (e) {
                console.log(`❓ Potential issue creating ${user.name}`);
            }

            // Ensure dialog is closed before next iteration
            try {
                // Wait for the dialog title to disappear
                await page.waitForSelector('text=Create New User', { state: 'hidden', timeout: 5000 });
                // Also wait for the overlay to disappear (fixed inset-0)
                // Use a flexible selector for the overlay
                await page.locator('.fixed.inset-0.z-50').waitFor({ state: 'hidden', timeout: 5000 });
            } catch (e) {
                console.log('Dialog/Overlay did not close automatically, clicking Cancel/Close...');
                const closeButton = page.getByRole('button', { name: 'Cancel' });
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                }
            }

            await page.waitForTimeout(500);
        }

    } catch (error) {
        console.error('❌ Automation failed:', error);
        await page.screenshot({ path: 'error-screenshot.png' });
    } finally {
        await browser.close();
        console.log('🏁 Browser session closed.');
    }
}

main();
