// OpenLayers est importé globalement via le script dans index.html (pas besoin d'imports individuels ici)

// Variables pour les éléments du DOM
var resultsList = document.getElementById('results-list');
var resultsSidebar = document.getElementById('results-sidebar');
var searchInput = document.getElementById('search-input');
var mapContainer = document.getElementById('map');

// Nouveaux éléments pour l'ajout de lieu
var toggleAddLocationFormButton = document.getElementById('toggle-add-location-form');
var addLocationFormContainer = document.getElementById('add-location-form-container');
var addLocationForm = document.getElementById('add-location-form');
var newLocationNameInput = document.getElementById('new-location-name');
var newLocationDescriptionInput = document.getElementById('new-location-description');
var newLocationLatInput = document.getElementById('new-location-lat');
var newLocationLngInput = document.getElementById('new-location-lng');
var newLocationImageInput = document.getElementById('new-location-image');


// Données des lieux
var allLocations = [];
var vectorSource = new ol.source.Vector(); // Source pour les marqueurs OpenLayers
var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: 'https://cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png' // Icône de marqueur par défaut
        })
    })
});

// Création du conteneur popup
var popupContainer = document.createElement('div');
popupContainer.className = 'ol-popup';
document.body.appendChild(popupContainer); 

var popupCloser = document.createElement('a');
popupCloser.href = '#';
popupCloser.className = 'ol-popup-closer';
popupContainer.appendChild(popupCloser);

var popupContent = document.createElement('div');
popupContainer.appendChild(popupContent);

// Création de l'Overlay pour le popup
var popupOverlay = new ol.Overlay({
    element: popupContainer,
    autoPan: {
        animation: {
            duration: 250
        }
    }
});

popupCloser.onclick = function() {
    popupOverlay.setPosition(undefined);
    popupCloser.blur();
    return false;
};


// Définition du fond de carte OpenStreetMap de base
const osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM(),
    properties: { name: 'osm' }
});

// Initialisation de la carte OpenLayers
var map = new ol.Map({
    target: 'map',
    layers: [
        osmLayer // Uniquement le fond de carte OpenStreetMap de base
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([2.3522, 48.8566]), // Coordonnées initiales (Paris)
        zoom: 6
    }),
    overlays: [popupOverlay] // Ajoute le popup comme overlay
});

// Ajout de la couche de marqueurs
map.addLayer(vectorLayer);


// --- Fonctions de gestion ---

// Chargement des lieux depuis le fichier JSON
fetch('data/locations.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur de chargement du fichier JSON: ' + response.statusText);
        }
        return response.json();
    })
    .then(locations => {
        allLocations = locations; // Stocker tous les lieux
        displayMarkersAndList(allLocations); // Affiche tous les marqueurs au démarrage
    })
    .catch(error => console.error('Erreur lors du traitement des lieux:', error));

// Fonction pour afficher les marqueurs sur la carte ET mettre à jour la liste des résultats
function displayMarkersAndList(locationsToDisplay) {
    // Vider la source vectorielle des marqueurs
    vectorSource.clear();

    // Vider la liste des résultats HTML
    resultsList.innerHTML = '';

    // Gérer la visibilité de la sidebar
    if (locationsToDisplay.length > 0) {
        resultsSidebar.style.display = 'block';
    } else {
        resultsSidebar.style.display = 'none';
    }

    // Ajouter les nouveaux marqueurs OpenLayers et les éléments à la liste
    locationsToDisplay.forEach(location => {
        var feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([location.lng, location.lat])),
            name: location.name,
            description: location.description,
            image: location.image
        });
        vectorSource.addFeature(feature);

        // Création de l'élément de liste
        var listItem = document.createElement('li');
        listItem.className = 'result-item';
        listItem.innerHTML = `
            <h3>${location.name}</h3>
            <p>${location.description}</p>
        `;
        listItem.dataset.lon = location.lng; // Stocke la longitude
        listItem.dataset.lat = location.lat; // Stocke la latitude

        // Ajouter un écouteur d'événement pour le clic sur l'élément de liste
        listItem.addEventListener('click', function() {
            var lon = parseFloat(this.dataset.lon);
            var lat = parseFloat(this.dataset.lat);
            
            // Centrer la carte sur le marqueur
            map.getView().animate({
                center: ol.proj.fromLonLat([lon, lat]),
                zoom: 15,
                duration: 500
            });

            // Afficher le popup
            popupContent.innerHTML = `
                <h3>${location.name}</h3>
                <p>${location.description}</p>
                ${location.image ? `<img src="${location.image}" alt="${location.name}">` : ''}
                <button onclick="openGoogleMaps(${location.lat}, ${location.lng})">Voir sur Google Maps (Satellite)</button>
            `;
            popupOverlay.setPosition(ol.proj.fromLonLat([lon, lat]));
        });

        resultsList.appendChild(listItem); // Ajouter l'élément à la liste HTML
    });
}

// Fonction pour ouvrir Google Maps en vue satellite
window.openGoogleMaps = function(lat, lng) {
    var googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},17z/data=!3m1!1e3?hl=fr`; 
    window.open(googleMapsUrl, '_blank');
};


// --- Écouteurs d'événements ---

// Écouteur pour la barre de recherche
searchInput.addEventListener('keyup', function() {
    var searchTerm = searchInput.value.toLowerCase();

    if (searchTerm === '') {
        displayMarkersAndList(allLocations); // Affiche tous les marqueurs si la recherche est vide
        popupOverlay.setPosition(undefined); // Cacher le popup
        return;
    }

    var filteredLocations = allLocations.filter(location => {
        return location.name.toLowerCase().includes(searchTerm) ||
               location.description.toLowerCase().includes(searchTerm);
    });

    displayMarkersAndList(filteredLocations);
});

// Écouteur de clic sur le bouton "Ajouter un lieu"
toggleAddLocationFormButton.addEventListener('click', function() {
    if (addLocationFormContainer.style.display === 'none') {
        addLocationFormContainer.style.display = 'block';
        this.textContent = 'Masquer le formulaire';
    } else {
        addLocationFormContainer.style.display = 'none';
        this.textContent = 'Ajouter un lieu';
    }
});

// Écouteur de soumission du formulaire d'ajout de lieu
addLocationForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    var newLocation = {
        name: newLocationNameInput.value,
        description: newLocationDescriptionInput.value,
        lat: parseFloat(newLocationLatInput.value),
        lng: parseFloat(newLocationLngInput.value),
        image: newLocationImageInput.value || '' // L'image est facultative
    };

    if (isNaN(newLocation.lat) || isNaN(newLocation.lng)) {
        alert("Veuillez entrer des coordonnées Latitude et Longitude valides.");
        return;
    }

    // Ajoute le nouveau lieu à notre tableau en mémoire
    allLocations.push(newLocation);

    // Réaffiche tous les marqueurs pour inclure le nouveau
    displayMarkersAndList(allLocations);

    // Centre la carte sur le nouveau lieu
    map.getView().animate({
        center: ol.proj.fromLonLat([newLocation.lng, newLocation.lat]),
        zoom: 15,
        duration: 500
    });

    // Affiche un message de confirmation
    alert("Lieu '" + newLocation.name + "' ajouté temporairement à la carte ! Pour le rendre permanent, ajoute-le au fichier data/locations.json.");

    // Réinitialise le formulaire
    addLocationForm.reset();
    newLocationLatInput.value = ''; // S'assurer que les champs numériques sont bien vides
    newLocationLngInput.value = '';
});


// Écouteur de clic sur la carte pour les popups ET pour obtenir les coordonnées
map.on('click', function(evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });

    if (feature) {
        // Clic sur un marqueur existant (affiche le popup)
        var coordinates = feature.getGeometry().getCoordinates();
        var props = feature.getProperties();
        
        popupContent.innerHTML = `
            <h3>${props.name}</h3>
            <p>${props.description}</p>
            ${props.image ? `<img src="${props.image}" alt="${props.name}">` : ''}
            <button onclick="openGoogleMaps(${ol.proj.toLonLat(coordinates)[1]}, ${ol.proj.toLonLat(coordinates)[0]})">Voir sur Google Maps (Satellite)</button>
        `;
        popupOverlay.setPosition(coordinates);
    } else {
        // Clic sur la carte sans marqueur (met à jour les champs lat/lng du formulaire)
        popupOverlay.setPosition(undefined); // Cache le popup s'il était ouvert
        var clickedCoords = ol.proj.toLonLat(evt.coordinate);
        newLocationLngInput.value = clickedCoords[0].toFixed(6); // Longitude
        newLocationLatInput.value = clickedCoords[1].toFixed(6); // Latitude
        alert(`Coordonnées copiées dans le formulaire : Lat ${clickedCoords[1].toFixed(6)}, Lng ${clickedCoords[0].toFixed(6)}`);
    }
});


// Masquer la sidebar et le formulaire au chargement initial
document.addEventListener('DOMContentLoaded', (event) => {
    resultsSidebar.style.display = 'none';
    addLocationFormContainer.style.display = 'none'; // Cache le formulaire d'ajout au démarrage
});
