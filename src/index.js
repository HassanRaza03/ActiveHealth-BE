"use strict";
const admin = require("firebase-admin");
const serviceAccount = require("./activepoint-dev.firebase.json");
const moment = require("moment");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */

  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe({
      models: ["plugin::users-permissions.user"],

      async afterUpdate(event) {
        const currentDate = moment().format();
        const body = event?.params?.data;
        const groups = body?.groups?.connect;
        const userId = event?.result?.id;

        if (groups?.length > 0) {
          for (let group of groups) {
            const getAllSurveysUnFiltered = await strapi.entityService.findMany(
              "api::survey.survey",
              {
                group: {
                  id: { $eq: group?.id },
                },
              }
            );

            const getAllSurveys = getAllSurveysUnFiltered?.filter(
              (s) => s?.publishedAt !== null
            );

            console.log(getAllSurveys);

            if (getAllSurveys?.length > 0) {
              for (let survey of getAllSurveys) {
                const findSubscribeSurvey = await strapi.entityService.findMany(
                  "api::subscribe-survey.subscribe-survey",
                  {
                    filters: {
                      user: {
                        id: userId,
                      },
                      survey: {
                        id: survey?.id,
                      },
                    },
                  }
                );

                if (findSubscribeSurvey?.length > 0) {
                  await strapi.entityService?.update(
                    "api::subscribe-survey.subscribe-survey",
                    findSubscribeSurvey?.[0]?.id,
                    {
                      data: {
                        user: { connect: [{ id: userId }] },
                        survey: { connect: [{ id: survey?.id }] },
                        subscribe_date: currentDate,
                      },
                    }
                  );
                } else {
                  await strapi.entityService.create(
                    "api::subscribe-survey.subscribe-survey",
                    {
                      data: {
                        user: { connect: [{ id: userId }] },
                        survey: { connect: [{ id: survey?.id }] },
                        subscribe_date: currentDate,
                      },
                    }
                  );
                }
              }
            }
          }
        }
      },

      async afterCreate(event) {
        console.log(event);
        try {
          const currentDate = moment().format();
          const body = event?.params?.data;
          const groups = body?.groups?.connect;
          const userId = event?.result?.id;

          console.log({ userId });

          console.log({ userId, groups });

          if (groups?.length > 0) {
            for (let group of groups) {
              const getAllSurveysUnFiltered =
                await strapi.entityService.findMany("api::survey.survey", {
                  group: {
                    id: { $eq: group?.id },
                  },
                });

              const getAllSurveys = getAllSurveysUnFiltered?.filter(
                (s) => s?.publishedAt !== null
              );

              console.log(getAllSurveys);

              if (getAllSurveys?.length > 0) {
                for (let survey of getAllSurveys) {
                  const findSubscribeSurvey =
                    await strapi.entityService.findMany(
                      "api::subscribe-survey.subscribe-survey",
                      {
                        filters: {
                          user: {
                            id: userId,
                          },
                          survey: {
                            id: survey?.id,
                          },
                        },
                      }
                    );

                  if (findSubscribeSurvey?.length > 0) {
                    await strapi.entityService?.update(
                      "api::subscribe-survey.subscribe-survey",
                      findSubscribeSurvey?.[0]?.id,
                      {
                        data: {
                          user: { connect: [{ id: userId }] },
                          survey: { connect: [{ id: survey?.id }] },
                          subscribe_date: currentDate,
                        },
                      }
                    );
                  } else {
                    await strapi.entityService.create(
                      "api::subscribe-survey.subscribe-survey",
                      {
                        data: {
                          user: { connect: [{ id: userId }] },
                          survey: { connect: [{ id: survey?.id }] },
                          subscribe_date: currentDate,
                        },
                      }
                    );
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      },
    });

    // ****************NOTIFICATIONS******************
    let firebase = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    //Make Firebase available everywhere
    strapi.firebase = firebase;
    let messaging = firebase.messaging();

    let sendNotification = async (fcm, data) => {
      let message = {
        ...data,
        tokens: [...fcm],
      };
      try {
        const res = await messaging.sendMulticast(message);
      } catch (e) {
        console.log(e);
      }
    };

    let sendSingleNotification = async (fcm, data) => {
      let message = {
        ...data,
        token: fcm,
      };
      try {
        const res = await messaging.send(message);
      } catch (e) {
        console.log(e);
      }
    };

    strapi.notification = {
      sendNotification,
      sendSingleNotification,
    };
  },
};
