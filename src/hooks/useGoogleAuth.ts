import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, ROUTES } from '../constants';

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useCallback(async (credential: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credential }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.refreshToken && data.email && data.userId) {
          login(data.token, data.refreshToken, data.email, data.userId);
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          throw new Error('Invalid response data');
        }
      } else {
        throw new Error('Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }, [login, navigate]);

  const initializeGoogleSignIn = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '445794691525-hs55893o7q75k1ci3h6k27mkm2vciksb.apps.googleusercontent.com',
        callback: (response: any) => {
          handleGoogleLogin(response.credential).catch(console.error);
        },
      });
    }
  }, [handleGoogleLogin]);

  const signInWithGoogle = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  }, []);

  const renderGoogleButton = useCallback((containerId: string) => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById(containerId),
        {
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        }
      );
    }
  }, []);

  return {
    initializeGoogleSignIn,
    signInWithGoogle,
    renderGoogleButton,
    handleGoogleLogin,
  };
};