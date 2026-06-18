const socket = io();

let myProfile = null;

function register(){

    const nickname =
        document.getElementById("nickname").value;

    const user =
        document.getElementById("user").value;

    const file =
        document.getElementById("photo").files[0];

    const reader = new FileReader();

    reader.onload = () => {

        socket.emit(
            "register",
            {
                nickname,
                user,
                photo: reader.result
            },
            (response) => {

                alert(response.message || "Cuenta creada");

            }
        );

    };

    if(file){
        reader.readAsDataURL(file);
    }
}

function login(){

    const user =
        document.getElementById("loginUser").value;

    socket.emit("login", user, response => {

        if(!response.success){
            alert("No existe");
            return;
        }

        myProfile = response.profile;

        document.getElementById("auth").style.display = "none";
        document.getElementById("chat").style.display = "block";

    });

}

function sendMessage(){

    const text =
        document.getElementById("messageInput").value;

    socket.emit("message", text);

    document.getElementById("messageInput").value = "";
}

socket.on("chatHistory", msgs => {

    msgs.forEach(addMessage);

});

socket.on("message", addMessage);

function addMessage(msg){

    const div = document.createElement("div");

    div.className = "message";

    div.innerHTML = `
        <img class="avatar" src="${msg.photo}">
        <div>
            <b>${msg.nickname}</b>
            (${msg.user})
            <br>
            ${msg.text}
        </div>
    `;

    document
        .getElementById("messages")
        .appendChild(div);
}
