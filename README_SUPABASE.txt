# Realtime Chat (Supabase) Kurulumu (Opsiyonel)

Bu paket, iki cihaz arasında GERÇEK ZAMANLI sohbet için Supabase desteği içerir.
Doldurmazsanız sohbet cihazda local çalışır (eski davranış).

## 1) Supabase projesi aç
- Table gerekmez (bu sürüm broadcast ile çalışır).
- Sadece Realtime Channels kullanır.

## 2) Frontend anahtarları ekle
script_plus.js içinde:
- SUPABASE_URL
- SUPABASE_ANON_KEY

## 3) CDN
index.html içinde supabase-js CDN scripti yüklüdür.

Not: Broadcast self:true açık; aynı mesaj id ile dupe engelleniyor.
