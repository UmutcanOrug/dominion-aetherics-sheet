# Dominion Aetherics Sheet v0.5.0 — Visual Global Library

**Global Library artık karakterin Powers sekmesi gibi görünür:** solda dört renkli Active Aether seviyesi, sağda global güç ikonları. Bütün ortak katalog aynı grafikte bulunur.

- Bir düğümün üzerinde bekleyin veya klavyeyle odaklanın: doğrudan bağlantılarını görün.
- Tıklayın: düğüm sabitlenir; alttaki panel gereksinimlerini ve bağlı üst seviyeleri/güçleri gösterir. İlişkili adlara tıklayarak diğer düğümlere geçebilirsiniz.
- **Tüm bağlantıları göster** ile bütün ilişkileri açın. Normal oklar gereksinimleri, kesikli kırmızı oklar yasak seçimleri belirtir. VE/VEYA ve tam eşleşme kuralları detayda korunur; tek bağlantı, VE grubunun tek başına yeterli olduğu anlamına gelmez.
- Küçük düğmelerle Active Aether/güç düzenleyin, gereksinim ayarlayın veya silin. Güç oluşturma ve içe aktarma üstteki açılır bölümdedir.

Kütüphaneye GM olarak **Configure Settings → Dominion Aetherics Sheet → Global Kütüphane'yi aç** üzerinden de ulaşabilirsiniz. Actor'ın Powers sekmesindeki düğme yerinde durur. Settings'ten açılan katalog Actor bağlamı taşımaz; **Bu Actor'a ekle** için kütüphaneyi o Actor'ın Powers düğmesinden açın.

Katalogda düğüm seçmek yalnızca incelemedir. Karakterlerin Active Aether atamaları/aktif seçimleri, pasifleri, Item'ları ve PP değerleri korunur; büyü kullanılmaz. Yeni veriler tüm karakterlere otomatik verilmez. Dört seviyeli kurallar ve SWADE Tools entegrasyonu aynı şekilde çalışır.

Hedef: **Foundry V13 Build 351, SWADE tam olarak 5.1.0, SWADE Tools Fix 2.2.4 API**.

**Doğrulama:** 73 otomatik test geçti. Gerçek template/CSS ve bağlantı koduyla bağımsız tarayıcı önizlemesinde geniş/dar görünüm, sabit seçim, detay paneli ve yasak bağlantılar kontrol edildi. Canlı Foundry/Forge kabul testi yapılmadı.

Modülü güncelleyip istemcileri yeniden yükleyin. Manifest adresi değişmedi:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

Release assets: `module.json`, `module.zip`, `SHA256SUMS.txt`.
