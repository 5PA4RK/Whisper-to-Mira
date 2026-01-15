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
    if (statusDiv) statusDiv.textContent = "✅ Ready";
    
    // Update key strength on input
    if (encryptionKey) {
        encryptionKey.addEventListener('input', updateKeyStrengthDisplay);
    }
    
    // Clear encrypted data when input changes
    if (inputText) {
        inputText.addEventListener('input', function() {
            currentEncryptedData = null;
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
        
        // Set the key
        encryptionKey.value = key;
        currentEncryptedData = null;
        
        updateKeyStrengthDisplay();
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Key generated';
            statusDiv.className = 'status-bar status-success';
        }
        
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="simple-result">
                    <div class="result-title">🔑 New Encryption Key Generated</div>
                    <textarea class="copy-box" readonly>${key}</textarea>
                    <div class="hint">Copy this key and keep it safe!</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Key generation error:", error);
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Error';
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
        const text = inputText ? inputText.value.trim() : "";
        const keyString = encryptionKey ? encryptionKey.value.trim() : "";
        
        if (!text) {
            alert("Please enter text to encrypt");
            return;
        }
        if (!keyString) {
            alert("Please enter an encryption key");
            return;
        }
        
        // Update UI
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">Encrypting...</div>';
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
        
        // Generate IV and encrypt
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            new TextEncoder().encode(text)
        );
        
        // Convert to base64
        const encryptedBytes = new Uint8Array(encryptedData);
        const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedBytes));
        const ivBase64 = btoa(String.fromCharCode.apply(null, iv));
        
        // Store data
        currentEncryptedData = {
            iv: ivBase64,
            data: encryptedBase64,
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString()
        };
        
        // Create clean, copy-friendly output
        const outputText = `🔐 ENCRYPTED DATA 🔐

📝 Original: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}
🔑 Key: ${keyString}
📅 Time: ${new Date().toLocaleString()}

=== ENCRYPTED CONTENT ===
${encryptedBase64}

=== INITIALIZATION VECTOR ===
${ivBase64}

=== FULL DATA (JSON) ===
${JSON.stringify(currentEncryptedData, null, 2)}

⚠️ Keep your key and IV secure!
Use this data with the same key to decrypt.`;
        
        // Display result
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="simple-result">
                    <div class="result-title">🔒 Encryption Complete</div>
                    <textarea class="copy-box" readonly>${outputText}</textarea>
                    <div class="hint">Copy everything above for safekeeping</div>
                </div>
            `;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Encrypted!';
            statusDiv.className = 'status-bar status-success';
        }
        
    } catch (error) {
        console.error("Encryption error:", error);
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="error-message">❌ Encryption failed</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Failed';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Decrypt text
async function decryptText() {
    console.log("Starting decryption...");
    
    try {
        const keyString = encryptionKey ? encryptionKey.value.trim() : "";
        
        if (!keyString) {
            alert("Please enter the encryption key");
            return;
        }
        
        let encryptedDataToUse = currentEncryptedData;
        
        // Try to parse from input if no stored data
        if (!encryptedDataToUse) {
            const inputTextValue = inputText ? inputText.value.trim() : "";
            if (inputTextValue) {
                try {
                    // Try to parse JSON
                    const parsed = JSON.parse(inputTextValue);
                    if (parsed.data && parsed.iv) {
                        encryptedDataToUse = parsed;
                    }
                } catch (e) {
                    // Not JSON, check if it's just the encrypted data format
                    const lines = inputTextValue.split('\n');
                    const encryptedLine = lines.find(line => line.includes('===') && lines.indexOf(line) < lines.length - 5);
                    if (encryptedLine) {
                        // Try to extract data from formatted text
                        const dataMatch = inputTextValue.match(/=== ENCRYPTED CONTENT ===\s*([\s\S]+?)\s*===/);
                        const ivMatch = inputTextValue.match(/=== INITIALIZATION VECTOR ===\s*([\s\S]+?)\s*===/);
                        
                        if (dataMatch && ivMatch) {
                            encryptedDataToUse = {
                                data: dataMatch[1].trim(),
                                iv: ivMatch[1].trim(),
                                algorithm: "AES-GCM-256"
                            };
                        }
                    }
                }
            }
        }
        
        if (!encryptedDataToUse || !encryptedDataToUse.data || !encryptedDataToUse.iv) {
            alert(`To decrypt, please provide:
            
1. The ENCRYPTED DATA (from previous encryption), OR
2. Paste the full output from encryption
            
Make sure you have both the encrypted content AND initialization vector.`);
            return;
        }
        
        // Update UI
        if (resultDiv) resultDiv.innerHTML = '<div class="loading">Decrypting...</div>';
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
        
        // Convert and decrypt
        const iv = new Uint8Array(atob(encryptedDataToUse.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedBytes = new Uint8Array(atob(encryptedDataToUse.data).split('').map(c => c.charCodeAt(0)));
        
        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encryptedBytes
        );
        
        const decryptedText = new TextDecoder().decode(decryptedData);
        
        // Create clean output
        const outputText = `🔓 DECRYPTED MESSAGE 🔓

✅ Successfully decrypted!
📅 Time: ${new Date().toLocaleString()}
🔑 Key used: ${keyString.substring(0, 20)}${keyString.length > 20 ? '...' : ''}

=== YOUR MESSAGE ===
${decryptedText}

=== FULL MESSAGE ===
${decryptedText}

✅ Copy the message above.`;
        
        // Display result
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="simple-result">
                    <div class="result-title">🔓 Decryption Complete</div>
                    <textarea class="copy-box" readonly>${outputText}</textarea>
                    <div class="hint">Your decrypted message is ready</div>
                </div>
            `;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '✅ Decrypted!';
            statusDiv.className = 'status-bar status-success';
        }
        
        currentEncryptedData = null;
        
    } catch (error) {
        console.error("Decryption error:", error);
        currentEncryptedData = null;
        
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error-message">
                    ❌ Decryption failed
                    <div class="error-hint">Check your key and ensure you have the complete encrypted data.</div>
                </div>
            `;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '❌ Wrong key/data';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Copy result to clipboard
function copyResult() {
    if (!resultDiv) return;
    
    const textarea = resultDiv.querySelector('textarea');
    if (textarea) {
        const text = textarea.value;
        navigator.clipboard.writeText(text).then(() => {
            if (statusDiv) {
                statusDiv.innerHTML = '✅ Copied!';
                statusDiv.className = 'status-bar status-success';
                setTimeout(() => {
                    statusDiv.innerHTML = '✅ Ready';
                    statusDiv.className = 'status-bar status-info';
                }, 2000);
            }
        }).catch(err => {
            alert("Select the text and copy manually (Ctrl+C)");
        });
    }
}

// Clear all fields
function clearAll() {
    if (inputText) inputText.value = "";
    if (encryptionKey) {
        encryptionKey.value = "";
        encryptionKey.type = 'password';
        isKeyVisible = false;
    }
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="simple-result">
                <div class="result-title">📝 Encryption App</div>
                <div class="placeholder">
                    1. Generate or enter an encryption key<br>
                    2. Type your message<br>
                    3. Click Encrypt or Decrypt<br><br>
                    Results will appear here.
                </div>
            </div>
        `;
    }
    if (statusDiv) {
        statusDiv.innerHTML = '✅ Ready';
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
    
    currentEncryptedData = null;
}

// Export functions
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;
window.copyResult = copyResult;
window.toggleKeyVisibility = toggleKeyVisibility;

console.log("=== ENCRYPTION APP LOADED ===");
