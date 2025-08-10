# Supabase Commands with Automatic Password Handling
# This script provides functions to run Supabase CLI commands without repeated password prompts

# Function to get database password from environment or prompt once
function Get-DatabasePassword {
    if ($env:SUPABASE_DB_PASSWORD) {
        return $env:SUPABASE_DB_PASSWORD
    }
    
    if ($env:PGPASSWORD) {
        return $env:PGPASSWORD
    }
    
    # Check if .env file exists and load password
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $passwordLine = $envContent | Where-Object { $_ -match "^SUPABASE_DB_PASSWORD=" }
        if ($passwordLine) {
            return $passwordLine.Split("=")[1]
        }
    }
    
    Write-Host "⚠️  Database password not found in environment variables or .env file" -ForegroundColor Yellow
    Write-Host "   Please run setup-supabase-env.ps1 first, or set SUPABASE_DB_PASSWORD manually" -ForegroundColor Yellow
    return $null
}

# Enhanced Supabase CLI wrapper
function Invoke-SupabaseCommand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command,
        [string[]]$Arguments = @(),
        [switch]$NoPassword
    )
    
    $password = Get-DatabasePassword
    
    # Add password for database operations
    if (-not $NoPassword -and $Command -match "db (push|pull|diff|dump|reset)" -and $password) {
        $Arguments += @("-p", $password)
    }
    
    # Add --yes flag for non-interactive operations
    if ($Command -match "db push" -and $Arguments -notcontains "--yes") {
        $Arguments += @("--yes")
    }
    
    # Execute command
    $fullCommand = "npx supabase $Command"
    if ($Arguments.Count -gt 0) {
        $fullCommand += " " + ($Arguments -join " ")
    }
    
    Write-Host "🚀 Running: $fullCommand" -ForegroundColor Cyan
    Invoke-Expression $fullCommand
}

# Convenient wrapper functions
function Push-SupabaseDatabase {
    param([string[]]$ExtraArgs = @())
    Invoke-SupabaseCommand "db push" $ExtraArgs
}

function Pull-SupabaseDatabase {
    param([string[]]$ExtraArgs = @())
    Invoke-SupabaseCommand "db pull" $ExtraArgs
}

function New-SupabaseMigration {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Name
    )
    Invoke-SupabaseCommand "migration new" @($Name) -NoPassword
}

function List-SupabaseMigrations {
    Invoke-SupabaseCommand "migration list" @() -NoPassword
}

function Get-SupabaseStatus {
    Invoke-SupabaseCommand "status" @() -NoPassword
}

# Export functions for use
Export-ModuleMember -Function Invoke-SupabaseCommand, Push-SupabaseDatabase, Pull-SupabaseDatabase, New-SupabaseMigration, List-SupabaseMigrations, Get-SupabaseStatus

Write-Host "✅ Supabase command functions loaded!" -ForegroundColor Green
