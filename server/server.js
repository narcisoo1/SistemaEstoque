const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Altere conforme sua configuração
  database: 'inventory_system',
  charset: 'utf8mb4'
};

// JWT Secret
const JWT_SECRET = 'seu_jwt_secret_aqui_mude_em_producao';

// Database connection
let db;

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado ao banco de dados MySQL');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

// Routes

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

// Dashboard routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    // Total materials
    const [materialsCount] = await db.execute('SELECT COUNT(*) as count FROM materials');
    stats.totalMaterials = materialsCount[0].count;

    // Pending requests
    let pendingQuery = 'SELECT COUNT(*) as count FROM requests WHERE status = "pendente"';
    if (req.user.role === 'solicitante') {
      pendingQuery += ' AND requester_id = ?';
      const [pendingCount] = await db.execute(pendingQuery, [req.user.id]);
      stats.pendingRequests = pendingCount[0].count;
    } else {
      const [pendingCount] = await db.execute(pendingQuery);
      stats.pendingRequests = pendingCount[0].count;
    }

    // Low stock items
    if (['despachante', 'administrador'].includes(req.user.role)) {
      const [lowStockCount] = await db.execute('SELECT COUNT(*) as count FROM materials WHERE current_stock <= min_stock');
      stats.lowStockItems = lowStockCount[0].count;
    } else {
      stats.lowStockItems = 0;
    }

    // Total users (admin only)
    if (req.user.role === 'administrador') {
      const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users');
      stats.totalUsers = usersCount[0].count;
    } else {
      stats.totalUsers = 0;
    }

    // Recent entries
    if (['despachante', 'administrador'].includes(req.user.role)) {
      const [entriesCount] = await db.execute('SELECT COUNT(*) as count FROM stock_entries WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
      stats.recentEntries = entriesCount[0].count;
    } else {
      stats.recentEntries = 0;
    }

    // Monthly requests
    let monthlyQuery = 'SELECT COUNT(*) as count FROM requests WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())';
    if (req.user.role === 'solicitante') {
      monthlyQuery += ' AND requester_id = ?';
      const [monthlyCount] = await db.execute(monthlyQuery, [req.user.id]);
      stats.monthlyRequests = monthlyCount[0].count;
    } else {
      const [monthlyCount] = await db.execute(monthlyQuery);
      stats.monthlyRequests = monthlyCount[0].count;
    }

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Materials routes
app.get('/api/materials', authenticateToken, requireRole(['despachante', 'administrador']), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM materials ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/materials', authenticateToken, requireRole(['despachante', 'administrador']), async (req, res) => {
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

app.put('/api/materials/:id', authenticateToken, requireRole(['despachante', 'administrador']), async (req, res) => {
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

app.delete('/api/materials/:id', authenticateToken, requireRole(['despachante', 'administrador']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if material is used in any requests or entries
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);