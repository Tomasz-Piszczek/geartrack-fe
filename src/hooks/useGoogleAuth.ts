import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, ROUTES } from '../constants';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const useGoogleAuth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useCallback(async (credential: string) => {
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
        navigate(ROUTES.QUOTES, { replace: true });
      } else {
        throw new Error('Invalid response data');
      }
    } else {
      throw new Error('Google login failed');
    }
  }, [login, navigate]);

  const initializeGoogleSignIn = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: '445794691525-hs55893o7q75k1ci3h6k27mkm2vciksb.apps.googleusercontent.com',
        callback: (response: { credential: string }) => {
          handleGoogleLogin(response.credential).catch(() => {});
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
      const element = document.getElementById(containerId);
      if (element) {
        window.google.accounts.id.renderButton(
          element,
        {
          theme: 'filled_blue',
          size: 'large',
        });
      }
    }
  }, []);

  return {
    initializeGoogleSignIn,
    signInWithGoogle,
    renderGoogleButton,
    handleGoogleLogin,
  };
};