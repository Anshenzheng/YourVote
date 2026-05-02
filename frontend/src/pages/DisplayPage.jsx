import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { roomApi } from '../services/api'
import NumberRoll from '../components/NumberRoll'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import './DisplayPage.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function DisplayPage() {
  const { roomId } = useParams()
  const [roomName, setRoomName] = useState('')
  const [options, setOptions] = useState([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const colors = [
    { primary: '#667eea', gradient: ['#667eea', '#764ba2'] },
    { primary: '#11998e', gradient: ['#11998e', '#38ef7d'] },
    { primary: '#f093fb', gradient: ['#f093fb', '#f5576c'] },
    { primary: '#4facfe', gradient: ['#4facfe', '#00f2fe'] },
    { primary: '#fa709a', gradient: ['#fa709a', '#fee140'] },
    { primary: '#30cfd0', gradient: ['#30cfd0', '#330867'] },
  ]

  const getColor = (index) => {
    return colors[index % colors.length]
  }

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('全屏请求失败:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  let hideControlsTimer = null
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer) clearTimeout(hideControlsTimer)
    hideControlsTimer = setTimeout(() => {
      if (isFullscreen) setShowControls(false)
    }, 3000)
  }, [isFullscreen])

  useEffect(() => {
    const handleMouseMove = resetHideTimer
    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (hideControlsTimer) clearTimeout(hideControlsTimer)
    }
  }, [resetHideTimer])

  useEffect(() => {
    loadInitialData()
    const socket = connectWebSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [roomId])

  async function loadInitialData() {
    try {
      const room = await roomApi.get(roomId)
      setRoomName(room.name)
      setOptions(room.options)
      setTotalVotes(room.total_votes)
    } catch (err) {
      console.error('加载房间数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function connectWebSocket() {
    const socket = io({
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('WebSocket连接成功')
      socket.emit('join', { room_id: roomId })
    })

    socket.on('vote_update', (data) => {
      if (data.room_id === roomId) {
        setOptions(data.options)
        setTotalVotes(data.total_votes)
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket连接断开')
    })

    return socket
  }

  const chartData = {
    labels: options.map(o => o.name),
    datasets: [
      {
        label: '票数',
        data: options.map(o => o.votes_count),
        backgroundColor: options.map((_, i) => getColor(i).primary),
        borderRadius: 8,
        barThickness: 60,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 16, weight: 'bold' },
        callbacks: {
          label: function(context) {
            const percentage = options[context.dataIndex]?.percentage || 0
            return [`票数: ${context.raw}`, `占比: ${percentage}%`]
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#ffffff',
          font: { size: 16, weight: '600' }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 14 },
          stepSize: 1
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    }
  }

  if (loading) {
    return (
      <div className="display-page">
        <div className="loading-screen">
          <div className="loading-spinner-large"></div>
          <p>连接中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="display-page" onClick={resetHideTimer}>
      <div className={`control-bar ${showControls ? 'visible' : 'hidden'}`}>
        <div className="control-bar-content">
          <span className="control-label">大屏展示模式</span>
          <button 
            className="fullscreen-btn"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '✕ 退出全屏' : '⛶ 全屏显示'}
          </button>
        </div>
      </div>

      <div className="display-container">
        <header className="display-header">
          <h1 className="event-title-display">{roomName}</h1>
          <div className="total-votes-display">
            <span className="total-label">总票数</span>
            <NumberRoll value={totalVotes} className="total-number" />
          </div>
        </header>

        <div className="options-display" data-count={options.length}>
          {options.map((option, index) => {
            const color = getColor(index)
            const maxVotes = Math.max(...options.map(o => o.votes_count), 1)
            const barWidth = (option.votes_count / maxVotes) * 100

            return (
              <div 
                key={option.id} 
                className="option-card-display"
                style={{ 
                  '--bar-color': color.primary,
                  '--gradient-start': color.gradient[0],
                  '--gradient-end': color.gradient[1]
                }}
              >
                <div className="option-top">
                  {option.image && (
                    <div className="option-image-display">
                      <img src={option.image} alt={option.name} />
                    </div>
                  )}
                  <div className="option-info-display">
                    <h3 className="option-name-display">{option.name}</h3>
                    <div className="votes-display">
                      <NumberRoll value={option.votes_count} className="votes-number" />
                      <span className="votes-unit">票</span>
                    </div>
                  </div>
                </div>

                <div className="progress-container">
                  <div 
                    className="progress-bar-display"
                    style={{ width: `${barWidth}%` }}
                  >
                    <span className="percentage-text">{option.percentage}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {options.length > 3 && (
          <div className="chart-section">
            <h3>投票统计</h3>
            <div className="chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <footer className="display-footer">
          <p>扫码投票 · 实时更新</p>
        </footer>
      </div>
    </div>
  )
}

export default DisplayPage
