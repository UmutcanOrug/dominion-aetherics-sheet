# Dominion Aetherics Sheet v0.5.2 — Önkoşullu Active Aether Aktivasyonu

Üst seviye Active Aether'lara artık önkoşulları kapalıyken de tıklanabilir:

1. Gerekli alt seviyeler karaktere verilmişse açılacak kapalı seçimler **adları ve seviyeleriyle** listelenir. İç içe önkoşullar da hesaba katılır.
2. **Listedekileri aktive et** onayı, listedeki alt seçimleri ve hedef Active Aether'ı birlikte açar. **İptal** veya pencereyi kapatmak hiçbir şeyi değiştirmez.
3. Karaktere verilmemiş bir önkoşul varsa **“Şu ön gereksinimler eksik: …”** uyarısı gösterilir; hiçbir yeni seçim açılmaz. Atamayı GM, Active Aether Yöneticisi'nden yapmalıdır.

**VEYA** kuralında aktif bir alternatif varsa kullanılır. Yoksa açılabilir bir atanmış dalın zinciri onayda gösterilir; bütün alternatifler birden açılmaz. Önkoşullar zaten aktifse veya hedef önkoşulsuzsa doğrudan açılır. Silinmiş/geçersiz tanımlar GM düzeltmeden açılamaz.

Onay sırasında kurallar veya atamalar değişirse işlem yeniden kontrol edilir. Onaylanmamış ek seçimler sessizce açılmaz. Aktif seçim sınırı aşılırsa işlem reddedilir. Mevcut aktif seçimler, karakter/NPC/token ayrımı, pasifler, güç tarifleri ve SWADE Tools entegrasyonu korunur. Ham makro API'si önkoşulları kendiliğinden tamamlamaz.

**Doğrulama:** 91 otomatik test geçti. Gerçek modül akışı/şablonu bağımsız tarayıcıda sahte Actor ve DialogV2 adaptörüyle kontrol edildi; gerçek Foundry çekirdeği çalıştırılmadı.

Modülü güncelleyip istemcileri yeniden yükleyin. Manifest adresi değişmedi:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json
