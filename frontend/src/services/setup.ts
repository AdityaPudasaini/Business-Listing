// setup.ts -- calls the first-run installer routes of the backend.
//   GET  /setup/status   { installed }
//   POST /setup/install  { setupCode, name, email, password } -> { installed: true }
import { apiGet, apiPost } from "@/services/api";

export interface InstallInput {
  setupCode: string;
  name: string;
  email: string;
  password: string;
}

export async function getSetupStatus(): Promise<{ installed: boolean }> {
  const payload = await apiGet<{ installed?: unknown }>("/setup/status");
  return { installed: payload?.installed === true };
}

// Creates the first admin account. The caller signs in afterwards with the normal login().
export async function installSite(input: InstallInput): Promise<void> {
  await apiPost("/setup/install", input);
}
