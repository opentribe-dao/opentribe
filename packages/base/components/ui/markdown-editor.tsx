"use client";

import * as React from "react";
import { Bold, Italic, Heading1, Heading2, Heading3, Link, List, ListOrdered, Quote, Code, Image, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string | number;
  disabled?: boolean;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  action: (text: string, selectionStart: number, selectionEnd: number) => {
    newText: string;
    newSelectionStart: number;
    newSelectionEnd: number;
  };
  shortcut?: string;
}

const toolbarButtons: ToolbarButton[] = [
  {
    icon: Bold,
    label: "Bold",
    shortcut: "Cmd+B",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end) || "bold text";
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        newText: `${before}**${selectedText}**${after}`,
        newSelectionStart: start + 2,
        newSelectionEnd: start + 2 + selectedText.length,
      };
    },
  },
  {
    icon: Italic,
    label: "Italic",
    shortcut: "Cmd+I",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end) || "italic text";
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        newText: `${before}*${selectedText}*${after}`,
        newSelectionStart: start + 1,
        newSelectionEnd: start + 1 + selectedText.length,
      };
    },
  },
  {
    icon: Heading1,
    label: "Heading 1",
    action: (text, start, end) => {
      const lines = text.split("\n");
      let currentLine = 0;
      let charCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          currentLine = i;
          break;
        }
        charCount += lines[i].length + 1;
      }
      
      lines[currentLine] = `# ${lines[currentLine].replace(/^#+ ?/, "")}`;
      const newText = lines.join("\n");
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: end,
      };
    },
  },
  {
    icon: Heading2,
    label: "Heading 2",
    action: (text, start, end) => {
      const lines = text.split("\n");
      let currentLine = 0;
      let charCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          currentLine = i;
          break;
        }
        charCount += lines[i].length + 1;
      }
      
      lines[currentLine] = `## ${lines[currentLine].replace(/^#+ ?/, "")}`;
      const newText = lines.join("\n");
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: end,
      };
    },
  },
  {
    icon: Heading3,
    label: "Heading 3",
    action: (text, start, end) => {
      const lines = text.split("\n");
      let currentLine = 0;
      let charCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          currentLine = i;
          break;
        }
        charCount += lines[i].length + 1;
      }
      
      lines[currentLine] = `### ${lines[currentLine].replace(/^#+ ?/, "")}`;
      const newText = lines.join("\n");
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: end,
      };
    },
  },
  {
    icon: Link,
    label: "Link",
    shortcut: "Cmd+K",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end) || "link text";
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        newText: `${before}[${selectedText}](url)${after}`,
        newSelectionStart: start + selectedText.length + 3,
        newSelectionEnd: start + selectedText.length + 6,
      };
    },
  },
  {
    icon: List,
    label: "Bullet List",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);
      const lines = selectedText.split("\n");
      const newLines = lines.map((line) => `- ${line}`);
      return {
        newText: `${before}${newLines.join("\n")}${after}`,
        newSelectionStart: start,
        newSelectionEnd: start + newLines.join("\n").length,
      };
    },
  },
  {
    icon: ListOrdered,
    label: "Numbered List",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);
      const lines = selectedText.split("\n");
      const newLines = lines.map((line, index) => `${index + 1}. ${line}`);
      return {
        newText: `${before}${newLines.join("\n")}${after}`,
        newSelectionStart: start,
        newSelectionEnd: start + newLines.join("\n").length,
      };
    },
  },
  {
    icon: Quote,
    label: "Quote",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);
      const lines = selectedText.split("\n");
      const newLines = lines.map((line) => `> ${line}`);
      return {
        newText: `${before}${newLines.join("\n")}${after}`,
        newSelectionStart: start,
        newSelectionEnd: start + newLines.join("\n").length,
      };
    },
  },
  {
    icon: Code,
    label: "Code",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      // Check if selection contains newlines (multi-line code block)
      if (selectedText.includes("\n")) {
        return {
          newText: `${before}\`\`\`\n${selectedText}\n\`\`\`${after}`,
          newSelectionStart: start + 4,
          newSelectionEnd: start + 4 + selectedText.length,
        };
      } else {
        // Inline code
        const codeText = selectedText || "code";
        return {
          newText: `${before}\`${codeText}\`${after}`,
          newSelectionStart: start + 1,
          newSelectionEnd: start + 1 + codeText.length,
        };
      }
    },
  },
  {
    icon: Image,
    label: "Image",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end) || "alt text";
      const before = text.substring(0, start);
      const after = text.substring(end);
      return {
        newText: `${before}![${selectedText}](image-url)${after}`,
        newSelectionStart: start + selectedText.length + 4,
        newSelectionEnd: start + selectedText.length + 13,
      };
    },
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in markdown...",
  className,
  height = 400,
  disabled = false,
}: MarkdownEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = React.useState("editor");

  const handleToolbarClick = (button: ToolbarButton) => {
    if (!textareaRef.current || disabled) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const { newText, newSelectionStart, newSelectionEnd } = button.action(
      value,
      start,
      end
    );

    onChange(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
    }, 0);
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current || disabled) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            handleToolbarClick(toolbarButtons[0]); // Bold
            break;
          case "i":
            e.preventDefault();
            handleToolbarClick(toolbarButtons[1]); // Italic
            break;
          case "k":
            e.preventDefault();
            handleToolbarClick(toolbarButtons[5]); // Link
            break;
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("keydown", handleKeyDown);
      return () => textarea.removeEventListener("keydown", handleKeyDown);
    }
  }, [value, disabled]);

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="editor" className="data-[state=active]:bg-white/20">
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white/20">
              Preview
            </TabsTrigger>
          </TabsList>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
                asChild
              >
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HelpCircle className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Markdown syntax guide</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <TabsContent value="editor" className="mt-0">
          <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10">
              {toolbarButtons.map((button, index) => (
                <React.Fragment key={button.label}>
                  {(index === 2 || index === 5 || index === 9) && (
                    <div className="w-px h-6 bg-white/20 mx-1" />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToolbarClick(button)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 hover:bg-white/10"
                      >
                        <button.icon className="h-4 w-4 text-white/80" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {button.label}
                        {button.shortcut && (
                          <span className="ml-2 text-xs opacity-60">
                            {button.shortcut}
                          </span>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </React.Fragment>
              ))}
            </div>

            {/* Editor */}
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "font-mono text-sm bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none",
                "focus:ring-1 focus:ring-[#E6007A] focus:border-[#E6007A]"
              )}
              style={{ height: typeof height === "number" ? `${height}px` : height }}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div
            className="p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-auto prose prose-invert prose-pink max-w-none"
            style={{ height: typeof height === "number" ? `${height}px` : height }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-white/40 italic">Nothing to preview yet...</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}