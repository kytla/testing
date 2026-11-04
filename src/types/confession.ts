export type ConfessionCategory =
  | "School"
  | "Love"
  | "Rant"
  | "Funny"
  | "Crush"
  | "Life";

export interface ConfessionComment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface Confession {
  id: string;
  number: number;
  date: string;
  text: string;
  category: ConfessionCategory;
  hearts: number;
  laughs: number;
  sads: number;
  comments: ConfessionComment[];
  /**
   * Viewer-only flag: true when the signed-in user owns this post.
   * Derived client-side from the user's own authorized ownership list —
   * public post data never carries any author identity.
   */
  mine?: boolean;
}

export interface ReactionState {
  heart: boolean;
  laugh: boolean;
  sad: boolean;
}

export type ReportReason =
  | "names-person"
  | "harassment"
  | "hate"
  | "explicit"
  | "spam"
  | "other";

export interface PostReport {
  postId: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
}
