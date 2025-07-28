import React, { useState } from 'react';

// EXAMPLE: Component with Security and Accessibility Issues
interface UserProfileProps {
  userData: any; // Issue: Using 'any' type
}

const UserProfileBad: React.FC<UserProfileProps> = ({ userData }) => {
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // SECURITY ISSUE: No input sanitization
  const handleCommentSubmit = () => {
    const commentElement = document.getElementById('comments');
    if (commentElement) {
      commentElement.innerHTML += `<div>${comment}</div>`; // XSS vulnerability
    }
    setComment('');
  };

  // SECURITY ISSUE: No authentication check
  const handleDeleteProfile = () => {
    fetch('/api/users/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData.id })
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        User Profile
      </div>
      
      <img src={userData.avatar} style={{ width: '100px', height: '100px' }} />
      
      <div style={{ color: '#ccc', fontSize: '12px' }}>
        Status: <span style={{ color: userData.isActive ? 'green' : 'red' }}>
          {userData.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div dangerouslySetInnerHTML={{ __html: userData.bio }} />

      {isEditing ? (
        <div>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add comment..."
            style={{ border: '1px solid #ccc' }}
          />
          <div 
            onClick={handleCommentSubmit}
            style={{ 
              background: 'blue', 
              color: 'white', 
              padding: '5px',
              cursor: 'pointer'
            }}
          >
            Submit
          </div>
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
          Click to add comment
        </div>
      )}

      <div 
        onClick={handleDeleteProfile}
        style={{ 
          background: 'red', 
          color: 'white', 
          padding: '10px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Delete Profile
      </div>

      <div id="comments" style={{ marginTop: '20px' }}></div>
    </div>
  );
};

export default UserProfileBad;
