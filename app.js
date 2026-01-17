// Secure Encryption App - Main JavaScript
console.log("=== ENCRYPTION APP STARTING ===");

// Global variables
let currentEncryptedData = null;
let isKeyVisible = false; // Track key visibility

// DOM Elements
let inputText, encryptionKey, resultDiv, statusDiv, toggleKeyBtn, keyStrength;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, getting elements...");
    
    // Get DOM elements
    inputText = document.getElementById('inputText');
    encryptionKey = document.getElementById('encryptionKey');
    resultDiv = document.getElementById('result');
    statusDiv = document.getElementById('status');
    keyStrength = document.getElementById('keyStrength');
    
    console.log("Elements found:", {
        inputText: !!inputText,
        encryptionKey: !!encryptionKey,
        resultDiv: !!resultDiv,
        statusDiv: !!statusDiv,
        keyStrength: !!keyStrength
    });
    
    // Set initial values
    if (inputText) {
        inputText.value = "";
        inputText.placeholder = "Enter text to encrypt OR encrypted data to decrypt (base64 or JSON format)...";
    }
    if (encryptionKey) {
        encryptionKey.value = "";
        encryptionKey.type = 'password'; // Hide key by default
    }
    if (statusDiv) statusDiv.textContent = "✅ App ready! Click 'Generate Key' or 'Encrypt' to start.";
    
    // Update key strength on input
    if (encryptionKey) {
        encryptionKey.addEventListener('input', updateKeyStrengthDisplay);
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
        const array = new Uint8Array(24); // Increased length for stronger key
        window.crypto.getRandomValues(array);
        
        // Convert to base64 URL-safe format
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Set the key
        encryptionKey.value = key;
        
        // Update key strength display
        updateKeyStrengthDisplay();
        
        // Update status
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>✅ Secure key generated!</span>';
            statusDiv.className = 'status-bar status-success';
        }
        
        console.log("Key generated:", key.substring(0, 10) + "...");
        
    } catch (error) {
        console.error("Key generation error:", error);
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>❌ Error generating key</span>';
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
        strength = "Auto-generated";
        className = "";
    } else if (key.length >= 16) {
        strength = "Strong";
        className = "key-strong";
    } else if (key.length >= 8) {
        strength = "Medium";
        className = "key-good"; // Changed from "key-medium" to match CSS
    } else if (key.length >= 4) {
        strength = "Weak";
        className = "key-weak";
    } else {
        strength = "Too Short";
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

// NEW: Helper function to parse encrypted data from various formats
function parseEncryptedData(input) {
    console.log("Parsing encrypted data...");
    
    const trimmedInput = input.trim();
    
    // Try to parse as JSON first
    if (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmedInput);
            console.log("Detected JSON format");
            return parsed;
        } catch (e) {
            console.log("Not valid JSON, trying other formats");
        }
    }
    
    // Check if it looks like a structured export format (with IV and data sections)
    const lines = trimmedInput.split('\n');
    let encryptedData = null;
    let iv = null;
    let algorithm = "AES-GCM-256";
    
    // Parse the structured export format
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('ENCRYPTED DATA:')) {
            // Next line(s) should contain the encrypted data
            encryptedData = lines[i + 1] ? lines[i + 1].trim() : null;
        }
        
        if (line.startsWith('INITIALIZATION VECTOR (IV):')) {
            // Next line(s) should contain the IV
            iv = lines[i + 1] ? lines[i + 1].trim() : null;
        }
        
        if (line.startsWith('Algorithm:')) {
            algorithm = line.split(':')[1].trim();
        }
    }
    
    // If we found both encrypted data and IV in the structured format
    if (encryptedData && iv) {
        console.log("Detected structured export format");
        return {
            data: encryptedData,
            iv: iv,
            algorithm: algorithm,
            timestamp: new Date().toISOString()
        };
    }
    
    // Check if it's just a single base64 string (might be encrypted data only)
    // In this case, we'll need to ask for IV separately or use a default
    if (trimmedInput.length > 20 && /^[A-Za-z0-9+/=]+$/.test(trimmedInput)) {
        console.log("Detected base64 data, assuming it's encrypted data only");
        return {
            data: trimmedInput,
            iv: null, // IV will need to be provided separately
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString()
        };
    }
    
    return null;
}

// NEW: Helper function to get IV from user if needed
async function getMissingIV() {
    // If IV is missing, prompt user for it
    return new Promise((resolve) => {
        const iv = prompt(
            "IV (Initialization Vector) not found.\n\n" +
            "Please enter the IV (base64 format) that was generated during encryption:\n\n" +
            "The IV is usually a base64 string like 'XxYyZz1234567890'.\n" +
            "If you encrypted with this app, check the 'INITIALIZATION VECTOR (IV):' section in the output."
        );
        
        if (iv && iv.trim()) {
            resolve(iv.trim());
        } else {
            resolve(null);
        }
    });
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
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Encrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>⏳ Encrypting...</span>';
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
        
        // Store for later use
        currentEncryptedData = {
            iv: ivBase64,
            data: encryptedBase64,
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString()
        };
        
        // Create nicely formatted export text
        const exportText = `🔐 SECURE ENCRYPTION EXPORT 🔐
        
ENCRYPTION DETAILS:
=====================
Algorithm: ${currentEncryptedData.algorithm}
Timestamp: ${new Date(currentEncryptedData.timestamp).toLocaleString()}
Key Strength: ${getKeyStrength(keyString)}

ENCRYPTED DATA:
=====================
${currentEncryptedData.data}

INITIALIZATION VECTOR (IV):
=====================
${currentEncryptedData.iv}

FULL JSON DATA (for import):
=====================
${JSON.stringify(currentEncryptedData, null, 2)}

🔐 END OF ENCRYPTED DATA 🔐

⚠️ IMPORTANT NOTES:
- Keep this data secure
- The IV is needed for decryption
- Store the encryption key separately
- This export does NOT contain the encryption key`;

        // Format and display result
        if (resultDiv) {
            const formattedResult = `
<div class="encrypted-result">
    <div class="result-header">
        <i class="fas fa-shield-alt"></i> Encrypted Data
    </div>
    <div class="result-grid">
        <div class="result-item">
            <span class="result-label">Algorithm:</span>
            <span class="result-value">${currentEncryptedData.algorithm}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Timestamp:</span>
            <span class="result-value">${new Date(currentEncryptedData.timestamp).toLocaleString()}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Key Strength:</span>
            <span class="result-value key-${getKeyStrength(keyString).toLowerCase()}">${getKeyStrength(keyString)}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Encrypted Data:</span>
            <div class="encrypted-data">${currentEncryptedData.data.substring(0, 100)}${currentEncryptedData.data.length > 100 ? '...' : ''}</div>
        </div>
        <div class="result-item">
            <span class="result-label">IV (Initialization Vector):</span>
            <div class="encrypted-data">${currentEncryptedData.iv}</div>
        </div>
        <div class="result-item full-width">
            <span class="result-label">Export Format:</span>
            <textarea readonly class="full-data export-textarea">${exportText}</textarea>
            <div class="export-format-label">
                <i class="fas fa-info-circle"></i> This format is optimized for copying and sharing
            </div>
        </div>
        <div class="result-item full-width">
            <span class="result-label">Full JSON Data:</span>
            <textarea readonly class="full-data">${JSON.stringify(currentEncryptedData, null, 2)}</textarea>
        </div>
    </div>
</div>`;
            resultDiv.innerHTML = formattedResult;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>✅ Text encrypted successfully!</span>';
            statusDiv.className = 'status-bar status-success';
        }
        
        console.log("Encryption successful!");
        
    } catch (error) {
        console.error("Encryption error:", error);
        
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>❌ Encryption failed</span>';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

// Helper function to get key strength text
function getKeyStrength(key) {
    if (!key) return "None";
    if (key.length >= 16) return "Strong";
    if (key.length >= 8) return "Medium";
    if (key.length >= 4) return "Weak";
    return "Too Short";
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
        
        // Get input text
        const inputTextValue = inputText ? inputText.value.trim() : "";
        
        if (!inputTextValue) {
            alert("Please enter encrypted data to decrypt");
            return;
        }
        
        // Update UI
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Decrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>⏳ Decrypting...</span>';
            statusDiv.className = 'status-bar status-info';
        }
        
        // Parse the encrypted data
        let encryptedDataObj = null;
        
        // Check if we have currentEncryptedData from a previous encryption
        if (currentEncryptedData) {
            console.log("Using currently stored encrypted data");
            encryptedDataObj = currentEncryptedData;
        } else {
            // Try to parse the input
            encryptedDataObj = parseEncryptedData(inputTextValue);
            
            // If parsing failed and input looks like a simple string, ask user what format it is
            if (!encryptedDataObj) {
                const userChoice = confirm(
                    "Could not automatically detect the format.\n\n" +
                    "Please select:\n" +
                    "• OK if you have ONLY the encrypted data (base64)\n" +
                    "• Cancel if you have the full JSON or structured format"
                );
                
                if (userChoice) {
                    // User has only encrypted data
                    encryptedDataObj = {
                        data: inputTextValue,
                        iv: null,
                        algorithm: "AES-GCM-256",
                        timestamp: new Date().toISOString()
                    };
                } else {
                    throw new Error("Please use the full JSON format or the structured export format from the encryption output.");
                }
            }
        }
        
        // Check if we have the IV
        if (!encryptedDataObj.iv) {
            const iv = await getMissingIV();
            if (!iv) {
                throw new Error("IV is required for decryption. Please provide the IV.");
            }
            encryptedDataObj.iv = iv;
        }
        
        // Validate required fields
        if (!encryptedDataObj.data || !encryptedDataObj.iv) {
            throw new Error("Missing encrypted data or IV. Please provide both.");
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
        const iv = new Uint8Array(atob(encryptedDataObj.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedData = new Uint8Array(atob(encryptedDataObj.data).split('').map(c => c.charCodeAt(0)));
        
        // Decrypt
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedData
        );
        
        // Convert to text
        const decryptedText = new TextDecoder().decode(decryptedData);
        
        // Format and display result
        if (resultDiv) {
            const formattedResult = `
<div class="decrypted-result">
    <div class="result-header">
        <i class="fas fa-unlock"></i> Decrypted Text
    </div>
    <div class="result-grid">
        <div class="result-item">
            <span class="result-label">Algorithm:</span>
            <span class="result-value">${encryptedDataObj.algorithm || 'AES-GCM'}</span>
        </div>
        <div class="result-item">
            <span class="result-label">Timestamp:</span>
            <span class="result-value">${encryptedDataObj.timestamp ? new Date(encryptedDataObj.timestamp).toLocaleString() : 'Unknown'}</span>
        </div>
        <div class="result-item full-width">
            <span class="result-label">Decrypted Message:</span>
            <div class="decrypted-message">${decryptedText}</div>
        </div>
        <div class="result-item full-width">
            <span class="result-label">Export Format:</span>
            <textarea readonly class="full-data export-textarea">🔓 DECRYPTED MESSAGE 🔓
            
TIMESTAMP: ${new Date().toLocaleString()}
ALGORITHM: ${encryptedDataObj.algorithm || 'AES-GCM'}

DECRYPTED TEXT:
=====================
${decryptedText}

=====================
✅ Decryption successful
🔓 END OF DECRYPTED MESSAGE 🔓</textarea>
            <div class="export-format-label">
                <i class="fas fa-info-circle"></i> Copy-friendly format for sharing decrypted content
            </div>
        </div>
    </div>
</div>`;
            resultDiv.innerHTML = formattedResult;
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>✅ Text decrypted successfully!</span>';
            statusDiv.className = 'status-bar status-success';
        }
        
        console.log("Decryption successful!");
        
    } catch (error) {
        console.error("Decryption error:", error);
        
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>❌ Decryption failed - ${error.message}</span>';
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
        textToCopy = resultDiv.textContent || resultDiv.innerText;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.querySelector('.btn-outline:nth-child(1)');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
        
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>✅ Result copied to clipboard!</span>';
            statusDiv.className = 'status-bar status-success';
            setTimeout(() => {
                statusDiv.innerHTML = '<i class="fas fa-info-circle"></i> <span>✅ App ready</span>';
                statusDiv.className = 'status-bar status-info';
            }, 3000);
        }
    }).catch(err => {
        console.error('Copy failed:', err);
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
        resultDiv.innerHTML = "<div class='placeholder'>Results will appear here after encryption or decryption...</div>";
    }
    if (statusDiv) {
        statusDiv.innerHTML = '<i class="fas fa-info-circle"></i> <span>✅ Cleared! Ready to start again.</span>';
        statusDiv.className = 'status-bar status-info';
    }
    if (keyStrength) {
        keyStrength.textContent = "Auto-generated";
        keyStrength.className = "key-strength";
    }
    
    const toggleBtn = document.querySelector('.toggle-key-btn');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
    
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
