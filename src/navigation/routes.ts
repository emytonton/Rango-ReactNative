export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

export const routeTitles: Record<keyof RootStackParamList, string> = {
  Welcome: 'Boas-vindas',
  Login: 'Login',
  Signup: 'Cadastro',
  Home: 'Home',
};
