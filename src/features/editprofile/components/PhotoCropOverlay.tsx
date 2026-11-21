import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon, Slider } from '../../../components';
import type { PickedPhoto } from '../../../core/image/photoPicker';
import {
  INITIAL_ZOOM_STEP,
  MAX_ZOOM_STEP,
  MIN_ZOOM_STEP,
  createSquareCrop,
  stepFor,
  zoomFor,
  type CropRect,
  type Point,
} from '../../../core/image/squareCrop';
import { fonts } from '../../../theme';

const VIEWPORT = 236;
const BACKGROUND = '#0B0B0D';
const ACCENT = '#FF8A34';
const MUTED = '#8A8A90';
const HINT = '#7A7A80';
const monospace = Platform.select({ ios: 'Menlo', default: 'monospace' });

type PhotoCropOverlayProps = {
  photo: PickedPhoto;
  onCancel: () => void;
  onConfirm: (rect: CropRect) => void;
};

function touchDistance(event: GestureResponderEvent): number | null {
  const [a, b] = event.nativeEvent.touches;
  if (!a || !b) {
    return null;
  }
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export function PhotoCropOverlay({
  photo,
  onCancel,
  onConfirm,
}: PhotoCropOverlayProps) {
  const insets = useSafeAreaInsets();
  const crop = useMemo(
    () => createSquareCrop(photo.width, photo.height, VIEWPORT),
    [photo],
  );
  const [zoom, setZoom] = useState(zoomFor(INITIAL_ZOOM_STEP));
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [area, setArea] = useState({ width: 0, height: 0 });
  const latest = useRef({ zoom, offset, crop });
  latest.current = { zoom, offset, crop };
  const gesture = useRef({
    offset: { x: 0, y: 0 },
    zoom: 1,
    distance: null as number | null,
  });

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => back.remove();
  }, [onCancel]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: event => {
        gesture.current = {
          offset: latest.current.offset,
          zoom: latest.current.zoom,
          distance: touchDistance(event),
        };
      },
      onPanResponderMove: (event, state) => {
        const start = gesture.current;
        const current = latest.current;
        const distance = touchDistance(event);
        let nextZoom = current.zoom;
        if (distance !== null) {
          if (start.distance === null) {
            gesture.current = { ...start, zoom: current.zoom, distance };
            return;
          }
          nextZoom = Math.min(
            Math.max((start.zoom * distance) / start.distance, 1),
            zoomFor(MAX_ZOOM_STEP),
          );
          setZoom(nextZoom);
        }
        setOffset(
          current.crop.clamp(
            { x: start.offset.x + state.dx, y: start.offset.y + state.dy },
            nextZoom,
          ),
        );
      },
    }),
  ).current;

  const changeStep = (step: number) => {
    const nextZoom = zoomFor(step);
    setZoom(nextZoom);
    setOffset(current => crop.clamp(current, nextZoom));
  };

  const scale = crop.scale(zoom);
  const drawn = { width: photo.width * scale, height: photo.height * scale };
  const clamped = crop.clamp(offset, zoom);
  const left = area.width / 2 + clamped.x - drawn.width / 2;
  const top = area.height / 2 + clamped.y - drawn.height / 2;
  const radius = VIEWPORT / 2;
  const cx = area.width / 2;
  const cy = area.height / 2;
  const mask =
    `M${left},${top}h${drawn.width}v${drawn.height}h${-drawn.width}z` +
    `M${cx - radius},${cy}a${radius},${radius} 0 1,0 ${VIEWPORT},0` +
    `a${radius},${radius} 0 1,0 ${-VIEWPORT},0z`;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <HeaderAction text="Cancelar" color="#FFFFFF" onPress={onCancel} />
        <Text style={styles.title}>Ajustar foto</Text>
        <HeaderAction
          text="Concluir"
          color={ACCENT}
          bold
          onPress={() => onConfirm(crop.sourceRect(clamped, zoom))}
        />
      </View>
      <View
        style={styles.area}
        onLayout={event => setArea(event.nativeEvent.layout)}
        {...responder.panHandlers}
      >
        {area.width > 0 && (
          <>
            <Image
              source={{ uri: photo.uri }}
              style={[
                styles.image,
                { left, top, width: drawn.width, height: drawn.height },
              ]}
            />
            <Svg
              pointerEvents="none"
              width={area.width}
              height={area.height}
              style={StyleSheet.absoluteFill}
            >
              <Path d={mask} fill="rgba(0, 0, 0, 0.62)" fillRule="evenodd" />
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth={2}
                fill="none"
              />
            </Svg>
          </>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.zoomRow}>
          <Icon name="zoomOut" size={18} color={MUTED} />
          <View style={styles.slider}>
            <Slider
              value={stepFor(zoom)}
              min={MIN_ZOOM_STEP}
              max={MAX_ZOOM_STEP}
              step={1}
              onChange={changeStep}
              trackColor="rgba(255, 255, 255, 0.22)"
              thumbBorderColor="#FFFFFF"
            />
          </View>
          <Icon name="zoomIn" size={18} color={MUTED} />
        </View>
        <Text style={styles.hint}>recorte 1:1 · 512×512 px</Text>
      </View>
    </View>
  );
}

function HeaderAction({
  text,
  color,
  bold = false,
  onPress,
}: {
  text: string;
  color: string;
  bold?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
      <Text style={[bold ? styles.actionBold : styles.action, { color }]}>
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  title: { fontFamily: fonts.extraBold, fontSize: 14, color: '#FFFFFF' },
  action: { fontFamily: fonts.bold, fontSize: 14 },
  actionBold: { fontFamily: fonts.extraBold, fontSize: 14 },
  area: { flex: 1, overflow: 'hidden' },
  image: { position: 'absolute' },
  footer: {
    gap: 10,
    paddingTop: 18,
    paddingHorizontal: 26,
    paddingBottom: 30,
  },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slider: { flex: 1 },
  hint: {
    textAlign: 'center',
    fontFamily: monospace,
    fontSize: 10,
    color: HINT,
  },
});
