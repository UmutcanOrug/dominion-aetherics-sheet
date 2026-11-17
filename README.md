# Dominion Aetherics Sheet

Foundry VTT V13 / **SWADE tam olarak 5.1.0** için isteğe bağlı karakter ve NPC kağıdı. Normal NPC ve NPC Wild Card desteklenir. Powers sekmesinde dört seviyeli **Active Aether** sütunları ve sağda güçler bulunur. Resmi SWADE kağıtlarını kaldırmaz, varsayılan yapmaz ve sistem dosyalarını değiştirmez.

**v0.4.0 test sürümüdür.** Elementlerin yeni adı Active Aether'dır. Dört seviye ve isteğe bağlı alt seviye etkinleştirme şartları eklenmiştir. Hedef Foundry V13 Build 351'dir; `verified` metadatası kullanıcının önceki temel kullanım raporuna dayanır. 69 otomatik test ve bağımsız tarayıcı düzen önizlemesi geçmiştir; canlı Foundry/Forge kabul testi yapılmamıştır. SWADE 5.2+ ve Foundry 14 desteklenmez.

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
6. GM olarak Powers'ta **Active Aether Yöneticisi'nin yanındaki Global Kütüphane** düğmesini açın. Active Aethers bölümünden ortak tanımları oluşturun. Editörde **1–4 seviyesini** seçin; gerekiyorsa alt seviyelerden etkinleştirme önkoşulları ekleyin. Bunlar otomatik olarak hiçbir Actor'a verilmez.
7. **Active Aether Yöneticisi** ile bu Actor'ın sahip olacağı Active Aether'ları işaretleyip kaydedin. Gerekli alt seviye tanımlarını da ayrıca verin. Büyüler için Global Kütüphane'nin Powers bölümünden şablon oluşturabilir, mevcut Actor/compendium büyüsünü içe aktarabilir ve **Bu Actor'a ekle** ile kopyalayabilirsiniz. Orijinal Add Power ve SWADE Item sürükleme de çalışır.
8. Gücün atom düğmesinden veya sağ tık → **Active Aether gereksinimleri / Configure Active Aethers** menüsünü açın. Gereksinimleri işaretleyip **VE / AND** (hepsi gerekli) veya **VEYA / OR** (biri yeterli) seçin. Alttaki önizlemeyi kontrol edip kaydedin.
9. Karakter sahibi oyuncu soldaki dört sütundan Active Aether'larını etkinleştirir. Önkoşulu sağlanmayan düğmeler kilitlidir. Sağda açılan güç ikonuna tıklamak **SWADE Tools büyü kullanım penceresini** açar. Zar, PP maliyeti, modifier, AoE ve template işlemlerini SWADE Tools yönetir. Tools kapalı veya API hazır değilse açıklama gösterilir; sistem sohbet kartına geçilmez.

Resmi kağıda geri dönmek için aynı Actor'ın Sheet Configuration menüsünden SWADE Official Sheet seçin. Güç Item'ları, PP değerleri ve Actor verileri dönüştürülmez. Diğer Actor'ların sheet seçimi ve aktif elementleri değişmez.

NPC'ler için de Sheet Configuration menüsünden **Dominion Aetherics Sheet** seçin. Bu seçenek SWADE Official düzenini kullanır. Mevcut NPC/Community kağıtları kayıtlı kalır; güncelleme herhangi bir Actor'ın sheet'ini kendiliğinden değiştirmez. Önceki sürümde seçeneği göremediyseniz güncel sürümü kurup istemciyi yeniden yükleyin.

Manuel kurulum: release'teki `module.zip` dosyasını `Data/modules/dominion-aetherics-sheet/` içine açın. `module.json` bu klasörün doğrudan altında olmalıdır. Forge'da manifest üzerinden kurulum için herkese açık GitHub varlıkları kullanılır; Forge'da canlı kurulum henüz doğrulanmamıştır.

## Dört Active Aether seviyesi

Sütunlar soldan sağa **1 (turuncu), 2 (lacivert), 3 (mor), 4 (cyan)** sırasındadır. Kısa kutucuklar kendi seviyelerinde kalır; güçler sağdaki yeşil alandadır. Dar kağıtta yatay kaydırma kullanılır, seviyeler alt alta taşınmaz. Tam ad, seviye ve önkoşul bilgisi kutucuğun üzerinde bekleyince görünür.

Global Kütüphane'de bir Active Aether'ı düzenleyin. **Active Aether seviyesi** alanından 1–4 seçin. **Aktif alt seviye Active Aether seçimleri gereksin** seçeneği kapalıysa hiçbir önkoşul yoktur; 3. veya 4. seviye de bağımsız olabilir. Açıkken yalnız daha düşük seviyeler seçilebilir. 2. seviye yalnız 1'i, 3. seviye 1 ve/veya 2'yi, 4. seviye 1/2/3'ü kullanabilir. **VE** tüm seçilen önkoşulları, **VEYA** herhangi birini gerektirir. Açık fakat boş bir önkoşul listesi kaydedilemez.

Örnek: Clay (2), Earth (1) ister. Warden (3), Basic Aetherism (1) **VE** Clay (2) ister. Önce bu alt seçimleri aktif edin, sonra Warden'ı açın. Earth kapatılınca Clay ve Warden da kapanır; pasifler ve güç kilitleri buna göre güncellenir. VEYA kuralında başka bir aktif sağlayıcı kaldığında üst seçim açık kalır. Önkoşullar kendiliğinden atanmaz veya açılmaz. Kapatılan üst seçimler, şart yeniden sağlandığında oyuncu tarafından yeniden açılır.

Eski tanımlar **1. seviye, önkoşulsuz** görünür. Kimlikler, Actor atamaları, mevcut aktif seçimler ve büyü tarifleri korunur; veriler sıfırlanmaz. Kullanımdaki bir alt tanımı bağımlılarına eşit/yüksek seviyeye taşımak reddedilir. Önce bağımlıların kurallarını düzenleyin. Global silme sonrası eksik bir önkoşula bağlı seçimler, GM kuralı düzeltene kadar kilitlenir.

## Kütüphane, birleşimler ve pasifler

**Global Kütüphane** tüm ortak Active Aether tanımlarını ve dünyadaki gerçek SWADE Power Item'larını gösterir. Tanım ve büyü şablonlarını yalnızca GM yönetir. Büyüler sekmesinde mevcut Actor büyülerini listeden, compendium büyülerini UUID ile içe aktarabilirsiniz. Kaynak büyü değişmez; kütüphane kopyası oluşturulur. Bu Actor'a ekle, bağlamdaki tek Actor'a bağımsız bir embedded Power kopyalar; aynı şablonu tekrar eklemek kopyaları çoğaltmaz. Şablonun sonradan düzenlenmesi veya silinmesi mevcut Actor büyülerini değiştirmez.

**Active Aether Yöneticisi** yalnızca açık Actor'ın sahip olduğu tanımları belirler. Grafikte sadece bu atamalar görünür. Oyuncu sahip olduğu Actor'ın kendisine verilmiş seçimlerini açıp kapatabilir; başka tanım veremez. Atamayı kaldırmak o Actor'ın ilgili aktif seçimini, ona bağlı üst seviyeleri ve artık sağlanmayan modül pasifini kaldırır. Diğer Actor'lar ve bağımsız token'ların atamaları ayrı kalır.

0.2.1 ve öncesinden güncellemede, atama listesi bulunmayan Actor'ların **yalnızca kayıtlı aktif elementleri** başlangıç Active Aether ataması olarak korunur. Bütün global tanımlar verilmez. Diğerlerini GM, Active Aether Yöneticisi'nden seçmelidir. Yeni Actor'ın başlangıç atamaları boştur. 0.3.0 öncesine dönüş atama filtresini, 0.4.0 öncesine dönüş seviye önkoşullarını dikkate almaz.

Her Active Aether'ın sabit kimliği, adı, isteğe bağlı sembolü, görseli, seviyesi, önkoşulları, sırası, açıklaması ve birden fazla pasifi olabilir. Yeniden adlandırmak tarifleri bozmaz. Global silme onay ister; silinen kimlikleri kullanan güçler GM tarifleri güncelleyene kadar kilitlenir.

Güç gereksinimindeki her Active Aether grubunun **VE / VEYA** seçimi vardır. **Su VE Toprak** için ikisi de aktif olmalıdır. **Su VEYA Toprak** için yalnız Su veya yalnız Toprak yeterlidir; normal modda ikisinin birlikte seçilmesi de geçerlidir. Ek gruplar birbirinin alternatifidir: örneğin `(Su VE Toprak) VEYA (Ateş VE Hava)`. Önizleme bu ifadeyi gösterir. GM isterse yasak seçimler ve tam eşleşme kullanabilir. Tam eşleşmede VEYA grubunun yalnız bir üyesinin seçili olması gerekir. Sınır varsayılan olarak yoktur; Module Settings içindeki **Eşzamanlı aktif Aether sınırı / Maximum active Aethers** ayarıyla GM sınır koyabilir (0 = sınırsız).

Eski büyü tarifleri aynı flag şemasında kalır ve aktif seçimler, atamalarla uyumlu biçimde korunur. Eski tek-element alternatifleri editörde bir VEYA grubu halinde gösterilir. Yalnız bir element içeren grupta VE ve VEYA aynı sonucu verir.

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
- Actor'a verilen elementler `flags.dominion-aetherics-sheet.assignedElements` içinde tutulur. Atama ve etkinleştirme işlemleri aynı Actor kuyruğunu kullanır.
- Bağımsız token Actor referansı olduğu gibi kullanılır; `game.actors.get(actor.id)` ile ana Actor'a dönüştürülmez.
- Efektler `managed`, `actorUuid`, `sourceUuid`, `providers` ve `schemaVersion` flag'leriyle izlenir. Tek bir aktif GM (GM yoksa aktif Actor sahibi) arka plan efekt güncellemelerini yapar.
- İzinler API'de de kontrol edilir. Yerel hızlı tıklamalar Actor bazında sıraya alınır. Farklı tarayıcılardan aynı Actor'ın aynı anda değiştirilmesi Foundry'nin son güncelleme davranışına tabidir.

## Macro API

API ve flag adlarındaki `Element` sözcüğü eski makrolarla uyum için korunur. `getElements()` artık her tanımda `level: 1..4` ve `prerequisites: null | { mode: "all" | "any", ids: [...] }` da döndürür. Etkinleştirme API'si aynı alt seviye kurallarını uygular; üst seviyeleri otomatik açmaz.

```js
const api = game.modules.get("dominion-aetherics-sheet").api;
const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character;

api.getElements();                         // cloned definitions; effects return UUID/name metadata
api.getAssignedElements(actor);            // this Actor's granted element IDs
await api.setAssignedElements(actor, ["ID1", "ID2"]); // GM only
api.getActiveElements(actor);              // element IDs
await api.setActiveElements(actor, ["ID1"]); // owner or GM, granted IDs only
api.getAvailablePowers(actor);              // existing SWADE Power Item documents
api.getPowerRequirements(actor.items.get("POWER_ID"));
api.isPowerAvailable(actor, actor.items.get("POWER_ID"));
api.openGlobalLibrary(actor);              // GM; Actor context optional
api.openElementManager(actor);             // GM; grant elements to this Actor
api.openPowerRequirements(actor.items.get("POWER_ID")); // GM only

// Remove the selected Actor's elemental passives through the normal service:
await api.setActiveElements(actor, []);
```

Tanımsız kurallar `null`, geçersiz/eski tarifler `{ invalid: true }` döner. Geçerli gereksinimler `{ schemaVersion: 1, recipes: [["ID1", "ID2"], ["ID3"]], forbidden: [], exact: false }` biçimindedir. Yapılandırma için UI kullanılması önerilir. GM yokken ilk aktif sahibin efekt senkronizasyonu yapması nedeniyle başka oyuncunun kendi Actor'ı üzerindeki API çağrısı efektler tamamlanmadan dönebilir; belge güncellemeleri tüm istemcilere Foundry üzerinden ulaşır.

Eski `openElementManager()` çağrısı Actor verilmezse Global Kütüphane'yi açar. Actor'a element vermek için Actor argümanını ekleyin.

## Menü ve görsel hataları

Sheet yeniden çizilirken hiç açılmamış sağ tık menüsü kapatılmaz. Açık olan kendi menüsü, DOM kaldırılmadan önce animasyonsuz kapatılır ve Promise'i beklenir. Böylece bildirilen `ContextMenu._animate / getBoundingClientRect` hatasının kaynağı kaldırılır.

Varsayılan element ikonu modülle birlikte gelen `assets/element.svg` dosyasıdır; eski `icons/svg/atom.svg` yolları görünümde buna çevrilir. Bulunamayan özel görseller yedek ikonla gösterilir; belge veya dünya tanımındaki asıl yol değiştirilmez. `disciple.jpg` gibi Forge'da 404 dönen bir dosyayı modül geri getiremez: doğru Asset Library yolunu dosya seçicisinden yeniden seçin. İlk eksik görsel isteği konsolda 404 gösterebilir; aynı oturumdaki sonraki gösterimler yedek ikonu kullanır. Dosyayı aynı yolda onardıysanız istemciyi yenileyin.

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

Enable this module and **SWADE Tools** (`swade-tools-fix` 2.2.4), then select **Dominion Aetherics Sheet** for a character or NPC Actor. Leave **Make Default** unchecked. In Powers, **Global Library** beside **Active Aether Manager** stores shared definitions and real world Power templates. Creating a definition grants it to nobody. The manager grants a chosen subset to the current Actor; players activate only granted entries. Library Powers are copied only with **Add to this Actor** and remain independent. Existing saved active IDs are the only inferred assignments for older Actors; new Actors start empty.

Active Aethers occupy four compact columns, levels 1–4 from left to right; Powers stay on the right. In the library editor choose a level and optionally require active lower-level entries using AND/OR. Unchecked prerequisites mean none, even at level 4. Required entries must be separately granted and activated. Removing a prerequisite cascades off dependent selections and their passives; it never automatically enables entries. Legacy definitions default to level 1 with no prerequisites. Existing flag keys and recipes remain compatible.

69 automated tests cover tiers, dependencies, cascading cleanup, assignments, library copies, Actor/token isolation, menu cleanup, image fallbacks, NPC/character services, actual 5.1.0 Powers DOM and the pinned Tools API wrapper with mocked boundaries. Wide/compact layouts and the editor were visually inspected in an isolated browser fixture using the actual module templates/CSS. Live Foundry acceptance remains pending. Missing Forge assets still need a correct file path; fallback rendering does not restore absent files.

Original module code is MIT licensed. Foundry and SWADE are separately licensed. Their source/templates/assets are reused from the installed system and are not redistributed.
