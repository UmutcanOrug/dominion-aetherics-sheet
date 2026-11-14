# Dominion Aetherics Sheet

Foundry VTT V13 / **SWADE tam olarak 5.1.0** için isteğe bağlı karakter kağıdı. Yalnızca Powers sekmesinin listesini element ve güç grafiğine dönüştürür. Resmi SWADE kağıdını kaldırmaz, varsayılan yapmaz ve sistem dosyalarını değiştirmez.

**v0.1.0 test alfasıdır.** Hedef Foundry V13 Build 351'dir. Otomatik servis/DOM testleri çalıştırılmıştır; canlı Foundry/Forge kabul testleri henüz yapılmamıştır. Bu nedenle manifestte `verified` alanı bilerek belirtilmemiştir. SWADE 5.2+ ve Foundry 14 desteklenmez; uyumsuz sürümde alternatif sheet kaydedilmez.

## Kurulum ve yeni karakterde deneme

Foundry Setup → Add-on Modules → Install Module → Manifest URL:

```text
https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json
```

1. SWADE 5.1.0 dünyanızda Manage Modules üzerinden **Dominion Aetherics Sheet** modülünü açın.
2. Yeni bir **character** Actor oluşturun. NPC kağıtları bu modülün kapsamı dışındadır.
3. Karakterin başlığındaki **Sheet Configuration / Configure Sheet** menüsünü açın.
4. Bu Actor için **Dominion Aetherics Sheet** seçin. Dünya genelinde **Make Default / Varsayılan yap** seçeneğini işaretlemeyin.
5. Powers sekmesine geçin. Yeni, henüz Arcane Background'u olmayan karakterde de bu sekme açılır.
6. GM olarak **Element Yöneticisi** ile örneğin Hydrogen, Oxygen, Ferrum ve Carbon oluşturun. Bunlar örnektir; hiçbir element veya tarif kodda sabit değildir.
7. Orijinal **Add Power** düğmesiyle güç ekleyin veya normal SWADE Item sürükleme yolunu kullanın.
8. Gücün atom düğmesinden veya sağ tık → **Elementleri Yapılandır / Configure Elements** menüsünden bir birleşim seçin ve kaydedin.
9. Karakter sahibi oyuncu soldaki elementleri seçebilir. Açılan güç ikonuna tıklamak SWADE'nin orijinal sohbet kartını açar; zar, PP maliyeti, modifier ve template işlemleri sistemin o kartındaki kontrollerle yapılır.

Resmi kağıda geri dönmek için aynı Actor'ın Sheet Configuration menüsünden SWADE Official Sheet seçin. Güç Item'ları, PP değerleri ve Actor verileri dönüştürülmez. Diğer Actor'ların sheet seçimi ve aktif elementleri değişmez.

Manuel kurulum: release'teki `module.zip` dosyasını `Data/modules/dominion-aetherics-sheet/` içine açın. `module.json` bu klasörün doğrudan altında olmalıdır. Forge'da manifest üzerinden kurulum için herkese açık GitHub varlıkları kullanılır; Forge'da canlı kurulum henüz doğrulanmamıştır.

## Elementler, birleşimler ve pasifler

Element tanımları dünya genelindedir; seçimler Actor'a özeldir. Her elementin sabit kimliği, adı, isteğe bağlı sembolü, görseli, sırası, açıklaması ve birden fazla pasifi olabilir. Yeniden adlandırmak tarifleri bozmaz. Silme onay ister; silinen kimlikleri kullanan güçler GM tarifleri güncelleyene kadar kilitlenir.

Her birleşimde seçili elementlerin **tamamı** gerekir. Alternatif birleşimler **VEYA** ile değerlendirilir. Ek aktif elementlere normalde izin verilir. GM isterse yasak elementler ve tam eşleşme kullanabilir. Sınır varsayılan olarak yoktur; Module Settings içindeki Maximum active elements ayarıyla GM sınır koyabilir (0 = sınırsız).

Yapılandırılmamış güçler görünür, ayrı grupta ve kilitlidir. Module Settings'te bu gruplama değiştirilebilir. **Bu gücün element gereksinimleri var** açıkken tek bir boş birleşimi kaydetmek açıkça her zaman kullanılabilir güç tanımlar. Tüm birleşimleri silmek geçerli yapılandırma değildir. Gereksinim kontrolü bu grafiğin kullanım düğmesinde uygulanır; SWADE makroları veya başka modüllerin kullanım yolları değiştirilmez.

Açıklamalı pasifler yalnızca başlık ve metindir. Mekanik pasif için önceden doğru yapılandırılmış bir Active Effect seçin veya UUID'sini yapıştırıp **Seçilen efekti ekle** düğmesine basın. GM onaylı efekt verisi dünya kayıtlarında saklanır; oyuncunun kaynak Actor'a erişmesi gerekmez. Aynı efekt UUID'sini birden fazla element kullanırsa tek kopya uygulanır ve son sağlayıcı kapatılana kadar kalır. Farklı kaynak UUID'leri farklı efektler kabul edilir.

Pasif kopyalar seçim süresince etkindir: kaynak efektin süre ve SWADE tur sonu/tur başı expiration ayarları kopyaya aktarılmaz. Kaynak efektin gerçek `changes`, türü ve diğer uyumlu verileri yeniden kullanılır. İstatistik yolları modül tarafından uydurulmaz. Efekt şablonu değişirse element editöründen kaldırıp tekrar ekleyerek kayıtlı kopyayı güncelleyin. SWADE'nin otomatik ilişkili durum efektleri oluşturan kaynakları reddedilir; bunların bağımsız bileşenlerini ayrı ayrı atayın. Böylece izlenmeyen ek efektler bırakılmaz.

**Sheet değiştirmek element seçimlerini ve aktif pasifleri sıfırlamaz.** Pasifleri kaldırmak için elementleri kapatın. Modülü devre dışı bırakmadan önce aktif elementleri temizleyin; modül kapalıyken seçili pasifleri yöneten kod çalışmaz. İlgisiz Active Effect'lere dokunulmaz. Element seçimi PP tüketmez.

## Güvenli entegrasyon

- `game.swade.sheets.CharacterSheet` sınıfından ApplicationV1 kalıtımı; resmi template ve header kontrolleri korunur.
- Powers içindeki orijinal Add Power ve tüm PP havuzlarının DOM elemanları, SWADE event listener'ları bağlanmadan önce korunup grafik üzerine taşınır.
- Diğer sekmeler ve form alanları aynı sistem şablonundan gelir. Global CSS, prototip veya belge modeli değiştirilmez.
- Güçler mevcut embedded SWADE Item'lardır; tarifler Item flag'lerinde saklanır.
- Element seçimleri `flags.dominion-aetherics-sheet.activeElements`, şema sürümü ayrı `schemaVersion` flag'inde saklanır.
- Bağımsız token Actor referansı olduğu gibi kullanılır; `game.actors.get(actor.id)` ile ana Actor'a dönüştürülmez.
- Efektler `managed`, `actorUuid`, `sourceUuid`, `providers` ve `schemaVersion` flag'leriyle izlenir. Tek bir aktif GM (GM yoksa aktif Actor sahibi) arka plan efekt güncellemelerini yapar.
- İzinler API'de de kontrol edilir. Yerel hızlı tıklamalar Actor bazında sıraya alınır. Farklı tarayıcılardan aynı Actor'ın aynı anda değiştirilmesi Foundry'nin son güncelleme davranışına tabidir.

## Macro API

```js
const api = game.modules.get("dominion-aetherics-sheet").api;
const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character;

api.getElements();                         // cloned definitions; effects return UUID/name metadata
api.getActiveElements(actor);              // element IDs
await api.setActiveElements(actor, ["ID1", "ID2"]); // owner or GM, validates IDs and limit
api.getAvailablePowers(actor);              // existing SWADE Power Item documents
api.getPowerRequirements(actor.items.get("POWER_ID"));
api.isPowerAvailable(actor, actor.items.get("POWER_ID"));
api.openElementManager();                  // GM only
api.openPowerRequirements(actor.items.get("POWER_ID")); // GM only

// Remove the selected Actor's elemental passives through the normal service:
await api.setActiveElements(actor, []);
```

Tanımsız kurallar `null`, geçersiz/eski tarifler `{ invalid: true }` döner. Geçerli gereksinimler `{ schemaVersion: 1, recipes: [["ID1", "ID2"], ["ID3"]], forbidden: [], exact: false }` biçimindedir. Yapılandırma için UI kullanılması önerilir. GM yokken ilk aktif sahibin efekt senkronizasyonu yapması nedeniyle başka oyuncunun kendi Actor'ı üzerindeki API çağrısı efektler tamamlanmadan dönebilir; belge güncellemeleri tüm istemcilere Foundry üzerinden ulaşır.

## Geliştirme ve release

Node 24 kullanın. Çalışma zamanında modülün hiçbir npm bağımlılığı yoktur. Geliştirme bağımlılıkları test ve paketleme içindir.

```sh
npm ci
node tools/fetch-reference.mjs
npm run check
npm test
npm run build
```

Referans aracı resmi SWADE 5.1.0 dağıtımını SHA256 ile doğrular ve test için yalnızca gereken manifest/partial dosyalarını `.reference/` altına çıkarır. Bu dosyalar git'e veya ZIP'e eklenmez. ZIP kökünde `module.json`, modül kodu, template'ler, stiller, dil dosyaları ve belgeler bulunur.

Yeni sürüm için `package.json`, lockfile ve `module.json` sürümünü güncelleyin; `download` adresini aynı sürümün `module.zip` varlığına ayarlayın. `CHANGELOG.md` ile `docs/RELEASE-vX.Y.Z.md` ekleyin. Kontrollerden sonra commit ve `vX.Y.Z` tag'ini push edin. GitHub Actions manifest/tag uyumunu, testleri ve ZIP'i doğrulayıp release varlıklarını oluşturur. Mevcut release varlıklarının üzerine yazmaz.

`/releases/latest/download/module.json` adresinin çalışması için bu **test alfası GitHub'da normal latest release olarak listelenir**; kalite durumu başlıkta ve notlarda Initial Alpha olarak belirtilir. Başka Foundry/SWADE sürümleri için destek iddia edilmez.

Kaynak incelemesi: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Test kapsamı ve A–J canlı kontrol listesi: [docs/TEST-REPORT.md](docs/TEST-REPORT.md).

## English quick start

Install with the manifest above, enable the module, create a fresh **character** Actor, and select **Dominion Aetherics Sheet** for that Actor only in Sheet Configuration. Leave **Make Default** unchecked. Use the Powers tab's Element Manager as GM, add existing SWADE Power Items, and configure their recipes with the atom button or right-click menu. Owners select elements; unlocked icons call SWADE's existing `item.show()` workflow. Switching back to the official sheet preserves Items, resources and selections. Clear selections before disabling the module if you want its managed passives removed.

This is an initial alpha targeting Foundry V13 Build 351 and exactly SWADE 5.1.0. Automated service and DOM tests passed against the distributed 5.1.0 Powers partial with mocked Foundry documents; live Foundry/Forge installation, rolls, multiplayer and other-module integration still need the documented acceptance tests.

Original module code is MIT licensed. Foundry and SWADE are separately licensed. Their source/templates/assets are reused from the installed system and are not redistributed.
