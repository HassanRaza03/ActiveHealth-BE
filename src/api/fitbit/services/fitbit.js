'use strict';

/**
 * fitbit service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::fitbit.fitbit');
