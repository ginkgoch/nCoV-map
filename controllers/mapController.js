const path = require('path');
const _ = require('lodash');
const infection = require('./infectionController');
const config = require('../shared/mapConfig');
const utils = require('../shared/mapUtils');

const {
    ShapefileFeatureSource, FeatureLayer,
    ClassBreakStyle, FillStyle, TextStyle,
    MapEngine, Srs, Constants
} = require('ginkgoch-map').default.all;

require('ginkgoch-map/native/node').init();

const worldFilePath = `../data/cntry02.shp`;
const provinceFilePath = `../data/chn/gadm36_CHN_1_3857.shp`;
const cityFilePath = `../data/chn/gadm36_CHN_2_3857.shp`;
const SCALE_MAX_CITIES = Constants.DEFAULT_SCALES[config.ZOOM_LEVEL_CITY_MAX];

let controller = {
    getDefaultMap() {
        return utils.getCachedMapEngine('default', () => {
            let layerWorld = controller._getWorldLayer(worldFilePath);
            let layerChina = controller._getProvinceLayer();

            let mapEngine = new MapEngine(256, 256);
            mapEngine.renderContextOptions.antialias = config.ANTIALIAS;
            mapEngine.renderContextOptions.imageSmoothingEnabled = config.IMAGE_SMOOTHING;
            mapEngine.renderContextOptions.quality = config.QUALITY;
            mapEngine.renderContextOptions.patternQuality = config.PATTERN_QUALITY;
            mapEngine.renderContextOptions.textDrawingMode = config.TEXT_DRAWING_MODE;
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
            mapEngine.renderContextOptions.antialias = config.ANTIALIAS;
            mapEngine.renderContextOptions.imageSmoothingEnabled = config.IMAGE_SMOOTHING;
            mapEngine.renderContextOptions.quality = config.QUALITY;
            mapEngine.renderContextOptions.patternQuality = config.PATTERN_QUALITY;
            mapEngine.renderContextOptions.textDrawingMode = config.TEXT_DRAWING_MODE;
            mapEngine.srs = new Srs('EPSG:900913');
            mapEngine.pushLayer(layerWorld);
            mapEngine.pushLayer(layerChinaProvinces);
            mapEngine.pushLayer(layerChinaCities);

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

    _getProvinceLayer(defaultSetting = true) {
        let layer = controller._getChinaLayer(provinceFilePath, defaultSetting);
        let source = layer.source;
        source.dynamicFields.push(controller._getDynamicFieldForProvince('confirmedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForProvince('suspectedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForProvince('curedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForProvince('deadCount'));

        if (!defaultSetting) {
            layer.minimumScale = SCALE_MAX_CITIES + 1;
            layer.styles.push(controller._getClassBreakStyle('confirmedCount'));

            let textStyle = new TextStyle('[NL_NAME_1]', 'black', TextStyle.normalizeFont('ARIAL', config.FONT_SIZE, 'bolder'));
            textStyle.location = config.TEXT_LOCATION;
            textStyle.lineWidth = 2;
            textStyle.strokeStyle = 'white';
            layer.styles.push(textStyle);
            layer.margin = 40;
        }

        return layer;
    },

    _getCityLayer() {
        let layer = controller._getChinaLayer(cityFilePath);
        let source = layer.source;
        source.dynamicFields.push(controller._getDynamicFieldForCity('confirmedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForCity('suspectedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForCity('curedCount'));
        source.dynamicFields.push(controller._getDynamicFieldForCity('deadCount'));

        layer.maximumScale = SCALE_MAX_CITIES;
        layer.styles.push(controller._getClassBreakStyle('confirmedCount'));

        let textStyle = new TextStyle('[NL_NAME_2]', 'black', TextStyle.normalizeFont('ARIAL', config.FONT_SIZE, 'bolder'));
        textStyle.location = config.TEXT_LOCATION;
        textStyle.lineWidth = 2;
        textStyle.strokeStyle = 'white';
        layer.styles.push(textStyle);
        layer.margin = 40;

        return layer;
    },

    _getChinaLayer(filePath, defaultFill = true) {
        filePath = path.resolve(__dirname, filePath);
        let source = new ShapefileFeatureSource(filePath);
        let layer = new FeatureLayer(source);

        defaultFill && layer.styles.push(new FillStyle(config.DEFAULT_FILL, config.DEFAULT_STROKE, config.DEFAULT_STROKE_WIDTH));
        return layer;
    },

    _getDynamicFieldForProvince(field) {
        return {
            name: field, fieldsDependOn: ['NL_NAME_1'], mapper: feature => {
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
            }
        };
    },

    _getDynamicFieldForCity(field) {
        return {
            name: field, fieldsDependOn: ['NL_NAME_2'], mapper: feature => {
                const fullName = feature.properties.get('NL_NAME_2');
                let infectionInfos = infection.getLatestInfectionInfo();
                let infectionCityInfos = _.flatMap(infectionInfos.data, i => i.cities);
                const infectionInfo = _.find(infectionCityInfos, d => {
                    return fullName.includes(d.cityName);
                });

                if (infectionInfo === undefined) {
                    return undefined;
                } else {
                    return infectionInfo[field];
                }
            }
        };
    },

    _getClassBreakStyle(field) {
        const strokeColor = config.DEFAULT_STROKE;
        const strokeWidth = config.DEFAULT_STROKE_WIDTH;

        let redPalette = ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#67000d']
        let bluePalette = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c'];
        
        let activePallette = redPalette;
        let style = new ClassBreakStyle(field);
        style.classBreaks.push({ minimum: 1, maximum: 10, style: new FillStyle(activePallette[0], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 10, maximum: 50, style: new FillStyle(activePallette[1], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 50, maximum: 100, style: new FillStyle(activePallette[2], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 100, maximum: 300, style: new FillStyle(activePallette[3], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 300, maximum: 500, style: new FillStyle(activePallette[4], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 500, maximum: 750, style: new FillStyle(activePallette[5], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 750, maximum: 1000, style: new FillStyle(activePallette[6], strokeColor, strokeWidth) });
        style.classBreaks.push({ minimum: 1000, maximum: Number.MAX_SAFE_INTEGER, style: new FillStyle(activePallette[7], strokeColor, strokeWidth) });
        return style;
    }
}

module.exports = controller;