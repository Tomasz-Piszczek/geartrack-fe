import React from 'react';
import { HiLogout } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Avatar from '../common/Avatar';

const MainNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="bg-transparent border-b border-lighter-border">
      <div className="w-full">
        <div className="flex items-center justify-between min-h-8 py-4 px-6">
          <div className="flex flex-row gap-5">
            {/* Left side - can add breadcrumbs or other navigation elements */}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar
                alt="User avatar"
                rounded
                className="w-10 h-10"
              />
              <div className="flex flex-col">
                <span className="text-sm text-white">{user?.email}</span>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <HiLogout className="w-3 h-3" />
                    Wyloguj
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;