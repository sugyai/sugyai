import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { StudyHeader } from '../../src/components/StudyHeader';

const Tab = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Tab.Navigator);

export default function TabLayout() {
  return (
    <SafeAreaView style={styles.container}>
      <StudyHeader />
      <TopTabs
        screenOptions={{
          tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
          tabBarIndicatorStyle: { backgroundColor: '#d97706' }, // amber-600
          tabBarActiveTintColor: '#d97706',
          tabBarInactiveTintColor: '#71717a', // zinc-400
        }}
      >
        <TopTabs.Screen name="index" options={{ title: 'גמרא' }} />
        <TopTabs.Screen name="translation" options={{ title: 'Translation' }} />
        <TopTabs.Screen name="commentaries" options={{ title: 'Commentaries' }} />
      </TopTabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
