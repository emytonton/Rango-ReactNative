import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../../../components';

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={118} radius={20} shimmer />
      <Skeleton width={150} height={16} radius={6} />
      <View style={styles.tiles}>
        {[0, 1].map(index => (
          <View key={index} style={styles.tile}>
            <Skeleton height={112} radius={16} shimmer />
            <Skeleton width="80%" height={12} />
            <Skeleton width="55%" height={10} />
          </View>
        ))}
      </View>
      <Skeleton width={120} height={16} radius={6} />
      <ProductRowSkeleton />
      <ProductRowSkeleton />
    </View>
  );
}

export function ProductRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={84} height={84} radius={16} shimmer />
      <View style={styles.rowLines}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="90%" height={10} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingHorizontal: 20 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { width: 176, gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLines: { flex: 1, gap: 8 },
});
