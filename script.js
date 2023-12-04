window.addEventListener("DOMContentLoaded", (event) => {
  const hamburger = document.querySelector(".hamburger-menu");
  const nav = document.querySelector(".nav");

  hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      nav.classList.toggle("active");
  })

  document.querySelectorAll(".nav-link").forEach(n => n.addEventListener('click', () => {
    console.log("link clicked");
    hamburger.classList.remove('active')
    nav.classList.remove('active')
  }))
  
});