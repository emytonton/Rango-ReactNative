import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { PulseCircle } from './PulseCircle';

const DOT_SIZE = 26;

export type TimelineState = 'done' | 'current' | 'upcoming';

export type TimelineEntry = {
  label: string;
  time: string;
  icon: IconName;
  state: TimelineState;
};

type TimelineProps = {
  entries: TimelineEntry[];
};

export function Timeline({ entries }: TimelineProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {entries.map((entry, index) => (
        <TimelineRow
          key={entry.label}
          entry={entry}
          showLine={index < entries.length - 1}
        />
      ))}
    </View>
  );
}

function TimelineRow({
  entry,
  showLine,
}: {
  entry: TimelineEntry;
  showLine: boolean;
}) {
  const { colors } = useTheme();
  const labelColor =
    entry.state === 'current'
      ? colors.primary
      : entry.state === 'done'
      ? colors.text
      : colors.text2;
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <TimelineDot entry={entry} />
        {showLine && (
          <View
            style={[
              styles.line,
              {
                backgroundColor:
                  entry.state === 'done' ? colors.success : colors.border,
              },
            ]}
          />
        )}
      </View>
      <View style={styles.texts}>
        <Text
          style={[
            styles.label,
            entry.state === 'current' && styles.currentLabel,
            { color: labelColor },
          ]}
        >
          {entry.label}
        </Text>
        <Text style={[styles.time, { color: colors.text2 }]}>
          {entry.time}
        </Text>
      </View>
    </View>
  );
}

function TimelineDot({ entry }: { entry: TimelineEntry }) {
  const { colors } = useTheme();
  if (entry.state === 'upcoming') {
    return (
      <View
        style={[
          styles.upcoming,
          { backgroundColor: colors.surface2, borderColor: colors.border },
        ]}
      >
        <Icon name={entry.icon} size={15} color={colors.text2} />
      </View>
    );
  }
  const done = entry.state === 'done';
  return (
    <PulseCircle
      size={DOT_SIZE}
      color={done ? colors.success : colors.primary}
      pulsing={!done}
    >
      <Icon
        name={done ? 'check' : entry.icon}
        size={15}
        color={colors.onPrimary}
      />
    </PulseCircle>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 13 },
  rail: { width: DOT_SIZE, alignItems: 'center' },
  line: { width: 2, flex: 1, minHeight: 26 },
  texts: { flex: 1, gap: 2, paddingBottom: 16 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  currentLabel: { fontFamily: fonts.extraBold },
  time: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  upcoming: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
