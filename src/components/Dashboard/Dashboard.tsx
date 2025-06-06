import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface DashboardStats {
  totalMaterials: number;
  pendingRequests: number;
  lowStockItems: number;
  totalUsers: number;
  recentEntries: number;
  monthlyRequests: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMaterials: 0,
    pendingRequests: 0,
    lowStockItems: 0,
    totalUsers: 0,
    recentEntries: 0,
    monthlyRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Materiais',
      value: stats.totalMaterials,
      icon: Package,
      color: 'bg-blue-500',
      show: ['despachante', 'administrador'].includes(user?.role || ''),
    },
    {
      title: 'Solicitações Pendentes',
      value: stats.pendingRequests,
      icon: ShoppingCart,
      color: 'bg-yellow-500',
      show: true,
    },
    {
      title: 'Itens com Estoque Baixo',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      show: ['despachante', 'administrador'].includes(user?.role || ''),
    },
    {
      title: 'Usuários Ativos',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-green-500',
      show: user?.role === 'administrador',
    },
    {
      title: 'Entradas Recentes',
      value: stats.recentEntries,
      icon: TrendingUp,
      color: 'bg-purple-500',
      show: ['despachante', 'administrador'].includes(user?.role || ''),
    },
    {
      title: 'Pedidos este Mês',
      value: stats.monthlyRequests,
      icon: Building2,
      color: 'bg-indigo-500',
      show: true,
    },
  ];

  const visibleCards = cards.filter(card => card.show);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo ao sistema de gerenciamento de estoque
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {user?.role === 'solicitante' && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Faça sua Solicitação</h2>
          <p className="text-blue-100 mb-4">
            Solicite os materiais necessários para sua escola de forma rápida e fácil.
          </p>
          <button
            onClick={() => window.location.href = '/requests/new'}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Nova Solicitação
          </button>
        </div>
      )}

      {['despachante', 'administrador'].includes(user?.role || '') && stats.lowStockItems > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Atenção: Estoque Baixo</h2>
              <p className="text-red-100 mt-1">
                {stats.lowStockItems} itens estão com estoque abaixo do mínimo recomendado.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/materials'}
            className="bg-white text-red-600 px-6 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors mt-4"
          >
            Ver Materiais
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;