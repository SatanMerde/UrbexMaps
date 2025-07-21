// Importations nécessaires depuis OpenLayers
import Map from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/Map.js';
import View from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/View.js';
import TileLayer from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/layer/Tile.js';
import OSM from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/source/OSM.js';
import {fromLonLat, toLonLat} from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/proj.js';
import Feature from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/Feature.js';
import Point from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/geom/Point.js';
import {Icon, Style} from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/style.js';
import VectorLayer from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/layer/Vector.js';
import VectorSource from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/source/Vector.js';
import Overlay from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/Overlay.js';
import XYZ from 'https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.15.1/build/ol/source/XYZ.js';


// Variables pour les éléments du DOM
var resultsList = document.getElementById('results-list');
var resultsSidebar = document.getElementById('results-sidebar');
var searchInput = document.getElementById('search-input');
var mapStyleSelector = document.getElementById('map-style-selector');
var mapContainer = document.getElementById('map');

// Données des lieux
var allLocations = [];
var vectorSource = new VectorSource(); // Source pour les marqueurs OpenLayers
var vectorLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: 'https://cdn.rawgit.com/openlayers/ol3/master/examples/data/icon.png' // Icône de marqueur par défaut
            // Ou une icône personnalisée : 'data/marker-icon.png' si tu en mets une
        })
    })
});

// Création du conteneur popup
var popupContainer = document.createElement('div');
popupContainer.className = 'ol-popup';
document.body.appendChild(popupContainer); // Ajoute le popup au body pour le styliser plus facilement

var popupCloser = document.createElement('a');
popupCloser.href = '#';
popupCloser.className = 'ol-popup-closer';
popupContainer.appendChild(popupCloser);

var popupContent = document.createElement('div');
popupContainer.appendChild(popupContent);

// Création de l'Overlay pour le popup
var popupOverlay = new Overlay({
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


// Définition des fonds de carte
const osmLayer = new TileLayer({
    source: new OSM(),
    properties: { name: 'osm' }
});

// Esri World Imagery (Satellite) - URL de tuiles XYZ
const esriSatelliteLayer = new TileLayer({
    source: new XYZ({
        attributions: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
    }),
    properties: { name: 'esri-satellite' }
});

// Esri World Topo Map (Terrain)
const esriTerrainLayer = new TileLayer({
    source: new XYZ({
        attributions: 'Tiles &copy; Esri &mdash; Esri, DeLorme, HERE, TomTom, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19
    }),
    properties: { name: 'esri-terrain' }
});

// CartoDB Dark Matter (Foncé)
const cartoDarkLayer = new TileLayer({
    source: new XYZ({
        attributions: '© <a href="https://carto.com/attributions">Carto</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        maxZoom: 19
    }),
    properties: { name: 'carto-dark' }
});

// Wikimedia (Rues détaillées)
const wikimediaLayer = new TileLayer({
    source: new XYZ({
        attributions: '© <a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
        maxZoom: 19
    }),
    properties: { name: 'wikimedia' }
});


// Initialisation de la carte OpenLayers
var map = new Map({
    target: 'map',
    layers: [
        osmLayer // Fond de carte par défaut
    ],
    view: new View({
        center: fromLonLat([2.3522, 48.8566]), // Paris
        zoom: 6
    }),
    overlays: [popupOverlay] // Ajoute le popup comme overlay
});

// Ajout de la couche de marqueurs
map.addLayer(vectorLayer);


// --- Fonctions de gestion ---

// Fonction pour changer le fond de carte OpenLayers
function changeOpenLayersBasemap(style) {
    // Supprimer toutes les couches de fond de carte existantes
    map.getLayers().forEach(layer => {
        if (layer.get('name') !== undefined) { // C'est une couche de fond de carte
            map.removeLayer(layer);
        }
    });

    // Ajouter la nouvelle couche de fond de carte
    switch (style) {
        case 'osm':
            map.addLayer(osmLayer);
            break;
        case 'esri-satellite':
            map.addLayer(esriSatelliteLayer);
            break;
        case 'esri-terrain':
            map.addLayer(esriTerrainLayer);
            break;
        case 'carto-dark':
            map.addLayer(cartoDarkLayer);
            break;
        case 'wikimedia':
            map.addLayer(wikimediaLayer);
            break;
        default:
            map.addLayer(osmLayer); // Fallback
            break;
    }
    // S'assurer que la couche vectorielle de marqueurs est toujours au-dessus
    map.removeLayer(vectorLayer);
    map.addLayer(vectorLayer);
}

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
        // Laisser la liste et les marqueurs vides au démarrage
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
        var feature = new Feature({
            geometry: new Point(fromLonLat([location.lng, location.lat])),
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
                center: fromLonLat([lon, lat]),
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
            popupOverlay.setPosition(fromLonLat([lon, lat]));
        });

        resultsList.appendChild(listItem); // Ajouter l'élément à la liste HTML
    });
}

// Fonction pour ouvrir Google Maps en vue satellite
// Rendre cette fonction globale pour qu'elle puisse être appelée depuis le HTML du popup
window.openGoogleMaps = function(lat, lng) {
    var googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},17z/data=!3m1!1e3?hl=fr`; // Vue satellite et zoom plus proche
    window.open(googleMapsUrl, '_blank');
};


// --- Écouteurs d'événements ---

// Écouteur pour la barre de recherche
searchInput.addEventListener('keyup', function() {
    var searchTerm = searchInput.value.toLowerCase();

    if (searchTerm === '') {
        resultsSidebar.style.display = 'none';
        vectorSource.clear(); // Supprimer tous les marqueurs
        popupOverlay.setPosition(undefined); // Cacher le popup
        return;
    }

    var filteredLocations = allLocations.filter(location => {
        return location.name.toLowerCase().includes(searchTerm) ||
               location.description.toLowerCase().includes(searchTerm);
    });

    displayMarkersAndList(filteredLocations);
});

// Écouteur pour le sélecteur de style de carte
mapStyleSelector.addEventListener('change', function() {
    var selectedValue = this.value;
    changeOpenLayersBasemap(selectedValue);
});

// Écouteur de clic sur la carte pour les popups
map.on('click', function(evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });
    if (feature) {
        var coordinates = feature.getGeometry().getCoordinates();
        var props = feature.getProperties();
        
        popupContent.innerHTML = `
            <h3>${props.name}</h3>
            <p>${props.description}</p>
            ${props.image ? `<img src="${props.image}" alt="${props.name}">` : ''}
            <button onclick="openGoogleMaps(${toLonLat(coordinates)[1]}, ${toLonLat(coordinates)[0]})">Voir sur Google Maps (Satellite)</button>
        `;
        popupOverlay.setPosition(coordinates);
    } else {
        popupOverlay.setPosition(undefined);
    }
});


// Masquer la sidebar au chargement initial
document.addEventListener('DOMContentLoaded', (event) => {
    resultsSidebar.style.display = 'none';
});
