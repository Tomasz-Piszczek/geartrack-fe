import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiCog,
  HiUsers,
  HiDesktopComputer,
  HiDocumentText,
  HiCurrencyDollar,
  HiChartBar
} from 'react-icons/hi';
import { ROUTES } from '../../constants';
import Brand from './Brand';
import { useAuth } from '../../context/AuthContext';
import { useUrlopy } from '../../context/UrlopContext';
import { useBadaniaSzkolenia } from '../../context/BadaniaSzkolenieContext';
import { useMachineInspections } from '../../context/MachineInspectionContext';

const MainSidebar: React.FC = () => {
  const location = useLocation();
  const { isUserOrSuperUser, isAdmin } = useAuth();
  const { pendingCount } = useUrlopy();
  const { expiredCount, expiringSoonCount } = useBadaniaSzkolenia();
  const { overdueCount, dueSoonCount } = useMachineInspections();
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
      path: ROUTES.WORKER_ANALYTICS,
      label: 'Analiza Pracowników',
      icon: HiChartBar,
    },
  ];

  // Filter navigation items based on user role
  // USER and SUPER_USER cannot see Wypłaty (Payroll), Maszyny (Machines), and Analiza Pracowników (Worker Analytics)
  const navigationItems = isUserOrSuperUser()
    ? allNavigationItems.filter(item => item.path !== ROUTES.PAYROLL && item.path !== ROUTES.MACHINES && item.path !== ROUTES.WORKER_ANALYTICS)
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
      <div className="w-60 hide-scrollbar flex h-full flex-col justify-between pt-2 pr-2 overflow-y-auto bg-background-sidebar">
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
                {item.path === ROUTES.EMPLOYEES && (
                  <div className="ml-auto flex gap-1">
                    {isAdmin() && pendingCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-green-500 rounded-full text-white text-xs font-bold">
                        {pendingCount}
                      </span>
                    )}
                    {isAdmin() && expiredCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full text-white text-xs font-bold">
                        {expiredCount}
                      </span>
                    )}
                    {isAdmin() && expiringSoonCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-500 rounded-full text-white text-xs font-bold">
                        {expiringSoonCount}
                      </span>
                    )}
                  </div>
                )}
                {item.path === ROUTES.MACHINES && (
                  <div className="ml-auto flex gap-1">
                    {overdueCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full text-white text-xs font-bold">
                        {overdueCount}
                      </span>
                    )}
                    {dueSoonCount > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-500 rounded-full text-white text-xs font-bold">
                        {dueSoonCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MainSidebar;