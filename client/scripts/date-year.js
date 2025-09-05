
// Set current date and year
const now = new Date();
document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
document.getElementById('currentYear').textContent = now.getFullYear();