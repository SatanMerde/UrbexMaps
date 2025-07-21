// Initialiser la carte
// Coordonnées initiales : Paris, France (48.8566, 2.3522) - Zoom initial: 6
var map = L.map('map').setView([48.8566, 2.3522], 6);

// Ajouter le fond de carte OpenStreetMap (vue non-satellite)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Charger les lieux depuis le fichier JSON
fetch('data/locations.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de chargement du fichier JSON: ' + response.statusText);
        }
        return response.json();
    })
    .then(locations => {
        locations.forEach(location => {
            var marker = L.marker([location.lat, location.lng]).addTo(map);

            // Contenu du popup qui apparaît quand on clique sur le marqueur
            var popupContent = `
                <h3>${location.name}</h3>
                <p>${location.description}</p>
                ${location.image ? `<img src="${location.image}" alt="${location.name}" style="max-width:150px; height:auto;">` : ''}
                <button onclick="openGoogleMaps(${location.lat}, ${location.lng})">Voir sur Google Maps (Satellite)</button>
            `;
            marker.bindPopup(popupContent);
        });
    })
    .catch(error => console.error('Erreur lors du traitement des lieux:', error));

// Fonction pour ouvrir Google Maps en vue satellite
function openGoogleMaps(lat, lng) {
    var googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},1000m/data=!3m1!1e3?hl=fr&entry=ttu`;
    window.open(googleMapsUrl, '_blank');
}
