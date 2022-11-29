const emailField = document.getElementById('email');
const searchButton = document.getElementById('search');
const enrollmentParamsField = document.getElementById('enrollmentParams');
const verifyButton = document.getElementById('verify');
const mrzDataField = document.getElementById('mrzData');
const generateButton = document.getElementById('keygen');
const keyField = document.getElementById('key');
const decryptionParamsField = document.getElementById('decryptionParams');
const retrievedKeyField = document.getElementById('retrievedKey');
const qrCodes = document.getElementById("qrcode");
const decryptHandshakeButton = document.getElementById('decryptHandshake');
const keyserverUsingURL = document.getElementById('keyserverUsingURL');
keyserverUsingURL.innerText = KEYSERVER
const proxyserverUsingURL = document.getElementById('proxyserverUsingURL');
proxyserverUsingURL.innerText = PROXYSERVER
const keyserverEnrollButton = document.getElementById('keyserverEnrollButton');
keyserverEnrollButton.href = KEYSERVER


let handshake;
let rdeKey;

async function verify() {
    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)
    console.log("Enrollment data", enrollmentData)
    const mrzData = enrollmentData.getMRZData()
    console.log("MRZ data", mrzData)
    mrzDataField.innerText = JSON.stringify(mrzData)
    await enrollmentData.verify()
}

async function generateKey() {
    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)
    const keyGenerator = new RDEKeyGen.RDEKeyGenerator(enrollmentData)
    rdeKey = await keyGenerator.generateKey()
    keyField.innerText = RDEKeyGen.utils.toHexString(rdeKey.encryptionKey)
    decryptionParamsField.innerText = JSON.stringify(rdeKey.decryptionParameters)
}

async function search() {
    const email = emailField.value
    const response = await fetch(KEYSERVER + "/api/search/?email=" + email);
    const data = await response.json();
    if (data == null)
        enrollmentParamsField.innerText = "No enrollment parameters found for this email address"
    else
        enrollmentParamsField.innerText = JSON.stringify(data[data.length-1]["enrollment_parameters"])
}

async function startHandshake(socket, url) {
    console.log("Starting handshake")
    handshake = new RDEDecryption.RDEDecryptionHandshakeProtocol(window.crypto, socket, rdeKey.decryptionParameters);
    const qrCode = new QRCode(document.getElementById("qrcode"), {
        text: url,
    });
    await handshake.performHandshake()
}

async function decryptHandshake() {
    const socketResponse = await fetch(PROXYSERVER + "/open");
    const token = await socketResponse.text();
    const socketUrl = PROXYSERVERWS + "/socket/" + token;
    console.log("Using socket on", socketUrl)
    const socket = await new WebSocket(socketUrl);
    socket.onopen = function (event) {
        startHandshake(socket, socketUrl)
    }
    socket.onmessage = function (event) {
        qrCodes.innerHTML = ""
    }
    socket.onclose = function (event) {
        console.log("Connection closed", event)
        const key = handshake.getRetrievedKey()
        retrievedKeyField.innerText = RDEDecryption.utils.toHexString(key)
        qrCodes.innerHTML = ""
    }
    socket.onerror = function (event) {
        console.log("Connection error", event)
        qrCodes.innerHTML = ""
    }
}

searchButton.addEventListener('click', search);
verifyButton.addEventListener('click', verify);
generateButton.addEventListener('click', generateKey);
decryptHandshakeButton.addEventListener('click', decryptHandshake);

