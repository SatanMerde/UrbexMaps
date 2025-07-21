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
// Référence à l'élément UL de la liste des résultats
var resultsList = document.getElementById('results-list');
// Référence au conteneur de la barre latérale
var resultsSidebar = document.getElementById('results-sidebar');


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
        // Ne pas appeler displayMarkersAndList ici pour que la liste soit vide au démarrage
        // displayMarkersAndList(allLocations); 
    })
    .catch(error => console.error('Erreur lors du traitement des lieux:', error));

// Fonction pour afficher les marqueurs sur la carte ET mettre à jour la liste des résultats
function displayMarkersAndList(locationsToDisplay) {
    // Supprimer tous les marqueurs existants
    allMarkers.forEach(marker => map.removeLayer(marker));
    allMarkers = []; // Réinitialiser la liste des marqueurs

    // Vider la liste des résultats HTML
    resultsList.innerHTML = '';

    // Si des lieux sont à afficher, rendre la sidebar visible
    if (locationsToDisplay.length > 0) {
        resultsSidebar.style.display = 'block'; // Ou 'flex' si tu préfères
    } else {
        // Sinon, cacher la sidebar si la recherche ne donne aucun résultat
        resultsSidebar.style.display = 'none';
    }


    // Ajouter les nouveaux marqueurs et les éléments à la liste
    locationsToDisplay.forEach(location => {
        // Création du marqueur
        var marker = L.marker([location.lat, location.lng]).addTo(map);

        // Contenu du popup
        var popupContent = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
            ${location.image ? `<img src="${location.image}" alt="${location.name}" style="max-width:150px; height:auto;">` : ''}
            <button onclick="openGoogleMaps(${location.lat}, ${location.lng})">Voir sur Google Maps (Satellite)</button>
        `;
        marker.bindPopup(popupContent);
        allMarkers.push(marker); // Ajouter le marqueur à notre liste

        // Création de l'élément de liste
        var listItem = document.createElement('li');
        listItem.className = 'result-item';
        listItem.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
        `;
        listItem.dataset.markerId = allMarkers.indexOf(marker); // Associe l'élément de liste au marqueur

        // Ajouter un écouteur d'événement pour le clic sur l'élément de liste
        listItem.addEventListener('click', function() {
            var markerIndex = parseInt(this.dataset.markerId);
            var targetMarker = allMarkers[markerIndex];

            if (targetMarker) {
                map.flyTo(targetMarker.getLatLng(), 15); // Centre la carte sur le marqueur avec un zoom plus proche
                targetMarker.openPopup(); // Ouvre le popup du marqueur
            }
        });

        resultsList.appendChild(listItem); // Ajouter l'élément à la liste HTML
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

    // Si la barre de recherche est vide, cacher la sidebar et vider les marqueurs
    if (searchTerm === '') {
        resultsSidebar.style.display = 'none';
        allMarkers.forEach(marker => map.removeLayer(marker)); // Supprimer tous les marqueurs
        allMarkers = []; // Réinitialiser la liste
        return; // Sortir de la fonction
    }

    var filteredLocations = allLocations.filter(location => {
        // Filtrer par nom ou description
        return location.name.toLowerCase().includes(searchTerm) ||
               location.description.toLowerCase().includes(searchTerm);
    });

    displayMarkersAndList(filteredLocations); // Afficher uniquement les marqueurs filtrés et la liste
});

// Masquer la sidebar au chargement initial
document.addEventListener('DOMContentLoaded', (event) => {
    resultsSidebar.style.display = 'none';
});
