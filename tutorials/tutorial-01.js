const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const GK = require('ginkgoch-map').default.all;
require('ginkgoch-map/native/node').init();

async function main() {
    const [imageWidth, imageHeight] = [512, 512];

    // create a world layer with cntry02.shp
    let worldLayer = createLayerWithDefaultStyle('../data/cntry02.shp');

    // create a province layer with gadm36_CHN_1_3857.shp
    let provinceLayer = createLayerWithDefaultStyle('../data/chn/gadm36_CHN_1_3857.shp');
    connectDynamicData(provinceLayer);

    let taiwanLayer = createLayerWithDefaultStyle('../data/chn/TWN_adm1_3857.shp');
    taiwanLayer.source.dynamicFields.push({ name: 'confirmedCount', fieldsDependOn: [], mapper: f => 15 });
    taiwanLayer.source.dynamicFields.push({ name: 'NL_NAME_2', fieldsDependOn: [], mapper: f => '台湾' });

    // add fill color based confirmed count level
    let confirmedCountStyle = _getClassBreakStyle('confirmedCount');
    provinceLayer.styles.push(confirmedCountStyle);
    taiwanLayer.styles.push(confirmedCountStyle);

    let getLabelStyle = fieldName => {
        let labelStyle = new GK.TextStyle(fieldName, 'black', 'Arial 12px');
        labelStyle.lineWidth = 2;
        labelStyle.strokeStyle = 'white';
        labelStyle.location = 'interior';
        return labelStyle;
    };

    // add province label
    let provinceLabelStyle = getLabelStyle('[NL_NAME_1]');
    provinceLayer.styles.push(provinceLabelStyle);

    let taiwanLabelStyle = getLabelStyle('[NL_NAME_2]');
    taiwanLayer.styles.push(taiwanLabelStyle);

    let mapEngine = new GK.MapEngine(imageWidth, imageHeight);
    mapEngine.srs = new GK.Srs('EPSG:900913');
    mapEngine.pushLayer(worldLayer);
    mapEngine.pushLayer(provinceLayer);
    mapEngine.pushLayer(taiwanLayer);

    await provinceLayer.open();
    let chinaEnvelope = await provinceLayer.envelope();
    chinaEnvelope = GK.ViewportUtils.adjustEnvelopeToMatchScreenSize(chinaEnvelope, imageWidth, imageHeight);

    let image = await mapEngine.image(chinaEnvelope);
    fs.writeFileSync(path.resolve(__dirname, './images/tutorial-01-china-confirmed.png'), image.toBuffer());
}

function createLayerWithDefaultStyle(filePath) {
    // create a source with the specified shapefile file path
    let source = new GK.ShapefileFeatureSource(path.resolve(__dirname, filePath));

    // wrap the source as a world layer
    let layer = new GK.FeatureLayer(source);

    // set a style on the layer
    layer.styles.push(new GK.FillStyle('#f0f0f0', '#636363', 1));

    return layer;
}

function connectDynamicData(layer) {
    // load dynamic data
    let dynamicData = fs.readFileSync(path.resolve(__dirname, '../data/infected/1580376765333.json')).toString();
    dynamicData = JSON.parse(dynamicData);
    
    // connect 4 dynamic attribute fields to the source.
    const source = layer.source;
    source.dynamicFields.push(_getDynamicFieldForProvince('confirmedCount', dynamicData));
    source.dynamicFields.push(_getDynamicFieldForProvince('suspectedCount', dynamicData));
    source.dynamicFields.push(_getDynamicFieldForProvince('curedCount', dynamicData));
    source.dynamicFields.push(_getDynamicFieldForProvince('deadCount', dynamicData));
}

/**
 * field - the dynamic field value to return.
 * infectedData - the infected data in JSON format.
 */
function _getDynamicFieldForProvince(field, infectedData) {
    return {
        name: field, fieldsDependOn: ['NL_NAME_1'], mapper: feature => {
            const fullName = feature.properties.get('NL_NAME_1');
            const infectionInfo = _.find(infectedData, d => {
                return fullName.includes(d.provinceShortName);
            });

            if (infectionInfo === undefined) {
                return undefined;
            } else {
                return infectionInfo[field];
            }
        }
    };
}

function _getClassBreakStyle(field) {
    const strokeColor = '#636363';
    const strokeWidth = 1;

    let countStops = [1, 10, 50, 100, 300, 500, 750, 1000, Number.MAX_SAFE_INTEGER];
    let activePallette = ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#67000d'];
    // let activePallette = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c'];
    let style = new GK.ClassBreakStyle(field);

    for (let i = 1; i < countStops.length; i++) {
        style.classBreaks.push({ minimum: countStops[i - 1], maximum: countStops[i], style: new GK.FillStyle(activePallette[i - 1], strokeColor, strokeWidth) });
    }

    return style;
}

main();