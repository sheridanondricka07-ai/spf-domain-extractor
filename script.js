/* script.js â€“ Professional SPF-Domain Extractor Logic */

const domainsInput = document.getElementById('domainsFile');
const masterInput = document.getElementById('masterFile');
const processBtn = document.getElementById('processBtn');
const progressBar = document.getElementById('progressBar');
const percentText = document.getElementById('percentText');
const progressSection = document.getElementById('progressSection');
const statusText = document.getElementById('statusText');
const resultBox = document.getElementById('resultBox');
const resultSection = document.getElementById('resultSection');
const matchCountDisplay = document.getElementById('matchCount');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// File name display helpers
domainsInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || "No file chosen";
    document.getElementById('name-1').textContent = fileName;
    updateButtonState();
});

masterInput.addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name || "No file chosen";
    document.getElementById('name-2').textContent = fileName;
    updateButtonState();
});

const updateButtonState = () => {
    processBtn.disabled = !(domainsInput.files[0] && masterInput.files[0]);
};

processBtn.addEventListener('click', async () => {
    const domainsFile = domainsInput.files[0];
    const masterFile = masterInput.files[0];

    if (!domainsFile || !masterFile) return;

    // Reset UI
    resultSection.hidden = true;
    progressSection.hidden = false;
    processBtn.disabled = true;
    progressBar.style.width = '0%';
    percentText.textContent = '0%';
    statusText.textContent = 'Loading domains...';

    try {
        // 1. Load domains into a Set
        const domainsText = await domainsFile.text();
        const domainsSet = new Set(
            domainsText
                .split(/\r?\n/)
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0)
        );

        statusText.textContent = `Processing Master records (${(masterFile.size / (1024 * 1024)).toFixed(1)} MB)...`;

        // 2. Helper: match exact domain or any subâ€‘domain
        const matchDomain = (token, set) => {
            const parts = token.split('.');
            for (let i = 0; i < parts.length; i++) {
                const candidate = parts.slice(i).join('.');
                if (set.has(candidate)) return true;
            }
            return false;
        };

        // 3. Stream the master file
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
            const progress = (processedBytes / masterFile.size) * 100;
            progressBar.style.width = `${progress}%`;
            percentText.textContent = `${Math.round(progress)}%`;

            const chunkText = decoder.decode(value, { stream: true });
            const lines = (leftover + chunkText).split(/\r?\n/);
            leftover = lines.pop(); // keep incomplete line for next chunk

            for (const line of lines) {
                const lower = line.toLowerCase();
                // Split by whitespace, colon, and equals sign as per user's Python logic
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
        }

        // Process leftover line
        if (leftover) {
            const lower = leftover.toLowerCase();
            const tokens = lower.replace(":", " ").replace("=", " ").split(/\s+/);
            for (const token of tokens) {
                if (token.includes('.')) {
                    if (matchDomain(token, domainsSet)) {
                        matches.push(leftover);
                        break;
                    }
                }
            }
        }

        // 4. Finalize UI
        statusText.textContent = 'Extraction complete!';
        resultBox.value = matches.join('\n');
        matchCountDisplay.textContent = `${matches.length.toLocaleString()} matches found`;
        
        const blob = new Blob([resultBox.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        downloadBtn.href = url;
        
        resultSection.hidden = false;
        processBtn.disabled = false;

    } catch (error) {
        console.error(error);
        alert('An error occurred during processing: ' + error.message);
        statusText.textContent = 'Error occurred.';
        processBtn.disabled = false;
    }
});

// Copy functionality
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(resultBox.value);
        const originalHTML = copyBtn.innerHTML;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
        }, 2000);
    } catch (err) {
        alert('Failed to copy!');
    }
});

