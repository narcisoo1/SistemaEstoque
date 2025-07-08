import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import MaterialsList from './components/Materials/MaterialsList';
import RequestsList from './components/Requests/RequestsList';
import RequestsDetails from './components/Requests/RequestsDetails';
import NewRequest from './components/Requests/NewRequest';
import StockEntriesList from './components/StockEntries/StockEntriesList';
import SuppliersList from './components/Suppliers/SuppliersList';
import UsersList from './components/Users/UsersList';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard\" replace />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="materials" element={
                <ProtectedRoute roles={['despachante', 'administrador']}>
                  <MaterialsList />
                </ProtectedRoute>
              } />
              <Route path="requests" element={<RequestsList />} />
              <Route path="requests/new" element={<NewRequest />} />
              <Route path="requests/:id" element={<RequestsDetails />} />
              <Route path="stock-entries" element={
                <ProtectedRoute roles={['despachante', 'administrador']}>
                  <StockEntriesList />
                </ProtectedRoute>
              } />
              <Route path="suppliers" element={
                <ProtectedRoute roles={['despachante', 'administrador']}>
                  <SuppliersList />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute roles={['administrador']}>
                  <UsersList />
                </ProtectedRoute>
              } />
              <Route path="reports" element={<div className="p-6 text-center text-gray-500">Relatórios em desenvolvimento</div>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;