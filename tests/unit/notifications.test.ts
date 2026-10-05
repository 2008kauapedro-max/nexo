import { describe, it, expect } from "vitest";
import { badgeCount, notificationGroup } from "../../src/domain/notifications";
describe("notification display", () => {
  it("uses an accessible compact badge for counts", () => {
    expect(badgeCount(0)).toBe("");
    expect(badgeCount(1)).toBe("1");
    expect(badgeCount(2)).toBe("2");
    expect(badgeCount(9)).toBe("9");
    expect(badgeCount(99)).toBe("99");
    expect(badgeCount(100)).toBe("99+");
  });
  it("keeps categories deterministic", () => {
    expect(notificationGroup("ACHIEVEMENT")).toBe("conquistas");
    expect(notificationGroup("SECURITY")).toBe("conta");
    expect(notificationGroup("REVIEW_DUE")).toBe("estudos");
  });
});
