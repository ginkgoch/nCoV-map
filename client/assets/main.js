axios.defaults.baseURL = 'http://localhost:3000/maps';
axios.defaults.headers.post['Content-Type'] = 'application/json';

let mapView = L.map('mapContainer').setView([37.43997405227057, 108.01757812500001], 4);
L.tileLayer('http://localhost:3000/maps/infection/{z}/{x}/{y}', {
    attribution: 'Ginkgoch Map',
    id: 'ginkgoch-base-map'
}).addTo(mapView);

let highlights = undefined;
mapView.on('click', async ev => {
    let url = '/infection/intersection?' + leafletEx.getEventQueryString(ev);
    let res = await axios.get(url);
    let featureJSON = res.data;

    let highlightStyle = {
        "color": "#1f78b4",
        "opacity": 0.65
    };

    if (highlights !== undefined) {
        highlights.remove();
        highlights = undefined;
    }

    if (featureJSON.features.length > 0) {
        highlights = L.geoJSON(featureJSON, {
            style: highlightStyle
        }).bindPopup(layer => {
            return formatPopupContent(layer.feature.properties);
        }).addTo(mapView).openPopup();
    }
});

function formatPopupContent(content) {
    return `
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">地区</th>
                    <th scope="col">${content.NL_NAME_1 + (content.NL_NAME_2 ? ` (${content.NL_NAME_2})` : '')}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th scope="row">确诊</th>
                    <td>${content.confirmedCount || 0}</td>
                </tr>
                <tr>
                    <th scope="row">疑似</th>
                    <td>${content.suspectedCount || 0}</td>
                </tr>
                <tr>
                    <th scope="row">治愈</th>
                    <td>${content.curedCount || 0}</td>
                </tr>
                <tr>
                    <th scope="row">死亡</th>
                    <td>${content.deadCount || 0}</td>
                </tr>
            </tbody>
        </table>
    `;
}

