// Secure Encryption App - Main JavaScript
console.log('Encryption app loading...');

// Configuration
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Global variables
let supabase = null;
let sessionId = 'user-' + Math.random().toString(36).substring(2, 15);
let currentEncryptedData = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
    try {
        // Initialize Supabase
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized');
        
        // Set up button event listeners
        setupEventListeners();
        
        // Test Supabase connection
        await testSupabaseConnection();
        
        showStatus('✅ App ready! Enter text and click Encrypt.', 'success');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showStatus('⚠️ App loaded with limited functionality. Some features may not work.', 'error');
    }
});

// Set up all event listeners
function setupEventListeners() {
    // Generate Key button
    const generateKeyBtn = document.getElementById('generateKey');
    if (generateKeyBtn) {
        generateKeyBtn.onclick = generateKey;
    }
    
    // Encrypt button
    const encryptBtn = document.getElementById('encryptBtn');
    if (encryptBtn) {
        encryptBtn.onclick = encryptText;
    }
    
    // Decrypt button
    const decryptBtn = document.getElementById('decryptBtn');
    if (decryptBtn) {
        decryptBtn.onclick = decryptText;
    }
    
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.onclick = saveToSupabase;
    }
    
    // Load button
    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn) {
        loadBtn.onclick = loadFromSupabase;
    }
    
    console.log('Event listeners set up');
}

// Generate a secure key
function generateKey() {
    try {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        const key = btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        document.getElementById('encryptionKey').value = key;
        showStatus('✅ Secure key generated!', 'success');
    } catch (error) {
        console.error('Key generation error:', error);
        showStatus('❌ Failed to generate key', 'error');
    }
}

// Encrypt text
async function encryptText() {
    const text = document.getElementById('inputText').value.trim();
    const keyString = document.getElementById('encryptionKey').value.trim();
    
    if (!text) {
        showStatus('❌ Please enter text to encrypt', 'error');
        return;
    }
    
    if (!keyString) {
        showStatus('❌ Please enter an encryption key', 'error');
        return;
    }
    
    try {
        showStatus('⏳ Encrypting...', 'info');
        
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
        document.getElementById('encryptedResult').textContent = 
            JSON.stringify(currentEncryptedData, null, 2);
        
        showStatus('✅ Text encrypted successfully!', 'success');
        
    } catch (error) {
        console.error('Encryption error:', error);
        showStatus('❌ Encryption failed: ' + error.message, 'error');
        document.getElementById('encryptedResult').textContent = 'Error: ' + error.message;
    }
}

// Decrypt text
async function decryptText() {
    const keyString = document.getElementById('encryptionKey').value.trim();
    
    if (!currentEncryptedData) {
        showStatus('❌ No encrypted data available. Encrypt first.', 'error');
        return;
    }
    
    if (!keyString) {
        showStatus('❌ Please enter the encryption key', 'error');
        return;
    }
    
    try {
        showStatus('⏳ Decrypting...', 'info');
        
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
        document.getElementById('decryptedResult').textContent = decryptedText;
        
        showStatus('✅ Text decrypted successfully!', 'success');
        
    } catch (error) {
        console.error('Decryption error:', error);
        showStatus('❌ Decryption failed. Wrong key or corrupted data.', 'error');
        document.getElementById('decryptedResult').textContent = 'Error: Decryption failed';
    }
}

// Save to Supabase
async function saveToSupabase() {
    if (!currentEncryptedData) {
        showStatus('❌ No encrypted data to save. Encrypt first.', 'error');
        return;
    }
    
    const dataId = document.getElementById('dataId').value.trim();
    const description = document.getElementById('dataDescription').value.trim();
    
    if (!dataId) {
        showStatus('❌ Please enter a Data ID', 'error');
        return;
    }
    
    try {
        showStatus('⏳ Saving to Supabase...', 'info');
        
        // Prepare data
        const dataToSave = {
            data_id: dataId,
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
            throw error;
        }
        
        document.getElementById('supabaseResponse').textContent = 
            `✅ Saved to Supabase!\nID: ${dataId}\nTime: ${new Date().toLocaleTimeString()}`;
        
        showStatus('✅ Data saved to Supabase!', 'success');
        
        // Generate new ID for next save
        document.getElementById('dataId').value = 'data-' + Date.now();
        
    } catch (error) {
        console.error('Supabase save error:', error);
        
        let errorMessage = '❌ Failed to save: ' + error.message;
        if (error.message.includes('does not exist')) {
            errorMessage += '\n\n⚠️ Table missing. Run SQL in Supabase:\n' +
                'CREATE TABLE encrypted_data (\n' +
                '  data_id TEXT PRIMARY KEY,\n' +
                '  encrypted_data TEXT,\n' +
                '  encryption_iv TEXT,\n' +
                '  algorithm TEXT,\n' +
                '  description TEXT,\n' +
                '  session_id TEXT,\n' +
                '  created_at TIMESTAMP\n' +
                ');';
        }
        
        document.getElementById('supabaseResponse').textContent = errorMessage;
        showStatus('❌ Save failed', 'error');
    }
}

// Load from Supabase
async function loadFromSupabase() {
    const dataId = document.getElementById('dataId').value.trim();
    
    if (!dataId) {
        showStatus('❌ Please enter a Data ID', 'error');
        return;
    }
    
    try {
        showStatus('⏳ Loading from Supabase...', 'info');
        
        // Load from Supabase
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('*')
            .eq('data_id', dataId)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!data) {
            throw new Error('Data not found');
        }
        
        // Reconstruct encrypted data
        currentEncryptedData = {
            iv: data.encryption_iv,
            data: data.encrypted_data,
            algorithm: data.algorithm,
            timestamp: data.created_at
        };
        
        // Display encrypted data
        document.getElementById('encryptedResult').textContent = 
            JSON.stringify(currentEncryptedData, null, 2);
        
        document.getElementById('supabaseResponse').textContent = 
            `✅ Loaded from Supabase!\nID: ${data.data_id}\nDescription: ${data.description}\nCreated: ${new Date(data.created_at).toLocaleDateString()}`;
        
        showStatus('✅ Data loaded! Click Decrypt to view.', 'success');
        
        // Auto-decrypt if key is available
        const keyString = document.getElementById('encryptionKey').value.trim();
        if (keyString) {
            setTimeout(decryptText, 500);
        }
        
    } catch (error) {
        console.error('Supabase load error:', error);
        document.getElementById('supabaseResponse').textContent = 
            '❌ Load failed: ' + error.message;
        showStatus('❌ Load failed', 'error');
    }
}

// Clear data
function clearData() {
    document.getElementById('inputText').value = '';
    document.getElementById('encryptedResult').textContent = 'Encrypted data will appear here...';
    document.getElementById('decryptedResult').textContent = 'Decrypted data will appear here...';
    document.getElementById('supabaseResponse').textContent = 'Supabase response...';
    currentEncryptedData = null;
    showStatus('✅ All data cleared', 'success');
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.message.includes('does not exist')) {
            console.log('Table does not exist yet');
            showStatus('⚠️ Table not found. Save will create it.', 'info');
        } else if (error) {
            console.warn('Supabase connection warning:', error.message);
        } else {
            console.log('Supabase connection successful');
        }
    } catch (error) {
        console.error('Connection test error:', error);
    }
}

// Show status message
function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = type;
    }
}

// Export functions to global scope for HTML onclick
window.generateKey = generateKey;
window.encryptText = encryptText;
window.decryptText = decryptText;
window.saveToSupabase = saveToSupabase;
window.loadFromSupabase = loadFromSupabase;
window.clearData = clearData;

console.log('App initialization complete');
