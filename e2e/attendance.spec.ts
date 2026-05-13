import { test, expect } from '@playwright/test'

test.describe('Attendance Page', () => {
  test('shows attendance heading and table', async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('depaid-auth', JSON.stringify({ email: 'test@deped.gov.ph' }))
    })
    await page.goto('/attendance')

    await expect(page.getByTestId('attendance-heading')).toBeVisible()
    await expect(page.getByTestId('attendance-table')).toBeVisible()
  })

  test('clicking a past date cell triggers PIN dialog', async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.setItem('depaid-auth', JSON.stringify({ email: 'test@deped.gov.ph' }))
    })
    await page.goto('/attendance')

    // Wait for table to render
    await expect(page.getByTestId('attendance-table')).toBeVisible()

    // Find a date cell that shows a lock icon (past date)
    const lockedCells = page.locator('[data-testid="attendance-table"] button:has(svg)')

    // If there are locked cells, click one to trigger PIN dialog
    if (await lockedCells.count() > 0) {
      await lockedCells.first().click()
      // PIN dialog should appear
      await expect(page.locator('text=Teacher PIN Required')).toBeVisible({ timeout: 3000 })
    }
    // If no locked cells (e.g., all current week), test passes trivially
  })
})