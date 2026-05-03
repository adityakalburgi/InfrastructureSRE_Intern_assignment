$body = @"
{"component_id":"API-SERVER-1","message":"High CPU"}
"@

$response = Invoke-WebRequest -Uri 'http://localhost:5000/signal' -Method POST -Body $body -ContentType 'application/json'
Write-Host $response.Content
