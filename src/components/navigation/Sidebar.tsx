import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiCog, 
  HiUsers, 
  HiDesktopComputer,
  HiDocumentText,
  HiAdjustments,
  HiCurrencyDollar
} from 'react-icons/hi';
import { ROUTES } from '../../constants';
import Brand from './Brand';
import { useAuth } from '../../context/AuthContext';

const MainSidebar: React.FC = () => {
  const location = useLocation();
  const { isUserOrSuperUser, user, isAdmin } = useAuth();
  const active = 'border-r-[4px] border-r-main bg-gradient-hover';

  const allNavigationItems = [
    {
      path: ROUTES.TOOLS,
      label: 'Narzędzia',
      icon: HiCog,
    },
    {
      path: ROUTES.MACHINES,
      label: 'Maszyny',
      icon: HiDesktopComputer,
    },
    {
      path: ROUTES.EMPLOYEES,
      label: 'Pracownicy',
      icon: HiUsers,
    },
    {
      path: ROUTES.PAYROLL,
      label: 'Wypłaty',
      icon: HiCurrencyDollar,
    },
    {
      path: ROUTES.QUOTES,
      label: 'Wyceny',
      icon: HiDocumentText,
    },
    {
      path: ROUTES.SETTINGS,
      label: 'Ustawienia',
      icon: HiAdjustments,
    },
  ];

  // Filter navigation items based on user role
  // USER and SUPER_USER can only see Wyceny (Quotes) section
  const navigationItems = isUserOrSuperUser() 
    ? allNavigationItems.filter(item => item.path === ROUTES.QUOTES)
    : allNavigationItems;

  const sidebarItemStyle = `
    .custom-sidebar-item:hover img {
      filter: brightness(125%);
    }
    .custom-sidebar-item:hover .icon {
      color: #FFFFFF;
    }
  `;

  return (
    <>
      <style>{sidebarItemStyle}</style>
      <div className="w-52 hide-scrollbar flex h-full flex-col justify-between pt-2 pr-2 overflow-y-auto bg-background-sidebar">
        <div>
          <div className="mb-8 mt-4">
            <Brand />
          </div>
          
          <div className="mt-8 pb-2 text-xs text-surface-grey-dark">OGÓLNE</div>
          
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${
                  item.path === location.pathname ? active : ''
                } custom-sidebar-item flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    marginLeft: '-4px',
                  }}
                >
                  <item.icon 
                    className="w-6 h-6 text-surface-grey-dark icon"
                    style={{
                      color: item.path === location.pathname ? '#FFFFFF' : undefined,
                    }}
                  />
                </div>
                <span className="text-white ml-3">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MainSidebar;