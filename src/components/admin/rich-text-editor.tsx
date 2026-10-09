import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link2, List, ListOrdered, Redo2, Undo2, Unlink } from "lucide-react";

import { cn } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/about-content";

/**
 * Deliberately small editor: paragraphs, bold, italic, lists and links only,
 * so editors can't break the page design. Pasted formatting is stripped by
 * the schema (unsupported marks/nodes are dropped) and sanitized again on save.
 */
export function RichTextEditor({
  value,
  onChange,
  invalid,
  id,
}: {
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
        underline: false,
      } as never),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: value,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class:
          "min-h-[140px] px-3 py-2.5 text-sm leading-relaxed outline-none [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? "" : e.getHTML();
      onChange(sanitizeRichText(html));
    },
  });

  // Keep in sync when the parent resets (e.g. "Discard changes").
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : sanitizeRichText(editor.getHTML());
    if (current !== value) editor.commands.setContent(value || "", { emitUpdate: false } as never);
  }, [value, editor]);

  const btn = (active: boolean) =>
    cn(
      "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40",
      active && "bg-primary/10 text-primary",
    );

  function setLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link")["href"] as string | undefined) ?? "";
    const next = window.prompt("Link URL (https://… or /page)", prev);
    if (next === null) return;
    if (!next.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next.trim() }).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring",
        invalid ? "border-destructive" : "border-input",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1.5 py-1">
        <button type="button" aria-label="Bold" className={btn(!!editor?.isActive("bold"))} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="size-4" />
        </button>
        <button type="button" aria-label="Italic" className={btn(!!editor?.isActive("italic"))} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" aria-label="Bullet list" className={btn(!!editor?.isActive("bulletList"))} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="size-4" />
        </button>
        <button type="button" aria-label="Numbered list" className={btn(!!editor?.isActive("orderedList"))} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" aria-label="Add link" className={btn(!!editor?.isActive("link"))} onClick={setLink}>
          <Link2 className="size-4" />
        </button>
        <button type="button" aria-label="Remove link" className={btn(false)} disabled={!editor?.isActive("link")} onClick={() => editor?.chain().focus().unsetLink().run()}>
          <Unlink className="size-4" />
        </button>
        <span className="ml-auto" />
        <button type="button" aria-label="Undo" className={btn(false)} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 className="size-4" />
        </button>
        <button type="button" aria-label="Redo" className={btn(false)} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 className="size-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
