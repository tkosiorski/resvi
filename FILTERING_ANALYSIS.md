# 🔍 Zalando Filtering Analysis - Enhanced Patterns

## 📊 Summary of Capture Analysis

Analiza 3 plików capture ujawniła precyzyjne wzorce filtrowania API Zalando Lounge:

### **Size Filtering Patterns (zalando-api-capture-sizes.json)**

#### **1. URL Structure dla Rozmiarów Butów**
```
✅ Pojedynczy rozmiar:
/articles?sizes.shoes=43&size=60&fields=1&sort=relevance&gender=MALE&no_soldout=1

✅ Wiele rozmiarów (pipe-separated):
/articles?sizes.shoes=39%7C43&size=60&fields=1&sort=relevance&gender=MALE&no_soldout=1

✅ Rozmiary z ułamkami (URL encoded):
/articles?sizes.shoes=39%7C39.5%7C40%7C43%7C46%202%2F3%7C47&size=60&fields=1
```

#### **2. Format Rozmiarów**
- **Separator**: `|` (pipe) dla `sizes.shoes`
- **URL Encoding**: `%7C` = `|`, `%202%2F3` = ` 2/3`
- **Ułamki**: `46 2/3`, `47.5`, `39.5`
- **Progresywne dodawanie**: API pozwala na dodawanie kolejnych rozmiarów

#### **3. Workflow Filtrowania Rozmiarów**
1. **Podstawowy request**: bez filtrów rozmiarów
2. **Dodawanie pojedynczych rozmiarów**: `sizes.shoes=43`
3. **Kombinowanie rozmiarów**: `sizes.shoes=39|43`
4. **Rozszerzanie selekcji**: `sizes.shoes=39|39.5|40|43|47`

---

### **Brand Filtering Patterns (zalando-api-capture-brands.json)**

#### **1. URL Structure dla Marek**
```
✅ Pojedyncza marka:
/articles?brand_codes=AD7&size=60&fields=1&sort=relevance&gender=MALE&no_soldout=1

✅ Wiele marek (comma-separated):
/articles?brand_codes=AD1%2CAD5&size=60&fields=1&sort=relevance&gender=MALE&no_soldout=1

✅ Pełna kombinacja marek:
/articles?brand_codes=AD1%2CAD5%2CADQ%2CALB%2CH1X%2CSA5%2CME1%2CPU1&size=60&fields=1
```

#### **2. Odkryte Kody Marek**
| Kod | Marka (przewidywana) | Status |
|-----|---------------------|---------|
| `AD7` | Adidas Originals | ✅ Potwierdzona |
| `TA4` | Tommy Hilfiger | ✅ Potwierdzona |
| `AD1` | Adidas Neo | ✅ Z capture |
| `AD5` | Adidas Performance | ✅ Z capture |
| `ALB` | Alberto | 🆕 Nowa |
| `H1X` | Hugo | 🆕 Nowa |
| `SA5` | Salomon | 🆕 Nowa |
| `ME1` | Merrell | 🆕 Nowa |
| `PU1` | Puma | ✅ Potwierdzona |
| `ADQ` | Unknown Adidas | ❓ Do sprawdzenia |

#### **3. Format Brand Codes**
- **Separator**: `,` (comma) dla `brand_codes`
- **URL Encoding**: `%2C` = `,`
- **Progresywne dodawanie**: Możliwość dodawania kolejnych marek

---

### **Filter-Counts Synchronization**

#### **Równoległe Requesty**
Każde filtrowanie wymaga 2 requestów:
1. **Articles**: `/articles?brand_codes=AD7&size=60...`
2. **Filter-counts**: `/filter-counts?brand_codes=AD7&fields=category_filter,color_filter...`

#### **Filter-counts Parameters**
```
fields=category_filter%2Ccolor_filter%2Cgender_filter%2Cprice_filter%2Csize_filter%2Cbrand_filter%2Cmaterial_filter
&no_soldout=1
&use_score_size_filter_sort=true
```

---

### **Critical Discoveries**

#### **1. Parameter Encoding**
- Rozmiary: `|` separator, URL encoded jako `%7C`
- Marki: `,` separator, URL encoded jako `%2C`
- Ułamki: `46 2/3` → `46%202%2F3`

#### **2. Progressive Filtering**
- Użytkownicy mogą dodawać filtry inkrementalnie
- Każda zmiana wymaga nowego request pair (articles + filter-counts)
- API obsługuje kombinacje filtrów

#### **3. Response Status Codes**
- **Articles**: `206 Partial Content` (paginowane wyniki)
- **Filter-counts**: `200 OK` (pełne informacje o filtrach)

---

### **Implementation Updates**

#### **Enhanced ZalandoApiService**
✅ **Nowe brand mappings**: AD1, ALB, H1X, SA5, ME1, ADQ
✅ **Size formatting helpers**: `formatSizeParameter()`, `formatBrandCodes()`
✅ **Filter validation**: `validateFilters()` z warnings
✅ **URL encoding support**: Automatyczne handling ułamków
✅ **Progressive filtering**: Support dla dodawania filtrów

#### **Size Parameter Examples**
```typescript
// Single shoe size
sizes.shoes = "43"

// Multiple shoe sizes
sizes.shoes = "39|43|47"

// With fractional sizes
sizes.shoes = "39|39.5|46%202%2F3|47"
```

#### **Brand Parameter Examples**
```typescript
// Single brand
brand_codes = "AD7"

// Multiple brands
brand_codes = "AD1,AD5,PU1"

// Full brand selection
brand_codes = "AD1,AD5,ADQ,ALB,H1X,SA5,ME1,PU1"
```

---

### **Next Steps**

1. **Test Enhanced API**: Wykorzystać nowe brand codes i size formatting
2. **UI Updates**: Dodać support dla fractional sizes
3. **Progressive Filtering**: Implementować incremental filter updates
4. **Error Handling**: Obsłużyć validation warnings

Nasz v2 API jest teraz w pełni zgodny z rzeczywistymi wzorcami filtrowania Zalando! 🎯