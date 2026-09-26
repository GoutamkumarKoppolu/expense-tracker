import { describe, expect, it } from "vitest";
import { upFrom } from "./useBackButton";

const routes = {
  home: {},
  report: { parent: "home" },
  more: { parent: "home" },
  bills: { parent: "more" },
  budgets: { parent: "more" },
};

describe("upFrom (Android Back)", () => {
  it("steps up through a page's own levels first", () => {
    expect(upFrom(routes, "bills", "3/7")).toBe("bills/3");
    expect(upFrom(routes, "bills", "3")).toBe("bills");
    expect(upFrom(routes, "budgets", "12")).toBe("budgets");
  });

  it("then goes to the page's parent: Bills → More → Home", () => {
    expect(upFrom(routes, "bills", null)).toBe("more");
    expect(upFrom(routes, "more", null)).toBe("home");
    expect(upFrom(routes, "report", null)).toBe("home");
  });

  it("has nowhere to go from Home, so the app closes", () => {
    expect(upFrom(routes, "home", null)).toBeNull();
    expect(upFrom(routes, "unknown", null)).toBeNull();
  });
});
