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
<div class="decrypted-result">
    <div class="result-header">
        <i class="fas fa-unlock"></i> Decryption Successful
    </div>
    <div class="simple-output">
        <div class="output-section">
            <label>Decrypted Message:</label>
            <div class="data-box success-box">${decryptedText}</div>
        </div>
        
        <div class="output-section">
            <label>Copy Result:</label>
            <textarea readonly class="result-textarea">${decryptedText}</textarea>
        </div>
        
        <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <span>Used key: ${keyString.substring(0, 20)}${keyString.length > 20 ? '...' : ''}</span>
        </div>
    </div>
</div>`;
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
