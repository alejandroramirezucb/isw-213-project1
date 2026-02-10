fetch('navbar.html').then(res => res.text()).then(html => {
    const contenedor = document.getElementById('navbar-placeholder');
    contenedor.innerHTML = html;
    contenedor.querySelectorAll('img').forEach(img => img.src = '../' + img.getAttribute('src'));
});

