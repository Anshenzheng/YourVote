import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { roomApi } from '../services/api'
import { QRCodeSVG } from 'qrcode.react'
import './RoomDetail.css'

function RoomDetail() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState({ voter: false, display: false })

  useEffect(() => {
    loadRoom()
  }, [roomId])

  async function loadRoom() {
    try {
      const [roomData, qrData] = await Promise.all([
        roomApi.get(roomId),
        roomApi.getQRCode(roomId)
      ])
      setRoom(roomData)
      setQrData(qrData)
    } catch (err) {
      console.error('加载房间失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive() {
    if (!room) return
    try {
      const result = await roomApi.toggle(roomId, !room.is_active)
      setRoom(prev => ({ ...prev, is_active: result.is_active }))
    } catch (err) {
      console.error('切换状态失败:', err)
    }
  }

  async function copyToClipboard(text, type) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(prev => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }))
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  if (loading) {
    return (
      <div className="room-detail">
        <div className="container text-center mt-80">
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="room-detail">
        <div className="container text-center mt-80">
          <h2>房间不存在</h2>
          <Link to="/admin" className="btn btn-primary mt-20">返回列表</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="room-detail">
      <div className="header">
        <div className="header-content">
          <Link to="/admin" className="logo">YourVote</Link>
          <h1>{room.name}</h1>
          <div className="header-actions">
            <span className={`room-status-badge ${room.is_active ? 'active' : 'inactive'}`}>
              {room.is_active ? '进行中' : '已结束'}
            </span>
            <button
              className={`btn ${room.is_active ? 'btn-secondary' : 'btn-success'}`}
              onClick={toggleActive}
            >
              {room.is_active ? '结束投票' : '重新开始'}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{room.total_votes}</div>
              <div className="stat-label">总投票数</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <div className="stat-value">{room.options.length}</div>
              <div className="stat-label">选项数量</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{room.type === 'pk' ? '⚔️' : '📊'}</div>
            <div className="stat-info">
              <div className="stat-value">{room.type === 'pk' ? 'PK' : '投票'}</div>
              <div className="stat-label">活动类型</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card qr-card">
            <h2 className="card-title">📱 投票二维码</h2>
            <p className="qr-desc">让用户扫码进入投票页面</p>
            
            {qrData && (
              <div className="qr-container">
                <QRCodeSVG
                  value={qrData.voter_url}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}
            
            <div className="link-section">
              <p className="link-label">投票链接</p>
              <div className="link-row">
                <input type="text" readOnly value={qrData?.voter_url || ''} />
                <button
                  className={`btn ${copied.voter ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => copyToClipboard(qrData?.voter_url, 'voter')}
                >
                  {copied.voter ? '已复制' : '复制'}
                </button>
              </div>
            </div>
          </div>

          <div className="card display-card">
            <h2 className="card-title">📺 大屏展示</h2>
            <p className="qr-desc">在大屏幕上打开此链接，实时显示投票情况</p>
            
            <div className="display-preview">
              <div className="display-preview-icon">🖥️</div>
              <p>全屏实时显示<br/>票数变化动画</p>
            </div>
            
            <div className="link-section">
              <p className="link-label">大屏链接</p>
              <div className="link-row">
                <input type="text" readOnly value={qrData?.display_url || ''} />
                <button
                  className={`btn ${copied.display ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => copyToClipboard(qrData?.display_url, 'display')}
                >
                  {copied.display ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            {qrData && (
              <a
                href={qrData.display_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-20"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                打开大屏展示
              </a>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">📋 投票选项</h2>
          <div className="options-list-detail">
            {room.options.map(option => (
              <div key={option.id} className="option-item-detail">
                {option.image && (
                  <div className="option-image-small">
                    <img src={option.image} alt={option.name} />
                  </div>
                )}
                <div className="option-info">
                  <h4>{option.name}</h4>
                  <div className="option-progress">
                    <div 
                      className="option-progress-bar"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="option-stats">
                  <div className="option-votes">{option.votes_count}</div>
                  <div className="option-percentage">{option.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/admin" className="btn btn-secondary">
            ← 返回列表
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RoomDetail
