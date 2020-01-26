axios.defaults.baseURL = 'http://localhost:3000/maps/default';
axios.defaults.headers.post['Content-Type'] = 'application/json';

let mapView = L.map('mapContainer').setView([51.505, -0.09], 3);
L.tileLayer('http://localhost:3000/maps/default/{z}/{x}/{y}', {
    attribution: 'Ginkgoch Map',
    id: 'ginkgoch-base-map'
}).addTo(mapView);

