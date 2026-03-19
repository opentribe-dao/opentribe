import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { VerificationEmail } from "../templates/verification-email";

describe("VerificationEmail", () => {
  test("renders the real template tree without runtime React binding failures", () => {
    const html = renderToStaticMarkup(
      React.createElement(VerificationEmail, {
        username: "builder123",
        verificationUrl: "https://opentribe.io/verify?token=abc123",
        verificationCode: "123456",
      })
    );

    expect(html).toContain("Welcome to Opentribe");
    expect(html).toContain("Verify Email Address");
    expect(html).toContain("123456");
  });
});
