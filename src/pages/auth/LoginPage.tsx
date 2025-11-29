import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { HiCog } from 'react-icons/hi';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { toast } from '../../lib/toast';
import type { LoginDto } from '../../types';
import { ROUTES, VALIDATION } from '../../constants';
import Button from '../../components/common/Button';
import Checkbox from '../../components/common/Checkbox';
import Label from '../../components/common/Label';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { initializeGoogleSignIn, renderGoogleButton } = useGoogleAuth();

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  useEffect(() => {
    // Initialize Google Sign-In when component mounts
    const initGoogle = () => {
      initializeGoogleSignIn();
      // Render Google button after a short delay to ensure DOM is ready
      setTimeout(() => {
        renderGoogleButton('google-signin-button');
      }, 100);
    };

    if (window.google) {
      initGoogle();
    } else {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initGoogle();
        }
      }, 100);
    }
  }, [initializeGoogleSignIn, renderGoogleButton]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginDto) => authApi.login(credentials),
    onSuccess: (response) => {
      login(response.token, response.email, response.userId);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed. Please try again.');
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setIsLoading(true);
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  // Google login is now handled by the useGoogleAuth hook

  return (
    <section className="bg-background-black bg-cover bg-top relative min-h-screen pt-10 px-5">
      <div className="w-full flex justify-center items-center gap-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dark-green rounded-lg">
            <HiCog className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">GearTrack</h1>
            <p className="text-surface-grey-dark">System Zarządzania Sprzętem</p>
          </div>
        </div>
      </div>

      <div className="pt-5 pb-20 max-w-[1440px] px-5 mx-auto rounded-3xl bg-grey-linear relative z-10 flex justify-center items-center flex-col gap-6">
        <div className="relative">
          <div className="inline-block mt-1 text-white border-2 rounded-full border-lighter-border">
            <div className="flex justify-content items-center font-mono uppercase font-semibold text-sm md:text-base text-center">
              <div className="z-10 px-7 pt-3 pb-2 rounded-full border-2 border-main shadow-green-shadow transition-shadow">
                ZALOGUJ SIĘ DO KONTA
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form w-full pt-6">
          <h3 className="sub-heading text-center px-1 font-sans font-semibold">
            Zaloguj się do swojego konta
          </h3>
          <p className="font-base leading-[22.5px] text-sm sm:text-lg text-center mt-3 mb-12 text-gray-400 max-w-[500px] mx-auto">
            Uzyskaj dostęp do konta GearTrack, aby zarządzać sprzętem, śledzić przypisania i przeglądać analizy.
          </p>

          <div className="mb-8 flex flex-col gap-6 items-center justify-center">
            <div className="w-full max-w-[450px] mb-2">
              <input
                {...register('email', {
                  required: VALIDATION.EMAIL.REQUIRED,
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: VALIDATION.EMAIL.INVALID,
                  },
                })}
                placeholder="ADRES E-MAIL"
                type="email"
                className="input-style w-full mx-auto border-none text-white"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-light text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="w-full max-w-[450px]">
              <input
                {...register('password', {
                  required: VALIDATION.PASSWORD.REQUIRED,
                  minLength: {
                    value: 6,
                    message: VALIDATION.PASSWORD.MIN_LENGTH,
                  },
                })}
                placeholder="HASŁO"
                type="password"
                className="input-style w-full mx-auto border-none text-white"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-light text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="mb-8 w-full flex-wrap max-w-[320px] gap-x-4 sm:gap-x-12 gap-y-4 flex items-center justify-center">
              <div className="flex items-center justify-center gap-x-3">
                <Checkbox
                  {...register('rememberMe')}
                  id="rememberMe"
                  className="cursor-pointer"
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-main mb-0 cursor-pointer">
                  Zapamiętaj mnie
                </Label>
              </div>
            </div>

            <div className="mx-auto flex flex-col items-center justify-center gap-4 mb-5">
              <Button
                type="submit"
                color="primary"
                disabled={isLoading}
                loading={isLoading}
                className="w-full max-w-[450px]"
              >
                {isLoading ? 'LOGOWANIE...' : 'ZALOGUJ DO GEARTRACK'}
              </Button>

              <div className="text-surface-grey-dark text-sm">lub</div>

              <div className="w-full max-w-[450px] flex justify-center">
                <div id="google-signin-button" className="w-full"></div>
              </div>

              <div className="text-center mt-6">
                <p className="text-surface-grey-dark text-sm">
                  Nie masz konta?{' '}
                  <Link 
                    to={ROUTES.REGISTER} 
                    className="text-dark-green hover:text-dark-green/80 transition-colors"
                  >
                    Utwórz je tutaj
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;