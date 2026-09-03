import { expect, test } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:3000";
const authGoogleUrl = `${apiBaseUrl}/api/v1/auth/google`;
const authMeUrl = `${apiBaseUrl}/api/v1/auth/me`;
const googleScriptUrl = "https://accounts.google.com/gsi/client";

const currentUser = {
  businessId: 10,
  businessName: "Barber Studio",
  businessSlug: "barber-studio",
  email: "juan@example.com",
  name: "Juan Perez",
  role: "ADMIN",
  userId: 1,
};

test.describe("admin authentication", () => {
  test("shows login when there is no session", async ({ page }) => {
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Session token is required",
          status: 401,
        },
        status: 401,
      });
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
    await expect(page.getByText("Iniciá sesión para continuar")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Agenda" })).not.toBeVisible();
  });

  test("shows login when the session is invalid or expired", async ({ page }) => {
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "UNAUTHORIZED",
          message: "Invalid session",
          status: 401,
        },
        status: 401,
      });
    });

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Ingresar al panel" })).toBeVisible();
    await expect(page.getByText("Si tu sesión venció")).toBeVisible();
  });

  test("allows a valid admin to log in with Google and access the agenda", async ({
    page,
  }, testInfo) => {
    let authMeCalls = 0;

    await page.route(googleScriptUrl, async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `
          window.google = {
            accounts: {
              id: {
                initialize: function(options) {
                  window.__turneroGoogleCallback = options.callback;
                },
                renderButton: function(parent) {
                  var button = document.createElement("button");
                  button.type = "button";
                  button.textContent = "Continuar con Google";
                  button.onclick = function() {
                    window.__turneroGoogleCallback({ credential: "google-id-token" });
                  };
                  parent.appendChild(button);
                }
              }
            }
          };
        `,
      });
    });

    await page.route(authGoogleUrl, async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({ idToken: "google-id-token" });

      await route.fulfill({
        body: "",
        headers: {
          "Set-Cookie": "turnero_session=test-session; HttpOnly; Path=/",
        },
        status: 200,
      });
    });

    await page.route(authMeUrl, async (route) => {
      authMeCalls += 1;

      if (authMeCalls === 1) {
        await route.fulfill({
          contentType: "application/json",
          json: {
            code: "UNAUTHORIZED",
            message: "Session token is required",
            status: 401,
          },
          status: 401,
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        json: currentUser,
        status: 200,
      });
    });

    await page.goto("/login");

    await page.getByRole("button", { name: "Continuar con Google" }).click();

    if (testInfo.project.name === "mobile") {
      await expect(page.getByText("Agenda de hoy")).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
    }

    await expect(page.getByRole("banner").getByTitle("Juan Perez")).toBeVisible();
  });
});
