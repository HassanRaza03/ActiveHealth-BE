import ActiveIcon from "./extensions/activeicon.png";

export default {
  config: {
    auth: {
      logo: ActiveIcon,
    },
    menu: {
      logo: ActiveIcon,
    },
    head: {
      favicon: ActiveIcon,
      title: "AP Wellness",
    },

    tutorials: true,
    translations: {
      en: {
        "app.components.LeftMenu.navbrand.title": "AP Wellness Admin",
        "Auth.form.welcome.subtitle": "Log in to your AP Wellness account",
        "Auth.form.welcome.title": "Welcome to AP Wellness!",
        "app.components.HomePage.welcome": "Welcome on board :dog2:",
        "app.components.HomePage.welcome.again": "Welcome :dog2:",
        "app.components.HomePage.welcomeBlock.content":
          "Congrats! You are logged as the first administrator. To discover the powerful features provided by AP Wellness, we recommend you to create your first Content type!",
      },
    },
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      // 'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
  },
  bootstrap(app) {
    console.log(app);
  },
};
