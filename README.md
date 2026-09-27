# mathnote

Tarayıcı tabanlı interaktif matematik defteri. Uygulama bağımlılıkları npm üzerinden sabitlenir ve esbuild ile internet bağlantısı gerektirmeyen taşınabilir bir `dist/` çıktısına dönüştürülür.

---

## Özellikler

### Düzenleyici
- **CodeMirror 6** tabanlı kod editörü
- Satır tipine göre renk kodlu kenar etiketi (tür göstergesi)
- Satır içi anlık sonuç gösterimi
- Otomatik değerlendirme: her tuş vuruşunda hesaplama

### Hesaplama Motoru
- **math.js** — aritmetik, değişken ve fonksiyon değerlendirme
- **Nerdamer** — sembolik hesaplama (türev, integral, limit, çarpanlara ayırma, denklem çözme)
- **function-plot** — 2D fonksiyon grafikleri
- **KaTeX** — LaTeX render

### Desteklenen Satır Tipleri

| Etiket | Tür | Örnek |
|--------|-----|-------|
| `V` | Değişken Ataması | `r = 5` |
| `F` | Fonksiyon Tanımı | `f(x) = x^2 + 1` |
| `M` | Matris / Vektör | `A = [[1,2],[3,4]]` |
| `E` | İfade | `2 + 3 * sqrt(16)` |
| `EQ` | Denklem | `x^2 - 4 = 0` |
| `INEQ` | Eşitsizlik | `x + 1 > 3` |
| `P` | Grafik | `plot(sin(x), cos(x))` |
| `C` | Yorum | `# açıklama` |
| `ERR` | Hata | geçersiz ifade |

### Fonksiyon Analizi Paneli
Bir fonksiyon satırına tıklandığında yan panelde otomatik hesaplanır:

- Türev (1. ve 2.)
- İntegral
- Limit (x → ∞, x → 0⁺, x → 0⁻)
- Sadeleştirme (basit / çarpan / Horner)
- Kök Bulma (sembolik + nümerik bisection)
- Kritik Noktalar ve Extremum (min / maks / eğer)
- Simetri (çift / tek / hiçbiri)
- Teğet ve Normal (belirtilen x₀ için)
- Büküm Noktaları
- Gradyan (∇f) ve Hessian (çok değişkenli)
- 3B yüzey grafiği (çok değişkenli fonksiyonlar)

### Denklem Paneli
- Sembolik ve nümerik çözüm
- Geometrik şekil tanıma: çember, elips, hiperbol, parabol, doğru
- Örtük türevler
- Tam sayı çözümleri

### Matris / Vektör İşlemleri
Matrislere tıklandığında:
- Tanım, boyut, elaman sayısı
- Değer değişimi ve hesaplama
- Sonuç özeti

### Birim Sistemi
math.js birim motoru üzerinden:
```
9.8 m/s^2 * 70 kg
(50 km/hour) to m/s
100 celsius to fahrenheit
5 inch to cm
```

### Dışa Aktarma
Sağ üstteki **Export** düğmesiyle mevcut sekme içeriği şu biçimlerde dışa aktarılabilir:
- **Text** (`.txt`)
- **Markdown** (`.md`)
- **LaTeX** (`.tex`)
- **PDF** (tarayıcı yazdır iletişim kutusu)

### Çoklu Sekme
- `+` düğmesiyle yeni dosya/sekme oluşturma
- Sekmeler `localStorage`'da kalıcı olarak saklanır
- Sekme adı çift tıkla düzenlenebilir

### Ekle Modalı
`+` FAB (sağ alt) veya klavye kısayoluyla açılır. Şablonlu form üzerinden şunlar eklenebilir:
- Fonksiyon, Denklem, Eşitsizlik, Matris, İfade

### Dil Desteği
Sağ üstteki **EN / TR** geçişiyle arayüz dili değiştirilebilir. Tercih `localStorage`'a kaydedilir.

---

## Kullanım

### Offline dağıtım oluşturma

```bash
npm install
npm run build
```

Build sonrasında `dist/` klasörü tüm çalışma zamanı bağımlılıklarını, KaTeX stillerini ve fontlarını yerel olarak içerir:

```bash
open dist/index.html
```

`dist/index.html` klasik IIFE bundle kullandığı için yerel bir HTTP sunucusu gerektirmeden `file://` üzerinden açılabilir. Build alındıktan sonra matematik motoru, editör, grafik ve formül render katmanı için internet bağlantısı gerekmez.

Offline bağımlılık kontrolünü çalıştırmak için:

```bash
npm run test:offline
```

Bu kontrol, build çıktısında uzak script/style/module bağlantısı kalmadığını ve KaTeX fontlarının yerel çıktıya kopyalandığını doğrular.

---

## Klavye Kısayolları

| Kısayol | Eylem |
|---------|-------|
| `Ctrl` + `+` | Yakınlaştır |
| `Ctrl` + `-` | Uzaklaştır |

---

## Bağımlılıklar

Çalışma zamanı bağımlılıkları CDN'den yüklenmez. npm paketleri sabit sürümlere pinlenir ve esbuild ile `dist/app.js` / `dist/app.css` içine bundle edilir. KaTeX fontları da `dist/assets/` altına kopyalanır.

| Kütüphane | Sürüm | Amaç |
|-----------|-------|------|
| KaTeX | 0.16.21 | LaTeX render |
| math.js | 14.9.1 | Sayısal hesaplama & birimler |
| Nerdamer | 1.1.13 | Sembolik cebir |
| function-plot | 1.25.4 | 2D grafik |
| CodeMirror | 6.x (pinli paketler) | Kod editörü |
| esbuild | 0.28.2 | Offline browser bundle |

---

## Lisans

MIT Lisansı
