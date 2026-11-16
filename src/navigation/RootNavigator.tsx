import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PendingScreen } from './PendingScreen';
import type { RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={PendingScreen} />
      <Stack.Screen name="Login" component={PendingScreen} />
      <Stack.Screen name="Signup" component={PendingScreen} />
      <Stack.Screen name="Home" component={PendingScreen} />
    </Stack.Navigator>
  );
}
