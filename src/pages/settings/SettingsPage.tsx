import React from 'react';
import { HiAdjustments, HiCog, HiUser, HiLockClosed } from 'react-icons/hi';
import Card from '../../components/common/Card';

const SettingsPage: React.FC = () => {
  const settingsCategories = [
    {
      title: 'Profile Settings',
      description: 'Manage your account information and preferences',
      icon: HiUser,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      comingSoon: true,
    },
    {
      title: 'System Configuration',
      description: 'Configure system-wide settings and preferences',
      icon: HiCog,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      comingSoon: true,
    },
    {
      title: 'Security Settings',
      description: 'Manage authentication and security options',
      icon: HiLockClosed,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      comingSoon: true,
    },
    {
      title: 'General Settings',
      description: 'Application preferences and general configuration',
      icon: HiAdjustments,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      comingSoon: true,
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-surface-grey-dark">Configure your GearTrack application</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category, index) => (
          <Card key={index} className="card hover:shadow-lg transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${category.bgColor}`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                  {category.comingSoon && (
                    <span className="badge badge-info text-xs">Coming Soon</span>
                  )}
                </div>
                <p className="text-surface-grey-dark text-sm">{category.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="card mt-8">
        <div className="text-center py-8">
          <HiAdjustments className="w-16 h-16 mx-auto mb-4 text-surface-grey-dark opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Settings Coming Soon</h3>
          <p className="text-surface-grey-dark">
            We're working on bringing you comprehensive settings to customize your GearTrack experience.
          </p>
          <p className="text-surface-grey-dark mt-2">
            Check back soon for updates!
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;