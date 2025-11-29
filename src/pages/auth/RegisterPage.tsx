import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { HiCog } from 'react-icons/hi';
import { FaGoogle } from 'react-icons/fa';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';
import type { RegisterDto } from '../../types';
import { ROUTES, VALIDATION } from '../../constants';
import Button from '../../components/common/Button';
import Checkbox from '../../components/common/Checkbox';
import Label from '../../components/common/Label';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterDto) => authApi.register(credentials),
    onSuccess: (response) => {
      login(response.token, response.email, response.userId);
      toast.success('Registration successful! Welcome to GearTrack!');
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed. Please try again.');
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setIsLoading(true);
    registerMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleGoogleRegister = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`;
  };

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
                UTWÓRZ KONTO
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form w-full pt-6">
          <h3 className="sub-heading text-center px-1 font-sans font-semibold">
            Utwórz swoje konto GearTrack
          </h3>
          <p className="font-base leading-[22.5px] text-sm sm:text-lg text-center mt-3 mb-12 text-gray-400 max-w-[500px] mx-auto">
            Dołącz do GearTrack, aby zarządzać sprzętem, śledzić przypisania i efektywnie analizować operacje.
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

            <div className="w-full max-w-[450px] mb-2">
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

            <div className="w-full max-w-[450px]">
              <input
                {...register('confirmPassword', {
                  required: 'Potwierdź swoje hasło',
                  validate: (value) =>
                    value === password || 'Hasła nie są identyczne',
                })}
                placeholder="POTWIERDŹ HASŁO"
                type="password"
                className="input-style w-full mx-auto border-none text-white"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-red-light text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="mb-8 w-full flex-wrap max-w-[450px] gap-x-4 sm:gap-x-12 gap-y-4 flex items-center justify-center">
              <div className="flex items-center justify-center gap-x-3">
                <Checkbox
                  {...register('agreeToTerms', {
                    required: 'Musisz zaakceptować warunki korzystania',
                  })}
                  id="agreeToTerms"
                  className="cursor-pointer"
                  disabled={isLoading}
                />
                <Label htmlFor="agreeToTerms" className="text-main mb-0 cursor-pointer text-sm">
                  Akceptuję Warunki korzystania
                </Label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-red-light text-sm w-full text-center">{errors.agreeToTerms.message}</p>
              )}
            </div>

            <div className="mx-auto flex flex-col items-center justify-center gap-4 mb-5">
              <Button
                type="submit"
                color="primary"
                disabled={isLoading}
                loading={isLoading}
                className="w-full max-w-[450px]"
              >
                {isLoading ? 'TWORZENIE KONTA...' : 'UTWÓRZ KONTO'}
              </Button>

              <div className="text-surface-grey-dark text-sm">lub</div>

              <Button
                type="button"
                color="gray"
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full max-w-[450px] bg-white text-gray-900 hover:bg-gray-100"
              >
                <FaGoogle className="w-4 h-4 mr-2" />
                Zarejestruj się przez Google
              </Button>

              <div className="text-center mt-6">
                <p className="text-surface-grey-dark text-sm">
                  Masz już konto?{' '}
                  <Link 
                    to={ROUTES.LOGIN} 
                    className="text-dark-green hover:text-dark-green/80 transition-colors"
                  >
                    Zaloguj się tutaj
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

export default RegisterPage;