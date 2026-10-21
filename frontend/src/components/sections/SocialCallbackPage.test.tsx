import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

const completeSocialLogin = vi.fn();
vi.mock("@/services/api", () => ({
  completeSocialLogin: () => completeSocialLogin(),
  logout: vi.fn(),
}));

import { SocialCallbackPage } from "@/components/sections/SocialCallbackPage";

function visit(url: string) {
  window.history.replaceState(null, "", url);
}

describe("SocialCallbackPage", () => {
  beforeEach(() => {
    replace.mockReset();
    completeSocialLogin.mockReset();
  });

  it("completes the login from the session cookie on ?success=true", async () => {
    completeSocialLogin.mockResolvedValue({
      id: "u1",
      name: "Sujata Karki",
      email: "sujata@example.test",
      role: "owner",
    });
    visit("/auth/callback?success=true");

    render(<SocialCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(completeSocialLogin).toHaveBeenCalledTimes(1);
    // The query string is cleared so a refresh doesn't re-run the login.
    expect(window.location.search).toBe("");
  });

  it("shows the provider's error without calling the API", async () => {
    visit("/auth/callback?error=access_denied");

    render(<SocialCallbackPage />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/login was cancelled/i);
    expect(completeSocialLogin).not.toHaveBeenCalled();
  });

  it("fails safely when neither success nor error is present", async () => {
    visit("/auth/callback");

    render(<SocialCallbackPage />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't complete the login/i);
    expect(completeSocialLogin).not.toHaveBeenCalled();
  });

  it("shows the API error when the session can't be verified", async () => {
    completeSocialLogin.mockRejectedValue(
      new Error("We couldn't verify your login. Please try again."),
    );
    visit("/auth/callback?success=true");

    render(<SocialCallbackPage />);

    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't verify your login/i);
    expect(replace).not.toHaveBeenCalled();
  });
});
