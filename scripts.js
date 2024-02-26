// Define the applications array to store the list of app names
let applications = [];

function loadApplicationsFromLocalStorage() {
  applications = [];
  const storedApplications = localStorage.getItem('applications');
  if (storedApplications) {
    applications = JSON.parse(storedApplications);
  } else {
    applications = ['GOOGLE', 'FACEBOOK', 'MICROSOFT', 'APPLE'];
    localStorage.setItem('applications', JSON.stringify(applications));
  }
  // Create app icons for each application in the list
  applications.forEach((appName) => createApplicationIcon(appName));
}

// Call the function to load applications when the page loads
window.addEventListener('load', loadApplicationsFromLocalStorage);

// Define an HTML template for the application icon
const appIconTemplate = document.createElement('template');
appIconTemplate.innerHTML = `
  <div class="p-2">
    <div class="app-icon btn-primary">
      <span class="app-name"></span>
      <img class="app-logo" src="" alt="App Logo">
    </div>
  </div>
`;

// Event listener to detect "Delete" key press
document.addEventListener('keydown', function(event) {
  if (event.key === 'Delete' || event.key === '⌫' || event.keyCode === 8) {
    if (event.target.tagName.toLowerCase() === 'input')
      return;
    // Check if there is a selected app icon (you can add a class for selection)
    const selectedAppIcon = document.querySelector('.selected');
    if (selectedAppIcon) {
      // Remove the selected app icon
      removeApplicationIcon(selectedAppIcon);
    }
  }
});


// Function to create a new application icon using the template
function createApplicationIcon(appName) {
  const appIconsDiv = document.getElementById('applicationIcons');
  const addIconDiv = document.getElementById('addNewIcon').parentElement;

  const iconClone = document.importNode(appIconTemplate.content, true);
  const appIcon = iconClone.querySelector('.app-icon');
  const appLogo = appIcon.querySelector('img');
  const appNameSpan = appIcon.querySelector('span');

  // Set the app name and logo
  appNameSpan.textContent = appName;
  // Path to the logo
  const appLogoPath = `logos/${appName.toLowerCase().replace(" ", "_")}.png`;
  const defaultLogoPath = 'logos/default.png';

  appLogo.onerror = () => appLogo.src = defaultLogoPath;
  appLogo.onload = () => appLogo.src = appLogoPath;
  appLogo.src = appLogoPath;

  // Add a click event listener to handle application selection
  appIcon.addEventListener('click', function () {
    handleApplicationSelection(appIcon);
  });

  appIconsDiv.insertBefore(iconClone, addIconDiv); // Insert before the "+" icon
}

function createNewApplicationIcon(appName) {
  appName = appName.toUpperCase().trim();
  // Remove all non-alphanumeric characters from the app name
  appName = appName.replace(/[^a-zA-Z0-9\s]/g, '');
  if (applications.indexOf(appName) !== -1) {
    showPopup('Deze app bestaat al!', 3000);
    return;
  }
  createApplicationIcon(appName);
  applications.push(appName);
  localStorage.setItem('applications', JSON.stringify(applications));
}

// Event listener for adding a new icon
document.getElementById('addNewIcon').addEventListener('click', function () {
  let newAppName = prompt('Geef de naam van de applicatie in: (max 10 tekens)');
  if (newAppName) {
    createNewApplicationIcon(newAppName);
  }
});

// Function to handle application selection
function handleApplicationSelection(selectedIcon) {
  const icons = document.querySelectorAll('.app-icon');

  // Remove the 'selected' class from all icons
  icons.forEach(function (icon) {
    icon.classList.remove('selected');
  });

  // Apply the 'selected' class to the clicked icon
  selectedIcon.classList.add('selected');
}

// Function to remove an application icon
function removeApplicationIcon(iconDiv) {
  const confirmation = window.confirm('Ben je zeker dat je deze app wil verwijderen?');
  if (!confirmation) {
    return;
  }

  const appName = iconDiv.querySelector('.app-name').textContent;
  const index = applications.indexOf(appName);
  if (index !== -1) {
    applications.splice(index, 1);
  }

  // Save the updated list to local storage
  localStorage.setItem('applications', JSON.stringify(applications));
  iconDiv.parentElement.remove(); // Remove the app icon
}

function save(firstName, pubKey) {
  const userData = {
    firstName: firstName,
    pubKey: pubKey,
  };

  // Convert the userData object to JSON and store it in local storage
  localStorage.setItem('userData', JSON.stringify(userData));
}

function load() {
  const userDataString = localStorage.getItem('userData');
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    // Populate input fields with the stored first name and last name
    if (userData.firstName)
      document.getElementById('firstName').value = userData.firstName;
    if (userData.pubKey)
        document.getElementById('pubKey').value = userData.pubKey;
  }
}

function handleInputChange(event) {
  const firstNameInput = document.getElementById('firstName').value;
  const pubKeyInput = document.getElementById('pubKey').value;

  // Save the updated values to local storage
  save(firstNameInput, pubKeyInput);
}

window.addEventListener('load', load);

const firstNameInput = document.getElementById('firstName');
const pubKeyInput = document.getElementById('pubKey');
firstNameInput.addEventListener('input', handleInputChange);
pubKeyInput.addEventListener('input', handleInputChange);