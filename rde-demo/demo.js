const emailField = document.getElementById('email');
const searchButton = document.getElementById('search');
const documentSelectField = document.getElementById('documentSelect');
const enrollmentParamsField = document.getElementById('enrollmentParams');
const verifyButton = document.getElementById('verify');
const verificationResultPlaceholder = document.getElementById('verificationResultPlaceholder');
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

let searchResults = []
let handshake;
let rdeKey;

async function search() {
    const email = emailField.value
    const response = await fetch(KEYSERVER + "/api/search/?email=" + email);
    const data = await response.json();
    searchResults = data;
    documentSelectField.innerHTML = ""

    if (data == null || data.length === 0) {
        documentSelectField.innerHTML = "<option>No documents found</option>"
        enrollmentParamsField.innerText = ""
    }
    else {
        documentSelectField.innerHTML = ""
        for (let i = 0; i < data.length; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.text = data[i]["enrollment_parameters"]["documentName"];
            documentSelectField.appendChild(option);
        }

        documentSelectField.value = data.length-1
        enrollmentParamsField.innerText = JSON.stringify(data[data.length-1]["enrollment_parameters"])
    }
    await choose()
}
async function choose() {
    const index = documentSelectField.value
    enrollmentParamsField.innerText = JSON.stringify(searchResults[index]["enrollment_parameters"])
    await verify()
}

const verificationAlert = (message, type) => {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type}" role="alert">`,
        `   <div>${message}</div>`,
        '</div>'
    ].join('')
    verificationResultPlaceholder.innerHTML = ''
    verificationResultPlaceholder.append(wrapper)
}

function sixDigitDateToDate(dateString) {
    const date = new Date(dateString.substring(0, 2), dateString.substring(2, 4) - 1, dateString.substring(4, 6))
    if (date.getFullYear() < 1970) {
        date.setFullYear(date.getFullYear() + 100);
    }
    return date.toDateString()
}

async function verify() {
    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)
    console.log("Enrollment data", enrollmentData)

    if (enrollmentData.securityData == null) {
        verificationAlert('Enrollment data cannot be verified', 'secondary')
        return
    }

    const verifyResult = await enrollmentData.verify()

    if (verifyResult) {
        const certificate = enrollmentData.docSigningCertificate
        console.log("Certificate", certificate)
        const issuer = certificate.issuer
        const validFrom = certificate.notBefore.toDateString()
        const validTo = certificate.notAfter.toDateString()

        const certificateMessage = `Issued by ${issuer}, valid from ${validFrom} to ${validTo}`

        if (enrollmentData.mrzData != null) {
            const mrzData = enrollmentData.parseMRZData()
            console.log("MRZ data", mrzData)

            const documentCode = mrzData.fields.documentCode
            const documentNumber = mrzData.fields.documentNumber
            const expirationDate = sixDigitDateToDate(mrzData.fields.expirationDate)

            const firstName = mrzData.fields.firstName
            const lastName = mrzData.fields.lastName
            const dateOfBirth = sixDigitDateToDate(mrzData.fields.birthDate)
            const sex = mrzData.fields.sex
            const nationality = mrzData.fields.nationality
            const issuingState = mrzData.fields.issuingState

            const mrzDataMessage = `${firstName} ${lastName} (${sex}), born ${dateOfBirth}. \nNationality: ${nationality}. \nIssuing state: ${issuingState}. \nDocument: ${documentNumber} (${documentCode}). \nExpires: ${expirationDate}`
            verificationAlert('Enrollment data verified. Belongs to: ' + mrzDataMessage + '. ' + certificateMessage + ".", 'success')
        }
        else {
            verificationAlert('Enrollment data verified. ' + certificateMessage, 'info')
        }
    } else {
        verificationAlert('Enrollment data is invalid', 'danger')
    }
}

async function generateKey() {
    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)
    const keyGenerator = new RDEKeyGen.RDEKeyGenerator(enrollmentData)
    rdeKey = await keyGenerator.generateKey()
    keyField.innerText = RDEKeyGen.utils.toHexString(rdeKey.encryptionKey)
    decryptionParamsField.innerText = JSON.stringify(rdeKey.decryptionParameters)
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
documentSelectField.addEventListener('change', choose);
enrollmentParamsField.addEventListener('change', verify);
generateButton.addEventListener('click', generateKey);
decryptHandshakeButton.addEventListener('click', decryptHandshake);

