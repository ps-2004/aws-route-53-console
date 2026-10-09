import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.resolve(process.cwd(), 'route53.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hosted_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone_id TEXT UNIQUE NOT NULL,
      zone_type TEXT NOT NULL DEFAULT 'Public',
      description TEXT,
      private_zone INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hosted_zone_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      ttl INTEGER NOT NULL DEFAULT 300,
      value TEXT NOT NULL,
      priority INTEGER,
      weight INTEGER,
      port INTEGER,
      target TEXT,
      flags INTEGER,
      tag TEXT,
      routing_policy TEXT NOT NULL DEFAULT 'Simple',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (hosted_zone_id) REFERENCES hosted_zones(id) ON DELETE CASCADE
    );
  `);

  // Check if users exist, seed default user
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    db.prepare(`
      INSERT INTO users (email, password_hash, name)
      VALUES (?, ?, ?)
    `).run('admin@route53clone.com', 'admin123', 'Administrator');
  }

  // Check if hosted zones exist, seed realistic Route 53 zones
  const zoneCount = db.prepare('SELECT COUNT(*) as count FROM hosted_zones').get() as { count: number };
  if (zoneCount.count === 0) {
    seedInitialData();
  }
}

function generateZoneId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'Z';
  for (let i = 0; i < 13; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function seedInitialData() {
  const zones = [
    {
      name: 'example.com',
      zone_id: 'Z04829104A19CD',
      zone_type: 'Public',
      description: 'Primary public production zone for example.com',
      private_zone: 0,
      records: [
        { name: 'example.com', type: 'NS', ttl: 172800, value: 'ns-1536.awsdns-00.org.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.co.uk.\nns-512.awsdns-00.net.' },
        { name: 'example.com', type: 'SOA', ttl: 900, value: 'ns-1536.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400' },
        { name: 'example.com', type: 'A', ttl: 300, value: '192.168.1.10' },
        { name: 'www.example.com', type: 'CNAME', ttl: 300, value: 'example.com' },
        { name: 'api.example.com', type: 'A', ttl: 300, value: '192.168.1.25' },
        { name: 'example.com', type: 'MX', ttl: 300, value: 'mail.example.com', priority: 10 },
        { name: 'example.com', type: 'TXT', ttl: 300, value: '"v=spf1 include:example.com ~all"' },
        { name: '_sip._tcp.example.com', type: 'SRV', ttl: 300, value: 'sip.example.com', priority: 10, weight: 60, port: 5060, target: 'sip.example.com' },
        { name: 'example.com', type: 'CAA', ttl: 300, value: 'amazon.com', flags: 0, tag: 'issue' }
      ]
    },
    {
      name: 'example.org',
      zone_id: 'Z083920194B28EF',
      zone_type: 'Public',
      description: 'Open source foundation portal and documentation',
      private_zone: 0,
      records: [
        { name: 'example.org', type: 'NS', ttl: 172800, value: 'ns-204.awsdns-25.com.\nns-812.awsdns-37.net.\nns-1402.awsdns-47.org.\nns-1890.awsdns-44.co.uk.' },
        { name: 'example.org', type: 'SOA', ttl: 900, value: 'ns-204.awsdns-25.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400' },
        { name: 'example.org', type: 'A', ttl: 300, value: '93.184.216.34' },
        { name: 'example.org', type: 'AAAA', ttl: 300, value: '2606:2800:220:1:248:1893:25c8:1946' },
        { name: 'docs.example.org', type: 'CNAME', ttl: 300, value: 'example.org' },
        { name: 'example.org', type: 'TXT', ttl: 300, value: '"google-site-verification=abc123xyz890"' }
      ]
    },
    {
      name: 'mycompany.com',
      zone_id: 'Z019283748291AA',
      zone_type: 'Public',
      description: 'Corporate customer facing platform and services',
      private_zone: 0,
      records: [
        { name: 'mycompany.com', type: 'NS', ttl: 172800, value: 'ns-612.awsdns-12.net.\nns-112.awsdns-14.com.\nns-1782.awsdns-30.co.uk.\nns-1200.awsdns-21.org.' },
        { name: 'mycompany.com', type: 'SOA', ttl: 900, value: 'ns-612.awsdns-12.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400' },
        { name: 'mycompany.com', type: 'A', ttl: 60, value: '54.239.28.85' },
        { name: 'app.mycompany.com', type: 'CNAME', ttl: 300, value: 'd111111abcdef8.cloudfront.net' },
        { name: 'mycompany.com', type: 'MX', ttl: 300, value: 'inbound-smtp.us-east-1.amazonaws.com', priority: 10 },
        { name: 'mycompany.com', type: 'TXT', ttl: 300, value: '"v=spf1 include:amazonses.com ~all"' },
        { name: 'mycompany.com', type: 'CAA', ttl: 300, value: 'amazontrust.com', flags: 0, tag: 'issue' }
      ]
    },
    {
      name: 'internal.corp.local',
      zone_id: 'Z091827364510BC',
      zone_type: 'Private',
      description: 'VPC private DNS zone for internal microservices (vpc-0891ab23)',
      private_zone: 1,
      records: [
        { name: 'internal.corp.local', type: 'NS', ttl: 172800, value: 'ns-10.awsdns-01.com.\nns-11.awsdns-02.net.\nns-12.awsdns-03.org.\nns-13.awsdns-04.co.uk.' },
        { name: 'internal.corp.local', type: 'SOA', ttl: 900, value: 'ns-10.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400' },
        { name: 'db.internal.corp.local', type: 'A', ttl: 60, value: '10.0.4.15' },
        { name: 'redis.internal.corp.local', type: 'A', ttl: 60, value: '10.0.4.22' },
        { name: 'auth.internal.corp.local', type: 'A', ttl: 60, value: '10.0.2.50' }
      ]
    }
  ];

  for (const z of zones) {
    const insertZone = db.prepare(`
      INSERT INTO hosted_zones (name, zone_id, zone_type, description, private_zone)
      VALUES (?, ?, ?, ?, ?)
    `);
    const res = insertZone.run(z.name, z.zone_id, z.zone_type, z.description, z.private_zone);
    const zoneDbId = Number(res.lastInsertRowid);

    const insertRecord = db.prepare(`
      INSERT INTO records (hosted_zone_id, name, type, ttl, value, priority, weight, port, target, flags, tag, routing_policy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Simple')
    `);

    for (const r of z.records) {
      insertRecord.run(
        zoneDbId,
        r.name,
        r.type,
        r.ttl,
        r.value,
        (r as any).priority ?? null,
        (r as any).weight ?? null,
        (r as any).port ?? null,
        (r as any).target ?? null,
        (r as any).flags ?? null,
        (r as any).tag ?? null
      );
    }
  }
}
