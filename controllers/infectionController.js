const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const dataDirPath = path.resolve(__dirname, '../data/infected');

const infectionCache = new Map();

module.exports = class InfectionController {
    static getDataPaths() {
        let dataFilePaths = fs.readdirSync(dataDirPath);
        dataFilePaths = dataFilePaths.map(f => path.join(dataDirPath, f))
            .filter(f => fs.statSync(f).isFile() && f.endsWith('.json'));
        return dataFilePaths
    }

    static getTimeList() {
        let timeList = this.getDataPaths()
            .map(f => path.basename(f, '.json'))
            .map(n => parseInt(n)).sort();

        return timeList;
    }

    static getInfectionInfo(time) {
        if (!infectionCache.has(time)) {
            let infectionData = this._getInfectionInfo(time);
            if (infectionData === undefined) {
                return undefined;
            }

            infectionCache.set(time, infectionData);
        }

        return infectionCache.get(time);
    }

    static _getInfectionInfo(time) {
        let timeList = this.getTimeList();
        if (!timeList.includes(time)) {
            return undefined;
        }

        let infectionDataFilePath = path.join(dataDirPath, time + '.json');
        let infectionDataContent = fs.readFileSync(infectionDataFilePath);
        let infectionJSON = JSON.parse(infectionDataContent);
        let infectionSummary = this.getInfectionSummary(infectionJSON);
        return { timestamp: time, summary: infectionSummary, data: infectionJSON };
    }

    static getLatestInfectionInfo() {
        let timeList = InfectionController.getTimeList();
        if (timeList.length === 0) {
            return undefined;
        }

        let latestTime = timeList[timeList.length - 1];
        let latestInfectionInfo = this.getInfectionInfo(latestTime);
        return latestInfectionInfo;
    }

    static getInfectionSummary(infectionJSON) {
        let totalConfirmedCount = 0;
        let totalSuspectedCount = 0;
        let totalCuredCount = 0;
        let totalDeadCount = 0;

        for (let item of infectionJSON) {
            totalConfirmedCount += item.confirmedCount;
            totalSuspectedCount += item.suspectedCount;
            totalCuredCount += item.curedCount;
            totalDeadCount += item.deadCount;
        }

        return { totalConfirmedCount, totalSuspectedCount, totalCuredCount, totalDeadCount };
    }

    static filterInfectionInfo(infectionInfo, query) {
        let fields = ['provinceName', 'provinceShortName', 'confirmedCount', 'suspectedCount', 'curedCount', 'deadCount'];
        if (query.fields !== undefined) {
            fields = query.fields.split(',');
        }
    
        if (!fields.includes('all')) {
            infectionInfo.data = infectionInfo.data.map(i => _.pick(i, fields));
        }
    }
}