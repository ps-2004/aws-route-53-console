import { Request, Response } from 'express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AWS Route 53 Clone API',
    version: '1.0.0',
    description: 'REST API documentation for the AWS Route 53 Console clone. Supports mock authentication, hosted zones management, DNS record CRUD, filtering, search, pagination, and import/export.'
  },
  servers: [
    {
      url: '/api',
      description: 'Local API server'
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'User Login',
        description: 'Authenticate user with email and password (mock credentials: admin@route53clone.com / admin123)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@route53clone.com' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Successful login' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'User Logout',
        responses: { '200': { description: 'Logged out successfully' } }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get Current User',
        responses: { '200': { description: 'Authenticated user' }, '401': { description: 'Not authenticated' } }
      }
    },
    '/hosted-zones': {
      get: {
        summary: 'List Hosted Zones',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Paginated list of hosted zones' } }
      },
      post: {
        summary: 'Create Hosted Zone',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'example.com' },
                  description: { type: 'string', example: 'Production DNS zone' },
                  zone_type: { type: 'string', enum: ['Public', 'Private'], default: 'Public' },
                  private_zone: { type: 'boolean', default: false }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created hosted zone' } }
      }
    },
    '/hosted-zones/{id}': {
      get: {
        summary: 'Get Hosted Zone Details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Hosted zone details' }, '404': { description: 'Not found' } }
      },
      put: {
        summary: 'Update Hosted Zone',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  zone_type: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Updated hosted zone' } }
      },
      delete: {
        summary: 'Delete Hosted Zone',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Hosted zone deleted' } }
      }
    },
    '/hosted-zones/{zone_id}/records': {
      get: {
        summary: 'List DNS Records in Hosted Zone',
        parameters: [
          { name: 'zone_id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['ALL', 'A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'] } }
        ],
        responses: { '200': { description: 'Paginated list of DNS records' } }
      },
      post: {
        summary: 'Create DNS Record',
        parameters: [{ name: 'zone_id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['type', 'value'],
                properties: {
                  name: { type: 'string', example: 'www' },
                  type: { type: 'string', enum: ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'] },
                  ttl: { type: 'integer', default: 300 },
                  value: { type: 'string', example: '192.168.1.10' },
                  priority: { type: 'integer', nullable: true },
                  weight: { type: 'integer', nullable: true },
                  port: { type: 'integer', nullable: true },
                  target: { type: 'string', nullable: true },
                  flags: { type: 'integer', nullable: true },
                  tag: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created DNS record' } }
      }
    },
    '/records/{id}': {
      get: {
        summary: 'Get DNS Record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'DNS record' } }
      },
      put: {
        summary: 'Update DNS Record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Updated DNS record' } }
      },
      delete: {
        summary: 'Delete DNS Record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'DNS record deleted' } }
      }
    }
  }
};

export function renderSwaggerHtml(req: Request, res: Response) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AWS Route 53 API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { background-color: #232f3e !important; padding: 10px 20px; }
    .topbar a { color: #fff !important; font-weight: bold; font-size: 16px; text-decoration: none; display: flex; align-items: center; gap: 8px; }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="/">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff9900" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <span>AWS Route 53 Clone API Documentation</span>
    </a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
