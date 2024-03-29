const KEYSERVER_URL = "${KEYSERVER_URL}";
const PROXYSERVER_URL = "${PROXYSERVER_URL}";
const PROXYSERVER_WS_URL = "${PROXYSERVER_WS_URL}";
let CERTIFICATE_JSON_URL = "${CERTIFICATE_JSON_URL}"
if (CERTIFICATE_JSON_URL === "") {
    CERTIFICATE_JSON_URL = "/certificates.json"
}

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
const faceImageCanvas = document.getElementById('faceImageCanvas');

const keyserverUsingURL = document.getElementById('keyserverUsingURL');
keyserverUsingURL.innerText = KEYSERVER_URL;
const proxyserverUsingURL = document.getElementById('proxyserverUsingURL');
proxyserverUsingURL.innerText = PROXYSERVER_URL;
const keyserverEnrollButton = document.getElementById('keyserverEnrollButton');
keyserverEnrollButton.href = KEYSERVER_URL;

let searchResults = [];
let handshake;
let rdeKey;

async function parseCertificates(url) {
    const certData = await fetch(url).then(response => response.json());
    return certData.map(cert => {
        return new RDEKeyGen.X509Certificate(cert)
    })
}

async function search() {
    const email = emailField.value
    const response = await fetch(KEYSERVER_URL + "/api/search/?email=" + email);
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

        documentSelectField.value = 0
        enrollmentParamsField.innerText = JSON.stringify(data[0]["enrollment_parameters"])
    }
    await choose()
}
async function choose() {
    const index = documentSelectField.value
    enrollmentParamsField.innerText = JSON.stringify(searchResults[index]["enrollment_parameters"])
    await verify()
}

const verificationAlert = (message, type) => {
    verificationResultPlaceholder.innerHTML = ''
    const alert = document.createElement('div')
    alert.innerHTML = [
        `<div class="alert alert-${type}" role="alert">`,
        `   <div>${message}</div>`,
        '</div>'
    ].join('')
    verificationResultPlaceholder.append(alert)
}

function sixDigitDateToDate(dateString) {
    const date = new Date(dateString.substring(0, 2), dateString.substring(2, 4) - 1, dateString.substring(4, 6))
    if (date.getFullYear() < 1970) {
        date.setFullYear(date.getFullYear() + 100);
    }
    return date.toDateString()
}

async function verify() {
    faceImageCanvas.style.display = "none";
    verificationResultPlaceholder.innerHTML = ''

    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)

    console.log("Enrollment data", enrollmentData)

    if (enrollmentData.securityData == null) {
        verificationAlert('Enrollment data cannot be verified', 'secondary')
        return
    }

    const trustedCertificates = await parseCertificates(CERTIFICATE_JSON_URL) // TODO also check CRL's

    const verifyResult = await enrollmentData.verify(trustedCertificates)

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

    if (enrollmentData.faceImageData) {
        const faceImageData = enrollmentData.parseFaceImage();
        displayFaceImage(faceImageData, "jp2");
    }
}

function displayFaceImage(imageData, imageType) {
    const rgbImage = openjpeg(imageData, imageType)
    faceImageCanvas.width = rgbImage.width;
    faceImageCanvas.height = rgbImage.height;
    const pixelsPerChannel = rgbImage.width * rgbImage.height;
    const context = faceImageCanvas.getContext('2d');
    const rgbaImage = context.createImageData(rgbImage.width, rgbImage.height);

    let i = 0, j = 0;
    while (i < rgbaImage.data.length && j < pixelsPerChannel) {
        rgbaImage.data[i] = rgbImage.data[j]; // R
        rgbaImage.data[i+1] = rgbImage.data[j + pixelsPerChannel]; // G
        rgbaImage.data[i+2] = rgbImage.data[j + 2*pixelsPerChannel]; // B
        rgbaImage.data[i+3] = 255; // A

        // Next pixel
        i += 4;
        j += 1;
    }
    context.putImageData(rgbaImage, 0, 0);
    faceImageCanvas.style.display = "block";
}

async function generateKey() {
    const enrollmentData = RDEKeyGen.RDEEnrollmentParameters.fromJson(enrollmentParamsField.value)
    const keyGenerator = new RDEKeyGen.RDEKeyGenerator(enrollmentData)
    rdeKey = await keyGenerator.generateKey()
    keyField.innerText = RDEKeyGen.utils.toHexString(rdeKey.secretKey)
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
    const socketResponse = await fetch(PROXYSERVER_URL + "/open");
    const token = await socketResponse.text();
    const socketUrl = PROXYSERVER_WS_URL + "/socket/" + token;
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

