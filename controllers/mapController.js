const path = require('path');
const _ = require('lodash');
const infection = require('./infectionController');
const config = require('../shared/mapConfig');
const utils = require('../shared/mapUtils');

const { 
    ShapefileFeatureSource, FeatureLayer,
    ClassBreakStyle, FillStyle, TextStyle,
    MapEngine, Srs
} = require('ginkgoch-map').default.all;

require('ginkgoch-map/native/node').init();

const worldFilePath = `../data/cntry02.shp`;
const provinceFilePath = `../data/chn/gadm36_CHN_1_3857.shp`;
const cityFilePath = `../data/chn/gadm36_CHN_2_3857.shp`;
 
let controller = {
    getDefaultMap() {
        return utils.getCachedMapEngine('default', () => {
            let layerWorld = controller._getWorldLayer(worldFilePath);
            let layerChina = controller._getProvinceLayer();

            let mapEngine = new MapEngine(256, 256);
            mapEngine.srs = new Srs('EPSG:900913');
            mapEngine.pushLayer(layerWorld);
            mapEngine.pushLayer(layerChina);

            return mapEngine;
        });
    },

    getInfectionMap() {
        return utils.getCachedMapEngine('infection', () => {
            let layerWorld = controller._getWorldLayer(worldFilePath);
            let layerChinaProvinces = controller._getProvinceLayer(false);
            let layerChinaCities = controller._getCityLayer(false);

            let mapEngine = new MapEngine(256, 256);
            mapEngine.srs = new Srs('EPSG:900913');
            mapEngine.pushLayer(layerWorld);
            mapEngine.pushLayer(layerChinaProvinces);

            return mapEngine;
        });
    },

    _getWorldLayer(filePath) {
        let sourcePath = path.resolve(__dirname, filePath);
        let source = new ShapefileFeatureSource(sourcePath);
        let layer = new FeatureLayer(source);
        layer.styles.push(new FillStyle(config.DEFAULT_FILL, config.DEFAULT_STROKE, config.DEFAULT_STROKE_WIDTH));
        return layer;
    },

    _getProvinceLayer(defaultFill = true) {
        let layer = controller._getChinaLayer(provinceFilePath, defaultFill);
        let source = layer.source;
        source.dynamicFields.push(controller._getDynamicField('confirmedCount'));
        source.dynamicFields.push(controller._getDynamicField('suspectedCount'));
        source.dynamicFields.push(controller._getDynamicField('curedCount'));
        source.dynamicFields.push(controller._getDynamicField('deadCount'));

        if (!defaultFill) {
            layer.styles.push(controller._getClassBreakStyle('confirmedCount'));

            let textStyle = new TextStyle('[NL_NAME_1]', 'black', TextStyle.normalizeFont('ARIAL', 16, 'bolder'));
            textStyle.lineWidth = 1;
            textStyle.strokeStyle = 'white';
            layer.styles.push(textStyle);
            layer.margin = 40;
        }

        return layer;
    },

    _getCityLayer(defaultFill = true) {
        let layer = controller._getChinaLayer(cityFilePath, defaultFill);
        return layer;
    },

    _getChinaLayer(filePath, defaultFill = true) {
        filePath = path.resolve(__dirname, filePath);
        let source = new ShapefileFeatureSource(filePath);
        let layer = new FeatureLayer(source);

        defaultFill && layer.styles.push(new FillStyle('#f0f0f0', '#636363', 1));
        return layer;
    },

    _getDynamicField(field) {
        return { name: field, fieldsDependOn: ['NL_NAME_1'], mapper: feature => {
            const fullName = feature.properties.get('NL_NAME_1');
            const infectionInfos = infection.getLatestInfectionInfo();
            const infectionInfo = _.find(infectionInfos.data, d => {
                return fullName.includes(d.provinceShortName);
            });
    
            if (infectionInfo === undefined) {
                return undefined;
            } else {
                return infectionInfo[field];
            }
        }};
    },

    _getClassBreakStyle(field) {
        const strokeColor = config.DEFAULT_STROKE;
        const strokeWidth = config.DEFAULT_STROKE_WIDTH;

        let style = new ClassBreakStyle(field);
        style.classBreaks.push({ minimum: 1, maximum: 10, style: new FillStyle('#fff5f0', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 10, maximum: 50, style: new FillStyle('#fee0d2', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 50, maximum: 100, style: new FillStyle('#fcbba1', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 100, maximum: 300, style: new FillStyle('#fc9272', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 300, maximum: 500, style: new FillStyle('#fb6a4a', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 500, maximum: 750, style: new FillStyle('#ef3b2c', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 750, maximum: 1000, style: new FillStyle('#cb181d', strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 1000, maximum: Number.MAX_SAFE_INTEGER, style: new FillStyle('#67000d', strokeColor, strokeWidth) });
        return style;
    }
} 

module.exports = controller;