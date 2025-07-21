// Initialiser la carte
var map = L.map('map').setView([48.8566, 2.3522], 6);

// Ajouter le fond de carte OpenStreetMap (vue non-satellite)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variable pour stocker tous les marqueurs afin de pouvoir les gérer (afficher/cacher)
var allMarkers = [];
// Variable pour stocker tous les lieux (données brutes)
var allLocations = [];

// Charger les lieux depuis le fichier JSON
fetch('data/locations.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de chargement du fichier JSON: ' + response.statusText);
        }
        return response.json();
    })
    .then(locations => {
        allLocations = locations; // Stocker tous les lieux
        displayMarkers(allLocations); // Afficher tous les marqueurs au démarrage
    })
    .catch(error => console.error('Erreur lors du traitement des lieux:', error));

// Fonction pour afficher les marqueurs sur la carte
function displayMarkers(locationsToDisplay) {
    // Supprimer tous les marqueurs existants avant d'en ajouter de nouveaux
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = []; // Réinitialiser la liste des marqueurs

    locationsToDisplay.forEach(location => {
        var marker = L.marker([location.lat, location.lng]).addTo(map);

        var popupContent = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            ${location.image ? `<img src="${location.image}" alt="${location.name}" style="max-width:150px; height:auto;">` : ''}
            <button onclick="openGoogleMaps(${location.lat}, ${location.lng})">Voir sur Google Maps (Satellite)</button>
        `;
        marker.bindPopup(popupContent);
        allMarkers.push(marker); // Ajouter le marqueur à notre liste
    });
}

// Fonction pour ouvrir Google Maps en vue satellite
function openGoogleMaps(lat, lng) {
    var googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},1000m/data=!3m1!1e3?hl=fr&entry=ttu`;
    window.open(googleMapsUrl, '_blank');
}

// Logique de la barre de recherche
var searchInput = document.getElementById('search-input');

searchInput.addEventListener('keyup', function() {
    var searchTerm = searchInput.value.toLowerCase(); // Récupérer le texte de recherche en minuscules

    var filteredLocations = allLocations.filter(location => {
        // Filtrer par nom ou description
        return location.name.toLowerCase().includes(searchTerm) ||
               location.description.toLowerCase().includes(searchTerm);
    });

    displayMarkers(filteredLocations); // Afficher uniquement les marqueurs filtrés
});
