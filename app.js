// Supabase Configuration
// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const inputText = document.getElementById('inputText');
const encryptionKey = document.getElementById('encryptionKey');
const generateKeyBtn = document.getElementById('generateKey');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const encryptedResult = document.getElementById('encryptedResult');
const dataId = document.getElementById('dataId');
const dataDescription = document.getElementById('dataDescription');
const generateDataIdBtn = document.getElementById('generateDataId');
const saveToSupabaseBtn = document.getElementById('saveToSupabase');
const loadFromSupabaseBtn = document.getElementById('loadFromSupabase');
const listFromSupabaseBtn = document.getElementById('listFromSupabase');
const supabaseResponse = document.getElementById('supabaseResponse');
const decryptedResult = document.getElementById('decryptedResult');
const dataListModal = document.getElementById('dataListModal');
const closeModalBtn = document.querySelector('.close-modal');
const dataList = document.getElementById('dataList');
const notification = document.getElementById('notification');

// Session identifier for this browser instance
const sessionId = 'user-' + Math.random().toString(36).substring(2, 15);

// Generate a secure random key
generateKeyBtn.addEventListener('click', () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const key = btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    encryptionKey.value = key;
    showNotification('Secure key generated successfully!', 'success');
});

// Generate a data ID
generateDataIdBtn.addEventListener('click', () => {
    const id = 'enc-' + Math.random().toString(36).substring(2, 10) + 
              '-' + Date.now().toString(36).substring(4);
    dataId.value = id;
    showNotification('Generated new Data ID', 'success');
});

// Encrypt text locally
encryptBtn.addEventListener('click', async () => {
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
        encryptedResult.textContent = 'Encrypting...';
        
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
                salt: new TextEncoder().encode("supabase-secure-salt"),
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
        
        // Create payload for Supabase
        const payload = {
            iv: ivBase64,
            data: encryptedBase64,
            algorithm: "AES-GCM-256-PBKDF2",
            timestamp: new Date().toISOString()
        };
        
        // Display the encrypted data
        encryptedResult.textContent = JSON.stringify(payload, null, 2);
        
        showNotification('Text encrypted locally! Ready to save to Supabase.', 'success');
    } catch (error) {
        console.error('Encryption error:', error);
        encryptedResult.textContent = 'Error: Encryption failed. Please try again.';
        showNotification('Encryption failed!', 'error');
    }
});

// Save encrypted data to Supabase
saveToSupabaseBtn.addEventListener('click', async () => {
    const payloadText = encryptedResult.textContent;
    const id = dataId.value.trim();
    const description = dataDescription.value.trim();
    
    if (!payloadText || payloadText.includes('Encrypted data will appear here')) {
        showNotification('No encrypted data to send. Encrypt something first.', 'error');
        return;
    }
    
    if (!id) {
        showNotification('Please enter a Data ID', 'error');
        return;
    }
    
    try {
        const payload = JSON.parse(payloadText);
        
        supabaseResponse.textContent = 'Saving to Supabase...';
        
        // First, check if table exists, if not create it
        await ensureEncryptedDataTable();
        
        // Prepare data for Supabase
        const encryptedData = {
            data_id: id,
            encrypted_data: payload.data,
            encryption_iv: payload.iv,
            algorithm: payload.algorithm,
            description: description || 'No description',
            session_id: sessionId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Save to Supabase
        const { data, error } = await supabase
            .from('encrypted_data')
            .upsert(encryptedData, { onConflict: 'data_id' });
        
        if (error) {
            throw error;
        }
        
        supabaseResponse.textContent = `✅ Data saved to Supabase!\nID: ${id}\nTimestamp: ${new Date().toLocaleString()}`;
        showNotification('Encrypted data saved to Supabase!', 'success');
        
        // Clear the data ID for next entry
        generateDataIdBtn.click();
        
    } catch (error) {
        console.error('Supabase save error:', error);
        supabaseResponse.textContent = `❌ Error: ${error.message}`;
        showNotification('Failed to save to Supabase', 'error');
    }
});

// Load encrypted data from Supabase
loadFromSupabaseBtn.addEventListener('click', async () => {
    const id = dataId.value.trim();
    
    if (!id) {
        showNotification('Please enter a Data ID', 'error');
        return;
    }
    
    try {
        supabaseResponse.textContent = 'Loading from Supabase...';
        
        // Fetch from Supabase
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('*')
            .eq('data_id', id)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!data) {
            throw new Error('Data not found in Supabase');
        }
        
        supabaseResponse.textContent = `✅ Data loaded!\nID: ${data.data_id}\nDescription: ${data.description}\nCreated: ${new Date(data.created_at).toLocaleString()}`;
        
        // Reconstruct the payload
        const payload = {
            iv: data.encryption_iv,
            data: data.encrypted_data,
            algorithm: data.algorithm,
            timestamp: data.created_at
        };
        
        // Display the encrypted data
        encryptedResult.textContent = JSON.stringify(payload, null, 2);
        
        // Auto-decrypt if key is available
        const keyString = encryptionKey.value.trim();
        if (keyString) {
            await decryptLoadedData(payload);
        } else {
            decryptedResult.textContent = 'Enter encryption key to decrypt';
        }
        
        showNotification('Encrypted data loaded from Supabase!', 'success');
        
    } catch (error) {
        console.error('Supabase load error:', error);
        supabaseResponse.textContent = `❌ Error: ${error.message}`;
        showNotification('Failed to load from Supabase', 'error');
    }
});

// List all data from Supabase for this session
listFromSupabaseBtn.addEventListener('click', async () => {
    try {
        dataList.innerHTML = '<p>Loading your encrypted data from Supabase...</p>';
        
        // Fetch all data for this session
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (!data || data.length === 0) {
            dataList.innerHTML = '<p class="no-data">No encrypted data found for this session.</p>';
            showNotification('No data found for your session', 'info');
        } else {
            dataList.innerHTML = '';
            
            data.forEach(item => {
                const dataItem = document.createElement('div');
                dataItem.className = 'data-item';
                
                dataItem.innerHTML = `
                    <div class="data-item-header">
                        <span class="data-item-id">${item.data_id}</span>
                        <span class="data-item-time">${new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div class="data-item-desc">${item.description}</div>
                    <div class="data-item-actions">
                        <button class="btn-load" onclick="loadDataById('${item.data_id}')">
                            <i class="fas fa-download"></i> Load
                        </button>
                        <button class="btn-decrypt" onclick="deleteDataById('${item.data_id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                dataList.appendChild(dataItem);
            });
            
            showNotification(`Found ${data.length} encrypted data items`, 'success');
        }
        
        dataListModal.classList.add('active');
        
    } catch (error) {
        console.error('Supabase list error:', error);
        dataList.innerHTML = `<p class="error">Error loading data: ${error.message}</p>`;
        showNotification('Failed to list data from Supabase', 'error');
        dataListModal.classList.add('active');
    }
});

// Load data by ID from modal
window.loadDataById = async function(id) {
    dataId.value = id;
    dataListModal.classList.remove('active');
    loadFromSupabaseBtn.click();
};

// Delete data by ID
window.deleteDataById = async function(id) {
    if (!confirm(`Are you sure you want to delete data with ID: ${id}?`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('encrypted_data')
            .delete()
            .eq('data_id', id);
        
        if (error) {
            throw error;
        }
        
        showNotification(`Data ${id} deleted from Supabase`, 'success');
        
        // Refresh the list
        listFromSupabaseBtn.click();
        
    } catch (error) {
        console.error('Supabase delete error:', error);
        showNotification('Failed to delete data from Supabase', 'error');
    }
};

// Close modal
closeModalBtn.addEventListener('click', () => {
    dataListModal.classList.remove('active');
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === dataListModal) {
        dataListModal.classList.remove('active');
    }
});

// Decrypt loaded data
async function decryptLoadedData(payload) {
    try {
        decryptedResult.textContent = 'Decrypting...';
        const keyString = encryptionKey.value.trim();
        
        if (!keyString) {
            decryptedResult.textContent = 'Please enter encryption key';
            return;
        }
        
        // Generate key from password
        const baseKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(keyString),
            {name: "PBKDF2"},
            false,
            ["deriveKey"]
        );
        
        // Derive key
        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("supabase-secure-salt"),
                iterations: 100000,
                hash: "SHA-256"
            },
            baseKey,
            {name: "AES-GCM", length: 256},
            false,
            ["encrypt", "decrypt"]
        );
        
        // Convert from base64
        const iv = new Uint8Array(atob(payload.iv).split('').map(c => c.charCodeAt(0)));
        const encryptedData = new Uint8Array(atob(payload.data).split('').map(c => c.charCodeAt(0)));
        
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
        decryptedResult.textContent = decryptedText;
        
        showNotification('Data decrypted successfully!', 'success');
    } catch (error) {
        console.error('Decryption error:', error);
        decryptedResult.textContent = 'Error: Decryption failed. Wrong key or corrupted data.';
        showNotification('Decryption failed! Check your key.', 'error');
    }
}

// Local decryption button
decryptBtn.addEventListener('click', () => {
    const payloadText = encryptedResult.textContent;
    
    try {
        const payload = JSON.parse(payloadText);
        decryptLoadedData(payload);
    } catch (error) {
        decryptedResult.textContent = 'No valid encrypted data to decrypt';
        showNotification('No encrypted data found', 'error');
    }
});

// Ensure the encrypted_data table exists
async function ensureEncryptedDataTable() {
    try {
        // Try to create the table if it doesn't exist
        // In a real app, you would create this table via Supabase SQL editor
        // For now, we'll just try to insert and handle errors
        const { error } = await supabase
            .from('encrypted_data')
            .select('count')
            .limit(1);
            
        if (error && error.message.includes('does not exist')) {
            showNotification('Please create the encrypted_data table in Supabase first', 'error');
            supabaseResponse.textContent = 'Error: Table does not exist. Please run the SQL setup in Supabase.';
            
            // Show SQL setup instructions
            setTimeout(() => {
                const sqlSetup = `
-- Run this SQL in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS encrypted_data (
    id BIGSERIAL PRIMARY KEY,
    data_id TEXT UNIQUE NOT NULL,
    encrypted_data TEXT NOT NULL,
    encryption_iv TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    description TEXT,
    session_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encrypted_data_session ON encrypted_data(session_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_data_id ON encrypted_data(data_id);
                `;
                supabaseResponse.textContent = `SQL Setup Required:\n${sqlSetup}`;
            }, 1000);
            
            throw new Error('Table does not exist');
        }
    } catch (error) {
        // Table check failed
        console.error('Table check error:', error);
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 
                 type === 'info' ? 'fas fa-info-circle' : 
                 'fas fa-check-circle';
    
    notification.innerHTML = `<i class="${icon}"></i> ${message}`;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Initialize the app
window.addEventListener('load', () => {
    // Set example key
    encryptionKey.value = 'Supabase-Secure-Key-2024!';
    
    // Generate initial IDs
    generateDataIdBtn.click();
    
    // Set example description
    dataDescription.value = 'Example encrypted data';
    
    showNotification('Secure Encryption App Ready! Connected to Supabase.', 'success');
    
    // Check Supabase connection
    checkSupabaseConnection();
});

// Check Supabase connection
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('encrypted_data')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.message.includes('does not exist')) {
            console.log('Table does not exist yet. Please create it.');
        } else if (error) {
            console.error('Supabase connection error:', error);
            showNotification('Supabase connection issue detected', 'error');
        } else {
            console.log('Supabase connection successful');
        }
    } catch (error) {
        console.error('Connection check error:', error);
    }
}