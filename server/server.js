import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken } from './middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Diretório atual (substituto de __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'inventory_system',
  charset: 'utf8mb4',
};

export let db;

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado ao banco de dados MySQL');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// --- Rotas públicas, sem autenticação ---

// Estatísticas do dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    const [materialsCount] = await db.execute('SELECT COUNT(*) as count FROM materials');
    stats.totalMaterials = materialsCount[0].count;

    const [pendingCount] = await db.execute('SELECT COUNT(*) as count FROM requests WHERE status = "pendente"');
    stats.pendingRequests = pendingCount[0].count;

    const [lowStockCount] = await db.execute('SELECT COUNT(*) as count FROM materials WHERE current_stock <= min_stock');
    stats.lowStockItems = lowStockCount[0].count;

    const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = usersCount[0].count;

    const [entriesCount] = await db.execute('SELECT COUNT(*) as count FROM stock_entries WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    stats.recentEntries = entriesCount[0].count;

    const [monthlyCount] = await db.execute('SELECT COUNT(*) as count FROM requests WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())');
    stats.monthlyRequests = monthlyCount[0].count;

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de materiais
app.get('/api/materials', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM materials ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { name, category, unit, minStock, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO materials (name, category, unit, current_stock, min_stock, description) VALUES (?, ?, ?, 0, ?, ?)',
      [name, category, unit, minStock, description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Material criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, minStock, description } = req.body;

    await db.execute(
      'UPDATE materials SET name = ?, category = ?, unit = ?, min_stock = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, unit, minStock, description || null, id]
    );

    res.json({ message: 'Material atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [requestItems] = await db.execute('SELECT COUNT(*) as count FROM request_items WHERE material_id = ?', [id]);
    const [stockEntries] = await db.execute('SELECT COUNT(*) as count FROM stock_entries WHERE material_id = ?', [id]);

    if (requestItems[0].count > 0 || stockEntries[0].count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir material que possui histórico de movimentação' });
    }

    await db.execute('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ message: 'Material excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/requests/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        status,
        priority,
        created_at,
        requester_name,
        school,
        approver_name,
        dispatcher_name,
        items_count,
        total_requested,
        total_dispatched
      FROM request_summary
      ORDER BY created_at DESC
    `;

  // GET /api/materials/search?query=lapis
  app.get('/api/materials/search', async (req, res) => {
    const { query } = req.query;
    try {
      const [rows] = await db.execute(`
        SELECT id, name, quantity 
        FROM materials 
        WHERE name LIKE ? 
        ORDER BY name ASC
        LIMIT 20
      `, [`%${query}%`]);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao buscar materiais:', err);
      res.status(500).json({ error: 'Erro ao buscar materiais' });
    }
  });


    const [rows] = await db.execute(query);

    // Mapear os dados para o formato esperado no frontend (opcional, para camelCase)
    const requests = rows.map(row => ({
      id: row.id,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      requester: {
        name: row.requester_name,
        school: row.school,
      },
      approverName: row.approver_name,
      dispatcherName: row.dispatcher_name,
      itemsCount: row.items_count,
      totalRequested: row.total_requested,
      totalDispatched: row.total_dispatched,
    }));

    res.json(requests);

  } catch (error) {
    console.error('Erro ao buscar resumo das solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});


// Iniciar servidor
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);
