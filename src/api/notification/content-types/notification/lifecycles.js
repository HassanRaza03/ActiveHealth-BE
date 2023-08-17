module.exports = {
  async afterCreate(event) {
    const { data } = event.params;
    const result = event.result;
    const userId = data?.user?.connect?.[0]?.id || data?.user;
    const surveyId = data?.survey?.connect?.[0]?.id || data?.survey;

    console.log({ surveyId, data });

    try {
      const getSurvey = await strapi.entityService.findOne(
        "api::survey.survey",
        surveyId
      );

      console.log({ getSurvey });

      const allCurrAdminUserFCMS = await strapi.entityService.findMany(
        "api::device-token.device-token",
        {
          filters: {
            user: userId,
          },
          populate: { user: true },
        }
      );

      if (allCurrAdminUserFCMS?.length) {
        let adminfcms = [];
        for (let item of allCurrAdminUserFCMS) {
          if (item?.fcm) {
            adminfcms.push(item?.fcm);
          }
        }
        console.log({ allCurrAdminUserFCMS });
        if (userId && allCurrAdminUserFCMS?.length) {
          // console.log();
          if (adminfcms?.length < 2) {
            const resp = await strapi.notification.sendSingleNotification(
              adminfcms[0],
              {
                data: {
                  result: `${JSON.stringify(event.result)}`,
                  title: getSurvey?.title,
                  text: `${event.result?.description}`,
                  surveyId: `${surveyId}`,
                  notificationId: `${result?.id}`,
                },
                notification: {
                  body: `${event.result?.description}`,
                  title: getSurvey?.title,
                },
              }
            );
            console.log({ resp });
          } else {
            const resp = await strapi.notification.sendNotification(adminfcms, {
              data: {
                result: `${JSON.stringify(event.result)}`,
                text: `${event.result?.description}`,
                title: getSurvey?.title,
                surveyId: `${surveyId}`,
                notificationId: `${result?.id}`,
              },
              notification: {
                body: `${event.result?.description}`,
                title: getSurvey?.title,
              },
            });
          }
          // if (userId) {
          //   strapi.$io
          //     .raw(`send_notification_${userId}`, event.result)
          //     .catch((err) => {
          //       console.log({ err });
          //     });
          // }
        }
      }

      const getUserInfo = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );
      console.log({ getUserInfo });

      const newCount = getUserInfo?.notification_count
        ? getUserInfo?.notification_count + 1
        : 1;

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            notification_count: newCount,
          },
        }
      );
    } catch (error) {
      console.log({ error });
    }
  },
};
