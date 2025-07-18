/*
  # Funções e Triggers para o Sistema de Estoque

  1. Functions
    - `update_material_stock_on_entry` - Atualiza estoque ao inserir entrada
    - `update_material_stock_on_dispatch` - Atualiza estoque ao despachar
    - `get_dashboard_stats` - Retorna estatísticas do dashboard
    - `handle_new_user` - Cria perfil de usuário automaticamente

  2. Triggers
    - Trigger para atualizar estoque automaticamente
    - Trigger para registrar movimentações
    - Trigger para criar perfil de usuário
*/

-- Function to update material stock on stock entry
CREATE OR REPLACE FUNCTION update_material_stock_on_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Update material stock
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.material_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
    VALUES (NEW.material_id, 'entrada', NEW.quantity, 'Entrada de estoque', NEW.id, 'entry', NEW.created_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update material stock on dispatch
CREATE OR REPLACE FUNCTION update_material_stock_on_dispatch()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if dispatched_quantity was set or changed
    IF NEW.dispatched_quantity IS NOT NULL AND 
       (OLD.dispatched_quantity IS NULL OR OLD.dispatched_quantity != NEW.dispatched_quantity) THEN
        
        -- Update material stock
        UPDATE materials 
        SET current_stock = current_stock - NEW.dispatched_quantity,
            updated_at = NOW()
        WHERE id = NEW.material_id;
        
        -- Record stock movement
        INSERT INTO stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
        SELECT NEW.material_id, 'saida', NEW.dispatched_quantity, 'Despacho de solicitação', 
               NEW.request_id, 'request', r.dispatched_by
        FROM requests r 
        WHERE r.id = NEW.request_id AND r.dispatched_by IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_role TEXT;
    result JSON;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = COALESCE(user_id, auth.uid());
    
    -- Build stats based on user role
    SELECT json_build_object(
        'totalMaterials', CASE WHEN user_role IN ('despachante', 'administrador') 
                              THEN (SELECT COUNT(*) FROM materials) 
                              ELSE 0 END,
        'pendingRequests', CASE WHEN user_role = 'solicitante'
                               THEN (SELECT COUNT(*) FROM requests WHERE requester_id = COALESCE(user_id, auth.uid()) AND status = 'pendente')
                               ELSE (SELECT COUNT(*) FROM requests WHERE status = 'pendente') END,
        'lowStockItems', CASE WHEN user_role IN ('despachante', 'administrador')
                             THEN (SELECT COUNT(*) FROM materials WHERE current_stock <= min_stock)
                             ELSE 0 END,
        'totalUsers', CASE WHEN user_role = 'administrador'
                          THEN (SELECT COUNT(*) FROM users)
                          ELSE 0 END,
        'recentEntries', CASE WHEN user_role IN ('despachante', 'administrador')
                             THEN (SELECT COUNT(*) FROM stock_entries WHERE created_at >= NOW() - INTERVAL '7 days')
                             ELSE 0 END,
        'monthlyRequests', CASE WHEN user_role = 'solicitante'
                               THEN (SELECT COUNT(*) FROM requests 
                                     WHERE requester_id = COALESCE(user_id, auth.uid()) 
                                     AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                                     AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()))
                               ELSE (SELECT COUNT(*) FROM requests 
                                     WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
                                     AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())) END
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, name, email, role, password)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'role', 'solicitante'),
        'password' -- Senha padrão para demonstração
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create demo users with auth
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS VOID AS $$
DECLARE
    admin_id UUID;
    despachante_id UUID;
    solicitante1_id UUID;
    solicitante2_id UUID;
    solicitante3_id UUID;
BEGIN
    -- Criar usuários de demonstração na tabela auth.users (simulado)
    -- Em produção, estes usuários seriam criados via Supabase Auth
    
    -- Inserir diretamente na tabela users para demonstração
    INSERT INTO users (id, name, email, password, role, school) VALUES
    (uuid_generate_v4(), 'Administrador Sistema', 'admin@educacao.gov.br', 'password', 'administrador', NULL),
    (uuid_generate_v4(), 'Carlos Mendes', 'carlos@educacao.gov.br', 'password', 'despachante', NULL),
    (uuid_generate_v4(), 'Maria Silva', 'maria@escola1.edu.br', 'password', 'solicitante', 'Escola Municipal João da Silva'),
    (uuid_generate_v4(), 'João Santos', 'joao@escola2.edu.br', 'password', 'solicitante', 'Escola Municipal Maria das Dores'),
    (uuid_generate_v4(), 'Ana Costa', 'ana@escola3.edu.br', 'password', 'solicitante', 'Escola Municipal Pedro Alvares');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_stock_on_entry
    AFTER INSERT ON stock_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_entry();

CREATE TRIGGER trigger_update_stock_on_dispatch
    AFTER UPDATE ON request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_material_stock_on_dispatch();

-- Trigger for new user creation (quando usar Supabase Auth real)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Executar criação de usuários demo
SELECT create_demo_users();