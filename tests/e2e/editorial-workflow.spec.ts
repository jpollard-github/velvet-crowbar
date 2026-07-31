import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const syntheticTitleBase = "Synthetic boundary translation";
const syntheticBodyBase = "SYNTHETIC_PRIVATE_BODY_NETWORK_SENTINEL";
const syntheticSlugBase = "synthetic-boundary-translation";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Editor email").fill("editor@example.test");
  await page.getByLabel("Password").fill("synthetic-e2e-password-only");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/studio/);
}

test("reader and editor drill preserves the public/private boundary", async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== "desktop", "full workflow runs once");
  const retrySuffix = testInfo.retry ? ` retry ${testInfo.retry}` : "";
  const slugRetrySuffix = testInfo.retry ? `-retry-${testInfo.retry}` : "";
  const syntheticTitle = `${syntheticTitleBase}${retrySuffix}`;
  const syntheticBody = `${syntheticBodyBase}${testInfo.retry}`;
  const syntheticSlug = `${syntheticSlugBase}${slugRetrySuffix}`;
  const syntheticPrivateSlug = `synthetic-private-autopsy${slugRetrySuffix}`;
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Calm language",
  );
  await page.getByRole("link", { name: "Read the translations" }).click();
  await page.getByRole("link", { name: "On being blocked" }).click();
  await expect(page.getByText("The delay has a name")).toBeVisible();
  await page.getByRole("link", { name: "Essays" }).click();
  await page.getByRole("link", { name: "A Diagram Won" }).click();
  await expect(
    page.getByText("The runtime still keeps the score."),
  ).toBeVisible();
  await page.getByRole("link", { name: "About" }).click();
  await expect(page.getByText("Jason Pollard is the author")).toBeVisible();

  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in/);
  await signIn(page);
  await expect(
    page.getByText(/development · editor@example\.test/),
  ).toBeVisible();

  await page.getByRole("link", { name: "New entry" }).click();
  await page.getByLabel("Title").fill(syntheticTitle);
  await page.getByLabel("Slug", { exact: true }).fill(syntheticSlug);
  await page.locator('select[name="kind"]').selectOption("translation");
  await page.getByLabel("Polite sentence").fill("A synthetic calm sentence.");
  await page.getByLabel("Markdown body").fill(syntheticBody);
  await expect(
    page.getByLabel("Exact public renderer preview").getByText(syntheticBody),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page).toHaveURL(/\/studio\/entries\/[a-f0-9-]+$/);
  const entryId = page.url().split("/").pop()!;
  await expect(page.getByText("Revision 1")).toBeVisible();

  const anonymousContext = await browser.newContext();
  const anonymous = anonymousContext.request;
  for (const path of [
    "/",
    "/translations",
    "/essays",
    "/sitemap.xml",
    "/feed.xml",
  ]) {
    const response = await anonymous.get(path);
    const text = await response.text();
    expect(text).not.toContain(syntheticTitle);
    expect(text).not.toContain(syntheticBody);
  }
  const rsc = await anonymous.get("/", { headers: { RSC: "1" } });
  expect(await rsc.text()).not.toContain(syntheticBody);
  expect((await anonymous.get(`/translations/${syntheticSlug}`)).status()).toBe(
    404,
  );

  await page.getByLabel("Visibility").selectOption("public");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(
    page.getByText("Acknowledge the publication review before publishing."),
  ).toBeVisible();
  await expect(
    page.getByText("Translation is required for a public translation."),
  ).toBeVisible();
  await page
    .locator('textarea[name="translation"]')
    .fill("A synthetic structural consequence.");
  await page
    .locator('textarea[name="systemUnderneath"]')
    .fill("A synthetic dependency has no visible owner.");
  await page
    .locator('textarea[name="usefulPrinciple"]')
    .fill("Synthetic ownership should remain visible.");
  await page
    .getByLabel("I completed this human review and choose to publish.")
    .check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByRole("button", { name: "Save entry" })).toBeEnabled();
  await expect(page.getByText("Revision 2")).toBeVisible();
  const firstPublishedAt = await page
    .getByText(/Publication chronology:/)
    .locator("time")
    .getAttribute("datetime");
  expect(firstPublishedAt).toBeTruthy();

  await page.getByLabel("Title").fill(`${syntheticTitle} corrected`);
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(
    page.getByText("Acknowledge the publication review before publishing."),
  ).toBeVisible();
  await page
    .getByLabel("I completed this human review and choose to publish.")
    .check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Revision 3")).toBeVisible();
  expect(
    await page
      .getByText(/Publication chronology:/)
      .locator("time")
      .getAttribute("datetime"),
  ).toBe(firstPublishedAt);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(`/translations/${syntheticSlug}`);
  await expect(
    page.getByRole("heading", { name: `${syntheticTitle} corrected` }),
  ).toBeVisible();
  await expect(page.getByText(syntheticBody)).toBeVisible();

  await signIn(page);
  await page.goto(`/studio/entries/${entryId}`);
  await page.getByLabel("Visibility").selectOption("draft");
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Revision 4")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();

  expect((await anonymous.get(`/translations/${syntheticSlug}`)).status()).toBe(
    404,
  );
  for (const path of ["/translations", "/sitemap.xml", "/feed.xml"]) {
    const text = await (await anonymous.get(path)).text();
    expect(text).not.toContain(syntheticTitle);
    expect(text).not.toContain(syntheticBody);
  }

  await signIn(page);
  await page.goto(`/studio/entries/${entryId}`);
  await page.getByLabel("Visibility").selectOption("public");
  await page
    .getByLabel("I completed this human review and choose to publish.")
    .check();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page.getByText("Revision 5")).toBeVisible();
  const republishedAt = await page
    .getByText(/Publication chronology:/)
    .locator("time")
    .getAttribute("datetime");
  expect(new Date(republishedAt!).getTime()).toBeGreaterThan(
    new Date(firstPublishedAt!).getTime(),
  );

  await page.getByRole("link", { name: "New entry" }).click();
  await expect(page).toHaveURL(/\/studio\/new$/);
  await page.getByLabel("Title").fill("Synthetic private autopsy");
  await page.getByLabel("Slug", { exact: true }).fill(syntheticPrivateSlug);
  await page.locator('select[name="kind"]').selectOption("autopsy");
  await expect(
    page
      .locator('select[name="visibility"] option')
      .filter({ hasText: /^public$/ }),
  ).toHaveAttribute("disabled", "");
  await expect(
    page.getByText(
      "This kind has no public route and must remain private or draft.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save entry" }).click();
  await expect(page).toHaveURL(/\/studio\/entries\/[a-f0-9-]+$/);
  await anonymousContext.close();

  await page.goto("/");
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("desktop and 390px UI have focus, no overflow, and reduced motion", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    if (!element) return null;
    const style = getComputedStyle(element);
    return { tag: element.tagName, outline: style.outlineStyle };
  });
  expect(focus?.tag).not.toBe("BODY");
  expect(focus?.outline).not.toBe("none");

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");

  await signIn(page);
  const studioOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(studioOverflow).toBeLessThanOrEqual(0);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  for (const path of [
    "/",
    "/sign-in",
    "/studio",
    "/feed.xml",
    "/sitemap.xml",
    "/api/health",
    "/api/auth/get-session",
  ]) {
    const response = await request.get(path);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers()["strict-transport-security"]).toBeUndefined();
  }
});
