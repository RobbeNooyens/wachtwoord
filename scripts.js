const DEFAULT_APPLICATIONS = [
  { name: 'Google', key: 'GOOGLE', url: 'https://google.com', logo: 'logos/google.png' },
  { name: 'Facebook', key: 'FACEBOOK', url: 'https://facebook.com', logo: 'logos/facebook.png' },
  { name: 'Microsoft', key: 'MICROSOFT', url: 'https://microsoft.com', logo: 'logos/microsoft.png' },
  { name: 'Apple', key: 'APPLE', url: 'https://apple.com', logo: 'logos/apple.png' }
];

let applications = [];
let selectedApplication = null;

function normalizeWebsiteUrl(value) {
  const text = value.trim();
  if (!text) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function deriveAppName(url) {
  const labels = url.hostname.toLowerCase().replace(/^www\./, '').split('.');
  const compoundSuffixes = ['co.uk', 'org.uk', 'gov.uk', 'com.au', 'net.au', 'com.br', 'co.nz', 'co.jp', 'com.cn'];
  const suffix = labels.slice(-2).join('.');
  const index = compoundSuffixes.includes(suffix) ? labels.length - 3 : labels.length - 2;
  const name = labels[Math.max(index, 0)] || labels[0];
  return name.split(/[-_]/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function makeAppKey(name) {
  return name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
}

function loadApplicationsFromLocalStorage() {
  let storedApplications = null;
  try {
    storedApplications = JSON.parse(localStorage.getItem('applications'));
  } catch {
    localStorage.removeItem('applications');
  }

  if (Array.isArray(storedApplications)) {
    applications = storedApplications.map((app) => {
      if (typeof app === 'string') {
        const knownApp = DEFAULT_APPLICATIONS.find(item => item.key === makeAppKey(app));
        return knownApp || { name: app, key: makeAppKey(app), url: '', logo: `logos/${app.toLowerCase().replace(/\s+/g, '_')}.png` };
      }

      if (!app || typeof app.name !== 'string') return null;
      const url = typeof app.url === 'string' ? normalizeWebsiteUrl(app.url) : null;
      return {
        name: app.name.trim(),
        key: typeof app.key === 'string' ? app.key : makeAppKey(app.name),
        url: url ? url.href : '',
        logo: typeof app.logo === 'string' && /^logos\/[\w.-]+\.png$/.test(app.logo) ? app.logo : ''
      };
    }).filter(app => app && app.name && app.key);
  } else {
    applications = DEFAULT_APPLICATIONS.map(app => ({ ...app }));
    saveApplications();
  }

  applications.forEach(createApplicationIcon);
}

function saveApplications() {
  localStorage.setItem('applications', JSON.stringify(applications));
}

function createApplicationIcon(app) {
  const appIcons = document.getElementById('applicationIcons');
  const item = document.createElement('div');
  item.className = 'app-item';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'app-choice';
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', `Kies ${app.name}`);

  const icon = document.createElement('span');
  icon.className = 'app-icon';
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.src = app.logo || (app.url ? `${new URL(app.url).origin}/favicon.ico` : '');
  image.addEventListener('error', () => {
    image.remove();
    const initials = document.createElement('span');
    initials.className = 'app-initials';
    initials.textContent = app.name.trim().slice(0, 1).toUpperCase();
    icon.appendChild(initials);
  }, { once: true });
  icon.appendChild(image);

  const name = document.createElement('span');
  name.className = 'app-name';
  name.textContent = app.name;
  button.append(icon, name);
  button.addEventListener('click', () => selectApplication(app, button));
  item.appendChild(button);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'remove-app';
  remove.setAttribute('aria-label', `Verwijder ${app.name}`);
  remove.title = `Verwijder ${app.name}`;
  remove.textContent = '×';
  remove.addEventListener('click', () => removeApplication(app, item));
  item.appendChild(remove);
  appIcons.appendChild(item);
}

function selectApplication(app, button) {
  selectedApplication = app;
  document.querySelectorAll('.app-choice').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
}

function removeApplication(app, item) {
  if (!window.confirm(`Wil je ${app.name} uit je lijst verwijderen?`)) return;
  applications = applications.filter(existing => existing !== app);
  if (selectedApplication === app) selectedApplication = null;
  saveApplications();
  item.remove();
}

function addApplication() {
  const url = normalizeWebsiteUrl(document.getElementById('newAppUrl').value);
  const name = document.getElementById('newAppName').value.trim();
  if (!url) {
    showPopup('Vul een geldig websiteadres in, bijvoorbeeld voorbeeld.nl.', 3000);
    document.getElementById('newAppUrl').focus();
    return;
  }
  if (!name) {
    showPopup('Vul een naam voor de app in.', 2500);
    document.getElementById('newAppName').focus();
    return;
  }

  const app = { name, key: makeAppKey(name), url: url.href, logo: '' };
  if (!app.key) {
    showPopup('Gebruik een naam met letters of cijfers.', 2500);
    return;
  }
  if (applications.some(existing => existing.key === app.key)) {
    showPopup('Deze app staat al in je lijst.', 2500);
    return;
  }

  applications.push(app);
  saveApplications();
  createApplicationIcon(app);
  document.getElementById('newAppForm').hidden = true;
  document.getElementById('newAppUrl').value = '';
  document.getElementById('newAppName').value = '';
  document.getElementById('newAppName').dataset.touched = 'false';
  showPopup(`${name} is toegevoegd.`, 2000);
  document.querySelector('.app-choice:last-of-type')?.focus();
}

function toggleCredentialSettings() {
  const type = document.querySelector('input[name="credentialType"]:checked').value;
  document.getElementById('passwordSettings').hidden = type !== 'password';
  document.getElementById('pinSettings').hidden = type !== 'pin';
  document.querySelector('.generate-button').textContent = type === 'pin' ? 'Genereer mijn pincode' : 'Genereer mijn wachtwoord';
}

function clearResult() {
  document.getElementById('passwordOutput').value = '';
  document.getElementById('password').value = '';
  document.getElementById('repeatPassword').value = '';
  document.getElementById('passwordOutput').type = 'password';
  const toggle = document.getElementById('password-toggle');
  toggle.setAttribute('aria-label', 'Wachtwoord tonen');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.disabled = true;
  document.getElementById('copyBtn').disabled = true;
  showPopup('De velden zijn gewist.', 2000);
}

window.addEventListener('load', () => {
  loadApplicationsFromLocalStorage();
  document.getElementById('pubKey').value = localStorage.getItem('key') || '';
  toggleCredentialSettings();
});

document.getElementById('pubKey').addEventListener('input', (event) => {
  localStorage.setItem('key', event.target.value);
});

document.querySelectorAll('input[name="credentialType"]').forEach(input => {
  input.addEventListener('change', toggleCredentialSettings);
});

document.getElementById('addNewIcon').addEventListener('click', () => {
  const form = document.getElementById('newAppForm');
  form.hidden = !form.hidden;
  if (!form.hidden) document.getElementById('newAppUrl').focus();
});
document.getElementById('cancelAddApp').addEventListener('click', () => {
  document.getElementById('newAppForm').hidden = true;
});
document.getElementById('saveNewApp').addEventListener('click', addApplication);
document.getElementById('newAppUrl').addEventListener('input', (event) => {
  const nameInput = document.getElementById('newAppName');
  if (nameInput.dataset.touched !== 'true') {
    const url = normalizeWebsiteUrl(event.target.value);
    nameInput.value = url ? deriveAppName(url) : '';
  }
});
document.getElementById('newAppName').addEventListener('input', (event) => {
  event.target.dataset.touched = 'true';
});

document.getElementById('userInfo').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const pubKey = form.elements.pubKey.value.trim();
  const password = form.elements.password.value;
  const repeatPassword = form.elements.repeatPassword.value;
  const type = form.elements.credentialType.value;

  if (repeatPassword && password !== repeatPassword) {
    showPopup('De hoofdwachtwoorden zijn niet hetzelfde.', 2500);
    return;
  }
  if (!selectedApplication) {
    showPopup('Kies eerst een website of app.', 2500);
    document.getElementById('applicationIcons').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const lengthField = document.getElementById(type === 'pin' ? 'pinLength' : 'passwordLength');
  const length = Number(lengthField.value);
  const min = Number(lengthField.min);
  const max = Number(lengthField.max);
  if (!Number.isInteger(length) || length < min || length > max) {
    showPopup(`Kies een lengte tussen ${min} en ${max}.`, 2500);
    lengthField.focus();
    return;
  }

  try {
    const hash = await createHash(`${pubKey}${password}${selectedApplication.key}`);
    document.getElementById('passwordOutput').value = formatHash(type, hash, {
      length,
      includeSpecial: document.getElementById('includeSpecial').checked
    });
    document.getElementById('password-toggle').disabled = false;
    document.getElementById('copyBtn').disabled = false;
    showPopup(type === 'pin' ? 'Je pincode is klaar.' : 'Je wachtwoord is klaar.', 2000);
  } catch {
    showPopup('Er ging iets mis bij het maken. Probeer het opnieuw.', 3000);
  }
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  const output = document.getElementById('passwordOutput');
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    showPopup('Gekopieerd. Plak het meteen op de website.', 2500);
  } catch {
    output.type = 'text';
    output.select();
    const copied = document.execCommand('copy');
    output.type = 'password';
    window.getSelection()?.removeAllRanges();
    showPopup(copied ? 'Gekopieerd. Plak het meteen op de website.' : 'Kopiëren lukte niet. Selecteer en kopieer de tekst.', 3000);
  }
});

document.getElementById('clearBtn').addEventListener('click', clearResult);
document.getElementById('password-toggle').addEventListener('click', (event) => {
  const output = document.getElementById('passwordOutput');
  const toggle = event.currentTarget;
  const visible = output.type === 'password';
  output.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-label', visible ? 'Wachtwoord verbergen' : 'Wachtwoord tonen');
  toggle.setAttribute('aria-pressed', String(visible));
});
