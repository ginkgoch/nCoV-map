const path = require('path');
const _ = require('lodash');
const infection = require('./infectionController');
const gk = require('ginkgoch-map').default.all;
const { 
    ShapefileFeatureSource, FeatureLayer, 
    FillStyle, MapEngine, Srs ,
    FeatureCollection, Point,
    Projection
} = gk;

require('ginkgoch-map/native/node').init();

const mapEntityCache = new Map();
 
let controller = {
    getDefaultMap() {
        return controller._getMapEntityByName('default', controller._getDefaultMap);
    },

    _getDefaultMap() {
        let layerCountries = controller._getLayer(`../data/cntry02.shp`, '#f0f0f0', '#636363');
        let layerChn = controller._getChnLayer();

        // Create a engine with size 256 * 256 pixels
        let mapEngine = new MapEngine(256, 256);

        // Init the map rendering spatial reference system
        mapEngine.srs = new Srs('EPSG:900913');

        // Push the feature layer into map
        mapEngine.pushLayer(layerCountries);
        mapEngine.pushLayer(layerChn);
        return mapEngine;
    },

    getInfectionMap() {
        return controller._getMapEntityByName('infection', controller._getInfectionMap);
    },

    _getInfectionMap() {
        let layerCountries = controller._getLayer(`../data/cntry02.shp`, '#f0f0f0', '#636363');
        let layerChn = controller._getChnLayer();
        layerChn.source.dynamicFields.push(controller._getDynamicField('confirmedCount'));
        layerChn.source.dynamicFields.push(controller._getDynamicField('suspectedCount'));
        layerChn.source.dynamicFields.push(controller._getDynamicField('curedCount'));
        layerChn.source.dynamicFields.push(controller._getDynamicField('deadCount'));

        // Create a engine with size 256 * 256 pixels
        let mapEngine = new MapEngine(256, 256);

        // Init the map rendering spatial reference system
        mapEngine.srs = new Srs('EPSG:900913');

        // Push the feature layer into map
        mapEngine.pushLayer(layerCountries);
        mapEngine.pushLayer(layerChn);

        return mapEngine;
    },

    _getMapEntityByName(name, createMapHandler) {
        if (!mapEntityCache.has(name)) {
            let mapEntity = createMapHandler();
            mapEntityCache.set(name, mapEntity);
        }
        
        return mapEntityCache.get(name);
    },

    async xyz(mapEngine, z, x, y) {
        return await mapEngine.xyz(x, y, z);
    },

    async intersection(mapEngine, coordinate, zoom) {
        let features = await mapEngine.intersection(new Point(coordinate.x, coordinate.y), 'WGS84', zoom, 5);
        let projection = new Projection('WGS84', mapEngine.srs.projection);
        features = features.flatMap(f => f.features);
        features.forEach(f => {
            f.geometry = projection.inverse(f.geometry);
        });
        return new FeatureCollection(features).toJSON();
    },

    _getLayer(filePath, fillColor, strokeColor) {
        let sourcePath = path.resolve(__dirname, filePath);

        // Create a feature source instance
        let source = new ShapefileFeatureSource(sourcePath);
        
        // Create a feature layer instance
        let layer = new FeatureLayer(source);

        // Define a style for feature layer
        layer.styles.push(new FillStyle(fillColor, strokeColor, 1));

        return layer;
    },

    _getChnLayer() {
        let filePath = path.resolve(__dirname, '../data/chn/gadm36_CHN_1.shp');
        let source = new ShapefileFeatureSource(filePath);
        source.projection = new Projection('WGS84', 'EPSG:900913');
        let layer = new FeatureLayer(source);
        layer.styles.push(new FillStyle('#f0f0f0', '#636363', 1));
        return layer;
    },

    _getDynamicField(field) {
        return { name: field, fieldsDependOn: ['NL_NAME_1'], mapper: controller._nameAsInfectionMapper(field) };
    },

    _nameAsInfectionMapper(field) {
        return feature => {
            const fullName = feature.properties.get('NL_NAME_1');
            const simplified = fullName.split('|').unshift();
            const infectionInfos = infection.getLatestInfectionInfo();
            const infectionInfo = _.find(infectionInfos.data, d => {
                return simplified.includes(d.provinceShortName);
            });
    
            if (infectionInfo === undefined) {
                return undefined;
            } else {
                return infectionInfo[field];
            }
        };
    }
} 

module.exports = controller;