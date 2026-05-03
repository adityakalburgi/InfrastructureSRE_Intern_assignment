# simulate-failure.ps1
# Simulates a complete failure event across the stack
# Scenario: RDBMS outage followed by MCP failure

Write-Host "=== IMS Failure Simulation ===" -ForegroundColor Red
Write-Host ""

# Scenario 1: Database Server Outage
Write-Host "Step 1: Simulating RDBMS outage..." -ForegroundColor Yellow

$dbFailure = @"
{
  "component_id": "DB-SERVER-1",
  "message": "Database server unreachable - replication lag detected, primary down"
}
"@

$response = Invoke-WebRequest -Uri 'http://localhost:5000/signal' -Method POST -Body $dbFailure -ContentType 'application/json'
Write-Host "  Signal sent: " $response.StatusCode
Write-Host ""

# Wait for incident to be created
Start-Sleep -Seconds 2

# Get all incidents to see the new one
Write-Host "Current Incidents:" -ForegroundColor Cyan
$items = Invoke-WebRequest -Uri 'http://localhost:5000/workitem' -Method GET
$jsonItems = $items.Content | ConvertFrom-Json
$jsonItems | Format-Table id, component_id, status, severity -AutoSize

Write-Host ""
Write-Host "Step 2: Simulating MCP (Monitoring Control Platform) failure..." -ForegroundColor Yellow

# Scenario 2: MCP Controller failure
$mcpFailure = @"
{
  "component_id": "MCP-CONTROLLER-1",
  "message": "MCP controller offline - unable to process monitoring commands"
}
"@

$response2 = Invoke-WebRequest -Uri 'http://localhost:5000/signal' -Method POST -Body $mcpFailure -ContentType 'application/json'
Write-Host "  Signal sent: " $response2.StatusCode
Write-Host ""

# Wait for incident to be created
Start-Sleep -Seconds 2

# Get updated incidents
Write-Host "All Active Incidents:" -ForegroundColor Cyan
$items = Invoke-WebRequest -Uri 'http://localhost:5000/workitem' -Method GET
$jsonItems = $items.Content | ConvertFrom-Json
$jsonItems | Format-Table id, component_id, status, severity -AutoSize

Write-Host ""
Write-Host "Step 3: Resolving incidents with RCA..." -ForegroundColor Yellow

# Find the DB-SERVER incident
$dbItem = $jsonItems | Where-Object { $_.component_id -eq "DB-SERVER-1" } | Select-Object -First 1

if ($dbItem) {
    $rcaBody = @"
{
  "rca": "Primary database server hardware failure due to power supply issue. Failover to secondary successful.",
  "root_cause_category": "hardware_failure",
  "fix_applied": "Replaced failed power supply unit. Initiated controlled failover to secondary node. Re-synced replication lag.",
  "prevention_steps": "1. Implement redundant power supplies 2. Add hardware health monitoring 3. Automate failover testing"
}
"@

    $resolveUrl = "http://localhost:5000/workitem/$($dbItem.id)/rca"
    $resolve = Invoke-WebRequest -Uri $resolveUrl -Method POST -Body $rcaBody -ContentType 'application/json'
    Write-Host "  DB-SERVER resolved: " $resolve.StatusCode
}

# Find the MCP-CONTROLLER incident
$mcpItem = $jsonItems | Where-Object { $_.component_id -eq "MCP-CONTROLLER-1" } | Select-Object -First 1

if ($mcpItem) {
    $rcaBody2 = @"
{
  "rca": "MCP controller crashed due to memory leak in monitoring service.",
  "root_cause_category": "software_bug",
  "fix_applied": "Restarted MCP controller service. Cleared memory cache. Applied latest patch.",
  "prevention_steps": "1. Set up automatic service restart on failure 2. Add memory usage alerts 3. Schedule regular service restarts"
}
"@

    $resolveUrl2 = "http://localhost:5000/workitem/$($mcpItem.id)/rca"
    $resolve2 = Invoke-WebRequest -Uri $resolveUrl2 -Method POST -Body $rcaBody2 -ContentType 'application/json'
    Write-Host "  MCP-CONTROLLER resolved: " $resolve2.StatusCode
}

Write-Host ""
Write-Host "Step 4: Final Incident Status:" -ForegroundColor Cyan
$items = Invoke-WebRequest -Uri 'http://localhost:5000/workitem' -Method GET
$jsonItems = $items.Content | ConvertFrom-Json
$jsonItems | Format-Table id, component_id, status, severity, mttr -AutoSize

Write-Host ""
Write-Host "=== Simulation Complete ===" -ForegroundColor Green
Write-Host "Both incidents have been created and resolved with full RCA data."
Write-Host "Check the frontend at http://localhost:3000 to see the resolved incidents."
