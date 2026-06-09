import React from 'react';
import { GlobalAnalyticsDashboard } from './GlobalAnalyticsDashboard';

export const Dashboard: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto animate-fadeIn">
      <GlobalAnalyticsDashboard />
    </div>
  );
};

export default Dashboard;
