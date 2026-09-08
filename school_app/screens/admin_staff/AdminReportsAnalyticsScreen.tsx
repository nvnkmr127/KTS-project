import React from 'react';
import AnalyticsDashboardScreen from '../super_admin/AnalyticsDashboardScreen';

export const AdminReportsAnalyticsScreen: React.FC<any> = ({ navigation }) => {
  return <AnalyticsDashboardScreen role="admin_staff" navigation={navigation} />;
};

export default AdminReportsAnalyticsScreen;
