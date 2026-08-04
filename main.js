function enterApp() {
  const splash = document.getElementById('splashScreen');
  const main = document.getElementById('mainContent');

  if (splash && main) {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      main.classList.remove('opacity-0');
      main.classList.add('opacity-100');
    }, 700);
  }
}