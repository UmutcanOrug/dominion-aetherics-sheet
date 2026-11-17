# Dominion Aetherics Sheet v0.4.0 — Four Active Aether Levels

## Yeni düzen

Elementlerin yeni adı **Active Aether**. Soldan sağa dört kompakt sütun bulunur: **1 turuncu, 2 lacivert, 3 mor, 4 cyan**. Güçler sağdaki yeşil alanda kalır. Dar kağıtlarda yatay kaydırma kullanılır; seviyeler alt alta taşınmaz.

## Seviye ve önkoşul ayarı

1. Powers → **Global Kütüphane** → bir Active Aether'ı düzenleyin.
2. **Active Aether seviyesi** alanından 1–4 seçin.
3. İsterseniz **Aktif alt seviye Active Aether seçimleri gereksin** seçeneğini açın. Yalnız daha düşük seviyeler seçilebilir: 2 için 1; 3 için 1/2; 4 için 1/2/3.
4. **VE** bütün seçilen önkoşulları, **VEYA** herhangi birini gerektirir. Seçeneği kapatmak önkoşulsuz kullanım sağlar; bu, üst seviyelerde de geçerlidir.
5. **Active Aether Yöneticisi** ile bu Actor'a gerekli tanımları ayrıca atayın. Oyuncu alt seçimleri açtıktan sonra üst seviyeyi açabilir.

Gerekli bir alt seçim kapanırsa ona bağlı üst seviyeler ve artık sağlanmayan pasifleri de kapanır; güç kilitleri güncellenir. VEYA kuralında başka bir aktif alternatif kaldığında üst seçim korunur. Önkoşullar kendiliğinden atanmaz/açılmaz; şartı tekrar sağlamak kapanmış üst seçimleri otomatik açmaz.

## Korunan veriler ve entegrasyon

Eski tanımlar **1. seviye, önkoşulsuz** olarak görünür. Sabit kimlikler, Actor'a özel atamalar, mevcut aktif seçimler ve büyü tarifleri korunur. Sheet varsayılanı değişmez; Item ve PP verileri dönüştürülmez. Character, NPC ve NPC Wild Card desteği sürer. Güç kullanımı yine SWADE Tools penceresine gider.

Global Kütüphane'ye eklemek hiçbir Actor'a otomatik atama yapmaz. Kullanımdaki bir tanımın seviyesi bağımlılarını geçersiz kılacaksa kaydetme reddedilir. Silinmiş bir önkoşula bağlı tanımlar GM yeniden yapılandırana kadar kilitlenir. 0.4.0 öncesi sürümler yeni seviye önkoşullarını uygulamaz.

Hedef: **Foundry V13 Build 351, SWADE tam olarak 5.1.0, SWADE Tools Fix 2.2.4 API**.

**Doğrulama:** 69 otomatik test geçti. Gerçek modül template/CSS dosyalarıyla bağımsız tarayıcı önizlemesinde geniş/dar düzen ve editör incelendi. Canlı Foundry/Forge kabul testi yapılmadı; test sınırları `docs/TEST-REPORT.md` içinde açıklanır.

Güncelleyip istemcileri yeniden yükleyin. Kurulum manifesti değişmedi:

https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json

Release assets: `module.json`, `module.zip`, `SHA256SUMS.txt`.
