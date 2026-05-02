import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { roomApi } from '../services/api'
import { getVoterIdentifier, hasVoted, setVoted } from '../utils/voterId'
import './VoterPage.css'

function VoterPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [voted, setVotedState] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [voting, setVoting] = useState(false)
  const [voteSuccess, setVoteSuccess] = useState(false)
  const [votedOption, setVotedOption] = useState(null)

  useEffect(() => {
    loadRoom()
    const alreadyVoted = hasVoted(roomId)
    setVotedState(alreadyVoted)
  }, [roomId])

  async function loadRoom() {
    try {
      const data = await roomApi.get(roomId)
      setRoom(data)
      if (!data.is_active) {
        setError('投票活动已结束')
      }
    } catch (err) {
      setError('投票活动不存在或已删除')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!selectedOption || voting || voted) return

    setVoting(true)
    setError('')

    try {
      const voterId = getVoterIdentifier(roomId)
      const result = await roomApi.vote(roomId, selectedOption, voterId)
      
      if (result.success) {
        setVoteSuccess(true)
        setVotedOption(result.voted_option)
        setVoted(roomId)
        setVotedState(true)
      }
    } catch (err) {
      console.error('投票失败:', err)
      setError('投票失败，请稍后重试')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="voter-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="voter-page">
        <div className="error-container">
          <div className="error-icon">😕</div>
          <h2>{error || '页面不存在'}</h2>
          <p>请检查二维码是否正确，或联系活动主办方</p>
        </div>
      </div>
    )
  }

  if (voteSuccess || voted) {
    return (
      <div className="voter-page">
        <div className="success-container">
          <div className="success-icon animate-pulse">✓</div>
          <h2>投票成功！</h2>
          {votedOption && (
            <p className="voted-option">您选择了：<span>{votedOption}</span></p>
          )}
          <p className="success-desc">感谢您的参与，投票结果将在大屏实时显示</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voter-page">
      <div className="voter-container">
        <div className="voter-header">
          <h1 className="event-title">{room.name}</h1>
          <p className="event-desc">
            {room.type === 'pk' ? '选择您支持的一方' : '选择您喜欢的选项'}
          </p>
          {!room.is_active && (
            <div className="inactive-warning">
              ⚠️ 投票活动已结束
            </div>
          )}
        </div>

        <div className="options-grid">
          {room.options.map(option => (
            <button
              key={option.id}
              className={`option-card ${selectedOption === option.id ? 'selected' : ''}`}
              onClick={() => room.is_active && setSelectedOption(option.id)}
              disabled={!room.is_active}
            >
              {option.image && (
                <div className="option-image">
                  <img src={option.image} alt={option.name} />
                </div>
              )}
              <div className="option-content">
                <span className="option-name">{option.name}</span>
              </div>
              {selectedOption === option.id && (
                <div className="option-check">✓</div>
              )}
            </button>
          ))}
        </div>

        <div className="vote-action">
          <button
            className={`vote-btn ${selectedOption ? 'active' : ''}`}
            onClick={handleVote}
            disabled={!selectedOption || voting}
          >
            {voting ? '提交中...' : '确认投票'}
          </button>
          {!selectedOption && (
            <p className="vote-hint">请先选择一个选项</p>
          )}
        </div>

        <div className="voter-footer">
          <p>每人限投一票，投票后不可更改</p>
        </div>
      </div>
    </div>
  )
}

export default VoterPage
