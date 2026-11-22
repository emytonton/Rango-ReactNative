export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Search: { homeSection?: string } | undefined;
  Orders: undefined;
  Favorites: undefined;
  Profile: undefined;
  Cart: undefined;
  Notifications: undefined;
  Address: undefined;
  Product: { productId: string };
  Checkout: undefined;
  Payment: undefined;
  Confirmed: { code: string };
  Tracking: { code: string };
  OrderDetail: { code: string };
  EditProfile: undefined;
  Settings: undefined;
  Theme: undefined;
  NotificationSettings: undefined;
};

export const routeTitles: Record<keyof RootStackParamList, string> = {
  Welcome: 'Boas-vindas',
  Login: 'Login',
  Signup: 'Cadastro',
  Home: 'Home',
  Search: 'Busca',
  Orders: 'Pedidos',
  Favorites: 'Favoritos',
  Profile: 'Perfil',
  Cart: 'Carrinho',
  Notifications: 'Notificações',
  Address: 'Endereço',
  Product: 'Produto',
  Checkout: 'Checkout',
  Payment: 'Forma de pagamento',
  Confirmed: 'Pedido confirmado',
  Tracking: 'Acompanhar pedido',
  OrderDetail: 'Detalhes do pedido',
  EditProfile: 'Editar perfil',
  Settings: 'Configurações',
  Theme: 'Tema',
  NotificationSettings: 'Notificações',
};
