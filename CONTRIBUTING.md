# 🤝 Katkıda Bulunma Rehberi

Otonom Bot Paneli v2.0 açık kaynak bir projedir ve topluluk katkılarını memnuniyetle karşılıyoruz!

## 📋 Katkı Türleri

- **Bug Raporları:** Hataları GitHub Issues'da bildirin
- **Özellik Önerileri:** Yeni fikirlerinizi paylaşın
- **Kod Katkıları:** Pull request gönderin
- **Dokümantasyon:** README ve docs'u iyileştirin
- **Çeviriler:** Yeni dil desteği ekleyin

## 🚀 Başlangıç

1. **Fork** edin
2. **Clone** edin: `git clone https://github.com/YOUR_USERNAME/Otonom-Bot-Paneli.git`
3. **Branch** oluşturun: `git checkout -b feature/amazing-feature`
4. **Değişiklik** yapın ve **test** edin
5. **Commit** edin: `git commit -m 'feat: add amazing feature'`
6. **Push** edin: `git push origin feature/amazing-feature`
7. **Pull Request** açın

## 📝 Commit Mesajları

Conventional Commits formatını kullanın:

- `feat:` Yeni özellik
- `fix:` Bug fix
- `docs:` Dokümantasyon
- `style:` Kod formatı
- `refactor:` Kod iyileştirme
- `test:` Test ekleme
- `chore:` Diğer değişiklikler

Örnek:
```
feat: add hCaptcha support to captcha solver
fix: resolve database connection timeout
docs: update installation guide for Linux
```

## 🎯 Yeni Site Adaptörü Eklemek

1. `backend/src/sites/` altına yeni dosya:
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
      // Login implementation
    });
  }

  async performTask(taskType) {
    // Task implementation
  }
}
```

2. `runnerManager.js`'e ekleyin
3. Test edin
4. Pull Request gönderin

## ✅ Code Review Süreci

Pull request'iniz:
- Kod kalitesi kontrol edilir
- Testler çalıştırılır
- Dokümantasyon kontrol edilir
- En az 1 maintainer tarafından onaylanır

## 🐛 Bug Raporu Şablonu

```markdown
**Bug Açıklaması:**
Kısa ve net açıklama

**Adımlar:**
1. ...
2. ...

**Beklenen Davranış:**
Ne olmalıydı?

**Gerçek Davranış:**
Ne oldu?

**Ortam:**
- OS: Windows 11
- Node: v24.0.0
- Ollama: v0.1.0

**Log/Screenshot:**
[ekleyin]
```

## 🎨 Kod Stili

- **JavaScript/TypeScript:** ESLint kurallarına uyun
- **Naming:** camelCase (değişkenler), PascalCase (sınıflar)
- **Comments:** Karmaşık logic'i açıklayın
- **Error Handling:** try-catch kullanın

## 🧪 Testing

Değişikliklerinizi test edin:
```bash
# Backend test
cd backend
npm test

# Manuel test
npm run dev
```

## 📚 Dokümantasyon

- README.md güncelleyin
- Yeni özellikleri belgeleyin
- API değişikliklerini not edin
- Örnekler ekleyin

## ❓ Sorular?

- GitHub Discussions'da sorun
- Issue açın
- Discord'a katılın (opsiyonel)

---

**Teşekkürler! ❤️**

Katkılarınız projeyi daha iyi hale getirir!
