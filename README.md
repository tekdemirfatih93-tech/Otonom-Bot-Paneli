# 🤖 Otonom Bot Paneli v2.0

> **AI-Powered Autonomous Bot Panel** with Self-Healing Capabilities  
> Local AI (Ollama) | Captcha Solver | Anti-Bot Bypass | No API Required!

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v24%2B-green)
![Status](https://img.shields.io/badge/status-beta-yellow)

---

## 🌟 Özellikler

### ✨ Ana Yetenekler
- **🧠 Local AI (Ollama):** API key gerektirmez, tamamen offline çalışır
- **🔐 Captcha Solver:** Vision AI ile otomatik captcha çözme (reCAPTCHA, hCaptcha, text)
- **🛡️ Anti-Bot Bypass:** Stealth mode + gerçekçi insan davranışı simülasyonu
- **🔧 Self-Healing:** Hataları otomatik tespit edip düzeltir, kendini geliştirir
- **💻 Modern UI:** React 19 + TypeScript + Real-time dashboard
- **📊 WebSocket Streaming:** Canlı log takibi ve durum güncellemeleri
- **🗄️ SQLite Database:** Öğrenme verisi ve log history

### 🎯 Desteklenen Platformlar
- ✅ Coinpayu
- ✅ CashStars  
- ✅ Kolayca genişletilebilir site adaptör sistemi

---

## 📦 Kurulum

### Gereksinimler
- ✅ Windows 10/11 (veya Linux/Mac)
- ✅ Node.js v24 veya üzeri
- ✅ ~20 GB boş disk alanı (AI modelleri için)
- ✅ Minimum 8 GB RAM (16 GB önerilir)

### Adım 1: Projeyi İndirin
```bash
git clone https://github.com/tekdemirfatih93-tech/Otonom-Bot-Paneli.git
cd Otonom-Bot-Paneli-v2
```

### Adım 2: Dependencies Kurun
```bash
npm run install:all
```

Bu komut:
- Root dependencies
- Frontend (React, Vite, TypeScript)
- Backend (Express, Playwright, Ollama client, SQLite)

kurulumlarını otomatik yapacak.

### Adım 3: Ollama'yı Kurun

**Windows:**
```powershell
# Manuel kurulum
# 1. https://ollama.com/download adresinden Ollama'yı indirin
# 2. Kurulumu tamamlayın
# 3. PowerShell'de modelleri indirin:

ollama pull llama3.2-vision:11b
ollama pull deepseek-r1:7b
ollama pull qwen2.5-coder:7b
```

**Linux/Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2-vision:11b
ollama pull deepseek-r1:7b
ollama pull qwen2.5-coder:7b
```

### Adım 4: Environment Ayarları
```bash
cd backend
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/Mac
```

`.env` dosyasını düzenleyin:
```env
PORT=3000

# Ollama (default değerler çalışır)
OLLAMA_HOST=http://localhost:11434
VISION_MODEL=llama3.2-vision:11b
REASONING_MODEL=deepseek-r1:7b
CODER_MODEL=qwen2.5-coder:7b

# Site Credentials
COINPAYU_USERNAME=sizin_kullanici_adiniz
COINPAYU_PASSWORD=sizin_sifreniz
```

### Adım 5: Database Oluştur
```bash
cd ..
# Database otomatik oluşturulur, manuel oluşturmak isterseniz:
# sqlite3 database/app.db < database/schema.sql
```

### Adım 6: Çalıştırın! 🚀
```bash
npm run dev
```

Bu komut hem frontend hem backend'i aynı anda başlatır:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

---

## 📖 Kullanım

### İlk Kurulum Sonrası

1. **Dashboard'a Giriş:**
   - Tarayıcınızda `http://localhost:5173` adresini açın
   - Modern bir bot yönetim paneli görüntülenecek

2. **Site Ekleyin:**
   - "Asistan Ekle" butonuna tıklayın
   - Site adını girin (örn: `coinpayu.com`)
   - Kullanıcı adı ve şifrenizi girin
   - "Giriş Yap ve Ekle" butonuna tıklayın

3. **Bot'u Başlatın:**
   - Eklediğiniz sitenin yanındaki "Başlat" butonuna tıklayın
   - Bot otomatik olarak:
     - ✅ Siteye giriş yapar
     - ✅ Captcha varsa AI ile çözer
     - ✅ Görevleri tarar ve en karlısını seçer
     - ✅ İnsan gibi davranarak görevleri tamamlar
     - ✅ Hata oluşursa kendi kendine düzeltir

4. **Log Takibi:**
   - Sağ taraftaki "Aktivite Günlüğü" panelinde tüm işlemler gerçek zamanlı görünür
   - Her işlem timestamp ile kaydedilir

---

## 🛠️ Teknolojiler

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type safety
- **Vite** - Ultra-fast build tool
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful icons

### Backend
- **Node.js + Express** - REST API server
- **Playwright Extra** - Browser automation with stealth plugins
- **Ollama** - Local AI inference (no API keys!)
- **Better-SQLite3** - Fast embedded database
- **Winston** - Advanced logging
- **Sharp** - Image processing for captcha solving

### AI Models (Local via Ollama)
- **Llama 3.2 Vision (11B)** - Visual captcha analysis
- **DeepSeek-R1 (7B)** - Error reasoning and strategy planning
- **Qwen2.5-Coder (7B)** - Automatic code patching

---

## 🏗️ Proje Yapısı

```
Otonom-Bot-Paneli-v2/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── ChatBot.tsx
│   │   │   └── ...
│   │   ├── hooks/              # Custom hooks
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── ai/                 # AI integrations
│   │   │   ├── ollama.js       # Ollama client
│   │   │   └── captcha-solver.js
│   │   ├── browser/            # Playwright automation
│   │   │   ├── behavior.js     # Human-like actions
│   │   │   └── ...
│   │   ├── database/           # SQLite
│   │   │   └── init.js
│   │   ├── self-healing/       # Auto error fixing
│   │   ├── sites/              # Site adapters
│   │   │   └── cashstars.js
│   │   ├── tasks/              # Task runners
│   │   ├── server.js           # Express server
│   │   └── ...
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql              # Database schema
│   └── app.db                  # SQLite database (auto-generated)
│
├── docs/                        # Documentation
├── scripts/                     # Setup scripts
├── package.json                 # Root package.json
└── README.md                    # This file!
```

---

## 🔧 Gelişmiş Kullanım

### API Endpoints

#### Health Check
```bash
GET /api/health
```

#### Site Listesi
```bash
GET /api/sites
```

#### Site Ekle
```bash
POST /api/sites
Content-Type: application/json

{
  "name": "Coinpayu",
  "baseUrl": "https://www.coinpayu.com",
  "credentials": {
    "username": "...",
    "password": "..."
  }
}
```

#### Bot Başlat/Durdur
```bash
POST /api/start/:siteId
POST /api/stop/:siteId
```

### WebSocket Events

Frontend, `ws://localhost:3000` üzerinden real-time log'ları alır:

```javascript
{
  "type": "log",
  "level": "info",
  "message": "Captcha solved successfully",
  "timestamp": "2025-11-08T13:15:00Z",
  "site": "coinpayu"
}
```

---

## 🤝 Katkıda Bulunun

Pull request'ler memnuniyetle karşılanır!

### Geliştirme Adımları

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Yeni Site Adaptörü Eklemek

`backend/src/sites/` altına yeni bir dosya oluşturun:

```javascript
// backend/src/sites/yeni-site.js
import { BaseSiteAdapter } from './base-adapter.js';

export class YeniSiteAdapter extends BaseSiteAdapter {
  constructor(page, errorMonitor, captchaSolver) {
    super(page, errorMonitor, captchaSolver);
    this.baseUrl = 'https://www.yeni-site.com';
  }

  async login(credentials) {
    return await this.withRetry(async () => {
      // Login logic...
    });
  }

  async performTask(taskType) {
    // Task logic...
  }
}
```

---

## 📝 Lisans

MIT License - Herkes özgürce kullanabilir!

---

## ⚠️ Yasal Uyarı

Bu proje **eğitim amaçlıdır**. Kullanırken:
- ✅ Sitenin Terms of Service (TOS) kurallarına uyun
- ✅ Rate limiting ve etik kullanım prensiplerini gözetin
- ❌ Spamming veya kötüye kullanım yapmayın

---

## 🐛 Sorun Giderme

### Ollama bağlantı hatası
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```
**Çözüm:** Ollama servisinin çalıştığından emin olun:
```bash
ollama serve    # Başlat
ollama list     # Modelleri kontrol et
```

### Database hatası
```
Error: SQLITE_CANTOPEN
```
**Çözüm:** Database dizinini kontrol edin:
```bash
mkdir -p database
chmod 755 database
```

### Port zaten kullanımda
```
Error: listen EADDRINUSE :::3000
```
**Çözüm:** `.env` dosyasında farklı bir port belirleyin:
```env
PORT=3001
```

---

## 📧 İletişim

- **GitHub:** [tekdemirfatih93-tech](https://github.com/tekdemirfatih93-tech)
- **Issues:** [GitHub Issues](https://github.com/tekdemirfatih93-tech/Otonom-Bot-Paneli/issues)

---

## 🎉 Teşekkürler

Bu proje şu açık kaynak projelere borçludur:
- [Ollama](https://ollama.com/) - Local AI inference
- [Playwright](https://playwright.dev/) - Browser automation
- [React](https://react.dev/) - UI framework
- Tüm contributors'lara teşekkürler! 🙏

---

<div align="center">

**⭐ Beğendiyseniz yıldız vermeyi unutmayın! ⭐**

Made with ❤️ by [tekdemirfatih93-tech](https://github.com/tekdemirfatih93-tech)

</div>
