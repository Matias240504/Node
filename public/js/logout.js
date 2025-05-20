// Script global para logout en todos los dashboards

function clearSessionAndLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    // Elimina la cookie del token (compatible cross-browser)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/auth/login';
}

document.addEventListener('DOMContentLoaded', function() {
    // Soporta múltiples botones de logout en la página
    document.querySelectorAll('.logout-btn').forEach(function(btn) {
        btn.addEventListener('click', clearSessionAndLogout);
    });
});
