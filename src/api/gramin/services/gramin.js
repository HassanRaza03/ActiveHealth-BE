'use strict';

/**
 * gramin service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::gramin.gramin');
