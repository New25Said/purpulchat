const user = localStorage.getItem("user");

async function loadMessages() {
    const res = await fetch("/messages");
    const msgs = await res.json();

    const container = document.getElementById("messages");
    container.innerHTML = "";

    for (let m of msgs) {

        const userRes = await fetch(`/user/${m.user}`);
        const u = await userRes.json();

        const div = document.createElement("div");
        div.className = "msg";

        div.innerHTML = `
            <img src="${u?.photo || ''}" />
            <div>
                <b>@${m.user}</b><br>
                ${u?.nickname || m.user}: ${m.text}
            </div>
        `;

        container.appendChild(div);
    }

    container.scrollTop = container.scrollHeight;
}

async function send() {
    const text = document.getElementById("msg").value;

    await fetch("/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, text })
    });

    document.getElementById("msg").value = "";
    loadMessages();
}

setInterval(loadMessages, 2000);
loadMessages();
