import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Eyebrow, FocusablePressable, Title, useTextScale } from '../../shared/ui';
import { palette } from '../../theme';
import { useGuideStore } from '../local-state/store';
import { getChatStatus, prepareChat } from './api';
import { chatMessages } from './messages';
import { useChatStore } from './store';
import type { ChatStatus } from './types';

export function ChatScreen() {
  const locale = useGuideStore(state => state.locale);
  const m = chatMessages[locale]; const scale = useTextScale();
  const messages = useChatStore(state => state.messages); const draft = useChatStore(state => state.draft);
  const phase = useChatStore(state => state.phase); const chatError = useChatStore(state => state.error);
  const setDraft = useChatStore(state => state.setDraft); const submit = useChatStore(state => state.submit);
  const stop = useChatStore(state => state.stop); const reset = useChatStore(state => state.reset);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const input = useRef<TextInput>(null);
  useEffect(() => {
    const abort = new AbortController(); let timer: ReturnType<typeof setTimeout>;
    const check = async (first: boolean) => {
      try {
        const value = await (first ? prepareChat(abort.signal) : getChatStatus(abort.signal));
        if (abort.signal.aborted) return;
        setStatus(value);
        if (value.model !== 'ready') setLoadError(value.model === 'missing' ? 'MODEL_MISSING' : 'MODEL_UNAVAILABLE');
        else if (value.index === 'error') setLoadError('SOURCE_UNAVAILABLE');
        else if (value.index !== 'ready') timer = setTimeout(() => { void check(false); }, 1000);
      } catch (error) { if (!abort.signal.aborted) setLoadError(error instanceof Error ? error.message : 'READER_UNAVAILABLE'); }
    };
    void check(true);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [attempt]);
  const ready = status?.index === 'ready' && status.model === 'ready' && !loadError;
  const canSend = ready && phase === 'idle' && draft.trim().length > 0;
  const error = loadError || chatError;
  const errorText = error ? m.errors[error as keyof typeof m.errors] || m.errors.READER_UNAVAILABLE : null;
  const send = () => { if (canSend) void submit(locale); };
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
        onContentSizeChange={() => { if (messages.length) scroll.current?.scrollToEnd({ animated: true }); }}>
        <View style={styles.heading}>
          <Eyebrow>{m.badge}</Eyebrow>
          <Title size={30}>{m.title}</Title>
          <Body muted>{m.scope}</Body>
          <Body muted style={styles.note}>{m.note}</Body>
          <View style={styles.actions}>
            <View style={styles.status} accessibilityLiveRegion="polite">
              {!ready && !loadError ? <ActivityIndicator size="small" color={palette.red} /> : <Text style={styles.dot}>●</Text>}
              <Body muted>{ready ? m.ready : loadError ? m.badge : `${m.preparing} · ${status?.completedPages ?? 0} / ${status?.totalPages ?? '…'} ${m.pages}`}</Body>
            </View>
            <Button variant="ghost" onPress={reset}>{m.reset}</Button>
          </View>
        </View>
        {!messages.length ? <View style={styles.empty}>
          <Title size={23}>{m.empty}</Title><Body muted>{m.emptyBody}</Body>
        </View> : null}
        {messages.map(message => <View key={message.id} style={[styles.message, message.role === 'user' && styles.userMessage]}>
          <Eyebrow>{message.role === 'user' ? m.user : m.assistant}</Eyebrow>
          {message.status && message.status !== 'answered' ? <Body muted>{message.status === 'clarify' ? m.clarify : m.notFound}</Body> : null}
          <Body style={{ fontSize: 17 * scale, lineHeight: 27 * scale }}>{message.content}</Body>
          {message.sources?.length ? <View style={styles.sources}>
            <Body muted>{m.source}</Body>
            {message.sources.map(source => <FocusablePressable key={source.id} accessibilityRole="link"
              accessibilityLabel={`${m.volume} ${source.volume} · ${m.page} ${source.page} · ${source.title}`}
              onPress={() => router.push(source.href as never)}
              style={({ focused, pressed }) => [styles.source, focused && styles.focused, pressed && styles.pressed]}>
              <Text style={[styles.sourceLabel, { fontSize: 14 * scale }]}>{m.volume} {source.volume} · {m.page} {source.page} ↗</Text>
              <Body muted>{source.title}</Body>
            </FocusablePressable>)}
          </View> : null}
        </View>)}
        {phase === 'answering' ? <View style={styles.status} accessibilityRole="progressbar" accessibilityLabel={m.thinking}>
          <ActivityIndicator color={palette.red} /><Body muted>{m.thinking}</Body>
        </View> : null}
      </ScrollView>
      <View style={styles.composer}>
        {errorText ? <Body accessibilityRole="alert" style={styles.error}>{errorText}</Body> : null}
        {loadError ? <Button variant="secondary" onPress={() => { setLoadError(null); setStatus(null); setAttempt(value => value + 1); }}>{m.retry}</Button> : null}
        <View style={styles.inputRow}>
          <TextInput ref={input} accessibilityLabel={m.label} placeholder={m.placeholder} placeholderTextColor={palette.mutedLight}
            value={draft} onChangeText={setDraft} maxLength={2000} multiline editable={phase === 'idle'}
            style={[styles.input, { fontSize: 16 * scale, lineHeight: 24 * scale }]}
            onKeyPress={event => {
              if (Platform.OS !== 'web') return;
              const key = event.nativeEvent as typeof event.nativeEvent & { shiftKey?: boolean; isComposing?: boolean };
              if (key.key === 'Enter' && !key.shiftKey && !key.isComposing) { event.preventDefault(); send(); }
            }} />
          {phase === 'answering' ? <Button variant="secondary" onPress={stop}>{m.stop}</Button> :
            <Button disabled={!canSend} accessibilityState={{ disabled: !canSend }} style={!canSend ? styles.disabled : undefined} onPress={send}>{m.send}</Button>}
        </View>
        <Body muted style={styles.footnote}>{m.footnote}</Body>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ivory },
  content: { maxWidth: 960, width: '100%', alignSelf: 'center', padding: 22, gap: 18, paddingBottom: 28 },
  heading: { gap: 12 }, actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  status: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 10 }, dot: { color: palette.gold },
  empty: { paddingVertical: 28, gap: 10 }, message: { padding: 22, gap: 12, borderRadius: 20, borderWidth: 1, borderColor: palette.goldBorder, backgroundColor: palette.surface },
  userMessage: { marginLeft: 26, backgroundColor: palette.goldSoft }, sources: { gap: 8, marginTop: 5 },
  source: { borderWidth: 2, borderColor: palette.goldBorder, borderRadius: 12, minHeight: 48, padding: 10, gap: 4 },
  sourceLabel: { fontWeight: '800', color: palette.red }, focused: { borderColor: palette.red }, pressed: { opacity: 0.7 },
  composer: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: 18, gap: 10, backgroundColor: palette.surface, borderTopWidth: 1, borderColor: palette.goldBorder },
  inputRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  input: { flexGrow: 1, flexBasis: 300, minHeight: 70, maxHeight: 140, padding: 14, borderWidth: 1, borderColor: palette.goldBorder, borderRadius: 14, color: palette.ink, backgroundColor: palette.ivory, textAlignVertical: 'top' },
  disabled: { opacity: 0.45 }, error: { color: palette.danger }, note: { fontSize: 12 }, footnote: { fontSize: 11 },
});
