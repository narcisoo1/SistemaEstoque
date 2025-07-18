import { supabase } from '../lib/supabase';
import { 
  User, 
  Material, 
  Supplier, 
  StockEntry,
  Request,
  RequestItem 
} from '../types';

// Auth API
export const authApi = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  signUp: async (email: string, password: string, userData: { name: string; role?: string; school?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      // Get user profile from users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      return profile;
    }
    
    return null;
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;
    return data;
  }
};

// Materials API
export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.current_stock,
      minStock: item.min_stock,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },

  create: async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>) => {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        name: material.name,
        category: material.category,
        unit: material.unit,
        min_stock: material.minStock,
        description: material.description
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: number, material: Partial<Material>) => {
    const { data, error } = await supabase
      .from('materials')
      .update({
        name: material.name,
        category: material.category,
        unit: material.unit,
        min_stock: material.minStock,
        description: material.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id.toString())
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id.toString());
    
    if (error) throw error;
  },

  search: async (query: string): Promise<Pick<Material, 'id' | 'name' | 'currentStock'>[]> => {
    const { data, error } = await supabase
      .from('materials')
      .select('id, name, current_stock')
      .ilike('name', `%${query}%`)
      .limit(20);
    
    if (error) throw error;
    
    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      currentStock: item.current_stock
    }));
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      createdAt: item.created_at
    }));
  },

  create: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: number, supplier: Partial<Supplier>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', id.toString())
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id.toString());
    
    if (error) throw error;
  }
};

// Users API
export const usersApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  create: async (userData: any) => {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || 'tempPassword123',
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role,
        school: userData.school
      }
    });
    
    if (authError) throw authError;
    
    // Then update the user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        role: userData.role,
        school: userData.school
      })
      .eq('id', authData.user.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        role: userData.role,
        school: userData.school,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
    
    // Delete from users table (should cascade)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Stock Entries API
export const stockEntriesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('stock_entries')
      .select(`
        *,
        materials:material_id(name, unit),
        suppliers:supplier_id(name),
        users:created_by(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(entry => ({
      id: entry.id,
      materialId: entry.material_id,
      supplierId: entry.supplier_id,
      quantity: entry.quantity,
      unitPrice: entry.unit_price,
      batch: entry.batch,
      expiryDate: entry.expiry_date,
      notes: entry.notes,
      createdBy: entry.created_by,
      createdAt: entry.created_at,
      createdUser: entry.users?.name,
      material: entry.materials,
      supplier: entry.suppliers,
      totalPrice: entry.quantity * (entry.unit_price || 0)
    }));
  },

  create: async (data: any) => {
    const { data: result, error } = await supabase
      .from('stock_entries')
      .insert({
        material_id: data.material_id,
        supplier_id: data.supplier_id,
        quantity: data.quantity,
        unit_price: data.unit_price,
        batch: data.batch,
        expiry_date: data.expiry_date,
        notes: data.notes,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  update: async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('stock_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('stock_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Requests API
export const requestsApi = {
  getAll: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('request_summary')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getById: async (id: string): Promise<any> => {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        requester:requester_id(name, school),
        approver:approved_by(name),
        dispatcher:dispatched_by(name)
      `)
      .eq('id', id)
      .single();
    
    if (requestError) throw requestError;
    
    const { data: items, error: itemsError } = await supabase
      .from('request_items')
      .select(`
        *,
        material:material_id(name, unit, category, description)
      `)
      .eq('request_id', id);
    
    if (itemsError) throw itemsError;
    
    return {
      ...request,
      items: items
    };
  },

  create: async (request: {
    requester_id: string;
    priority: string;
    notes?: string;
    items: Array<{
      material_id: string;
      quantity: number;
      notes?: string;
    }>;
  }): Promise<any> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data: newRequest, error: requestError } = await supabase
      .from('requests')
      .insert({
        requester_id: user.data.user.id,
        priority: request.priority,
        notes: request.notes
      })
      .select()
      .single();
    
    if (requestError) throw requestError;
    
    const itemsToInsert = request.items.map(item => ({
      request_id: newRequest.id,
      material_id: item.material_id,
      requested_quantity: item.quantity,
      notes: item.notes
    }));
    
    const { error: itemsError } = await supabase
      .from('request_items')
      .insert(itemsToInsert);
    
    if (itemsError) throw itemsError;
    
    return newRequest;
  },

  update: async (id: string, data: any): Promise<any> => {
    const { data: result, error } = await supabase
      .from('requests')
      .update({
        priority: data.priority,
        notes: data.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update items if provided
    if (data.items) {
      // Delete existing items
      await supabase
        .from('request_items')
        .delete()
        .eq('request_id', id);
      
      // Insert new items
      const itemsToInsert = data.items.map((item: any) => ({
        request_id: id,
        material_id: item.materialId,
        requested_quantity: item.requestedQuantity,
        notes: item.notes
      }));
      
      await supabase
        .from('request_items')
        .insert(itemsToInsert);
    }
    
    return result;
  },

  approve: async (
    id: string, 
    approvedBy: string, 
    items: Array<{
      item_id: string;
      quantity: number;
    }>
  ): Promise<any> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    // Update request status
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'aprovado',
        approved_by: user.data.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (requestError) throw requestError;
    
    // Update approved quantities
    for (const item of items) {
      const { error: itemError } = await supabase
        .from('request_items')
        .update({
          approved_quantity: item.quantity
        })
        .eq('id', item.item_id);
      
      if (itemError) throw itemError;
    }
    
    return request;
  },

  reject: async (id: string, reason: string): Promise<any> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('requests')
      .update({
        status: 'rejeitado',
        approved_by: user.data.user.id,
        approved_at: new Date().toISOString(),
        notes: `${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  dispatch: async (id: string, dispatchedBy: string): Promise<any> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');
    
    // Update request status
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'despachado',
        dispatched_by: user.data.user.id,
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (requestError) throw requestError;
    
    // Update dispatched quantities (set to approved quantities)
    const { error: itemsError } = await supabase
      .from('request_items')
      .update({
        dispatched_quantity: supabase.raw('approved_quantity')
      })
      .eq('request_id', id);
    
    if (itemsError) throw itemsError;
    
    return request;
  }
};