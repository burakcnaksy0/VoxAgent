# Ürün Gereksinimleri Belgesi (PRD) - VoxAgent

## 1. Proje Özeti
VoxAgent, ajanslar ve kurumsal şirketler için tasarlanmış, çok kiracılı (multi-tenant) bir B2B SaaS platformudur. Kullanıcıların kendi markaları altında (white-label) yapay zeka destekli sesli asistanlar ve dış arama (outbound) kampanyaları oluşturmalarını, yönetmelerini ve satmalarını sağlar.

## 2. Hedef Kitle
- **Pazarlama ve Lead Gen Ajansları:** Mevcut müşterilerine yapay zeka ses hizmetleri satmak için.
- **Satış Ekipleri (BDR/SDR):** Soğuk arama ve randevu oluşturma süreçlerini otomatize etmek için.
- **Müşteri Destek Merkezleri:** 7/24 Tier 1 destek sağlamak için.
- **SaaS Kurucuları & İşletmeler:** Altyapı geliştirmeden yapay zeka ses hizmeti sunmak için.

## 3. Sistem Mimarisi ve Teknoloji Yığını (Tech Stack)

### 3.1. Frontend (Kullanıcı Arayüzü)
- **Framework:** Next.js 16 (App Router)
- **Stil ve Kullanıcı Deneyimi:** Tailwind CSS v4, Framer Motion (Animasyonlar), Radix UI (Erişilebilir komponentler)
- **Mimari:** React Server Components (RSC) ağırlıklı modern, hızlı ve SEO dostu yapı. Glassmorphism tasarım dili.

### 3.2. Backend (Sunucu Tarafı)
- **API ve Sunucu Mantığı:** Next.js API Routes ve Server Actions
- **Veritabanı ve Kimlik Doğrulama:** Supabase (PostgreSQL), Supabase Auth (JWT Tabanlı Session Yönetimi)
- **Güvenlik:** Row Level Security (RLS) ile veri izolasyonu, şifrelenmiş API anahtarları (AES-256), Webhook doğrulama.

### 3.3. Entegrasyonlar ve 3. Parti Servisler
- **Yapay Zeka Ses Motoru:** Vapi API (Düşük gecikmeli sesli iletişim)
- **Telekomünikasyon:** Twilio (SIP Trunks, telefon numaraları, SMS fallback)
- **Ödeme Altyapısı:** Stripe API (SaaS abonelikleri ve kullanım bazlı faturalandırma)
- **Vektör Veritabanı ve RAG (Retrieval-Augmented Generation):** Supabase pgvector ve Hugging Face API (Metin gömme - embeddings)

## 4. Temel Özellikler ve Gereksinimler

### 4.1. Çok Kiracılı (Multi-Tenant) Yönetim Paneli
- **Gereksinim:** Ajansların kendilerine ait alt müşteriler (sub-clients) oluşturabilmesi, limitleri yönetebilmesi ve izole çalışma alanları (workspaces) sunabilmesi.
- **Durum:** Aktif.
- **Gelecek Geliştirmeler:** Özel alan adı (Custom domain) yönlendirmesi, Özel CSS entegrasyonu.

### 4.2. Dış Arama (Outbound) Kampanyaları
- **Gereksinim:** CSV formatında müşteri verilerinin yüklenerek toplu yapay zeka aramalarının tetiklenmesi. Eşzamanlı (paralel) binlerce arama kapasitesinin desteklenmesi.
- **Durum:** Aktif.
- **Gelecek Geliştirmeler:** Akıllı yeniden arama mantığı (smart retry logic), sesli mesaj bırakma (voicemail drop).

### 4.3. Bilgi Bankası (Knowledge Base - RAG)
- **Gereksinim:** Kullanıcıların PDF veya TXT dosyaları yükleyerek yapay zeka ajanlarını eğitebilmesi. Dokümanların parçalanması (chunking), vektörize edilmesi ve Supabase üzerinden anlamsal arama (semantic search) yapılması.
- **Durum:** Aktif.
- **Gelecek Geliştirmeler:** Web scraping desteği, Notion entegrasyonu.

### 4.4. Abonelik ve Faturalandırma
- **Gereksinim:** Stripe entegrasyonu ile aylık SaaS paket yönetiminin sağlanması.
- **Durum:** Aktif.
- **Gelecek Geliştirmeler:** Kullanım bazlı faturalandırma (dakika başına ücretlendirme - metered billing).

### 4.5. Analitik ve Raporlama
- **Gereksinim:** Arama geçmişi, ses kayıtları (transcripts) ve başarı metriklerinin görselleştirilmesi.
- **Durum:** Aktif.
- **Gelecek Geliştirmeler:** Duygu analizi (sentiment analysis), otomatik arama özetleri.

## 5. Veritabanı Şeması (Core Entities)
- `users`: Kullanıcı hesapları.
- `agencies`: Ajans profilleri (Çok kiracılı yapının temel taşı).
- `assistants`: Yapay zeka ajanlarının konfigürasyonları (Ses, prompt, limitler).
- `campaigns`: Toplu arama kampanya bilgileri.
- `knowledge_bases`: RAG için yüklenen belgeler ve vektör verileri.
- `calls`: Arama kayıtları, statüler, transkriptler.
- `subscriptions`: Stripe abonelik verileri.

## 6. Güvenlik ve Gizlilik
- Kiracı izolasyonu Supabase Row Level Security (RLS) ile veri tabanı seviyesinde sağlanır.
- Vapi ve diğer 3. parti API anahtarları veritabanında şifrelenmiş (AES-256) olarak saklanır (`ENCRYPTION_SECRET` ile).
- Sunucu ile istemci arasında sadece güvenli HTTP (HTTPS) kullanılır, hassas değişkenler (`.env.local` üzerindeki secret keyler vb.) sadece sunucu (Server Actions / API Routes) tarafında işlenir.
- Webhook'lar kriptografik imza ile doğrulanır.

## 7. Dağıtım ve DevOps
- **Hosting:** Vercel (Edge Network ve Serverless Functions mimarisi optimize edilmiş).
- **CI/CD:** GitHub Actions (Linting, TypeScript kontrolü `eslint` ve `tsc` ile).
- **Test Stratejisi:** Statik analiz (ESLint, TSC), uçtan uca (E2E) manuel QA, ileride Playwright ile otomatik E2E UI testleri eklenecektir.

## 8. Sınırlamalar ve Varsayımlar
- Kullanıcıların kendi Vapi ve OpenAI/Hugging Face API anahtarlarını getireceği varsayılmaktadır.
- Mevcut arama eşzamanlılık (concurrency) kapasitesi Vapi'nin dahili kuyruk sistemine ve limitlerine bağlıdır.
- Inbound aramalar için telefon numarası tahsisi VoxAgent arayüzü üzerinden direkt yapılmamakta; Vapi/Twilio paneli üzerinden yapılandırılmaktadır. (Gelecek versiyonlarda eklenecektir.)
