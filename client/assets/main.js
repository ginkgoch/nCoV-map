axios.defaults.baseURL = 'http://localhost:3000/maps/default';
axios.defaults.headers.post['Content-Type'] = 'application/json';

let mapView = L.map('mapContainer').setView([37.43997405227057, 108.01757812500001], 4);
L.tileLayer('http://localhost:3000/maps/infection/{z}/{x}/{y}', {
    attribution: 'Ginkgoch Map',
    id: 'ginkgoch-base-map'
}).addTo(mapView);

