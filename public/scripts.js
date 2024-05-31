let localStream;
let remoteStream;
let peerConnection;
let hiddenMessage = '';
let hiddenMessageIndex = 0;
const MESSAGE_INTERVAL = 4; // Number of bytes used per frame for encoding

const servers = {
    iceServers: [
        {
            urls: "stun:stun.stunprotocol.org"
        }
    ]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const hiddenMessageInput = document.getElementById("hiddenMessageInput");
const startButton = document.getElementById("startButton");
const decodedMessageDisplay = document.getElementById("decodedMessage");

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(error => console.error('Error accessing media devices.', error));

startButton.addEventListener('click', () => {
    hiddenMessage = hiddenMessageInput.value + '\0'; // Add null character to denote the end of the message
    hiddenMessageIndex = 0; // Reset index
    if (hiddenMessage) {
        startSteganography();
    } else {
        alert('Please enter a message to hide.');
    }
});

function startSteganography() {
    peerConnection = new RTCPeerConnection(servers);

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            // send the candidate to the remote peer
        }
    };

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Assume signaling setup is handled elsewhere

    // Encode message in video stream
    setInterval(() => {
        encodeMessageInStream();
    }, 1000 / 30); // 30 FPS

    // Decode message from video stream
    setInterval(() => {
        if (remoteStream) {
            decodeMessageFromStream();
        }
    }, 1000 / 30); // 30 FPS
}

function encodeMessageInStream() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = localVideo;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    // Simple LSB steganography encoding
    if (hiddenMessageIndex < hiddenMessage.length) {
        for (let i = 0; i < data.length && hiddenMessageIndex < hiddenMessage.length; i += 4 * MESSAGE_INTERVAL) {
            const charCode = hiddenMessage.charCodeAt(hiddenMessageIndex++);
            data[i] = (data[i] & 0xFE) | (charCode & 1);
            data[i + 1] = (data[i + 1] & 0xFE) | ((charCode >> 1) & 1);
            data[i + 2] = (data[i + 2] & 0xFE) | ((charCode >> 2) & 1);
            data[i + 3] = (data[i + 3] & 0xFE) | ((charCode >> 3) & 1);
        }
    }

    context.putImageData(frame, 0, 0);

    const newStream = canvas.captureStream();
    const newTracks = newStream.getVideoTracks();

    peerConnection.getSenders().forEach(sender => {
        if (sender.track.kind === 'video') {
            sender.replaceTrack(newTracks[0]);
        }
    });
}

function decodeMessageFromStream() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = remoteVideo;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    // Simple LSB steganography decoding
    let message = '';
    for (let i = 0; i < data.length; i += 4 * MESSAGE_INTERVAL) {
        const charCode = (data[i] & 1) |
                         ((data[i + 1] & 1) << 1) |
                         ((data[i + 2] & 1) << 2) |
                         ((data[i + 3] & 1) << 3);

        message += String.fromCharCode(charCode);
        if (charCode === 0) { // Null character to denote the end of the message
            break;
        }
    }

    if (message) {
        decodedMessageDisplay.textContent += message;
    }
}
