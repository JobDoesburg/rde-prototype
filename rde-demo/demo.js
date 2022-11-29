const emailField = document.getElementById('email');
const searchButton = document.getElementById('search');
const documentSelectField = document.getElementById('documentSelect');
const enrollmentParamsField = document.getElementById('enrollmentParams');
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

let certificateMasterList = [
    new RDEKeyGen.X509Certificate(
        "-----BEGIN CERTIFICATE-----\n" +
        "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\n" +
        "-----END CERTIFICATE-----\n"),
    new RDEKeyGen.X509Certificate(
    "-----BEGIN CERTIFICATE-----\n" +
        "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\n" +
        "-----END CERTIFICATE-----\n"),
    new RDEKeyGen.X509Certificate(
    "-----BEGIN CERTIFICATE-----\n" +
        "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\n" +
        "WOH7wwN5JOFoV8o=\n" +
        "-----END CERTIFICATE-----\n")
]

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

    const verifyResult = await enrollmentData.verify(certificateMasterList)

    if (verifyResult) {
        const certificate = enrollmentData.docSigningCertificate
        console.log("Certificate", certificate)
        const issuer = certificate.issuer
        const validFrom = certificate.notBefore.toDateString()
        const validTo = certificate.notAfter.toDateString()

        const certificateMessage = `Issued by <strong>${issuer}</strong>, valid from <strong>${validFrom}</strong> to <strong>${validTo}</strong>`

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

            const mrzDataMessage = `<strong>${firstName} ${lastName}</strong> (<strong>${sex}</strong>), born <strong>${dateOfBirth}</strong>. \nNationality: <strong>${nationality}</strong>. \nIssuing state: <strong>${issuingState}</strong>. \nDocument: <strong>${documentNumber}</strong> (<strong>${documentCode}</strong>). \nExpires: <strong>${expirationDate}</strong>`
            verificationAlert('Enrollment data verified. Belongs to: ' + mrzDataMessage + '. ' + certificateMessage + ".", 'success')
        }
        else {
            verificationAlert('Enrollment data verified. ' + certificateMessage + ". Document holder is not included.", 'info')
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

