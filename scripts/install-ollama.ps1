# Otonom Bot Paneli v2.0 - Ollama Kurulum Scripti
# Windows için otomatik kurulum

Write-Host "🤖 Otonom Bot Paneli v2.0" -ForegroundColor Cyan
Write-Host "Ollama AI Kurulumu Başlatılıyor...`n" -ForegroundColor Cyan

# Ollama kurulu mu kontrol et
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "✅ Ollama zaten kurulu!" -ForegroundColor Green
    $ollamaVersion = ollama --version
    Write-Host "   Versiyon: $ollamaVersion`n" -ForegroundColor Gray
} else {
    Write-Host "📥 Ollama indiriliyor..." -ForegroundColor Yellow
    
    $OllamaUrl = "https://ollama.com/download/OllamaSetup.exe"
    $InstallerPath = "$env:TEMP\OllamaSetup.exe"
    
    try {
        Invoke-WebRequest -Uri $OllamaUrl -OutFile $InstallerPath -UseBasicParsing
        Write-Host "✅ Ollama indirildi`n" -ForegroundColor Green
        
        Write-Host "🔧 Ollama kuruluyor..." -ForegroundColor Yellow
        Start-Process -FilePath $InstallerPath -Wait
        
        Write-Host "✅ Ollama kurulumu tamamlandı!`n" -ForegroundColor Green
        
        # PATH'i güncelle
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
    } catch {
        Write-Host "❌ Ollama kurulumu başarısız: $_" -ForegroundColor Red
        Write-Host "`nManuel kurulum için: https://ollama.com/download" -ForegroundColor Yellow
        exit 1
    }
}

# Ollama servisini başlat
Write-Host "🔄 Ollama servisi başlatılıyor..." -ForegroundColor Yellow
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden -PassThru | Out-Null
Start-Sleep -Seconds 3

# AI modellerini indir
Write-Host "`n📦 AI Modelleri İndiriliyor...`n" -ForegroundColor Cyan

$models = @(
    @{name="llama3.2-vision:11b"; desc="Vision Model (Captcha Solver)"; size="~7 GB"},
    @{name="deepseek-r1:7b"; desc="Reasoning Model (Error Analysis)"; size="~4 GB"},
    @{name="qwen2.5-coder:7b"; desc="Coder Model (Code Patching)"; size="~4 GB"}
)

foreach ($model in $models) {
    Write-Host "⬇️  $($model.desc)" -ForegroundColor Yellow
    Write-Host "   Model: $($model.name) | Boyut: $($model.size)" -ForegroundColor Gray
    
    try {
        ollama pull $model.name
        Write-Host "   ✅ $($model.name) indirildi`n" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $($model.name) indirilemedi: $_`n" -ForegroundColor Red
    }
}

# Kurulumu doğrula
Write-Host "`n🔍 Kurulum Kontrolü..." -ForegroundColor Cyan
$installedModels = ollama list

if ($installedModels) {
    Write-Host "✅ Yüklü Modeller:" -ForegroundColor Green
    Write-Host $installedModels -ForegroundColor Gray
} else {
    Write-Host "⚠️  Model listesi alınamadı" -ForegroundColor Yellow
}

Write-Host "`n✅ Ollama kurulumu tamamlandı!" -ForegroundColor Green
Write-Host "`n💡 Sonraki Adımlar:" -ForegroundColor Cyan
Write-Host "   1. Backend klasöründe .env dosyasını yapılandırın" -ForegroundColor White
Write-Host "   2. 'npm run dev' komutu ile uygulamayı başlatın" -ForegroundColor White
Write-Host "`nİyi çalışmalar! 🚀`n" -ForegroundColor Cyan
