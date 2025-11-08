import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './LoginPage.css'

const HERO_IMAGE = '/Logo Ver01.png'

const INITIAL_LOGIN_FORM = {
  email: '',
  password: '',
  remember: true,
}

const INITIAL_SIGNUP_FORM = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
}

const AUTH_TABS = [
  { key: 'email', label: 'Email' },
  { key: 'google', label: 'Google' },
  { key: 'anonymous', label: 'Guest' },
]

const randomGuestId = () => `guest_${Math.random().toString(36).slice(2, 9)}`

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, guestLogin, loading, error } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const [loginActiveTab, setLoginActiveTab] = useState('email')
  const [signupActiveTab, setSignupActiveTab] = useState('email')
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN_FORM)
  const [signupForm, setSignupForm] = useState(INITIAL_SIGNUP_FORM)
  const [notification, setNotification] = useState(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const notificationTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    }
  }, [])

  const showNotification = (message, type = 'info', context = 'login') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    setNotification({ message, type, context })
    notificationTimerRef.current = setTimeout(() => setNotification(null), 4000)
  }

  const handleLoginChange = field => event => {
    const value = field === 'remember' ? event.target.checked : event.target.value
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSignupChange = field => event => {
    const value = field === 'terms' ? event.target.checked : event.target.value
    setSignupForm(prev => ({ ...prev, [field]: value }))
  }

  const persistGuestId = id => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return
      window.localStorage.setItem('nyacademy_guest_id', id)
    } catch (error) {
      console.warn('Unable to store guest id', error)
    }
  }

  const handleLoginSubmit = async event => {
    event.preventDefault()

    if (isSubmitting) return

    const email = loginForm.email.trim()
    const password = loginForm.password

    if (!email || !password) {
      showNotification('Enter both email and password.', 'error', 'login')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        showNotification('Login successful. Redirecting to your dashboard...', 'success', 'login')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        showNotification(result.error || 'Login failed.', 'error', 'login')
      }
    } catch (error) {
      showNotification(error.message || 'Login failed. Please try again.', 'error', 'login')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignupSubmit = async event => {
    event.preventDefault()

    if (isSubmitting) return

    const username = signupForm.username.trim()
    const email = signupForm.email.trim()
    const password = signupForm.password
    const confirmPassword = signupForm.confirmPassword
    const normalizedUsername = username.replace(/\s+/g, '_').toLowerCase()

    if (!username) {
      showNotification('Choose a username to continue.', 'error', 'signup')
      return
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
      showNotification('Usernames must be 3-30 characters and only use letters, numbers, or underscores.', 'error', 'signup')
      return
    }

    if (!email) {
      showNotification('Enter a valid email address.', 'error', 'signup')
      return
    }

    if (password.length < 8) {
      showNotification('Passwords must be at least 8 characters long.', 'error', 'signup')
      return
    }

    if (password !== confirmPassword) {
      showNotification('Passwords do not match.', 'error', 'signup')
      return
    }

    if (!signupForm.terms) {
      showNotification('Please agree to the terms to continue.', 'error', 'signup')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register(normalizedUsername, email, password)

      if (result.success) {
        showNotification('Account created. Redirecting to your dashboard...', 'success', 'signup')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        showNotification(result.error || 'Sign up failed.', 'error', 'signup')
      }
    } catch (error) {
      showNotification(error.message || 'Sign up failed. Please try again later.', 'error', 'signup')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = event => {
    event.preventDefault()
    showNotification('パスワード再設定リンクをメールで送信しました。', 'info', 'login')
  }

  const handleGoogleAuth = mode => {
    const action = mode === 'login' ? 'ログイン' : 'サインアップ'
    showNotification(`Google で${action}を準備しています…`, 'info', mode)
  }

  const handleAnonymousAuth = mode => {
    const result = guestLogin()
    const action = mode === 'login' ? 'ログイン' : 'サインアップ'
    showNotification(`ゲストとして${action}しました。`, 'success', mode)
    setTimeout(() => {
      navigate('/')
    }, 1000)
  }

  useEffect(() => {
    const password = signupForm.password
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[$@#&!]/.test(password)) strength += 1
    setPasswordStrength(strength)
  }, [signupForm.password])

  const getPasswordStrengthClass = () => {
    if (!signupForm.password) return ''
    if (passwordStrength <= 2) return 'strength-weak'
    if (passwordStrength <= 4) return 'strength-medium'
    return 'strength-strong'
  }

  const renderLoginContent = () => {
    if (loginActiveTab === 'google') {
      return (
        <div className="method-card">
          <h3 className="method-title">Google でログイン</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-primary" onClick={() => handleGoogleAuth('login')}>
              Google で続行
            </button>
          </div>
        </div>
      )
    }

    if (loginActiveTab === 'anonymous') {
      return (
        <div className="method-card">
          <h3 className="method-title">ゲストでログイン</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleAnonymousAuth('login')}>
              ゲストとして入る
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleLoginSubmit} className="method-card stack-gap">
        <h3 className="method-title">メールでログイン</h3>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            メールアドレス
          </label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={loginForm.email}
            onChange={handleLoginChange('email')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            パスワード
          </label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={loginForm.password}
            onChange={handleLoginChange('password')}
            required
          />
        </div>
        <div className="helper-row">
          <label className="remember-checkbox">
            <input type="checkbox" checked={loginForm.remember} onChange={handleLoginChange('remember')} />
            <span>ログイン情報を保持</span>
          </label>
          <a href="#" onClick={handleForgotPassword}>
            パスワードをお忘れですか？
          </a>
        </div>
        <div className="method-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>
      </form>
    )
  }

  const renderSignupContent = () => {
    if (signupActiveTab === 'google') {
      return (
        <div className="method-card">
          <h3 className="method-title">Google でサインアップ</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-primary" onClick={() => handleGoogleAuth('signup')}>
              Google で登録
            </button>
          </div>
        </div>
      )
    }

    if (signupActiveTab === 'anonymous') {
      return (
        <div className="method-card">
          <h3 className="method-title">ゲストではじめる</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleAnonymousAuth('signup')}>
              ゲストモードで試す
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSignupSubmit} className="method-card stack-gap">
        <h3 className="method-title">メールでサインアップ</h3>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-username">
            Username
          </label>
          <input
            id="signup-username"
            type="text"
            className="form-input"
            placeholder="Use letters, numbers, or underscores"
            value={signupForm.username}
            onChange={handleSignupChange('username')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            メールアドレス
          </label>
          <input
            id="signup-email"
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={signupForm.email}
            onChange={handleSignupChange('email')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">
            パスワード
          </label>
          <input
            id="signup-password"
            type="password"
            className="form-input"
            placeholder="8文字以上で入力"
            value={signupForm.password}
            onChange={handleSignupChange('password')}
            required
          />
          <div className="password-strength">
            <div className={`password-strength-bar ${getPasswordStrengthClass()}`} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-confirm">
            パスワードを確認
          </label>
          <input
            id="signup-confirm"
            type="password"
            className="form-input"
            placeholder="Re-enter your password"
            value={signupForm.confirmPassword}
            onChange={handleSignupChange('confirmPassword')}
            required
          />
        </div>
        <label className="terms">
          <input type="checkbox" checked={signupForm.terms} onChange={handleSignupChange('terms')} />
          <span>
            <a href="#">利用規約</a> と <a href="#">プライバシーポリシー</a> に同意します。
          </span>
        </label>
        <div className="method-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || loading}>
            {isSubmitting || loading ? 'サインアップ中...' : 'サインアップ'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="login-page">
      <div className="poster-container">
        <section className="left-section">
          <div className="left-content">
            <div className="logo">
              <img src={HERO_IMAGE} alt="Nyacademy Logo" className="logo-icon" />
              <div>
                <p className="logo-badge">Nyacademy</p>
                <p className="logo-subtitle">Study Multiply, Go Beyond.</p>
              </div>
            </div>
            <p className="tagline">
              あなたの努力をそっと見守る、猫と学ぶ AI 学習コミュニティで集中セッションを記録しましょう。
            </p>
          </div>
        </section>

        <section className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">{authMode === 'login' ? 'ログイン' : 'サインアップ'}</h2>
              <p className="form-subtitle">
                {authMode === 'login'
                  ? '保存された学習プランやチャットへすぐに戻れます。'
                  : 'タスク、友達、ツールを同期して学習を加速しましょう。'}
              </p>
            </div>

            <div className="access-block">
              <div className="auth-tabs">
                {AUTH_TABS.map(tab => {
                  const isActive = authMode === 'login' ? loginActiveTab === tab.key : signupActiveTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={isActive ? 'auth-tab active' : 'auth-tab'}
                      onClick={() =>
                        authMode === 'login' ? setLoginActiveTab(tab.key) : setSignupActiveTab(tab.key)
                      }
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {notification?.context === authMode && (
                <div className={`notification ${notification.type}`}>{notification.message}</div>
              )}
              {error && !notification && (
                <div className="notification error">{error}</div>
              )}

              <div className="tab-panel">
                {authMode === 'login' ? renderLoginContent() : renderSignupContent()}
              </div>
            </div>

            <div className="auth-toggle">
              {authMode === 'login' ? (
                <>
                  Nyacademy を初めて利用しますか？{' '}
                  <button type="button" className="link-button" onClick={() => setAuthMode('signup')}>
                    今すぐ登録
                  </button>
                </>
              ) : (
                <>
                  すでにアカウントをお持ちですか？{' '}
                  <button type="button" className="link-button" onClick={() => setAuthMode('login')}>
                    ログイン
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
