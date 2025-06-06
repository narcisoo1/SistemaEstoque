import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import MaterialsList from './components/Materials/MaterialsList';
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
              <Route path="materials" element={<MaterialsList />} />
              <Route path="requests" element={<div>Solicitações em desenvolvimento</div>} />
              <Route path="stock-entries" element={<div>Entrada de Estoque em desenvolvimento</div>} />
              <Route path="reports" element={<div>Relatórios em desenvolvimento</div>} />
              <Route path="suppliers" element={<div>Fornecedores em desenvolvimento</div>} />
              <Route path="users" element={<div>Usuários em desenvolvimento</div>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;