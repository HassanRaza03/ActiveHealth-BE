const { ApplicationError, ValidationError } = require("@strapi/utils").errors;
const moment = require("moment");

module.exports = {
  async beforeUpdate(event) {
    const { params } = event;
    const { data } = params;

    if (data?.title?.length > 0 && data?.title.trim() === "") {
      throw new ApplicationError("White spaces are not accepted in title");
    }

    event.params.data = {
      ...event.params.data,
      title: data?.title?.trim(),
    };
  },
  async beforeCreate(event) {
    const { params } = event;
    const { data } = params;

    if (data?.title?.length > 0 && data?.title.trim() === "") {
      throw new ApplicationError("White spaces are not accepted in title");
    }

    event.params.data = {
      ...event.params.data,
      title: data?.title?.trim(),
    };
  },

  async afterCreate(event) {
    console.log("Group created");
    const body = event?.params?.data;
    const groupId = event?.result?.id;

    console.log(body);

    const surveyConnects = body?.surveys?.connect;

    console.log({ groupId });
    const groupDetail = await strapi.entityService.findOne(
      "api::group.group",
      groupId,
      {
        populate: ["users", "surveys"],
      }
    );

    const groupUsers = groupDetail?.users;
    console.log(groupDetail);

    if (surveyConnects?.length > 0 && groupUsers?.length > 0) {
      const currentDate = moment().format();

      for (let survey of surveyConnects) {
        const findSurveyInGroup = groupDetail?.surveys?.find(
          (s) => s?.id === survey?.id
        );

        if (!findSurveyInGroup?.publishedAt) continue;

        for (let user of groupUsers) {
          const findSubscribeSurvey = await strapi.entityService.findMany(
            "api::subscribe-survey.subscribe-survey",
            {
              filters: {
                user: {
                  id: user?.id,
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
                  user: { connect: [{ id: user?.id }] },
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
                  user: { connect: [{ id: user?.id }] },
                  survey: { connect: [{ id: survey?.id }] },
                  subscribe_date: currentDate,
                },
              }
            );
          }
        }
      }
    }
  },

  async afterUpdate(event) {
    const body = event?.params?.data;
    const groupId = event?.result?.id;

    const surveyConnects = body?.surveys?.connect;

    console.log({ groupId });
    const groupDetail = await strapi.entityService.findOne(
      "api::group.group",
      groupId,
      {
        populate: ["users", "surveys"],
      }
    );

    const groupUsers = groupDetail?.users;

    if (surveyConnects?.length > 0 && groupUsers?.length > 0) {
      const currentDate = moment().format();

      for (let survey of surveyConnects) {
        const findSurveyInGroup = groupDetail?.surveys?.find(
          (s) => s?.id === survey?.id
        );

        if (!findSurveyInGroup?.publishedAt) continue;

        for (let user of groupUsers) {
          const findSubscribeSurvey = await strapi.entityService.findMany(
            "api::subscribe-survey.subscribe-survey",
            {
              filters: {
                user: {
                  id: user?.id,
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
                  user: { connect: [{ id: user?.id }] },
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
                  user: { connect: [{ id: user?.id }] },
                  survey: { connect: [{ id: survey?.id }] },
                  subscribe_date: currentDate,
                },
              }
            );
          }
        }
      }
    }
  },
};
