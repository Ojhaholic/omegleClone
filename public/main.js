const socket = io(); // Connect to the server
let localStream;
let peerConnection;
let remoteVideo = document.getElementById('remoteVideo');
let localVideo = document.getElementById('localVideo');
let startChatButton = document.getElementById('startChat');

// WebRTC configuration
const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
};

// Start Chat Button Logic
startChatButton.addEventListener('click', async () => {
    await startVideo();
    socket.emit('offer', { target: remotePeerId, offer: 'offerData' });
});

// Get user media (video/audio)
async function startVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error('Error accessing media devices:', err);
    }
}

// Handle incoming match from the server
socket.on('match', (remotePeerId) => {
    // Set up peer-to-peer connection
    setupPeerConnection();
    // Create offer to send
    createOffer(remotePeerId);
});

// Set up the peer connection
function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to the connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { target: remotePeerId, candidate: event.candidate });
        }
    };
}

// Create offer to the remote peer
async function createOffer(remotePeerId) {
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { target: remotePeerId, offer: offer });
    } catch (err) {
        console.error('Error creating offer:', err);
    }
}

// Handle the remote offer and respond with an answer
socket.on('offer', async (offer) => {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { target: remotePeerId, answer: answer });
    } catch (err) {
        console.error('Error handling offer:', err);
    }
});

// Handle the answer from the remote peer
socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidates
socket.on('ice-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
