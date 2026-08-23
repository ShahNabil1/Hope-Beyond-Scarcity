import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REACTIONS = [
  { key: "heart", emoji: "❤️", label: "Moved" },
  { key: "hope", emoji: "🌱", label: "Hopeful" },
  { key: "clap", emoji: "👏", label: "Grateful" },
  { key: "pray", emoji: "🙏", label: "Praying" },
] as const;

type ReactionKey = (typeof REACTIONS)[number]["key"];

type CommentRow = {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function NewsEngagement({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<ReactionKey | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const [reactionRes, commentRes] = await Promise.all([
      supabase.from("news_reactions").select("reaction,user_id").eq("post_id", postId),
      supabase
        .from("news_comments")
        .select("id,user_id,author_name,author_avatar_url,body,created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false }),
    ]);

    const tally: Record<string, number> = {};
    (reactionRes.data ?? []).forEach((row) => {
      tally[row.reaction] = (tally[row.reaction] ?? 0) + 1;
    });
    setCounts(tally);
    setMine(
      ((reactionRes.data ?? []).find((row) => row.user_id === user?.id)?.reaction as ReactionKey) ??
        null,
    );
    setComments((commentRes.data as CommentRow[]) ?? []);
    setLoading(false);
  }, [postId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function react(key: ReactionKey) {
    if (!user) return;
    const previous = mine;
    setMine(previous === key ? null : key);
    setCounts((current) => {
      const next = { ...current };
      if (previous) next[previous] = Math.max(0, (next[previous] ?? 1) - 1);
      if (previous !== key) next[key] = (next[key] ?? 0) + 1;
      return next;
    });

    const { error } =
      previous === key
        ? await supabase.from("news_reactions").delete().eq("post_id", postId).eq("user_id", user.id)
        : await supabase
            .from("news_reactions")
            .upsert({ post_id: postId, user_id: user.id, reaction: key }, { onConflict: "post_id,user_id" });

    if (error) {
      toast.error("We couldn't save your reaction.");
      void load();
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const body = draft.trim();
    if (body.length < 2) {
      toast.error("Please write a little more.");
      return;
    }
    setPosting(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("news_comments").insert({
      post_id: postId,
      user_id: user.id,
      author_name: profile?.full_name || user.email?.split("@")[0] || "Supporter",
      author_avatar_url: profile?.avatar_url ?? null,
      body,
    });
    setPosting(false);
    if (error) {
      toast.error("Your comment could not be posted.");
      return;
    }
    setDraft("");
    toast.success("Thank you for adding your voice.");
    void load();
  }

  async function removeComment(id: string) {
    const { error } = await supabase.from("news_comments").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that comment.");
      return;
    }
    setComments((current) => current.filter((row) => row.id !== id));
  }

  const totalReactions = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <section className="mt-12 border-t border-border pt-10" id="responses">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">Reader responses</h2>
        <p className="text-xs text-muted-foreground">
          {totalReactions} reaction{totalReactions === 1 ? "" : "s"} · {comments.length} comment
          {comments.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {REACTIONS.map((reaction) => {
          const active = mine === reaction.key;
          return (
            <button
              key={reaction.key}
              type="button"
              disabled={!isAuthenticated}
              onClick={() => react(reaction.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? "border-primary bg-primary-soft text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              } ${isAuthenticated ? "" : "cursor-not-allowed opacity-70"}`}
            >
              <span aria-hidden className="text-base">
                {reaction.emoji}
              </span>
              {reaction.label}
              <span className="text-xs tabular-nums">{counts[reaction.key] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {isAuthenticated ? (
        <form onSubmit={submitComment} className="mt-8 rounded-2xl border border-border bg-card p-5">
          <label htmlFor="comment" className="text-sm font-medium text-foreground">
            Leave a comment
          </label>
          <Textarea
            id="comment"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Share what this story means to you, or ask our field team a question."
            className="mt-3 resize-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{draft.length}/2000</span>
            <Button type="submit" disabled={posting}>
              {posting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Post comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-5">
          <p className="text-sm text-muted-foreground">
            Sign in as a donor or volunteer to react and join the conversation.
          </p>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading responses…</p>
        ) : comments.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="size-4" aria-hidden />
            No comments yet — be the first to respond.
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="flex gap-3">
              <Avatar className="size-9">
                {comment.author_avatar_url ? (
                  <AvatarImage src={comment.author_avatar_url} alt="" />
                ) : null}
                <AvatarFallback>{initials(comment.author_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                  {comment.user_id === user?.id ? (
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {comment.body}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
