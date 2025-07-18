import React from 'react';
import { Link } from 'react-router-dom';
import { HiCog } from 'react-icons/hi';
import { ROUTES } from '../../constants';

const Brand: React.FC = () => {
  return (
    <Link to={ROUTES.DASHBOARD} className="flex items-center gap-3 px-3">
      <div className="p-2 bg-dark-green rounded-lg">
        <HiCog className="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-white">GearTrack</h1>
        <p className="text-xs text-surface-grey-dark">Equipment Management</p>
      </div>
    </Link>
  );
};

export default Brand;