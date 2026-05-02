import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { roomApi } from '../services/api'
import './CreateRoom.css'

function CreateRoom() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    type: 'vote',
    options: [
      { id: 1, name: '', image: '' },
      { id: 2, name: '', image: '' }
    ]
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now(), name: '', image: '' }]
    }))
  }

  const removeOption = (index) => {
    if (formData.options.length <= 2) return
    const newOptions = formData.options.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const handleImageUpload = (index, event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        handleOptionChange(index, 'image', e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('请输入活动名称')
      return
    }

    const validOptions = formData.options.filter(o => o.name.trim())
    if (validOptions.length < 2) {
      setError('至少需要2个选项')
      return
    }

    setSubmitting(true)

    try {
      const data = {
        name: formData.name.trim(),
        type: formData.type,
        options: validOptions.map(o => ({
          name: o.name.trim(),
          image: o.image || null
        }))
      }

      const result = await roomApi.create(data)
      navigate(`/admin/room/${result.id}`)
    } catch (err) {
      setError('创建失败，请重试')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-room">
      <div className="header">
        <div className="header-content">
          <Link to="/admin" className="logo">YourVote</Link>
          <h1>创建投票活动</h1>
          <Link to="/admin" className="btn btn-secondary">返回列表</Link>
        </div>
      </div>

      <div className="container">
        <div className="create-form">
          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2 className="card-title">基本信息</h2>
              
              <div className="input-group">
                <label>活动名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="例如：最佳员工评选 / 红蓝对决"
                  maxLength={100}
                />
              </div>

              <div className="input-group">
                <label>活动类型</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'vote' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'vote')}
                  >
                    <span className="type-icon">📊</span>
                    <span className="type-name">普通投票</span>
                    <span className="type-desc">多个选项，单选投票</span>
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${formData.type === 'pk' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'pk')}
                  >
                    <span className="type-icon">⚔️</span>
                    <span className="type-name">PK对决</span>
                    <span className="type-desc">双方对抗，直观对比</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <h2 className="card-title">投票选项</h2>
                <button
                  type="button"
                  className="btn btn-secondary add-option-btn"
                  onClick={addOption}
                >
                  + 添加选项
                </button>
              </div>

              <div className="options-list">
                {formData.options.map((option, index) => (
                  <div key={option.id} className="option-item animate-fadeIn">
                    <div className="option-header">
                      <span className="option-number">选项 {index + 1}</span>
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          className="remove-option-btn"
                          onClick={() => removeOption(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    
                    <div className="option-content">
                      <div className="option-image">
                        {option.image ? (
                          <div className="option-image-preview">
                            <img src={option.image} alt="选项图片" />
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={() => handleOptionChange(index, 'image', '')}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="option-image-upload">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageUpload(index, e)}
                            />
                            <span className="upload-icon">📷</span>
                            <span className="upload-text">添加图片</span>
                          </label>
                        )}
                      </div>
                      
                      <div className="option-inputs">
                        <input
                          type="text"
                          value={option.name}
                          onChange={e => handleOptionChange(index, 'name', e.target.value)}
                          placeholder="选项名称"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="submit-section">
              <Link to="/admin" className="btn btn-secondary btn-lg">
                取消
              </Link>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
              >
                {submitting ? '创建中...' : '创建活动'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom
