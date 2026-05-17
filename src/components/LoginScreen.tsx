import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="notebook-grid" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--paper)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 4,
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: 320,
      }}>
        <h1 className="heading-serif" style={{ fontSize: 32, margin: 0 }}>Zenith</h1>
        <p style={{
          fontFamily: 'var(--font-serif)',
          color: 'var(--ink-faint)',
          fontSize: 14,
          margin: '0 0 32px',
        }}>
          Your day at its peak.
        </p>

        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.18)',
            borderRadius: 3,
            padding: '10px 20px',
            fontSize: 14,
            fontFamily: 'var(--font-sans, sans-serif)',
            color: 'var(--ink)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <GoogleIcon />
          {loading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && (
          <p style={{
            color: 'var(--priority-1)',
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            marginTop: 8,
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
