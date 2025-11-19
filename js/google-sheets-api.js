// Google Sheets API Integration
// Configuration for accessing the Google Spreadsheet

const GOOGLE_SHEETS_CONFIG = {
    // Spreadsheet ID extracted from the URL
    spreadsheetId: '1PpyJ_JGtgqrIkffvEjPwBscoMokK5_lKvMh6xFK4JV8',
    
    // Range for member data (A2:B8 contains name in column A and sessions in column B)
    range: 'A2:B8',
    
    // Google API Key - This should be set by the user
    // For public read-only access, you can use an API key
    // For write access, OAuth 2.0 is required
    apiKey: null, // Will be loaded from localStorage or config
    
    // API endpoint
    apiEndpoint: 'https://sheets.googleapis.com/v4/spreadsheets'
};

// Load API key from localStorage
function loadApiKey() {
    const key = localStorage.getItem('googleSheetsApiKey');
    if (key) {
        GOOGLE_SHEETS_CONFIG.apiKey = key;
    }
    return key;
}

// Save API key to localStorage
function saveApiKey(apiKey) {
    localStorage.setItem('googleSheetsApiKey', apiKey);
    GOOGLE_SHEETS_CONFIG.apiKey = apiKey;
}

// Clear API key from localStorage
function clearApiKey() {
    localStorage.removeItem('googleSheetsApiKey');
    GOOGLE_SHEETS_CONFIG.apiKey = null;
}

// Fetch members data from Google Sheets
async function fetchMembersFromSheets() {
    const apiKey = GOOGLE_SHEETS_CONFIG.apiKey || loadApiKey();
    
    if (!apiKey) {
        throw new Error('Google Sheets API key not configured');
    }
    
    const url = `${GOOGLE_SHEETS_CONFIG.apiEndpoint}/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${GOOGLE_SHEETS_CONFIG.range}?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transform the data from Google Sheets format to our application format
        return transformSheetDataToMembers(data);
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        throw error;
    }
}

// Transform Google Sheets data to members format
function transformSheetDataToMembers(sheetData) {
    if (!sheetData.values || sheetData.values.length === 0) {
        return { members: [] };
    }
    
    const members = sheetData.values.map(row => {
        const name = row[0] || '';
        // Column B contains comma-separated session codes or JSON array
        let sessions = [];
        
        if (row[1]) {
            try {
                // Try to parse as JSON first
                sessions = JSON.parse(row[1]);
            } catch (e) {
                // If not JSON, try comma-separated values
                sessions = row[1].split(',').map(s => s.trim()).filter(s => s);
            }
        }
        
        return {
            name: name,
            sessions: Array.isArray(sessions) ? sessions : []
        };
    }).filter(member => member.name); // Filter out empty rows
    
    return { members };
}

// Update a member's sessions in Google Sheets
async function updateMemberInSheets(memberName, sessions) {
    const apiKey = GOOGLE_SHEETS_CONFIG.apiKey || loadApiKey();
    
    if (!apiKey) {
        throw new Error('Google Sheets API key not configured');
    }
    
    // For updating, we need to find the row for this member
    // First, fetch current data to find the row index
    const currentData = await fetchMembersFromSheets();
    const memberIndex = currentData.members.findIndex(m => m.name === memberName);
    
    if (memberIndex === -1) {
        throw new Error(`Member ${memberName} not found in spreadsheet`);
    }
    
    // Calculate the actual row number (A2 is row 2, so index 0 corresponds to row 2)
    const rowNumber = memberIndex + 2;
    const updateRange = `B${rowNumber}`;
    
    // Prepare the update payload
    const sessionsValue = JSON.stringify(sessions);
    
    // Note: This requires OAuth 2.0 authentication, not just API key
    // For now, we'll throw an error indicating OAuth is needed
    throw new Error('Updating Google Sheets requires OAuth 2.0 authentication. Please use the local storage method or manually update the spreadsheet.');
}

// Check if Google Sheets API is configured
function isSheetsApiConfigured() {
    return !!(GOOGLE_SHEETS_CONFIG.apiKey || loadApiKey());
}

// Prompt user to configure API key
function promptForApiKey() {
    const apiKey = prompt(
        '請輸入您的 Google Sheets API Key\n\n' +
        '要取得 API Key，請前往：\n' +
        '1. https://console.cloud.google.com/\n' +
        '2. 建立或選擇專案\n' +
        '3. 啟用 Google Sheets API\n' +
        '4. 建立憑證 (API Key)\n' +
        '5. 將試算表設為「知道連結的使用者」可檢視'
    );
    
    if (apiKey && apiKey.trim()) {
        saveApiKey(apiKey.trim());
        return true;
    }
    
    return false;
}
