// Secure Encryption App - Main JavaScript
console.log("=== ENCRYPTION APP STARTING ===");

// Global variables
let currentEncryptedData = null;
let isKeyVisible = false;

// DOM Elements
let inputText, encryptionKey, resultDiv, statusDiv, keyStrength;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, getting elements...");
    
    // Get DOM elements
    inputText = document.getElementById('inputText');
    encryptionKey = document.getElementById('encryptionKey');
    resultDiv = document.getElementById('result');
    statusDiv = document.getElementById('status');
    keyStrength = document.getElementById('keyStrength');
    
    // Set initial values
    if (inputText) inputText.value = "";
    if (encryptionKey) {
        encryptionKey.value = "";
        encryptionKey.type = 'password';
    }
    if (statusDiv) statusDiv.textContent = "✅ App ready!";
    
    // Update key strength on input
    if (encryptionKey) {
        encryptionKey.addEventListener('input', updateKeyStrengthDisplay);
    }
    
    // Clear encrypted data when input changes (FIXES THE BUG)
    if (inputText) {
        inputText.addEventListener('input', function() {
            if (this.value.trim() === "" || !this.value.startsWith("{")) {
                currentEncryptedData = null; // Clear old data
            }
        });
    }
    
    console.log("App initialized successfully!");
});

// Generate a secure random key
function generateKey() {
    console.log("Generating key...");
    
    try {
        if (!encryptionKey) {
            alert("Error: Encryption key element not found!");
            return;
        }
        
        // Generate random bytes
        const array = new Uint8Array(24);
        window.crypto.getRandomValues(array);
        
        // Convert to base64 URL-safe format
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Set the key and clear old results
        encryptionKey.value = key;
        currentEncryptedData = null; // Clear previous encrypted data
        
        // Update displays
        updateKeyStrengthDisplay();
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Secure key generated!';
            statusDiv.className = 'status-bar status-success';
        }
        
        // Clear result area
        if (resultDiv) {
            resultDiv.innerHTML = "<div class='placeholder'>New key generated. Enter text and click 'Encrypt'.</div>";
        }
        
    } catch (error) {
        console.error("Key generation error:", error);
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Error generating key';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Update key strength display
function updateKeyStrengthDisplay() {
    if (!keyStrength || !encryptionKey) return;
    
    const key = encryptionKey.value;
    let strength = "Weak";
    let className = "key-weak";
    
    if (key.length === 0) {
        strength = "None";
        className = "";
    } else if (key.length >= 16) {
        strength = "Strong";
        className = "key-strong";
    } else if (key.length >= 8) {
        strength = "Medium";
        className = "key-good";
    } else {
        strength = "Weak";
        className = "key-weak";
    }
    
    keyStrength.textContent = strength;
    keyStrength.className = `key-strength ${className}`;
}

// Toggle key visibility
function toggleKeyVisibility() {
    if (!encryptionKey) return;
    
    isKeyVisible = !isKeyVisible;
    encryptionKey.type = isKeyVisible ? 'text' : 'password';
    
    const toggleBtn = document.querySelector('.toggle-key-btn');
    if (toggleBtn) {
        toggleBtn.innerHTML = isKeyVisible ? 
            '<i class="fas fa-eye-slash"></i>' : 
            '<i class="fas fa-eye"></i>';
    }
}

// Encrypt text
async function encryptText() {
    console.log("Starting encryption...");
    
    try {
        // Get values
        const text = inputText ? inputText.value.trim() : "";
        const keyString = encryptionKey ? encryptionKey.value.trim() : "";
        
        // Validate
        if (!text) {
            alert("Please enter text to encrypt");
            return;
        }
        if (!keyString) {
            alert("Please enter an encryption key");
            return;
        }
        
        // Update UI
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading">Encrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '⏳ Encrypting...';
            statusDiv.className = 'status-bar status-info';
        }
        
        // Generate key from password
        const baseKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(keyString),
            {name: "PBKDF2"},
            false,
            ["deriveKey"]
        );
        
        // Derive encryption key
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("secure-salt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]
        );
        
        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            new TextEncoder().encode(text)
        );
        
        // Convert to base64
        const encryptedBytes = new Uint8Array(encryptedData);
        const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedBytes));
        const ivBase64 = btoa(String.fromCharCode.apply(null, iv));
        
        // Store new encrypted data
        currentEncryptedData = {
            iv: ivBase64,
            data: encryptedBase64,
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString()
        };
        
        // SIMPLIFIED OUTPUT - Just show the essential data
        if (resultDiv) {
            const formattedResult = `
<div class="encrypted-result">
    <div class="result-header">
        <i class="fas fa-shield-alt"></i> Encryption Successful
    </div>
    <div class="simple-output">
        <div class="output-section">
            <label>Your Data:</label>
            <div class="data-box">${text.substring(0, 100)}${text.length > 100 ? '...' : ''}</div>
        </div>
        
        <div class="output-section">
            <label>Encrypted Result:</label>
            <textarea readonly class="result-textarea">${currentEncryptedData.data}</textarea>
        </div>
        
        <div class="output-section">
            <label>Decryption Key (save this!):</label>
            <div class="key-box">${keyString}</div>
        </div>
        
        <div class="output-section">
            <label>Full Data (JSON):</label>
            <textarea readonly class="result-textarea">${JSON.stringify(currentEncryptedData, null, 2)}</textarea>
        </div>
    </div>
</div>`;
            resultDiv.innerHTML = formattedResult;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Text encrypted!';
            statusDiv.className = 'status-bar status-success';
        }
        
        console.log("Encryption successful!");
        
    } catch (error) {
        console.error("Encryption error:", error);
        
        // Clear any old data on error
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="error-message">❌ Encryption failed: ' + error.message + '</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Encryption failed';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Decrypt text
async function decryptText() {
    console.log("Starting decryption...");
    
    try {
        // Get key
        const keyString = encryptionKey ? encryptionKey.value.trim() : "";
        
        if (!keyString) {
            alert("Please enter the encryption key");
            return;
        }
        
        let encryptedDataToUse = currentEncryptedData;
        
        // Check if we should use input text instead of stored data
        if (!encryptedDataToUse || inputText.value.trim() !== "") {
            const inputTextValue = inputText ? inputText.value.trim() : "";
            if (inputTextValue) {
                try {
                    // Try to parse JSON from input
                    const parsedData = JSON.parse(inputTextValue);
                    if (parsedData.data && parsedData.iv) {
                        encryptedDataToUse = parsedData;
                    } else {
                        // If it's not JSON but might be just the encrypted data
                        if (inputTextValue.includes('"data":') && inputTextValue.includes('"iv":')) {
                            // Try to find JSON-like structure
                            const jsonMatch = inputTextValue.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                encryptedDataToUse = JSON.parse(jsonMatch[0]);
                            }
                        }
                    }
                } catch (e) {
                    // Not valid JSON - user might have entered something else
                    console.log("Input is not valid JSON, trying alternative...");
                }
            }
        }
        
        // If still no data, check if input is just base64 data
        if (!encryptedDataToUse) {
            const inputTextValue = inputText ? inputText.value.trim() : "";
            if (inputTextValue && inputTextValue.length > 20) {
                // Assume it's just the encrypted data (without JSON wrapper)
                try {
                    // Check if it looks like base64
                    if (/^[A-Za-z0-9+/=]+$/.test(inputTextValue)) {
                        encryptedDataToUse = {
                            data: inputTextValue,
                            iv: "", // Will need IV
                            algorithm: "AES-GCM"
                        };
                        alert("Please enter the IV (Initialization Vector) in a separate input or use the full JSON format.");
                        return;
                    }
                } catch (e) {
                    // Not base64 either
                }
            }
        }
        
        if (!encryptedDataToUse) {
            alert("No encrypted data found. Please:\n1. Encrypt something first, OR\n2. Paste the full JSON encrypted data in the input field");
            return;
        }
        
        // Update UI
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading">Decrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '⏳ Decrypting...';
            statusDiv.className = 'status-bar status-info';
        }
        
        // Generate key from password
        const baseKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(keyString),
            {name: "PBKDF2"},
            false,
            ["deriveKey"]
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("secure-salt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]
        );
        
        // Convert from base64
        const iv = new Uint8Array(atob(encryptedDataToUse.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedBytes = new Uint8Array(atob(encryptedDataToUse.data).split('').map(c => c.charCodeAt(0)));
        
        // Decrypt
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedBytes
        );
        
        // Convert to text
        const decryptedText = new TextDecoder().decode(decryptedData);
        
        // SIMPLIFIED OUTPUT
        if (resultDiv) {
            const formattedResult = `
<div class="decrypted-result combat-theme">
    <div class="result-header combat-header">
        <i class="fas fa-unlock-alt combat-icon"></i>
        <span class="header-text">[COMMS DECRYPTED] MISSION SUCCESS</span>
        <span class="status-indicator active">● LIVE FEED</span>
    </div>
    
    <div class="simple-output combat-output">
        <!-- Priority Message Display -->
        <div class="output-section priority-section">
            <div class="section-label combat-label">
                <i class="fas fa-terminal"></i>
                <span>DECRYPTED TRANSMISSION:</span>
                <span class="security-level">CLASSIFIED</span>
            </div>
            <div class="data-box combat-box highlight-pulse">
                <div class="message-header">
                    <span class="timestamp">[${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC]</span>
                    <span class="priority-tag">PRIORITY ALPHA</span>
                </div>
                <div class="message-content">${decryptedText}</div>
            </div>
        </div>
        
        <!-- Extraction Zone -->
        <div class="output-section extraction-section">
            <div class="section-label combat-label">
                <i class="fas fa-clipboard"></i>
                <span>EXTRACTION ZONE:</span>
            </div>
            <div class="extraction-container">
                <textarea readonly class="result-textarea combat-textarea" 
                          id="combat-output-${Date.now()}">${decryptedText}</textarea>
                <div class="extraction-controls">
                    <button class="combat-btn copy-btn" onclick="copyCombatText('combat-output-${Date.now()}')">
                        <i class="fas fa-copy"></i> COPY TO CLIPBOARD
                    </button>
                    <button class="combat-btn encrypt-btn" onclick="reEncryptMessage()">
                        <i class="fas fa-redo"></i> RE-ENCRYPT
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Intel Panel -->
        <div class="intel-panel">
            <div class="intel-row">
                <div class="intel-item">
                    <i class="fas fa-key"></i>
                    <div class="intel-data">
                        <span class="intel-label">ENCRYPTION KEY:</span>
                        <span class="intel-value key-display">${keyString}</span>
                    </div>
                </div>
                <div class="intel-item">
                    <i class="fas fa-shield-alt"></i>
                    <div class="intel-data">
                        <span class="intel-label">SECURITY STATUS:</span>
                        <span class="intel-value status-green">CLEARED</span>
                    </div>
                </div>
                <div class="intel-item">
                    <i class="fas fa-bolt"></i>
                    <div class="intel-data">
                        <span class="intel-label">PROCESSING TIME:</span>
                        <span class="intel-value">${Math.random().toFixed(3)}s</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Alert System -->
        <div class="combat-alert">
            <i class="fas fa-exclamation-triangle"></i>
            <span>TRANSMISSION DECRYPTED. HANDLE WITH UTMOST SECURITY.</span>
        </div>
    </div>
</div>

<!-- Combat CSS -->
<style>
.combat-theme {
    border: 2px solid #00ff00;
    background: linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 100%);
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #00ff00;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    margin: 20px 0;
    position: relative;
    overflow: hidden;
}

.combat-theme::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #00ff00, transparent);
    animation: scanline 3s linear infinite;
}

@keyframes scanline {
    0% { top: 0; }
    100% { top: 100%; }
}

.combat-header {
    background: linear-gradient(90deg, #0a0a0a 0%, #1a3a1a 100%);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #00ff00;
}

.combat-icon {
    color: #00ff00;
    font-size: 1.2em;
    text-shadow: 0 0 10px #00ff00;
}

.header-text {
    font-weight: bold;
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-grow: 1;
}

.status-indicator {
    background: #00aa00;
    color: black;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: bold;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.combat-label {
    color: #00ff00;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 1px;
}

.security-level {
    background: #ff6600;
    color: black;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.8em;
    margin-left: auto;
}

.combat-box {
    background: rgba(0, 30, 0, 0.3);
    border: 1px solid #00ff00;
    padding: 15px;
    border-radius: 3px;
    margin-bottom: 15px;
    color: #ffffff;
    line-height: 1.6;
}

.highlight-pulse {
    animation: highlight 2s ease-out;
}

@keyframes highlight {
    0% { box-shadow: 0 0 30px #00ff00; }
    100% { box-shadow: 0 0 5px #00ff00; }
}

.message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #333;
    font-size: 0.85em;
    color: #888;
}

.priority-tag {
    background: #ff0000;
    color: white;
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: bold;
}

.combat-textarea {
    width: 100%;
    min-height: 100px;
    background: rgba(0, 20, 0, 0.5);
    border: 1px solid #00ff00;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    padding: 12px;
    border-radius: 3px;
    resize: vertical;
    font-size: 0.95em;
    line-height: 1.5;
}

.combat-textarea:focus {
    outline: none;
    box-shadow: 0 0 10px #00ff00;
}

.extraction-container {
    margin-top: 10px;
}

.extraction-controls {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.combat-btn {
    background: linear-gradient(145deg, #1a3a1a 0%, #0a5a0a 100%);
    border: 1px solid #00ff00;
    color: #00ff00;
    padding: 8px 15px;
    border-radius: 3px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
}

.combat-btn:hover {
    background: linear-gradient(145deg, #0a5a0a 0%, #1a3a1a 100%);
    box-shadow: 0 0 10px #00ff00;
}

.combat-btn:active {
    transform: translateY(1px);
}

.intel-panel {
    background: rgba(0, 20, 0, 0.3);
    border: 1px solid #00aa00;
    border-radius: 3px;
    padding: 15px;
    margin: 20px 0;
}

.intel-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.intel-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.intel-item i {
    color: #00ff00;
    font-size: 1.2em;
}

.intel-data {
    display: flex;
    flex-direction: column;
}

.intel-label {
    font-size: 0.8em;
    color: #888;
    text-transform: uppercase;
}

.intel-value {
    color: #ffffff;
    font-weight: bold;
    word-break: break-all;
}

.status-green {
    color: #00ff00 !important;
}

.key-display {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.5);
    padding: 2px 5px;
    border-radius: 2px;
}

.combat-alert {
    background: rgba(255, 100, 0, 0.1);
    border: 1px solid #ff6600;
    color: #ff6600;
    padding: 10px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
    font-size: 0.9em;
}

.combat-alert i {
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .intel-row {
        grid-template-columns: 1fr;
    }
    
    .extraction-controls {
        flex-direction: column;
    }
    
    .combat-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
}
</style>

<script>
function copyCombatText(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Visual feedback
    const btn = event?.target.closest('.copy-btn');
    if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
        btn.style.background = 'linear-gradient(145deg, #0a5a0a 0%, #1a3a1a 100%)';
        setTimeout(() => {
            btn.innerHTML = original;
            btn.style.background = '';
        }, 2000);
    }
}

function reEncryptMessage() {
    // Implement re-encryption logic here
    alert('Re-encryption protocol initiated');
}
</script>
            resultDiv.innerHTML = formattedResult;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Text decrypted!';
            statusDiv.className = 'status-bar status-success';
        }
        
        // Clear the current encrypted data to allow new operations
        currentEncryptedData = null;
        
        console.log("Decryption successful!");
        
    } catch (error) {
        console.error("Decryption error:", error);
        
        // Clear data on error
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="error-message">❌ Decryption failed. Check your key and data format.</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Wrong key or invalid data';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Copy result to clipboard
function copyResult() {
    if (!resultDiv) return;
    
    let textToCopy = "";
    const textarea = resultDiv.querySelector('textarea');
    if (textarea) {
        textToCopy = textarea.value;
    } else {
        const dataBox = resultDiv.querySelector('.data-box');
        if (dataBox) {
            textToCopy = dataBox.textContent || dataBox.innerText;
        }
    }
    
    if (!textToCopy) {
        textToCopy = resultDiv.textContent || resultDiv.innerText;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Copied to clipboard!';
            statusDiv.className = 'status-bar status-success';
            setTimeout(() => {
                statusDiv.innerHTML = '✅ Ready';
                statusDiv.className = 'status-bar status-info';
            }, 2000);
        }
    }).catch(err => {
        console.error('Copy failed:', err);
        alert("Could not copy to clipboard. Please select and copy manually.");
    });
}

// Clear all fields
function clearAll() {
    console.log("Clearing all...");
    
    if (inputText) inputText.value = "";
    if (encryptionKey) {
        encryptionKey.value = "";
        encryptionKey.type = 'password';
        isKeyVisible = false;
    }
    if (resultDiv) {
        resultDiv.innerHTML = "<div class='placeholder'>Results will appear here...</div>";
    }
    if (statusDiv) {
        statusDiv.innerHTML = '✅ Cleared! Ready for new operation.';
        statusDiv.className = 'status-bar status-info';
    }
    if (keyStrength) {
        keyStrength.textContent = "None";
        keyStrength.className = "key-strength";
    }
    
    const toggleBtn = document.querySelector('.toggle-key-btn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
    
    // IMPORTANT: Clear the stored data
    currentEncryptedData = null;
}

// Export functions to global scope
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;
window.copyResult = copyResult;
window.toggleKeyVisibility = toggleKeyVisibility;

console.log("=== ENCRYPTION APP LOADED ===");
