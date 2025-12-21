import {View, Text} from 'react-native';
import HomeScreen from "../screens/Home";
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function Home() {
    return (
        <SafeAreaProvider>
            <HomeScreen />
        </SafeAreaProvider>
    );
}
