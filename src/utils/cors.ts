import cors from 'cors';

// Configure CORS: Cloud only (production) or development
const isProduction = process.env.NODE_ENV === 'production';

const corsOptions = {
  origin: isProduction
    ? [
        // Production: Only cloud domain(s)
        'https://web-production-9efff.up.railway.app',
        // Add other production domains if needed
      ]
    : [
        // Development: Local ports only
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export function setupCors(app: any) {
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
}
