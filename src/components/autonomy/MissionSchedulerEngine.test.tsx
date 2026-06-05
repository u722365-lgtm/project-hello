import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MissionSchedulerEngine } from "./MissionSchedulerEngine";

const executeMission = vi.fn().mockResolvedValue({ success: true });
const fromMock = vi.fn();

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useMissionExecutor", () => ({
  useMissionExecutor: () => ({ executeMission }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

describe("MissionSchedulerEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.setItem("shadowtalk_autonomous_mode_v1", "1");

    const scheduledMission = {
      id: "m1",
      user_id: "user-1",
      title: "Nightly research brief",
      status: "queued",
      scheduled_at: new Date(Date.now() - 60_000).toISOString(),
      steps: [],
      deliverable_type: "general",
    };

    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [scheduledMission], error: null }),
      update: vi.fn().mockReturnThis(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts due scheduled missions on mount", async () => {
    render(<MissionSchedulerEngine />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fromMock).toHaveBeenCalledWith("missions");
    expect(executeMission).toHaveBeenCalledWith(
      expect.objectContaining({ id: "m1", title: "Nightly research brief" }),
    );
  });
});
