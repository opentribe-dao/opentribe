"use client";

import { useState } from "react";
import { MarkdownEditor } from "./markdown-editor";

export function MarkdownEditorDemo() {
  const [content, setContent] = useState(`# Welcome to the Markdown Editor

This is a **markdown editor** with live preview. You can write your content using markdown syntax.

## Features

- **Bold** and *italic* text
- [Links](https://example.com)
- Lists (both ordered and unordered)
- Code blocks and \`inline code\`
- > Blockquotes
- Images
- And more!

### Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Bullet point
- Another bullet
  - Nested bullet

> This is a blockquote. It can contain **formatted** text.

---

Try editing this content or write your own!
`);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Markdown Editor Demo</h2>
        <p className="text-white/60">
          A fully-featured markdown editor with toolbar and live preview.
        </p>
      </div>
      
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Start writing..."
        height={500}
      />
      
      <div className="mt-4 p-4 bg-white/5 rounded-lg">
        <h3 className="text-sm font-medium text-white/80 mb-2">Raw Markdown Output:</h3>
        <pre className="text-xs text-white/60 overflow-auto">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}