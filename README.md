# Wachtwoord

Een kleine, lokale wachtwoordgenerator. De browser maakt per website een vast wachtwoord of een pincode uit je e-mailadres, wachtwoord en appnaam.

Open `index.html` in een moderne browser. De uitleg en pseudocode staan op [`how-it-works.html`](how-it-works.html).

Wachtwoorden en pincodes worden niet opgeslagen. Het e-mailadres wordt alleen gehasht en gemaskeerd bewaard; de opgeslagen hash wordt gebruikt om codes te maken. De browser bewaart ook de lijst met apps in `localStorage`. Toegevoegde websites gebruiken hun eigen `/favicon.ico` als pictogram.

De generator gebruikt een SHA-256-e-mailhash als invoer voor SHA-384, zonder salt of extra sleutelversterking. Lees de uitlegpagina en begrijp de beperkingen voordat je deze gebruikt voor belangrijke accounts.
