import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomApi } from '../services/api'
import './AdminDashboard.css'

function AdminDashboard() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    try {
      const data = await roomApi.list()
      setRooms(data)
    } catch (err) {
      console.error('加载房间失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="text-center mt-80">
            <p>加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="header">
        <div className="header-content">
          <Link to="/" className="logo">YourVote</Link>
          <h1>管理后台</h1>
          <Link to="/admin/create" className="btn btn-primary">
            + 创建新投票
          </Link>
        </div>
      </div>

      <div className="container">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>还没有投票活动</h2>
            <p>点击上方按钮创建您的第一个投票活动</p>
            <Link to="/admin/create" className="btn btn-primary btn-lg">
              创建投票活动
            </Link>
          </div>
        ) : (
          <div className="room-list">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <div className="room-meta">
                    <span className={`room-status ${room.is_active ? 'active' : 'inactive'}`}>
                      {room.is_active ? '进行中' : '已结束'}
                    </span>
                    <span className="room-type">{room.type === 'pk' ? 'PK对决' : '普通投票'}</span>
                    <span className="room-date">
                      {new Date(room.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="room-actions">
                  <Link to={`/admin/room/${room.id}`} className="btn btn-secondary">
                    查看详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
