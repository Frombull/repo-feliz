import { defineConfig, devices } from "@playwright/test";

const FRONTEND_PORT = 5173;
const API_PORT = 8000;

// O Makefile passa o comando com o Poetry da máquina (make front-test-e2e).
// Sem ele, usa o `poetry` do PATH.
const apiCommand =
  process.env.E2E_API_COMMAND ?? `poetry run uvicorn app.main:app --port ${API_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // e2e de verdade: o frontend fala com o FastAPI, sem mock
  webServer: [
    {
      command: apiCommand,
      cwd: "../backend",
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev",
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
