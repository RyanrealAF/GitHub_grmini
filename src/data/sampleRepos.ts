import { GitHubRepo, RepoTreeItem, FileContentResponse } from '../types';

export const SAMPLE_REPO: GitHubRepo = {
  id: 8829103,
  name: 'nexus-backend-service',
  full_name: 'acme-corp/nexus-backend-service',
  owner: {
    login: 'acme-corp',
    avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
  },
  private: false,
  html_url: 'https://github.com/acme-corp/nexus-backend-service',
  description: 'High-throughput microservices runtime with JWT auth and telemetry',
  default_branch: 'main',
  language: 'TypeScript',
  stargazers_count: 1420,
  updated_at: new Date().toISOString(),
};

export const SAMPLE_TREE: RepoTreeItem[] = [
  { path: 'package.json', mode: '100644', type: 'blob', sha: 'sample-pkg-sha', size: 1024 },
  { path: 'tsconfig.json', mode: '100644', type: 'blob', sha: 'sample-tsc-sha', size: 512 },
  { path: 'README.md', mode: '100644', type: 'blob', sha: 'sample-readme-sha', size: 2048 },
  { path: 'src', mode: '040000', type: 'tree', sha: 'sample-src-tree' },
  { path: 'src/server.ts', mode: '100644', type: 'blob', sha: 'sample-srv-sha', size: 1850 },
  { path: 'src/auth/jwtService.ts', mode: '100644', type: 'blob', sha: 'sample-jwt-sha', size: 2420 },
  { path: 'src/auth/rateLimiter.ts', mode: '100644', type: 'blob', sha: 'sample-rate-sha', size: 1680 },
  { path: 'src/routes/api.ts', mode: '100644', type: 'blob', sha: 'sample-api-sha', size: 3100 },
  { path: 'src/utils/crypto.ts', mode: '100644', type: 'blob', sha: 'sample-crypto-sha', size: 1200 },
  { path: 'src/middleware/errorHandler.ts', mode: '100644', type: 'blob', sha: 'sample-err-sha', size: 950 },
  { path: 'tests/auth.test.ts', mode: '100644', type: 'blob', sha: 'sample-test-sha', size: 2200 },
];

export const SAMPLE_FILES: Record<string, FileContentResponse> = {
  'src/auth/jwtService.ts': {
    name: 'jwtService.ts',
    path: 'src/auth/jwtService.ts',
    sha: 'sample-jwt-sha',
    size: 2420,
    encoding: 'utf-8',
    content: `// Authentication Service - Token Management
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  email: string;
  role: string;
}

const SECRET_KEY = process.env.JWT_SECRET || 'insecure-default-key-change-me';

export class JwtService {
  // Signs standard access token
  public static signToken(user: UserPayload): string {
    return jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
  }

  // Verifies incoming Bearer token
  public static verifyToken(token: string): UserPayload | null {
    try {
      const decoded = jwt.verify(token, SECRET_KEY) as any;
      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (err) {
      console.error('Token verification error:', err);
      return null;
    }
  }

  // Issue temporary refresh token
  public static signRefreshToken(userId: string): string {
    return jwt.sign({ sub: userId, type: 'refresh' }, SECRET_KEY, {
      expiresIn: '7d',
    });
  }
}
`,
  },
  'src/auth/rateLimiter.ts': {
    name: 'rateLimiter.ts',
    path: 'src/auth/rateLimiter.ts',
    sha: 'sample-rate-sha',
    size: 1680,
    encoding: 'utf-8',
    content: `import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip);
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  record.count += 1;
  next();
}
`,
  },
  'src/routes/api.ts': {
    name: 'api.ts',
    path: 'src/routes/api.ts',
    sha: 'sample-api-sha',
    size: 3100,
    encoding: 'utf-8',
    content: `import { Router, Request, Response } from 'express';
import { JwtService } from '../auth/jwtService';

export const apiRouter = Router();

// Health endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// User profile
apiRouter.get('/user/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const user = JwtService.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  res.json({ user });
});
`,
  },
};
