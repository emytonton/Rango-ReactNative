import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useAppContainer } from '../di/AppContainer';
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
      <Stack.Screen name="Login" component={PendingScreen} />
      <Stack.Screen name="Signup" component={PendingScreen} />
      <Stack.Screen name="Home" component={PendingScreen} />
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
