PAYLAŞIMLI (REALTIME) VERİ KURULUMU

Hedef: Herkes aynı veriyi görsün (tüm cihazlar senkron).

1) Firebase Console -> Create project
2) Firestore Database -> Create database (Test mode ile başlayabilirsin)
3) Project Settings -> Your apps -> Web app ekle
4) Config'i kopyala ve firebase_config.js içine yapıştır (PASTE_HERE alanlarını doldur)

5) Firestore Rules (Test Mode tehlikelidir)
   Minimum public demo için (Herkes okur/yazar):
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /shared/{doc} {
         allow read, write: if true;
       }
     }
   }

6) GitHub Pages'a yükle. Local file:// ile açma (CORS çıkar). Live Server / GitHub Pages kullan.

Not: Paylaşılan anahtarlar:
- mm_memories, mm_diary, mm_future, mm_specials, mm_chat, mm_chat_pinned
