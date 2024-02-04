async function createHash(inputData) {
    const textEncoder = new TextEncoder();
    const dataBytes = textEncoder.encode(inputData);
    const hashBuffer = await crypto.subtle.digest('SHA-384', dataBytes);
    return Array.from(new Uint8Array(hashBuffer));
}

document.getElementById('copyBtn').addEventListener('click',() => {
    const passwordOutput = document.getElementById('passwordOutput').value;
    if (passwordOutput) {
        navigator.clipboard.writeText(passwordOutput);
        showPopup('Veilig wachtwoord gekopieerd!', 2000);
    }
});

function formatHash(passwordType, hash) {
    const nums = '0123456789';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specialChars = '@!?,.;:\'"{}[]()&';
    const sum = hash.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const avg = Math.round(sum / hash.length);

    if (passwordType === 'option1' || passwordType === 'option2') {
        let characters = nums + lowerCase + upperCase;
        if (passwordType === 'option1')
            characters += specialChars;
        let result = '';
        result += nums[(sum+avg) % nums.length];
        result += lowerCase[sum % lowerCase.length];
        result += upperCase[avg % upperCase.length];
        result += hash.map(byte => characters[byte % characters.length]).join('');
        return result.substring(0, 20);
    } else if (passwordType === 'option3' || passwordType === 'option4') {
        const length = passwordType === 'option3' ? 6 : 4;
        return hash.map(byte => nums[byte % nums.length]).join('').substring(0, length);
    } else {
        return "";
    }

}

document.getElementById('userInfo').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Access form elements by their name attributes using event.target
    const firstName = event.target.elements.firstName.value;
    const pubKey = event.target.elements.pubKey.value;
    const passwordTypeDropdown = event.target.elements.passwordType.value;
    const password = event.target.elements.password.value;
    const repeatPassword = event.target.elements.repeatPassword.value;
    const selectedApp = document.querySelector('.selected');

    if (repeatPassword !== "" && password !== repeatPassword) {
        showPopup('Wachtwoorden komen niet overeen!', 2000);
        return;
    }
    if (selectedApp === null) {
        showPopup('Selecteer een app!', 2000);
        return;
    }

    const appName = selectedApp.querySelector('.app-name').textContent;

    // Calculate the hash based on the form inputs
    const hashInput = `${firstName}${pubKey}${passwordTypeDropdown}${password}${appName}`;
    const hash = await createHash(hashInput); // Assuming you have the createHash function defined

    // Display the hash in the "passwordOutput" input field
    const passwordOutput = document.getElementById('passwordOutput');
    passwordOutput.value = formatHash(passwordTypeDropdown, hash);
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