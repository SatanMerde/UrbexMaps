// OpenLayers est importé globalement via le script dans index.html

// Variables pour les éléments du DOM
var resultsList = document.getElementById('results-list');
var resultsSidebar = document.getElementById('results-sidebar');
var searchInput = document.getElementById('search-input');
var mapContainer = document.getElementById('map');

// Données des lieux
var allLocations = []; // Stockera tous les lieux après le chargement du JSON

// Définition de l'icône du marqueur
var markerIconStyle = new ol.style.Style({
    image: new ol.style.Icon({
        anchor: [0.5, 1], // Point d'ancrage de l'icône (centre en bas)
        src: 'https://cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png', // Icône par défaut d'OpenLayers (tu peux la changer)
        // EXEMPLES D'AUTRES ICONES :
        // 'https://docs.mapbox.com/help/glossary/mapbox-logo.png' // Exemple d'icône Mapbox
        // OU si tu as ton icône dans un dossier 'data/' : 'data/marker-urbex.png'
        scale: 1 // Ajuste la taille de l'icône si nécessaire (ex: 0.7 pour plus petit)
    })
});

var vectorSource = new ol.source.Vector(); // Source pour les marqueurs OpenLayers
var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: markerIconStyle // Applique le style d'icône défini ci-dessus
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
            console.error('Erreur de chargement du fichier JSON:', response.status, response.statusText);
            throw new Error('Impossible de charger le fichier data/locations.json. Vérifiez son chemin et son contenu.');
        }
        return response.json();
    })
    .then(locations => {
        allLocations = locations; // Stocker tous les lieux
        // Ne pas afficher tous les marqueurs au démarrage si la recherche est vide
        // Ils seront affichés si l'utilisateur efface la recherche.
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
        resultsSidebar.style.display = 'block'; // Afficher la sidebar s'il y a des résultats
    } else {
        resultsSidebar.style.display = 'none'; // Masquer la sidebar s'il n'y a pas de résultats
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
        // Si la recherche est vide, ne pas afficher de marqueurs ni de résultats
        vectorSource.clear(); // Supprime tous les marqueurs de la carte
        resultsSidebar.style.display = 'none'; // Masque la sidebar
        popupOverlay.setPosition(undefined); // Cacher le popup
        return;
    }

    var filteredLocations = allLocations.filter(location => {
        return location.name.toLowerCase().includes(searchTerm) ||
               location.description.toLowerCase().includes(searchTerm);
    });

    displayMarkersAndList(filteredLocations);
});


// Écouteur de clic sur la carte pour les popups
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
        popupOverlay.setPosition(undefined); // Cache le popup s'il était ouvert
    }
});


// Masquer la sidebar au chargement initial
document.addEventListener('DOMContentLoaded', (event) => {
    resultsSidebar.style.display = 'none'; // S'assurer que la sidebar est cachée au démarrage
});
