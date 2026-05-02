import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home-page">
      <div className="hero">
        <h1 className="title animate-fadeIn">YourVote</h1>
        <p className="subtitle animate-fadeIn">实时在线投票系统</p>
      </div>
      
      <div className="features">
        <div className="feature-card animate-fadeIn">
          <div className="feature-icon">🎯</div>
          <h3>快速创建</h3>
          <p>一键创建投票或PK对决，支持图片选项</p>
        </div>
        <div className="feature-card animate-fadeIn">
          <div className="feature-icon">📱</div>
          <h3>扫码投票</h3>
          <p>生成二维码，线下用户扫码即可参与</p>
        </div>
        <div className="feature-card animate-fadeIn">
          <div className="feature-icon">📺</div>
          <h3>大屏展示</h3>
          <p>实时更新票数，炫酷数字滚动动画</p>
        </div>
      </div>
      
      <div className="action-buttons">
        <Link to="/admin" className="btn btn-primary btn-lg">
          进入管理后台
        </Link>
      </div>
    </div>
  )
}

export default Home
