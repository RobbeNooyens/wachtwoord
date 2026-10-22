# Wachtwoord

Een kleine, lokale wachtwoordgenerator. De browser maakt per website een vast wachtwoord of een pincode uit je e-mailadres/gebruikersnaam, hoofdwachtwoord en appnaam.

Open `index.html` in een moderne browser. De uitleg en pseudocode staan op [`how-it-works.html`](how-it-works.html).

Wachtwoorden en pincodes worden niet opgeslagen. De browser onthoudt wel je gebruikersnaam en lijst met apps in `localStorage`; die kun je via de browserinstellingen wissen. Toegevoegde websites gebruiken hun eigen `/favicon.ico` als pictogram.

De generator gebruikt SHA-384 rechtstreeks, zonder salt of extra sleutelversterking. Lees de uitlegpagina en begrijp de beperkingen voordat je deze gebruikt voor belangrijke accounts.
