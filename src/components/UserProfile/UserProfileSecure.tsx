import React, { useState, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';

interface UserData {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  isActive: boolean;
  email: string;
}

interface UserProfileProps {
  userData: UserData;
  currentUserId?: string;
  onProfileUpdate?: (data: Partial<UserData>) => void;
  onError?: (error: string) => void;
}

const UserProfileSecure: React.FC<UserProfileProps> = ({ 
  userData, 
  currentUserId,
  onProfileUpdate,
  onError 
}) => {
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Security: Input validation and sanitization
  const validateComment = (text: string): boolean => {
    if (!text.trim()) {
      setErrors(prev => ({ ...prev, comment: 'Comment cannot be empty' }));
      return false;
    }
    if (text.length > 500) {
      setErrors(prev => ({ ...prev, comment: 'Comment must be less than 500 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, comment: '' }));
    return true;
  };

  // Security: Proper authentication check
  const isAuthorizedUser = useCallback((): boolean => {
    return currentUserId === userData.id || currentUserId === 'admin';
  }, [currentUserId, userData.id]);

  const handleCommentSubmit = useCallback(async () => {
    if (!validateComment(comment)) return;

    try {
      const sanitizedComment = DOMPurify.sanitize(comment.trim());
      setComments(prev => [...prev, sanitizedComment]);
      setComment('');
      setIsEditing(false);
      
      if (deleteButtonRef.current) {
        deleteButtonRef.current.focus();
      }
    } catch (error) {
      onError?.('Failed to add comment. Please try again.');
    }
  }, [comment, onError]);

  const handleDeleteProfile = useCallback(async () => {
    if (!isAuthorizedUser()) {
      onError?.('You are not authorized to delete this profile.');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this profile? This action cannot be undone.'
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
          'Authorization': 'Bearer ' + getAuthToken()
        },
        body: JSON.stringify({ userId: userData.id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      onProfileUpdate?.({ id: userData.id });
    } catch (error) {
      onError?.('Failed to delete profile. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [userData.id, isAuthorizedUser, onProfileUpdate, onError]);

  const getCsrfToken = (): string => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  const getAuthToken = (): string => {
    return localStorage.getItem('authToken') || '';
  };

  return (
    <main className="user-profile" style={{ padding: '20px', maxWidth: '600px' }}>
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          User Profile: {userData.name}
        </h1>
      </header>

      <section aria-labelledby="profile-info">
        <h2 id="profile-info" className="sr-only">Profile Information</h2>
        
        <img 
          src={userData.avatar} 
          alt={'Profile picture of ' + userData.name}
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
          onError={(e) => {
            e.currentTarget.src = '/images/default-avatar.png';
            e.currentTarget.alt = 'Default profile picture';
          }}
        />
        
        <div style={{ marginTop: '12px' }}>
          <span style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>
            Status: 
          </span>
          <span 
            style={{ 
              marginLeft: '8px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: userData.isActive ? '#d4edda' : '#f8d7da',
              color: userData.isActive ? '#155724' : '#721c24',
              fontSize: '14px'
            }}
            aria-label={'User status: ' + (userData.isActive ? 'Active' : 'Inactive')}
          >
            {userData.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div 
          style={{ marginTop: '16px', lineHeight: '1.5' }}
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(userData.bio, { 
              ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
              ALLOWED_ATTR: []
            }) 
          }} 
        />
      </section>

      <section aria-labelledby="comments-section" style={{ marginTop: '24px' }}>
        <h2 id="comments-section" style={{ fontSize: '18px', marginBottom: '12px' }}>
          Comments
        </h2>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(); }}>
            <div style={{ marginBottom: '8px' }}>
              <label htmlFor="comment-input" className="sr-only">
                Add a comment
              </label>
              <input
                id="comment-input"
                ref={commentInputRef}
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add comment..."
                aria-describedby={errors.comment ? 'comment-error' : undefined}
                aria-invalid={!!errors.comment}
                style={{ 
                  border: errors.comment ? '2px solid #dc3545' : '1px solid #ccc',
                  padding: '8px',
                  width: '100%',
                  borderRadius: '4px'
                }}
                maxLength={500}
              />
              {errors.comment && (
                <div 
                  id="comment-error" 
                  role="alert"
                  style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}
                >
                  {errors.comment}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Submit Comment
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setComment('');
                  setErrors(prev => ({ ...prev, comment: '' }));
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              setIsEditing(true);
              setTimeout(() => commentInputRef.current?.focus(), 0);
            }}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Comment
          </button>
        )}

        {comments.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
            {comments.map((commentText, index) => (
              <li 
                key={index}
                style={{
                  padding: '12px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa'
                }}
              >
                {commentText}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAuthorizedUser() && (
        <section aria-labelledby="danger-zone" style={{ marginTop: '32px' }}>
          <h2 id="danger-zone" style={{ color: '#dc3545', fontSize: '16px' }}>
            Danger Zone
          </h2>
          <button
            ref={deleteButtonRef}
            onClick={handleDeleteProfile}
            disabled={isDeleting}
            style={{
              backgroundColor: isDeleting ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Profile'}
          </button>
          <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
            Warning: This action cannot be undone
          </div>
        </section>
      )}
    </main>
  );
};

export default UserProfileSecure;
