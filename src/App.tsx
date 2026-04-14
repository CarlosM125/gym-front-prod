import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MasterLayout from './components/layout/MasterLayout';
import LoginScreen from './pages/LoginScreen';
import DashboardScreen from './pages/DashboardScreen';
import { useAuthStore } from './store/authStore';
import './App.css';

import ClientRegistryScreen from './pages/ClientRegistryScreen';
import ClientListScreen from './pages/ClientListScreen';
import MembershipPOSScreen from './pages/MembershipPOSScreen';
import AnalyticsScreen from './pages/AnalyticsScreen';
import AdminSettingsScreen from './pages/AdminSettingsScreen';

const PrivateRoute = ({ children, roles }: { children: JSX.Element, roles?: string[] }) => {
    const { user, checkAuth } = useAuthStore();
    useEffect(() => { checkAuth(); }, [checkAuth]);

    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    
    return children;
};

function App() {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginScreen />} />
            
            <Route path="/" element={
                <PrivateRoute>
                    <MasterLayout />
                </PrivateRoute>
            }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardScreen />} />
                <Route path="clients/new" element={<ClientRegistryScreen />} />
                <Route path="clients" element={<ClientListScreen />} />
                <Route path="pos" element={<MembershipPOSScreen />} />
                <Route path="analytics" element={
                    <PrivateRoute roles={['ADMIN_TI', 'ADMIN_GYM']}>
                        <AnalyticsScreen />
                    </PrivateRoute>
                } />
                <Route path="admin" element={
                    <PrivateRoute roles={['ADMIN_TI', 'ADMIN_GYM']}>
                        <AdminSettingsScreen />
                    </PrivateRoute>
                } />
            </Route>
        </Routes>
    </BrowserRouter>
  );
}

export default App;
