# Çağrı Denetim Paneli

Invekto PBX API üzerinden personel çağrı denetimi yapan web uygulaması.

---

## Kurulum Adımları

### 1. Supabase Kurulumu

1. [supabase.com](https://supabase.com) adresine gidin ve ücretsiz hesap açın
2. **New project** ile yeni proje oluşturun
3. Sol menüden **SQL Editor** açın
4. `supabase_schema.sql` dosyasının tamamını kopyalayıp yapıştırın ve çalıştırın
5. Sol menüden **Project Settings → API** açın
6. **Project URL** ve **anon public** key'i kopyalayın

### 2. Config Dosyasını Düzenleyin

`js/config.js` dosyasını açın:

```js
const SUPABASE_URL = "https://XXXXXXXXXXXX.supabase.co";  // Buraya Project URL
const SUPABASE_ANON_KEY = "eyXXXXXXXXXXXXXXXX";           // Buraya anon key
```

### 3. İlk Admin Kullanıcısı Oluşturma

Supabase panelinde:
1. **Authentication → Users** sayfasına gidin
2. **Invite user** ile kendinizi ekleyin
3. **SQL Editor'da** şu komutu çalıştırın (kendi email'inizi yazın):

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'sizin@emailiniz.com';
```

### 4. GitHub Kurulumu

1. GitHub'da yeni bir repository oluşturun (örn: `cagri-denetim`)
2. Tüm dosyaları bu repository'e yükleyin:

```bash
git init
git add .
git commit -m "İlk yükleme"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/cagri-denetim.git
git push -u origin main
```

### 5. GitHub Pages Aktifleştirme

1. Repository'de **Settings → Pages** açın
2. **Source**: GitHub Actions seçin
3. Birkaç dakika bekleyin
4. Siteniz `https://KULLANICI_ADI.github.io/cagri-denetim` adresinde yayında olacak

### 6. Supabase CORS Ayarı

Supabase panelinde:
1. **Authentication → URL Configuration** açın
2. **Site URL** kısmına GitHub Pages adresinizi girin:
   `https://KULLANICI_ADI.github.io`
3. **Redirect URLs** kısmına da aynı adresi ekleyin

---

## Roller

| Rol | Yetki |
|-----|-------|
| Admin | Her şey + kullanıcı yönetimi |
| Departman lideri | Her şey + kullanıcı görüntüleme |
| Denetim personeli | Dashboard, Görüşmeler, Performans, Denetim, Şüpheli |

---

## Departman Kuralları

| Departman | İlk çağrı | Öğle öncesi son | Öğle sonrası başlangıç | Gün sonu | Maks. aralık |
|-----------|-----------|-----------------|----------------------|----------|--------------|
| Dış Data | 10:15 | 13:50 | 15:15 | 18:50 | 20 dk |
| Karşılama | 11:15 | 13:45 | 15:15 | 18:45 | 30 dk |
| Dönüşüm | 10:30 | 13:50 | 15:15 | 18:50 | 30 dk |
| Yatırımlı Pasif | 10:30 | 13:50 | 15:20 | 19:00 | 20 dk |
| Retention | — | — | — | — | — |

---

## Notlar

- Invekto API'si IP bazlı kısıtlama uygular. GitHub Pages IP'si Invekto'da tanımlı olmalı.
- Supabase ücretsiz planda 50.000 aylık istek hakkı vardır.
- Veriler tarayıcıda işlenir, sunucu gerekmez.
