// Secure Encryption App with Supabase Storage
console.log('Secure Encryption App loading...');

// Configuration - USE YOUR OWN CREDENTIALS
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Global variables
let supabase = null;
let currentEncryptedData = null;
const sessionId = 'session-' + Math.random().toString(36).substring(2, 15);

// DOM Elements
const inputText = document.getElementById('inputText');
const encryptionKey = document.getElementById('encryptionKey');
const generateKeyBtn = document.getElementById('generateKey');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const clearBtn = document.getElementById('clearBtn');
const resultText = document.getElementById('resultText');
const dataId = document.getElementById('dataId');
const dataDescription = document.getElementById('dataDescription');
const generateDataIdBtn = document.getElementById('generateDataId');
const saveToSupabaseBtn = document.getElementById('saveToSupabase');
const loadFromSupabaseBtn = document.getElementById('loadFromSupabase');
const serverResponse = document.getElementById('serverResponse');
const notification = document.getElementById('notification');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Initialize the app
async function initApp() {
    console.log('Initializing app...');
    
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
        
        // Set up event listeners
        setupEventListeners();
        
        // Test Supabase connection
        await testSupabaseConnection();
        
        // Initialize with example data
        initializeExample();
        
        showNotification('App ready! Encrypt text to get started.', 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('App loaded with limited functionality', 'error');
        updateStatus('offline', 'Supabase not connected - using offline mode');
    }
}

// Set up all event listeners
function setupEventListeners() {
    generateKeyBtn.addEventListener('click', generateKey);
    encryptBtn.addEventListener('click', encryptText);
    decryptBtn.addEventListener('click', decryptText);
    clearBtn.addEventListener('click', clearAll);
    generateDataIdBtn.addEventListener('click', generateDataId);
    saveToSupabaseBtn.addEventListener('click', saveToSupabase);
    loadFromSupabaseBtn.addEventListener('click', loadFromSupabase);
    
    console.log('Event listeners set up');
}

// Generate a secure random key
function generateKey() {
    try {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        encryptionKey.value = key;
        showNotification('Secure key generated!', 'success');
    } catch (error) {
        console.error('Key generation error:', error);
        showNotification('Failed to generate key', 'error');
    }
}

// Generate a data ID
function generateDataId() {
    const id = 'data-' + Math.random().toString(36).substring(2, 10) + 
              '-' + Date.now().toString(36).substring(4);
    dataId.value = id;
    showNotification('Generated new Data ID', 'success');
}

// Encrypt text
async function encryptText() {
    const text = inputText.value.trim();
    const keyString = encryptionKey.value.trim();
    
    if (!text) {
        showNotification('Please enter text to encrypt.', 'error');
        return;
    }
    
    if (!keyString) {
        showNotification('Please enter an encryption key.', 'error');
        return;
    }
    
    try {
        resultText.textContent = 'Encrypting...';
        
        // Generate a key from the password using PBKDF2
        const baseKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(keyString),
            {name: "PBKDF2"},
            false,
            ["deriveKey"]
        );
        
        // Derive a key using PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("secure-salt-123"),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]
        );
        
        // Generate a random initialization vector (IV)
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the text
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
        
        // Create result object
        currentEncryptedData = {
            iv: ivBase64,
            data: encryptedBase64,
            algorithm: "AES-GCM-256-PBKDF2",
            timestamp: new Date().toISOString()
        };
        
        // Display the result
        resultText.textContent = JSON.stringify(currentEncryptedData, null, 2);
        
        showNotification('Text encrypted successfully!', 'success');
        
    } catch (error) {
        console.error('Encryption error:', error);
        resultText.textContent = 'Error: Encryption failed';
        showNotification('Encryption failed!', 'error');
    }
}

// Decrypt text
async function decryptText() {
    const text = inputText.value.trim();
    const keyString = encryptionKey.value.trim();
    
    if (!text) {
        showNotification('Please enter text to decrypt.', 'error');
        return;
    }
    
    if (!keyString) {
        showNotification('Please enter the decryption key.', 'error');
        return;
    }
    
    try {
        resultText.textContent = 'Decrypting...';
        
        // Try to parse as JSON
        let encryptedObj;
        try {
            encryptedObj = JSON.parse(text);
        } catch (e) {
            // If not JSON, use currentEncryptedData
            if (!currentEncryptedData) {
                throw new Error('No encrypted data available');
            }
            encryptedObj = currentEncryptedData;
        }
        
        // Check required fields
        if (!encryptedObj.iv || !encryptedObj.data) {
            throw new Error('Invalid encrypted data format');
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
                salt: new TextEncoder().encode("secure-salt-123"),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]
        );
        
        // Convert from base64
        const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedData = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));
        
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
        resultText.textContent = decryptedText;
        
        showNotification('Text decrypted successfully!', 'success');
        
    } catch (error) {
        console.error('Decryption error:', error);
        resultText.textContent = 'Error: Decryption failed. Check your key and data format.';
        showNotification('Decryption failed!', 'error');
    }
}

// Save to Supabase
async function saveToSupabase() {
    if (!currentEncryptedData) {
        showNotification('No encrypted data to save. Encrypt something first.', 'error');
        return;
    }
    
    const id = dataId.value.trim();
    const description = dataDescription.value.trim();
    
    if (!id) {
        showNotification('Please enter a Data ID', 'error');
        return;
    }
    
    try {
        serverResponse.textContent = 'Saving to Supabase...';
        
        // Prepare data
        const dataToSave = {
            data_id: id,
            encrypted_data: currentEncryptedData.data,
            encryption_iv: currentEncryptedData.iv,
            algorithm: currentEncryptedData.algorithm,
            description: description || 'No description',
            session_id: sessionId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Save to Supabase
        const { data, error } = await supabase
            .from('encrypted_data')
            .upsert(dataToSave, { onConflict: 'data_id' });
        
        if (error) {
            if (error.message.includes('does not exist')) {
                throw new Error('Table does not exist. Create it in Supabase first.');
            }
            throw error;
        }
        
        serverResponse.textContent = `✅ Saved successfully!\nID: ${id}\nTime: ${new Date().toLocaleTimeString()}`;
        
        showNotification('Data saved to Supabase!', 'success');
        
        // Generate new ID for next save
        generateDataId();
        
    } catch (error) {
        console.error('Supabase save error:', error);
        serverResponse.textContent = `❌ Save failed: ${error.message}`;
        showNotification('Failed to save to Supabase', 'error');
    }
}

// Load from Supabase
async function loadFromSupabase() {
    const id = dataId.value.trim();
    
    if (!id) {
        showNotification('Please enter a Data ID', 'error');
        return;
    }
    
    try {
        serverResponse.textContent = 'Loading from Supabase...';
        
        // Load from Supabase
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('*')
            .eq('data_id', id)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!data) {
            throw new Error('Data not found');
        }
        
        // Update current encrypted data
        currentEncryptedData = {
            iv: data.encryption_iv,
            data: data.encrypted_data,
            algorithm: data.algorithm,
            timestamp: data.created_at
        };
        
        // Display encrypted data
        resultText.textContent = JSON.stringify(currentEncryptedData, null, 2);
        
        serverResponse.textContent = `✅ Loaded successfully!\nID: ${data.data_id}\nDescription: ${data.description}\nCreated: ${new Date(data.created_at).toLocaleDateString()}`;
        
        showNotification('Data loaded from Supabase!', 'success');
        
        // Auto-decrypt if key is available
        const keyString = encryptionKey.value.trim();
        if (keyString) {
            setTimeout(decryptText, 500);
        }
        
    } catch (error) {
        console.error('Supabase load error:', error);
        serverResponse.textContent = `❌ Load failed: ${error.message}`;
        showNotification('Failed to load from Supabase', 'error');
    }
}

// Clear all fields
function clearAll() {
    inputText.value = '';
    encryptionKey.value = '';
    resultText.textContent = 'Encrypted/decrypted text will appear here...';
    serverResponse.textContent = 'Supabase messages will appear here...';
    currentEncryptedData = null;
    showNotification('All fields cleared', 'success');
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            if (error.message.includes('does not exist')) {
                updateStatus('warning', 'Table not found - create it in Supabase');
                showNotification('Table does not exist. Create it to enable storage.', 'error');
            } else {
                updateStatus('offline', 'Connection error: ' + error.message);
            }
        } else {
            updateStatus('online', 'Connected to Supabase');
        }
    } catch (error) {
        updateStatus('offline', 'Cannot connect to Supabase');
    }
}

// Update status indicator
function updateStatus(status, message) {
    statusDot.className = 'status-indicator';
    
    switch(status) {
        case 'online':
            statusDot.classList.add('status-online');
            statusText.textContent = '✓ ' + message;
            break;
        case 'warning':
            statusDot.style.background = '#f39c12';
            statusText.textContent = '⚠ ' + message;
            break;
        case 'offline':
            statusDot.classList.add('status-offline');
            statusText.textContent = '✗ ' + message;
            break;
    }
}

// Initialize with example
function initializeExample() {
    inputText.value = "This is a confidential message that will be encrypted.";
    encryptionKey.value = 'MySecureKey-' + Math.random().toString(36).substring(2, 8);
    generateDataId();
    dataDescription.value = 'Example encrypted message';
}

// Show notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type === 'error' ? 'error' : 'success');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Export functions to global scope
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.clearAll = clearAll;
window.generateDataId = generateDataId;
window.saveToSupabase = saveToSupabase;
window.loadFromSupabase = loadFromSupabase;
