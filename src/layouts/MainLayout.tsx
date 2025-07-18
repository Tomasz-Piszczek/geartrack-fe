import React from 'react';
import MainSidebar from '../components/navigation/Sidebar';
import MainNavbar from '../components/navigation/Navbar';

interface MainLayoutProps {
  children: React.ReactNode;
  width?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, width }) => {
  const contentWidth = width || 'max-w-[1600px]';

  return (
    <div className="flex min-h-screen items-stretch bg-background-black">
      <MainSidebar />
      <div className="relative flex size-full min-h-screen flex-col overflow-y-auto max-h-[100vh]">
        <MainNavbar />
        <MainContent width={contentWidth}>{children}</MainContent>
      </div>
    </div>
  );
};

const MainContent: React.FC<MainLayoutProps> = ({ children, width }) => {
  const contentWidth = width || 'max-w-[1600px]';

  return (
    <main
      className="relative flex size-full grow flex-col overflow-y-auto"
      id="main-content"
    >
      <div className={`mx-auto px-8 mb-4 flex grow flex-col w-full ${contentWidth}`}>
        {children}
      </div>
    </main>
  );
};

export default MainLayout;