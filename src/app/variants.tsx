import { Redirect } from 'expo-router';

export default function VariantsRedirect() {
  return <Redirect href={'/(tabs)/guides' as never} />;
}
