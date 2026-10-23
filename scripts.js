const DEFAULT_APPLICATIONS = [
  { name: 'Google', key: 'GOOGLE', url: 'https://google.com', logo: 'logos/google.png' },
  { name: 'Facebook', key: 'FACEBOOK', url: 'https://facebook.com', logo: 'logos/facebook.png' },
  { name: 'Microsoft', key: 'MICROSOFT', url: 'https://microsoft.com', logo: 'logos/microsoft.png' },
  { name: 'Apple', key: 'APPLE', url: 'https://apple.com', logo: 'logos/apple.png' }
];

let applications = [];
let selectedApplication = null;
let emailProfile = null;
let currentStep = 1;
let generationRequest = 0;
let confirmationResolver = null;

function normalizeEmail(value) {
  return value.replace(/\s/g, '').toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function hashEmail(email) {
  const bytes = new TextEncoder().encode(email);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const labels = domain.split('.');
  const suffix = labels.length > 2 && labels.at(-1).length === 2
    ? labels.slice(-2).join('.')
    : labels.at(-1);
  const localMask = local.length > 1 ? `${local[0]}***${local.at(-1)}` : `${local[0]}***`;
  return `${localMask}@***.${suffix}`;
}

function displayEmailProfile() {
  const savedEmail = document.getElementById('savedEmail');
  savedEmail.hidden = !emailProfile;
  document.getElementById('maskedEmail').textContent = emailProfile ? emailProfile.masked : '';
}

async function setEmailProfile(email) {
  const hash = await hashEmail(email);
  if (emailProfile) return emailProfile.hash === hash;

  emailProfile = { hash, masked: maskEmail(email) };
  localStorage.setItem('emailProfile', JSON.stringify(emailProfile));
  localStorage.removeItem('key');
  displayEmailProfile();
  return true;
}

async function loadEmailProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem('emailProfile'));
    if (saved && /^[a-f0-9]{64}$/.test(saved.hash) && typeof saved.masked === 'string') {
      emailProfile = { hash: saved.hash, masked: saved.masked };
    }
  } catch {
    localStorage.removeItem('emailProfile');
  }

  const legacyEmail = localStorage.getItem('key');
  if (legacyEmail) {
    const normalized = normalizeEmail(legacyEmail);
    if (!emailProfile && isValidEmail(normalized)) {
      await setEmailProfile(normalized);
    } else {
      localStorage.removeItem('key');
    }
  }
  localStorage.removeItem('key');
  displayEmailProfile();
}

function normalizeWebsiteUrl(value) {
  const text = value.trim();
  if (!text) return null;

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function deriveAppName(url) {
  const labels = url.hostname.toLowerCase().replace(/^www\./, '').split('.');
  if (labels.length === 1 || /^\d+(?:\.\d+){3}$/.test(url.hostname)) return url.hostname;
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
  renderApplicationIcons();
}

function saveApplications() {
  localStorage.setItem('applications', JSON.stringify(applications));
}

function createApplicationIcon(app) {
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
  remove.addEventListener('click', async () => {
    const confirmed = await askConfirmation(`Wil je ${app.name} uit je lijst verwijderen?`, 'App verwijderen');
    if (!confirmed) return;
    applications = applications.filter(existing => existing !== app);
    if (selectedApplication === app) {
      selectedApplication = null;
      clearGeneratedCode();
    }
    saveApplications();
    renderApplicationIcons();
  });
  item.appendChild(remove);
  return item;
}

function renderApplicationIcons() {
  const appIcons = document.getElementById('applicationIcons');
  appIcons.replaceChildren(...applications.map(createApplicationIcon));

  const addItem = document.createElement('div');
  addItem.className = 'app-item add-app-item';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'app-choice add-app-choice';
  addButton.setAttribute('aria-label', 'Website of app toevoegen');
  addButton.innerHTML = '<span class="add-app-icon" aria-hidden="true">＋</span><span class="app-name">Toevoegen</span>';
  addButton.addEventListener('click', openApplicationDialog);
  addItem.appendChild(addButton);
  appIcons.appendChild(addItem);
}

function selectApplication(app, button) {
  selectedApplication = app;
  document.querySelectorAll('.app-choice:not(.add-app-choice)').forEach((choice) => {
    const selected = choice === button;
    choice.classList.toggle('selected', selected);
    choice.setAttribute('aria-pressed', String(selected));
  });
  updateGeneration();
}

function openApplicationDialog() {
  const dialog = document.getElementById('appDialog');
  dialog.showModal();
  document.getElementById('newAppUrl').focus();
}

function closeApplicationDialog() {
  document.getElementById('appDialog').close();
}

function addApplication(event) {
  event.preventDefault();
  const url = normalizeWebsiteUrl(document.getElementById('newAppUrl').value);
  const name = document.getElementById('newAppName').value.trim();
  if (!url || !name) {
    showPopup('Controleer het websiteadres en de naam.', 2500);
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
  renderApplicationIcons();
  closeApplicationDialog();
  document.getElementById('appDialogForm').reset();
  const addedButton = [...document.querySelectorAll('.app-choice:not(.add-app-choice)')]
    .find(button => button.getAttribute('aria-label') === `Kies ${app.name}`);
  if (addedButton) selectApplication(app, addedButton);
  showPopup(`${name} is toegevoegd.`, 2000);
}

function askConfirmation(message, title = 'Weet je het zeker?', confirmLabel = 'Wissen') {
  const dialog = document.getElementById('confirmDialog');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('acceptConfirm').textContent = confirmLabel;
  dialog.showModal();
  return new Promise(resolve => {
    confirmationResolver = resolve;
  });
}

function resolveConfirmation(confirmed) {
  document.getElementById('confirmDialog').close();
  if (confirmationResolver) {
    confirmationResolver(confirmed);
    confirmationResolver = null;
  }
}

function emailInputValue() {
  return normalizeEmail(document.getElementById('pubKey').value);
}

function stepOneIsValid() {
  const email = emailInputValue();
  const password = document.getElementById('password').value;
  const isNew = document.querySelector('input[name="passwordPurpose"]:checked').value === 'new';
  const repeated = document.getElementById('repeatPassword').value;
  return isValidEmail(email) && Boolean(password) && (!isNew || (Boolean(repeated) && repeated === password));
}

function updateStepControls() {
  const back = document.getElementById('backStep');
  const next = document.getElementById('nextStep');
  document.getElementById('stepLabel').textContent = `Stap ${currentStep} van 3`;
  document.querySelectorAll('.progress-segment').forEach((segment) => {
    segment.classList.toggle('active', Number(segment.dataset.progress) <= currentStep);
  });
  document.querySelectorAll('.wizard-step').forEach((section) => {
    const active = Number(section.dataset.step) === currentStep;
    section.classList.toggle('active-step', active);
    section.setAttribute('aria-hidden', String(!active));
  });

  back.hidden = currentStep === 1;
  if (currentStep === 1) {
    next.textContent = 'Volgende';
    next.disabled = !stepOneIsValid();
  } else if (currentStep === 2) {
    next.textContent = 'Volgende';
    next.disabled = false;
  } else {
    const type = document.querySelector('input[name="credentialType"]:checked').value;
    next.textContent = type === 'pin' ? 'Kopieer pincode' : 'Kopieer wachtwoord';
    next.disabled = !document.getElementById('passwordOutput').value;
  }
}

function goToStep(step) {
  currentStep = Math.max(1, Math.min(3, step));
  updateStepControls();
  if (window.matchMedia('(max-width: 700px)').matches) {
    document.querySelector('.wizard-progress').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (currentStep === 3) updateGeneration();
}

async function continueFromStepOne() {
  if (!stepOneIsValid()) {
    showPopup('Vul een geldig e-mailadres en hoofdwachtwoord in.', 2500);
    return;
  }
  const saved = await setEmailProfile(emailInputValue());
  if (!saved) {
    showPopup(`Dit e-mailadres is opgeslagen als ${emailProfile.masked}. Wis het eerst om een ander adres te gebruiken.`, 4000);
    return;
  }
  goToStep(2);
}

function updateCredentialType() {
  const type = document.querySelector('input[name="credentialType"]:checked').value;
  document.getElementById('passwordSettings').hidden = type !== 'password';
  document.getElementById('pinSettings').hidden = type !== 'pin';
  document.getElementById('passwordOutput').placeholder = type === 'pin' ? 'Je pincode verschijnt hier' : 'Je wachtwoord verschijnt hier';
  document.getElementById('passwordOutput').setAttribute('aria-label', type === 'pin' ? 'Gegenereerde pincode' : 'Gegenereerd wachtwoord');
  updateStepControls();
  updateGeneration();
}

function clearGeneratedCode() {
  document.getElementById('passwordOutput').value = '';
  document.getElementById('copyBtn').disabled = true;
  document.getElementById('password-toggle').disabled = true;
  document.getElementById('passwordOutput').type = 'password';
  document.getElementById('password-toggle').classList.remove('visible-password');
  updateStepControls();
}

async function updateGeneration() {
  const request = ++generationRequest;
  const email = emailInputValue();
  const password = document.getElementById('password').value;
  const isNew = document.querySelector('input[name="passwordPurpose"]:checked').value === 'new';
  const repeated = document.getElementById('repeatPassword').value;
  const type = document.querySelector('input[name="credentialType"]:checked').value;
  const lengthField = document.getElementById(type === 'pin' ? 'pinLength' : 'passwordLength');
  const length = Number(lengthField.value);
  const min = Number(lengthField.min);
  const max = Number(lengthField.max);

  if (!isValidEmail(email) || !password || (isNew && (!repeated || repeated !== password)) ||
      !selectedApplication || !Number.isInteger(length) || length < min || length > max) {
    clearGeneratedCode();
    return;
  }

  try {
    if (!await setEmailProfile(email)) {
      clearGeneratedCode();
      return;
    }
    const hash = await createHash(`${email}${password}${selectedApplication.key}`);
    if (request !== generationRequest) return;
    document.getElementById('passwordOutput').value = formatHash(type, hash, {
      length,
      includeSpecial: document.getElementById('includeSpecial').checked
    });
    document.getElementById('password-toggle').disabled = false;
    document.getElementById('copyBtn').disabled = false;
    updateStepControls();
  } catch {
    clearGeneratedCode();
    showPopup('Er ging iets mis bij het maken. Probeer het opnieuw.', 3000);
  }
}

async function copyGeneratedCode() {
  const output = document.getElementById('passwordOutput');
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    showPopup('Gekopieerd naar het klembord.', 2000);
  } catch {
    output.type = 'text';
    output.select();
    const copied = document.execCommand('copy');
    if (copied) {
      output.type = 'password';
      showPopup('Gekopieerd naar het klembord.', 2000);
    } else {
      output.type = 'text';
      output.focus();
      output.select();
      showPopup('Kopiëren lukte niet. De code staat geselecteerd.', 3000);
    }
  }
}

async function clearEverything() {
  const confirmed = await askConfirmation(
    'De code en ingevulde gegevens worden gewist. Het afgeschermde e-mailadres blijft bewaard.',
    'Alles wissen'
  );
  if (!confirmed) return;

  try {
    await navigator.clipboard.writeText('');
  } catch {
    // Clipboard clearing is not supported by every browser.
  }
  document.getElementById('pubKey').value = '';
  document.getElementById('password').value = '';
  document.getElementById('repeatPassword').value = '';
  document.querySelector('input[name="passwordPurpose"][value="existing"]').checked = true;
  document.getElementById('repeatPasswordField').hidden = true;
  document.querySelector('input[name="credentialType"][value="password"]').checked = true;
  document.getElementById('passwordLength').value = '20';
  document.getElementById('pinLength').value = '6';
  document.getElementById('includeSpecial').checked = true;
  selectedApplication = null;
  document.querySelectorAll('.app-choice').forEach(choice => {
    choice.classList.remove('selected');
    choice.setAttribute('aria-pressed', 'false');
  });
  clearGeneratedCode();
  updateCredentialType();
  goToStep(1);
  document.getElementById('pubKey').focus();
}

async function clearEmailProfile() {
  const confirmed = await askConfirmation(
    'Het opgeslagen e-mailadres wordt volledig verwijderd. Je kunt daarna een nieuw e-mailadres instellen.',
    'E-mailadres wissen'
  );
  if (!confirmed) return;

  localStorage.removeItem('emailProfile');
  localStorage.removeItem('key');
  emailProfile = null;
  document.getElementById('pubKey').value = '';
  displayEmailProfile();
  clearGeneratedCode();
  goToStep(1);
  document.getElementById('pubKey').focus();
}

function initializeEvents() {
  const emailInput = document.getElementById('pubKey');
  emailInput.addEventListener('input', () => {
    const normalized = normalizeEmail(emailInput.value);
    if (emailInput.value !== normalized) {
      const start = emailInput.selectionStart;
      emailInput.value = normalized;
      emailInput.setSelectionRange(start, start);
    }
    updateStepControls();
    updateGeneration();
  });

  document.getElementById('password').addEventListener('input', () => {
    updateStepControls();
    updateGeneration();
  });
  document.getElementById('repeatPassword').addEventListener('input', updateGeneration);

  document.querySelectorAll('input[name="passwordPurpose"]').forEach(input => {
    input.addEventListener('change', () => {
      const isNew = input.value === 'new' && input.checked;
      document.getElementById('repeatPasswordField').hidden = !isNew;
      document.getElementById('password').autocomplete = isNew ? 'new-password' : 'current-password';
      updateStepControls();
      updateGeneration();
      if (isNew) document.getElementById('repeatPassword').focus();
    });
  });
  document.querySelectorAll('input[name="credentialType"]').forEach(input => {
    input.addEventListener('change', updateCredentialType);
  });
  document.getElementById('passwordLength').addEventListener('input', updateGeneration);
  document.getElementById('pinLength').addEventListener('input', updateGeneration);
  document.getElementById('includeSpecial').addEventListener('change', updateGeneration);

  document.getElementById('nextStep').addEventListener('click', async () => {
    if (currentStep === 1) await continueFromStepOne();
    else if (currentStep === 2) goToStep(3);
    else await copyGeneratedCode();
  });
  document.getElementById('backStep').addEventListener('click', () => goToStep(currentStep - 1));
  document.getElementById('copyBtn').addEventListener('click', copyGeneratedCode);
  document.getElementById('clearBtn').addEventListener('click', clearEverything);
  document.getElementById('clearEmailBtn').addEventListener('click', clearEmailProfile);
  document.getElementById('password-toggle').addEventListener('click', (event) => {
    const output = document.getElementById('passwordOutput');
    const button = event.currentTarget;
    const isVisible = output.type === 'password';
    output.type = isVisible ? 'text' : 'password';
    button.classList.toggle('visible-password', isVisible);
    const type = document.querySelector('input[name="credentialType"]:checked').value;
    const name = type === 'pin' ? 'Pincode' : 'Wachtwoord';
    button.setAttribute('aria-label', `${name} ${isVisible ? 'verbergen' : 'tonen'}`);
    button.setAttribute('aria-pressed', String(isVisible));
  });

  document.getElementById('appDialogForm').addEventListener('submit', addApplication);
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
  document.getElementById('cancelAddApp').addEventListener('click', closeApplicationDialog);
  document.getElementById('closeAppDialog').addEventListener('click', closeApplicationDialog);

  document.getElementById('cancelConfirm').addEventListener('click', () => resolveConfirmation(false));
  document.getElementById('acceptConfirm').addEventListener('click', () => resolveConfirmation(true));
  document.getElementById('confirmDialog').addEventListener('cancel', (event) => {
    event.preventDefault();
    resolveConfirmation(false);
  });
}

window.addEventListener('load', async () => {
  loadApplicationsFromLocalStorage();
  initializeEvents();
  await loadEmailProfile();
  updateCredentialType();
  updateStepControls();
});
