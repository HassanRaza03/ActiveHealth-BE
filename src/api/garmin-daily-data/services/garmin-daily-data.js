'use strict';

/**
 * garmin-daily-data service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::garmin-daily-data.garmin-daily-data');
