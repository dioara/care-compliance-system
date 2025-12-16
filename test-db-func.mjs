import * as db from './server/db.ts';

async function main() {
  console.log('Testing getUsersByTenant...');
  const users = await db.getUsersByTenant(30002);
  console.log('Users returned:', JSON.stringify(users, null, 2));
}

main().catch(console.error);
