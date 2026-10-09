import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "../about-content";

describe("About page rich text sanitizer", () => {
  it("removes scripts and event handlers", () => {
    expect(sanitizeRichText('<p onclick="x()">Hi<script>alert(1)</script></p>')).toBe("<p>Hi</p>");
  });
  it("blocks javascript: links", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
  });
  it("keeps safe external links with noopener", () => {
    expect(sanitizeRichText('<a href="https://ex.com">x</a>')).toBe(
      '<a href="https://ex.com" target="_blank" rel="noopener noreferrer nofollow">x</a>',
    );
  });
  it("strips disallowed formatting tags like spans and images", () => {
    expect(sanitizeRichText('<p><span style="color:red">a</span><img src=x onerror=1></p>')).toBe("<p>a</p>");
  });
});
