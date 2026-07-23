# VoxAgent Proje Analizi

**Tarih:** Temmuz 2026

---

## 📋 Proje Özeti

**VoxAgent**, ajanslar ve kurumsal şirketler için tasarlanmış, **beyaz etiketli (white-label), çok kiracılı (multi-tenant) bir B2B SaaS platformudur.** Kullanıcıların kendi markaları altında yapay zeka destekli sesli asistanlar oluşturmasını, yönetmesini ve müşterilerine satmasını sağlar.

Kısacası: Kod yazmadan, kendi markanız altında AI telefon asistanları oluşturup yönetebileceğiniz ve müşterilerinize satabileceğiniz eksiksiz bir iş platformudur.

---

## 🎯 Ne İşe Yarar? (Hangi Problemi Çözer?)

VoxAgent şu 4 ana problemi çözer:

| # | Problem | Çözüm |
|---|---------|-------|
| 1 | **Kaçırılan Fırsatlar:** KOBİ'ler gelen aramaların %30'una kadarını kaçırır → kayıp gelir | AI asistanı 7/24 cevaplar, hiçbir arama kaçmaz |
| 2 | **Pahalı İnsan Kaynağı:** Satış/destek ekipleri büyütmek pahalı, yavaş ve yüksek iş gücü devri var | AI asistanlarıyla otomatize edilir, insan kaynağına ihtiyaç azalır |
| 3 | **Teknik Engel:** Vapi, Retell gibi AI ses API'leri geliştiriciler içindir, kod bilgisi gerektirir | Kod yazmadan, no-code arayüzle kullanılabilir |
| 4 | **Yeniden Satış Eksikliği:** Mevcut SaaS çözümleri gerçek beyaz etiket sunmaz | Kendi markanız, logonuz ve alan adınızla satış yapabilirsiniz |

---

## 🏗️ Teknoloji Yığını (Tech Stack)

### Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı | Seçim Nedeni |
|-----------|---------------|--------------|
| **Next.js 16 (App Router)** | Fullstack framework (Frontend + API) | En iyi SEO, Sunucu Bileşenleri, hızlı API rotaları |
| **Supabase** | PostgreSQL veritabanı, Auth, Storage, Realtime | Realtime Postgres, anlık API'ler, hazır Auth |
| **Tailwind CSS v4** | UI tasarımı | Hızlı UI geliştirme, utility-first yaklaşım |
| **Radix UI** | Erişilebilir UI komponentleri | A11y uyumlu, headless komponentler |
| **Framer Motion** | Animasyonlar | Akıcı, fizik tabanlı geçişler |
| **Vapi** | Yapay zeka sesli iletişim motoru | Piyasadaki en düşük gecikmeli ses yapay zekası |
| **Twilio** | Telekomünikasyon (SIP trunk, SMS/WhatsApp) | Güvenilir telekom altyapısı |
| **Stripe** | Abonelik ve ödeme yönetimi | SaaS faturalandırma için endüstri standardı |
| **Hugging Face** | RAG için metin vektörleştirme (embeddings) | Maliyet etkin açık kaynak vektörleme modelleri |
| **pgvector** | Supabase'de vektör arama (semantic search) | PostgreSQL ile native entegrasyon |

### Sistem Mimarisi

```
Frontend (Next.js 16 Client UI)
       │
       ▼
API Routes / Server Actions (Next.js)
       │
       ├──► Supabase PostgreSQL (Auth, Veri, Storage, Realtime)
       ├──► Stripe API (Ödemeler, Abonelikler)
       ├──► Vapi API (AI Ses Motoru - Çağrı Tetikleme)
       └──► Hugging Face API (Vektör Embeddings - RAG)
               │
               ▼
            Twilio (Telekomünikasyon)
               │
               ▼
            Webhook → VoxAgent (Transkript kaydı, çağrı sonuçları)
```

---

## ✨ Temel Özellikler

### 1. AI Ses Asistanları (Assistants)
- Kod yazmadan (no-code) AI asistanı oluşturma
- **Magic Prompts:** Sektöre göre hazır şablonlar (Emlak Danışmanı, Diş Kliniği, Müşteri Desteği vb.)
- **6 farklı ses:** Nova (Kadın/Enerjik), Alloy (Nötr), Echo (Erkek/Sıcak), Shimmer (Kadın/Net), Fable (İngiliz Erkek), Onyx (Kalın Erkek)
- **5 dil desteği:** Türkçe, İngilizce (ABD/İngiltere), İspanyolca, Fransızca, Almanca
- **System Prompt** ile asistan kişiliği ve davranışı belirleme
- Vapi ile otomatik senkronizasyon

### 2. Toplu Dış Arama Kampanyaları (Campaigns)
- CSV yükleyerek binlerce kişiye eşzamanlı AI araması
- Kampanya durum takibi: Draft → Running → Completed/Cancelled/Paused
- Her lead için çağrı durumu izleme (pending, calling, completed, failed, no-answer, fallback-sent)
- Kampanya detay sayfasında progress bar ve canlı güncelleme (5 saniyede bir)

### 3. Bilgi Bankası - RAG (Knowledge Base)
- PDF/TXT dosyaları yükleyerek AI'ya özel bilgi öğretme
- **Chunking:** Dosyayı anlamlı parçalara ayırma
- **Embeddings:** Hugging Face API ile vektörleştirme
- **Semantic Search:** pgvector ile anlamsal arama
- Çağrı sırasında AI en uygun bilgiyi bulur ve kullanır

### 4. Müşteri Yönetimi (Clients / Alt Müşteriler)
- Kişi rehberi (ad, telefon, e-posta, sektör, notlar)
- **Fallback Channel:** Cevaplanmayan aramalarda otomatik:
  - SMS gönderimi
  - WhatsApp mesajı gönderimi
- Fallback mesajı: *"Sizi aradık, uygun bir zamanda randevu alın."*

### 5. Beyaz Etiket (White-label) Markalama
- Kendi **logo** (sidebar'da görünür)
- Kendi **marka rengi** (hex kodu ile)
- Kendi **ajans adı** (sidebar ve fallback mesajlarında)
- **Custom domain** (ör: app.sirketiniz.com)
- Özel alan adı DNS ayarları (CNAME kaydı)

### 6. Abonelik ve Faturalandırma (Billing)

#### Plan Karşılaştırması

| Özellik | Trial (Deneme) | Starter | Growth | Pro |
|---------|---------------|---------|--------|-----|
| **Fiyat** | Ücretsiz | $99/ay | $199/ay | $299/ay |
| **Dakika/Ay** | 100 dk | 500 dk | 1.500 dk | 3.000 dk |
| **Maks. Alt Müşteri** | 2 | 3 | 15 | Sınırsız |
| **Maks. Asistan** | 1 | 1 | 5 | Sınırsız |
| **Süre** | 14 gün | - | - | - |

#### İki Kademeli Bakiye Sistemi

```
Kullanılabilir Dakika = Aylık Limit Kalanı + Ek Satın Alınan Dakikalar (Top-up)
```

1. **Aylık Limit:** Planınıza dahil olan dakika (her ay sıfırlanır, kullanılmayan yanar)
2. **Top-up Bakiye:** Satın alınan dakika paketleri (hiçbir zaman son kullanma tarihi yoktur)

#### Top-up Paketleri

| Paket | Fiyat | Dakika Başına |
|-------|-------|---------------|
| 100 Dakika | $25 | $0.25/dk |
| 500 Dakika | $100 | $0.20/dk ⭐ En Karlı |
| 1.000 Dakika | $180 | $0.18/dk |

### 7. Analitik ve Raporlama (Analytics)
- **Dashboard:** Total Calls (Month), Minutes Used, Success Rate, Active Assistants, Active Campaigns, Recent Calls
- **Çağrı Geçmişi:** Yön (inbound/outbound), durum, süre, asistan, transkript, ses kaydı
- **Canlı İzleme:** Supabase Realtime ile anlık devam eden çağrılar
- **Analytics Sayfası:** Çağrı hacmi çizgi grafiği, durum dağılımı pasta grafiği, asistan performans tablosu

---

## 👥 Hedef Kitle

| Kullanıcı | Neden İhtiyaç Duyar? |
|-----------|---------------------|
| **Pazarlama & Lead Gen Ajansları** | Müşterilere AI ses hizmeti satmak, Facebook/Google ads lead'lerini anında aramak |
| **Satış Ekipleri (BDR/SDR)** | Soğuk arama ve randevu oluşturma süreçlerini otomatize etmek |
| **Müşteri Destek Merkezleri** | 7/24 Tier 1 destek, FAQ yanıtlama, overflow yönlendirme |
| **SaaS Kurucuları & Girişimciler** | Altyapı geliştirmeden AI ses işi kurmak (haftalar yerine günler) |
| **Kurumsal Şirketler** | Dahili IT/HR yardım masası, güvenli kurumsal dağıtım |

---

## Kullanım Senaryoları

### Senaryo 1: Emlak Lead Nitelendirme
- **Problem:** Emlak ajansı Facebook'tan yüzlerce lead alıyor ama hepsini arayamıyor
- **Çözüm:** Lead'ler CSV ile yüklenir → AI asistanı hemen arar → bütçe, lokasyon, zaman sorar → randevu ayarlar
- **Sonuç:** Lead bağlantı oranında 10x artış, insan ekipler sadece sıcak lead'lerle ilgilenir

### Senaryo 2: 7/24 Diş Kliniği Resepsiyonisti
- **Problem:** Diş kliniği mesai sonrası acil aramaları kaçırıyor
- **Çözüm:** Klinik fiyat listesi PDF'i Knowledge Base'e yüklenir → AI asistanı mesai sonrası çağrıları yanıtlar
- **Sonuç:** Sıfır kaçırılan arama, acil randevular otomatik ayarlanır

---

## 🔐 Güvenlik

- **Row Level Security (RLS):** PostgreSQL seviyesinde çok kiracılı veri izolasyonu — her kullanıcı yalnızca kendi ajansının verilerini görebilir
- **AES-256-GCM Şifreleme:** Vapi API anahtarları `ENCRYPTION_SECRET` ile şifrelenmiş olarak veritabanında saklanır
- **Çevre Değişkenleri:** İstemci (`NEXT_PUBLIC_`) ve sunucu değişkenleri kesin ayrımı
- **Webhook Doğrulama:** Vapi ve Stripe webhook'ları kriptografik imza ile doğrulanır

---

## 🗄️ Veritabanı Şeması (Ana Entity'ler)

- `users`: Kullanıcı hesapları
- `agencies`: Ajans profilleri (çok kiracılı yapının temel taşı)
- `assistants`: AI asistan konfigürasyonları (ses, prompt, limitler)
- `campaigns`: Toplu arama kampanya bilgileri
- `knowledge_bases`: RAG için yüklenen belgeler ve vektör verileri
- `calls`: Arama kayıtları, durumlar, transkriptler
- `subscriptions`: Stripe abonelik verileri

---

## 📊 Proje Durumu

| Özellik | Durum | Gelecek Geliştirmeler |
|---------|-------|-----------------------|
| White-label Dashboard | ✅ Live | Custom domain routing, Custom CSS |
| Outbound Campaigns | ✅ Live | Smart retry logic, Voicemail drop |
| Knowledge Base (RAG) | ✅ Live | Web scraping, Notion entegrasyonu |
| Subscription Billing | ✅ Live | Usage-based billing (dakika başı) |
| Call Analytics | ✅ Live | Sentiment analysis, Call summaries |

---

## 🚀 Dağıtım

- **Hosting:** Vercel (Edge Network + Serverless Functions)
- **CI/CD:** ESLint + TypeScript kontrolü
- **Yerel Kurulum:**
  1. `git clone` ve `npm install`
  2. `.env.example` → `.env.local` (Supabase, Stripe, Hugging Face anahtarları)
  3. `npm run dev` → `http://localhost:3000`

---

## 📁 Proje Dosya Yapısı (Önemli Dizinler)

| Dizin | İçerik |
|-------|--------|
| `src/app/(auth)/` | Giriş/Kayıt sayfaları (login, register) |
| `src/app/(dashboard)/` | Dashboard sayfaları (dashboard, assistants, campaigns, clients, billing, analytics, calls, knowledge, settings) |
| `src/app/api/` | API route'ları (assistants, campaigns, calls, clients, knowledge, billing, analytics, webhooks) |
| `src/components/` | UI komponentleri (sidebar, calls-table, button, card, modal, select, input vb.) |
| `src/lib/` | Servis katmanı (vapi, twilio, stripe, encryption, embeddings, billing, supabase) |
| `src/types/` | TypeScript tip tanımları |
| `supabase/` | Veritabanı şeması (schema.sql), bootstrap script, nginx config |
| `testsprite_tests/` | Test planları ve test scriptleri |
| `public/screenshots/` | Dashboard ekran görüntüleri |
| `design-system/voxagent/` | Tasarım sistemi dokümantasyonu |

---

*Analiz, proje dosyaları (README.md, VOXAGENT_KULLANICI_REHBERI.md, voxagent_prd.md, package.json) incelenerek hazırlanmıştır.*