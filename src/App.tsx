import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Eraser,
  Save,
  FilePlus2,
  Download,
  Printer,
} from "lucide-react";

// --- Utility helpers ---
const STORAGE_KEY = "linera_docs_lite_doc";

function download(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms = 500): T {
  let t: number | undefined;
  return ((...args: Parameters<T>) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  }) as T;
}

type ToolButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  ariaLabel?: string;
};

// --- Toolbar Button ---
function ToolButton({ icon: Icon, label, onClick, ariaLabel }: ToolButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-9 w-9 p-0 rounded-xl"
      title={label}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// --- Main Component ---
export default function DocEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState<string>("Untitled (Gmicrochains)");
  const [html, setHtml] = useState<string>("<p><br/></p>");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data?.title) setTitle(data.title);
        if (data?.html) setHtml(data.html);
        setLastSaved(data?.savedAt || null);
      } catch {
        // ignore invalid storage
      }
    }
  }, []);

  // Debounced autosave
  const autosave = useMemo(
    () =>
      debounce((t: string, h: string) => {
        const savedAt = new Date().toISOString();
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ title: t, html: h, savedAt })
        );
        setLastSaved(savedAt);
      }, 800),
    []
  );

  // One-time DOM hydrate so React won't keep replacing innerHTML (caret stays stable)
  useEffect(() => {
    if (editorRef.current && !bootstrapped) {
      editorRef.current.innerHTML = html;
      setBootstrapped(true);
    }
  }, [html, bootstrapped]);

  // Formatting commands
  const apply = (cmd: string, value?: string): void => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      const next = editorRef.current.innerHTML;
      setHtml(next);
      autosave(title, next);
    }
  };

  const setBlock = (tag: string): void => apply("formatBlock", tag);

  const clearFormatting = (): void => {
    setBlock("<P>");
    document.execCommand("removeFormat");
    if (editorRef.current) {
      const next = editorRef.current.innerHTML;
      setHtml(next);
      autosave(title, next);
    }
  };

  const onInput = (): void => {
    if (!editorRef.current) return;
    const next = editorRef.current.innerHTML;
    setHtml(next);
    autosave(title, next);
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const t = e.target.value;
    setTitle(t);
    autosave(t, html);
  };

  const newDocument = (): void => {
    const confirmed = window.confirm("Start a new document? Unsaved changes will be lost.");
    if (!confirmed) return;
    setTitle("Untitled (Gmicrochains)");
    setHtml("<p><br/></p>");
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "<p><br/></p>";
    }, 0);
  };

  const onDownload = (): void => {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${
      title || "document"
    }</title></head><body>${html}</body></html>`;
    download(`${(title || "document").replace(/\s+/g, "_")}.html`, doc);
  };

  const printDoc = (): void => {
    const w = window.open("", "_blank");
    if (!w) return;
    const css = `
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji", "Segoe UI Emoji"; }
        .page { width: 794px; margin: 0 auto; }
      </style>`;
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8">${css}</head><body><div class="page">${html}</div></body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  };

  const plainText =
    typeof window !== "undefined"
      ? new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body
          .textContent || ""
      : "";
  const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const chars = plainText.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <div className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center gap-3">
          <FilePlus2 className="h-5 w-5" />
          <input
            ref={titleRef}
            value={title}
            onChange={onTitleChange}
            className="text-lg md:text-xl font-medium bg-transparent outline-none rounded-xl px-2 py-1 hover:bg-neutral-100 focus:bg-neutral-100"
            aria-label="Document title"
          />
          <div className="ml-auto flex items-center gap-1">
            <ToolButton
              icon={FilePlus2}
              label="New Document"
              onClick={newDocument}
            />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton icon={Undo} label="Undo" onClick={() => apply("undo")} />
            <ToolButton icon={Redo} label="Redo" onClick={() => apply("redo")} />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton
              icon={Save}
              label="Save"
              onClick={() => autosave(title, html)}
            />
            <ToolButton
              icon={Download}
              label="Download HTML"
              onClick={onDownload}
            />
            <ToolButton icon={Printer} label="Print" onClick={printDoc} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mx-auto max-w-screen-xl px-4 py-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-2 md:p-3 flex flex-wrap items-center gap-1">
            <ToolButton icon={Bold} label="Bold" onClick={() => apply("bold")} />
            <ToolButton
              icon={Italic}
              label="Italic"
              onClick={() => apply("italic")}
            />
            <ToolButton
              icon={Underline}
              label="Underline"
              onClick={() => apply("underline")}
            />
            <ToolButton
              icon={Strikethrough}
              label="Strikethrough"
              onClick={() => apply("strikeThrough")}
            />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton
              icon={Heading1}
              label="H1"
              onClick={() => setBlock("<H1>")}
            />
            <ToolButton
              icon={Heading2}
              label="H2"
              onClick={() => setBlock("<H2>")}
            />
            <ToolButton
              icon={Type}
              label="Paragraph"
              onClick={() => setBlock("<P>")}
            />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton
              icon={List}
              label="Bulleted List"
              onClick={() => apply("insertUnorderedList")}
            />
            <ToolButton
              icon={ListOrdered}
              label="Numbered List"
              onClick={() => apply("insertOrderedList")}
            />
            <ToolButton
              icon={Quote}
              label="Quote"
              onClick={() => setBlock("<BLOCKQUOTE>")}
            />
            <ToolButton
              icon={Code}
              label="Code"
              onClick={() => setBlock("<PRE>")}
            />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton
              icon={AlignLeft}
              label="Align Left"
              onClick={() => apply("justifyLeft")}
            />
            <ToolButton
              icon={AlignCenter}
              label="Align Center"
              onClick={() => apply("justifyCenter")}
            />
            <ToolButton
              icon={AlignRight}
              label="Align Right"
              onClick={() => apply("justifyRight")}
            />
            <div className="w-px h-6 bg-neutral-200 mx-1" />
            <ToolButton
              icon={Eraser}
              label="Clear Formatting"
              onClick={clearFormatting}
            />
          </CardContent>
        </Card>
      </div>

      {/* Page canvas */}
      <div className="mx-auto max-w-screen-xl px-4 pb-24">
        <div className="mx-auto bg-white shadow-sm rounded-2xl p-0 md:p-6">
          <div className="mx-auto my-6 md:my-2 bg-white rounded-2xl">
            <div
              className="mx-auto bg-white shadow-md rounded-2xl p-6 md:p-10 min-h-[900px] print:shadow-none"
              style={{ width: 794 }}
            >
              <div
                ref={editorRef}
                className="prose max-w-none outline-none min-h-[800px] focus:cursor-text"
                contentEditable
                suppressContentEditableWarning
                onInput={onInput}
                onBlur={onInput}
                onKeyDown={(e) => {
                  if (e.metaKey || e.ctrlKey) {
                    const k = e.key.toLowerCase();
                    if (k === "b") {
                      e.preventDefault();
                      apply("bold");
                    }
                    if (k === "i") {
                      e.preventDefault();
                      apply("italic");
                    }
                    if (k === "u") {
                      e.preventDefault();
                      apply("underline");
                    }
                    if (k === "s") {
                      e.preventDefault();
                      autosave(title, editorRef.current?.innerHTML || html);
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2">
          <div className="rounded-full bg-white shadow px-4 py-2 text-sm text-neutral-600 flex items-center gap-3">
            <span>{words} words</span>
            <span className="text-neutral-300">•</span>
            <span>{chars} characters</span>
            <span className="text-neutral-300">•</span>
            <span>
              {lastSaved
                ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
                : "Not saved yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
