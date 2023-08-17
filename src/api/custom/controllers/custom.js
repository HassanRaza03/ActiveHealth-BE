const moment = require("moment");
const _ = require("lodash");

function generateOTP() {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

module.exports = {
  async getOtp() {
    const ctx = strapi.requestContext.get();

    const successMessage = (otp) => ({
      status: true,
      message: "Otp sent successfully.",
      otp,
    });
    try {
      const { email, isSignup } = ctx.request.body;

      if (isSignup) {
        const user = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: {
              email,
            },
          }
        );

        if (user?.length) {
          return ctx.badRequest("User is already registered.");
        }
        const getUserOtpInfo = await strapi.entityService.findMany(
          "api::otp.otp",
          {
            filters: {
              email,
            },
          }
        );

        if (!getUserOtpInfo?.length) {
          const otp = generateOTP();
          await strapi.entityService.create("api::otp.otp", {
            data: {
              email,
              otp,
              isUsed: false,
            },
          });

          await strapi.api["custom"].services.mail.signupOtp(email, otp);

          return ctx.send(successMessage(otp));
        } else {
          const otpInfo = getUserOtpInfo?.[0];
          const otp = generateOTP();
          await strapi.entityService.update("api::otp.otp", otpInfo?.id, {
            data: {
              otp,
              isUsed: false,
            },
          });

          console.log("i am here");

          await strapi.api["custom"].services.mail.signupOtp(email, otp);

          return ctx.send(successMessage(otp));
        }
      } else {
        const getAllUsersWithEmail = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: {
              email,
            },
          }
        );

        if (!getAllUsersWithEmail?.length) {
          return ctx.badRequest("User not found with this email");
        }

        const user = getAllUsersWithEmail?.[0];

        const findOtpOfUser = await strapi.entityService.findMany(
          "api::otp.otp",
          {
            filters: {
              email: { $eq: user?.email },
            },
          }
        );

        if (!findOtpOfUser?.length) {
          const otp = generateOTP();
          await strapi.entityService.create("api::otp.otp", {
            data: {
              otp,
              email: email,
              isUsed: false,
            },
          });

          await strapi.api["custom"].services.mail.forgotPasswordOtp(
            email,
            otp
          );

          return ctx.send(successMessage(otp));
        } else {
          const otpInfo = findOtpOfUser?.[0];
          const otp = generateOTP();
          await strapi.entityService.update("api::otp.otp", otpInfo?.id, {
            data: {
              otp,
              isUsed: false,
            },
          });

          await strapi.api["custom"].services.mail.forgotPasswordOtp(
            email,
            otp
          );

          return ctx.send(successMessage(otp));
        }
      }
    } catch (error) {
      console.log(error, error?.details?.errors?.[0]);

      return ctx.badRequest(error);
    }
  },

  async confirmOtp() {
    const ctx = strapi.requestContext.get();

    try {
      const { otp, email } = ctx.request.body;

      const allOtpUserInfo = await strapi?.entityService?.findMany(
        "api::otp.otp",
        {
          filters: {
            email: {
              $eq: email,
            },
          },
        }
      );

      if (!allOtpUserInfo?.length) {
        return ctx.badRequest("User Otp does not exist");
      }

      const otpUserInfo = allOtpUserInfo?.[0];

      if (otpUserInfo?.otp === otp) {
        if (
          moment().isAfter(moment(otpUserInfo?.updatedAt).add(5, "minutes")) ||
          otpUserInfo?.isUsed
        ) {
          return ctx.badRequest("Otp is expired.");
        }

        await strapi.entityService.update("api::otp.otp", otpUserInfo?.id, {
          data: {
            isUsed: true,
          },
        });
        return ctx.send({
          status: true,
          message: "Otp verified successfully.",
        });
      } else {
        return ctx.badRequest("Invalid OTP");
      }
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async resetPassword() {
    const ctx = strapi.requestContext.get();

    const { email, password } = ctx.request.body;

    try {
      const userWithSameEmail = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        {
          filters: {
            email: email,
          },
        }
      );

      if (!userWithSameEmail?.length) {
        return ctx.badRequest("Invalid email");
      }

      const user = userWithSameEmail?.[0];

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        user?.id,
        {
          data: {
            password,
          },
        }
      );

      return ctx.send({
        status: true,
        message: "Password updated successfully.",
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async updateProfile() {
    const ctx = strapi.requestContext.get();

    try {
      const userId = ctx.state.user.id;

      const { fullName, groups, photo, isNotifUpdate, notification_enabled } =
        ctx.request.body;

      console.log({ fullName, groups, photo, userId });

      if (isNotifUpdate) {
        await strapi.entityService.update(
          "plugin::users-permissions.user",
          userId,
          {
            data: {
              enable_notification: notification_enabled,
            },
          }
        );

        return ctx.send({
          status: true,
          message: notification_enabled
            ? "Notification enabled successfully."
            : "Notification disabled successfully.",
        });
      }

      if (!fullName) {
        return ctx.badRequest("Full Name is required.");
      }

      const payload = {
        full_name: fullName,
        groups,
      };

      if (photo !== null && photo !== "" && photo !== undefined) {
        payload.photo = photo;
      }

      console.log({ payload });

      const response = await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            ...payload,
          },
        }
      );

      console.log(response);

      return ctx.send({
        status: true,
        message: "User updated successfully.",
      });
    } catch (error) {
      console.log("User update custom request", error);
      return ctx.badRequest(error);
    }
  },

  async getUserGroupSurveys() {
    const ctx = strapi.requestContext.get();

    try {
      const { groupIds, userId } = ctx.query;

      if (!groupIds) {
        return ctx.send({
          message: "data not found",
          data: [],
          status: true,
        });
      }

      const ids = groupIds?.split(",");

      const surveys = await strapi.entityService.findMany(
        "api::survey.survey",
        {
          filters: {
            publishedAt: {
              $notNull: true,
            },
            group: {
              id: {
                $in: ids,
              },
            },
          },
          populate: [
            "text_field",
            "reaction",
            "checkbox.options",
            "radio",
            "radio.options",
            "time",
            "range",
            "subscribe_surveys",
            "title",
          ],
        }
      );

      const surveyIds = [...surveys].map((i) => i?.id);

      const subscribeSurvey = await strapi.entityService.findMany(
        "api::subscribe-survey.subscribe-survey",
        {
          filters: {
            $and: [
              {
                survey: {
                  id: {
                    $in: surveyIds,
                  },
                },
              },

              {
                user: {
                  id: {
                    $eq: userId,
                  },
                },
              },
            ],
          },
          populate: ["survey"],
        }
      );

      let surveyToSend = [];

      if (subscribeSurvey?.length > 0 && surveys?.length > 0) {
        for (let survey of surveys) {
          const findInSubscription = subscribeSurvey?.find(
            (subscribe) => subscribe?.survey?.id === survey?.id
          );

          if (findInSubscription) {
            const now = moment();
            const subscriptionDate = moment(findInSubscription?.subscribe_date);

            const days = now.diff(subscriptionDate, "days");
            console.log({ days });

            if (findInSubscription?.survey?.expire_in > days) {
              surveyToSend.push(survey);
            }
          } else {
            surveyToSend.push(survey);
          }
        }
      } else {
        surveyToSend = surveys;
      }

      surveyToSend.sort(
        (a, b) => new Date(b?.publishedAt) - new Date(a?.publishedAt)
      );

      return ctx.send({
        status: true,
        data: surveyToSend,
        message: "Surveys found.",
      });
    } catch (error) {
      console.log(error);
      console.error("Error in getUserGroupSurveys", error);
      return ctx.badRequest(error);
    }
  },

  async getUserCompletedSurveys() {
    const ctx = strapi.requestContext.get();

    try {
      const { userId } = ctx.query;
      const surveys = await strapi.entityService.findMany(
        "api::answer.answer",
        {
          filters: {
            user: {
              id: {
                $eq: userId,
              },
            },
          },
          populate: [
            "survey_title",
            "question_info",
            "question_info.answers",
            "subscribe_survey",
          ],
        }
      );
      const dataObj = {};

      for (let survey of surveys) {
        const subscribeId = survey?.subscribe_survey?.id;

        if (dataObj[subscribeId]?.data?.length > 0) {
          dataObj[subscribeId].data.push(survey);
        } else {
          dataObj[subscribeId] = {
            data: [survey],
          };
        }
      }

      const ObjectKeys = Object.keys(dataObj);

      for (let key of ObjectKeys) {
        const data = [...dataObj?.[key]?.data];

        const sortedData = data?.sort(
          (a, b) => new Date(b?.createdAt) - new Date(a?.createdAt)
        );
        dataObj[key] = {
          data: sortedData,
          lastUpdate: sortedData?.[0]?.createdAt,
          key,
        };
      }

      const dataValues = Object.values(dataObj);

      dataValues.sort(
        (a, b) => new Date(b?.lastUpdate) - new Date(a?.lastUpdate)
      );

      console.log({ dataValues });

      const objectToSend = {};

      for (let value of dataValues) {
        objectToSend[value?.key] = value?.data;
      }

      console.log(objectToSend);

      // surveys.sort((a, b) => b?.id - a?.id);

      return ctx.send({
        status: true,
        data: dataValues,
        message: "Completed survey data",
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async updateToken() {
    const ctx = strapi.requestContext.get();

    try {
      const { fcm, user } = ctx.request.body;

      console.log({ fcm, user });

      const findSameTokens = await strapi.entityService.findMany(
        "api::device-token.device-token",
        {
          filters: {
            fcm: {
              $eq: fcm,
            },
          },
        }
      );

      console.log({ findSameTokens });

      if (findSameTokens?.length > 0) {
        await strapi.entityService.update(
          "api::device-token.device-token",
          findSameTokens?.[0]?.id,
          {
            data: {
              fcm,
              user: user,
            },
          }
        );
      } else {
        await strapi.entityService.create("api::device-token.device-token", {
          data: {
            fcm,
            user: user,
          },
        });
      }

      return ctx.send({
        status: true,
        data: [fcm],
        message: "device token added.",
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async deleteDeviceToken() {
    const ctx = strapi.requestContext.get();

    try {
      const { userId, fcm } = ctx.request?.body;
      console.log(ctx.body);

      if (!userId) {
        return ctx.badRequest("User is required.");
      }

      if (!fcm) {
        return ctx.badRequest("token is required");
      }

      const userDeviceTokens = await strapi.entityService.findMany(
        "api::device-token.device-token",
        {
          filters: {
            user: {
              id: {
                $eq: userId,
              },
            },
            fcm: {
              $eq: fcm,
            },
          },
        }
      );

      console.log(userDeviceTokens);

      if (userDeviceTokens?.length > 0) {
        for (let token of userDeviceTokens) {
          await strapi.entityService.delete(
            "api::device-token.device-token",
            token?.id
          );
        }
      }

      return ctx.send({ status: true, message: "Token deleted successfully." });
    } catch (error) {
      console.log({ error });

      return ctx.badRequest(error);
    }
  },

  async getNotificationCount() {
    const ctx = strapi.requestContext.get();

    try {
      const { userId } = ctx.params;

      const userInfo = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      return ctx.send({
        status: true,
        message: "Notification count",
        data: {
          notificationCount: userInfo?.notification_count || 0,
        },
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async clearNotificationCount() {
    const ctx = strapi.requestContext.get();

    try {
      const { userId } = ctx.params;

      const userInfo = await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            notification_count: 0,
          },
        }
      );

      return ctx.send({
        status: true,
        message: "Notification cleared successfully",
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },

  async readNotificationCount() {
    const ctx = strapi.requestContext.get();

    try {
      const { userId } = ctx.params;

      const getUser = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      const calculateCount = getUser?.notification_count
        ? getUser?.notification_count - 1
        : getUser?.notification_count;

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            notification_count: calculateCount,
          },
        }
      );

      return ctx.send({
        status: true,
        message: "Notification read successfully",
      });
    } catch (error) {
      console.log(error);
      return ctx.badRequest(error);
    }
  },
};
