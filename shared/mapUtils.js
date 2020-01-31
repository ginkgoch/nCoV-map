const gk = require('ginkgoch-map').default.all;
const { FeatureCollection } = gk;

const mapEngineCache = new Map();

module.exports = class MapUtils {

    static convertFeaturesToJSON(features) {
        let featureCollection = new FeatureCollection(features);
        let featuresJSON = featureCollection.toJSON();
        return featuresJSON;
    }

    static getCachedMapEngine(mapEngineName, createMapEngineHandler) {
        if (!mapEngineCache.has(mapEngineName)) {
            let mapEntity = createMapEngineHandler();
            mapEngineCache.set(mapEngineName, mapEntity);
        }
        
        return mapEngineCache.get(mapEngineName);
    }
}