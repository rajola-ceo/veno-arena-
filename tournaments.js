// tournaments.js - Main Tournaments Page Logic
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

// User Data
let currentUser = null;

// Veno Coins System
function getVenoCoins() {
    return parseInt(localStorage.getItem('venoCoins') || '0');
}

function updateVenoCoinsDisplay() {
    const coinsSpan = document.getElementById('venoCoinsAmount');
    if (coinsSpan) {
        coinsSpan.textContent = getVenoCoins();
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
    
    card.innerHTML = `
        <div class="league-header">
            <span class="league-type ${statusClass}">${statusText}</span>
            <div class="league-icon">
                <i class="fas fa-futbol"></i>
            </div>
            <h3>${league.name || 'Unnamed League'}</h3>
            <div class="league-game">${league.gameType || 'eFootball'}</div>
        </div>
        <div class="league-body">
            <div class="league-stats">
                <div class="stat">
                    <div class="stat-value">${league.teams?.length || 0}/${league.maxTeams || 16}</div>
                    <div class="stat-label">Teams</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${league.matches?.filter(m => m.result).length || 0}/${league.matches?.length || 0}</div>
                    <div class="stat-label">Matches</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${league.weeks || 0}</div>
                    <div class="stat-label">Weeks</div>
                </div>
            </div>
            <div class="league-prize">
                <span><i class="fas fa-trophy"></i> Prize Pool</span>
                <span class="prize"><i class="fas fa-coins"></i> ${league.prizePool || 0} VC</span>
            </div>
            <div class="league-prize">
                <span><i class="fas fa-door-open"></i> Entry Fee</span>
                <span><i class="fas fa-coins"></i> ${league.entryFee || 0} VC</span>
            </div>
        </div>
        <div class="league-footer">
            <button class="join-btn" onclick="event.stopPropagation(); window.joinLeague('${league.id}')">
                <i class="fas fa-sign-in-alt"></i> Join League
            </button>
            <button class="details-btn" onclick="event.stopPropagation(); window.viewLeague('${league.id}')">
                <i class="fas fa-info-circle"></i> Details
            </button>
        </div>
    `;
    
    return card;
}

// ================= TEAM FUNCTIONS =================
function createTeamCardFunction(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
    
    card.innerHTML = `
        <div class="team-logo">
            ${team.logo ? `<img src="${team.logo}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">` : '<i class="fas fa-shield-alt"></i>'}
        </div>
        <div class="team-info">
            <div class="team-name">${team.name}</div>
            <div class="team-stats">
                <span><i class="fas fa-trophy"></i> ${team.wins || 0} Wins</span>
                <span><i class="fas fa-futbol"></i> ${team.matches || 0} Matches</span>
            </div>
        </div>
        <i class="fas fa-chevron-right" style="color: #10b981;"></i>
    `;
    
    return card;
}

// ================= LOAD FUNCTIONS =================
function loadFeaturedLeagues() {
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    
    if (featuredLeaguesContainer) {
        featuredLeaguesContainer.innerHTML = '';
        
        if (leagues.length === 0) {
            featuredLeaguesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No leagues yet. Be the first to create one!</p>
                    <button class="btn-primary" onclick="window.location.href='league-create.html'">
                        <i class="fas fa-plus"></i> Create League
                    </button>
                </div>
            `;
            return;
        }
        
        const latestLeagues = leagues.slice(0, 6);
        latestLeagues.forEach(league => {
            featuredLeaguesContainer.appendChild(createLeagueCard(league));
        });
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
    
    activeLeagues.slice(0, 3).forEach(league => {
        activeLeaguesContainer.appendChild(createLeagueCard(league));
    });
}

function loadMyTeams() {
    if (!myTeamsContainer) return;
    
    const teams = JSON.parse(localStorage.getItem('userTeams') || '[]');
    
    myTeamsContainer.innerHTML = '';
    
    if (teams.length === 0) {
        myTeamsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>You haven't created any teams yet</p>
                <button class="btn-primary" onclick="window.location.href='team-create.html'">
                    <i class="fas fa-plus"></i> Create Your First Team
                </button>
            </div>
        `;
        return;
    }
    
    teams.forEach(team => {
        myTeamsContainer.appendChild(createTeamCardFunction(team));
    });
}

// ================= ACTION FUNCTIONS =================
window.joinLeague = function(leagueId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        window.location.href = 'index.html';
        return;
    }
    
    const userCoins = getVenoCoins();
    const leagues = JSON.parse(localStorage.getItem('leagues') || '[]');
    const leagueIndex = leagues.findIndex(l => l.id === leagueId);
    
    if (leagueIndex === -1) {
        showToast('League not found', 'error');
        return;
    }
    
    const league = leagues[leagueIndex];
    
    const alreadyRequested = league.pendingRequests?.some(r => r.ownerId === currentUser.uid);
    const alreadyJoined = league.teams?.some(t => t.ownerId === currentUser.uid);
    
    if (alreadyJoined) {
        showToast('You already joined this league!', 'info');
        return;
    }
    
    if (alreadyRequested) {
        showToast('You already sent a join request!', 'info');
        return;
    }
    
    if (league.entryFee > userCoins) {
        showToast(`Need ${league.entryFee} Veno Coins to join!`, 'error');
        return;
    }
    
    if (confirm(`Join ${league.name}?\n\nEntry Fee: ${league.entryFee} Veno Coins\nPrize Pool: ${league.prizePool} Veno Coins`)) {
        localStorage.setItem('venoCoins', userCoins - league.entryFee);
        updateVenoCoinsDisplay();
        
        if (!league.pendingRequests) league.pendingRequests = [];
        league.pendingRequests.push({
            id: 'req_' + Date.now(),
            teamName: `${currentUser.displayName}'s Team`,
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName,
            logo: currentUser.photoURL,
            requestedAt: new Date().toISOString()
        });
        
        leagues[leagueIndex] = league;
        localStorage.setItem('leagues', JSON.stringify(leagues));
        
        showToast(`Join request sent to ${league.ownerName}!`, 'success');
    }
};

window.viewLeague = function(leagueId) {
    window.location.href = `league-view.html?id=${leagueId}`;
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ================= SPIN WHEEL FUNCTIONALITY =================
let spinCanvas = null;
let spinCtx = null;
let spinRotation = 0;
let isSpinning = false;

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
    spinCanvas.width = size;
    spinCanvas.height = size;
    spinCtx = spinCanvas.getContext('2d');
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
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
        spinCtx.rotate(startAngle + anglePerSlice / 2);
        spinCtx.textAlign = "center";
        spinCtx.fillStyle = "white";
        spinCtx.font = "bold 12px Arial";
        spinCtx.fillText(spinPrizes[i].name, radius * 0.65, 8);
        spinCtx.restore();
    }
    
    spinCtx.beginPath();
    spinCtx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    spinCtx.fillStyle = "#1f2937";
    spinCtx.fill();
    spinCtx.fillStyle = "#10b981";
    spinCtx.font = "bold 14px Arial";
    spinCtx.textAlign = "center";
    spinCtx.textBaseline = "middle";
    spinCtx.fillText("SPIN", centerX, centerY);
}

function getSpinPrize() {
    const anglePerSlice = (Math.PI * 2) / spinPrizes.length;
    const pointerAngle = (Math.PI * 2 - (spinRotation % (Math.PI * 2)) + Math.PI / 2) % (Math.PI * 2);
    const index = Math.floor(pointerAngle / anglePerSlice) % spinPrizes.length;
    return spinPrizes[index];
}

function doSpin() {
    if (isSpinning) return;
    
    const coins = getVenoCoins();
    if (coins < 200) {
        showToast(`Need 200 Veno Coins to spin! You have ${coins} coins.`, "error");
        return;
    }
    
    // Deduct coins
    showToast(`🎰 Spinning... 200 coins deducted!`, "info");
    localStorage.setItem('venoCoins', coins - 200);
    updateVenoCoinsDisplay();
    
    const spinBalanceSpan = document.getElementById('spinBalance');
    if (spinBalanceSpan) spinBalanceSpan.innerText = coins - 200;
    
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
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            spinRotation = targetRotation % (Math.PI * 2);
            drawSpinWheel();
            
            const prize = getSpinPrize();
            const currentCoins = getVenoCoins();
            const newCoins = currentCoins + prize.value;
            localStorage.setItem('venoCoins', newCoins);
            updateVenoCoinsDisplay();
            
            const netChange = prize.value - 200;
            if (netChange > 0) {
                showToast(`🎉 You won ${prize.value} coins! Net gain: +${netChange} coins!`, "success");
            } else if (netChange === 0) {
                showToast(`🎁 You won ${prize.value} coins! You got your coins back!`, "success");
            } else {
                showToast(`✨ You won ${prize.value} coins! Net loss: ${netChange} coins.`, "info");
            }
            
            showSpinResultPopup(prize);
            
            isSpinning = false;
            if (spinBtn) spinBtn.disabled = false;
        }
    }
    
    requestAnimationFrame(animate);
}

function showSpinResultPopup(prize) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'spin-result-popup';
    resultDiv.innerHTML = `
        <div class="spin-result-icon">${prize.value >= 1000 ? '🏆' : prize.value >= 500 ? '⭐' : '🎁'}</div>
        <h3>${prize.value >= 1000 ? 'JACKPOT!' : 'You Won!'}</h3>
        <div class="spin-result-amount">+${prize.value} Coins</div>
        <button class="spin-result-close" onclick="this.parentElement.remove()">Continue</button>
    `;
    document.body.appendChild(resultDiv);
    setTimeout(() => resultDiv.classList.add('show'), 10);
    
    if (prize.value >= 1000) {
        createConfetti();
    }
}

function createConfetti() {
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: hsl(${Math.random() * 360}, 100%, 50%);
            left: ${Math.random() * window.innerWidth}px;
            top: -10px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10002;
        `;
        document.body.appendChild(confetti);
        
        confetti.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 1500 + Math.random() * 1000,
            easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)'
        }).onfinish = () => confetti.remove();
    }
}

// ================= NAVIGATION =================
if (createLeagueBtn) {
    createLeagueBtn.addEventListener('click', () => {
        window.location.href = 'league-create.html';
    });
}

if (joinLeagueBtn) {
    joinLeagueBtn.addEventListener('click', () => {
        document.querySelector('.featured-section')?.scrollIntoView({ behavior: 'smooth' });
    });
}

if (createTeamCard) {
    createTeamCard.addEventListener('click', () => {
        window.location.href = 'team-create.html';
    });
}

if (joinLeagueCard) {
    joinLeagueCard.addEventListener('click', () => {
        document.querySelector('.featured-section')?.scrollIntoView({ behavior: 'smooth' });
    });
}

if (myLeaguesCard) {
    myLeaguesCard.addEventListener('click', () => {
        window.location.href = 'my-leagues.html';
    });
}

if (leaderboardCard) {
    leaderboardCard.addEventListener('click', () => {
        window.location.href = 'leaderboard.html';
    });
}

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
if (menuTournaments) menuTournaments.addEventListener('click', () => window.location.href = 'tournaments.html');
if (menuLeagues) menuLeagues.addEventListener('click', () => window.location.href = 'my-leagues.html');
if (menuTeams) menuTeams.addEventListener('click', () => window.location.href = 'my-teams.html');
if (menuCreateLeague) menuCreateLeague.addEventListener('click', () => window.location.href = 'league-create.html');
if (menuCreateTeam) menuCreateTeam.addEventListener('click', () => window.location.href = 'team-create.html');
if (menuLeaderboard) menuLeaderboard.addEventListener('click', () => window.location.href = 'leaderboard.html');
if (menuSettings) menuSettings.addEventListener('click', () => window.location.href = 'settings.html');

// ================= VENAURA ICON =================
const venauraIcon = document.getElementById('venauraIcon');
if (venauraIcon) {
    venauraIcon.addEventListener('click', () => {
        window.open('https://your-venaura-app-url.com', '_blank');
    });
}

// ================= PROFILE DROPDOWN =================
const profileDropdown = document.getElementById('profileDropdown');
const profilePopup = document.getElementById('profilePopup');
if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        profilePopup.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && !profilePopup.contains(e.target)) {
            profilePopup.classList.remove('active');
        }
    });
}

// ================= LOGOUT =================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('crunkUser');
        window.location.href = 'index.html';
    });
}

// ================= THEME TOGGLE =================
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
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeLabel) themeLabel.innerText = 'Light';
}

// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        
        const googleProfilePic = document.getElementById('googleProfilePic');
        const popupProfilePic = document.getElementById('popupProfilePic');
        const accountName = document.getElementById('accountName');
        const accountEmail = document.getElementById('accountEmail');
        
        if (googleProfilePic) {
            googleProfilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10b981&color=fff&size=128`;
        }
        if (popupProfilePic) {
            popupProfilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=10b981&color=fff&size=128`;
        }
        if (accountName) accountName.innerText = user.displayName;
        if (accountEmail) accountEmail.innerText = user.email;
        
        updateVenoCoinsDisplay();
        loadMyTeams();
    }
});

// ================= INITIALIZE =================
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedLeagues();
    loadActiveLeagues();
    updateVenoCoinsDisplay();
    
    // Initialize spin modal
    const spinModal = document.getElementById('spinModal');
    if (spinModal) {
        const spinClose = spinModal.querySelector('.spin-close');
        if (spinClose) {
            spinClose.addEventListener('click', () => spinModal.classList.remove('active'));
        }
        
        spinModal.addEventListener('click', (e) => {
            if (e.target === spinModal) spinModal.classList.remove('active');
        });
        
        const spinWheelBtn = document.getElementById('spinWheelBtn');
        if (spinWheelBtn) {
            spinWheelBtn.addEventListener('click', doSpin);
        }
    }
    
    // Add spin card to quick actions
    const quickActions = document.querySelector('.quick-actions');
    if (quickActions && !document.querySelector('.spin-action-card')) {
        const spinCard = document.createElement('div');
        spinCard.className = 'action-card spin-action-card';
        spinCard.id = 'spinCard';
        spinCard.innerHTML = `
            <i class="fas fa-chart-simple"></i>
            <h3>Spin & Win</h3>
            <p>Win up to 5000 Veno Coins!</p>
        `;
        spinCard.onclick = () => {
            const modal = document.getElementById('spinModal');
            if (modal) {
                modal.classList.add('active');
                const balanceSpan = document.getElementById('spinBalance');
                if (balanceSpan) balanceSpan.innerText = getVenoCoins();
                setTimeout(() => {
                    spinCanvas = document.getElementById('spinWheelCanvas');
                    if (spinCanvas) drawSpinWheel();
                }, 100);
            }
        };
        quickActions.appendChild(spinCard);
    }
});

// ================= VENO COINS CLAIM =================
const claimBtn = document.getElementById('claimVenoCoinsBtn');
if (claimBtn) {
    const LAST_CLAIM_KEY = 'lastVenoClaim';
    
    function canClaim() {
        const lastClaim = localStorage.getItem(LAST_CLAIM_KEY);
        if (!lastClaim) return true;
        return (Date.now() - parseInt(lastClaim)) >= 24 * 60 * 60 * 1000;
    }
    
    function updateClaimButton() {
        if (canClaim()) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10';
            claimBtn.style.opacity = '1';
        } else {
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
            const currentCoins = getVenoCoins();
            const newCoins = currentCoins + 10;
            localStorage.setItem('venoCoins', newCoins);
            localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
            updateVenoCoinsDisplay();
            updateClaimButton();
            showToast('🎉 You claimed 10 Veno Coins!', 'success');
        } else {
            showToast('Already claimed! Come back tomorrow', 'error');
        }
    });
    
    updateClaimButton();
    setInterval(updateClaimButton, 60000);
}

console.log('✅ Tournaments page loaded');
