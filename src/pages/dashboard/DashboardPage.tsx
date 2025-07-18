import React from 'react';
import { HiCog, HiDesktopComputer, HiUsers, HiCollection } from 'react-icons/hi';
import Card from '../../components/common/Card';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';
import { machinesApi } from '../../api/machines';
import { toolsApi } from '../../api/tools';
import { QUERY_KEYS } from '../../constants';

const DashboardPage: React.FC = () => {
  const { data: employees = [] } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: employeesApi.getAll,
  });

  const { data: machines = [] } = useQuery({
    queryKey: [QUERY_KEYS.MACHINES],
    queryFn: machinesApi.getAll,
  });

  const { data: tools = [] } = useQuery({
    queryKey: [QUERY_KEYS.TOOLS],
    queryFn: toolsApi.getAll,
  });

  const statsCards = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: HiUsers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Machines',
      value: machines.length,
      icon: HiDesktopComputer,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Tools',
      value: tools.length,
      icon: HiCog,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Assigned Items',
      value: machines.filter(m => m.employeeId).length + tools.reduce((acc, tool) => acc + tool.quantity, 0),
      icon: HiCollection,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-surface-grey-dark">Welcome to GearTrack - Equipment Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Card key={index} className="bg-section-grey border-lighter-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-grey-dark">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-section-grey border-lighter-border">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiUsers className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-white text-sm">New employee added</p>
                <p className="text-surface-grey-dark text-xs">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiDesktopComputer className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white text-sm">Machine assigned</p>
                <p className="text-surface-grey-dark text-xs">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-section-grey-light rounded-lg">
              <HiCog className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-white text-sm">Tool inventory updated</p>
                <p className="text-surface-grey-dark text-xs">1 day ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-section-grey border-lighter-border">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors">
              <HiUsers className="w-5 h-5 inline mr-2" />
              Add New Employee
            </button>
            <button className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors">
              <HiDesktopComputer className="w-5 h-5 inline mr-2" />
              Register New Machine
            </button>
            <button className="w-full p-3 bg-dark-green hover:bg-dark-green/80 rounded-lg text-white text-left transition-colors">
              <HiCog className="w-5 h-5 inline mr-2" />
              Add Tool to Inventory
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;