function getLegendControl(params) {
    let legend = L.control({position: 'bottomright'});
    legend.onAdd = function () {
        let div = L.DomUtil.create('div', 'info legend');
        let colors = params.colors;
        let grades = params.values;
        grades.length -= 1;
    
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + colors[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
    
        return div;
    };

    return legend;
}

const leafletEx = {
    getEventArgs(ev) {
        return {
            latlng: ev.latlng,
            zoom: ev.sourceTarget.getZoom(),
            size: ev.sourceTarget.getSize()
        };
    },

    getEventQueryString(ev) {
        let {lat, lng} = ev.latlng;
        let size = ev.sourceTarget.getSize();
        return `lat=${lat}&lng=${lng}&zoom=${ev.sourceTarget.getZoom()}&width=${size.x}&height=${size.y}`;
    },

    getLegendControl
};