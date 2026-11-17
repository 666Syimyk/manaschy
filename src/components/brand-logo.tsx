import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type Props = { size?: number; style?: StyleProp<ViewStyle> };

export function BrandLogo({ size = 64, style }: Props) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        },
        style,
      ]}
    >
      <Image
        source={require('@/assets/branding/logo-mark.png')}
        contentFit="cover"
        transition={120}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
