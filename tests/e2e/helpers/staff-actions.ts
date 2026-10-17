import type { Page } from "@playwright/test";

export async function openStaffAction(page: Page, name: string, action: "Editar datos" | "Horarios") {
  await page.getByRole("button", { name: `Más acciones de ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}
