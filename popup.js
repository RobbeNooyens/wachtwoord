function showPopup(text, duration) {
    var popup = document.getElementById("popup");
    popup.style.display = "block"; // Show the popup
    popup.textContent = text; // Set the text

    // Hide the popup after 3 seconds (3000 milliseconds)
    setTimeout(function() {
        popup.style.display = "none";
    }, duration);
}