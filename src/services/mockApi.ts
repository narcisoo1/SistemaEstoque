import { 
  mockUsers, 
  mockMaterials, 
  mockSuppliers, 
  mockRequests, 
  mockStockEntries,
  currentUser,
  setCurrentUser,
  getLowStockMaterials,
  getRecentEntries,
  getRequestsByUser
} from '../data/mockData';
import { User, Material, Supplier, Request, StockEntry } from '../types';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ token: string; user: User } | null> => {
    await delay();
    
    // Simple mock authentication - in real app, check password hash
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password') {
      setCurrentUser(user);
      return {
        token: 'mock-jwt-token-' + user.id,
        user
      };
    }
    
    return null;
  },

  me: async (): Promise<User | null> => {
    await delay(200);
    return currentUser;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    // In real app, invalidate token
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    await delay();
    
    const totalMaterials = mockMaterials.length;
    const lowStockItems = getLowStockMaterials().length;
    const recentEntries = getRecentEntries().length;
    
    let pendingRequests = 0;
    let monthlyRequests = 0;
    
    if (currentUser.role === 'solicitante') {
      const userRequests = getRequestsByUser(currentUser.id);
      pendingRequests = userRequests.filter(r => r.status === 'pendente').length;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      monthlyRequests = userRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      }).length;
    } else {
      pendingRequests = mockRequests.filter(r => r.status === 'pendente').length;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      monthlyRequests = mockRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      }).length;
    }
    
    return {
      totalMaterials: currentUser.role === 'solicitante' ? 0 : totalMaterials,
      pendingRequests,
      lowStockItems: currentUser.role === 'solicitante' ? 0 : lowStockItems,
      totalUsers: currentUser.role === 'administrador' ? mockUsers.length : 0,
      recentEntries: currentUser.role === 'solicitante' ? 0 : recentEntries,
      monthlyRequests
    };
  }
};

// Materials API
export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    await delay();
    return [...mockMaterials];
  },

  getById: async (id: number): Promise<Material | null> => {
    await delay();
    return mockMaterials.find(m => m.id === id) || null;
  },

  create: async (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>): Promise<Material> => {
    await delay();
    
    const newMaterial: Material = {
      ...data,
      id: Math.max(...mockMaterials.map(m => m.id)) + 1,
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  update: async (id: number, data: Partial<Material>): Promise<Material | null> => {
    await delay();
    
    const index = mockMaterials.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    mockMaterials[index] = {
      ...mockMaterials[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return mockMaterials[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    
    const index = mockMaterials.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    mockMaterials.splice(index, 1);
    return true;
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    await delay();
    return [...mockSuppliers];
  },

  create: async (data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    await delay();
    
    const newSupplier: Supplier = {
      ...data,
      id: Math.max(...mockSuppliers.map(s => s.id)) + 1,
      createdAt: new Date().toISOString()
    };
    
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  update: async (id: number, data: Partial<Supplier>): Promise<Supplier | null> => {
    await delay();
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...data
    };
    
    return mockSuppliers[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    mockSuppliers.splice(index, 1);
    return true;
  }
};

// Requests API
export const requestsApi = {
  getAll: async (): Promise<Request[]> => {
    await delay();
    
    if (currentUser.role === 'solicitante') {
      return mockRequests.filter(r => r.requesterId === currentUser.id);
    }
    
    return [...mockRequests];
  },

  getById: async (id: number): Promise<Request | null> => {
    await delay();
    
    const request = mockRequests.find(r => r.id === id);
    
    if (!request) return null;
    
    // Check permissions
    if (currentUser.role === 'solicitante' && request.requesterId !== currentUser.id) {
      return null;
    }
    
    return request;
  },

  create: async (data: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'requester' | 'approver' | 'dispatcher'>): Promise<Request> => {
    await delay();
    
    const newRequest: Request = {
      ...data,
      id: Math.max(...mockRequests.map(r => r.id)) + 1,
      requesterId: currentUser.id,
      status: 'pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requester: currentUser
    };
    
    mockRequests.push(newRequest);
    return newRequest;
  },

  update: async (id: number, data: Partial<Request>): Promise<Request | null> => {
    await delay();
    
    const index = mockRequests.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    mockRequests[index] = {
      ...mockRequests[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return mockRequests[index];
  },

  approve: async (id: number, approvedItems: { materialId: number; approvedQuantity: number }[]): Promise<Request | null> => {
    await delay();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    // Update request status
    request.status = 'aprovado';
    request.approvedBy = currentUser.id;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.approver = currentUser;
    
    // Update approved quantities in items
    if (request.items) {
      request.items.forEach(item => {
        const approvedItem = approvedItems.find(ai => ai.materialId === item.materialId);
        if (approvedItem) {
          item.approvedQuantity = approvedItem.approvedQuantity;
        }
      });
    }
    
    return request;
  },

  dispatch: async (id: number, dispatchedItems: { materialId: number; dispatchedQuantity: number }[]): Promise<Request | null> => {
    await delay();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    // Update request status
    request.status = 'despachado';
    request.dispatchedBy = currentUser.id;
    request.dispatchedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.dispatcher = currentUser;
    
    // Update dispatched quantities and material stock
    if (request.items) {
      request.items.forEach(item => {
        const dispatchedItem = dispatchedItems.find(di => di.materialId === item.materialId);
        if (dispatchedItem && item.material) {
          item.dispatchedQuantity = dispatchedItem.dispatchedQuantity;
          
          // Update material stock
          const material = mockMaterials.find(m => m.id === item.materialId);
          if (material) {
            material.currentStock -= dispatchedItem.dispatchedQuantity;
            material.updatedAt = new Date().toISOString();
          }
        }
      });
    }
    
    return request;
  },

  reject: async (id: number, reason: string): Promise<Request | null> => {
    await delay();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    request.status = 'rejeitado';
    request.approvedBy = currentUser.id;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.notes = (request.notes || '') + '\n\nMotivo da rejeição: ' + reason;
    request.approver = currentUser;
    
    return request;
  }
};

// Stock Entries API
export const stockEntriesApi = {
  getAll: async (): Promise<StockEntry[]> => {
    await delay();
    return [...mockStockEntries];
  },

  create: async (data: Omit<StockEntry, 'id' | 'createdAt' | 'createdBy' | 'user'>): Promise<StockEntry> => {
    await delay();
    
    const newEntry: StockEntry = {
      ...data,
      id: Math.max(...mockStockEntries.map(e => e.id)) + 1,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      user: currentUser
    };
    
    // Update material stock
    const material = mockMaterials.find(m => m.id === data.materialId);
    if (material) {
      material.currentStock += data.quantity;
      material.updatedAt = new Date().toISOString();
    }
    
    mockStockEntries.push(newEntry);
    return newEntry;
  }
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    await delay();
    return [...mockUsers];
  },

  create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await delay();
    
    const newUser: User = {
      ...data,
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: number, data: Partial<User>): Promise<User | null> => {
    await delay();
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    mockUsers[index] = {
      ...mockUsers[index],
      ...data
    };
    
    return mockUsers[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    mockUsers.splice(index, 1);
    return true;
  }
};