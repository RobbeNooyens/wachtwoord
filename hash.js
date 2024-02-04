async function createHash(inputData) {
    const textEncoder = new TextEncoder();
    const dataBytes = textEncoder.encode(inputData);
    const hashBuffer = await crypto.subtle.digest('SHA-384', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

document.getElementById('copyBtn').addEventListener('click',() => {
    const passwordOutput = document.getElementById('passwordOutput').value;
    if (passwordOutput) {
        navigator.clipboard.writeText(passwordOutput);
        showPopup('Sterk wachtwoord gekopieerd!', 2000);
    }
});

document.getElementById('userInfo').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Access form elements by their name attributes using event.target
    const firstName = event.target.elements.firstName.value;
    const pubKey = event.target.elements.pubKey.value;
    const passwordTypeDropdown = event.target.elements.passwordType.value;

    // Calculate the hash based on the form inputs
    const hashInput = `${firstName}${pubKey}${passwordTypeDropdown}`;
    const hash = await createHash(hashInput); // Assuming you have the createHash function defined

    // Display the hash in the "passwordOutput" input field
    const passwordOutput = document.getElementById('passwordOutput');
    passwordOutput.value = hash;
});


document.getElementById('clearBtn').addEventListener('click',  function () {
    navigator.clipboard.writeText("");
    showPopup('Klembord leeggemaakt!', 2000);
});


const passwordInput = document.getElementById('passwordOutput');
const passwordToggle = document.getElementById('password-toggle');

// Toggle password visibility when the toggle span is clicked
passwordToggle.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.innerHTML = '<i class="bi bi-eye-slash"></i>'; // Change to hide icon
    } else {
        passwordInput.type = 'password';
        passwordToggle.innerHTML = '<i class="bi bi-eye"></i>'; // Change to show icon
    }
});