const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dns = require('dns').promises;
const net = require('net');
const { Client } = require('pg');

function parseConnectionString(conn) {
  try {
    // Node's URL parser requires a protocol, which postgres connection strings have
    const url = new URL(conn);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
    };
  } catch (e) {
    return null;
  }
}

function checkTcp(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let called = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      called = true;
      socket.destroy();
      resolve({ ok: true });
    });
    socket.on('timeout', () => {
      if (!called) {
        called = true;
        socket.destroy();
        resolve({ ok: false, reason: 'timeout' });
      }
    });
    socket.on('error', (err) => {
      if (!called) {
        called = true;
        resolve({ ok: false, reason: err.message || String(err) });
      }
    });
    socket.connect(Number(port), host);
  });
}

async function main() {
  const sqlPath = path.join(__dirname, '..', 'drizzle', '0000_smart_peter_parker.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connectionString = process.env.DRIZZLE_DATABASE_URL || process.env.NEXT_PUBLIC_DRIZZLE_DATABASE_URL;
  if (!connectionString) {
    console.error('DRIZZLE_DATABASE_URL is not set. Set it in .env or in your environment.');
    process.exit(1);
  }

  const parsed = parseConnectionString(connectionString);
  if (!parsed) {
    console.error('Failed to parse connection string. Make sure it is a valid URL.');
    console.error(connectionString);
    process.exit(1);
  }

  console.log('Testing connectivity to DB host:', parsed.host, 'port:', parsed.port);

  try {
    const lookup = await dns.lookup(parsed.host, { all: true });
    if (!lookup.length) {
      console.error('DNS lookup returned no addresses for host:', parsed.host);
      process.exit(1);
    }
    console.log('Resolved IPs:', lookup.map((l) => l.address).join(', '));

    for (const l of lookup) {
      console.log(`Checking TCP ${l.address}:${parsed.port} ...`);
      // Try connecting to each resolved IP
      // Use a 6s timeout per attempt
      // eslint-disable-next-line no-await-in-loop
      const res = await checkTcp(l.address, parsed.port, 6000);
      if (res.ok) {
        console.log(`TCP connect to ${l.address}:${parsed.port} succeeded.`);
        // good — proceed to run SQL
        const client = new Client({ connectionString });
        try {
          await client.connect();
          console.log('Connected to DB. Executing SQL...');
          await client.query(sql);
          console.log('SQL executed successfully.');
          await client.end();
          process.exit(0);
        } catch (err) {
          console.error('Error executing SQL:', err.message || err);
          try {
            await client.end();
          } catch (_) {}
          process.exit(1);
        }
      }
      console.log(`TCP connect to ${l.address}:${parsed.port} failed: ${res.reason}`);
    }

    console.error('All TCP connection attempts failed. Check network, firewall, or whether the DB host allows connections from your IP.');
    process.exit(1);
  } catch (err) {
    console.error('Error during connectivity checks:', err.message || err);
    process.exit(1);
  }
}

main();
