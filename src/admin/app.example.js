const config = {
  tutorials: true,
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "Active Point Admin",
      "Auth.form.welcome.subtitle": "Log in to your Active Point account",
      "Auth.form.welcome.title": "Welcome to Active Point!",
      "app.components.HomePage.welcome": "Welcome on board :dog2:",
      "app.components.HomePage.welcome.again": "Welcome :dog2:",
      "app.components.HomePage.welcomeBlock.content":
        "Congrats! You are logged as the first administrator. To discover the powerful features provided by Active Point, we recommend you to create your first Content type!",
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
};

const bootstrap = (app) => {
  console.log(app);
};

export default {
  config,
  bootstrap,
};
