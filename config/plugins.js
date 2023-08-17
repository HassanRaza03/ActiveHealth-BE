module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_SECRET,
        region: process.env.AWS_BUCKET_REGION,
        params: {
          Bucket: process.env.AWS_BUCKET,
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },

  email: {
    config: {
      provider: process.env.EMAIL_PROVIDER_NAME,
      providerOptions: {
        key: process.env.MAILGUN_API_KEY, // Required
        domain: process.env.MAILGUN_DOMAIN, // Requiredd,
        url: "https://api.eu.mailgun.net",
      },
      settings: {
        defaultFrom: "myemail@protonmail.com",
        defaultReplyTo: "myemail@protonmail.com",
      },
    },
  },
  "content-export-import": {
    enabled: true,
    resolve: "./src/plugins/content-export-import", // path to plugin folder
  },
});
