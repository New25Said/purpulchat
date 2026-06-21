let user = localStorage.getItem("user");

let lastTime = 0;

/* ================= INIT ================= */
window.onload = () => {
    if (user) {
        document.getElementById("login").classList.add("hidden");
        document.getElementById("chat").classList.remove("hidden");
        startChat();
    }
};

/* ================= REGISTER ================= */
async function register() {
    const u = document.getElementById("user").value;
    const nickname = document.getElementById("nickname").value;
    const file = document.getElementById("photo").files[0];

    let photo = "";

    if (file) {
        photo = await toBase64(file);
    }

    await fetch("/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user: u,
            nickname,
            photo
        })
    });

    localStorage.setItem("user", u);
    user = u;

    document.getElementById("login").classList.add("hidden");
    document.getElementById("chat").classList.remove("hidden");

    startChat();
}

/* ================= CHAT ================= */
function startChat() {
    loadMessages();
    setInterval(loadMessages, 1500);
}

async function loadMessages() {
    const res = await fetch("/messages");
    const msgs = await res.json();

    const box = document.getElementById("messages");

    for (let m of msgs) {
        if (m.timestamp <= lastTime) continue;

        lastTime = m.timestamp;

        const ures = await fetch(`/user/${m.user}`);
        const u = await ures.json();

        const div = document.createElement("div");
        div.className = "msg";

        div.innerHTML = `
            <b>@${m.user}</b><br>
            ${u?.nickname || m.user}: ${m.text}
        `;

        box.appendChild(div);
    }

    box.scrollTop = box.scrollHeight;
}

/* ================= SEND ================= */
async function send() {
    const text = document.getElementById("msg").value;

    await fetch("/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, text })
    });

    document.getElementById("msg").value = "";
}

/* ================= BASE64 ================= */
function toBase64(file) {
    return new Promise(resolve => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(file);
    });
}
