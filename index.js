const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');

const server = new Koa();

/** 
 * the client html and relative resources are hosted by `static` middleware 
 * beneath the `assets` folder.
 */
server.use(static('./client'));
server.use(bodyParser());

/** 
 * register the tiled map router here
 * in the next section, we are going to build the router.
 */
const mapRouter = require('./routes/mapRouter');
server.use(mapRouter.routes()).use(mapRouter.allowedMethods());
server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});