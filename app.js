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
    
    // Clear encrypted data when input changes
    if (inputText) {
        inputText.addEventListener('input', function() {
            currentEncryptedData = null;
            if (resultDiv) {
                resultDiv.innerHTML = '<div class="placeholder">Ready for new operation...</div>';
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
        const array = new Uint8Array(32); // Stronger 32-byte key
        window.crypto.getRandomValues(array);
        
        // Convert to base64 URL-safe format
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Set the key and clear old results
        encryptionKey.value = key;
        currentEncryptedData = null;
        
        // Update displays
        updateKeyStrengthDisplay();
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Secure 256-bit key generated!';
            statusDiv.className = 'status-bar status-success';
        }
        
        // Show key in a separate alert (security sensitive)
        showKeyInPopup(key);
        
    } catch (error) {
        console.error("Key generation error:", error);
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Error generating key';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Show encryption key in a popup window (separate from main output)
function showKeyInPopup(key) {
    const popup = document.createElement('div');
    popup.className = 'key-popup-overlay';
    popup.innerHTML = `
        <div class="key-popup">
            <div class="key-popup-header">
                <i class="fas fa-key"></i>
                <h3>ENCRYPTION KEY GENERATED</h3>
                <button class="close-popup" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="key-popup-content">
                <p class="warning"><i class="fas fa-exclamation-triangle"></i> <strong>IMPORTANT:</strong> Save this key! You will need it to decrypt your data.</p>
                
                <div class="key-display">
                    <label>Your Encryption Key:</label>
                    <div class="key-value">${key}</div>
                </div>
                
                <div class="key-actions">
                    <button class="btn-primary" onclick="copyToClipboard('${key}')">
                        <i class="fas fa-copy"></i> Copy Key
                    </button>
                    <button class="btn-secondary" onclick="downloadKey('${key}')">
                        <i class="fas fa-download"></i> Download as .txt
                    </button>
                    <button class="btn-secondary" onclick="printKey('${key}')">
                        <i class="fas fa-print"></i> Print Key
                    </button>
                </div>
                
                <div class="security-tips">
                    <p><strong>Security Tips:</strong></p>
                    <ul>
                        <li>Store this key in a password manager</li>
                        <li>Do not share this key with others</li>
                        <li>Keep separate from encrypted data</li>
                        <li>Make a backup in a secure location</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("✅ Key copied to clipboard!");
    }).catch(err => {
        console.error('Copy failed:', err);
        alert("Could not copy to clipboard. Please select and copy manually.");
    });
}

// Download key as text file
function downloadKey(key) {
    const blob = new Blob([`ENCRYPTION KEY\n================\n\nKey: ${key}\n\nGenerated: ${new Date().toLocaleString()}\n\n⚠️ IMPORTANT: Keep this file secure!`], 
        { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encryption-key-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Print key
function printKey(key) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Encryption Key</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .key-box { 
                    background: #f5f5f5; 
                    padding: 15px; 
                    border: 2px dashed #333; 
                    margin: 20px 0; 
                    word-break: break-all;
                    font-family: monospace;
                }
                .warning { color: #d32f2f; font-weight: bold; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>🔐 Encryption Key</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            
            <div class="warning">⚠️ IMPORTANT: Keep this document secure!</div>
            
            <h2>Your Encryption Key:</h2>
            <div class="key-box">${key}</div>
            
            <p><strong>Instructions:</strong></p>
            <ul>
                <li>Store in a secure location</li>
                <li>Keep separate from encrypted data</li>
                <li>Required for decryption</li>
            </ul>
            
            <button class="no-print" onclick="window.print()">Print</button>
            <button class="no-print" onclick="window.close()">Close</button>
        </body>
        </html>
    `);
    printWindow.document.close();
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
    } else if (key.length >= 32) {
        strength = "Excellent";
        className = "key-strong";
    } else if (key.length >= 16) {
        strength = "Strong";
        className = "key-strong";
    } else if (key.length >= 8) {
        strength = "Good";
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
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Encrypting your data...</div>';
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
            timestamp: new Date().toISOString(),
            dataLength: text.length
        };
        
        // SIMPLIFIED OUTPUT - Easy to copy format
        const exportText = `🔐 ENCRYPTED DATA
=====================
Encrypted: ${new Date().toLocaleString()}
Algorithm: AES-256-GCM
Data Size: ${text.length} characters

ENCRYPTED CONTENT:
${encryptedBase64}

IV (Required for decryption):
${ivBase64}

⚠️ Keep this data separate from your encryption key!
=====================
Need to decrypt? Use the same key with this data.`;
        
        // Display results in large, easy-to-copy format
        if (resultDiv) {
            const formattedResult = `
<div class="result-container">
    <div class="result-header success">
        <i class="fas fa-shield-alt"></i>
        <h3>ENCRYPTION SUCCESSFUL</h3>
    </div>
    
    <div class="result-summary">
        <div class="summary-item">
            <span class="summary-label">Original Text:</span>
            <div class="summary-value">${text.length > 50 ? text.substring(0, 50) + '...' : text}</div>
        </div>
        <div class="summary-item">
            <span class="summary-label">Key Strength:</span>
            <span class="summary-value key-${getKeyStrength(keyString)}">${getKeyStrength(keyString)}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Encrypted Size:</span>
            <div class="summary-value">${encryptedBase64.length} characters</div>
        </div>
    </div>
    
    <div class="export-section">
        <h4><i class="fas fa-copy"></i> ENCRYPTED DATA (Copy All):</h4>
        <textarea class="export-textarea" readonly rows="8">${exportText}</textarea>
        
        <div class="export-actions">
            <button class="btn-primary" onclick="copyExportText()">
                <i class="fas fa-copy"></i> Copy All
            </button>
            <button class="btn-secondary" onclick="downloadEncryptedData('${encryptedBase64}', '${ivBase64}')">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="btn-secondary" onclick="shareEncryptedData()">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
    </div>
    
    <div class="security-notice">
        <i class="fas fa-exclamation-triangle"></i>
        <p><strong>Important:</strong> Your encryption key is not shown here for security. Keep your key separate from this encrypted data.</p>
    </div>
</div>`;
            resultDiv.innerHTML = formattedResult;
            // Auto-scroll to results
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Text encrypted successfully!';
            statusDiv.className = 'status-bar status-success';
        }
        
        console.log("Encryption successful!");
        
    } catch (error) {
        console.error("Encryption error:", error);
        
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Encryption failed: ' + error.message + '</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Encryption failed';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Helper function to get key strength
function getKeyStrength(key) {
    if (!key) return "none";
    if (key.length >= 32) return "excellent";
    if (key.length >= 16) return "strong";
    if (key.length >= 8) return "good";
    return "weak";
}

// Copy export text to clipboard
function copyExportText() {
    const textarea = document.querySelector('.export-textarea');
    if (textarea) {
        copyToClipboard(textarea.value);
    }
}

// Download encrypted data
function downloadEncryptedData(encryptedData, iv) {
    const data = {
        encrypted: encryptedData,
        iv: iv,
        algorithm: "AES-256-GCM",
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        
        // Check input for encrypted data
        const inputTextValue = inputText ? inputText.value.trim() : "";
        let encryptedDataToUse = null;
        
        if (inputTextValue) {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(inputTextValue);
                if (parsed.data && parsed.iv) {
                    encryptedDataToUse = parsed;
                }
            } catch (e) {
                // Not JSON, check if it's just base64
                if (inputTextValue.length > 50 && /^[A-Za-z0-9+/=]+$/.test(inputTextValue.split('\n')[0])) {
                    // Might be our export format - try to extract
                    const lines = inputTextValue.split('\n');
                    let data = '', iv = '';
                    
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('ENCRYPTED CONTENT:')) {
                            for (let j = i + 1; j < lines.length && lines[j] && !lines[j].includes('IV'); j++) {
                                data += lines[j].trim();
                            }
                        }
                        if (lines[i].includes('IV (Required for decryption):')) {
                            iv = lines[i + 1] ? lines[i + 1].trim() : '';
                        }
                    }
                    
                    if (data && iv) {
                        encryptedDataToUse = { data, iv };
                    }
                }
            }
        }
        
        // Use stored data if available and input is empty
        if (!encryptedDataToUse && currentEncryptedData) {
            encryptedDataToUse = currentEncryptedData;
        }
        
        if (!encryptedDataToUse) {
            alert("No encrypted data found. Please paste the encrypted data in the input field.\n\nFormat can be:\n1. Full JSON object\n2. The export format from this app\n3. Just the encrypted base64 string (if you have the IV)");
            return;
        }
        
        // Update UI
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Decrypting...</div>';
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
        
        // SIMPLIFIED DECRYPTION OUTPUT
        const decryptedExport = `🔓 DECRYPTED MESSAGE
=====================
Decrypted: ${new Date().toLocaleString()}
Algorithm: AES-256-GCM
Key Strength: ${getKeyStrength(keyString).toUpperCase()}

ORIGINAL MESSAGE:
=====================
${decryptedText}

=====================
✅ Decryption successful using ${keyString.length}-character key`;
        
        if (resultDiv) {
            const formattedResult = `
<div class="result-container">
    <div class="result-header success">
        <i class="fas fa-unlock"></i>
        <h3>DECRYPTION SUCCESSFUL</h3>
    </div>
    
    <div class="decrypted-content">
        <h4><i class="fas fa-file-alt"></i> Decrypted Text:</h4>
        <div class="message-display">${decryptedText}</div>
    </div>
    
    <div class="export-section">
        <h4><i class="fas fa-copy"></i> COPY FORMAT:</h4>
        <textarea class="export-textarea" readonly rows="6">${decryptedExport}</textarea>
        
        <div class="export-actions">
            <button class="btn-primary" onclick="copyExportText()">
                <i class="fas fa-copy"></i> Copy All
            </button>
            <button class="btn-secondary" onclick="copyToClipboard('${decryptedText.replace(/'/g, "\\'")}')">
                <i class="fas fa-copy"></i> Copy Text Only
            </button>
        </div>
    </div>
</div>`;
            resultDiv.innerHTML = formattedResult;
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Text decrypted successfully!';
            statusDiv.className = 'status-bar status-success';
        }
        
        currentEncryptedData = null;
        
        console.log("Decryption successful!");
        
    } catch (error) {
        console.error("Decryption error:", error);
        
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Decryption failed. Please check:<br>1. Your encryption key<br>2. The encrypted data format<br>3. That the IV is included</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Wrong key or invalid data';
            statusDiv.className = 'status-bar status-error';
        }
    }
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
        resultDiv.innerHTML = '<div class="placeholder"><i class="fas fa-info-circle"></i><br>Results will appear here<br><small>Encrypt or decrypt text to see results</small></div>';
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
    
    // Remove any popups
    const popups = document.querySelectorAll('.key-popup-overlay');
    popups.forEach(popup => popup.remove());
    
    currentEncryptedData = null;
}

// Export functions to global scope
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;
window.copyResult = copyResult;
window.toggleKeyVisibility = toggleKeyVisibility;
window.copyToClipboard = copyToClipboard;
window.downloadKey = downloadKey;
window.printKey = printKey;
window.copyExportText = copyExportText;
window.downloadEncryptedData = downloadEncryptedData;

console.log("=== ENCRYPTION APP LOADED ===");
