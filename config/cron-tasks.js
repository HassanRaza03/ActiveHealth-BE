const moment = require("moment");
const _ = require("lodash");
const { getAuthHeaderForRequest } = require("../oauth");
const fetch = require("node-fetch");

const FITBIT_BASE_URL = "https://api.fitbit.com";
const GARMIN_BASE_URL = "https://apis.garmin.com/wellness-api";

const REQUEST_TYPE = {
  GET: "get",
  POST: "post",
  DELETE: "delete",
  PUT: "put",
};

const GET_GARMIN_DAILY_DATA = {
  url: `${GARMIN_BASE_URL}/rest/dailies`,
  method: REQUEST_TYPE.GET,
  data: {},
};

const GET_GARMIN_SLEEP_DATA = {
  url: `${GARMIN_BASE_URL}/rest/sleeps`,
  method: REQUEST_TYPE.GET,
  data: {},
};

const GET_FITBIT_SLEEP_DATA = {
  route: "/1.2/user/-/sleep/date/[date].json",
};

const GET_FITBIT_DAILY_ACTIVITY_DATA = {
  route: "/1/user/-/activities/date/[date].json",
};

const GET_FITBIT_SLEEP_GOAL_DATA = {
  route: "/1.2/user/-/sleep/goal.json",
};

const GET_FITBIT_HR_DATA = {
  route: "/1/user/-/activities/heart/date/[date]/1d/1min.json",
};

const getFitbitData = async () => {
  try {
    const allFitbitTokens = await strapi.entityService.findMany(
      "api::fitbit.fitbit",
      {
        populate: ["user"],
      }
    );

    console.log({ allFitbitTokens });

    if (allFitbitTokens?.length > 0) {
      const yesterdayDate = moment().format("YYYY-MM-DD");

      for (let fitbitData of allFitbitTokens) {
        if (!fitbitData?.user?.id) continue;

        const token = fitbitData?.token;

        const sleep_target = await getFitbitSleepGoalData(token);
        const sleep_value = await getFitbitSleepData(token);
        const { steps, calories_target, calories_value, intensity } =
          await getFitbitActivityData(token);

        const { min_heart_rate, max_heart_rate } = await getFitbitHrData(token);

        console.log({
          sleep_target,
          sleep_value,
          steps,
          calories_target,
          calories_value,
          intensity,
          min_heart_rate,
          max_heart_rate,
        });

        const payload = {};

        if (sleep_target) payload.sleep_target = `${sleep_target}`;
        if (sleep_value) payload.sleep_value = `${sleep_value}`;
        if (steps) payload.steps = `${steps}`;
        if (calories_target) payload.calories_target = `${calories_target}`;
        if (calories_value) payload.calories_value = `${calories_value}`;
        if (intensity) payload.intensity = `${intensity}`;
        if (min_heart_rate) payload.min_heart_rate = `${min_heart_rate}`;
        if (max_heart_rate) payload.max_heart_rate = `${max_heart_rate}`;

        if (_.isEmpty(payload)) {
          continue;
        }

        const getFitbitDailyDataForToday = await strapi.entityService.findMany(
          "api::fitbit-daily-data.fitbit-daily-data",
          {
            filters: {
              createdAt: {
                $gt: yesterdayDate,
              },
              user: {
                id: {
                  $eq: fitbitData?.user?.id,
                },
              },
            },
          }
        );

        if (getFitbitDailyDataForToday?.length > 0) {
          await strapi.entityService.update(
            "api::fitbit-daily-data.fitbit-daily-data",
            getFitbitDailyDataForToday?.[0]?.id,
            {
              data: {
                ...payload,
                user: { connect: [{ id: fitbitData?.user?.id }] },
              },
            }
          );
        } else {
          await strapi.entityService.create(
            "api::fitbit-daily-data.fitbit-daily-data",
            {
              data: {
                ...payload,
                user: { connect: [{ id: fitbitData?.user?.id }] },
              },
            }
          );
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getGarminData = async () => {
  try {
    const allGarminTokens = await strapi.entityService.findMany(
      "api::gramin.gramin",
      {
        populate: ["user"],
      }
    );

    console.log({ allGarminTokens });

    if (allGarminTokens?.length > 0) {
      const yesterdayDate = moment().format("YYYY-MM-DD");

      for (let garminData of allGarminTokens) {
        try {
          if (!garminData?.user?.id) continue;

          const todayCurrentTime = parseInt(
            new Date(moment().local(true)).getTime() / 1000
          );
          const todayStartTime = parseInt(
            new Date(
              moment().local(true).format("YYYY-MM-DD") + "T00:00:00"
            ).getTime() / 1000
          );

          const todayStartDate = moment().format("YYYY-MM-DD");

          const token = {
            key: garminData?.token_key,
            secret: garminData?.token_secret,
          };

          const {
            steps,
            calories_value,
            max_heart_rate,
            min_heart_rate,
            intensity,
          } = await getGarminStepsData(
            token,
            todayStartTime,
            todayCurrentTime,
            todayStartDate
          );

          const sleep = await getGarminSleepData(
            token,
            todayStartTime,
            todayCurrentTime,
            todayStartDate
          );

          const payload = {};

          if (sleep) {
            payload.sleep_target = `${480}`;
            payload.sleep_value = `${sleep}`;
          }

          if (steps) payload.steps = `${steps}`;

          if (calories_value) {
            payload.calories_target = "2500";
            payload.calories_value = `${calories_value}`;
          }
          if (intensity) payload.intensity = `${intensity}`;
          if (min_heart_rate) payload.min_heart_rate = `${min_heart_rate}`;
          if (max_heart_rate) payload.max_heart_rate = `${max_heart_rate}`;

          console.log({ payload });

          if (_.isEmpty(payload)) {
            continue;
          }

          const getGarminDailyDataForToday =
            await strapi.entityService.findMany(
              "api::garmin-daily-data.garmin-daily-data",
              {
                filters: {
                  createdAt: {
                    $gt: yesterdayDate,
                  },
                  user: {
                    id: {
                      $eq: garminData?.user?.id,
                    },
                  },
                },
              }
            );

          if (getGarminDailyDataForToday?.length > 0) {
            await strapi.entityService.update(
              "api::garmin-daily-data.garmin-daily-data",
              getGarminDailyDataForToday?.[0]?.id,
              {
                data: {
                  ...payload,
                  user: { connect: [{ id: garminData?.user?.id }] },
                },
              }
            );
          } else {
            await strapi.entityService.create(
              "api::garmin-daily-data.garmin-daily-data",
              {
                data: {
                  ...payload,
                  user: { connect: [{ id: garminData?.user?.id }] },
                },
              }
            );
          }
        } catch (error) {
          console.log("error", error);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const EVERY_15_MIN = "0 */1 * * * *";

module.exports = {
  "0 */15 * * * *": async () => {
    getFitbitData();
    getGarminData();

    const currentTime = moment().format("HH:mm") + ":00";

    try {
      const subscribeSurveys = await strapi.entityService.findMany(
        "api::subscribe-survey.subscribe-survey",
        {
          filters: {
            survey: {
              publishedAt: {
                $notNull: true,
              },
            },
          },
          populate: ["user", "user.groups", "survey.group", "survey.time"],
        }
      );

      let notifSurveysNotif = [];

      const filteredSubscription = subscribeSurveys?.filter((subs) => {
        const userGroup =
          subs?.user?.groups?.length > 0
            ? subs?.user?.groups
                ?.filter((item) => item?.blocked !== true)
                ?.map((item) => item?.id)
            : [];

        const surveyGroupId = subs?.survey?.group?.id ?? "";

        const subscribeData = moment(subs?.subscribe_date);
        const expireIn = subs?.survey?.expire_in ?? 0;

        const now = moment();
        const days = now.diff(subscribeData, "days");

        if (
          subs?.user?.enable_notification &&
          expireIn > days &&
          subs?.survey?.time?.length > 0 &&
          userGroup?.includes(surveyGroupId) &&
          subs?.survey?.publishedAt
        ) {
          return subs;
        }
      });

      if (filteredSubscription?.length) {
        for (const item of filteredSubscription) {
          if (item?.survey?.time?.find((t) => t?.time?.includes(currentTime))) {
            notifSurveysNotif.push({
              description: "complete this brief survey.",
              user: { connect: [{ id: item?.user?.id }] },
              survey: { connect: [{ id: item?.survey?.id }] },
            });
          }
        }
        for (const item of notifSurveysNotif) {
          try {
            const entry = await strapi.entityService.create(
              "api::notification.notification",
              {
                data: {
                  ...item,
                },
              }
            );
          } catch (error) {
            console.log({ error });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  },

  // "0 55 23 */1 * *": () => {
  //   getFitbitData();
  //   getGarminData();
  // },
  // "0 0 12 */1 * *": () => {
  //   getFitbitData();
  //   getGarminData();
  // },
};

const surveyExample = {
  id: 14,
  subscribe_date: "2023-04-11T21:12:00.000Z",
  createdAt: "2023-04-14T19:10:25.650Z",
  updatedAt: "2023-04-14T19:10:25.650Z",
  user: {
    id: 3,
    username: "hello23@yopmail.com",
    email: "hello23@yopmail.com",
    provider: "local",
    password: "$2a$10$NGgsy0UfWTvX2S98QkPJUOfKn8WkxbpkAo3SxnFYzX8Cr5MM.7sly",
    resetPasswordToken: null,
    confirmationToken: null,
    confirmed: true,
    blocked: false,
    createdAt: "2023-03-31T17:59:19.112Z",
    updatedAt: "2023-04-14T19:47:47.328Z",
    full_name: "DNFDd2",
  },
  survey: {
    id: 3,
    createdAt: "2023-04-13T21:10:37.921Z",
    updatedAt: "2023-04-14T17:29:20.360Z",
    publishedAt: "2023-04-14T17:29:20.338Z",
    title: "test",
    expire_in: 20,
    time: [],
  },
};

const getGarminStepsData = async (
  token,
  todayStartTime,
  todayCurrentTime,
  todayStartDate
) => {
  try {
    const requestUrl = {
      ...GET_GARMIN_DAILY_DATA,
      url: `${GET_GARMIN_DAILY_DATA.url}?uploadStartTimeInSeconds=${todayStartTime}&uploadEndTimeInSeconds=${todayCurrentTime}`,
    };
    const headers = getAuthHeaderForRequest(requestUrl, token);

    const res = await fetch(requestUrl?.url, {
      method: requestUrl?.method,
      headers,
    });

    const response = await res.json();

    console.log({ response });

    if (response?.length) {
      const dataFilter = response?.filter(
        (item) => item?.calendarDate === todayStartDate
      );

      console.log({ dataFilter });

      dataFilter?.sort((a, b) => b?.durationInSeconds - a?.durationInSeconds);

      const data = dataFilter?.[0];
      if (data) {
        const steps = data?.steps ?? 0;

        const intensityInSeconds =
          data?.moderateIntensityDurationInSeconds +
          data?.vigorousIntensityDurationInSeconds;

        const intensity = intensityInSeconds
          ? `${parseInt(intensityInSeconds / 60)}`
          : "";

        const calories_value = data?.activeKilocalories ?? "";

        const heartRateOffsetValues = data?.timeOffsetHeartRateSamples
          ? Object.values(data?.timeOffsetHeartRateSamples)
          : [];

        heartRateOffsetValues.sort((a, b) => a - b);
        const min_heart_rate = heartRateOffsetValues?.[0] ?? 0;
        const max_heart_rate =
          heartRateOffsetValues?.[heartRateOffsetValues?.length - 1] ?? 0;

        return {
          steps,
          calories_value,
          intensity,
          max_heart_rate,
          min_heart_rate,
        };
      } else {
        return {
          steps: "",
          calories_value: "",
          intensity: "",
          max_heart_rate: "",
          min_heart_rate: "",
        };
      }
    } else {
      return {
        steps: "",
        calories_value: "",
        intensity: "",
        max_heart_rate: "",
        min_heart_rate: "",
      };
    }
  } catch (error) {
    console.log("getGarminStepsData error -->>>", error);
    return {
      steps: "",
      calories_value: "",
      intensity: "",
      max_heart_rate: "",
      min_heart_rate: "",
    };
  }
};

const getGarminSleepData = async (
  token,
  todayStartTime,
  todayCurrentTime,
  todayStartDate
) => {
  try {
    const requestUrl = {
      ...GET_GARMIN_SLEEP_DATA,
      url: `${GET_GARMIN_SLEEP_DATA.url}?uploadStartTimeInSeconds=${todayStartTime}&uploadEndTimeInSeconds=${todayCurrentTime}`,
    };
    const headers = getAuthHeaderForRequest(requestUrl, token);

    const res = await fetch(requestUrl?.url, {
      method: requestUrl?.method,
      headers,
    });

    const response = await res.json();

    if (response?.length) {
      const dataFilter = response?.filter(
        (item) => item?.calendarDate === todayStartDate
      );

      console.log({ dataFilter });

      dataFilter?.sort((a, b) => b?.durationInSeconds - a?.durationInSeconds);

      const data = dataFilter?.[0];
      if (data) {
        const duration = data?.durationInSeconds
          ? parseInt(data.durationInSeconds / 60)
          : 0;
        return duration ?? 0;
      } else {
        return null;
      }
    } else {
      // const data = GARMIN_SAMPLE_SLEEP?.[0];
      // const duration = data?.durationInSeconds
      //   ? parseInt(data.durationInSeconds / 60)
      //   : 0;
      // return duration ?? 0;
      return null;
    }
  } catch (error) {
    console.log("getGarminSleepData error -->>>", error);
    return null;
  }
};

const getFitbitSleepData = async (token) => {
  try {
    const currentDate = moment().format("YYYY-MM-DD");
    const endpoint = GET_FITBIT_SLEEP_DATA?.route?.replace(
      "[date]",
      currentDate
    );

    const res = await fetch(FITBIT_BASE_URL + endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await res.json();

    return response?.summary?.totalMinutesAsleep;
  } catch (error) {
    console.log(error);
    return {};
  }
};

const getFitbitSleepGoalData = async (token) => {
  try {
    const endpoint = GET_FITBIT_SLEEP_GOAL_DATA?.route;
    const res = await fetch(FITBIT_BASE_URL + endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await res.json();

    return response?.goal?.minDuration;
  } catch (error) {
    console.log(error);
    return {};
  }
};

const getFitbitActivityData = async (token) => {
  try {
    const currentDate = moment().format("YYYY-MM-DD");
    const endpoint = GET_FITBIT_DAILY_ACTIVITY_DATA?.route?.replace(
      "[date]",
      currentDate
    );

    const res = await fetch(FITBIT_BASE_URL + endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await res.json();

    const calories_target = response?.goals?.caloriesOut;
    const calories_value = response?.summary?.caloriesOut;
    const steps = response?.summary?.steps;

    const intensity =
      response?.summary?.fairlyActiveMinutes +
      response?.summary?.veryActiveMinutes;

    return { calories_target, calories_value, steps, intensity };
  } catch (error) {
    console.log(error);
    return { calories_target: "", calories_value: "", steps: "" };
  }
};

const getFitbitHrData = async (token) => {
  try {
    const currentDate = moment().format("YYYY-MM-DD");
    const endpoint = GET_FITBIT_HR_DATA?.route?.replace("[date]", currentDate);

    const res = await fetch(FITBIT_BASE_URL + endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const response = await res.json();

    if (response?.["activities-heart-intraday"]?.dataset?.length > 0) {
      const heartBeatInterval =
        response?.["activities-heart-intraday"]?.dataset;

      const values = heartBeatInterval?.map((item) => item.value);

      values?.sort((a, b) => a - b);

      const min_heart_rate = values?.[0];
      const max_heart_rate = values?.[values.length - 1];

      return { min_heart_rate, max_heart_rate };
    } else {
      return { min_heart_rate: "", max_heart_rate: "" };
    }

    // return response?.br[0]?.value?.breathingRate;
  } catch (error) {
    console.log(error);
    return { min_heart_rate: "", max_heart_rate: "" };
  }
};
