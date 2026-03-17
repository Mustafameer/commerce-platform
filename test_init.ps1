Write-Host "Waiting for Vercel deployment..."
Start-Sleep -Seconds 15

Write-Host "Calling initialization endpoint..."
$uri = "https://commerce-platform-six.vercel.app/api/init/store1-products"

try {
    $result = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Success!"
    Write-Host $result.Content
} catch {
    Write-Host "❌ Error:" $_.Exception.Message
}
