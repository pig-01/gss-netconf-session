// Global variables
let tableStructure = null;
let sessions = null;
let members = null;
let currentSessionCode = null;
let selectedMemberFilter = null;
let currentUser = null; // Current user selected from dropdown

// LocalStorage key for current user
const CURRENT_USER_KEY = 'currentNetConfUser';

// Common sessions that should not be added to courses
const COMMON_SESSIONS = ['check-in', 'opening', 'lunch'];

// Helper function to check if session is a common session
function isCommonSession(sessionCode) {
    return COMMON_SESSIONS.includes(sessionCode);
}

// Helper function to get current user from localStorage
function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY);
}

// Helper function to save current user to localStorage
function saveCurrentUser(userName) {
    localStorage.setItem(CURRENT_USER_KEY, userName);
    currentUser = userName;
}

// Helper function to add a session for current user
async function addSessionForCurrentUser(sessionCode) {
    // Don't add common sessions
    if (isCommonSession(sessionCode)) {
        return false;
    }
    
    if (!currentUser) {
        throw new Error('Please select your name first');
    }
    
    // Find the current user in members
    const member = members.members.find(m => m.name === currentUser);
    if (!member) {
        throw new Error(`Member ${currentUser} not found`);
    }
    
    // Check if already in sessions
    if (member.sessions.includes(sessionCode)) {
        return false; // Already added
    }
    
    // Add to sessions array
    const updatedSessions = [...member.sessions, sessionCode];
    
    // Update in Google Sheets if configured
    if (isSheetsApiConfigured() && isWebAppConfigured()) {
        try {
            await updateMemberInSheets(currentUser, updatedSessions);
            // Reload members data from sheets
            await loadMembers();
            return true;
        } catch (error) {
            console.error('Failed to update Google Sheets:', error);
            throw error;
        }
    } else {
        // Update locally
        member.sessions = updatedSessions;
        return true;
    }
}

// Helper function to check if Web App is configured
function isWebAppConfigured() {
    return !!(GOOGLE_SHEETS_CONFIG.webAppUrl || loadWebAppUrl());
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize the application
async function init() {
    try {
        // Load all JSON data
        await Promise.all([
            loadTableStructure(),
            loadSessions(),
            loadMembers()
        ]);
        
        // Load current user from localStorage
        const savedUser = getCurrentUser();
        if (savedUser) {
            currentUser = savedUser;
        }
        
        // Generate the current user dropdown
        generateCurrentUserDropdown();
        
        // Generate the table
        generateTable();
        
        // Generate member filter buttons
        generateMemberButtons();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('載入資料時發生錯誤，請重新整理頁面。');
    }
}

// Load table structure from JSON
async function loadTableStructure() {
    const response = await fetch('data/table-structure.json');
    tableStructure = await response.json();
}

// Load sessions from JSON
async function loadSessions() {
    const response = await fetch('data/sessions.json');
    sessions = await response.json();
}

// Load members from JSON or Google Sheets
async function loadMembers() {
    // Try to load from Google Sheets first if API is configured
    if (isSheetsApiConfigured()) {
        try {
            members = await fetchMembersFromSheets();
            console.log('Members loaded from Google Sheets');
            return;
        } catch (error) {
            console.warn('Failed to load from Google Sheets, falling back to local JSON:', error);
            // Fall through to load from local JSON
        }
    }
    
    // Fallback to local JSON file
    const response = await fetch('data/members.json');
    members = await response.json();
    console.log('Members loaded from local JSON');
}

// Generate the schedule table
function generateTable() {
    const table = document.getElementById('scheduleTable');
    
    // Generate header
    const thead = table.querySelector('thead');
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    // Add time column header
    const timeHeader = document.createElement('th');
    timeHeader.textContent = '時間';
    headerRow.appendChild(timeHeader);
    
    // Add room headers
    tableStructure.rooms.forEach(room => {
        const th = document.createElement('th');
        th.innerHTML = `${room.name}<br>${room.floor}`;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Generate body
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    tableStructure.timeSlots.forEach(timeSlot => {
        const row = document.createElement('tr');
        
        // Add time column
        const timeCell = document.createElement('td');
        timeCell.className = 'time-column';
        timeCell.textContent = timeSlot.time;
        row.appendChild(timeCell);
        
        // Track which columns are already filled (for colspan handling)
        const filledColumns = new Set();
        
        // Add session cells for each room
        tableStructure.rooms.forEach((room, roomIndex) => {
            // Skip if this column is already filled by a colspan
            if (filledColumns.has(roomIndex)) {
                return;
            }
            
            // Find session for this time slot and room
            const session = sessions.sessions.find(
                s => s.timeSlot === timeSlot.id && s.room === room.code
            );
            
            const td = document.createElement('td');
            
            if (session) {
                td.className = 'session-cell';
                td.dataset.sessionCode = session.code;
                
                // Don't allow clicking on common sessions
                if (isCommonSession(session.code)) {
                    td.classList.add('common-session');
                    td.style.cursor = 'default';
                }
                
                // Handle colspan
                if (session.colspan && session.colspan > 1) {
                    td.setAttribute('colspan', session.colspan);
                    // Mark the next columns as filled
                    for (let i = 1; i < session.colspan; i++) {
                        filledColumns.add(roomIndex + i);
                    }
                }
                
                // Create session content
                const titleDiv = document.createElement('div');
                titleDiv.className = 'session-title';
                titleDiv.textContent = session.name;
                
                const speakerDiv = document.createElement('div');
                speakerDiv.className = 'session-speaker';
                speakerDiv.textContent = `講師: ${session.speaker}`;
                
                td.appendChild(titleDiv);
                td.appendChild(speakerDiv);
                
                // Add no-replay badge if applicable
                if (session.noReplay) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-danger no-replay-badge';
                    badge.textContent = '無回放';
                    titleDiv.appendChild(badge);
                }
                
                // Add member tags for this session
                const membersDiv = document.createElement('div');
                membersDiv.className = 'attendee-tags';
                membersDiv.id = `members-${session.code}`;
                td.appendChild(membersDiv);
                
                // Update member tags
                updateMemberTags(session.code);
                
                // Add click event for member filter highlighting
                if (selectedMemberFilter) {
                    const member = members.members.find(m => m.name === selectedMemberFilter);
                    if (member && member.sessions.includes(session.code)) {
                        td.classList.add('member-highlight');
                    }
                }
            } else {
                td.className = 'empty-cell';
                td.textContent = '';
            }
            
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
}

// Update member tags for a session
function updateMemberTags(sessionCode) {
    const membersDiv = document.getElementById(`members-${sessionCode}`);
    if (!membersDiv) return;
    
    membersDiv.innerHTML = '';
    
    // Find members who have this session in their sessions array
    const attendingMembers = members.members.filter(member => 
        member.sessions.includes(sessionCode)
    );
    
    attendingMembers.forEach(member => {
        const tag = document.createElement('span');
        tag.className = 'attendee-tag';
        tag.textContent = member.name;
        membersDiv.appendChild(tag);
    });
}

// Generate member filter buttons
function generateMemberButtons() {
    const container = document.getElementById('memberButtons');
    container.innerHTML = '';
    
    // Add "All" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'btn btn-sm btn-outline-primary active';
    allBtn.textContent = '全部';
    allBtn.addEventListener('click', () => filterByMember(null));
    container.appendChild(allBtn);
    
    // Add button for each member
    members.members.forEach(member => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-sm btn-outline-primary';
        btn.textContent = member.name;
        btn.addEventListener('click', () => filterByMember(member.name));
        container.appendChild(btn);
    });
}

// Generate current user dropdown
function generateCurrentUserDropdown() {
    const select = document.getElementById('currentUserSelect');
    select.innerHTML = '<option value="">-- 請選擇您的名字 --</option>';
    
    members.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.name;
        option.textContent = member.name;
        
        // Select the current user if set
        if (currentUser && member.name === currentUser) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
}

// Filter table by member
function filterByMember(memberName) {
    selectedMemberFilter = memberName;
    
    // Update button states
    const buttons = document.querySelectorAll('#memberButtons .btn');
    buttons.forEach(btn => {
        if ((memberName === null && btn.textContent === '全部') ||
            (memberName !== null && btn.textContent === memberName)) {
            btn.classList.add('active');
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-primary');
        } else {
            btn.classList.remove('active');
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        }
    });
    
    // Regenerate table with highlighting
    generateTable();
}

// Setup event listeners
function setupEventListeners() {
    const modal = new bootstrap.Modal(document.getElementById('attendeeModal'));
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    
    // Current user select change event
    document.getElementById('currentUserSelect').addEventListener('change', (e) => {
        const selectedUser = e.target.value;
        if (selectedUser) {
            saveCurrentUser(selectedUser);
            // Regenerate table to update highlights
            generateTable();
        } else {
            currentUser = null;
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    });
    
    // Click on session cells
    document.getElementById('scheduleTable').addEventListener('click', (e) => {
        const cell = e.target.closest('td.session-cell');
        if (!cell) return;
        
        const sessionCode = cell.dataset.sessionCode;
        if (!sessionCode) return;
        
        // Don't show modal for common sessions
        if (isCommonSession(sessionCode)) {
            return;
        }
        
        currentSessionCode = sessionCode;
        showAttendeeModal(sessionCode);
        modal.show();
    });
    
    // Add to table button
    document.getElementById('addToTableBtn').addEventListener('click', async () => {
        if (!currentSessionCode) return;
        
        if (!currentUser) {
            alert('請先在頁面上方選擇您的名字！');
            return;
        }
        
        try {
            const added = await addSessionForCurrentUser(currentSessionCode);
            if (added) {
                alert(`已成功加入課程 ${currentSessionCode}！`);
                // Update the table to show new member tag
                generateTable();
                // Update the modal to show updated attendees
                showAttendeeModal(currentSessionCode);
                // Update the button state
                updateAddCourseButton();
            } else {
                alert(`您已經加入課程 ${currentSessionCode}。`);
            }
        } catch (error) {
            console.error('Failed to add course:', error);
            alert(`加入課程失敗：${error.message}`);
        }
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        showSettingsModal();
        settingsModal.show();
    });
    
    // Settings modal - Save API Key button
    document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const webAppUrl = document.getElementById('webAppUrlInput').value.trim();
        
        if (apiKey) {
            saveApiKey(apiKey);
        }
        
        if (webAppUrl) {
            saveWebAppUrl(webAppUrl);
        }
        
        updateApiKeyStatus();
        updateWebAppUrlStatus();
        
        if (apiKey || webAppUrl) {
            alert('設定已儲存！請重新載入頁面以從 Google Sheets 載入資料。');
        } else {
            alert('請輸入至少一個設定項目。');
        }
    });
    
    // Settings modal - Test API Key button
    document.getElementById('testApiKeyBtn').addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (!apiKey) {
            alert('請先輸入 API Key。');
            return;
        }
        
        // Temporarily save the API key for testing
        const oldApiKey = GOOGLE_SHEETS_CONFIG.apiKey;
        GOOGLE_SHEETS_CONFIG.apiKey = apiKey;
        
        try {
            await fetchMembersFromSheets();
            alert('連線測試成功！API Key 可正常使用。');
        } catch (error) {
            alert(`連線測試失敗：${error.message}\n\n請確認：\n1. API Key 正確\n2. 已啟用 Google Sheets API\n3. 試算表權限設定為「知道連結的使用者」可檢視`);
        } finally {
            // Restore old API key
            GOOGLE_SHEETS_CONFIG.apiKey = oldApiKey;
        }
    });
    
    // Settings modal - Clear API Key button
    document.getElementById('clearApiKeyBtn').addEventListener('click', () => {
        if (confirm('確定要清除所有設定嗎？將改為使用本地 JSON 檔案。')) {
            clearApiKey();
            clearWebAppUrl();
            updateApiKeyStatus();
            updateWebAppUrlStatus();
            document.getElementById('apiKeyInput').value = '';
            document.getElementById('webAppUrlInput').value = '';
            alert('設定已清除！請重新載入頁面以使用本地 JSON 檔案。');
        }
    });
}

// Show attendee modal with session info
function showAttendeeModal(sessionCode) {
    const session = sessions.sessions.find(s => s.code === sessionCode);
    if (!session) return;
    
    const sessionInfo = document.getElementById('sessionInfo');
    sessionInfo.innerHTML = `
        <h6>課程資訊</h6>
        <p><strong>課程名稱：</strong>${escapeHtml(session.name)}</p>
        <p><strong>代號：</strong>${escapeHtml(session.code)}</p>
        <p><strong>講師：</strong>${escapeHtml(session.speaker)}</p>
        ${session.noReplay ? '<span class="badge bg-danger">無回放</span>' : ''}
    `;
    
    const currentAttendees = document.getElementById('currentAttendees');
    
    // Find members who have this session in their sessions array
    const attendingMembers = members.members.filter(member => 
        member.sessions.includes(sessionCode)
    );
    
    if (attendingMembers.length > 0) {
        currentAttendees.innerHTML = `
            <h6>標記參加的成員</h6>
            <p>${attendingMembers.map(member => escapeHtml(member.name)).join(', ')}</p>
        `;
    } else {
        currentAttendees.innerHTML = `
            <h6>標記參加的成員</h6>
            <p>尚無成員標記</p>
        `;
    }
    
    // Update the add course button
    updateAddCourseButton();
}

// Update add course button state
function updateAddCourseButton() {
    const btn = document.getElementById('addToTableBtn');
    
    if (!currentUser) {
        btn.textContent = '請先選擇使用者';
        btn.className = 'btn btn-secondary add-course-btn';
        btn.disabled = true;
        return;
    }
    
    const member = members.members.find(m => m.name === currentUser);
    if (member && member.sessions.includes(currentSessionCode)) {
        btn.textContent = '已加入表格';
        btn.className = 'btn btn-success add-course-btn';
        btn.disabled = true;
    } else {
        btn.textContent = '加入表格';
        btn.className = 'btn btn-primary add-course-btn';
        btn.disabled = false;
    }
}

// Show settings modal
function showSettingsModal() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const webAppUrlInput = document.getElementById('webAppUrlInput');
    const currentApiKey = loadApiKey();
    const currentWebAppUrl = loadWebAppUrl();
    
    // Pre-fill with current values if exist
    apiKeyInput.value = currentApiKey || '';
    webAppUrlInput.value = currentWebAppUrl || '';
    
    // Update status
    updateApiKeyStatus();
    updateWebAppUrlStatus();
}

// Update API key status display
function updateApiKeyStatus() {
    const statusElement = document.getElementById('apiKeyStatus');
    const apiKey = loadApiKey();
    
    if (apiKey) {
        statusElement.textContent = '✓ API Key 已設定';
        statusElement.className = 'form-text text-success';
    } else {
        statusElement.textContent = '尚未設定 API Key（將使用本地 JSON 檔案）';
        statusElement.className = 'form-text text-muted';
    }
}

// Update Web App URL status display
function updateWebAppUrlStatus() {
    const statusElement = document.getElementById('webAppUrlStatus');
    const webAppUrl = loadWebAppUrl();
    
    if (webAppUrl) {
        statusElement.textContent = '✓ Web App URL 已設定（可寫入 Google Sheets）';
        statusElement.className = 'form-text text-success';
    } else {
        statusElement.textContent = '尚未設定 Web App URL（無法寫入 Google Sheets）';
        statusElement.className = 'form-text text-muted';
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
