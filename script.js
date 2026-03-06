
function checkPassword() {
    let password = document.getElementById("password").value;
    let result = document.getElementById("result");

    if (password.length < 6) {
        result.innerHTML = "Weak password bro";
    } else if (password.length < 10) {
        result.innerHTML = "Medium password bro";
    } else {
        result.innerHTML = "Strong password bro";
    }
}