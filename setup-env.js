#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up PropMate environment configuration...\n');

// Check if .env.local already exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file already exists');
  console.log('📝 Current configuration:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(envContent);
} else {
  // Create .env.local from template
  const templatePath = path.join(__dirname, 'environment-template.env');
  if (fs.existsSync(templatePath)) {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    
    // Extract only the essential Supabase configuration
    const essentialConfig = `# PropMate Environment Configuration
# Supabase Configuration
VITE_SUPABASE_URL=https://gwpbbzjqharvfuuxxuek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cGJiempxaGFydmZ1dXh4dWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MTUzMDcsImV4cCI6MjA2OTE5MTMwN30.LSxPfuzvXOhY_leqIGm7DG7Frw1FLu_acqK6dRQ1g_k

# Development settings
NODE_ENV=development
DEBUG=true
`;

    fs.writeFileSync(envPath, essentialConfig);
    console.log('✅ Created .env.local file with Supabase configuration');
    console.log('📝 Configuration:');
    console.log(essentialConfig);
  } else {
    console.log('❌ environment-template.env not found');
    process.exit(1);
  }
}

console.log('\n🚀 You can now start the development server with:');
console.log('   npm run dev');
console.log('\n🔍 If you still experience login issues, check:');
console.log('   1. Browser console for errors');
console.log('   2. Network tab for failed requests');
console.log('   3. Supabase project status');
console.log('   4. Internet connection');
