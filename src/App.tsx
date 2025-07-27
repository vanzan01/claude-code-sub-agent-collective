import { FC } from 'react'
import UserProfileSecure from './components/UserProfile/UserProfileSecure'
import './App.css'

const mockUserData = {
  id: '123',
  name: 'John Doe',
  avatar: 'https://via.placeholder.com/100',
  bio: '<p>Software developer passionate about <strong>React</strong> and <em>TypeScript</em>.</p>',
  isActive: true,
  email: 'john.doe@example.com'
}

const App: FC = () => {
  const handleProfileUpdate = (data: Partial<typeof mockUserData>) => {
    console.log('Profile update:', data)
  }

  const handleError = (error: string) => {
    console.error('Error:', error)
    alert(`Error: ${error}`)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>TaskMaster Agent - Claude Code</h1>
        <p>Secure React Component Demo</p>
      </header>
      
      <main>
        <UserProfileSecure 
          userData={mockUserData}
          currentUserId="123"
          onProfileUpdate={handleProfileUpdate}
          onError={handleError}
        />
      </main>
    </div>
  )
}

export default App