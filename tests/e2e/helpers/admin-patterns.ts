import { expect, type Page } from "@playwright/test";

/** Common acceptance checks for admin screens at every configured viewport. */
export async function expectAdminViewport(page: Page) {
  const viewport = page.viewportSize()!;
  const width = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
  expect(width, "The screen must not require horizontal scrolling").toBeLessThanOrEqual(viewport.width);
}

export async function expectAdminSaveAction(page: Page) {
  const save = page.getByRole("button", { name: /^(Guardar cambios|Guardando\.\.\.)$/ });
  await expect(save).toHaveCount(1);
  await expect(save).toBeInViewport();
  const box = (await save.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  if (page.viewportSize()!.width < 768) {
    const navigation = page.getByRole("navigation", { name: "Navegación principal" });
    const navBox = (await navigation.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(navBox.y);
    expect(await save.evaluate(element => getComputedStyle(element.parentElement!).position)).toBe("fixed");
  }
  return save;
}

export async function expectAdminNotice(page: Page, { withSaveAction = false } = {}) {
  await expectAdminViewport(page);
  const notice = page.getByTestId("floating-alert");
  await expect(notice).toBeInViewport();
  expect(await notice.evaluate(element => getComputedStyle(element).position)).toBe("fixed");
  const box = (await notice.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  if (viewport.width >= 768) {
    expect(viewport.width - box.x - box.width).toBeCloseTo(24, 0);
  } else {
    const nav = (await page.getByRole("navigation", { name: "Navegación principal" }).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
    if (!withSaveAction) {
      expect(nav.y - box.y - box.height, "Feedback without a fixed Save action sits just above navigation").toBeCloseTo(16, 0);
    }
  }
  const close = (await notice.getByRole("button", { name: /^Cerrar/ }).boundingBox())!;
  expect(close.width).toBeGreaterThanOrEqual(44);
  expect(close.height).toBeGreaterThanOrEqual(44);
  if (withSaveAction) {
    const save = await expectAdminSaveAction(page);
    const saveBox = (await save.boundingBox())!;
    expect(box.y + box.height, "Feedback must not cover Save").toBeLessThanOrEqual(saveBox.y);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(async () => (await notice.boundingBox())?.y).toBe(box.y);
}
