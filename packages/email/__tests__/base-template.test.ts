import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { BaseTemplate } from "../templates/base-template";

describe("BaseTemplate", () => {
  test("renders without requiring a global React binding", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        BaseTemplate,
        { preview: "Preview text" },
        React.createElement("div", null, "Body content")
      )
    );

    expect(html).toContain("Preview text");
    expect(html).toContain("Body content");
  });
});
