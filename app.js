// Secure Encryption App - Main JavaScript
console.log("=== ENCRYPTION APP STARTING ===");

// Global variable to store encrypted data
let currentEncryptedData = null;

// DOM Elements - get them AFTER page loads
let inputText, encryptionKey, resultDiv, statusDiv;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, getting elements...");
    
    // Get DOM elements
    inputText = document.getElementById('inputText');
    encryptionKey = document.getElementById('encryptionKey');
    resultDiv = document.getElementById('result');
    statusDiv = document.getElementById('status');
    
    console.log("Elements found:", {
        inputText: !!inputText,
        encryptionKey: !!encryptionKey,
        resultDiv: !!resultDiv,
        statusDiv: !!statusDiv
    });
    
    // Set initial values
    if (inputText) inputText.value = "";
    if (encryptionKey) encryptionKey.value = "Write a Key or Generate One";
    if (statusDiv) statusDiv.textContent = "✅ App ready! Click 'Generate Key' or 'Encrypt' to start.";
    
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
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        
        // Convert to base64
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Set the key
        encryptionKey.value = key;
        
        // Update status
        if (statusDiv) statusDiv.textContent = "✅ Secure key generated!";
        
        console.log("Key generated:", key.substring(0, 10) + "...");
        
    } catch (error) {
        console.error("Key generation error:", error);
        if (statusDiv) statusDiv.textContent = "❌ Error generating key";
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
        if (resultDiv) resultDiv.textContent = "Encrypting...";
        if (statusDiv) statusDiv.textContent = "⏳ Encrypting...";
        
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
        
        // Display result
        if (resultDiv) {
            resultDiv.textContent = JSON.stringify(currentEncryptedData, null, 2);
        }
        
        if (statusDiv) {
            statusDiv.textContent = "✅ Text encrypted successfully!";
        }
        
        console.log("Encryption successful!");
        
    } catch (error) {
        console.error("Encryption error:", error);
        
        if (resultDiv) {
            resultDiv.textContent = "Error: " + error.message;
        }
        if (statusDiv) {
            statusDiv.textContent = "❌ Encryption failed";
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
        
        // Check if we have encrypted data
        if (!currentEncryptedData) {
            alert("No encrypted data available. Encrypt something first.");
            return;
        }
        
        // Update UI
        if (resultDiv) resultDiv.textContent = "Decrypting...";
        if (statusDiv) statusDiv.textContent = "⏳ Decrypting...";
        
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
        const iv = new Uint8Array(atob(currentEncryptedData.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedData = new Uint8Array(atob(currentEncryptedData.data).split('').map(c => c.charCodeAt(0)));
        
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
        
        // Display result
        if (resultDiv) {
            resultDiv.textContent = decryptedText;
        }
        
        if (statusDiv) {
            statusDiv.textContent = "✅ Text decrypted successfully!";
        }
        
        console.log("Decryption successful!");
        
    } catch (error) {
        console.error("Decryption error:", error);
        
        if (resultDiv) {
            resultDiv.textContent = "Error: Decryption failed. Wrong key or corrupted data.";
        }
        if (statusDiv) {
            statusDiv.textContent = "❌ Decryption failed";
        }
    }
}

// Clear all fields
function clearAll() {
    console.log("Clearing all...");
    
    if (inputText) inputText.value = "";
    if (encryptionKey) encryptionKey.value = "";
    if (resultDiv) resultDiv.textContent = "Results will appear here...";
    if (statusDiv) statusDiv.textContent = "Cleared! Ready to start again.";
    
    currentEncryptedData = null;
}

// Export functions to global scope
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;

console.log("=== ENCRYPTION APP LOADED ===");
