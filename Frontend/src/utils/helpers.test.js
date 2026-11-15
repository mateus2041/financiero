import {
  formatCurrency,
  activateOnEnterOrSpace,
  parsePositiveInteger,
  validateEmail,
} from "./helpers";

describe("validation helpers", () => {
  test("accepts valid email structure and rejects unsafe malformed input", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("user name@example.com")).toBe(false);
    expect(validateEmail("user@@example.com")).toBe(false);
    expect(validateEmail("user@example")).toBe(false);
  });

  test("preserves numeric-string currency formatting", () => {
    expect(formatCurrency("1250", "en-US", "USD")).toContain("1,250.00");
    expect(formatCurrency(null, "en-US", "USD")).toBe("$0.00");
  });

  test("accepts only positive safe integer identifiers", () => {
    expect(parsePositiveInteger(12)).toBe(12);
    expect(parsePositiveInteger("12")).toBe(12);
    expect(parsePositiveInteger("1/../2")).toBeNull();
    expect(parsePositiveInteger("1.5")).toBeNull();
    expect(parsePositiveInteger(Number.MAX_SAFE_INTEGER + 1)).toBeNull();
    expect(parsePositiveInteger(null)).toBeNull();
  });

  test("activates keyboard controls only with Enter or Space", () => {
    const action = jest.fn();
    const enterEvent = { key: "Enter", preventDefault: jest.fn() };
    const spaceEvent = { key: " ", preventDefault: jest.fn() };
    const otherEvent = { key: "ArrowDown", preventDefault: jest.fn() };

    activateOnEnterOrSpace(enterEvent, action);
    activateOnEnterOrSpace(spaceEvent, action);
    activateOnEnterOrSpace(otherEvent, action);

    expect(action).toHaveBeenCalledTimes(2);
    expect(enterEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(spaceEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(otherEvent.preventDefault).not.toHaveBeenCalled();
  });
});
