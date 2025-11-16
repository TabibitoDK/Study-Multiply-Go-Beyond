import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

const AUTH_TABS = ['email', 'anonymous']

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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

  const handleLoginSubmit = async event => {
    event.preventDefault()

    if (isSubmitting) return

    const email = loginForm.email.trim()
    const password = loginForm.password

    if (!email || !password) {
      showNotification(t('loginPage.notifications.missingCredentials'), 'error', 'login')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        showNotification(t('loginPage.notifications.loginSuccess'), 'success', 'login')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        showNotification(result.error || t('loginPage.notifications.loginFailed'), 'error', 'login')
      }
    } catch (error) {
      showNotification(error.message || t('loginPage.notifications.loginFailedRetry'), 'error', 'login')
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
      showNotification(t('loginPage.notifications.usernameRequired'), 'error', 'signup')
      return
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
      showNotification(t('loginPage.notifications.usernameFormat'), 'error', 'signup')
      return
    }

    if (!email) {
      showNotification(t('loginPage.notifications.emailRequired'), 'error', 'signup')
      return
    }

    if (password.length < 8) {
      showNotification(t('loginPage.notifications.passwordLength'), 'error', 'signup')
      return
    }

    if (password !== confirmPassword) {
      showNotification(t('loginPage.notifications.passwordMismatch'), 'error', 'signup')
      return
    }

    if (!signupForm.terms) {
      showNotification(t('loginPage.notifications.termsRequired'), 'error', 'signup')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register(normalizedUsername, email, password)

      if (result.success) {
        showNotification(t('loginPage.notifications.signupSuccess'), 'success', 'signup')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        showNotification(result.error || t('loginPage.notifications.signupFailed'), 'error', 'signup')
      }
    } catch (error) {
      showNotification(error.message || t('loginPage.notifications.signupFailedRetry'), 'error', 'signup')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = event => {
    event.preventDefault()
    showNotification(t('loginPage.notifications.passwordReset'), 'info', 'login')
  }

  const handleAnonymousAuth = async mode => {
    if (isSubmitting) return

    setIsSubmitting(true)
    const action = mode === 'login' ? 'login' : 'signup'

    try {
      const result = await guestLogin()

      if (result?.success) {
        showNotification(
          action === 'login'
            ? t('loginPage.notifications.guestLoginSuccess')
            : t('loginPage.notifications.guestSignupSuccess'),
          'success',
          mode,
        )
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        showNotification(result?.error || t('loginPage.notifications.guestFailure'), 'error', mode)
      }
    } catch (error) {
      showNotification(t('loginPage.notifications.guestUnavailable'), 'error', mode)
    } finally {
      setIsSubmitting(false)
    }
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
    if (loginActiveTab === 'anonymous') {
      return (
        <div className="method-card">
          <h3 className="method-title">{t('loginPage.forms.guestLogin.title')}</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleAnonymousAuth('login')}>
              {t('loginPage.forms.guestLogin.cta')}
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleLoginSubmit} className="method-card stack-gap">
        <h3 className="method-title">{t('loginPage.forms.login.title')}</h3>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            {t('loginPage.forms.login.emailLabel')}
          </label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder={t('loginPage.forms.login.emailPlaceholder')}
            value={loginForm.email}
            onChange={handleLoginChange('email')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            {t('loginPage.forms.login.passwordLabel')}
          </label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder={t('loginPage.forms.login.passwordPlaceholder')}
            value={loginForm.password}
            onChange={handleLoginChange('password')}
            required
          />
        </div>
        <div className="helper-row">
          <label className="remember-checkbox">
            <input type="checkbox" checked={loginForm.remember} onChange={handleLoginChange('remember')} />
            <span>{t('loginPage.forms.login.remember')}</span>
          </label>
          <a href="#" onClick={handleForgotPassword}>
            {t('loginPage.forms.login.forgot')}
          </a>
        </div>
        <div className="method-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || loading}>
            {isSubmitting || loading
              ? t('loginPage.forms.login.submitting')
              : t('loginPage.forms.login.submit')}
          </button>
        </div>
      </form>
    )
  }

  const renderSignupContent = () => {
    if (signupActiveTab === 'anonymous') {
      return (
        <div className="method-card">
          <h3 className="method-title">{t('loginPage.forms.guestSignup.title')}</h3>
          <div className="method-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleAnonymousAuth('signup')}>
              {t('loginPage.forms.guestSignup.cta')}
            </button>
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSignupSubmit} className="method-card stack-gap">
        <h3 className="method-title">{t('loginPage.forms.signup.title')}</h3>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-username">
            {t('loginPage.forms.signup.usernameLabel')}
          </label>
          <input
            id="signup-username"
            type="text"
            className="form-input"
            placeholder={t('loginPage.forms.signup.usernamePlaceholder')}
            value={signupForm.username}
            onChange={handleSignupChange('username')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            {t('loginPage.forms.signup.emailLabel')}
          </label>
          <input
            id="signup-email"
            type="email"
            className="form-input"
            placeholder={t('loginPage.forms.signup.emailPlaceholder')}
            value={signupForm.email}
            onChange={handleSignupChange('email')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">
            {t('loginPage.forms.signup.passwordLabel')}
          </label>
          <input
            id="signup-password"
            type="password"
            className="form-input"
            placeholder={t('loginPage.forms.signup.passwordPlaceholder')}
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
            {t('loginPage.forms.signup.confirmLabel')}
          </label>
          <input
            id="signup-confirm"
            type="password"
            className="form-input"
            placeholder={t('loginPage.forms.signup.confirmPlaceholder')}
            value={signupForm.confirmPassword}
            onChange={handleSignupChange('confirmPassword')}
            required
          />
        </div>
        <label className="terms">
          <input type="checkbox" checked={signupForm.terms} onChange={handleSignupChange('terms')} />
          <span>
            {t('loginPage.forms.signup.termsPrefix')}
            <a href="#">{t('loginPage.forms.signup.termsTos')}</a>
            {t('loginPage.forms.signup.termsConnector')}
            <a href="#">{t('loginPage.forms.signup.termsPrivacy')}</a>
            {t('loginPage.forms.signup.termsSuffix')}
          </span>
        </label>
        <div className="method-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || loading}>
            {isSubmitting || loading
              ? t('loginPage.forms.signup.submitting')
              : t('loginPage.forms.signup.submit')}
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
              <img src={HERO_IMAGE} alt={t('navbar.logoAlt')} className="logo-icon" />
              <div>
                <p className="logo-badge">{t('brand.title')}</p>
                <p className="logo-subtitle">{t('brand.tagline')}</p>
              </div>
            </div>
            <p className="tagline">
              {t('loginPage.hero.copy')}
            </p>
          </div>
        </section>

        <section className="right-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">
                {authMode === 'login' ? t('loginPage.headings.login') : t('loginPage.headings.signup')}
              </h2>
              <p className="form-subtitle">
                {authMode === 'login'
                  ? t('loginPage.subtitles.login')
                  : t('loginPage.subtitles.signup')}
              </p>
            </div>

            <div className="access-block">
              <div className="auth-tabs">
                {AUTH_TABS.map(tabKey => {
                  const isActive = authMode === 'login' ? loginActiveTab === tabKey : signupActiveTab === tabKey
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      className={isActive ? 'auth-tab active' : 'auth-tab'}
                      onClick={() =>
                        authMode === 'login' ? setLoginActiveTab(tabKey) : setSignupActiveTab(tabKey)
                      }
                    >
                      {t(`loginPage.tabs.${tabKey}`)}
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
                  {t('loginPage.toggle.newHere')}{' '}
                  <button type="button" className="link-button" onClick={() => setAuthMode('signup')}>
                    {t('loginPage.toggle.createAccount')}
                  </button>
                </>
              ) : (
                <>
                  {t('loginPage.toggle.haveAccount')}{' '}
                  <button type="button" className="link-button" onClick={() => setAuthMode('login')}>
                    {t('loginPage.toggle.login')}
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


