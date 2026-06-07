import React, { useState, useEffect } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Text from '../../../atoms/Text';
import { JobComment } from '../../../../types/job';
import { useAuth } from '../../../auth/AuthContext';
import { createDisplayName } from '../../../../utils';

interface EditJobCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: JobComment[];
  onSave: (comments: JobComment[]) => Promise<void>;
  isLoading?: boolean;
}

const EditJobCommentsModal: React.FC<EditJobCommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  onSave,
  isLoading = false,
}) => {
  const { user } = useAuth();
  
  const [commentsList, setCommentsList] = useState<JobComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get current user display name
  const currentUserDisplayName = user 
    ? createDisplayName(user.first_name, user.middle_name, user.last_name) 
    : 'Unknown User';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCommentsList(comments || []);
      setNewComment('');
    }
  }, [isOpen, comments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const newCommentObj: JobComment = {
      comment: newComment.trim(),
      addedBy: currentUserDisplayName,
      addedTime: new Date().toISOString(),
    };

    setCommentsList(prev => [...prev, newCommentObj]);
    setNewComment('');
  };

  const handleDeleteComment = (index: number) => {
    setCommentsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(commentsList);
      onClose();
    } catch (error) {
      console.error('Failed to save comments:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Comments"
      onSave={handleSave}
      isLoading={isLoading || isSaving}
      size="lg"
    >
      <div className="space-y-4">
        {/* Add new comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add New Comment
          </label>
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <Button
              variant="primary"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="self-end"
            >
              <Icon name="plus" size={16} />
              Add
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments ({commentsList.length})
          </label>
          
          {commentsList.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="chat" size={24} className="text-gray-400" />
              </div>
              <Text className="text-gray-400 text-sm">No comments yet</Text>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {commentsList.map((comment, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-700">
                          {comment.addedBy}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {new Date(comment.addedTime).toLocaleString()}
                        </Text>
                      </div>
                      <Text className="text-gray-700 whitespace-pre-wrap text-sm">
                        {comment.comment}
                      </Text>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete comment"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EditModal>
  );
};

export default EditJobCommentsModal;
