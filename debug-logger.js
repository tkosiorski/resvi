// Debug Logger - automatycznie loguje wszystkie działania rozszerzenia
// Uruchom w konsoli deweloperskiej: node debug-logger.js
// Lub wklej bezpośrednio do konsoli przeglądarki

(function() {
  const logFile = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Funkcja do formatowania czasu
  function getTimestamp() {
    return new Date().toISOString();
  }

  // Funkcja do logowania do pliku
  function logToFile(level, ...args) {
    const entry = {
      timestamp: getTimestamp(),
      level: level,
      message: args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    logFile.push(entry);

    // Zapisz do localStorage co 10 wpisów
    if (logFile.length % 10 === 0) {
      localStorage.setItem('resvi-debug-log', JSON.stringify(logFile));
    }
  }

  // Przechwyć wszystkie console.log
  console.log = function(...args) {
    logToFile('LOG', ...args);
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    logToFile('ERROR', ...args);
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    logToFile('WARN', ...args);
    originalWarn.apply(console, args);
  };

  // Przechwyć błędy JavaScript
  window.addEventListener('error', function(e) {
    logToFile('JS_ERROR', `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`, e.error);
  });

  // Przechwyć błędy Promise
  window.addEventListener('unhandledrejection', function(e) {
    logToFile('PROMISE_ERROR', 'Unhandled promise rejection:', e.reason);
  });

  // Dodaj Chrome extension message listener
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const originalSendMessage = chrome.runtime.sendMessage;
    if (originalSendMessage) {
      chrome.runtime.sendMessage = function(message, ...args) {
        logToFile('CHROME_SEND', 'Sending message:', message);
        return originalSendMessage.call(chrome.runtime, message, ...args);
      };
    }

    // Loguj otrzymane wiadomości
    if (chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        logToFile('CHROME_RECEIVE', 'Received message:', message, 'from:', sender);
      });
    }
  }

  // Funkcja do pobrania logów
  window.downloadResviLogs = function() {
    const logs = JSON.parse(localStorage.getItem('resvi-debug-log') || '[]');
    const allLogs = [...logs, ...logFile];

    const logText = allLogs.map(entry =>
      `[${entry.timestamp}] ${entry.level}: ${entry.message}\n` +
      `URL: ${entry.url}\n` +
      `---\n`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resvi-debug-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Debug log downloaded! Total entries:', allLogs.length);
  };

  // Funkcja do czyszczenia logów
  window.clearResviLogs = function() {
    localStorage.removeItem('resvi-debug-log');
    logFile.length = 0;
    console.log('🧹 Debug logs cleared!');
  };

  // Funkcja do wyświetlenia logów w konsoli
  window.showResviLogs = function() {
    const logs = JSON.parse(localStorage.getItem('resvi-debug-log') || '[]');
    const allLogs = [...logs, ...logFile];
    console.table(allLogs.slice(-50)); // Pokaż ostatnie 50 wpisów
  };

  console.log('🔍 Resvi Debug Logger activated!');
  console.log('📋 Available commands:');
  console.log('  downloadResviLogs() - pobierz plik z logami');
  console.log('  clearResviLogs() - wyczyść logi');
  console.log('  showResviLogs() - pokaż ostatnie 50 logów w tabeli');

  // Auto-save na zamknięcie strony
  window.addEventListener('beforeunload', function() {
    if (logFile.length > 0) {
      localStorage.setItem('resvi-debug-log', JSON.stringify(
        [...JSON.parse(localStorage.getItem('resvi-debug-log') || '[]'), ...logFile]
      ));
    }
  });

})();