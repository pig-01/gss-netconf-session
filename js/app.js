// Global variables
let tableStructure = null;
let sessions = null;
let members = null;
let currentSessionCode = null;
let selectedMemberFilter = null;

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

// Load members from JSON
async function loadMembers() {
    const response = await fetch('data/members.json');
    members = await response.json();
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
                
                const codeDiv = document.createElement('div');
                codeDiv.className = 'session-code';
                codeDiv.textContent = `代號: ${session.code}`;
                
                const speakerDiv = document.createElement('div');
                speakerDiv.className = 'session-speaker';
                speakerDiv.textContent = `講師: ${session.speaker}`;
                
                td.appendChild(titleDiv);
                td.appendChild(codeDiv);
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
    
    // Click on session cells
    document.getElementById('scheduleTable').addEventListener('click', (e) => {
        const cell = e.target.closest('td.session-cell');
        if (!cell) return;
        
        const sessionCode = cell.dataset.sessionCode;
        if (!sessionCode) return;
        
        currentSessionCode = sessionCode;
        showAttendeeModal(sessionCode);
        modal.show();
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
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
