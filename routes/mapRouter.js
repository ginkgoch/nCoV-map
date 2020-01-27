/** Note: 
 * the demo source code is a little different,
 * here I put the code together for easier reading.
 */

const Router = require('@koa/router');
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
    let mapEngine = undefined;
    switch (name) {
        case 'infection':
            mapEngine = mapController.getInfectionMap();
            break;
        default:
            mapEngine = mapController.getDefaultMap();
            break;
    }

    let mapImage = await mapEngine.xyz(x, y, z);

    let buff = ctx.body = mapImage.toBuffer();
    ctx.type = 'png';
    ctx.length = buff.length;
});

router.get('/test', async ctx => {
    let mapEngine = mapController.getInfectionMap();
    let layer = mapEngine.layer('gadm36_CHN_1');
    let source = layer.source;
    await source.open();
    let feature = await source.feature(1, 'all');
    ctx.body = mapController.getFeatureCollection([feature]);
    ctx.type = 'json';
});

module.exports = router;