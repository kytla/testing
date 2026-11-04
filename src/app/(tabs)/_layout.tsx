import { Redirect } from "expo-router";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../contexts/AuthContexts";

export default function TabsLayout() {
  const { status } = useAuth();
  if (status === "unauthenticated") return <Redirect href="/(auth)/welcome" />;
  return <AppShell />;
}

// import { AppShell } from '../../components/AppShell';

// export default function TabsLayout() {
//   return <AppShell />;
// }
