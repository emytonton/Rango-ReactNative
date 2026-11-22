import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type KeyboardTypeOptions,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionSheet,
  EditableAvatar,
  ErrorState,
  PrimaryButton,
  Skeleton,
  TextField,
  TopBar,
  useToast,
  type IconName,
} from '../../components';
import type { PhotoPicker } from '../../core/image/photoPicker';
import type { ProfileRepository } from '../../data/profile/profileRepository';
import { fonts, useTheme } from '../../theme';
import { PhotoCropOverlay } from './components/PhotoCropOverlay';
import type { ProfileField } from './editProfileForm';
import { useEditProfileViewModel } from './useEditProfileViewModel';

type FieldSpec = {
  field: ProfileField;
  label: string;
  icon: IconName;
  keyboardType: KeyboardTypeOptions;
  autoComplete: TextInputProps['autoComplete'];
};

const fieldSpecs: FieldSpec[] = [
  {
    field: 'name',
    label: 'Nome completo',
    icon: 'person',
    keyboardType: 'default',
    autoComplete: 'name',
  },
  {
    field: 'email',
    label: 'E-mail',
    icon: 'mail',
    keyboardType: 'email-address',
    autoComplete: 'email',
  },
  {
    field: 'phone',
    label: 'Telefone',
    icon: 'call',
    keyboardType: 'phone-pad',
    autoComplete: 'tel',
  },
];

type EditProfileScreenProps = {
  profileRepository: ProfileRepository;
  photoPicker: PhotoPicker;
  onBack: () => void;
  onSessionExpired: () => void;
};

export function EditProfileScreen({
  profileRepository,
  photoPicker,
  onBack,
  onSessionExpired,
}: EditProfileScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const viewModel = useEditProfileViewModel(profileRepository, photoPicker, {
    onMessage: toast.show,
    onSaved: onBack,
    onSessionExpired,
  });
  const { state } = viewModel;
  const inputs = useRef<(TextInputInstance | null)[]>([]);
  const showSkeleton = state.loading && !state.loaded;

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <TopBar
          title="Editar perfil"
          onBack={onBack}
          trailing={
            <Pressable
              accessibilityRole="button"
              onPress={viewModel.save}
              disabled={!state.loaded}
              hitSlop={8}
            >
              <Text style={[styles.save, { color: colors.primary }]}>
                Salvar
              </Text>
            </Pressable>
          }
        />
        {state.errorMessage ? (
          <View style={styles.error}>
            <ErrorState
              message={state.errorMessage}
              actionText="Tentar novamente"
              onAction={viewModel.retry}
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <View style={styles.photo}>
              {showSkeleton ? (
                <Skeleton width={106} height={106} radius={34} />
              ) : (
                <EditableAvatar
                  initials={viewModel.initials}
                  imageUrl={state.avatarUrl}
                  loading={state.uploadingPhoto}
                  onPress={viewModel.openPhoto}
                  accessibilityLabel="Alterar foto"
                />
              )}
              <Pressable
                accessibilityRole="button"
                onPress={viewModel.openPhoto}
                hitSlop={6}
              >
                <Text style={[styles.changePhoto, { color: colors.primary }]}>
                  Alterar foto
                </Text>
              </Pressable>
            </View>
            {fieldSpecs.map((spec, index) => {
              if (showSkeleton) {
                return <Skeleton key={spec.field} height={78} radius={15} />;
              }
              const last = index === fieldSpecs.length - 1;
              return (
                <TextField
                  key={spec.field}
                  ref={input => {
                    inputs.current[index] = input;
                  }}
                  label={spec.label}
                  placeholder={spec.label}
                  icon={spec.icon}
                  value={state.form[spec.field]}
                  onChangeText={value =>
                    viewModel.changeField(spec.field, value)
                  }
                  error={viewModel.errors[spec.field]}
                  keyboardType={spec.keyboardType}
                  autoComplete={spec.autoComplete}
                  autoCapitalize={spec.field === 'name' ? 'words' : 'none'}
                  autoCorrect={false}
                  returnKeyType={last ? 'done' : 'next'}
                  submitBehavior={last ? 'blurAndSubmit' : 'submit'}
                  onSubmitEditing={() =>
                    last ? viewModel.save() : inputs.current[index + 1]?.focus()
                  }
                />
              );
            })}
          </ScrollView>
        )}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: 20 + insets.bottom,
            },
          ]}
        >
          <PrimaryButton
            text="Salvar alterações"
            loadingText="Salvando..."
            loading={state.saving}
            disabled={!state.loaded}
            onPress={viewModel.save}
          />
        </View>
      </KeyboardAvoidingView>
      <ActionSheet
        visible={state.photoSheetVisible}
        title="Foto do perfil"
        actions={[
          {
            icon: 'photoCamera',
            label: 'Tirar foto',
            onPress: viewModel.takePhoto,
          },
          {
            icon: 'photoLibrary',
            label: 'Escolher da galeria',
            onPress: viewModel.pickFromGallery,
          },
          {
            icon: 'delete',
            label: 'Remover foto',
            onPress: viewModel.removePhoto,
            danger: true,
          },
        ]}
        cancelText="Cancelar"
        onDismiss={viewModel.closePhoto}
      />
      {state.cropSource && (
        <PhotoCropOverlay
          photo={state.cropSource}
          onCancel={viewModel.cancelCrop}
          onConfirm={viewModel.confirmCrop}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  save: { fontFamily: fonts.extraBold, fontSize: 13.5 },
  error: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  content: {
    gap: 20,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  photo: { alignItems: 'center', gap: 11 },
  changePhoto: { fontFamily: fonts.bold, fontSize: 13 },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
  },
});
