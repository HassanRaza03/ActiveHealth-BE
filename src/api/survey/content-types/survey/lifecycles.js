const { ApplicationError, ValidationError, PolicyError } =
  require("@strapi/utils").errors;
const moment = require("moment");

module.exports = {
  async beforeUpdate(event) {
    const { params } = event;
    const { data, where } = params;
    const surveyId = where?.id;
    const ctx = strapi.requestContext.get();

    const bodyInfo = ctx?.request?.body;

    const getSurveyData = await strapi.entityService.findOne(
      "api::survey.survey",
      surveyId,
      {
        populate: [
          "group",
          "group.users",
          "text_field",
          "checkbox",
          "checkbox.options",
          "radio",
          "radio.options",
          "range",
          "reaction",
        ],
      }
    );

    if (!data?.publishedAt) {
      const textQuestions = bodyInfo?.text_field ?? [];
      const checkbox = bodyInfo?.checkbox ?? [];
      const range = bodyInfo?.range ?? [];
      const radio = bodyInfo?.radio ?? [];
      const reaction = bodyInfo?.reaction ?? [];

      const allQuestions = [
        ...textQuestions,
        ...checkbox,
        ...range,
        ...radio,
        ...reaction,
      ];

      const independentQuestions = allQuestions?.filter(
        (item) => item?.is_dependent === false
      );

      if (independentQuestions?.length === 0) {
        throw new ApplicationError("Atleast one question must be independent.");
      }

      const onlyQuestions = allQuestions?.map((item) =>
        item?.question?.trim()?.toLowerCase()
      );

      const duplicateQuestionsRemoved = [...new Set([...onlyQuestions])];

      if (onlyQuestions?.length !== duplicateQuestionsRemoved?.length) {
        throw new ApplicationError("Duplicate questions found");
      }

      const dependentQuestions = allQuestions?.filter(
        (item) => item?.is_dependent === true
      );

      for (let question of dependentQuestions) {
        const findChildQuestions = dependentQuestions?.filter(
          (q) => q?.dependent_question === question?.question
        );

        if (findChildQuestions?.length > 0) {
          for (let child of findChildQuestions) {
            if (
              question?.dependent_question?.trim()?.toLowerCase() ===
                child?.question?.trim()?.toLowerCase() &&
              question?.is_dependent === true
            ) {
              throw new ApplicationError(
                "Parent and child questions cannot be dependent of each other " +
                  child?.question +
                  " " +
                  question?.question
              );
            }
          }
        }
      }
    } else {
      const users = getSurveyData?.group?.users;
      const groupId = getSurveyData?.group?.id;

      if (groupId && users?.length > 0) {
        const currentDate = moment().format();
        for (let user of users) {
          const findSubscribeSurvey = await strapi.entityService.findMany(
            "api::subscribe-survey.subscribe-survey",
            {
              filters: {
                user: {
                  id: user?.id,
                },
                survey: {
                  id: surveyId,
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
                  survey: { connect: [{ id: surveyId }] },
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
                  survey: { connect: [{ id: surveyId }] },
                  subscribe_date: currentDate,
                },
              }
            );
          }
        }
      }
    }
  },

  async beforeCreate(event) {
    const { params } = event;
    const { data, where } = params;
    const ctx = strapi.requestContext.get();

    const bodyInfo = ctx?.request?.body;

    if (!data?.publishedAt) {
      const textQuestions = bodyInfo?.text_field ?? [];
      const checkbox = bodyInfo?.checkbox ?? [];
      const range = bodyInfo?.range ?? [];
      const radio = bodyInfo?.radio ?? [];
      const reaction = bodyInfo?.reaction ?? [];

      const allQuestions = [
        ...textQuestions,
        ...checkbox,
        ...range,
        ...radio,
        ...reaction,
      ];

      const independentQuestions = allQuestions?.filter(
        (item) => item?.is_dependent === false
      );

      if (independentQuestions?.length === 0) {
        throw new ApplicationError("Atleast one question must be independent.");
      }

      const onlyQuestions = allQuestions?.map((item) =>
        item?.question?.trim()?.toLowerCase()
      );

      const duplicateQuestionsRemoved = [...new Set([...onlyQuestions])];

      if (onlyQuestions?.length !== duplicateQuestionsRemoved?.length) {
        throw new ApplicationError("Duplicate questions found");
      }

      const dependentQuestions = allQuestions?.filter(
        (item) => item?.is_dependent === true
      );

      for (let question of dependentQuestions) {
        const findChildQuestions = dependentQuestions?.filter(
          (q) => q?.dependent_question === question?.question
        );

        if (findChildQuestions?.length > 0) {
          for (let child of findChildQuestions) {
            if (
              child?.dependent_question?.trim()?.toLowerCase() ===
              question?.question?.trim()?.toLowerCase()
            ) {
              throw new ApplicationError(
                "Parent and child questions cannot be dependent of each other " +
                  child?.question +
                  " " +
                  question?.question
              );
            }
          }
        }
      }
    }
  },
};
