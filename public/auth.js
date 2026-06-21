function toBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

async function createAccount() {
    const user = document.getElementById("user").value;
    const nickname = document.getElementById("nickname").value;
    const file = document.getElementById("photo").files[0];

    let photo = "";

    if (file) {
        photo = await toBase64(file);
    }

    const res = await fetch("/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, nickname, photo })
    });

    const data = await res.json();

    if (data.success) {
        localStorage.setItem("user", user);
        window.location.href = "/chat.html";
    } else {
        document.getElementById("status").textContent = data.error;
    }
}
