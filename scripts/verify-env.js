const fs = require('fs');
const path = require('path');

// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, that's okay
}

console.log('🔍 Environment Variables Verification\n');

const envFiles = [
  { name: 'Root', path: path.resolve(__dirname, '../.env') },
  { name: 'API', path: path.resolve(__dirname, '../apps/api/.env') },
  { name: 'Database', path: path.resolve(__dirname, '../packages/database/.env') },
];

let allValid = true;

envFiles.forEach(({ name, path: filePath }) => {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${name} (.env): ${filePath}`);

  if (exists) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasDbUrl = content.includes('DATABASE_URL');
      console.log(`   └─ DATABASE_URL defined: ${hasDbUrl ? '✅' : '❌'}`);
      if (!hasDbUrl) {
        allValid = false;
      }
    } catch (error) {
      console.log(`   └─ Error reading file: ${error.message}`);
      allValid = false;
    }
  } else {
    allValid = false;
  }
});

console.log('\n📋 Current Environment Variables:');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

if (process.env.DATABASE_URL) {
  // Parse and display sanitized connection info
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`\n📡 Database Connection Info:`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || 5432}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username}`);
  } catch (error) {
    console.log(`\n⚠️  Invalid DATABASE_URL format`);
    allValid = false;
  }
}

console.log('\n' + (allValid ? '✅ All environment files are properly configured!' : '❌ Some issues found. Please check above.'));
process.exit(allValid ? 0 : 1);
