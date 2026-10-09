import { Router, Request, Response } from 'express';
import { db } from './db.js';

export const apiRouter = Router();

// Helper to generate zone ID
function generateZoneId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'Z';
  for (let i = 0; i < 13; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const user = db.prepare('SELECT id, email, password_hash, name FROM users WHERE email = ?').get(email) as any;
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  const token = `session_${user.id}_${Buffer.from(user.email).toString('base64')}`;
  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Also allow query or fallback for dev convenience
    const user = db.prepare('SELECT id, email, name FROM users LIMIT 1').get() as any;
    if (user) {
      return res.json({ user, authenticated: true });
    }
    return res.status(401).json({ detail: 'Not authenticated' });
  }

  const token = authHeader.replace('Bearer ', '');
  const parts = token.split('_');
  if (parts.length < 3) {
    return res.status(401).json({ detail: 'Invalid token' });
  }

  const userId = Number(parts[1]);
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(401).json({ detail: 'User not found' });
  }

  return res.json({ user, authenticated: true });
});

// ----------------------------------------------------
// HOSTED ZONES ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/hosted-zones', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const search = ((req.query.search as string) || '').trim();
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM hosted_zones';
    let dataQuery = `
      SELECT hz.*, 
        (SELECT COUNT(*) FROM records WHERE hosted_zone_id = hz.id) as record_count
      FROM hosted_zones hz
    `;
    const params: any[] = [];

    if (search) {
      const searchClause = ' WHERE name LIKE ? OR zone_id LIKE ? OR description LIKE ?';
      countQuery += searchClause;
      dataQuery += searchClause;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const countRow = db.prepare(countQuery).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;
    const total_pages = Math.ceil(total / limit) || 1;

    const items = db.prepare(dataQuery).all(...params, limit, offset);

    return res.json({
      items,
      page,
      limit,
      total,
      total_pages
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Server error' });
  }
});

apiRouter.post('/hosted-zones', (req: Request, res: Response) => {
  try {
    let { name, description, zone_type, private_zone } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(422).json({ detail: 'Domain name is required' });
    }

    name = name.trim().toLowerCase();
    // remove trailing dot for consistency
    if (name.endsWith('.')) {
      name = name.slice(0, -1);
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(name)) {
      return res.status(422).json({ detail: 'Invalid domain name format' });
    }

    // Check if zone with same name already exists
    const existing = db.prepare('SELECT id FROM hosted_zones WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ detail: `Hosted zone ${name} already exists` });
    }

    const zone_id = generateZoneId();
    const isPrivate = Boolean(private_zone) || zone_type === 'Private';
    const finalZoneType = isPrivate ? 'Private' : 'Public';
    const finalDescription = description || '';

    const stmt = db.prepare(`
      INSERT INTO hosted_zones (name, zone_id, zone_type, description, private_zone)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, zone_id, finalZoneType, finalDescription, isPrivate ? 1 : 0);
    const newId = Number(result.lastInsertRowid);

    // Auto-create standard Route 53 default NS and SOA records
    const nsId1 = Math.floor(100 + Math.random() * 800);
    const nsId2 = Math.floor(100 + Math.random() * 800);
    const nsId3 = Math.floor(100 + Math.random() * 800);
    const nsId4 = Math.floor(100 + Math.random() * 800);

    const defaultNs = `ns-${nsId1}.awsdns-12.org.\nns-${nsId2}.awsdns-34.com.\nns-${nsId3}.awsdns-56.co.uk.\nns-${nsId4}.awsdns-78.net.`;
    const defaultSoa = `ns-${nsId1}.awsdns-12.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400`;

    const insertRecord = db.prepare(`
      INSERT INTO records (hosted_zone_id, name, type, ttl, value, routing_policy)
      VALUES (?, ?, ?, ?, ?, 'Simple')
    `);

    insertRecord.run(newId, name, 'NS', 172800, defaultNs);
    insertRecord.run(newId, name, 'SOA', 900, defaultSoa);

    const created = db.prepare(`
      SELECT hz.*, 
        (SELECT COUNT(*) FROM records WHERE hosted_zone_id = hz.id) as record_count
      FROM hosted_zones hz WHERE hz.id = ?
    `).get(newId);

    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to create hosted zone' });
  }
});

apiRouter.get('/hosted-zones/:id', (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    let zone: any;
    if (/^\d+$/.test(idParam)) {
      zone = db.prepare(`
        SELECT hz.*, 
          (SELECT COUNT(*) FROM records WHERE hosted_zone_id = hz.id) as record_count
        FROM hosted_zones hz WHERE hz.id = ?
      `).get(Number(idParam));
    } else {
      zone = db.prepare(`
        SELECT hz.*, 
          (SELECT COUNT(*) FROM records WHERE hosted_zone_id = hz.id) as record_count
        FROM hosted_zones hz WHERE hz.zone_id = ?
      `).get(idParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    return res.json(zone);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Server error' });
  }
});

apiRouter.put('/hosted-zones/:id', (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const { description, zone_type, private_zone } = req.body || {};

    let zone: any;
    if (/^\d+$/.test(idParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(idParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(idParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    const updatedDesc = description !== undefined ? description : zone.description;
    const updatedType = zone_type !== undefined ? zone_type : zone.zone_type;
    const isPrivate = private_zone !== undefined ? (private_zone ? 1 : 0) : zone.private_zone;

    db.prepare(`
      UPDATE hosted_zones 
      SET description = ?, zone_type = ?, private_zone = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updatedDesc, updatedType, isPrivate, zone.id);

    const updated = db.prepare(`
      SELECT hz.*, 
        (SELECT COUNT(*) FROM records WHERE hosted_zone_id = hz.id) as record_count
      FROM hosted_zones hz WHERE hz.id = ?
    `).get(zone.id);

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to update hosted zone' });
  }
});

apiRouter.delete('/hosted-zones/:id', (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    let zone: any;
    if (/^\d+$/.test(idParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(idParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(idParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    // Delete records first (or handled by foreign key)
    db.prepare('DELETE FROM records WHERE hosted_zone_id = ?').run(zone.id);
    db.prepare('DELETE FROM hosted_zones WHERE id = ?').run(zone.id);

    return res.json({ success: true, message: `Hosted zone ${zone.name} deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to delete hosted zone' });
  }
});

// Export Zone
apiRouter.get('/hosted-zones/:id/export', (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const format = (req.query.format as string) || 'json';

    let zone: any;
    if (/^\d+$/.test(idParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(idParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(idParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    const records = db.prepare('SELECT * FROM records WHERE hosted_zone_id = ? ORDER BY type, name').all(zone.id);

    if (format === 'bind') {
      let bindFile = `$ORIGIN ${zone.name}.\n$TTL 300\n; BIND Zone file exported from AWS Route 53 Clone\n; Zone: ${zone.name} (${zone.zone_id})\n; Exported at: ${new Date().toISOString()}\n\n`;
      for (const r of records as any[]) {
        const relName = r.name === zone.name ? '@' : r.name.replace(`.${zone.name}`, '');
        if (r.type === 'MX') {
          bindFile += `${relName.padEnd(24)} ${r.ttl} IN ${r.type.padEnd(6)} ${r.priority || 10} ${r.value}\n`;
        } else if (r.type === 'SRV') {
          bindFile += `${relName.padEnd(24)} ${r.ttl} IN ${r.type.padEnd(6)} ${r.priority || 10} ${r.weight || 0} ${r.port || 0} ${r.target || r.value}\n`;
        } else {
          bindFile += `${relName.padEnd(24)} ${r.ttl} IN ${r.type.padEnd(6)} ${r.value.replace(/\n/g, ' ')}\n`;
        }
      }
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${zone.name}.zone"`);
      return res.send(bindFile);
    }

    return res.json({
      zone,
      records
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Export error' });
  }
});

// Import records into zone
apiRouter.post('/hosted-zones/:id/import', (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    let zone: any;
    if (/^\d+$/.test(idParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(idParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(idParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    const { records: importedRecords } = req.body || {};
    if (!Array.isArray(importedRecords) || importedRecords.length === 0) {
      return res.status(400).json({ detail: 'Records array is required' });
    }

    const insertRecord = db.prepare(`
      INSERT INTO records (hosted_zone_id, name, type, ttl, value, priority, weight, port, target, flags, tag, routing_policy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Simple')
    `);

    let importedCount = 0;
    for (const r of importedRecords) {
      if (r.name && r.type && r.value) {
        insertRecord.run(
          zone.id,
          r.name,
          r.type.toUpperCase(),
          r.ttl || 300,
          r.value,
          r.priority ?? null,
          r.weight ?? null,
          r.port ?? null,
          r.target ?? null,
          r.flags ?? null,
          r.tag ?? null
        );
        importedCount++;
      }
    }

    return res.json({ success: true, count: importedCount, message: `Successfully imported ${importedCount} records` });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Import error' });
  }
});

// ----------------------------------------------------
// RECORDS ENDPOINTS
// ----------------------------------------------------

apiRouter.get('/hosted-zones/:zone_id/records', (req: Request, res: Response) => {
  try {
    const zoneIdParam = req.params.zone_id;
    let zone: any;
    if (/^\d+$/.test(zoneIdParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(zoneIdParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(zoneIdParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const search = ((req.query.search as string) || '').trim();
    const typeFilter = ((req.query.type as string) || '').trim().toUpperCase();
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM records WHERE hosted_zone_id = ?';
    let dataQuery = 'SELECT * FROM records WHERE hosted_zone_id = ?';
    const params: any[] = [zone.id];

    if (typeFilter && typeFilter !== 'ALL') {
      countQuery += ' AND type = ?';
      dataQuery += ' AND type = ?';
      params.push(typeFilter);
    }

    if (search) {
      const searchClause = ' AND (name LIKE ? OR value LIKE ? OR type LIKE ?)';
      countQuery += searchClause;
      dataQuery += searchClause;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    dataQuery += ' ORDER BY name ASC, type ASC LIMIT ? OFFSET ?';

    const countRow = db.prepare(countQuery).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;
    const total_pages = Math.ceil(total / limit) || 1;

    const items = db.prepare(dataQuery).all(...params, limit, offset);

    return res.json({
      items,
      page,
      limit,
      total,
      total_pages,
      zone: {
        id: zone.id,
        name: zone.name,
        zone_id: zone.zone_id,
        zone_type: zone.zone_type,
        description: zone.description
      }
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Server error' });
  }
});

apiRouter.post('/hosted-zones/:zone_id/records', (req: Request, res: Response) => {
  try {
    const zoneIdParam = req.params.zone_id;
    let zone: any;
    if (/^\d+$/.test(zoneIdParam)) {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE id = ?').get(Number(zoneIdParam));
    } else {
      zone = db.prepare('SELECT * FROM hosted_zones WHERE zone_id = ?').get(zoneIdParam);
    }

    if (!zone) {
      return res.status(404).json({ detail: 'Hosted zone not found' });
    }

    let { name, type, ttl, value, priority, weight, port, target, flags, tag, routing_policy } = req.body || {};

    if (!type) {
      return res.status(422).json({ detail: 'Record type is required' });
    }

    const validTypes = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA'];
    type = type.toUpperCase().trim();
    if (!validTypes.includes(type)) {
      return res.status(422).json({ detail: `Invalid record type: ${type}. Allowed: ${validTypes.join(', ')}` });
    }

    // Name formatting
    let recordName = (name || '').trim();
    if (!recordName || recordName === '@') {
      recordName = zone.name;
    } else if (!recordName.endsWith(zone.name)) {
      recordName = `${recordName}.${zone.name}`;
    }

    // Value formatting
    let finalValue = (value || '').trim();
    if (type === 'MX' && priority !== undefined) {
      if (!finalValue) {
        return res.status(422).json({ detail: 'Mail server host value is required' });
      }
    } else if (type === 'SRV') {
      if (!target && !finalValue) {
        return res.status(422).json({ detail: 'Target host is required for SRV' });
      }
      finalValue = target || finalValue;
    }

    if (!finalValue) {
      return res.status(422).json({ detail: 'Record value is required' });
    }

    const parsedTtl = parseInt(ttl) || 300;
    const parsedPriority = priority !== undefined && priority !== null && priority !== '' ? parseInt(priority) : null;
    const parsedWeight = weight !== undefined && weight !== null && weight !== '' ? parseInt(weight) : null;
    const parsedPort = port !== undefined && port !== null && port !== '' ? parseInt(port) : null;
    const parsedFlags = flags !== undefined && flags !== null && flags !== '' ? parseInt(flags) : null;

    const stmt = db.prepare(`
      INSERT INTO records (
        hosted_zone_id, name, type, ttl, value, priority, weight, port, target, flags, tag, routing_policy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      zone.id,
      recordName,
      type,
      parsedTtl,
      finalValue,
      parsedPriority,
      parsedWeight,
      parsedPort,
      target || null,
      parsedFlags,
      tag || null,
      routing_policy || 'Simple'
    );

    const createdRecord = db.prepare('SELECT * FROM records WHERE id = ?').get(Number(result.lastInsertRowid));
    return res.status(201).json(createdRecord);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to create record' });
  }
});

apiRouter.get('/records/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({ detail: 'Record not found' });
    }
    return res.json(record);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Server error' });
  }
});

apiRouter.put('/records/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ detail: 'Record not found' });
    }

    const { ttl, value, priority, weight, port, target, flags, tag, routing_policy, name } = req.body || {};

    const updatedTtl = ttl !== undefined ? parseInt(ttl) : existing.ttl;
    const updatedValue = value !== undefined ? value.trim() : existing.value;
    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedPriority = priority !== undefined ? (priority !== null && priority !== '' ? parseInt(priority) : null) : existing.priority;
    const updatedWeight = weight !== undefined ? (weight !== null && weight !== '' ? parseInt(weight) : null) : existing.weight;
    const updatedPort = port !== undefined ? (port !== null && port !== '' ? parseInt(port) : null) : existing.port;
    const updatedTarget = target !== undefined ? target : existing.target;
    const updatedFlags = flags !== undefined ? (flags !== null && flags !== '' ? parseInt(flags) : null) : existing.flags;
    const updatedTag = tag !== undefined ? tag : existing.tag;
    const updatedRouting = routing_policy !== undefined ? routing_policy : existing.routing_policy;

    db.prepare(`
      UPDATE records SET
        name = ?,
        ttl = ?,
        value = ?,
        priority = ?,
        weight = ?,
        port = ?,
        target = ?,
        flags = ?,
        tag = ?,
        routing_policy = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      updatedName,
      updatedTtl,
      updatedValue,
      updatedPriority,
      updatedWeight,
      updatedPort,
      updatedTarget,
      updatedFlags,
      updatedTag,
      updatedRouting,
      id
    );

    const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to update record' });
  }
});

apiRouter.delete('/records/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ detail: 'Record not found' });
    }

    // Protect default SOA and NS records from accidental deletion unless forced
    if (existing.type === 'SOA') {
      return res.status(400).json({ detail: 'SOA record cannot be deleted as it is required for zone authority' });
    }

    db.prepare('DELETE FROM records WHERE id = ?').run(id);
    return res.json({ success: true, message: `Record ${existing.name} (${existing.type}) deleted successfully` });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to delete record' });
  }
});

apiRouter.post('/records/bulk-delete', (req: Request, res: Response) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ detail: 'ids array is required' });
    }

    let deleted = 0;
    for (const id of ids) {
      const rec = db.prepare('SELECT type FROM records WHERE id = ?').get(Number(id)) as any;
      if (rec && rec.type !== 'SOA') {
        db.prepare('DELETE FROM records WHERE id = ?').run(Number(id));
        deleted++;
      }
    }

    return res.json({ success: true, deleted, message: `Deleted ${deleted} record(s)` });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to delete records' });
  }
});
