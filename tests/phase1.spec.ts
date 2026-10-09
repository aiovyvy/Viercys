import { test, expect } from "@playwright/test";
const future = (offset: number) => {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
test("homepage has immediate booking controls, constrained calendar and independent guest counts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".nav .book")).toHaveText(/Book your stay/);
  await expect(page.locator(".hero-book")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Where Earth",
  );
  const arrival = page.getByLabel("Check-in", { exact: true });
  const departure = page.getByLabel("Check-out", { exact: true });
  await arrival.fill(future(10));
  await departure.fill(future(13));
  await page.getByLabel("Adults", { exact: true }).selectOption("6");
  await page.getByLabel("Children", { exact: true }).selectOption("2");
  await page.getByLabel("Rooms", { exact: true }).selectOption("3");
  await expect(arrival).toHaveValue(future(10));
  await page
    .getByRole("button", { name: "Choose check-in from calendar" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "check-in calendar" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.screenshot({ path: "test-results/home-desktop.png" });
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(page).toHaveURL(/adults=6/);
  await expect(page).toHaveURL(/rooms=3/);
});
test("inline date order errors and invalid-year feedback", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Check-in", { exact: true }).fill(future(13));
  await page.getByLabel("Check-out", { exact: true }).fill(future(10));
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(page.locator(".form-error")).toBeVisible();
  await page.getByLabel("Check-in", { exact: true }).fill("222222-01-01");
  await page.getByLabel("Check-out", { exact: true }).fill("222222-01-04");
  await page
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await expect(page.locator(".form-error")).toBeVisible();
  await expect(page).toHaveURL("/");
});
test("mobile and tablet navigation have no overflow and companion access", async ({
  page,
}) => {
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "My VIERCYS" })
      .click();
    await expect(page).toHaveURL("/my-stay");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await expect(page.locator(".mobile-book-action")).toBeVisible();
  await page.goto("/destinations");
  await expect(
    page.getByText("Future destination · Reservations unavailable"),
  ).toHaveCount(3);
  await page.getByRole("link", { name: "Preview destination" }).first().click();
  await expect(
    page.getByRole("heading", { name: "A preview of what may come." }),
  ).toBeVisible();
});
test("no-JavaScript homepage retains booking form and complete destination alternative", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Check availability", exact: true }),
  ).toBeVisible();
  await page.goto("/destinations");
  await expect(
    page.getByRole("heading", { name: "Bali", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("calendar and suite category controls support keyboard navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Choose check-in from calendar" })
    .click();
  const dates = page
    .getByRole("dialog")
    .locator(".calendar-days button:not([disabled])");
  await dates.first().focus();
  const before = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  await page.keyboard.press("ArrowRight");
  expect(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
  ).not.toBe(before);
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Essential Room", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Signature Suite", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
