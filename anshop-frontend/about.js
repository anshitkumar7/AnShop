// Display current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// Toggle visibility of additional content
function toggleContent() {
  const moreContent = document.getElementById("moreContent");
  const button = document.getElementById("learnMoreButton");
  if (moreContent.style.display === "none" || moreContent.style.display === "") {
    moreContent.style.display = "block";
    button.textContent = "Show Less";
  } else {
    moreContent.style.display = "none";
    button.textContent = "Learn More";
  }
}
