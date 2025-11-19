const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client } = require('pg');

const alterSql = `
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "courseId" varchar;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "category" varchar;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "level" varchar;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "courseOutput" json;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "isVideo" varchar NOT NULL DEFAULT 'Yes';
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "createdBy" varchar;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "courseBanner" varchar;
ALTER TABLE IF EXISTS "courseList" ADD COLUMN IF NOT EXISTS "isPublished" boolean NOT NULL DEFAULT false;
`;

async function main() {
  const connectionString = process.env.DRIZZLE_DATABASE_URL || process.env.NEXT_PUBLIC_DRIZZLE_DATABASE_URL;
  if (!connectionString) {
    console.error('DRIZZLE_DATABASE_URL not set. Set it in .env or as an env var.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB — running ALTER statements to ensure courseList columns...');
    await client.query(alterSql);
    console.log('ALTER statements executed successfully.');
  } catch (err) {
    console.error('Error running ALTER statements:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
