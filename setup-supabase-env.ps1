# Setup Supabase Environment Variables
# Run this script once to set up your environment for passwordless CLI access

Write-Host "🔧 Setting up Supabase CLI environment..." -ForegroundColor Cyan

# Check if user has set their database password
$dbPassword = Read-Host "Enter your Supabase database password (from Dashboard > Settings > Database)"

if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    Write-Host "❌ Database password is required!" -ForegroundColor Red
    Write-Host "   Go to: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/settings/database" -ForegroundColor Yellow
    exit 1
}

# Set environment variables for current session
$env:SUPABASE_DB_PASSWORD = $dbPassword
$env:PGPASSWORD = $dbPassword

Write-Host "✅ Environment variables set for current session!" -ForegroundColor Green
Write-Host ""
Write-Host "Now you can run Supabase commands with the password flag:" -ForegroundColor Cyan
Write-Host "  npx supabase db push -p `$env:SUPABASE_DB_PASSWORD" -ForegroundColor Gray
Write-Host "  npx supabase db pull -p `$env:SUPABASE_DB_PASSWORD" -ForegroundColor Gray
Write-Host ""

# Create a .env file for the project (if it doesn't exist)
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
    @"
# Supabase CLI Configuration
SUPABASE_DB_PASSWORD=$dbPassword
PGPASSWORD=$dbPassword
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Created .env file with database password" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env file already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! You can now use these commands without password prompts:" -ForegroundColor Green
Write-Host "   npx supabase db push -p `$env:SUPABASE_DB_PASSWORD" -ForegroundColor White
Write-Host "   npx supabase db pull -p `$env:SUPABASE_DB_PASSWORD" -ForegroundColor White
