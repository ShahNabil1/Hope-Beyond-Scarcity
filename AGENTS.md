<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- About page content lives in one JSON document (about_page table, validated by the zod schema in src/lib/about-content.ts); rich text is allow-list sanitized on save and read — keeps the layout fixed while copy stays editable.
- Every CMS save must bump site_settings.content_version and clear the persisted public cache — this is what makes edits show for all visitors immediately.
