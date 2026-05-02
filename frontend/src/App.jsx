import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import CreateRoom from './pages/CreateRoom'
import RoomDetail from './pages/RoomDetail'
import VoterPage from './pages/VoterPage'
import DisplayPage from './pages/DisplayPage'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create" element={<CreateRoom />} />
        <Route path="/admin/room/:roomId" element={<RoomDetail />} />
        <Route path="/vote/:roomId" element={<VoterPage />} />
        <Route path="/display/:roomId" element={<DisplayPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
