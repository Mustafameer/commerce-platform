Write-Host "Waiting 40 seconds for Vercel deployment to complete..."
Start-Sleep -Seconds 40

Write-Host "Calling the initialization endpoint..."
$uri = "https://commerce-platform-six.vercel.app/api/init/store1-products"

try {
    $result = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 15
    $statusCode = $result.StatusCode
    Write-Host "Status Code: $statusCode"
    Write-Host "Response:"
    Write-Host $result.Content
} catch {
    Write-Host "Request failed"
    Write-Host "Error:" $_.Exception.Message
}
