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

    getIntersectedFeatures(ev) {
        let eventArgs = leafletEx.getEventArgs(ev);
    }
}