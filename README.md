# Dominion Aetherics Sheet

Foundry VTT V13 / **SWADE tam olarak 5.1.0** için isteğe bağlı karakter ve NPC kağıdı. Normal NPC ve NPC Wild Card desteklenir. Yalnızca Powers sekmesinin listesini element ve güç grafiğine dönüştürür. Resmi SWADE kağıtlarını kaldırmaz, varsayılan yapmaz ve sistem dosyalarını değiştirmez.

**v0.2.1 test sürümüdür.** Hedef Foundry V13 Build 351'dir. Kullanıcı, önceki sürümün oyuncu karakterlerinde çalıştığını bildirdi; Foundry uyumluluk metadatası bu temel kullanım raporuyla `13.351` olarak belirtilmiştir. NPC desteği ve SWADE Tools entegrasyonu otomatik testlerden geçmiştir; geliştirici tarafından canlı Foundry/Forge kabul testi yapılmamıştır. SWADE 5.2+ ve Foundry 14 desteklenmez.

## Kurulum ve yeni karakterde deneme

Foundry Setup → Add-on Modules → Install Module → Manifest URL:

```text
https://github.com/UmutcanOrug/dominion-aetherics-sheet/releases/latest/download/module.json
```

1. SWADE 5.1.0 dünyanızda Manage Modules üzerinden **Dominion Aetherics Sheet** ve **SWADE Tools** modüllerini açın. Entegrasyon [swade-tools-fix 2.2.4](https://github.com/UmutcanOrug/swade-tools-fix/releases/tag/v2.2.4) API'sine göre hazırlanmıştır. Fork'un kurulum manifesti: `https://github.com/UmutcanOrug/swade-tools-fix/releases/latest/download/module.json`.
2. Bir **character** veya **npc** Actor açın ya da oluşturun. NPC'nin Wild Card seçeneğinin açık veya kapalı olması desteği etkilemez.
3. Karakterin başlığındaki **Sheet Configuration / Configure Sheet** menüsünü açın.
4. Bu Actor için **Dominion Aetherics Sheet** seçin. Dünya genelinde **Make Default / Varsayılan yap** seçeneğini işaretlemeyin.
5. Powers sekmesine geçin. Yeni, henüz Arcane Background'u olmayan karakterde de bu sekme açılır.
6. GM olarak **Element Yöneticisi** ile örneğin Hydrogen, Oxygen, Ferrum ve Carbon oluşturun. Bunlar örnektir; hiçbir element veya tarif kodda sabit değildir.
7. Orijinal **Add Power** düğmesiyle güç ekleyin veya normal SWADE Item sürükleme yolunu kullanın.
8. Gücün atom düğmesinden veya sağ tık → **Elementleri Yapılandır / Configure Elements** menüsünü açın. Elementleri işaretleyip **VE / AND** (hepsi gerekli) veya **VEYA / OR** (biri yeterli) seçin. Alttaki önizlemeyi kontrol edip kaydedin.
9. Karakter sahibi oyuncu soldaki elementleri seçebilir. Açılan güç ikonuna tıklamak **SWADE Tools büyü kullanım penceresini** açar. Zar, PP maliyeti, modifier, AoE ve template işlemlerini SWADE Tools yönetir. Tools kapalı veya API hazır değilse açıklama gösterilir; sistem sohbet kartına geçilmez.

Resmi kağıda geri dönmek için aynı Actor'ın Sheet Configuration menüsünden SWADE Official Sheet seçin. Güç Item'ları, PP değerleri ve Actor verileri dönüştürülmez. Diğer Actor'ların sheet seçimi ve aktif elementleri değişmez.

NPC'ler için de Sheet Configuration menüsünden **Dominion Aetherics Sheet** seçin. Bu seçenek SWADE Official düzenini kullanır. Mevcut NPC/Community kağıtları kayıtlı kalır; güncelleme herhangi bir Actor'ın sheet'ini kendiliğinden değiştirmez. Önceki sürümde seçeneği göremediyseniz 0.2.1'e güncelleyip istemciyi yeniden yükleyin.

Manuel kurulum: release'teki `module.zip` dosyasını `Data/modules/dominion-aetherics-sheet/` içine açın. `module.json` bu klasörün doğrudan altında olmalıdır. Forge'da manifest üzerinden kurulum için herkese açık GitHub varlıkları kullanılır; Forge'da canlı kurulum henüz doğrulanmamıştır.

## Elementler, birleşimler ve pasifler

Element tanımları dünya genelindedir; seçimler Actor'a özeldir. Her elementin sabit kimliği, adı, isteğe bağlı sembolü, görseli, sırası, açıklaması ve birden fazla pasifi olabilir. Yeniden adlandırmak tarifleri bozmaz. Silme onay ister; silinen kimlikleri kullanan güçler GM tarifleri güncelleyene kadar kilitlenir.

Her element grubunun **VE / VEYA** seçimi vardır. **Su VE Toprak** için iki element de aktif olmalıdır. **Su VEYA Toprak** için yalnız Su veya yalnız Toprak yeterlidir; normal modda ikisinin birlikte seçilmesi de geçerlidir. Ek gruplar birbirinin alternatifidir: örneğin `(Su VE Toprak) VEYA (Ateş VE Hava)`. Önizleme bu ifadeyi gösterir. GM isterse yasak elementler ve tam eşleşme kullanabilir. Tam eşleşmede VEYA grubunun yalnız bir elementinin seçili olması gerekir. Sınır varsayılan olarak yoktur; Module Settings içindeki Maximum active elements ayarıyla GM sınır koyabilir (0 = sınırsız).

0.1.0 tarifleri aynı flag şemasında kalır; güncelleme veri taşıma veya Actor seçimi sıfırlama yapmaz. Eski tek-element alternatifleri editörde otomatik olarak bir VEYA grubu halinde gösterilir. Yalnız bir element içeren grupta VE ve VEYA aynı sonucu verir.

Yapılandırılmamış güçler görünür, ayrı grupta ve kilitlidir. Module Settings'te bu gruplama değiştirilebilir. **Bu gücün element gereksinimleri var** açıkken tek bir boş **VE** grubunu kaydetmek açıkça her zaman kullanılabilir güç tanımlar. Boş VEYA grubu veya tüm grupları silmek geçerli değildir. Gereksinim kontrolü bu grafiğin kullanım düğmesinde uygulanır; açık Tools pencereleri, SWADE makroları veya başka modüllerin kullanım yolları değiştirilmez.

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

Referans aracı resmi SWADE 5.1.0 dağıtımını ve sabit commit'teki SWADE Tools 2.2.4 API kaynağını SHA256 ile doğrular; test dosyalarını `.reference/` altında tutar. Bu kaynaklar git'e veya ZIP'e eklenmez. ZIP kökünde `module.json`, modül kodu, template'ler, stiller, dil dosyaları ve belgeler bulunur.

Yeni sürüm için `package.json`, lockfile ve `module.json` sürümünü güncelleyin; `download` adresini aynı sürümün `module.zip` varlığına ayarlayın. `CHANGELOG.md` ile `docs/RELEASE-vX.Y.Z.md` ekleyin. Kontrollerden sonra commit ve `vX.Y.Z` tag'ini push edin. GitHub Actions manifest/tag uyumunu, testleri ve ZIP'i doğrulayıp release varlıklarını oluşturur. Mevcut release varlıklarının üzerine yazmaz.

`/releases/latest/download/module.json` adresinin çalışması için test sürümleri GitHub'da normal latest release olarak listelenir. Başka Foundry/SWADE sürümleri için destek iddia edilmez.

Kaynak incelemesi: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Test kapsamı ve canlı kontrol listesi: [docs/TEST-REPORT.md](docs/TEST-REPORT.md).

## English quick start

Install with the manifest above, enable this module and **SWADE Tools** (the `swade-tools-fix` fork, 2.2.4), open a **character** or **npc** Actor, and select **Dominion Aetherics Sheet** for that Actor only. Both NPC Extras and NPC Wild Cards are supported, using the system's Official layout. Leave **Make Default** unchecked. Each Power group has an explicit **AND/OR** selector and preview. Unlocked icons open SWADE Tools through `game.swadetools.item`; there is no native chat-card fallback. Existing NPC/Community sheets stay registered. Switching sheets preserves Items, resources and selections. Clear selections before disabling Dominion to remove managed passives.

This testing update targets Foundry V13 Build 351 and exactly SWADE 5.1.0. Compatibility metadata reflects the user's successful character-sheet baseline report. 39 automated tests cover characters, NPC Extras/Wild Cards, services, actual 5.1.0 Powers DOM and the pinned Tools API wrapper with mocked dialog boundaries. NPC and Tools workflows still require live acceptance; no live server was accessed by the developer.

Original module code is MIT licensed. Foundry and SWADE are separately licensed. Their source/templates/assets are reused from the installed system and are not redistributed.
