// Initialiser la carte
var map = L.map('map').setView([48.8566, 2.3522], 6); // Coordonnées et zoom initial (ex: Paris, France)

// Ajouter le fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Charger les lieux depuis le fichier JSON
fetch('data/locations.json')
    .then(response => response.json())
    .then(locations => {
        locations.forEach(location => {
            var marker = L.marker([location.lat, location.lng]).addTo(map);

            // Contenu du popup
            var popupContent = `
                <h3>${location.name}</h3>
                <p>${location.description}</p>
                ${location.image ? `<img src="${location.image}" alt="${location.name}" style="max-width:150px; height:auto;">` : ''}
                <button onclick="openGoogleMaps(${location.lat}, ${location.lng})">Voir sur Google Maps (Satellite)</button>
            `;
            marker.bindPopup(popupContent);
        });
    })
    .catch(error => console.error('Erreur lors du chargement des lieux:', error));

// Fonction pour ouvrir Google Maps en vue satellite
function openGoogleMaps(lat, lng) {
    // Le paramètre "data=!3m1!1e3" active la vue satellite
    // "1000m" est le niveau de zoom (tu peux ajuster, ex: 500m, 200m)
    var googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},1000m/data=!3m1!1e3?hl=fr&entry=ttu`;
    window.open(googleMapsUrl, '_blank');
}
