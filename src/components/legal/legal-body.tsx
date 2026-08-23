/**
 * Renders the plain-text legal copy stored in the CMS.
 * Supported syntax: "## Heading", "- bullet", blank-line separated paragraphs,
 * and **bold** spans. No HTML is injected.
 */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function LegalBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }

        if (lines[0]?.startsWith("## ")) {
          return (
            <div key={index} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {lines[0].slice(3)}
              </h2>
              {lines.slice(1).map((line, i) => (
                <p key={i} className="text-base leading-relaxed text-muted-foreground">
                  {renderInline(line)}
                </p>
              ))}
            </div>
          );
        }

        return (
          <p key={index} className="text-base leading-relaxed text-muted-foreground">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
