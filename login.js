// ================= SESSION CHECK =================
const savedUser = localStorage.getItem("crunkUser");
if (savedUser) {
    window.location.href = "home.html";
}

// ================= LABEL ANIMATION =================
window.addEventListener('load', () => {
    const container = document.querySelector('.container');
    if (container) container.style.opacity = 1;

    const labels = document.querySelectorAll('.form-control label');
    labels.forEach(label => {
        label.innerHTML = label.innerText
            .split('')
            .map((letter, idx) => `<span style="transition-delay:${idx * 30}ms">${letter}</span>`)
            .join('');
    });
});

// ================= FIREBASE MODULAR SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ================= FIREBASE CONFIG (Same as chat app) =================
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7",
    measurementId: "G-7ZQ20HK4SD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

window.auth = auth;
window.db = db;

// ================= COUNTRY CODES API =================
async function fetchCountryCodes() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
        const countries = await response.json();
        
        return countries
            .filter(country => country.idd?.root && country.idd?.suffixes?.[0])
            .map(country => {
                const root = country.idd.root;
                const suffix = country.idd.suffixes[0];
                const code = root + suffix;
                
                return {
                    code: code,
                    country: country.name.common,
                    cca2: country.cca2.toLowerCase()
                };
            })
            .sort((a, b) => a.country.localeCompare(b.country));
    } catch (error) {
        console.error('Error fetching countries:', error);
        return getFallbackCountryCodes();
    }
}

// ================= FALLBACK COUNTRY CODES =================
function getFallbackCountryCodes() {
    return [
        { code: "+93", country: "Afghanistan" },
        { code: "+355", country: "Albania" },
        { code: "+213", country: "Algeria" },
        { code: "+376", country: "Andorra" },
        { code: "+244", country: "Angola" },
        { code: "+54", country: "Argentina" },
        { code: "+374", country: "Armenia" },
        { code: "+61", country: "Australia" },
        { code: "+43", country: "Austria" },
        { code: "+994", country: "Azerbaijan" },
        { code: "+973", country: "Bahrain" },
        { code: "+880", country: "Bangladesh" },
        { code: "+375", country: "Belarus" },
        { code: "+32", country: "Belgium" },
        { code: "+501", country: "Belize" },
        { code: "+229", country: "Benin" },
        { code: "+975", country: "Bhutan" },
        { code: "+591", country: "Bolivia" },
        { code: "+387", country: "Bosnia and Herzegovina" },
        { code: "+267", country: "Botswana" },
        { code: "+55", country: "Brazil" },
        { code: "+673", country: "Brunei" },
        { code: "+359", country: "Bulgaria" },
        { code: "+226", country: "Burkina Faso" },
        { code: "+257", country: "Burundi" },
        { code: "+855", country: "Cambodia" },
        { code: "+237", country: "Cameroon" },
        { code: "+1", country: "Canada" },
        { code: "+238", country: "Cape Verde" },
        { code: "+236", country: "Central African Republic" },
        { code: "+235", country: "Chad" },
        { code: "+56", country: "Chile" },
        { code: "+86", country: "China" },
        { code: "+57", country: "Colombia" },
        { code: "+269", country: "Comoros" },
        { code: "+242", country: "Congo" },
        { code: "+506", country: "Costa Rica" },
        { code: "+385", country: "Croatia" },
        { code: "+53", country: "Cuba" },
        { code: "+357", country: "Cyprus" },
        { code: "+420", country: "Czech Republic" },
        { code: "+45", country: "Denmark" },
        { code: "+253", country: "Djibouti" },
        { code: "+593", country: "Ecuador" },
        { code: "+20", country: "Egypt" },
        { code: "+503", country: "El Salvador" },
        { code: "+240", country: "Equatorial Guinea" },
        { code: "+291", country: "Eritrea" },
        { code: "+372", country: "Estonia" },
        { code: "+251", country: "Ethiopia" },
        { code: "+679", country: "Fiji" },
        { code: "+358", country: "Finland" },
        { code: "+33", country: "France" },
        { code: "+241", country: "Gabon" },
        { code: "+220", country: "Gambia" },
        { code: "+995", country: "Georgia" },
        { code: "+49", country: "Germany" },
        { code: "+233", country: "Ghana" },
        { code: "+30", country: "Greece" },
        { code: "+299", country: "Greenland" },
        { code: "+502", country: "Guatemala" },
        { code: "+224", country: "Guinea" },
        { code: "+245", country: "Guinea-Bissau" },
        { code: "+592", country: "Guyana" },
        { code: "+509", country: "Haiti" },
        { code: "+504", country: "Honduras" },
        { code: "+852", country: "Hong Kong" },
        { code: "+36", country: "Hungary" },
        { code: "+354", country: "Iceland" },
        { code: "+91", country: "India" },
        { code: "+62", country: "Indonesia" },
        { code: "+98", country: "Iran" },
        { code: "+964", country: "Iraq" },
        { code: "+353", country: "Ireland" },
        { code: "+972", country: "Israel" },
        { code: "+39", country: "Italy" },
        { code: "+225", country: "Ivory Coast" },
        { code: "+81", country: "Japan" },
        { code: "+962", country: "Jordan" },
        { code: "+7", country: "Kazakhstan" },
        { code: "+254", country: "Kenya" },
        { code: "+686", country: "Kiribati" },
        { code: "+965", country: "Kuwait" },
        { code: "+996", country: "Kyrgyzstan" },
        { code: "+856", country: "Laos" },
        { code: "+371", country: "Latvia" },
        { code: "+961", country: "Lebanon" },
        { code: "+266", country: "Lesotho" },
        { code: "+231", country: "Liberia" },
        { code: "+218", country: "Libya" },
        { code: "+423", country: "Liechtenstein" },
        { code: "+370", country: "Lithuania" },
        { code: "+352", country: "Luxembourg" },
        { code: "+853", country: "Macau" },
        { code: "+389", country: "North Macedonia" },
        { code: "+261", country: "Madagascar" },
        { code: "+265", country: "Malawi" },
        { code: "+60", country: "Malaysia" },
        { code: "+960", country: "Maldives" },
        { code: "+223", country: "Mali" },
        { code: "+356", country: "Malta" },
        { code: "+692", country: "Marshall Islands" },
        { code: "+222", country: "Mauritania" },
        { code: "+230", country: "Mauritius" },
        { code: "+52", country: "Mexico" },
        { code: "+691", country: "Micronesia" },
        { code: "+373", country: "Moldova" },
        { code: "+377", country: "Monaco" },
        { code: "+976", country: "Mongolia" },
        { code: "+382", country: "Montenegro" },
        { code: "+212", country: "Morocco" },
        { code: "+258", country: "Mozambique" },
        { code: "+95", country: "Myanmar" },
        { code: "+264", country: "Namibia" },
        { code: "+674", country: "Nauru" },
        { code: "+977", country: "Nepal" },
        { code: "+31", country: "Netherlands" },
        { code: "+64", country: "New Zealand" },
        { code: "+505", country: "Nicaragua" },
        { code: "+227", country: "Niger" },
        { code: "+234", country: "Nigeria" },
        { code: "+850", country: "North Korea" },
        { code: "+47", country: "Norway" },
        { code: "+968", country: "Oman" },
        { code: "+92", country: "Pakistan" },
        { code: "+680", country: "Palau" },
        { code: "+970", country: "Palestine" },
        { code: "+507", country: "Panama" },
        { code: "+675", country: "Papua New Guinea" },
        { code: "+595", country: "Paraguay" },
        { code: "+51", country: "Peru" },
        { code: "+63", country: "Philippines" },
        { code: "+48", country: "Poland" },
        { code: "+351", country: "Portugal" },
        { code: "+974", country: "Qatar" },
        { code: "+40", country: "Romania" },
        { code: "+7", country: "Russia" },
        { code: "+250", country: "Rwanda" },
        { code: "+685", country: "Samoa" },
        { code: "+378", country: "San Marino" },
        { code: "+239", country: "Sao Tome and Principe" },
        { code: "+966", country: "Saudi Arabia" },
        { code: "+221", country: "Senegal" },
        { code: "+381", country: "Serbia" },
        { code: "+248", country: "Seychelles" },
        { code: "+232", country: "Sierra Leone" },
        { code: "+65", country: "Singapore" },
        { code: "+421", country: "Slovakia" },
        { code: "+386", country: "Slovenia" },
        { code: "+677", country: "Solomon Islands" },
        { code: "+252", country: "Somalia" },
        { code: "+27", country: "South Africa" },
        { code: "+82", country: "South Korea" },
        { code: "+211", country: "South Sudan" },
        { code: "+34", country: "Spain" },
        { code: "+94", country: "Sri Lanka" },
        { code: "+249", country: "Sudan" },
        { code: "+597", country: "Suriname" },
        { code: "+268", country: "Eswatini" },
        { code: "+46", country: "Sweden" },
        { code: "+41", country: "Switzerland" },
        { code: "+963", country: "Syria" },
        { code: "+886", country: "Taiwan" },
        { code: "+992", country: "Tajikistan" },
        { code: "+255", country: "Tanzania" },
        { code: "+66", country: "Thailand" },
        { code: "+670", country: "Timor-Leste" },
        { code: "+228", country: "Togo" },
        { code: "+690", country: "Tokelau" },
        { code: "+676", country: "Tonga" },
        { code: "+216", country: "Tunisia" },
        { code: "+90", country: "Turkey" },
        { code: "+993", country: "Turkmenistan" },
        { code: "+688", country: "Tuvalu" },
        { code: "+256", country: "Uganda" },
        { code: "+380", country: "Ukraine" },
        { code: "+971", country: "United Arab Emirates" },
        { code: "+44", country: "United Kingdom" },
        { code: "+1", country: "United States" },
        { code: "+598", country: "Uruguay" },
        { code: "+998", country: "Uzbekistan" },
        { code: "+678", country: "Vanuatu" },
        { code: "+379", country: "Vatican City" },
        { code: "+58", country: "Venezuela" },
        { code: "+84", country: "Vietnam" },
        { code: "+681", country: "Wallis and Futuna" },
        { code: "+967", country: "Yemen" },
        { code: "+260", country: "Zambia" },
        { code: "+263", country: "Zimbabwe" }
    ];
}

// ================= POPULATE COUNTRY CODE SELECT =================
async function populateCountryCodes() {
    const countryCodeSelect = document.getElementById("countryCode");
    if (!countryCodeSelect) {
        console.error("Country code select element not found");
        return;
    }
    
    // Clear existing options
    countryCodeSelect.innerHTML = '<option value="" disabled selected>🌍 Select Country Code</option>';
    
    try {
        const countries = await fetchCountryCodes();
        
        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.code;
            option.textContent = `${country.country} (${country.code})`;
            countryCodeSelect.appendChild(option);
        });
        
        console.log(`✅ Loaded ${countries.length} countries`);
    } catch (error) {
        console.error('Error populating countries:', error);
        
        // Use fallback
        const fallbackCountries = getFallbackCountryCodes();
        fallbackCountries.forEach(country => {
            const option = document.createElement("option");
            option.value = country.code;
            option.textContent = `${country.country} (${country.code})`;
            countryCodeSelect.appendChild(option);
        });
    }
}

// Initialize country codes
document.addEventListener('DOMContentLoaded', populateCountryCodes);

// ================= FORM LOGIN =================
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const countryCodeSelect = document.getElementById("countryCode");
        const countryCode = countryCodeSelect?.value || "+1";
        const phoneNumber = document.getElementById("phone")?.value.trim();
        const fullPhoneNumber = countryCode + phoneNumber;

        if (!username || !email || !phoneNumber) {
            showMessage("Please fill all fields.", "error");
            return;
        }

        if (!countryCodeSelect?.value) {
            showMessage("Please select your country code.", "error");
            return;
        }

        // Username validation
        if (username.length < 3) {
            showMessage("Username must be at least 3 characters.", "error");
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showMessage("Username can only contain letters, numbers, and underscores.", "error");
            return;
        }

        // Email validation
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            showMessage("Enter a valid email address.", "error");
            return;
        }

        // Phone validation
        if (!/^\d{7,15}$/.test(phoneNumber)) {
            showMessage("Enter a valid phone number (7-15 digits).", "error");
            return;
        }

        try {
            showLoader(true);
            
            // Check if user exists
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // User exists - log them in
                const existingUser = querySnapshot.docs[0].data();
                localStorage.setItem("crunkUser", JSON.stringify({
                    username: existingUser.displayName || existingUser.username,
                    displayName: existingUser.displayName || existingUser.username,
                    email: existingUser.email,
                    phone: existingUser.phone,
                    photoURL: existingUser.photoURL || null,
                    userId: querySnapshot.docs[0].id
                }));
                
                showMessage("Login successful! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "home.html";
                }, 1000);
                return;
            }

            // Create new user
            const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

            const newUser = {
                uid: userId,
                username: username,
                displayName: username,
                email: email,
                phone: fullPhoneNumber,
                countryCode: countryCode,
                phoneNumber: phoneNumber,
                photoURL: null,
                loginMethod: "form",
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'online',
                userId: userId
            };

            try {
                await setDoc(doc(db, "users", userId), newUser);
                console.log("User saved to Firestore");
            } catch (firestoreError) {
                console.log("Firestore unavailable, using localStorage only");
            }

            localStorage.setItem("crunkUser", JSON.stringify({ 
                username: username,
                displayName: username,
                email: email, 
                phone: fullPhoneNumber,
                photoURL: null,
                userId: userId 
            }));

            showMessage("Registration successful! Redirecting...", "success");
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);

        } catch (err) {
            console.error("Login error:", err);
            showMessage("Error processing login. Please try again.", "error");
        } finally {
            showLoader(false);
        }
    });
}

// ================= GOOGLE LOGIN (SINGLE WORKING VERSION) =================
window.handleGoogleLogin = async function() {
    console.log("🚀 Google login started");
    try {
        showLoader(true);
        
        // Use popup sign-in (simpler and more reliable)
        console.log("📢 Opening popup...");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ Popup successful!", result.user.email);
        
        const user = result.user;
        
        // Save user to Firestore and localStorage
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData;
        
        if (userDoc.exists()) {
            console.log("👤 Existing user");
            const existingUser = userDoc.data();
            userData = {
                username: existingUser.displayName || user.displayName,
                displayName: existingUser.displayName || user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                userId: user.uid
            };
        } else {
            console.log("🆕 New user");
            const newUser = {
                uid: user.uid,
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                loginMethod: "google",
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'online',
                userId: user.uid
            };
            
            // Try Firestore but don't fail if it doesn't work
            try {
                await setDoc(userDocRef, newUser);
                console.log("✅ Saved to Firestore");
            } catch (e) {
                console.log("⚠️ Firestore error:", e.message);
            }
            
            userData = {
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                userId: user.uid
            };
        }
        
        // ALWAYS save to localStorage
        localStorage.setItem("crunkUser", JSON.stringify(userData));
        console.log("💾 Saved to localStorage:", userData);
        
        // Show success message
        showMessage("Login successful! Redirecting...", "success");
        
        // 🔴 CRITICAL: Force redirect to home page
        console.log("⏰ Redirecting to home.html NOW!");
        window.location.href = "home.html"; // Immediate redirect
        
    } catch (error) {
        console.error("❌ Google login error:", error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showMessage("Login cancelled. Please try again.", "info");
        } else if (error.code === 'auth/popup-blocked') {
            showMessage("Popup was blocked. Please allow popups.", "error");
        } else if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            showMessage(`Please add "${domain}" to Firebase authorized domains.`, "error");
            console.log(`❌ Add this domain to Firebase: ${domain}`);
        } else {
            showMessage("Login failed: " + error.message, "error");
        }
    } finally {
        showLoader(false);
    }
};

// ================= HANDLE REDIRECT RESULT =================
async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            console.log("🔄 Redirect result found");
            const user = result.user;
            
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            let userData;
            
            if (userDoc.exists()) {
                const existingUser = userDoc.data();
                userData = {
                    username: existingUser.displayName || user.displayName,
                    displayName: existingUser.displayName || user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    userId: user.uid
                };
            } else {
                userData = {
                    username: user.displayName,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    userId: user.uid
                };
            }
            
            localStorage.setItem("crunkUser", JSON.stringify(userData));
            window.location.href = "home.html";
        }
    } catch (error) {
        console.error("Redirect result error:", error);
    }
}

// Call this on page load
handleRedirectResult();

// ================= HELPER FUNCTIONS =================
function showMessage(text, type = "info") {
    if (!message) return;
    
    message.innerText = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    if (type === "success") {
        setTimeout(() => {
            message.innerText = "";
            message.className = "message";
            message.style.display = 'none';
        }, 3000);
    }
}

function showLoader(show) {
    const loader = document.getElementById("loader");
    if (loader) {
        loader.style.display = show ? "flex" : "none";
    }
}

// ================= VALIDATION =================
const usernameInput = document.getElementById("username");
if (usernameInput) {
    usernameInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("usernameError");
        if (errorSpan) {
            if (value.length < 3 && value.length > 0) {
                errorSpan.textContent = "Username too short";
                errorSpan.style.display = 'block';
            } else if (!/^[a-zA-Z0-9_]+$/.test(value) && value.length > 0) {
                errorSpan.textContent = "Only letters, numbers, _";
                errorSpan.style.display = 'block';
            } else {
                errorSpan.textContent = "";
                errorSpan.style.display = 'none';
            }
        }
    });
}

const emailInput = document.getElementById("email");
if (emailInput) {
    emailInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("emailError");
        if (errorSpan) {
            if (!/^\S+@\S+\.\S+$/.test(value) && value.length > 0) {
                errorSpan.textContent = "Invalid email format";
                errorSpan.style.display = 'block';
            } else {
                errorSpan.textContent = "";
                errorSpan.style.display = 'none';
            }
        }
    });
}

const phoneInput = document.getElementById("phone");
if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
        const value = e.target.value;
        const errorSpan = document.getElementById("phoneError");
        if (errorSpan) {
            if (!/^\d*$/.test(value) && value.length > 0) {
                errorSpan.textContent = "Only numbers allowed";
                errorSpan.style.display = 'block';
            } else if (value.length > 0 && (value.length < 7 || value.length > 15)) {
                errorSpan.textContent = "Phone must be 7-15 digits";
                errorSpan.style.display = 'block';
            } else {
                errorSpan.textContent = "";
                errorSpan.style.display = 'none';
            }
        }
    });
}

console.log("✅ Login system initialized with correct Firebase project");
