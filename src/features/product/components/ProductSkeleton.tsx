import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../../../components';

export function ProductSkeleton() {
  return (
    <View>
      <Skeleton height={296} radius={0} shimmer />
      <View style={styles.body}>
        <Skeleton width="65%" height={22} radius={6} />
        <Skeleton width="40%" height={13} />
        <View style={styles.stats}>
          {[0, 1, 2].map(index => (
            <View key={index} style={styles.stat}>
              <Skeleton height={70} radius={15} shimmer />
            </View>
          ))}
        </View>
        <Skeleton width="30%" height={14} radius={6} />
        <Skeleton height={12} />
        <Skeleton width="85%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14, padding: 20 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1 },
});
