/*
  # Sistema de Gerenciamento de Estoque - Secretaria de Educação

  1. New Tables
    - `users` - Perfis de usuários (complementa auth.users)
    - `materials` - Materiais disponíveis no estoque
    - `suppliers` - Fornecedores dos materiais
    - `stock_entries` - Entradas de estoque
    - `requests` - Solicitações de materiais
    - `request_items` - Itens das solicitações
    - `stock_movements` - Movimentações de estoque

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control

  3. Views
    - `stock_status` - Status atual do estoque
    - `request_summary` - Resumo das solicitações
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles complementing auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Manter para compatibilidade, mas será usado apenas para dados de demonstração
    role TEXT NOT NULL DEFAULT 'solicitante' CHECK (role IN ('solicitante', 'despachante', 'administrador')),
    school TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock entries table
CREATE TABLE IF NOT EXISTS stock_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    batch TEXT,
    expiry_date DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'despachado', 'cancelado')),
    priority TEXT DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta')),
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    dispatched_by UUID REFERENCES auth.users(id),
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Request items table
CREATE TABLE IF NOT EXISTS request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2),
    dispatched_quantity DECIMAL(10,2),
    notes TEXT
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id),
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    quantity DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT CHECK (reference_type IN ('request', 'entry', 'adjustment')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

-- RLS Policies for materials table
CREATE POLICY "All authenticated users can read materials" ON materials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Despachantes and admins can manage materials" ON materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for suppliers table
CREATE POLICY "All authenticated users can read suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Despachantes and admins can manage suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for stock_entries table
CREATE POLICY "All authenticated users can read stock entries" ON stock_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Despachantes and admins can manage stock entries" ON stock_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for requests table
CREATE POLICY "Users can read own requests" ON requests
    FOR SELECT USING (
        requester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
        )
    );

CREATE POLICY "Solicitantes can create requests" ON requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update own pending requests" ON requests
    FOR UPDATE USING (
        requester_id = auth.uid() AND status = 'pendente'
    );

CREATE POLICY "Despachantes and admins can update requests" ON requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for request_items table
CREATE POLICY "Users can read request items for accessible requests" ON request_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM requests r 
            WHERE r.id = request_id AND (
                r.requester_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = auth.uid() AND role IN ('despachante', 'administrador')
                )
            )
        )
    );

CREATE POLICY "Users can manage request items for own requests" ON request_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM requests r 
            WHERE r.id = request_id AND r.requester_id = auth.uid()
        )
    );

-- RLS Policies for stock_movements table
CREATE POLICY "All authenticated users can read stock movements" ON stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert stock movements" ON stock_movements
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_stock ON materials(current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_stock_entries_material ON stock_entries(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_supplier ON stock_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON stock_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(created_at);
CREATE INDEX IF NOT EXISTS idx_request_items_request ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_material ON request_items(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Create views
CREATE OR REPLACE VIEW stock_status AS
SELECT 
    m.id,
    m.name,
    m.category,
    m.unit,
    m.current_stock,
    m.min_stock,
    CASE 
        WHEN m.current_stock <= m.min_stock THEN 'Baixo'
        WHEN m.current_stock <= (m.min_stock * 1.5) THEN 'Atenção'
        ELSE 'OK'
    END as status,
    m.updated_at
FROM materials m;

CREATE OR REPLACE VIEW request_summary AS
SELECT 
    r.id,
    r.status,
    r.priority,
    r.created_at,
    u1.name as requester_name,
    u1.school,
    u2.name as approver_name,
    u3.name as dispatcher_name,
    COUNT(ri.id) as items_count,
    SUM(ri.requested_quantity) as total_requested,
    SUM(COALESCE(ri.dispatched_quantity, 0)) as total_dispatched
FROM requests r
LEFT JOIN users u1 ON r.requester_id = u1.id
LEFT JOIN users u2 ON r.approved_by = u2.id
LEFT JOIN users u3 ON r.dispatched_by = u3.id
LEFT JOIN request_items ri ON r.id = ri.request_id
GROUP BY r.id, r.status, r.priority, r.created_at, u1.name, u1.school, u2.name, u3.name;

-- Insert default materials
INSERT INTO materials (name, category, unit, current_stock, min_stock, description) VALUES
('Arroz Branco', 'Alimentação', 'kg', 100, 20, 'Arroz tipo 1 para merenda escolar'),
('Feijão Preto', 'Alimentação', 'kg', 50, 10, 'Feijão preto para merenda escolar'),
('Óleo de Soja', 'Alimentação', 'litro', 30, 5, 'Óleo de soja refinado'),
('Detergente', 'Material de Limpeza', 'unidade', 25, 5, 'Detergente neutro 500ml'),
('Papel Higiênico', 'Material de Limpeza', 'pacote', 40, 10, 'Papel higiênico folha dupla'),
('Sabão em Pó', 'Material de Limpeza', 'kg', 20, 5, 'Sabão em pó para limpeza geral'),
('Papel A4', 'Material de Expediente', 'resma', 15, 3, 'Papel sulfite A4 500 folhas'),
('Caneta Azul', 'Material de Expediente', 'unidade', 100, 20, 'Caneta esferográfica azul'),
('Lápis de Cor', 'Material Pedagógico', 'caixa', 30, 10, 'Caixa com 12 lápis de cor'),
('Caderno Universitário', 'Material Pedagógico', 'unidade', 200, 50, 'Caderno universitário 96 folhas');

-- Insert default suppliers
INSERT INTO suppliers (name, email, phone, address) VALUES
('Distribuidora Alimentos Ltda', 'vendas@distribuidora.com', '(11) 1234-5678', 'Rua das Flores, 123 - Centro'),
('Fornecedor Limpeza S/A', 'contato@limpeza.com', '(11) 2345-6789', 'Av. Principal, 456 - Industrial'),
('Papelaria Escolar ME', 'vendas@papelaria.com', '(11) 3456-7890', 'Rua Comercial, 789 - Centro');