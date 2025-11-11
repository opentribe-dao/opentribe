"use client";

import { useSession } from "@packages/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@packages/base/components/ui/avatar";
import { Button } from "@packages/base/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
import { Textarea } from "@packages/base/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Edit2, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Comment,
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../../lib/api/community";

interface CommentThreadProps {
  rfpId?: string;
  bountyId?: string;
  applicationId?: string;
  submissionId?: string;
  onAuthRequired?: () => void;
}

export function CommentThread({
  rfpId,
  bountyId,
  applicationId,
  submissionId,
  onAuthRequired,
}: CommentThreadProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load comments
  useEffect(() => {
    loadComments();
  }, [rfpId, bountyId, applicationId, submissionId]);

  const loadComments = async () => {
    try {
      const result = await getComments({
        rfpId,
        bountyId,
        applicationId,
        submissionId,
      });
      setComments(result.comments);
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (body: string, parentId?: string) => {
    if (!session?.user) {
      onAuthRequired?.();
      return;
    }

    if (!body.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createComment({
        body,
        parentId,
        rfpId,
        bountyId,
        applicationId,
        submissionId,
      });

      if (parentId) {
        // Add reply to parent comment
        setComments((prev) =>
          updateCommentsWithReply(prev, parentId, result.comment)
        );
      } else {
        // Add new top-level comment
        setComments((prev) => [result.comment, ...prev]);
        setNewComment("");
      }

      toast.success("Comment posted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to post comment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, body: string) => {
    if (!body.trim()) return;

    try {
      const result = await updateComment(commentId, body);
      setComments((prev) =>
        updateCommentInTree(prev, commentId, result.comment)
      );
      toast.success("Comment updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update comment"
      );
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => removeCommentFromTree(prev, commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete comment"
      );
    }
  };

  // Helper functions to update nested comment structure
  const updateCommentsWithReply = (
    comments: Comment[],
    parentId: string,
    newReply: Comment
  ): Comment[] =>
    comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentsWithReply(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });

  const updateCommentInTree = (
    comments: Comment[],
    commentId: string,
    updatedComment: Comment
  ): Comment[] =>
    comments.map((comment) => {
      if (comment.id === commentId) {
        return updatedComment;
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(
            comment.replies,
            commentId,
            updatedComment
          ),
        };
      }
      return comment;
    });

  const removeCommentFromTree = (
    comments: Comment[],
    commentId: string
  ): Comment[] =>
    comments
      .filter((comment) => comment.id !== commentId)
      .map((comment) => ({
        ...comment,
        replies: comment.replies
          ? removeCommentFromTree(comment.replies, commentId)
          : undefined,
      }));

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => {
    const isAuthor = session?.user?.id === comment.authorId;
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [replyText, setReplyText] = useState("");

    const handleEdit = async () => {
      await handleUpdateComment(comment.id, editText);
      setIsEditing(false);
    };

    const handleReply = async () => {
      await handleSubmitComment(replyText, comment.id);
      setReplyText("");
      setIsReplying(false);
    };

    return (
      <div className={depth > 0 ? "ml-12" : ""}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.image || undefined} />
            <AvatarFallback>
              {comment.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white">
                    @{comment.author.username}
                  </span>
                  <span className="text-white/40 text-xs">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-white/40 text-xs">(edited)</span>
                  )}
                </div>

                {isAuthor && !comment.isHidden && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setIsEditing(true);
                          setEditText(comment.body);
                        }}
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2">
                  <Textarea
                    className="min-h-[80px] border-white/10 bg-white/5 text-white"
                    onChange={(e) => setEditText(e.target.value)}
                    value={editText}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      disabled={!editText.trim()}
                      onClick={handleEdit}
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditText(comment.body);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-white/80">
                  {comment.body}
                </p>
              )}
            </div>

            {!comment.isHidden && depth < 2 && (
              <Button
                className="mt-1 text-xs"
                onClick={() => {
                  if (!session?.user) {
                    onAuthRequired?.();
                    return;
                  }
                  setIsReplying(true);
                }}
                size="sm"
                variant="ghost"
              >
                <MessageCircle className="mr-1 h-3 w-3" />
                Reply
              </Button>
            )}

            {isReplying && (
              <div className="mt-3">
                <Textarea
                  autoFocus
                  className="min-h-[80px] border-white/10 bg-white/5 text-white"
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  value={replyText}
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    disabled={!replyText.trim() || isSubmitting}
                    onClick={handleReply}
                    size="sm"
                  >
                    {isSubmitting ? "Posting..." : "Post Reply"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText("");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    comment={reply}
                    depth={depth + 1}
                    key={reply.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-pink-500 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div>
        <h3 className="mb-4 font-semibold text-lg text-white">
          Comments ({comments.length})
        </h3>

        {session?.user ? (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback>{session.user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                className="min-h-[100px] border-white/10 bg-white/5 text-white"
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                value={newComment}
              />
              <Button
                className="mt-2"
                disabled={!newComment.trim() || isSubmitting}
                onClick={() => handleSubmitComment(newComment)}
              >
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-white/5 p-4 text-center">
            <p className="mb-2 text-white/60">Sign in to join the discussion</p>
            <Button onClick={onAuthRequired}>Sign In</Button>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-white/40">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem comment={comment} key={comment.id} />
          ))
        )}
      </div>
    </div>
  );
}
