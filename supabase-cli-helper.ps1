# Supabase CLI Helper Script
# This script helps avoid repeated password prompts by using environment variables

# Set your database password here (you'll need to get this from your Supabase dashboard)
# Go to: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/settings/database
# And copy your database password
$DB_PASSWORD = "your_database_password_here"

# Function to run Supabase commands with password
function Invoke-SupabaseCLI {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command,
        [string[]]$Arguments = @()
    )
    
    if ($DB_PASSWORD -eq "your_database_password_here") {
        Write-Host "⚠️  Please update the DB_PASSWORD in supabase-cli-helper.ps1" -ForegroundColor Yellow
        Write-Host "   Go to: https://supabase.com/dashboard/project/gwpbbzjqharvfuuxxuek/settings/database" -ForegroundColor Yellow
        Write-Host "   And copy your database password to this script" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Add password flag for database operations
    if ($Command -match "db (push|pull|diff|dump)") {
        $Arguments += @("-p", $DB_PASSWORD)
    }
    
    # Run the command
    & npx supabase $Command.Split() $Arguments
}

# Examples of usage:
Write-Host "🚀 Supabase CLI Helper loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage examples:" -ForegroundColor Cyan
Write-Host "  Invoke-SupabaseCLI 'db push'" -ForegroundColor Gray
Write-Host "  Invoke-SupabaseCLI 'db pull'" -ForegroundColor Gray
Write-Host "  Invoke-SupabaseCLI 'migration new' @('my_migration_name')" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use these shortcuts:" -ForegroundColor Cyan
Write-Host "  Push-Database    # Same as 'db push'" -ForegroundColor Gray
Write-Host "  Pull-Database    # Same as 'db pull'" -ForegroundColor Gray
Write-Host "  New-Migration    # Create new migration" -ForegroundColor Gray
Write-Host ""

# Convenient aliases
function Push-Database { Invoke-SupabaseCLI "db push" }
function Pull-Database { Invoke-SupabaseCLI "db pull" }
function New-Migration { 
    param([string]$Name)
    Invoke-SupabaseCLI "migration new" @($Name)
}
function List-Migrations { Invoke-SupabaseCLI "migration list" }

# Export functions
Export-ModuleMember -Function Invoke-SupabaseCLI, Push-Database, Pull-Database, New-Migration, List-Migrations
