import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useSettings } from '../state/SettingsContext';
import { getReusableStyles, reusableStyles } from '../../../shared/theme/reusableStyles';

type SettingsScaffoldProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function SettingsScaffold({ title, subtitle, children }: SettingsScaffoldProps) {
  const { colors } = useSettings();
  const themeStyles = getReusableStyles(colors);

  return (
    <SafeAreaView style={themeStyles.screen}>
      <View style={[styles.topBar, { backgroundColor: colors.background }]}> 
        <View style={styles.brandWrap}>
          <Text style={[styles.logoGlyph, { color: colors.text }]}>◈</Text>
          <Text style={[styles.brandText, { color: colors.text }]}>VPULZ</Text>
        </View>
        <Pressable style={styles.finishButton}>
          <Text style={[styles.finishText, { color: colors.text }]}>FINISH</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, themeStyles.content]}>
        <View style={styles.header}>
          <Text style={[themeStyles.title, styles.title]}>{title}</Text>
          {subtitle ? <Text style={themeStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F1F',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoGlyph: {
    fontSize: 18,
    fontWeight: '700',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontStyle: 'italic',
  },
  finishButton: {
    minHeight: 28,
    justifyContent: 'center',
  },
  finishText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  content: {
    backgroundColor: 'transparent',
  },
  header: {
    gap: reusableStyles.spacing.xs,
    marginBottom: 8,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: -1.1,
  },
});
