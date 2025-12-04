import React, { useEffect } from 'react';
import { HiCog } from 'react-icons/hi';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const LoginPage: React.FC = () => {
  const { initializeGoogleSignIn, renderGoogleButton } = useGoogleAuth();

  useEffect(() => {
    const initGoogle = () => {
      initializeGoogleSignIn();
      setTimeout(() => {
        renderGoogleButton('google-signin-button');
      }, 100);
    };

    if (window.google) {
      initGoogle();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initGoogle();
        }
      }, 100);
    }
  }, [initializeGoogleSignIn, renderGoogleButton]);

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

        <div className="w-full pt-6">
          <h3 className="sub-heading text-center px-1 font-sans font-semibold">
            Zaloguj się za pomocą Google
          </h3>
          <p className="font-base leading-[22.5px] text-sm sm:text-lg text-center mt-3 mb-12 text-gray-400 max-w-[500px] mx-auto">
            Uzyskaj dostęp do systemu GearTrack za pomocą konta Google.
          </p>

          <div className="mx-auto flex flex-col items-center justify-center gap-4 mb-5">
            <div className="w-full max-w-[450px] flex justify-center">
              <div id="google-signin-button" className="w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;