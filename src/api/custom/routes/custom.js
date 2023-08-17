module.exports = {
  routes: [
    {
      path: "/getOtp",
      handler: "custom.getOtp",
      method: "POST",
    },
    {
      path: "/confirm-otp",
      handler: "custom.confirmOtp",
      method: "POST",
    },
    {
      method: "POST",
      handler: "custom.resetPassword",
      path: "/reset-password",
    },
    {
      method: "POST",
      handler: "custom.updateProfile",
      path: "/update-profile",
    },
    {
      method: "GET",
      handler: "custom.getUserGroupSurveys",
      path: "/get-user-survey",
    },

    {
      method: "GET",
      handler: "custom.getUserCompletedSurveys",
      path: "/completed-surveys",
    },

    {
      method: "POST",
      handler: "custom.updateToken",
      path: "/update-token",
    },

    {
      method: "POST",
      handler: "custom.deleteDeviceToken",
      path: "/delete-token",
    },

    // {
    //   method: "GET",
    //   handler: "custom.getUserFitbitData",
    //   path: "/get-fitbit-info",
    // },

    {
      method: "GET",
      handler: "custom.getNotificationCount",
      path: "/get-notification-count/:userId",
    },

    {
      method: "GET",
      handler: "custom.clearNotificationCount",
      path: "/clear-notification-count/:userId",
    },

    {
      method: "GET",
      handler: "custom.readNotificationCount",
      path: "/read-notification-count/:userId",
    },
  ],
};

// readNotificationCount
