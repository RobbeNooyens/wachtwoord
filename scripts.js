// Define the applications array to store the list of app names
let applications = [];

function loadApplicationsFromLocalStorage() {
  applications = [];
  const storedApplications = localStorage.getItem('applications');
  if (storedApplications) {
    applications = JSON.parse(storedApplications);

    // Create app icons for each application in the list
    applications.forEach(function (appName) {
      createApplicationIcon(appName);
    });
  }
}

// Call the function to load applications when the page loads
window.addEventListener('load', loadApplicationsFromLocalStorage);

// Define an HTML template for the application icon
const appIconTemplate = document.createElement('template');
appIconTemplate.innerHTML = `
  <div class="p-2">
    <div class="app-icon btn btn-warning">
      <span class="app-name"></span>
      <img class="app-logo" src="" alt="App Logo">
      <div class="bin-icon" onclick="removeApplicationIcon(this)">✖</div>
    </div>
  </div>
`;

// Mapping of app names to their logos (you can add more)
const appData = {
  'GOOGLE': 'logos/google.png',
  'FACEBOOK': 'logos/facebook.png',
  'MICROSOFT': 'logos/microsoft.png',
};

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
  if (appData[appName] === undefined) {
    appData[appName] = 'logos/default.png';
  }
  appLogo.src = appData[appName];

  // Add a click event listener to handle application selection
  appIcon.addEventListener('click', function () {
    handleApplicationSelection(appIcon);
  });

  appIconsDiv.insertBefore(iconClone, addIconDiv); // Insert before the "+" icon
}

function createNewApplicationIcon(appName) {
  createApplicationIcon(appName.toUpperCase());
  applications.push(appName.toUpperCase());

  // Save the updated list to local storage
  localStorage.setItem('applications', JSON.stringify(applications));
}

// Event listener for adding a new icon
document.getElementById('addNewIcon').addEventListener('click', function () {
  let newAppName = prompt('Enter the app name:', 'Google');
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
function removeApplicationIcon(binIcon) {
  const confirmation = window.confirm('Are you sure you want to delete this application?');
  if (!confirmation) {
    return;
  }
  const iconDiv = binIcon.parentElement.parentElement; // Get the parent app icon div

  const appName = iconDiv.querySelector('.app-name').textContent;
  const index = applications.indexOf(appName);
  if (index !== -1) {
    applications.splice(index, 1);
  }

  // Save the updated list to local storage
  localStorage.setItem('applications', JSON.stringify(applications));
  iconDiv.remove(); // Remove the app icon
}
