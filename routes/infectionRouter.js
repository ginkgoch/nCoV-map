const Router = require('@koa/router');
const controller = require('../controllers/infectionController');

const router = new Router();

router.get('/infection/timestamps', async ctx => {
    json(ctx, controller.getTimeList());
});

router.get('/infection/provinces/:time', async ctx => {
    let { time } = ctx.params;
    if (time === 'latest') {
        let infectionInfo = controller.getLatestInfectionInfo();
        infectionInfo = controller.filterInfectionInfo(infectionInfo, ctx.request.query);
        json(ctx, infectionInfo);
    } else {
        time = parseInt(time);
        let infectionInfo = controller.getInfectionInfo(time);
        if (infectionInfo === undefined) {
            ctx.throw(404, `No infection data announced at ${new Date(time)}.`);
        } else {            
            infectionInfo = controller.filterInfectionInfo(infectionInfo, ctx.request.query);
            json(ctx, infectionInfo);
        }
    }
});

router.get('/infection/cities/:time', async ctx => {
    let { time } = ctx.params;
    if (time === 'latest') {
        let infectionInfo = controller.getLatestInfectionInfo();
        infectionInfo = controller.filterInfectionCityInfo(infectionInfo, ctx.request.query);
        json(ctx, infectionInfo);
    } else {
        time = parseInt(time);
        let infectionInfo = controller.getInfectionInfo(time);
        if (infectionInfo === undefined) {
            ctx.throw(404, `No infection data announced at ${new Date(time)}.`);
        } else {            
            infectionInfo = controller.filterInfectionCityInfo(infectionInfo, ctx.request.query);
            json(ctx, infectionInfo);
        }
    }
});

module.exports = router;

function json(ctx, body) {
    ctx.body = body;
    ctx.type = 'json';
}