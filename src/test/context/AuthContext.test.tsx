import React from "react";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";

vi.mock("@/lib/api");
const mockApi = vi.mocked(api);

// ---------------------------------------------------------------------------
// Helper: simple component that surfaces the auth context values/actions
// ---------------------------------------------------------------------------
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : "null"}</span>
      <span data-testid="loggedIn">{String(auth.isLoggedIn)}</span>
      <button
        onClick={() => auth.login("test@test.com", "pass")}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={() => auth.logout()} data-testid="logout-btn">
        Logout
      </button>
      <button
        onClick={() => auth.signup("test@test.com", "pass", "Test User")}
        data-testid="signup-btn"
      >
        Signup
      </button>
      <button
        onClick={() => auth.forgotPassword("test@test.com")}
        data-testid="forgot-btn"
      >
        Forgot
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // suppress the expected console.error from React
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow(
      "useAuth must be used within AuthProvider",
    );
    spy.mockRestore();
  });
});

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with no user when localStorage is empty and getCurrentUser resolves", async () => {
    // No token in storage → getCurrentUser should not be called
    mockApi.getCurrentUser.mockResolvedValue({
      user: { id: "1", name: "Test", email: "t@t.com" },
    });
    await act(async () => {
      renderWithProvider();
    });
    expect(screen.getByTestId("loggedIn").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(mockApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it("restores user from localStorage when a token is present and getCurrentUser succeeds", async () => {
    const storedUser = { id: "42", name: "Alice", email: "alice@example.com" };
    localStorage.setItem("auth_token", "valid-token");
    localStorage.setItem("user", JSON.stringify(storedUser));
    mockApi.getCurrentUser.mockResolvedValue({ user: storedUser });

    await act(async () => {
      renderWithProvider();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loggedIn").textContent).toBe("true");
    });
    const user = JSON.parse(screen.getByTestId("user").textContent!);
    expect(user.email).toBe("alice@example.com");
  });

  it("clears auth when getCurrentUser fails (invalid/expired token)", async () => {
    localStorage.setItem("auth_token", "expired-token");
    localStorage.setItem("user", JSON.stringify({ id: "1", name: "X", email: "x@x.com" }));
    mockApi.getCurrentUser.mockRejectedValue(new api.ApiRequestError("Unauthorized", 401));

    await act(async () => {
      renderWithProvider();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loggedIn").textContent).toBe("false");
    });
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("clears stale user data from localStorage when no token is present", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", name: "X", email: "x@x.com" }));
    // No auth_token in storage

    await act(async () => {
      renderWithProvider();
    });

    expect(localStorage.getItem("user")).toBeNull();
  });

  it("login() stores token and user in state and localStorage", async () => {
    const loginResponse = {
      message: "OK",
      token: "new-token",
      user: { id: "10", name: "Bob", email: "bob@bob.com" },
    };
    mockApi.getCurrentUser.mockResolvedValue({ user: loginResponse.user });
    mockApi.loginUser.mockResolvedValue(loginResponse);

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("login-btn"));
    });

    expect(screen.getByTestId("loggedIn").textContent).toBe("true");
    const user = JSON.parse(screen.getByTestId("user").textContent!);
    expect(user.email).toBe("bob@bob.com");
    expect(localStorage.getItem("auth_token")).toBe("new-token");
  });

  it("logout() clears user state and localStorage", async () => {
    const loginResponse = {
      message: "OK",
      token: "tok",
      user: { id: "1", name: "Test", email: "t@t.com" },
    };
    mockApi.getCurrentUser.mockResolvedValue({ user: loginResponse.user });
    mockApi.loginUser.mockResolvedValue(loginResponse);
    mockApi.logoutUser.mockResolvedValue({ message: "Logged out" });

    await act(async () => {
      renderWithProvider();
    });

    // Log in first
    await act(async () => {
      fireEvent.click(screen.getByTestId("login-btn"));
    });
    expect(screen.getByTestId("loggedIn").textContent).toBe("true");

    // Then log out
    await act(async () => {
      fireEvent.click(screen.getByTestId("logout-btn"));
    });
    expect(screen.getByTestId("loggedIn").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("logout() clears localStorage even when logoutUser API call fails", async () => {
    mockApi.getCurrentUser.mockRejectedValue(new Error("fail"));
    mockApi.loginUser.mockResolvedValue({
      message: "OK",
      token: "tok",
      user: { id: "1", name: "Test", email: "t@t.com" },
    });
    mockApi.logoutUser.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("login-btn"));
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("logout-btn"));
    });

    expect(screen.getByTestId("loggedIn").textContent).toBe("false");
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("signup() calls startSignup and returns email verification info", async () => {
    mockApi.getCurrentUser.mockRejectedValue(new Error("no token"));
    mockApi.startSignup.mockResolvedValue({
      message: "Check email",
      requiresEmailVerification: true,
      email: "test@test.com",
    });

    let signupResult: { requiresEmailVerification: boolean; email: string } | undefined;

    function SignupConsumer() {
      const auth = useAuth();
      return (
        <button
          onClick={async () => {
            signupResult = await auth.signup("test@test.com", "pass", "Test");
          }}
        >
          Signup
        </button>
      );
    }

    await act(async () => {
      render(
        <AuthProvider>
          <SignupConsumer />
        </AuthProvider>,
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(signupResult?.requiresEmailVerification).toBe(true);
    expect(signupResult?.email).toBe("test@test.com");
    expect(mockApi.startSignup).toHaveBeenCalledWith({
      name: "Test",
      email: "test@test.com",
      password: "pass",
    });
  });

  it("forgotPassword() calls startForgotPassword with the given email", async () => {
    mockApi.getCurrentUser.mockRejectedValue(new Error("no token"));
    mockApi.startForgotPassword.mockResolvedValue({ message: "Sent" });

    await act(async () => {
      renderWithProvider();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("forgot-btn"));
    });

    expect(mockApi.startForgotPassword).toHaveBeenCalledWith({ email: "test@test.com" });
  });
});
