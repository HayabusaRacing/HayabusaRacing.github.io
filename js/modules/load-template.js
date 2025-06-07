async function loadTemplates() {
    const header = await fetch('/templates/header.html').then(res => res.text());
    const footer = await fetch('/templates/footer.html').then(res => res.text());

    document.getElementById('header').innerHTML = header;
    document.getElementById('footer').innerHTML = footer;
}
window.onload = loadTemplates;