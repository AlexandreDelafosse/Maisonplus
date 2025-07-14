// src/navigation/linkingConfig.ts
export default {
  prefixes: ['exp://wsl4vko-anonymous-8081.exp.direct', 'maisonplus://'], // + d'autres variantes si nécessaire
  config: {
    screens: {
      Invitation: {
        path: 'invitation',
        parse: {
          email: (email: string) => decodeURIComponent(email),
          id: (id: string) => id,
        },
      },
      Login: 'login',
      Register: 'register',
      Main: 'main',
    },
  },
};
