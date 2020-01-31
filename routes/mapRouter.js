/** Note: 
 * the demo source code is a little different,
 * here I put the code together for easier reading.
 */
const _ = require('lodash');
const Router = require('@koa/router');
const mapUtils = require('../shared/mapUtils');
const mapController = require('../controllers/mapController');

/** 
 * due to the RESTful service is stateless,
 * whenever getting one tile will create a map instance 
 * which will slow down the performance.
 * so here we create a cache for map instances just reuse the map instance
 */
const router = new Router();

router.get('/maps/:name/:z/:x/:y', async ctx => {
    let { name, x, y, z } = ctx.params;

    let mapEngine = mapController.getMapEngineByName(name);
    let mapImage = await mapEngine.xyz(x, y, z);

    let buff = ctx.body = mapImage.toBuffer();
    ctx.type = 'png';
    ctx.length = buff.length;
});

router.get('/maps/:name/intersection', async ctx => {
    let { name } = ctx.params;
    let { lat, lng, zoom } = ctx.request.query;
    let mapEngine = mapController.getMapEngineByName(name);
    let intersectedFeatures = await mapController.getIntersectedFeaturesInWGS84(parseFloat(lat), parseFloat(lng), parseInt(zoom), mapEngine, true);

    ctx.type = 'json';
    ctx.body = mapUtils.convertFeaturesToJSON(_.flatMap(intersectedFeatures, l => l.features));
});

router.get('/maps/infection/legends', async ctx => {
    let breakItems = mapController._getClassBreakStyle('confirmedCount').classBreaks;
    let values = [];
    let colors = [];

    for (let breakItem of breakItems) {
        if (values.length === 0) {
            values.push(breakItem.minimum);
        }

        values.push(breakItem.maximum);
        colors.push(breakItem.style.fillStyle);
    }

    ctx.body = {values, colors};
    ctx.type = 'json';
});

module.exports = router;