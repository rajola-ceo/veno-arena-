// tournaments.js - Complete with Real-time Notifications, Challenges, and League Auto-join
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const createLeagueBtn = document.getElementById('createLeagueBtn');
const joinLeagueBtn = document.getElementById('joinLeagueBtn');
const createTeamCard = document.getElementById('createTeamCard');
const joinLeagueCard = document.getElementById('joinLeagueCard');
const myLeaguesCard = document.getElementById('myLeaguesCard');
const leaderboardCard = document.getElementById('leaderboardCard');
const featuredLeaguesContainer = document.getElementById('featuredLeagues');
const activeLeaguesContainer = document.getElementById('activeLeagues');
const myTeamsContainer = document.getElementById('myTeams');
const allUsersContainer = document.getElementById('allUsersList');

// User Data
let currentUser = null;
let notificationCheckInterval = null;

// ================= INDIVIDUAL COINS PER ACCOUNT =================
function getUserCoins(userId = null) {
    const targetId = userId || (currentUser?.uid || currentUser?.userId);
    if (!targetId) return 0;
    
    // Get all users' coins
    let allUserCoins = JSON.parse(localStorage.getItem('userCoins') || '{}');
    
    // If user has no coins yet, initialize with 100 starting coins
    if (allUserCoins[targetId] === undefined) {
        allUserCoins[targetId] = 100; // Starting bonus
        localStorage.setItem('userCoins', JSON.stringify(allUserCoins));
    }
    
    return allUserCoins[targetId];
}

function setUserCoins(amount, userId = null) {
    const targetId = userId || (currentUser?.uid || currentUser?.userId);
    if (!targetId) return;
    
    let allUserCoins = JSON.parse(localStorage.getItem('userCoins') || '{}');
    allUserCoins[targetId] = amount;
    localStorage.setItem('userCoins', JSON.stringify(allUserCoins));
    
    // If it's the current user, update display
    if (!userId) updateVenoCoinsDisplay();
}

function addUserCoins(amount, userId = null) {
    const currentCoins = getUserCoins(userId);
    setUserCoins(currentCoins + amount, userId);
}

function deductUserCoins(amount, userId = null) {
    const currentCoins = getUserCoins(userId);
    if (currentCoins >= amount) {
        setUserCoins(currentCoins - amount, userId);
        return true;
    }
    return false;
}

function updateVenoCoinsDisplay() {
    const coinsSpan = document.getElementById('venoCoinsAmount');
    if (coinsSpan) {
        coinsSpan.textContent = getUserCoins();
    }
}

// ================= REAL-TIME NOTIFICATIONS =================
function addNotification(notification) {
    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
        id: Date.now(),
        ...notification,
        read: false,
        time: new Date().toLocaleString()
    });
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 50)));
    updateNotificationBell();
    playNotificationSound();
}

function updateNotificationBell() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    const countSpan = document.getElementById('notificationCount');
    if (countSpan) {
        countSpan.textContent = unreadCount;
        countSpan.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function playNotificationSound() {
    // Optional: play a beep sound
    try {
        const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Sound not supported'));
    } catch(e) {}
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    list.innerHTML = '';
    
    if (notifications.length === 0) {
        list.innerHTML = '<div class="empty-state">No notifications</div>';
        return;
    }
    
    notifications.slice(0, 10).forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-icon">${notif.icon || '🔔'}</div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
            ${!notif.read ? '<span class="notification-badge"></span>' : ''}
        `;
        item.onclick = () => markNotificationRead(notif.id, notif);
        list.appendChild(item);
    });
}

function markNotificationRead(notificationId, notification) {
    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotificationBell();
    renderNotifications();
    
    // Handle challenge response
    if (notification.type === 'challenge' && notification.data) {
        handleChallengeResponse(notification.data);
    }
}

// ================= CHALLENGE SYSTEM =================
function sendChallenge(targetUserId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const targetUser = users.find(u => u.uid === targetUserId);
    
    if (!targetUser) {
        showToast('User not found', 'error');
        return;
    }
    
    const challengerName = currentUser.customDisplayName || currentUser.displayName || currentUser.username;
    const targetName = targetUser.customDisplayName || targetUser.displayName || targetUser.username;
    
    // Create challenge code
    const challengeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const challengeId = 'challenge_' + Date.now();
    
    // Add notification to target user
    addNotification({
        title: '⚔️ Match Challenge!',
        message: `${challengerName} has challenged you to a match! Code: ${challengeCode}`,
        icon: '⚔️',
        type: 'challenge',
        data: {
            challengeId: challengeId,
            challengerId: currentUser.uid,
            challengerName: challengerName,
            code: challengeCode,
            timestamp: Date.now()
        }
    });
    
    // Save challenge for acceptance
    let pendingChallenges = JSON.parse(localStorage.getItem('pendingChallenges') || '[]');
    pendingChallenges.push({
        id: challengeId,
        challengerId: currentUser.uid,
        challengerName: challengerName,
        targetId: targetUserId,
        code: challengeCode,
        status: 'pending',
        createdAt: Date.now()
    });
    localStorage.setItem('pendingChallenges', JSON.stringify(pendingChallenges));
    
    showToast(`Challenge sent to ${targetName}! Code: ${challengeCode}`, 'success');
}

function handleChallengeResponse(notificationData) {
    const pendingChallenges = JSON.parse(localStorage.getItem('pendingChallenges') || '[]');
    const challenge = pendingChallenges.find(c => c.id === notificationData.challengeId);
    
    if (!challenge) return;
    
    // Show challenge acceptance dialog
    const accept = confirm(`${notificationData.challengerName} challenged you!\nEnter the code to accept: ${notificationData.code}\n\nDo you want to accept?`);
    
    if (accept) {
        const enteredCode = prompt("Enter the challenge code:", notificationData.code);
        if (enteredCode === notificationData.code) {
            // Challenge accepted - create match room
            const matchRoomId = 'match_' + Date.now();
            const matchRoom = {
                id: matchRoomId,
                player1: challenge.challengerId,
                player2: currentUser.uid,
                player1Name: challenge.challengerName,
                player2Name: currentUser.customDisplayName || currentUser.displayName,
                code: notificationData.code,
                status: 'active',
                createdAt: Date.now(),
                result: null
            };
            
            let matches = JSON.parse(localStorage.getItem('activeMatches') || '[]');
            matches.push(matchRoom);
            localStorage.setItem('activeMatches', JSON.stringify(matches));
            
            // Update challenge status
            challenge.status = 'accepted';
            localStorage.setItem('pendingChallenges', JSON.stringify(pendingChallenges));
            
            // Notify challenger
            addNotification({
                title: '✅ Challenge Accepted!',
                message: `${currentUser.customDisplayName || currentUser.displayName} accepted your challenge! Match code: ${notificationData.code}`,
                icon: '✅',
                type: 'match_start',
                data: { matchId: matchRoomId, code: notificationData.code }
            });
            
            showToast(`Match created! Code: ${notificationData.code}`, 'success');
            window.location.href = `match-room.html?id=${matchRoomId}&code=${notificationData.code}`;
        } else {
            showToast('Incorrect code! Challenge declined.', 'error');
            challenge.status = 'declined';
            localStorage.setItem('pendingChallenges', JSON.stringify(pendingChallenges));
        }
    } else {
        challenge.status = 'declined';
        localStorage.setItem('pendingChallenges', JSON.stringify(pendingChallenges));
    }
}

// ================= LEAGUE AUTO-JOIN (No Admin Approval) =================
window.joinLeague = function(leagueId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    const userCoins = getUserCoins();
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    const leagueIndex = leagues.findIndex(l => l.id === leagueId);
    
    if (leagueIndex === -1) {
        showToast('League not found', 'error');
        return;
    }
    
    const league = leagues[leagueIndex];
    
    // Check if already joined
    if (league.teams?.some(t => t.ownerId === currentUser.uid)) {
        showToast('You already joined this league!', 'info');
        return;
    }
    
    // Check if league is full
    const teamCount = league.teams?.length || 0;
    if (teamCount >= league.maxTeams) {
        showToast('League is full!', 'error');
        return;
    }
    
    // Check entry fee
    if (league.entryFee > userCoins) {
        showToast(`Need ${league.entryFee} Veno Coins to join! You have ${userCoins}`, 'error');
        return;
    }
    
    if (confirm(`Join ${league.name}?\n\nEntry Fee: ${league.entryFee} Veno Coins\nPrize Pool: ${league.prizePool} Veno Coins`)) {
        // Deduct entry fee
        deductUserCoins(league.entryFee);
        
        // Auto-join team (no approval needed)
        if (!league.teams) league.teams = [];
        league.teams.push({
            id: 'team_' + Date.now(),
            name: `${currentUser.customDisplayName || currentUser.displayName}'s Team`,
            ownerId: currentUser.uid,
            ownerName: currentUser.customDisplayName || currentUser.displayName,
            logo: currentUser.customAvatar || currentUser.photoURL,
            joinedAt: new Date().toISOString()
        });
        
        // Add notification to league owner
        addNotification({
            title: '👥 New Team Joined!',
            message: `${currentUser.customDisplayName || currentUser.displayName} joined your league "${league.name}"!`,
            icon: '👥',
            type: 'league_join',
            data: { leagueId: league.id, leagueName: league.name }
        });
        
        // Save
        leagues[leagueIndex] = league;
        localStorage.setItem('leagues', JSON.stringify(leagues));
        
        showToast(`Successfully joined ${league.name}!`, 'success');
        
        // Refresh display
        loadAllLeagues();
        loadActiveLeagues();
    }
};

// ================= LOAD CUSTOM PROFILE =================
function loadCustomProfile() {
    const user = JSON.parse(localStorage.getItem('crunkUser'));
    
    if (user) {
        const customName = user.customDisplayName || user.displayName || user.username || 'Player';
        const customAvatar = user.customAvatar || user.photoURL;
        
        const profileAvatar = document.getElementById('profileAvatarImg');
        const popupAvatar = document.getElementById('popupProfileImg');
        const profileNameSpan = document.getElementById('profileNameDisplay');
        const profileEmailSpan = document.getElementById('profileEmailDisplay');
        
        if (profileAvatar) {
            profileAvatar.src = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customName)}&background=10b981&color=fff&size=128`;
        }
        if (popupAvatar) {
            popupAvatar.src = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customName)}&background=10b981&color=fff&size=128`;
        }
        if (profileNameSpan) profileNameSpan.innerText = customName;
        if (profileEmailSpan) profileEmailSpan.innerText = user.email || '';
        
        const sidebarName = document.getElementById('sidebarUserName');
        const sidebarAvatar = document.getElementById('sidebarProfilePic');
        if (sidebarName) sidebarName.innerText = customName;
        if (sidebarAvatar) {
            sidebarAvatar.src = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customName)}&background=10b981&color=fff&size=128`;
        }
    }
}

// ================= LEAGUE FUNCTIONS =================
function createLeagueCard(league) {
    const card = document.createElement('div');
    card.className = 'league-card';
    card.onclick = () => window.location.href = `league-view.html?id=${league.id}`;
    
    const statusClass = league.status === 'live' ? 'status-live' : 
                        league.status === 'registration' ? 'status-registration' : 
                        league.status === 'upcoming' ? 'status-upcoming' : 'status-completed';
    const statusText = league.status === 'live' ? 'LIVE' : 
                       league.status === 'registration' ? 'REGISTRATION OPEN' : 
                       league.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED';
    
    const teamCount = league.teams?.length || 0;
    const maxTeams = league.maxTeams || 16;
    const isFull = teamCount >= maxTeams;
    const isOwner = currentUser && league.ownerId === currentUser.uid;
    const hasJoined = league.teams?.some(t => t.ownerId === currentUser?.uid);
    
    card.innerHTML = `
        <div class="league-header">
            <span class="league-type ${statusClass}">${statusText}</span>
            <div class="league-icon"><i class="fas fa-futbol"></i></div>
            <h3>${league.name || 'Unnamed League'}</h3>
            <div class="league-game">${league.gameType || 'eFootball'}</div>
            ${isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i> Your League</div>' : ''}
            ${hasJoined ? '<div class="joined-badge"><i class="fas fa-check-circle"></i> Joined</div>' : ''}
        </div>
        <div class="league-body">
            <div class="league-stats">
                <div class="stat"><div class="stat-value ${isFull ? 'full' : ''}">${teamCount}/${maxTeams}</div><div class="stat-label">Teams ${isFull ? '🔴 FULL' : ''}</div></div>
                <div class="stat"><div class="stat-value">${league.matches?.filter(m => m.result).length || 0}/${league.matches?.length || 0}</div><div class="stat-label">Matches</div></div>
                <div class="stat"><div class="stat-value">${league.weeks || 0}</div><div class="stat-label">Weeks</div></div>
            </div>
            <div class="league-prize"><span><i class="fas fa-trophy"></i> Prize Pool</span><span class="prize"><i class="fas fa-coins"></i> ${league.prizePool || 0} VC</span></div>
            <div class="league-prize"><span><i class="fas fa-door-open"></i> Entry Fee</span><span><i class="fas fa-coins"></i> ${league.entryFee || 0} VC</span></div>
            <div class="league-owner"><i class="fas fa-user"></i> Created by: <strong>${league.ownerName || 'Unknown'}</strong></div>
        </div>
        <div class="league-footer">
            ${!isOwner && !hasJoined ? `
                <button class="join-btn" onclick="event.stopPropagation(); window.joinLeague('${league.id}')" ${isFull ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i class="fas fa-sign-in-alt"></i> ${isFull ? 'League Full' : 'Join League'} (${league.entryFee} VC)
                </button>
            ` : hasJoined ? `
                <button class="joined-btn" disabled style="opacity:0.6; cursor:default;">
                    <i class="fas fa-check-circle"></i> Already Joined
                </button>
            ` : ''}
            <button class="details-btn" onclick="event.stopPropagation(); window.viewLeague('${league.id}')">
                <i class="fas fa-info-circle"></i> Details
            </button>
        </div>
    `;
    return card;
}

function createTeamCardFunction(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
    card.innerHTML = `
        <div class="team-logo">${team.logo ? `<img src="${team.logo}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">` : '<i class="fas fa-shield-alt"></i>'}</div>
        <div class="team-info"><div class="team-name">${team.name}</div><div class="team-stats"><span><i class="fas fa-trophy"></i> ${team.wins || 0} Wins</span><span><i class="fas fa-futbol"></i> ${team.matches || 0} Matches</span></div></div>
        <i class="fas fa-chevron-right" style="color: #10b981;"></i>
    `;
    return card;
}

// ================= LOAD FUNCTIONS =================
function loadAllLeagues() {
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    if (featuredLeaguesContainer) {
        featuredLeaguesContainer.innerHTML = '';
        if (leagues.length === 0) {
            featuredLeaguesContainer.innerHTML = `<div class="empty-state"><i class="fas fa-trophy"></i><p>No leagues yet. Be the first to create one!</p><button class="btn-primary" onclick="window.location.href='league-create.html'"><i class="fas fa-plus"></i> Create League</button></div>`;
            return;
        }
        const sortedLeagues = [...leagues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sortedLeagues.forEach(league => featuredLeaguesContainer.appendChild(createLeagueCard(league)));
    }
}

function loadActiveLeagues() {
    if (!activeLeaguesContainer) return;
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    const activeLeagues = leagues.filter(l => l.status === 'live' || l.status === 'registration');
    activeLeaguesContainer.innerHTML = '';
    if (activeLeagues.length === 0) {
        activeLeaguesContainer.innerHTML = '<div class="empty-state">No active leagues at the moment</div>';
        return;
    }
    activeLeagues.forEach(league => activeLeaguesContainer.appendChild(createLeagueCard(league)));
}

function loadMyTeams() {
    if (!myTeamsContainer) return;
    const teams = JSON.parse(localStorage.getItem('userTeams') || '[]');
    myTeamsContainer.innerHTML = '';
    if (teams.length === 0) {
        myTeamsContainer.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>You haven't created any teams yet</p><button class="btn-primary" onclick="window.location.href='team-create.html'"><i class="fas fa-plus"></i> Create Your First Team</button></div>`;
        return;
    }
    teams.forEach(team => myTeamsContainer.appendChild(createTeamCardFunction(team)));
}

// ================= ALL REGISTERED USERS =================
function loadAllUsers() {
    if (!allUsersContainer) return;
    
    let allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserData = JSON.parse(localStorage.getItem('crunkUser'));
    
    if (currentUserData && !allUsers.some(u => u.uid === currentUserData.userId || u.uid === currentUserData.uid)) {
        const customName = currentUserData.customDisplayName || currentUserData.displayName || currentUserData.username;
        const customAvatar = currentUserData.customAvatar || currentUserData.photoURL;
        allUsers.push({
            uid: currentUserData.userId || currentUserData.uid,
            username: customName,
            displayName: customName,
            email: currentUserData.email,
            photoURL: customAvatar,
            customAvatar: currentUserData.customAvatar,
            customDisplayName: currentUserData.customDisplayName,
            status: 'online',
            coins: getUserCoins(currentUserData.userId || currentUserData.uid),
            lastSeen: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(allUsers));
    }
    
    const uniqueUsers = [];
    const seen = new Set();
    for (const user of allUsers) {
        if (!seen.has(user.uid)) {
            seen.add(user.uid);
            uniqueUsers.push(user);
        }
    }
    uniqueUsers.sort((a, b) => (a.displayName || a.username || '').localeCompare(b.displayName || b.username || ''));
    
    allUsersContainer.innerHTML = '';
    if (uniqueUsers.length === 0) {
        allUsersContainer.innerHTML = '<div class="empty-state">No players found</div>';
        return;
    }
    
    uniqueUsers.forEach(user => {
        const isCurrentUser = currentUser && (user.uid === currentUser.uid || user.uid === currentUser.userId);
        const displayName = user.customDisplayName || user.displayName || user.username || 'Player';
        const avatarUrl = user.customAvatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`;
        
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.onclick = () => viewUserProfile(user.uid);
        userCard.innerHTML = `
            <div class="user-avatar"><img src="${avatarUrl}" alt="${displayName}">${user.status === 'online' ? '<span class="online-dot"></span>' : ''}</div>
            <div class="user-info">
                <div class="user-name">${displayName}</div>
                <div class="user-stats">
                    <span><i class="fas fa-coins"></i> ${getUserCoins(user.uid)} VC</span>
                    <span><i class="fas fa-trophy"></i> ${user.leaguesWon || 0}</span>
                </div>
            </div>
            ${!isCurrentUser ? `<button class="challenge-btn" onclick="event.stopPropagation(); sendChallenge('${user.uid}')"><i class="fas fa-handshake"></i> Challenge</button>` : '<span class="you-badge">You</span>'}
        `;
        allUsersContainer.appendChild(userCard);
    });
}

function viewUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

// ================= SPIN WHEEL =================
let spinCanvas = null, spinCtx = null, spinRotation = 0, isSpinning = false;
const spinPrizes = [
    { name: "50 Coins", value: 50, color: "#3b82f6", chance: 34 },
    { name: "100 Coins", value: 100, color: "#10b981", chance: 30 },
    { name: "200 Coins", value: 200, color: "#f59e0b", chance: 20 },
    { name: "500 Coins", value: 500, color: "#8b5cf6", chance: 10 },
    { name: "1000 Coins", value: 1000, color: "#ec489a", chance: 5 },
    { name: "5000 Coins", value: 5000, color: "#ef4444", chance: 1 }
];

function drawSpinWheel() {
    if (!spinCanvas) return;
    const size = 400;
    spinCanvas.width = size; spinCanvas.height = size;
    spinCtx = spinCanvas.getContext('2d');
    const centerX = size/2, centerY = size/2, radius = size/2;
    const anglePerSlice = (Math.PI * 2) / spinPrizes.length;
    for (let i = 0; i < spinPrizes.length; i++) {
        const startAngle = i * anglePerSlice + spinRotation;
        const endAngle = (i + 1) * anglePerSlice + spinRotation;
        spinCtx.beginPath();
        spinCtx.moveTo(centerX, centerY);
        spinCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        spinCtx.fillStyle = spinPrizes[i].color;
        spinCtx.fill();
        spinCtx.strokeStyle = "white";
        spinCtx.lineWidth = 2;
        spinCtx.stroke();
        spinCtx.save();
        spinCtx.translate(centerX, centerY);
        spinCtx.rotate(startAngle + anglePerSlice/2);
        spinCtx.textAlign = "center";
        spinCtx.fillStyle = "white";
        spinCtx.font = "bold 12px Arial";
        spinCtx.fillText(spinPrizes[i].name, radius * 0.65, 8);
        spinCtx.restore();
    }
    spinCtx.beginPath();
    spinCtx.arc(centerX, centerY, 35, 0, Math.PI*2);
    spinCtx.fillStyle = "#1f2937";
    spinCtx.fill();
    spinCtx.fillStyle = "#10b981";
    spinCtx.font = "bold 14px Arial";
    spinCtx.textAlign = "center";
    spinCtx.textBaseline = "middle";
    spinCtx.fillText("SPIN", centerX, centerY);
}

function getSpinPrize() {
    const anglePerSlice = (Math.PI*2)/spinPrizes.length;
    const pointerAngle = (Math.PI*2 - (spinRotation % (Math.PI*2)) + Math.PI/2) % (Math.PI*2);
    const index = Math.floor(pointerAngle / anglePerSlice) % spinPrizes.length;
    return spinPrizes[index];
}

function doSpin() {
    if (isSpinning) return;
    const coins = getUserCoins();
    if (coins < 200) { showToast(`Need 200 Veno Coins! You have ${coins}.`, "error"); return; }
    showToast(`🎰 Spinning... 200 coins deducted!`, "info");
    deductUserCoins(200);
    const spinBalanceSpan = document.getElementById('spinBalance');
    if (spinBalanceSpan) spinBalanceSpan.innerText = getUserCoins();
    isSpinning = true;
    const spinBtn = document.getElementById('spinWheelBtn');
    if (spinBtn) spinBtn.disabled = true;
    const spins = 8 + Math.random() * 8;
    const targetRotation = spinRotation + (Math.PI * 2 * spins);
    const startTime = performance.now();
    const duration = 2500;
    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        spinRotation = targetRotation * easeOut;
        drawSpinWheel();
        if (progress < 1) { requestAnimationFrame(animate); }
        else {
            spinRotation = targetRotation % (Math.PI * 2);
            drawSpinWheel();
            const prize = getSpinPrize();
            addUserCoins(prize.value);
            const netChange = prize.value - 200;
            if (netChange > 0) showToast(`🎉 You won ${prize.value} coins! +${netChange}!`, "success");
            else if (netChange === 0) showToast(`🎁 You won ${prize.value} coins! You got your coins back!`, "success");
            else showToast(`✨ You won ${prize.value} coins! Net loss: ${netChange}.`, "info");
            const resultDiv = document.createElement('div');
            resultDiv.className = 'spin-result-popup';
            resultDiv.innerHTML = `<div class="spin-result-icon">${prize.value >= 1000 ? '🏆' : prize.value >= 500 ? '⭐' : '🎁'}</div><h3>${prize.value >= 1000 ? 'JACKPOT!' : 'You Won!'}</h3><div class="spin-result-amount">+${prize.value} Coins</div><button class="spin-result-close" onclick="this.parentElement.remove()">Continue</button>`;
            document.body.appendChild(resultDiv);
            setTimeout(() => resultDiv.classList.add('show'), 10);
            if (prize.value >= 1000) {
                for (let i = 0; i < 80; i++) {
                    const confetti = document.createElement('div');
                    confetti.style.cssText = `position:fixed; width:10px; height:10px; background:hsl(${Math.random()*360},100%,50%); left:${Math.random()*window.innerWidth}px; top:-10px; border-radius:50%; pointer-events:none; z-index:10002;`;
                    document.body.appendChild(confetti);
                    confetti.animate([{ transform: `translateY(0) rotate(0deg)`, opacity: 1 }, { transform: `translateY(${window.innerHeight}px) rotate(${Math.random()*360}deg)`, opacity: 0 }], { duration: 1500 + Math.random()*1000, easing: 'cubic-bezier(0.2,0.8,0.3,1)' }).onfinish = () => confetti.remove();
                }
            }
            isSpinning = false;
            if (spinBtn) spinBtn.disabled = false;
        }
    }
    requestAnimationFrame(animate);
}

// ================= NAVIGATION =================
if (createLeagueBtn) createLeagueBtn.addEventListener('click', () => window.location.href = 'league-create.html');
if (joinLeagueBtn) joinLeagueBtn.addEventListener('click', () => document.querySelector('.featured-section')?.scrollIntoView({ behavior: 'smooth' }));
if (createTeamCard) createTeamCard.addEventListener('click', () => window.location.href = 'team-create.html');
if (joinLeagueCard) joinLeagueCard.addEventListener('click', () => document.querySelector('.featured-section')?.scrollIntoView({ behavior: 'smooth' }));
if (myLeaguesCard) myLeaguesCard.addEventListener('click', () => window.location.href = 'my-leagues.html');
if (leaderboardCard) leaderboardCard.addEventListener('click', () => window.location.href = 'leaderboard.html');

// ================= SIDEBAR NAVIGATION =================
const menuHome = document.getElementById('menuHome');
const menuTournaments = document.getElementById('menuTournaments');
const menuLeagues = document.getElementById('menuLeagues');
const menuTeams = document.getElementById('menuTeams');
const menuCreateLeague = document.getElementById('menuCreateLeague');
const menuCreateTeam = document.getElementById('menuCreateTeam');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuSettings = document.getElementById('menuSettings');
if (menuHome) menuHome.addEventListener('click', () => window.location.href = 'home.html');
if (menuTournaments) menuTournaments.addEventListener('click', () => window.location.href = 'home.html');
if (menuLeagues) menuLeagues.addEventListener('click', () => window.location.href = 'my-leagues.html');
if (menuTeams) menuTeams.addEventListener('click', () => window.location.href = 'my-teams.html');
if (menuCreateLeague) menuCreateLeague.addEventListener('click', () => window.location.href = 'league-create.html');
if (menuCreateTeam) menuCreateTeam.addEventListener('click', () => window.location.href = 'team-create.html');
if (menuLeaderboard) menuLeaderboard.addEventListener('click', () => window.location.href = 'leaderboard.html');
if (menuSettings) menuSettings.addEventListener('click', () => window.location.href = 'settings.html');

// ================= OTHER INITIALIZATIONS =================
const venauraIcon = document.getElementById('venauraIcon');
if (venauraIcon) venauraIcon.addEventListener('click', () => window.open('https://venauraai.netlify.app/', '_blank'));

const profileDropdown = document.getElementById('profileDropdown');
const profilePopup = document.getElementById('profilePopup');
if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => { e.stopPropagation(); profilePopup.classList.toggle('active'); });
    document.addEventListener('click', (e) => { if (!profileDropdown.contains(e.target) && !profilePopup.contains(e.target)) profilePopup.classList.remove('active'); });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem('crunkUser'); window.location.href = 'index.html'; });

const menuTheme = document.getElementById('menuTheme');
const themeLabel = document.getElementById('themeLabel');
if (menuTheme) {
    menuTheme.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeLabel.innerText = isLight ? 'Light' : 'Dark';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') { document.body.classList.add('light-theme'); if (themeLabel) themeLabel.innerText = 'Light'; }

// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadCustomProfile();
        updateVenoCoinsDisplay();
        loadMyTeams();
        loadAllUsers();
    }
});

// ================= INITIALIZE =================
document.addEventListener('DOMContentLoaded', () => {
    loadAllLeagues();
    loadActiveLeagues();
    loadAllUsers();
    updateVenoCoinsDisplay();
    renderNotifications();
    updateNotificationBell();
    
    // Real-time notification check every 5 seconds
    if (notificationCheckInterval) clearInterval(notificationCheckInterval);
    notificationCheckInterval = setInterval(() => {
        renderNotifications();
        updateNotificationBell();
    }, 5000);
    
    const spinModal = document.getElementById('spinModal');
    if (spinModal) {
        const spinClose = spinModal.querySelector('.spin-close');
        if (spinClose) spinClose.addEventListener('click', () => spinModal.classList.remove('active'));
        spinModal.addEventListener('click', (e) => { if (e.target === spinModal) spinModal.classList.remove('active'); });
        const spinWheelBtn = document.getElementById('spinWheelBtn');
        if (spinWheelBtn) spinWheelBtn.addEventListener('click', doSpin);
    }
    
    const quickActions = document.querySelector('.quick-actions');
    if (quickActions && !document.querySelector('.spin-action-card')) {
        const spinCard = document.createElement('div');
        spinCard.className = 'action-card spin-action-card';
        spinCard.innerHTML = `<i class="fas fa-chart-simple"></i><h3>Spin & Win</h3><p>Win up to 5000 Veno Coins!</p>`;
        spinCard.onclick = () => {
            const modal = document.getElementById('spinModal');
            if (modal) {
                modal.classList.add('active');
                const balanceSpan = document.getElementById('spinBalance');
                if (balanceSpan) balanceSpan.innerText = getUserCoins();
                setTimeout(() => { spinCanvas = document.getElementById('spinWheelCanvas'); if (spinCanvas) drawSpinWheel(); }, 100);
            }
        };
        quickActions.appendChild(spinCard);
    }
    
    // Notification bell click
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPopup = document.getElementById('notificationPopup');
    if (notificationBtn && notificationPopup) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPopup.classList.toggle('active');
            renderNotifications();
        });
        document.addEventListener('click', (e) => {
            if (!notificationBtn.contains(e.target) && !notificationPopup.contains(e.target)) {
                notificationPopup.classList.remove('active');
            }
        });
    }
    
    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        markAllRead.addEventListener('click', () => {
            let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            notifications = notifications.map(n => ({ ...n, read: true }));
            localStorage.setItem('notifications', JSON.stringify(notifications));
            renderNotifications();
            updateNotificationBell();
        });
    }
});

// ================= VENO COINS CLAIM =================
const claimBtn = document.getElementById('claimVenoCoinsBtn');
if (claimBtn) {
    const LAST_CLAIM_KEY = 'lastVenoClaim';
    function canClaim() { const last = localStorage.getItem(LAST_CLAIM_KEY); if (!last) return true; return (Date.now() - parseInt(last)) >= 24 * 60 * 60 * 1000; }
    function updateClaimButton() {
        if (canClaim()) { claimBtn.disabled = false; claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10'; claimBtn.style.opacity = '1'; }
        else {
            claimBtn.disabled = true;
            const timeLeft = 24 * 60 * 60 * 1000 - (Date.now() - parseInt(localStorage.getItem(LAST_CLAIM_KEY)));
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            claimBtn.innerHTML = `<i class="fas fa-clock"></i> ${hoursLeft}h ${minutesLeft}m left`;
            claimBtn.style.opacity = '0.6';
        }
    }
    claimBtn.addEventListener('click', () => {
        if (canClaim()) {
            addUserCoins(10);
            localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
            updateClaimButton();
            showToast('🎉 You claimed 10 Veno Coins!', 'success');
        } else showToast('Already claimed! Come back tomorrow', 'error');
    });
    updateClaimButton();
    setInterval(updateClaimButton, 60000);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// Make functions global
window.joinLeague = joinLeague;
window.viewLeague = (leagueId) => window.location.href = `league-view.html?id=${leagueId}`;
window.goToDashboard = (leagueId) => window.location.href = `league-dashboard.html?id=${leagueId}`;
window.sendChallenge = sendChallenge;

console.log('✅ Veno-Arena loaded - Individual coins, real-time notifications, and auto-join enabled');
