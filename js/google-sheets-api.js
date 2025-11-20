// Google Sheets API Integration
// Configuration for accessing the Google Spreadsheet

const GOOGLE_SHEETS_CONFIG = {
    // Spreadsheet ID extracted from the URL
    spreadsheetId: '1PpyJ_JGtgqrIkffvEjPwBscoMokK5_lKvMh6xFK4JV8',
    
    // Range for member data (A2:B8 contains name in column A and sessions in column B)
    range: 'A2:B8',
    
    // Google API Key - This should be set by the user
    // For public read-only access, you can use an API key
    apiKey: null, // Will be loaded from localStorage or config
    
    // Web App URL for writing data (Google Apps Script)
    webAppUrl: null, // Will be loaded from localStorage
    
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

// Load Web App URL from localStorage
function loadWebAppUrl() {
    const url = localStorage.getItem('googleSheetsWebAppUrl');
    if (url) {
        GOOGLE_SHEETS_CONFIG.webAppUrl = url;
    }
    return url;
}

// Save Web App URL to localStorage
function saveWebAppUrl(url) {
    localStorage.setItem('googleSheetsWebAppUrl', url);
    GOOGLE_SHEETS_CONFIG.webAppUrl = url;
}

// Clear Web App URL from localStorage
function clearWebAppUrl() {
    localStorage.removeItem('googleSheetsWebAppUrl');
    GOOGLE_SHEETS_CONFIG.webAppUrl = null;
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
    const webAppUrl = GOOGLE_SHEETS_CONFIG.webAppUrl || loadWebAppUrl();
    
    if (!webAppUrl) {
        throw new Error('Google Apps Script Web App URL not configured. Please set it in settings.');
    }
    
    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'updateMember',
                memberName: memberName,
                sessions: sessions
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update Google Sheets: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Unknown error updating Google Sheets');
        }
        
        return result;
    } catch (error) {
        console.error('Error updating Google Sheets:', error);
        throw error;
    }
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
