'use client';

import { useState, useEffect } from 'react';
import { Button } from '@packages/base/components/ui/button';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@packages/base/components/ui/avatar';
import { useSession } from '@packages/auth/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Edit2, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@packages/base/components/ui/dropdown-menu';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from '../../lib/api/community';

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
  const [newComment, setNewComment] = useState('');
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
      toast.error('Failed to load comments');
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
        setComments(prev => updateCommentsWithReply(prev, parentId, result.comment));
      } else {
        // Add new top-level comment
        setComments(prev => [result.comment, ...prev]);
        setNewComment('');
      }

      toast.success('Comment posted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string, body: string) => {
    if (!body.trim()) return;

    try {
      const result = await updateComment(commentId, body);
      setComments(prev => updateCommentInTree(prev, commentId, result.comment));
      toast.success('Comment updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => removeCommentFromTree(prev, commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  };

  // Helper functions to update nested comment structure
  const updateCommentsWithReply = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
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
  };

  const updateCommentInTree = (comments: Comment[], commentId: string, updatedComment: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return updatedComment;
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updatedComment),
        };
      }
      return comment;
    });
  };

  const removeCommentFromTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: comment.replies ? removeCommentFromTree(comment.replies, commentId) : undefined,
      }));
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isAuthor = session?.user?.id === comment.authorId;
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [replyText, setReplyText] = useState('');

    const handleEdit = async () => {
      await handleUpdateComment(comment.id, editText);
      setIsEditing(false);
    };

    const handleReply = async () => {
      await handleSubmitComment(replyText, comment.id);
      setReplyText('');
      setIsReplying(false);
    };

    return (
      <div className={depth > 0 ? 'ml-12' : ''}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.avatarUrl || undefined} />
            <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white">
                    @{comment.author.username}
                  </span>
                  <span className="text-xs text-white/40">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-white/40">(edited)</span>
                  )}
                </div>

                {isAuthor && !comment.isHidden && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setIsEditing(true);
                        setEditText(comment.body);
                      }}>
                        <Edit2 className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={!editText.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setEditText(comment.body);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/80 whitespace-pre-wrap">{comment.body}</p>
              )}
            </div>

            {!comment.isHidden && depth < 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs"
                onClick={() => {
                  if (!session?.user) {
                    onAuthRequired?.();
                    return;
                  }
                  setIsReplying(true);
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {isReplying && (
              <div className="mt-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyText.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Comments ({comments.length})
        </h3>
        
        {session?.user ? (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback>{session.user.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
              />
              <Button
                className="mt-2"
                onClick={() => handleSubmitComment(newComment)}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <p className="text-white/60 mb-2">Sign in to join the discussion</p>
            <Button onClick={onAuthRequired}>Sign In</Button>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-white/40 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}