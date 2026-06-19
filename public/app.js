const socket = io();

let currentUser = null;

function showRegister() {
    document.getElementById("registerBox").style.display = "block";
    document.getElementById("loginBox").style.display = "none";
}

function showLogin() {
    document.getElementById("registerBox").style.display = "none";
    document.getElementById("loginBox").style.display = "block";
}

function register() {

    const nickname =
        document.getElementById("regNickname").value.trim();

    const user =
        document.getElementById("regUser").value.trim();

    const password =
        document.getElementById("regPassword").value;

    const file =
        document.getElementById("regPhoto").files[0];

    if (!nickname || !user || !password) {
        alert("Completa todos los campos");
        return;
    }

    const finishRegister = (photo) => {

        socket.emit(
            "register",
            {
                nickname,
                user,
                password,
                photo
            },
            (response) => {

                alert(response.message);

                if (response.success) {
                    showLogin();
                }

            }
        );

    };

    if (!file) {
        finishRegister("");
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        finishRegister(reader.result);
    };

    reader.readAsDataURL(file);

}

function login() {

    const user =
        document.getElementById("loginUser").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    socket.emit(
        "login",
        {
            user,
            password
        },
        (response) => {

            if (!response.success) {
                alert(response.message);
                return;
            }

            currentUser = response.profile;

            document.getElementById(
                "authScreen"
            ).style.display = "none";

            document.getElementById(
                "chatScreen"
            ).style.display = "flex";

            document.getElementById(
                "profileNickname"
            ).textContent =
                currentUser.nickname;

            document.getElementById(
                "profileUser"
            ).textContent =
                currentUser.user;

            if (currentUser.photo) {

                document.getElementById(
                    "profilePhoto"
                ).src =
                    currentUser.photo;

            }

        }
    );

}

function sendMessage() {

    const input =
        document.getElementById(
            "messageInput"
        );

    const text =
        input.value.trim();

    if (!text) return;

    socket.emit(
        "sendMessage",
        text
    );

    input.value = "";

}

function addMessage(msg) {

    const messages =
        document.getElementById(
            "messages"
        );

    const div =
        document.createElement("div");

    div.className = "message";

    div.innerHTML = `
        <img
            class="messagePhoto"
            src="${msg.photo || ''}"
        >

        <div class="messageContent">

            <div class="messageHeader">

                <span class="messageNickname">
                    ${escapeHtml(msg.nickname)}
                </span>

                <span class="messageUser">
                    ${escapeHtml(msg.user)}
                </span>

            </div>

            <div class="messageText">
                ${escapeHtml(msg.text)}
            </div>

        </div>
    `;

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;

}

socket.on(
    "chatHistory",
    (messages) => {

        document.getElementById(
            "messages"
        ).innerHTML = "";

        messages.forEach(addMessage);

    }
);

socket.on(
    "message",
    addMessage
);

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key === "Enter" &&
            document.getElementById(
                "chatScreen"
            ).style.display === "flex"
        ) {
            sendMessage();
        }

    }
);

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
