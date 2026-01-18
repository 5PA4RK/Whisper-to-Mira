
console.log("=== ENCRYPTION APP STARTING ===");


let currentEncryptedData = null;
let isKeyVisible = false; 
const IV_SEPARATOR = '::IV::'; 

let inputText, encryptionKey, resultDiv, statusDiv, toggleKeyBtn, keyStrength;


document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, getting elements...");
    

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
    

    if (inputText) {
        inputText.value = "";
        inputText.placeholder = "For encryption: Enter text to encrypt\nFor decryption: Paste encrypted data (any format)";
    }
    if (encryptionKey) {
        encryptionKey.value = "";
        encryptionKey.type = 'password'; 
    }
    if (statusDiv) statusDiv.textContent = "✅ App ready! Click 'Generate Key' or 'Encrypt' to start.";
    

    if (encryptionKey) {
        encryptionKey.addEventListener('input', updateKeyStrengthDisplay);
    }
    
    console.log("App initialized successfully!");
});


function generateKey() {
    console.log("Generating key...");
    
    try {
        if (!encryptionKey) {
            alert("Error: Encryption key element not found!");
            return;
        }
        

        const array = new Uint8Array(24);
        window.crypto.getRandomValues(array);
        

        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        

        encryptionKey.value = key;
        

        updateKeyStrengthDisplay();
        

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
        className = "key-good"; 
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


function combineIVandData(ivBase64, dataBase64) {
    return ivBase64 + IV_SEPARATOR + dataBase64;
}


function splitIVandData(combinedString) {
    const parts = combinedString.split(IV_SEPARATOR);
    if (parts.length === 2) {
        return {
            iv: parts[0],
            data: parts[1]
        };
    }
    return null;
}


function parseEncryptedData(input) {
    console.log("Parsing encrypted data...");
    
    const trimmedInput = input.trim();
    

    const splitData = splitIVandData(trimmedInput);
    if (splitData) {
        console.log("Detected combined IV+Data format");
        return {
            data: splitData.data,
            iv: splitData.iv,
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString(),
            format: "combined"
        };
    }
    

    if (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmedInput);
            console.log("Detected JSON format");
            if (parsed.data && parsed.iv) {
                return parsed;
            }
        } catch (e) {
            console.log("Not valid JSON, trying other formats");
        }
    }
    

    const lines = trimmedInput.split('\n');
    let encryptedData = null;
    let iv = null;
    let algorithm = "AES-GCM-256";
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('ENCRYPTED DATA:')) {
            encryptedData = lines[i + 1] ? lines[i + 1].trim() : null;
        }
        
        if (line.startsWith('INITIALIZATION VECTOR (IV):')) {
            iv = lines[i + 1] ? lines[i + 1].trim() : null;
        }
        
        if (line.startsWith('Algorithm:')) {
            algorithm = line.split(':')[1].trim();
        }
    }
    
    if (encryptedData && iv) {
        console.log("Detected structured export format");
        return {
            data: encryptedData,
            iv: iv,
            algorithm: algorithm,
            timestamp: new Date().toISOString(),
            format: "structured"
        };
    }
    

    if (trimmedInput.length > 20 && /^[A-Za-z0-9+/=]+$/.test(trimmedInput)) {
        console.log("Detected base64 only, but no IV found");
        return null;
    }
    
    return null;
}


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
        
 
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Encrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>⏳ Encrypting...</span>';
            statusDiv.className = 'status-bar status-info';
        }
        

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
        

        const iv = crypto.getRandomValues(new Uint8Array(12));
        

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            new TextEncoder().encode(text)
        );
        

        const encryptedBytes = new Uint8Array(encryptedData);
        const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedBytes));
        const ivBase64 = btoa(String.fromCharCode.apply(null, iv));
        

        const combinedString = combineIVandData(ivBase64, encryptedBase64);
        

        currentEncryptedData = {
            iv: ivBase64,
            data: encryptedBase64,
            combined: combinedString, 
            algorithm: "AES-GCM-256",
            timestamp: new Date().toISOString()
        };
        

        const exportText = `SECURE ENCRYPTION EXPORT
        
ENCRYPTION DETAILS:
=====================
Algorithm: ${currentEncryptedData.algorithm}
Timestamp: ${new Date(currentEncryptedData.timestamp).toLocaleString()}
Key Strength: ${getKeyStrength(keyString)}

MOBILE-FRIENDLY FORMAT (Copy this for easy decryption):
=====================
${combinedString}

ENCRYPTED DATA ONLY:
=====================
${currentEncryptedData.data}

INITIALIZATION VECTOR (IV):
=====================
${currentEncryptedData.iv}

FULL JSON DATA:
=====================
${JSON.stringify(currentEncryptedData, null, 2)}

END OF ENCRYPTED DATA

⚠️ IMPORTANT NOTES:
- Encryption made for Mira
- The IV is included with the encrypted data (Ok to share)
- Store the encryption key separately
- This export does NOT contain the encryption key (Never share)`;


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
            <span class="result-label">IV:</span>
            <div class="encrypted-data small">${currentEncryptedData.iv.substring(0, 50)}...</div>
        </div>
        <div class="result-item full-width">
            <span class="result-label">
                <i class="fas fa-mobile-alt"></i> Mobile-Friendly Format:
                <small style="color: var(--success-color); margin-left: 8px;">(Copy this for easy decryption)</small>
            </span>
            <textarea readonly class="full-data mobile-friendly">${combinedString}</textarea>
            <div class="export-format-label success">
                <i class="fas fa-check-circle"></i> This single string contains everything needed for decryption
            </div>
        </div>
        <div class="result-item full-width">
            <span class="result-label">Full Export Format:</span>
            <textarea readonly class="full-data export-textarea">${exportText}</textarea>
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
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> <span>✅ Text encrypted successfully! Copy the "Mobile-Friendly Format" for easy decryption.</span>';
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


function getKeyStrength(key) {
    if (!key) return "None";
    if (key.length >= 16) return "Strong";
    if (key.length >= 8) return "Medium";
    if (key.length >= 4) return "Weak";
    return "Too Short";
}


async function decryptText() {
    console.log("Starting decryption...");
    
    try {

        const keyString = encryptionKey ? encryptionKey.value.trim() : "";
        
        if (!keyString) {
            alert("Please enter the encryption key");
            return;
        }
        
  
        const inputTextValue = inputText ? inputText.value.trim() : "";
        
        if (!inputTextValue) {
            alert("Please enter encrypted data to decrypt");
            return;
        }
        

        if (resultDiv) {
            resultDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Decrypting...</div>';
        }
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>⏳ Decrypting...</span>';
            statusDiv.className = 'status-bar status-info';
        }
        

        let encryptedDataObj = null;
        

        encryptedDataObj = parseEncryptedData(inputTextValue);
        

        if (!encryptedDataObj) {
            throw new Error(
                "Could not parse encrypted data. Please use one of these formats:\n\n" +
                "1. Mobile-friendly format: 'IV::IV::ENCRYPTED_DATA'\n" +
                "2. JSON format: {iv: '...', data: '...'}\n" +
                "3. Structured format with IV and ENCRYPTED DATA sections"
            );
        }
        

        if (!encryptedDataObj.data || !encryptedDataObj.iv) {
            throw new Error("Missing encrypted data or IV. Please ensure both are provided.");
        }
        

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
        

        const iv = new Uint8Array(atob(encryptedDataObj.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedData = new Uint8Array(atob(encryptedDataObj.data).split('').map(c => c.charCodeAt(0)));
        

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedData
        );
        

        const decryptedText = new TextDecoder().decode(decryptedData);
        

        if (resultDiv) {
            const formattedResult = `
<div class="decrypted-result">
    <div class="result-header">
        <i class="fas fa-unlock"></i> Decrypted Text
    </div>
    <div class="result-grid">
        <div class="result-item">
            <span class="result-label">Data Format:</span>
            <span class="result-value">${encryptedDataObj.format || 'unknown'}</span>
        </div>
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
            <span class="result-label">Decryption Successful:</span>
            <textarea readonly class="full-data export-textarea">DECRYPTED MESSAGE
            
TIMESTAMP: ${new Date().toLocaleString()}
ALGORITHM: ${encryptedDataObj.algorithm || 'AES-GCM'}
FORMAT: ${encryptedDataObj.format || 'unknown'}

DECRYPTED TEXT:
=====================
${decryptedText}

=====================
✅ Decryption successful
END OF DECRYPTED MESSAGE</textarea>
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
            statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span>❌ ${error.message}</span>';
            statusDiv.className = 'status-bar status-error';
        }
    }
}

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


window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;
window.copyResult = copyResult;
window.toggleKeyVisibility = toggleKeyVisibility;

console.log("=== ENCRYPTION APP LOADED ===");
