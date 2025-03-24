const checkConnectionBtn = document.getElementById("checkConnectionBtn");
const cameraIpInput = document.getElementById("cameraIp");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const statusBubble = document.createElement("div");
statusBubble.id = "statusBubble";
statusBubble.style.width = "25px";
statusBubble.style.height = "25px";
statusBubble.style.borderRadius = "50%";
statusBubble.style.position = "absolute";
statusBubble.style.right = "15px";
statusBubble.style.backgroundColor = "red";


const container = cameraIpInput.parentElement;
container.appendChild(statusBubble);

// Then replace your current sha256 function with:
// Remove this line completely
// const crypto = require('crypto');

// Add environment detection
// Replace these Node.js crypto functions
async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  function generateNonce(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }

// Update your functions to use cryptoModule instead of crypt
//asd
// Also update digestAuthHeader (it's now synchronous):
async function digestAuthHeader(method, uri, username, password, nonce) {
    const realm = 'ignored-for-authn-tkt';
    const qop = 'auth';
    const nc = '00000001';
    const cnonce = generateNonce();
  
    const ha1 = await sha256(`${username}:${realm}:${password}`);
    const ha2 = await sha256(`${method}${uri}`);
    const response = await sha256(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
  
    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", qop=${qop}, response="${response}", algorithum="SHA-256", nc=${nc}, cnonce="${cnonce}"`;
  }
function extractNonce(wwwAuthHeader) {
    const regex = /nonce="([^"]+)"/;
    const match = wwwAuthHeader.match(regex);
    return match ? match[1] : null;
}


async function checkCameraConnection(ip, username, password) {
    const url = `http://${ip}/cgi-bin/param.cgi?get_network_conf`;

    try {
        let response = await fetch(url, { method: "GET" });

        if (response.status === 401) {
            const wwwAuthHeader = response.headers.get('WWW-Authenticate');
            const nonce = extractNonce(wwwAuthHeader);
            if (!nonce) {
                throw new Error("Failed to extract nonce from header");
            }
            const authHeader = await digestAuthHeader("GET", "/cgi-bin/param.cgi?get_network_conf", username, password, nonce);

            response = await fetch(url, { headers: { 'Authorization': authHeader } });
        }

        return response.ok;
    } catch (error) {
        console.error("Error checking connection:", error);
        return false;
    }
}


let debounceTimer;


cameraIpInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        const ip = cameraIpInput.value.trim();
        if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
            statusBubble.style.backgroundColor = "red";
            return;
        }
        statusBubble.style.backgroundColor = "yellow";
        const isConnected = await checkCameraConnection(
            ip,
            usernameInput.value,
            passwordInput.value
        );
        statusBubble.style.backgroundColor = isConnected ? "green" : "red";
    }, 500);
});

checkConnectionBtn.addEventListener("click", async () => {
    const ip = cameraIpInput.value.trim();
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        statusBubble.style.backgroundColor = "red";
        return;
    }
    statusBubble.style.backgroundColor = "yellow";
    const isConnected = await checkCameraConnection(
        ip,
        usernameInput.value,
        passwordInput.value
    );
    statusBubble.style.backgroundColor = isConnected ? "green" : "red";
});

setTimeout(async () => {
    const ip = cameraIpInput.value.trim();
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        statusBubble.style.backgroundColor = "red";
        return;
    }
    statusBubble.style.backgroundColor = "yellow";
    const isConnected = await checkCameraConnection(
        ip,
        usernameInput.value,
        passwordInput.value
    );
    statusBubble.style.backgroundColor = isConnected ? "green" : "red";
}, 750);