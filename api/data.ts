import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// Create Redis client (lazily initialized)
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

// Helper to get user ID from request
function getUserId(req: VercelRequest): string | null {
  const userId = req.headers['x-user-id'] as string;
  return userId || null;
}

// Helper to create data key
function getDataKey(userId: string): string {
  return `ynaht:user:${userId}:data`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-User-Id, Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: 'Missing X-User-Id header' });
  }

  const dataKey = getDataKey(userId);

  try {
    const client = getRedis();

    switch (req.method) {
      case 'GET': {
        // Fetch user data
        const data = await client.get(dataKey);
        return res.status(200).json({
          data: data ? JSON.parse(data) : null,
          lastSyncedAt: new Date().toISOString(),
        });
      }

      case 'POST':
      case 'PUT': {
        // Save/update user data
        const body = req.body;
        if (!body || !body.data) {
          return res.status(400).json({ error: 'Missing data in request body' });
        }

        // Store the data with metadata
        const dataToStore = {
          ...body.data,
          _meta: {
            lastUpdatedAt: new Date().toISOString(),
            userId,
          },
        };

        await client.set(dataKey, JSON.stringify(dataToStore));

        return res.status(200).json({
          success: true,
          lastSyncedAt: new Date().toISOString(),
        });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'OPTIONS']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
