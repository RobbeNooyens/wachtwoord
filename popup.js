let popupTimeout;

function showPopup(text, duration) {
  const popup = document.getElementById('popup');
  window.clearTimeout(popupTimeout);
  popup.textContent = text;
  popup.classList.add('visible');
  popupTimeout = window.setTimeout(() => {
    popup.classList.remove('visible');
  }, duration);
}
