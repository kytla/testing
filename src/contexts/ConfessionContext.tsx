import { format } from "date-fns";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { confessions as seedConfessions } from "../data/confessions";
import type {
    Confession,
    ConfessionCategory,
    ConfessionComment,
    PostReport,
    ReactionState,
    ReportReason,
} from "../types/confession";
import { authService } from "../utils/authService";
import { useAuth } from "./AuthContexts";

interface ConfessionsContextValue {
  posts: Confession[];
  feed: Confession[];
  nextNumber: number;
  currentId: string | null;
  setCurrentId: (id: string) => void;
  getReaction: (id: string) => ReactionState;
  toggleReaction: (id: string, key: keyof ReactionState) => void;
  getComments: (post: Confession) => ConfessionComment[];
  addComment: (id: string, text: string) => void;
  addPost: (text: string, category: ConfessionCategory) => Confession;
  deletePost: (id: string) => Promise<void>;
  reportPost: (id: string, reason: ReportReason, details: string) => void;
}

const ConfessionsContext = createContext<ConfessionsContextValue | null>(null);
const emptyReaction: ReactionState = { heart: false, laugh: false, sad: false };

export function ConfessionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();
  const [rawPosts, setPosts] = useState<Confession[]>(seedConfessions);
  const [myPostIds, setMyPostIds] = useState<Set<string>>(() => new Set());
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});
  const [addedComments, setAddedComments] = useState<
    Record<string, ConfessionComment[]>
  >({});
  const [reports, setReports] = useState<PostReport[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(
    seedConfessions[0]?.id ?? null,
  );

  // Ownership is fetched per session and only for the signed-in user's own posts.
  // Switching or ending a session wipes everything tied to the previous viewer.
  useEffect(() => {
    setMyPostIds(new Set());
    setReactions({});
    setAddedComments({});
    if (!token) return;
    let cancelled = false;
    authService
      .listMyPostIds(token)
      .then((ids) => {
        if (!cancelled) setMyPostIds(new Set(ids));
      })
      .catch(() => {
        if (!cancelled) setMyPostIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const posts = useMemo(
    () => rawPosts.map((p) => (myPostIds.has(p.id) ? { ...p, mine: true } : p)),
    [rawPosts, myPostIds],
  );

  const feed = useMemo(() => {
    const reported = new Set(reports.map((r) => r.postId));
    return posts.filter((p) => !reported.has(p.id));
  }, [posts, reports]);

  const nextNumber = useMemo(
    () => posts.reduce((max, p) => Math.max(max, p.number), 0) + 1,
    [posts],
  );

  const getReaction = useCallback(
    (id: string) => reactions[id] ?? emptyReaction,
    [reactions],
  );

  const toggleReaction = useCallback((id: string, key: keyof ReactionState) => {
    setReactions((r) => {
      const current = r[id] ?? emptyReaction;
      return { ...r, [id]: { ...current, [key]: !current[key] } };
    });
  }, []);

  const getComments = useCallback(
    (post: Confession) => [...post.comments, ...(addedComments[post.id] ?? [])],
    [addedComments],
  );

  const addComment = useCallback((id: string, text: string) => {
    const comment: ConfessionComment = {
      id: `${id}-${Date.now()}`,
      author: "You · Anonymous",
      text,
      time: "now",
    };
    setAddedComments((c) => ({ ...c, [id]: [...(c[id] ?? []), comment] }));
  }, []);

  const addPost = useCallback(
    (text: string, category: ConfessionCategory) => {
      const post: Confession = {
        id: `mine-${Date.now()}`,
        number: nextNumber,
        date: format(new Date(), "MMM d, yyyy"),
        text,
        category,
        hearts: 0,
        laughs: 0,
        sads: 0,
        comments: [],
      };
      setPosts((p) => [post, ...p]);
      setMyPostIds((ids) => new Set(ids).add(post.id));
      // Ownership is recorded privately on the server, never on the public post.
      if (token) authService.claimPost(token, post.id).catch(() => undefined);
      setCurrentId(post.id);
      return { ...post, mine: true };
    },
    [nextNumber, token],
  );

  const moveOffIfCurrent = useCallback(
    (id: string) => {
      if (currentId !== id || feed.length < 2) return;
      const idx = feed.findIndex((p) => p.id === id);
      setCurrentId(feed[(idx + 1) % feed.length].id);
    },
    [currentId, feed],
  );

  const deletePost = useCallback(
    async (id: string) => {
      if (!token) throw new Error("Please log in to continue.");
      await authService.deletePost(token, id);
      moveOffIfCurrent(id);
      setPosts((p) => p.filter((x) => x.id !== id));
      setMyPostIds((ids) => {
        const next = new Set(ids);
        next.delete(id);
        return next;
      });
    },
    [moveOffIfCurrent, token],
  );

  const reportPost = useCallback(
    (id: string, reason: ReportReason, details: string) => {
      moveOffIfCurrent(id);
      setReports((r) => [
        ...r,
        { postId: id, reason, details, createdAt: new Date().toISOString() },
      ]);
    },
    [moveOffIfCurrent],
  );

  const value = useMemo<ConfessionsContextValue>(
    () => ({
      posts,
      feed,
      nextNumber,
      currentId,
      setCurrentId,
      getReaction,
      toggleReaction,
      getComments,
      addComment,
      addPost,
      deletePost,
      reportPost,
    }),
    [
      posts,
      feed,
      nextNumber,
      currentId,
      getReaction,
      toggleReaction,
      getComments,
      addComment,
      addPost,
      deletePost,
      reportPost,
    ],
  );

  return (
    <ConfessionsContext.Provider value={value}>
      {children}
    </ConfessionsContext.Provider>
  );
}

export function useConfessions() {
  const ctx = useContext(ConfessionsContext);
  if (!ctx)
    throw new Error("useConfessions must be used within ConfessionsProvider");
  return ctx;
}
