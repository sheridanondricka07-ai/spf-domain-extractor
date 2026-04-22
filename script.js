// script.js â€“ SPFâ€‘Domain Extractor using precise domain/subdomain matching

// Fast clientâ€‘side extractor for large files (â‰ˆ600â€¯MiB)
// Loads domains.txt into a Set, then streams Master_with_includes.txt lineâ€‘byâ€‘line.
// Matches exact domain or any subâ€‘domain, but not parent domains.

document.getElementById('processBtn').addEventListener('click', async () => {
  const domainsFile = document.getElementById('domainsFile').files[0];
  const masterFile = document.getElementById('masterFile').files[0];
  if (!domainsFile || !masterFile) {
    alert('Please select both files.');
    return;
  }

  // ---------- Load domains into a Set ----------
  const domainsText = await domainsFile.text();
  const domainsSet = new Set(
    domainsText
      .split(/\r?\n/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0)
  );
  console.log(`[+] Loaded ${domainsSet.size} domains`);

  // ---------- Helper: match exact domain or any subâ€‘domain ----------
  const matchDomain = (token, set) => {
    const parts = token.split('.');
    for (let i = 0; i < parts.length; i++) {
      const candidate = parts.slice(i).join('.');
      if (set.has(candidate)) return true;
    }
    return false;
  };

  // ---------- Stream master file ----------
  const resultBox = document.getElementById('resultBox');
  const progressBar = document.getElementById('progressBar');
  const copyBtn = document.getElementById('copyBtn');
  const downloadLink = document.getElementById('downloadLink');
  resultBox.value = '';
  copyBtn.disabled = true;
  downloadLink.style.display = 'none';

  const matches = [];
  const decoder = new TextDecoder('utf-8');
  let leftover = '';
  let processedBytes = 0;

  const stream = masterFile.stream();
  const reader = stream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    processedBytes += value.length;
    progressBar.value = (processedBytes / masterFile.size) * 100;

    const chunkText = decoder.decode(value, { stream: true });
    const lines = (leftover + chunkText).split(/\r?\n/);
    leftover = lines.pop(); // keep incomplete line for next chunk
    for (const line of lines) {
      const lower = line.toLowerCase();
      const tokens = lower.replace(":", " ").replace("=", " ").split(/\s+/);
      for (const token of tokens) {
        if (token.includes('.')) {
          if (matchDomain(token, domainsSet)) {
            matches.push(line);
            break; // stop checking other tokens for this line
          }
        }
      }
    }
  }
  // Process any leftover line
  if (leftover) {
    const line = leftover;
    const lower = line.toLowerCase();
    const tokens = lower.replace(":", " ").replace("=", " ").split(/\s+/);
    for (const token of tokens) {
      if (token.includes('.')) {
        if (matchDomain(token, domainsSet)) {
          matches.push(line);
          break;
        }
      }
    }
  }

  const resultText = matches.join('\n');
  resultBox.value = resultText;
  copyBtn.disabled = false;
  // Create downloadable Blob
  const blob = new Blob([resultText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = 'matches.txt';
  downloadLink.style.display = 'inline';
});

// Enable the Process button only when both files are selected
const updateButtonState = () => {
  const domainsFile = document.getElementById('domainsFile').files[0];
  const masterFile = document.getElementById('masterFile').files[0];
  document.getElementById('processBtn').disabled = !(domainsFile && masterFile);
};

document.getElementById('domainsFile').addEventListener('change', updateButtonState);
document.getElementById('masterFile').addEventListener('change', updateButtonState);

// Copy to clipboard handler
document.getElementById('copyBtn').addEventListener('click', async () => {
  const resultBox = document.getElementById('resultBox');
  await navigator.clipboard.writeText(resultBox.value);
  alert('Copied to clipboard!');
});
