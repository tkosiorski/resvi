# Resvi Debug Logger - Instrukcja

## Jak używać:

### 1. Uruchom logger w konsoli przeglądarki

Otwórz DevTools (F12) i wklej cały kod z `debug-logger.js` do konsoli.

Lub alternatywnie:
```javascript
// Wklej to do konsoli aby załadować skrypt z GitHub:
fetch('file:///Users/toos/Scout/resvi/debug-logger.js')
  .then(response => response.text())
  .then(script => eval(script));
```

### 2. Logger będzie automatycznie przechwytywał:

- ✅ Wszystkie `console.log()`, `console.error()`, `console.warn()`
- ✅ Błędy JavaScript (uncaught exceptions)
- ✅ Błędy Promise (unhandled rejections)
- ✅ Chrome extension messages (send/receive)
- ✅ URL i timestamp dla każdego wpisu

### 3. Dostępne komendy:

W konsoli możesz użyć:

```javascript
// Pobierz plik z wszystkimi logami
downloadResviLogs()

// Wyczyść wszystkie logi
clearResviLogs()

// Pokaż ostatnie 50 logów w tabeli
showResviLogs()
```

### 4. Workflow debugowania:

1. Uruchom logger w konsoli
2. Wykonaj akcje w rozszerzeniu (test, filtrowanie itp.)
3. Jeśli wystąpi błąd, uruchom `downloadResviLogs()`
4. Prześlij mi pobrany plik `.txt`

### 5. Co będzie w pliku:

```
[2024-01-15T14:30:25.123Z] LOG: 🔵 Content script received message: {type: "APPLY_FILTERS", config: {...}}
URL: https://www.zalando-lounge.pl/campaigns/ABC123
---

[2024-01-15T14:30:25.456Z] ERROR: TypeError: console.log(...) is not a function at b.selectMatchingSizes
URL: https://www.zalando-lounge.pl/campaigns/ABC123
---
```

### 6. Automatyczne zapisywanie:

- Logi są zapisywane do localStorage co 10 wpisów
- Przy zamknięciu strony wszystkie logi są automatycznie zapisane
- Logi pozostają między sesjami przeglądarki

## Przykład użycia:

```javascript
// 1. Wklej debug-logger.js do konsoli
// 2. Testuj rozszerzenie normalnie
// 3. Po problemie:
downloadResviLogs()
// 4. Prześlij pobrany plik
```

Teraz zamiast przepisywania błędów możesz po prostu pobrać plik i mi go przesłać! 🎉