import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { BottomTab } from '../components';
import { useAppContainer } from '../di/AppContainer';
import { AddressScreen } from '../features/address/AddressScreen';
import { CartScreen } from '../features/cart/CartScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { LoginScreen } from '../features/login/LoginScreen';
import { PaymentScreen } from '../features/payment/PaymentScreen';
import { ProductScreen } from '../features/product/ProductScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { SignupScreen } from '../features/signup/SignupScreen';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { PendingScreen } from './PendingScreen';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeRoute} />
      <Stack.Screen name="Login" component={LoginRoute} />
      <Stack.Screen name="Signup" component={SignupRoute} />
      <Stack.Screen name="Home" component={HomeRoute} />
      <Stack.Screen name="Search" component={SearchRoute} />
      <Stack.Screen name="Orders" component={PendingScreen} />
      <Stack.Screen name="Favorites" component={PendingScreen} />
      <Stack.Screen name="Profile" component={PendingScreen} />
      <Stack.Screen name="Cart" component={CartRoute} />
      <Stack.Screen name="Notifications" component={PendingScreen} />
      <Stack.Screen name="Address" component={AddressRoute} />
      <Stack.Screen name="Product" component={ProductRoute} />
      <Stack.Screen name="Checkout" component={CheckoutRoute} />
      <Stack.Screen name="Payment" component={PaymentRoute} />
    </Stack.Navigator>
  );
}

function WelcomeRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Welcome'>) {
  const { sessionRepository } = useAppContainer();
  return (
    <WelcomeScreen
      sessionRepository={sessionRepository}
      onLogin={() => navigation.navigate('Login')}
      onSignup={() => navigation.navigate('Signup')}
      onSessionRestored={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    />
  );
}

function LoginRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Login'>) {
  const { authRepository } = useAppContainer();
  return (
    <LoginScreen
      authRepository={authRepository}
      onBack={navigation.goBack}
      onSignup={() => navigation.replace('Signup')}
      onLoggedIn={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    />
  );
}

function SignupRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Signup'>) {
  const { authRepository } = useAppContainer();
  return (
    <SignupScreen
      authRepository={authRepository}
      onBack={navigation.goBack}
      onLogin={() => navigation.replace('Login')}
      onRegistered={() =>
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    />
  );
}

const tabRoutes: Record<
  Exclude<BottomTab, 'home'>,
  'Search' | 'Orders' | 'Favorites' | 'Profile'
> = {
  search: 'Search',
  orders: 'Orders',
  favorites: 'Favorites',
  profile: 'Profile',
};

function HomeRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { catalogRepository, cartRepository } = useAppContainer();
  return (
    <HomeScreen
      catalogRepository={catalogRepository}
      cartRepository={cartRepository}
      onOpenProduct={productId => navigation.navigate('Product', { productId })}
      onSeeAll={homeSection => navigation.navigate('Search', { homeSection })}
      onProfile={() => navigation.navigate('Profile')}
      onAddress={() => navigation.navigate('Address')}
      onNotifications={() => navigation.navigate('Notifications')}
      onCart={() => navigation.navigate('Cart')}
      onSearch={() => navigation.navigate('Search')}
      onTab={tab => navigateToTab(navigation, tab)}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

function SearchRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Search'>) {
  const { searchRepository, catalogRepository, cartRepository } =
    useAppContainer();
  return (
    <SearchScreen
      searchRepository={searchRepository}
      catalogRepository={catalogRepository}
      cartRepository={cartRepository}
      homeSection={route.params?.homeSection}
      onOpenProduct={productId => navigation.navigate('Product', { productId })}
      onTab={tab => navigateToTab(navigation, tab)}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

function ProductRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Product'>) {
  const { catalogRepository, cartRepository } = useAppContainer();
  return (
    <ProductScreen
      productId={route.params.productId}
      catalogRepository={catalogRepository}
      cartRepository={cartRepository}
      onBack={navigation.goBack}
      onAdded={navigation.goBack}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

function CartRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Cart'>) {
  const { cartRepository } = useAppContainer();
  return (
    <CartScreen
      cartRepository={cartRepository}
      onBack={navigation.goBack}
      onHome={() => navigateToTab(navigation, 'home')}
      onOpenProduct={productId => navigation.navigate('Product', { productId })}
      onCheckout={() => navigation.navigate('Checkout')}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

function AddressRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Address'>) {
  const { addressRepository } = useAppContainer();
  return (
    <AddressScreen
      addressRepository={addressRepository}
      onBack={navigation.goBack}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

function CheckoutRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Checkout'>) {
  return (
    <PendingScreen
      shortcutText="Forma de pagamento"
      onShortcut={() => navigation.navigate('Payment')}
    />
  );
}

function PaymentRoute({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Payment'>) {
  const { paymentRepository, paymentSelection } = useAppContainer();
  return (
    <PaymentScreen
      paymentRepository={paymentRepository}
      paymentSelection={paymentSelection}
      onBack={navigation.goBack}
      onDone={navigation.goBack}
      onSessionExpired={() => navigateToWelcome(navigation)}
    />
  );
}

type RootNavigation = Pick<
  NativeStackNavigationProp<RootStackParamList>,
  'navigate' | 'popTo' | 'reset'
>;

function navigateToTab(navigation: RootNavigation, tab: BottomTab) {
  navigation.popTo('Home');
  if (tab !== 'home') {
    navigation.navigate(tabRoutes[tab]);
  }
}

function navigateToWelcome(navigation: RootNavigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
}
