import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce"
});

console.log("🔌 Database connection string:", process.env.DATABASE_URL || "postgresql://postgres:123@localhost:5432/multi_ecommerce");

async function testConnection() {
  try {
    console.log("🔄 Testing database connection...");
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful!");
    console.log("Current time from DB:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function initDb() {
  try {
    console.log("📋 Creating tables...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        password TEXT,
        role TEXT CHECK(role IN ('admin', 'merchant', 'customer')),
        is_active BOOLEAN DEFAULT TRUE,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        store_name TEXT,
        slug TEXT UNIQUE,
        description TEXT,
        logo_url TEXT,
        status TEXT DEFAULT 'pending',
        owner_name TEXT,
        owner_email TEXT,
        owner_phone TEXT,
        category TEXT,
        applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT FALSE,
        percentage_enabled BOOLEAN DEFAULT TRUE,
        subscription_paid BOOLEAN DEFAULT FALSE,
        primary_color TEXT DEFAULT '#4F46E5'
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        category_id INTEGER,
        name TEXT,
        description TEXT,
        price DECIMAL(10, 2),
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        name TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        store_id INTEGER NOT NULL REFERENCES stores(id),
        total_amount DECIMAL(10, 2),
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'pending',
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        is_topup_order BOOLEAN DEFAULT FALSE,
        topup_codes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER,
        price DECIMAL(10, 2)
      );
      
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        store_id INTEGER UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
        app_name TEXT,
        logo_url TEXT,
        admin_commission_percentage DECIMAL(5, 2) DEFAULT 0,
        primary_color TEXT DEFAULT '#4F46E5',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("✅ Tables created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    return false;
  }
}

async function startServer() {
  try {
    // Test database connection first
    const connected = await testConnection();
    if (!connected) {
      console.error("❌ Cannot start server without database connection");
      process.exit(1);
    }
    
    // Initialize database
    await initDb();
    
    const app = express();
    app.use(express.json());
    
    // Health check endpoint
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });
    
    // Test database endpoint
    app.get("/api/test-db", async (req, res) => {
      try {
        const result = await pool.query("SELECT COUNT(*) as user_count FROM users");
        res.json({ 
          status: "ok", 
          users: result.rows[0].user_count 
        });
      } catch (error) {
        res.status(500).json({ 
          status: "error", 
          message: (error as any).message 
        });
      }
    });
    
    // Get stores
    app.get("/api/stores", async (req, res) => {
      try {
        const result = await pool.query("SELECT * FROM stores ORDER BY created_at DESC");
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // Create store
    app.post("/api/stores", async (req, res) => {
      try {
        const { store_name, owner_name, owner_phone } = req.body;
        const result = await pool.query(
          "INSERT INTO stores (store_name, owner_name, owner_phone, slug) VALUES ($1, $2, $3, $4) RETURNING *",
          [store_name, owner_name, owner_phone, store_name.toLowerCase().replace(/\s+/g, '-')]
        );
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: (error as any).message });
      }
    });
    
    // Catch-all route
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
    
    const PORT = Number.parseInt(process.env.PORT || "3000", 10);
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`📡 Test DB at: http://localhost:${PORT}/api/test-db`);
    });
    
    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('❌ Server error:', e);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
